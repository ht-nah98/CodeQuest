import { musicUrl, SFX, SFX_NAMES, sfxUrl, type MusicTrack, type SfxName } from './sfxCatalog';
import { voiceLookup, type VoiceLookup } from './voiceManifest';
import {
  channelGain,
  DEFAULT_VOLUMES,
  type Channel,
  type ChannelVolumes,
  type MixState,
} from './volume';

// One app-wide owner of every sound (docs/architecture/audio.md). Nothing is created before the
// first user gesture (browser autoplay policy): until `unlock()`, effects are dropped and the
// wanted music track is only remembered. Howler is behind `AudioBackend` so tests can fake it.

/** The part of a Howl this module uses. */
export interface SoundLike {
  /** Starts a new playback and returns its id. */
  play(): number;
  stop(id?: number): void;
  volume(volume: number, id?: number): void;
  rate(rate: number, id?: number): void;
  fade(from: number, to: number, durationMs: number, id?: number): void;
  /** Frees the decoded audio; the sound is not used again. */
  unload(): void;
}

export interface SoundOptions {
  src: string;
  loop?: boolean;
  /**
   * Fires (possibly later, Howler emits asynchronously) when a playback ends or is stopped,
   * or cannot be played (its id), or when the file cannot be loaded (null).
   */
  onDone?: (id: number | null) => void;
}

export interface AudioBackend {
  createSound(options: SoundOptions): SoundLike;
  /** Global mute (all channels). */
  setMuted(muted: boolean): void;
}

export interface PlaySfxOptions {
  /** Playback rate, e.g. 1.12 for a slightly higher star "ding". */
  rate?: number;
}

export type Schedule = (callback: () => void, delayMs: number) => void;

/** Minimum gap between two plays of the same effect, so fast replays do not pile up. */
const SFX_MIN_GAP_MS = 35;
/** Music fade in / out on track change and stop. */
export const MUSIC_FADE_MS = 400;
const DUCK_FADE_MS = 150;
/** Voice lines kept decoded; the least recently played one is unloaded beyond this. */
export const VOICE_CACHE_SIZE = 10;

interface Voice {
  lineId: string;
  sound: SoundLike;
  id: number;
  /** Increases with every playVoice: lets a caller stop only its own playback. */
  token: number;
}

export class AudioManager {
  private backend: AudioBackend | null = null;
  private readonly sfx = new Map<SfxName, SoundLike>();
  private readonly lastSfxAt = new Map<SfxName, number>();
  private volumes: ChannelVolumes = { ...DEFAULT_VOLUMES };
  private userMuted = false;
  private hidden = false;

  private wantedTrack: MusicTrack | null = null;
  private readonly musicSounds = new Map<MusicTrack, SoundLike>();
  private music: { track: MusicTrack; sound: SoundLike; id: number } | null = null;

