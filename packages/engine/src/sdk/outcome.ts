import type { ReasonCode, RunResult } from '@codequest/content-schema';
import type { GameEvent, HighlightEvent, SenseEvent, VarEvent } from './events';

export interface RunStats {
  /** Interpreter steps executed. */
  steps: number;
  /** Game events, `sense` and `var` events emitted, highlights excluded. */
  actions: number;
  /** Blocks in the program, without `cq_start` and shadow blocks. */
  blocksUsed: number;
}

/** Everything one run produced; pure data, safe to serialize (runtime-engine.md §7). */
export interface RunOutcome<E extends GameEvent = GameEvent> {
  result: RunResult;
  /** `null` exactly when `result` is `success`. */
  reasonCode: ReasonCode | null;
  events: ReadonlyArray<E | HighlightEvent | SenseEvent | VarEvent>;
  stats: RunStats;
  /**
   * Mode `predict` only: `kind.predictAnswer` of the final state, plus `#<id>=<n>` for every box
   * of a level with `variables` (ADR-0022), read with `splitVarSuffix`.
   */
  answerKey?: string;
  /** Mode `bughunt` only: `editDistance(level.initialWorkspace, workspace)`. */
  edits?: number;
  /** Only when `result` is `error`, to help debugging. */
  debug?: { message: string };
  /**
   * Levels with `starGoals` only (P2-21), when the program ran: whether each goal holds, in
   * `starGoals` order. At the top level a goal holds only when it holds on every map (each map's
   * own verdict is in `maps[i].goals`). Judged on the final state whatever the result; rewards
   * only count it on a win.
   */
  goals?: boolean[];
  /**
   * Levels with `variants` only (P2-12, ADR-0016): the run on each map, in map order (`config`,
   * then each variant). The top-level `result`, `reasonCode`, `events` and `stats` are those of
   * `maps[mapIndex]`. Absent when the program could not run at all (empty, too many blocks).
   * Ends early at a map where the engine itself broke (`error`, debug `variants[i]: …`).
   */
  maps?: Array<MapOutcome<E>>;
  /**
   * With `maps`: the map the result comes from, the first map not won (the level is lost there),
   * or the last map when every map is won.
   */
  mapIndex?: number;
  /**
   * Levels with `variables` only (ADR-0022), when the program ran: each box's final number on
   * this map (top level: the map of the result). The web's box panel rebuilds the numbers from
   * the `var` events instead.
   */
  vars?: Record<string, number>;
}

/** One map's run of a multi-map level: what `StageController.play` replays on that map. */
export type MapOutcome<E extends GameEvent = GameEvent> = Pick<
  RunOutcome<E>,
  'result' | 'reasonCode' | 'events' | 'stats' | 'debug' | 'goals' | 'vars'
>;
