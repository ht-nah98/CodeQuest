/** Interpreter steps allowed per run unless `level.limits.maxSteps` overrides it. */
export const DEFAULT_MAX_STEPS = 100_000;
/** Game events (highlights excluded) allowed per run unless `level.limits.maxActions` overrides it. */
export const DEFAULT_MAX_ACTIONS = 1_000;

/** Reason codes produced by the engine itself; each needs a sentence in feedback.json. */
export const ENGINE_REASONS = [
  'EMPTY_PROGRAM',
  'TOO_MANY_BLOCKS',
  'TIMEOUT',
  'INTERNAL_ERROR',
] as const;
export type EngineReason = (typeof ENGINE_REASONS)[number];
