import type { Level, ReasonCode } from '@codequest/content-schema';
import type { DistributiveOmit, GameEvent } from './events';

/** What a game kind's API receives while a program runs (runtime-engine.md §5). */
export interface SimContext<S, E extends GameEvent> {
  /** Mutable state of this run. */
  state: S;
  /** Appends an event to the log and counts it towards `maxActions`. */
  emit(event: DistributiveOmit<E, 'blockId'>, blockId: string | null): void;
  /**
   * Every sensor API reports its answer through this (P2-11): the engine logs a `sense` event for
   * the sensor block `blockId` (counted towards `maxActions`) and returns `value` unchanged, so a
   * sensor ends with `return ctx.sense(answer, blockId)`.
   */
  sense(value: boolean, blockId: string | null): boolean;
  /** Ends the run immediately by throwing `StopSignal`. */
  stop(result: 'success'): never;
  stop(result: 'crash' | 'incomplete', reasonCode: ReasonCode): never;
  /** Seeded random numbers in [0, 1) (mulberry32). The only randomness allowed. */
  rng: () => number;
  readonly level: Level;
}
