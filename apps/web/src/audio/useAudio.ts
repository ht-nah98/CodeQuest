import { useEffect, useRef, useSyncExternalStore } from 'react';
import { audio } from './audio';
import type { PlaySfxOptions } from './AudioManager';
import type { MusicTrack, SfxName } from './sfxCatalog';

// React access to the app's AudioManager. Works with or without <AudioProvider> (which only
// syncs the profile's volumes and unlocks audio on the first gesture), so any screen or test
// can call it.

const playSfx = (name: SfxName | null, options?: PlaySfxOptions): boolean =>
  audio.playSfx(name, options);
const playVoice = (lineId: string): boolean => audio.playVoice(lineId);
const stopVoice = (): void => {
  audio.stopVoice();
};
const hasVoice = (lineId: string): boolean => audio.hasVoice(lineId);
const playMusic = (track: MusicTrack | null): void => {
  audio.playMusic(track);
};

export interface AudioApi {
  /** Plays a sound effect (sfx channel). */
  playSfx: typeof playSfx;
  /** Reads a voice line aloud; false when the line has no voice file. */
  playVoice: typeof playVoice;
  stopVoice: typeof stopVoice;
  hasVoice: typeof hasVoice;
  /** Switches the background loop (null = silence). */
  playMusic: typeof playMusic;
  /** Id of the voice line being read aloud, or null. */
  speaking: string | null;
}

export function useAudio(): AudioApi {
  const speaking = useSyncExternalStore(audio.subscribe, audio.getSpeaking, () => null);
  return { playSfx, playVoice, stopVoice, hasVoice, playMusic, speaking };
}

/** Plays `track` while the calling screen is shown. */
export function useMusic(track: MusicTrack | null): void {
  useEffect(() => {
    audio.playMusic(track);
  }, [track]);
}

/**
 * The 🔊 of one line: whether it has a voice, whether it is playing, and a toggle. The line
 * stops when the component unmounts or shows another line.
 */
export function useVoiceLine(lineId: string | undefined): {
  available: boolean;
  speaking: boolean;
  toggle: () => void;
} {
  const current = useSyncExternalStore(audio.subscribe, audio.getSpeaking, () => null);
  // The playback this component started: unmounting stops only that one, never a line another
  // bubble started meanwhile.
  const owned = useRef(0);
  const available = lineId !== undefined && audio.hasVoice(lineId);
  useEffect(
    () => () => {
      if (owned.current !== 0) audio.stopVoice(owned.current);
      owned.current = 0;
    },
    [lineId],
  );
  const speaking = available && current === lineId;
  return {
    available,
    speaking,
    toggle: () => {
      if (lineId === undefined) return;
      if (speaking) {
        audio.stopVoice();
        owned.current = 0;
      } else if (audio.playVoice(lineId)) {
        owned.current = audio.voiceToken;
      }
    },
  };
}
