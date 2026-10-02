import { useEffect, useRef } from 'react';
import { audio } from '../../audio/audio';
import type { MusicTrack } from '../../audio/sfxCatalog';
import type { Channel } from '../../audio/volume';

/** A line read aloud to try the voice volume (any line that has a voice file). */
const VOICE_SAMPLES = ['ui.play.ready', 'ui.lesson.quizRight', 'ui.results.stars3'];
const MUSIC_PREVIEW_MS = 2500;
const PREVIEW_GAP_MS = 250;

/**
 * Settings sliders: apply a volume at once (before the profile write lands) and let the child
 * hear it: a coin for effects, a voice line for the voice, a few seconds of music.
 */
export function useVolumePreview(): (channel: Channel, slider: number) => void {
  const lastAt = useRef(0);
  const musicTimer = useRef<number | undefined>(undefined);
  const trackBefore = useRef<MusicTrack | null | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(musicTimer.current);
      if (trackBefore.current !== undefined) audio.playMusic(trackBefore.current);
    },
    [],
  );

  return (channel, slider) => {
    audio.setVolumes({ [channel]: slider });
    const now = Date.now();
    if (now - lastAt.current < PREVIEW_GAP_MS && channel !== 'music') return;
    lastAt.current = now;
    if (channel === 'sfx') {
      audio.playSfx('coin');
    } else if (channel === 'voice') {
      const sample = VOICE_SAMPLES.find((id) => audio.hasVoice(id));
      if (sample !== undefined && audio.speaking === null) audio.playVoice(sample);
    } else {
      trackBefore.current ??= audio.currentTrack;
      audio.playMusic(audio.currentTrack ?? 'village');
      window.clearTimeout(musicTimer.current);
      musicTimer.current = window.setTimeout(() => {
        audio.playMusic(trackBefore.current ?? null);
        trackBefore.current = undefined;
      }, MUSIC_PREVIEW_MS);
    }
  };
}
