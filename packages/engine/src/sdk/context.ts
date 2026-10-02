import type { Level, ReasonCode } from '@codequest/content-schema';
import type { DistributiveOmit, GameEvent } from './events';

/** What a game kind's API receives while a program runs (runtime-engine.md §5). */
export interface SimContext<S, E extends GameEvent> {
  /** Mutable state of this run. */
  state: S;
  /** Appends an event to the log and counts it towards `maxActions`. */
  emit(event: DistributiveOmit<E, 'blockId'>, blockId: string | null): void;
  /** Ends the run immediately by throwing `StopSignal`. */
  stop(result: 'success'): never;
  stop(result: 'crash' | 'incomplete', reasonCode: ReasonCode): never;
  /** Seeded random numbers in [0, 1) (mulberry32). The only randomness allowed. */
  rng: () => number;
  readonly level: Level;
}
