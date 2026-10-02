import { describe, expect, it, vi } from 'vitest';
import {
  AudioManager,
  MUSIC_FADE_MS,
  VOICE_CACHE_SIZE,
  type AudioBackend,
  type SoundLike,
  type SoundOptions,
} from './AudioManager';
import { SFX, SFX_NAMES } from './sfxCatalog';
import { createVoiceLookup } from './voiceManifest';
import { CHANNEL_MIX, DUCK_FACTOR } from './volume';

interface FakeSound extends SoundLike {
  options: SoundOptions;
  plays: number;
  unloaded: boolean;
  volumes: [number, number | undefined][];
  fades: [number, number, number, number | undefined][];
  rates: [number, number | undefined][];
  stops: (number | undefined)[];
}

/** Howler emits its events later (setTimeout 0): `flush()` delivers them. */
function fakeBackend() {
  const sounds: FakeSound[] = [];
  const muted: boolean[] = [];
  const pending: (() => void)[] = [];
  let nextId = 0;
  const backend: AudioBackend = {
    createSound: (options) => {
      const sound: FakeSound = {
        options,
        plays: 0,
        unloaded: false,
        volumes: [],
        fades: [],
        rates: [],
        stops: [],
        play: () => {
          sound.plays++;
          return ++nextId;
        },
        stop: (id) => {
          sound.stops.push(id);
          if (id !== undefined) pending.push(() => options.onDone?.(id));
        },
        volume: (v, id) => sound.volumes.push([v, id]),
        rate: (r, id) => sound.rates.push([r, id]),
        fade: (from, to, ms, id) => sound.fades.push([from, to, ms, id]),
        unload: () => {
          sound.unloaded = true;
        },
      };
      sounds.push(sound);
      return sound;
    },
    setMuted: (m) => muted.push(m),
  };
  const bySrc = (part: string) => sounds.filter((s) => s.options.src.includes(part));
  const flush = () => {
    for (const event of pending.splice(0)) event();
  };
  return { backend, sounds, muted, bySrc, flush };
}

const VOICED = [
  'ui.play.ready',
  'feedback.FELL_IN_HOLE',
  ...Array.from({ length: 12 }, (_, i) => `w01-l01.hint.h${String(i)}`),
];
const voices = createVoiceLookup({
  version: 1,
  provider: 'test',
  lines: Object.fromEntries(VOICED.map((id) => [id, { hash: 'h' }])),
});

function setup() {
  const fake = fakeBackend();
  let time = 0;
  const timers: (() => void)[] = [];
  const create = vi.fn(() => fake.backend);
  const manager = new AudioManager(
    create,
    voices,
    () => time,
    (callback) => timers.push(callback),
  );
  return {
    ...fake,
    create,
    manager,
    tick: (ms: number) => {
      time += ms;
    },
    runTimers: () => {
      for (const timer of timers.splice(0)) timer();
    },
  };
}

describe('AudioManager before the first gesture', () => {
  it('creates nothing and plays nothing', () => {
    const { manager, create } = setup();
    expect(manager.playSfx('click')).toBe(false);
    manager.playMusic('village');
    expect(create).not.toHaveBeenCalled();
    expect(manager.unlocked).toBe(false);
  });

  it('starts the remembered music on unlock and preloads every effect once', () => {
    const { manager, create, bySrc, sounds } = setup();
    manager.playMusic('village');
    manager.unlock();
    manager.unlock();
    expect(create).toHaveBeenCalledTimes(1);
    expect(sounds.filter((s) => s.options.src.includes('/audio/sfx/'))).toHaveLength(
      SFX_NAMES.length,
    );
    const [music] = bySrc('/audio/music/village.mp3');
    expect(music?.options.loop).toBe(true);
    expect(music?.plays).toBe(1);
  });
});

describe('AudioManager effects', () => {
  it('plays at the sfx volume times the catalog level, with an optional rate', () => {
    const { manager, bySrc } = setup();
    manager.unlock();
    manager.setVolumes({ sfx: 0.5 });
    expect(manager.playSfx('star', { rate: 1.2 })).toBe(true);
    const [star] = bySrc('/sfx/star.mp3');
    const [volume, id] = star?.volumes[0] ?? [];
    expect(volume).toBeCloseTo(0.25 * CHANNEL_MIX.sfx * SFX.star);
    expect(star?.rates).toEqual([[1.2, id]]);
  });

  it('skips silent effects, null and too-quick repeats', () => {
    const { manager, tick } = setup();
    manager.unlock();
    expect(manager.playSfx(null)).toBe(false);
    expect(manager.playSfx('step')).toBe(true);
    tick(10);
    expect(manager.playSfx('step')).toBe(false);
    tick(50);
    expect(manager.playSfx('step')).toBe(true);
    manager.setVolumes({ sfx: 0 });
    tick(100);
    expect(manager.playSfx('step')).toBe(false);
  });
});

