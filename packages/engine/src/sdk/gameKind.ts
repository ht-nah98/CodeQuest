import type { GameKindId, ReasonCode, RunResult } from '@codequest/content-schema';
import type { z } from 'zod';
import type { BlockSpec } from './blockSpec';
import type { SimContext } from './context';
import type { GameEvent } from './events';

/** Values that may cross the sandbox boundary. */
export type Primitive = string | number | boolean;

/** Functions installed in the sandbox; names must match the generators' calls. */
export type GameKindApi = Readonly<Record<string, (...args: Primitive[]) => Primitive | undefined>>;

/** Headless half of a game kind (game-kind-sdk.md §1). */
export interface GameKindDefinition<C, S, E extends GameEvent> {
  /** Matches `level.kind`. */
  id: GameKindId;
  /** Bump when a rule change can invalidate existing solutions. */
  version: number;
  configSchema: z.ZodType<C>;
  blocks: readonly BlockSpec[];
  /** Kind-specific reason codes; the Vietnamese sentences live in content/shared/feedback.json. */
  reasonCodes: readonly string[];
  /** Initial state from config; may use `rng` (random puzzles). */
  createState(config: C, rng: () => number): S;
  createApi(ctx: SimContext<S, E>): GameKindApi;
  /** Called when the program ends without `ctx.stop`. */
  evaluate(state: S, config: C): { success: true } | { success: false; reasonCode: ReasonCode };
  /** Mode predict: a comparable key such as `stop@5` (format in product/game-kinds.md). */
  predictAnswer(state: S, outcome: { result: RunResult; reasonCode: ReasonCode | null }): string;
}

/**
 * Any game kind with its type parameters erased, for registries. Sound because `runLevel`
 * only feeds a kind values produced by that same kind (config via its own `configSchema`).
 */
// Method syntax above keeps parameters bivariant, which is what makes this assignment legal.
export type AnyGameKindDefinition = GameKindDefinition<unknown, unknown, GameEvent>;
