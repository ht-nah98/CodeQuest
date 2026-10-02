import { vi } from '../i18n/vi';

export interface CapacityBricksProps {
  /** Block budget of the level (`maxBlocks`). */
  max: number;
  /** Blocks currently on the workspace; clamped to 0…max. */
  used: number;
  className?: string;
}

/**
 * "còn N khối" bar: one pixel brick per block still available, dashed outlines for spent ones.
 * When the last brick goes, the bar shakes once (art-direction.md §4).
 */
export function CapacityBricks({ max, used, className = '' }: CapacityBricksProps) {
  const total = Math.max(0, Math.floor(max));
  const spent = Math.min(total, Math.max(0, Math.floor(used)));
  const remaining = total - spent;
  const empty = remaining === 0;

  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={remaining}
      aria-valuetext={vi.ui.blocksLeft(remaining)}
      aria-label={vi.ui.blocksLeftLabel}
      data-empty={empty || undefined}
      className={`flex flex-wrap items-center gap-2.5 ${className}`}
    >
      {/* Remount on empty so the shake replays each time the budget runs out. */}
      <div
        key={empty ? 'empty' : 'ok'}
        className={`flex flex-wrap gap-1 ${empty ? 'animate-shake' : ''}`}
      >
        {Array.from({ length: total }, (_, i) => {
          const available = i < remaining;
          return (
            <span
              key={i}
              data-brick={available ? 'free' : 'used'}
              className={
                available
                  ? 'h-4 w-[22px] rounded-brick border-2 border-ink bg-block-loop shadow-brick'
                  : 'h-4 w-[22px] rounded-brick border-2 border-dashed border-ink bg-paper-2'
              }
            />
          );
        })}
      </div>
      <span aria-hidden="true" className="font-pixel text-hud text-ink">
        {vi.ui.blocksLeft(remaining)}
      </span>
    </div>
  );
}