describe('AudioManager music', () => {
  it('switches tracks with a fade-out, then stops the old one', () => {
    const { manager, bySrc, runTimers } = setup();
    manager.unlock();
    manager.playMusic('village');
    manager.playMusic('village');
    manager.playMusic('adventure');
    const [village] = bySrc('village');
    const villageId = 1; // the first play of this backend
    expect(village?.plays).toBe(1);
    const [from, to, ms, fadedId] = village?.fades.at(-1) ?? [];
    expect(from).toBeCloseTo(CHANNEL_MIX.music * 0.64);
    expect([to, ms, fadedId]).toEqual([0, MUSIC_FADE_MS, villageId]);
    expect(village?.stops).toEqual([]);
    runTimers();
    expect(village?.stops).toEqual([villageId]);
    expect(bySrc('adventure')[0]?.plays).toBe(1);
  });

  it('keeps one sound per track when switching back and forth', () => {
    const { manager, bySrc } = setup();
    manager.unlock();
    for (const track of ['village', 'adventure', 'village', 'adventure'] as const) {
      manager.playMusic(track);
    }
    expect(bySrc('village')).toHaveLength(1);
    expect(bySrc('adventure')).toHaveLength(1);
    expect(bySrc('village')[0]?.plays).toBe(2);
  });

  it('applies a new music volume live', () => {
    const { manager, bySrc } = setup();
    manager.unlock();
    manager.playMusic('village');
    manager.setVolumes({ music: 0 });
    expect(bySrc('village')[0]?.volumes.at(-1)?.[0]).toBe(0);
  });

  it('stopAll silences music and voice', () => {
    const { manager } = setup();
    manager.playMusic('village');
    manager.playVoice('ui.play.ready');
    manager.stopAll();
    expect(manager.speaking).toBeNull();
    expect(manager.currentTrack).toBeNull();
  });
});

describe('AudioManager voice', () => {
  it('returns false for a line without a voice file', () => {
    const { manager } = setup();
    expect(manager.hasVoice('w01-l01.objective')).toBe(false);
    expect(manager.playVoice('w01-l01.objective')).toBe(false);
    expect(manager.speaking).toBeNull();
  });

  it('plays a line (unlocking audio), reports speaking and ducks the music', () => {
    const { manager, bySrc } = setup();
    const listener = vi.fn();
    manager.subscribe(listener);
    manager.playMusic('village');
    expect(manager.playVoice('ui.play.ready')).toBe(true);
    expect(manager.unlocked).toBe(true);
    expect(manager.speaking).toBe('ui.play.ready');
    expect(listener).toHaveBeenCalled();
    const [voice] = bySrc('/audio/voice/ui.play.ready.mp3');
    expect(voice?.volumes[0]?.[0]).toBeCloseTo(CHANNEL_MIX.voice * 0.64);
    const music = bySrc('village')[0];
    expect(music?.fades.at(-1)?.[1]).toBeCloseTo(CHANNEL_MIX.music * 0.64 * DUCK_FACTOR);

    // The line ends by itself: speaking clears and the music comes back up.
    voice?.options.onDone?.(voice.volumes[0]?.[1] ?? -1);
    expect(manager.speaking).toBeNull();
    expect(music?.fades.at(-1)?.[1]).toBeCloseTo(CHANNEL_MIX.music * 0.64);
  });

  it('keeps the music ducked from one line to the next', () => {
    const { manager, bySrc, flush } = setup();
    manager.playMusic('village');
    manager.playVoice('ui.play.ready');
    const fades = bySrc('village')[0]?.fades.length;
    manager.playVoice('feedback.FELL_IN_HOLE');
    flush();
    expect(bySrc('village')[0]?.fades.length).toBe(fades);
    expect(manager.speaking).toBe('feedback.FELL_IN_HOLE');
  });

  it('a late "stopped" event of an old playback does not end the new one', () => {
    const { manager, flush } = setup();
    manager.playVoice('ui.play.ready');
    manager.stopVoice();
    manager.playVoice('ui.play.ready');
    flush(); // the first playback's onstop arrives now
    expect(manager.speaking).toBe('ui.play.ready');
  });

  it('stopVoice(token) only stops that playback', () => {
    const { manager } = setup();
    manager.playVoice('ui.play.ready');
    const first = manager.voiceToken;
    manager.playVoice('feedback.FELL_IN_HOLE');
    manager.stopVoice(first);
    expect(manager.speaking).toBe('feedback.FELL_IN_HOLE');
    manager.stopVoice(manager.voiceToken);
    expect(manager.speaking).toBeNull();
  });

  it('a load error ends speaking, unloads the sound and retries with a new one', () => {
    const { manager, bySrc } = setup();
    manager.playVoice('ui.play.ready');
    const [broken] = bySrc('ui.play.ready');
    broken?.options.onDone?.(null);
    expect(manager.speaking).toBeNull();
    expect(broken?.unloaded).toBe(true);
    manager.playVoice('ui.play.ready');
    expect(bySrc('ui.play.ready')).toHaveLength(2);
    expect(manager.speaking).toBe('ui.play.ready');
  });

  it(`keeps at most ${String(VOICE_CACHE_SIZE)} lines loaded, unloading the oldest`, () => {
    const { manager, bySrc } = setup();
    const ids = VOICED.slice(2); // 12 lines
    for (const id of ids) manager.playVoice(id);
    const voiceSounds = bySrc('/audio/voice/');
    expect(voiceSounds.filter((s) => s.unloaded)).toHaveLength(ids.length - VOICE_CACHE_SIZE);
    expect(bySrc(`${ids[0] ?? ''}.mp3`)[0]?.unloaded).toBe(true);
    expect(bySrc(`${ids.at(-1) ?? ''}.mp3`)[0]?.unloaded).toBe(false);
    // Replaying a recent line reuses its sound.
    manager.playVoice(ids.at(-2) ?? '');
    expect(bySrc(`${ids.at(-2) ?? ''}.mp3`)).toHaveLength(1);
  });
});

describe('AudioManager mute', () => {
  it('mutes everything while muted or while the tab is hidden', () => {
    const { manager, muted } = setup();
    manager.unlock();
    manager.setHidden(true);
    manager.setHidden(false);
    manager.setMuted(true);
    manager.setHidden(true);
    manager.setHidden(false);
    expect(muted).toEqual([false, true, false, true, true, true]);
  });
});
