import { vi } from '../i18n/vi';
import { fitsBubble } from './bubbleCopy';
import { FOCUS_RING } from './focusRing';
import { PixelIcon } from './PixelIcon';

/** Which side the tail points to, i.e. where Măng stands relative to the bubble. */
export type BubbleTail = 'left' | 'bottom' | 'none';

export interface BubbleProps {
  /** At most 12 words (ui-copy-guide.md §2). Over-long copy is outlined red in dev builds. */
  text: string;
  tail?: BubbleTail;
  /** Plays the pre-recorded voice line. Omit for lines that have no audio (e.g. ones with numbers). */
  onSpeak?: () => void;
  /** True while the voice line is playing; keeps the 🔊 button looking pressed. */
  speaking?: boolean;
  /** Announce text changes to screen readers (feedback bubbles during play). */
  live?: boolean;
  className?: string;
}

// The tail is a rotated square with two ink sides, sitting half outside the bubble.
const TAIL_CLASS: Record<Exclude<BubbleTail, 'none'>, string> = {
  left: '-left-[11px] bottom-4 border-b-3 border-l-3',
  bottom: 'left-[22px] -bottom-[11px] border-r-3 border-b-3',
};

const SPEAK_CLASS = [
  'grid size-11 shrink-0 cursor-pointer place-items-center rounded-key border-2 border-ink bg-brand-soft',
  'transition-[transform,box-shadow,background-color] duration-150 ease-bounce',
  'shadow-key hover:-translate-y-px hover:bg-brand-soft/70',
  'active:translate-y-0.5 active:shadow-button-pressed',
  'aria-pressed:translate-y-0.5 aria-pressed:bg-coin aria-pressed:shadow-button-pressed',
  FOCUS_RING,
].join(' ');

/** Măng's speech bubble: white, ink border, pointed tail and a read-aloud button. */
export function Bubble({
  text,
  tail = 'left',
  onSpeak,
  speaking = false,
  live = false,
  className = '',
}: BubbleProps) {
  const tooLong = import.meta.env.DEV && !fitsBubble(text);
  return (
    <div
      data-too-long={tooLong || undefined}
      className={[
        'relative inline-flex min-w-0 items-center gap-3 rounded-bubble border-3 border-ink bg-white',
        'py-2 pr-2 pl-4 text-bubble font-bold text-ink shadow-bubble',
        tooLong ? 'outline-3 outline-offset-2 outline-oops outline-dashed' : '',
        className,
      ].join(' ')}
    >
      {tail !== 'none' && (
        <span
          aria-hidden="true"
          className={`absolute size-4 rotate-45 border-ink bg-white ${TAIL_CLASS[tail]}`}
        />
      )}
      <p className="m-0 min-w-0 py-1" aria-live={live ? 'polite' : undefined}>
        {text}
      </p>
      {onSpeak !== undefined && (
        <button
          type="button"
          className={SPEAK_CLASS}
          aria-label={vi.ui.speak}
          aria-pressed={speaking}
          onClick={onSpeak}
        >
          <PixelIcon name="speaker" scale={2} />
        </button>
      )}
    </div>
  );
}
