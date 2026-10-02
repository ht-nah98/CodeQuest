import { fitsBubble } from './bubbleCopy';
import { SpeakButton } from './SpeakButton';

/** Which side the tail points to, i.e. where Măng stands relative to the bubble. */
export type BubbleTail = 'left' | 'bottom' | 'none';

export interface BubbleProps {
  /** At most 12 words (ui-copy-guide.md §2). Over-long copy is outlined red in dev builds. */
  text: string;
  tail?: BubbleTail;
  /**
   * Voice line id (`audio/voiceIds.ts`, content-model.md §2). The 🔊 button shows only when the
   * line has a voice file; it plays / stops the line. Omit for lines with numbers.
   */
  voiceId?: string;
  /** Custom read-aloud handler; overrides `voiceId`. */
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

/** Măng's speech bubble: white, ink border, pointed tail and a read-aloud button. */
export function Bubble({
  text,
  tail = 'left',
  voiceId,
  onSpeak,
  speaking,
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
      <SpeakButton
        {...(voiceId !== undefined && { voiceId })}
        {...(onSpeak !== undefined && { onSpeak })}
        {...(speaking !== undefined && { speaking })}
      />
    </div>
  );
}
