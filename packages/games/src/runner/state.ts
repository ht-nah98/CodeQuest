import type { GoalItemKind } from '../goalItems';
import type { RunnerCell, RunnerConfig } from './config';

/** A mission item still on the track (P2-11c). */
export interface RunnerItem {
  readonly kind: GoalItemKind;
  readonly at: number;
}

/** Mutable state of one runner run. */
export interface RunnerState {
  /** The track; a copy of `config.cells`, because a kicked crate turns into `ground`. */
  readonly cells: RunnerCell[];
  /** Cell Măng stands on (after a fall: the hole she fell into; after a bump: where she stood). */
  pos: number;
  /** Cells whose bamboo shoot is still there, in ascending order. */
  bamboo: number[];
  /** `config.goal.collectAll`: the flag only wins once `bamboo` is empty. */
  readonly collectAll: boolean;
  /** `config.goal.items` not picked up yet, in config order: the flag only wins once empty. */
  items: RunnerItem[];
  /** Cell where the run crashed, for `predictAnswer`; null while nothing crashed. */
  crashAt: number | null;
}

export function createRunnerState(config: RunnerConfig): RunnerState {
  return {
    cells: [...config.cells],
    pos: config.start,
    bamboo: [...(config.bamboo ?? [])].sort((a, b) => a - b),
    collectAll: config.goal?.collectAll ?? false,
    items: (config.goal?.items ?? []).map(({ kind, at }) => ({ kind, at })),
    crashAt: null,
  };
}
