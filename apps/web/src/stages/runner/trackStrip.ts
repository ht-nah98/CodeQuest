// State and geometry of the runner's full-track strip (stage-rendering.md §2 "Dải cả đường"),
// Pixi- and React-free so it is unit tested. The strip follows the replay through the controller's
// own hooks (onEvent / onReset): no second clock.
import type { GameEvent } from '@codequest/engine';
import {
  type GoalItemKind,
  type RunnerCell,
  type RunnerConfig,
  type RunnerEvent,
} from '@codequest/games';
import { createEventFeed, type EventFeed } from '../feed';
import { cameraX, cellCenterX, computeRunnerLayout, peekCameraX } from './layout';

/** Widest a strip cell gets (CSS px): a short track stays a compact strip, not a second stage. */
export const STRIP_MAX_CELL_PX = 24;

/** What the strip shows: the track as it is now and the cell Măng stands on. */
export interface TrackStripState {
  /** The track; a kicked-over crate is `ground` from then on. */
  cells: readonly RunnerCell[];
  /** Shoots not picked up yet. */
  bamboo: readonly number[];
  /** Mission items not picked up yet (P2-11c), in config order. */
  items: ReadonlyArray<{ kind: GoalItemKind; at: number }>;
  /** How many mission items the map has (a cage shows open once `items` is empty). */
  itemTotal: number;
  /** Măng's cell (a hole she fell into, the flag she reached). */
  at: number;
  /**
   * Set while the child has dragged the strip with Măng idle (P2-22): the cell at the left edge
   * of the stage's view, which then no longer follows Măng. Cleared by the next reset / run.
   */
  look?: number;
}

export function initialStrip(config: RunnerConfig): TrackStripState {
  return {
    cells: config.cells,
    bamboo: config.bamboo ?? [],
    items: config.goal?.items ?? [],
    itemTotal: config.goal?.items?.length ?? 0,
    at: config.start,
  };
}

/**
 * The strip after one action event. A move counts at its start (the event fires as the animation
 * begins), so the marker is already on the cell Măng is heading to.
 */
export function stripStep(state: TrackStripState, gameEvent: GameEvent): TrackStripState {
  // The controller feeds a runner level only runner events (see the typing note in registry.ts).
  const event = gameEvent as RunnerEvent;
  switch (event.type) {
    case 'walk':
    case 'crouch':
    case 'jump':
      return { ...state, at: event.to };
    case 'fall':
    case 'win':
    case 'missed':
      return { ...state, at: event.at };
    case 'bump':
      return { ...state, at: event.from };
    case 'kick':
      return event.hit
        ? { ...state, cells: state.cells.map((cell, i) => (i === event.at ? 'ground' : cell)) }
        : state;
    case 'collect':
      return event.item === undefined
        ? { ...state, bamboo: state.bamboo.filter((at) => at !== event.at) }
        : { ...state, items: state.items.filter((item) => item.at !== event.at) };
    default:
      // offTrack: Măng leaves from her cell; the marker stays there.
      return state;
  }
}

/**
 * Which cells the big stage shows (fractional, clamped to 0…cellCount) while Măng stands on `at`,
 * for a stage `stageWidth` px wide; `null` when the whole track fits the stage, so no strip is
 * needed. Same layout and camera as the stage (layout.ts); only the width matters to both.
 * With `look` (the child dragged the strip) the view starts there instead of following Măng.
 */
export function stripView(
  cellCount: number,
  stageWidth: number,
  at: number,
  look?: number,
): { from: number; to: number } | null {
  if (stageWidth <= 0) return null;
  const layout = computeRunnerLayout(cellCount, stageWidth, 1);
  if (!layout.scrolls) return null;
  const camera =
    look === undefined ? cameraX(layout, cellCenterX(layout, at)) : peekCameraX(layout, look);
  const left = camera - layout.originX;
  const clamp = (cell: number) => Math.min(cellCount, Math.max(0, cell));
  return {
    from: clamp(left / layout.cellPx),
    to: clamp((left + layout.width) / layout.cellPx),
  };
}

/**
 * The `look` (left edge of the view, in cells) that centres the stage's view on `cell` while
 * the child drags the strip, clamped like the stage camera so strip and stage agree. May be
 * a little below 0 or past the last cell: the stage keeps a margin cell at each end.
 */
export function stripLook(cellCount: number, stageWidth: number, cell: number): number {
  const layout = computeRunnerLayout(cellCount, Math.max(1, stageWidth), 1);
  if (!layout.scrolls) return 0;
  const viewCells = layout.width / layout.cellPx;
  const camera = peekCameraX(layout, cell - viewCells / 2);
  return (camera - layout.originX) / layout.cellPx;
}

/** The strip's store (feed.ts), plus the view the child dragged to while Măng is idle. */
export interface TrackFeed extends EventFeed<TrackStripState> {
  /** Moves the strip's view to start at cell `look` (P2-22); `null` follows Măng again. */
  peek: (look: number | null) => void;
}

export function createTrackFeed(config: RunnerConfig): TrackFeed {
  const feed = createEventFeed(initialStrip(config), stripStep);
  return {
    ...feed,
    peek: (look) => {
      const state = feed.getSnapshot();
      if (look === null) {
        if (state.look === undefined) return;
        const { cells, bamboo, items, itemTotal, at } = state;
        feed.set({ cells, bamboo, items, itemTotal, at });
      } else if (state.look !== look) {
        feed.set({ ...state, look });
      }
    },
  };
}
