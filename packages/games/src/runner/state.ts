import type { RunnerCell, RunnerConfig } from './config';

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
  /** Cell where the run crashed, for `predictAnswer`; null while nothing crashed. */
  crashAt: number | null;
}

export function createRunnerState(config: RunnerConfig): RunnerState {
  return {
    cells: [...config.cells],
    pos: config.start,
    bamboo: [...(config.bamboo ?? [])].sort((a, b) => a - b),
    collectAll: config.goal?.collectAll ?? false,
    crashAt: null,
  };
}
