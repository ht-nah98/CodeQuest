/** Runner reason codes (product/game-kinds.md §3.1). */
export const RUNNER_REASONS = [
  'FELL_IN_HOLE',
  'HIT_BRANCH',
  'HIT_CRATE',
  'OFF_TRACK',
  'NOT_AT_GOAL',
  'MISSED_ITEMS',
  'NEED_KEY',
  'NEED_FRIEND',
] as const;
export type RunnerReason = (typeof RUNNER_REASONS)[number];
