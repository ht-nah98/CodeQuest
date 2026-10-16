/** Interpreter steps allowed per run unless `level.limits.maxSteps` overrides it. */
export const DEFAULT_MAX_STEPS = 100_000;
/** Game events (highlights excluded) allowed per run unless `level.limits.maxActions` overrides it. */
export const DEFAULT_MAX_ACTIONS = 1_000;

/** Reason codes produced by the engine itself; each needs a sentence in feedback.json. */
export const ENGINE_REASONS = [
  'EMPTY_PROGRAM',
  'TOO_MANY_BLOCKS',
  'EMPTY_CONDITION',
  'LOOSE_BLOCKS',
  'UNUSED_BLOCKS',
  // Variables (ADR-0022): a box was not the countGoal number when the map was won; a box went
  // over its max.
  'WRONG_COUNT',
  'BOX_FULL',
  // Spells (ADR-0023 §3), checked before anything runs: a call to a spell with no `dạy phép`,
  // two `dạy phép` of one spell, a call to a spell with an empty body, a call inside a body.
  'NO_SPELL',
  'TWO_SPELLS',
  'EMPTY_SPELL',
  'SPELL_IN_SPELL',
  // A spell's box read outside the spell's body (ADR-0023 §2; checked from P4-04).
  'BOX_OUTSIDE_SPELL',
  'TIMEOUT',
  'INTERNAL_ERROR',
] as const;
export type EngineReason = (typeof ENGINE_REASONS)[number];
