import { useVoiceLine } from '../audio/useAudio';
import { vi } from '../i18n/vi';
import { FOCUS_RING } from './focusRing';
import { PixelIcon } from './PixelIcon';

export interface SpeakButtonProps {
  /** Voice line id (`audio/voiceIds.ts`). Nothing renders when the line has no voice file. */
  voiceId?: string;
  /** Custom read-aloud handler; overrides `voiceId` (always renders). */
  onSpeak?: () => void;
  /** Pressed look while reading; defaults to whether `voiceId` is playing. */
  speaking?: boolean;
  className?: string;
}

const SPEAK_CLASS = [
  'grid size-11 shrink-0 cursor-pointer place-items-center rounded-key border-2 border-ink bg-brand-soft',
  'transition-[transform,box-shadow,background-color] duration-150 ease-bounce',
  'shadow-key hover:-translate-y-px hover:bg-brand-soft/70',
  'active:translate-y-0.5 active:shadow-button-pressed',
  'aria-pressed:translate-y-0.5 aria-pressed:bg-coin aria-pressed:shadow-button-pressed',
  FOCUS_RING,
].join(' ');

/** The 🔊 "Đọc to" key of a line Măng says (in a Bubble, or next to a dialog's text). */
export function SpeakButton({ voiceId, onSpeak, speaking, className = '' }: SpeakButtonProps) {
  const voice = useVoiceLine(onSpeak === undefined ? voiceId : undefined);
  const speak = onSpeak ?? (voice.available ? voice.toggle : undefined);
  if (speak === undefined) return null;
  return (
    <button
      type="button"
      className={`${SPEAK_CLASS} ${className}`}
      aria-label={vi.ui.speak}
      aria-pressed={speaking ?? voice.speaking}
      data-voice-id={onSpeak === undefined ? voiceId : undefined}
      onClick={speak}
    >
      <PixelIcon name="speaker" scale={2} />
    </button>
  );
}
