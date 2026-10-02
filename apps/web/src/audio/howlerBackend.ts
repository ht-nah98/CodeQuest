import { Howl, Howler } from 'howler';
import type { AudioBackend, SoundLike, SoundOptions } from './AudioManager';

// Howler 2.2 behind the AudioManager's small backend interface. Web Audio (not HTML5 <audio>),
// files served by the app itself (security-privacy.md: media-src 'self', connect-src 'self').

function createSound({ src, loop = false, onDone }: SoundOptions): SoundLike {
  const done = (id: number) => onDone?.(id);
  const failed = () => onDone?.(null);
  const howl = new Howl({
    src: [src],
    format: ['mp3'],
    loop,
    preload: true,
    onend: done,
    onstop: done,
    onloaderror: failed,
    onplayerror: done,
  });
  return {
    play: () => howl.play(),
    stop: (id) => {
      howl.stop(id);
    },
    volume: (volume, id) => {
      if (id === undefined) howl.volume(volume);
      else howl.volume(volume, id);
    },
    rate: (rate, id) => {
      howl.rate(rate, id);
    },
    fade: (from, to, durationMs, id) => {
      howl.fade(from, to, durationMs, id);
    },
    unload: () => {
      howl.unload();
    },
  };
}

export function createHowlerBackend(): AudioBackend {
  return {
    createSound,
    setMuted: (muted) => {
      Howler.mute(muted);
    },
  };
}
