import type { RunnerCell, RunnerConfig } from './config';

/** Mutable state of one runner run. */
export interface RunnerState {
  readonly cells: readonly RunnerCell[];
  /** Cell Măng stands on (after a fall: the hole she fell into). */
  pos: number;
  /** Cell where the run crashed, for `predictAnswer`; null while nothing crashed. */
  crashAt: number | null;
}

export function createRunnerState(config: RunnerConfig): RunnerState {
  return { cells: config.cells, pos: config.start, crashAt: null };
}
