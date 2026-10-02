import type { ReasonCode, RunResult } from '@codequest/content-schema';
import type { GameEvent, HighlightEvent } from './events';

export interface RunStats {
  /** Interpreter steps executed. */
  steps: number;
  /** Game events emitted, highlights excluded. */
  actions: number;
  /** Blocks in the program, without `cq_start` and shadow blocks. */
  blocksUsed: number;
}

/** Everything one run produced; pure data, safe to serialize (runtime-engine.md §7). */
export interface RunOutcome<E extends GameEvent = GameEvent> {
  result: RunResult;
  /** `null` exactly when `result` is `success`. */
  reasonCode: ReasonCode | null;
  events: ReadonlyArray<E | HighlightEvent>;
  stats: RunStats;
  /** Mode `predict` only: `kind.predictAnswer` of the final state. */
  answerKey?: string;
  /** Mode `bughunt` only: `editDistance(level.initialWorkspace, workspace)`. */
  edits?: number;
  /** Only when `result` is `error`, to help debugging. */
  debug?: { message: string };
}
