import { z } from 'zod';

/** Game kinds known to the curriculum (docs/product/game-kinds.md). */
export const GAME_KIND_IDS = [
  'runner',
  'maze',
  'robotlab',
  'turtle',
  'farm',
  'sorter',
  'music',
] as const;
export const GameKindIdSchema = z.enum(GAME_KIND_IDS);
export type GameKindId = z.infer<typeof GameKindIdSchema>;

/** How the child interacts with a level (glossary: `LevelMode`). */
export const LEVEL_MODES = ['build', 'parsons', 'predict', 'bughunt', 'creative'] as const;
export const LevelModeSchema = z.enum(LEVEL_MODES);
export type LevelMode = z.infer<typeof LevelModeSchema>;

/** Outcome category of one run (runtime-engine.md §7). */
export const RUN_RESULTS = ['success', 'incomplete', 'crash', 'timeout', 'error'] as const;
export const RunResultSchema = z.enum(RUN_RESULTS);
export type RunResult = z.infer<typeof RunResultSchema>;

/**
 * Why a run did not succeed, e.g. `FELL_IN_HOLE`. Open-ended on purpose: the engine does
 * not know every game kind's codes (runtime-engine.md §7).
 */
export type ReasonCode = string;

/** One run as seen by rewards and progress code; engine-independent (rewards-engine.md §2). */
export interface RunSummary {
  /** Unique per run (not per level session). */
  runId: string;
  result: RunResult;
  reasonCode: ReasonCode | null;
  blocksUsed: number;
  /** `bughunt` only. */
  edits?: number;
  /** `predict` only: the option key the child picked. */
  predictChoice?: string;
  /**
   * Levels with `starGoals` only (P2-21): whether each goal was met on every map, in
   * `starGoals` order (`RunOutcome.goals`). Missing on such a level means "not met".
   */
  goals?: boolean[];
}
