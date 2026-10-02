import type { GameKindId } from '@codequest/content-schema';
import { vi } from '../../i18n/vi';
import { AnswerPicture } from '../../stages/AnswerPicture';
import { FOCUS_RING } from '../../ui/focusRing';

const t = vi.play.predict;

export type PickMark = 'right' | 'wrong';

export interface PredictCardsProps {
  kind: GameKindId;
  config: unknown;
  options: ReadonlyArray<{ key: string; label: string }>;
  /** Cards already picked in this session, and how they turned out. */
  marks: Readonly<Record<string, PickMark>>;
  /** No pick while a replay runs or once the right card is found. */
  disabled: boolean;
  onPick: (key: string) => void;
}

const MARK_CLASS: Record<PickMark | 'none', string> = {
  none: 'border-ink bg-paper',
  right: 'border-go-deep bg-go/25',
  wrong: 'border-oops bg-oops-soft',
};

/**
 * Mode predict (screens-and-flows.md §3): the 3–4 answer cards that replace the run controls.
 * Each card shows its answer as a picture of the board (stages/AnswerPicture) with a short label;
 * a wrong card stays marked ✗ and cannot be picked again.
 */
export function PredictCards({
  kind,
  config,
  options,
  marks,
  disabled,
  onPick,
}: PredictCardsProps) {
  // One row, so the cards read left to right like the choices of a quiz and the program above
  // keeps most of the panel.
  const columns = options.length === 3 ? 'grid-cols-3' : 'grid-cols-4';
  return (
    <div
      role="group"
      aria-label={t.cardsLabel}
      data-testid="predict-cards"
      className={`grid ${columns} gap-2 px-3 py-2.5`}
    >
      {options.map((option) => {
        const mark = marks[option.key];
        const markText = mark === 'right' ? t.rightMark : mark === 'wrong' ? t.wrongMark : null;
        // aria-disabled, not disabled: a card keeps keyboard focus while the replay runs.
        const locked = disabled || mark !== undefined;
        return (
          <button
            key={option.key}
            type="button"
            data-testid="predict-card"
            data-key={option.key}
            data-mark={mark ?? 'none'}
            aria-disabled={locked}
            aria-label={markText ? `${option.label}: ${markText}` : option.label}
            onClick={() => {
              if (!locked) onPick(option.key);
            }}
            className={`relative grid min-h-11 grid-rows-[minmax(0,1fr)_auto] gap-1 overflow-hidden rounded-key border-3 p-1.5 text-left shadow-key transition-transform duration-150 ${locked ? 'cursor-default' : 'cursor-pointer hover:-translate-y-px'} ${MARK_CLASS[mark ?? 'none']} ${disabled && mark === undefined ? 'opacity-70' : ''} ${FOCUS_RING}`}
          >
            <span className="block h-[88px] overflow-hidden [@media(max-height:660px)]:h-[60px] rounded-[6px] border-2 border-ink/60 bg-sky">
              <AnswerPicture kind={kind} config={config} answerKey={option.key} />
            </span>
            <span className="block text-center font-display text-body leading-tight font-extrabold">
              {option.label}
            </span>
            {mark !== undefined && (
              <span
                aria-hidden="true"
                className={`absolute top-1 right-1 grid size-8 place-items-center rounded-full border-3 border-ink font-display text-button font-extrabold text-paper ${mark === 'right' ? 'bg-go-deep' : 'bg-oops'}`}
              >
                {mark === 'right' ? '✓' : '✗'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
