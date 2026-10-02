// State and geometry of the runner's full-track strip (stage-rendering.md §2 "Dải cả đường"),
// Pixi- and React-free so it is unit tested. The strip follows the replay through the controller's
// own hooks (onEvent / onReset): no second clock.
import type { GameKindId } from '@codequest/content-schema';
import type { GameEvent } from '@codequest/engine';
import {
  type RunnerCell,
  type RunnerConfig,
  runnerConfigSchema,
  type RunnerEvent,
} from '@codequest/games';
import { cameraX, cellCenterX, computeRunnerLayout } from './layout';

/** Widest a strip cell gets (CSS px): a short track stays a compact strip, not a second stage. */
export const STRIP_MAX_CELL_PX = 24;

/** What the strip shows: the track as it is now and the cell Măng stands on. */
export interface TrackStripState {
  /** The track; a kicked-over crate is `ground` from then on. */
  cells: readonly RunnerCell[];
  /** Shoots not picked up yet. */
  bamboo: readonly number[];
  /** Măng's cell (a hole she fell into, the flag she reached). */
  at: number;
}

export function initialStrip(config: RunnerConfig): TrackStripState {
  return { cells: config.cells, bamboo: config.bamboo ?? [], at: config.start };
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
      return { ...state, bamboo: state.bamboo.filter((at) => at !== event.at) };
    default:
      // offTrack: Măng leaves from her cell; the marker stays there.
      return state;
  }
}

/**
 * Which cells the big stage shows (fractional, clamped to 0…cellCount) while Măng stands on `at`,
 * for a stage `stageWidth` px wide; `null` when the whole track fits the stage, so no strip is
 * needed. Same layout and camera as the stage (layout.ts); only the width matters to both.
 */
export function stripView(
  cellCount: number,
  stageWidth: number,
  at: number,
): { from: number; to: number } | null {
  if (stageWidth <= 0) return null;
  const layout = computeRunnerLayout(cellCount, stageWidth, 1);
  if (!layout.scrolls) return null;
  const left = cameraX(layout, cellCenterX(layout, at)) - layout.originX;
  const clamp = (cell: number) => Math.min(cellCount, Math.max(0, cell));
  return {
    from: clamp(left / layout.cellPx),
    to: clamp((left + layout.width) / layout.cellPx),
  };
}

/** A tiny store the play screen feeds from the stage hooks and the strip reads. */
export interface TrackFeed {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => TrackStripState;
  /** An action event's animation starts (StageController `onEvent`). */
  event: (event: GameEvent) => void;
  /** The stage went back to the start (StageController `onReset`). */
  reset: () => void;
}

export function createTrackFeed(config: RunnerConfig): TrackFeed {
  const start = initialStrip(config);
  let state = start;
  const listeners = new Set<() => void>();
  const set = (next: TrackStripState) => {
    if (next === state) return;
    state = next;
    for (const listener of listeners) listener();
  };
  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state,
    event: (event) => {
      set(stripStep(state, event));
    },
    reset: () => {
      set(start);
    },
  };
}

/** The strip's feed for a level, or `null` when the level has no strip (not a runner level). */
export function trackFeedFor(kind: GameKindId, config: unknown): TrackFeed | null {
  if (kind !== 'runner') return null;
  const parsed = runnerConfigSchema.safeParse(config);
  return parsed.success ? createTrackFeed(parsed.data) : null;
}