  private voice: Voice | null = null;
  private voiceTokens = 0;
  /** Insertion order = least recently played first. */
  private readonly voiceSounds = new Map<string, SoundLike>();
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly createBackend: () => AudioBackend,
    private readonly voices: VoiceLookup = voiceLookup,
    private readonly now: () => number = () => performance.now(),
    private readonly schedule: Schedule = (callback, delayMs) => {
      window.setTimeout(callback, delayMs);
    },
  ) {}

  /** True once audio may play (after the first user gesture). */
  get unlocked(): boolean {
    return this.backend !== null;
  }

  /** Call from a user gesture (pointerdown / keydown). Idempotent. */
  unlock(): void {
    if (this.backend) return;
    this.backend = this.createBackend();
    this.backend.setMuted(this.isSilent());
    for (const name of SFX_NAMES) {
      this.sfx.set(name, this.backend.createSound({ src: sfxUrl(name) }));
    }
    if (this.wantedTrack !== null) this.startMusic(this.wantedTrack);
  }

  // ---- settings ----

  setVolumes(volumes: Partial<ChannelVolumes>): void {
    this.volumes = { ...this.volumes, ...volumes };
    this.applyLevels();
  }

  getVolumes(): ChannelVolumes {
    return { ...this.volumes };
  }

  setMuted(muted: boolean): void {
    this.userMuted = muted;
    this.backend?.setMuted(this.isSilent());
  }

  /** The tab went to the background (or came back): silence everything meanwhile. */
  setHidden(hidden: boolean): void {
    this.hidden = hidden;
    this.backend?.setMuted(this.isSilent());
  }

  /** Stops the music and the voice (e.g. the app crashed to the error screen). */
  stopAll(): void {
    this.stopVoice();
    this.playMusic(null);
  }

  // ---- effects ----

  /** Plays an effect; returns false when it was not played (locked, silent or too soon). */
  playSfx(name: SfxName | null, options: PlaySfxOptions = {}): boolean {
    if (name === null) return false;
    const sound = this.sfx.get(name);
    const gain = this.gain('sfx', SFX[name]);
    if (!sound || gain <= 0) return false;
    const at = this.now();
    const last = this.lastSfxAt.get(name);
    if (last !== undefined && at - last < SFX_MIN_GAP_MS) return false;
    this.lastSfxAt.set(name, at);
    const id = sound.play();
    sound.volume(gain, id);
    if (options.rate !== undefined) sound.rate(options.rate, id);
    return true;
  }

  // ---- music ----

  /** Switches the background loop (null = no music). Remembered until audio is unlocked. */
  playMusic(track: MusicTrack | null): void {
    this.wantedTrack = track;
    if (!this.backend || this.music?.track === track) return;
    this.stopMusic();
    if (track !== null) this.startMusic(track);
  }

  get currentTrack(): MusicTrack | null {
    return this.wantedTrack;
  }

  private startMusic(track: MusicTrack): void {
    if (!this.backend) return;
    // One Howl per track, reused: switching back and forth does not pile up decoded audio.
    let sound = this.musicSounds.get(track);
    if (!sound) {
      sound = this.backend.createSound({ src: musicUrl(track), loop: true });
      this.musicSounds.set(track, sound);
    }
    const id = sound.play();
    sound.fade(0, this.gain('music'), MUSIC_FADE_MS, id);
    this.music = { track, sound, id };
  }

  private stopMusic(): void {
    if (!this.music) return;
    const { sound, id } = this.music;
    this.music = null;
    sound.fade(this.gain('music'), 0, MUSIC_FADE_MS, id);
    this.schedule(() => {
      sound.stop(id);
    }, MUSIC_FADE_MS);
  }

  // ---- voice ----

  hasVoice(lineId: string): boolean {
    return this.voices.has(lineId);
  }

  /**
   * Reads line `lineId` aloud (stopping any other line) and ducks the music. Returns false when
   * the line has no voice file. Called from a click, so it may unlock audio itself.
   */
  playVoice(lineId: string): boolean {
    const url = this.voices.url(lineId);
    if (url === null) return false;
    this.unlock();
    const backend = this.backend;
    if (!backend) return false;
    const wasSpeaking = this.voice !== null;
    // Line after line: the music stays ducked in between.
    const previous = this.voice;
    this.voice = null;
    previous?.sound.stop(previous.id);

    let sound = this.voiceSounds.get(lineId);
    if (sound) {
      this.voiceSounds.delete(lineId);
    } else {
      const created: SoundLike = backend.createSound({
        src: url,
        onDone: (id) => {
          if (id === null) this.dropVoiceSound(lineId, created);
          const current = this.voice;
          if (current?.sound === created && (id === null || current.id === id)) {
            this.endVoice();
          }
        },
      });
      sound = created;
    }
    this.voiceSounds.set(lineId, sound);
    this.evictVoices();

    const id = sound.play();
    sound.volume(this.gain('voice'), id);
    this.voice = { lineId, sound, id, token: ++this.voiceTokens };
    if (!wasSpeaking) this.duck(true);
    this.emit();
    return true;
  }

  /** Stops the voice; with `token`, only if that playback is still the current one. */
  stopVoice(token?: number): void {
    const voice = this.voice;
    if (!voice || (token !== undefined && voice.token !== token)) return;
    this.endVoice();
    voice.sound.stop(voice.id);
  }

  /** The line being read aloud, or null. */
  get speaking(): string | null {
    return this.voice?.lineId ?? null;
  }

  /** Token of the current voice playback (0 when silent), for `stopVoice(token)`. */
  get voiceToken(): number {
    return this.voice?.token ?? 0;
  }

  /** For useSyncExternalStore: fires when `speaking` changes. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSpeaking = (): string | null => this.speaking;

  private endVoice(): void {
    this.voice = null;
    this.duck(false);
    this.emit();
  }

  /** A file that failed to load is unloaded and forgotten, so the next play tries again. */
  private dropVoiceSound(lineId: string, sound: SoundLike): void {
    if (this.voiceSounds.get(lineId) === sound) this.voiceSounds.delete(lineId);
    sound.unload();
  }

  private evictVoices(): void {
    for (const [lineId, sound] of this.voiceSounds) {
      if (this.voiceSounds.size <= VOICE_CACHE_SIZE) return;
      this.voiceSounds.delete(lineId);
      sound.unload();
    }
  }

  // ---- mixing ----

  private isSilent(): boolean {
    return this.userMuted || this.hidden;
  }

  private mix(): MixState {
    // Mute goes through the backend's global mute, so it is not part of the per-sound gain.
    return { volumes: this.volumes, muted: false, ducked: this.voice !== null };
  }

  private gain(channel: Channel, itemGain = 1): number {
    return channelGain(channel, this.mix(), itemGain);
  }

  private duck(on: boolean): void {
    if (!this.music) return;
    const ducked = { ...this.mix(), ducked: on };
    const from = channelGain('music', { ...ducked, ducked: !on });
    this.music.sound.fade(from, channelGain('music', ducked), DUCK_FADE_MS, this.music.id);
  }

  private applyLevels(): void {
    if (this.music) this.music.sound.volume(this.gain('music'), this.music.id);
    if (this.voice) this.voice.sound.volume(this.gain('voice'), this.voice.id);
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}
