import { type KeyboardEvent as ReactKeyboardEvent, useRef } from 'react';
import { vi } from '../../i18n/vi';

const t = vi.play.maps;

/** How a map did in the last run: won, lost, or not played (the run stopped before it). */
export type MapMark = 'won' | 'lost';

/**
 * "Bản đồ 1 · 2 · 3" over the stage of a multi-map level (P2-12): one tab per map, the one on
 * the stage selected, with ✔ / ✖ after a run. A tab shows its map; tabs are locked while Măng
 * runs. Arrow keys move between tabs (tabs pattern, only the selected tab is tabbable).
 */
export function MapTabs({
  count,
  selected,
  marks,
  disabled,
  status,
  onSelect,
}: {
  count: number;
  selected: number;
  marks: ReadonlyArray<MapMark | undefined>;
  disabled: boolean;
  /** Short line next to the tabs: what to do, or how the last run went. */
  status: string;
  onSelect: (map: number) => void;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (event: ReactKeyboardEvent, index: number) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (step === undefined || disabled) return;
    event.preventDefault();
    const target = (index + step + count) % count;
    onSelect(target);
    refs.current[target]?.focus();
  };
  return (
    <div className="flex flex-wrap items-center gap-2 border-b-3 border-ink bg-paper-2 px-3 py-1.5">
      <div role="tablist" aria-label={t.label} className="flex flex-wrap gap-1">
        {Array.from({ length: count }, (_, index) => {
          const mark = marks[index];
          const isSelected = index === selected;
          return (
            <button
              key={index}
              ref={(element) => {
                refs.current[index] = element;
              }}
              type="button"
              role="tab"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              disabled={disabled}
              data-testid={`map-tab-${String(index + 1)}`}
              data-result={mark ?? ''}
              onKeyDown={(event) => {
                onKey(event, index);
              }}
              onClick={() => {
                onSelect(index);
              }}
              className={`flex min-h-10 cursor-pointer items-center gap-1.5 rounded-key border-2 border-ink px-2.5 font-display whitespace-nowrap text-small font-bold shadow-key transition-transform duration-150 hover:-translate-y-px disabled:cursor-default disabled:hover:translate-y-0 aria-selected:translate-y-0.5 aria-selected:shadow-button-pressed aria-selected:ring-3 aria-selected:ring-brand-deep focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-deep ${
                mark === 'lost'
                  ? 'bg-oops-soft'
                  : mark === 'won'
                    ? 'bg-go/40'
                    : isSelected
                      ? 'bg-coin'
                      : 'bg-paper'
              }`}
            >
              {t.tab(index + 1)}
              {mark !== undefined && (
                <>
                  <span aria-hidden className="font-pixel text-pixel">
                    {mark === 'won' ? '✔' : '✖'}
                  </span>
                  <span className="sr-only">({mark === 'won' ? t.won : t.lost})</span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <p
        className="m-0 ml-auto text-small font-bold text-ink-soft"
        aria-live="polite"
        data-testid="map-status"
      >
        {status}
      </p>
    </div>
  );
}
