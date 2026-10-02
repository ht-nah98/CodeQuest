/**
 * Runner reason codes implemented so far (product/game-kinds.md §3.1). HIT_BRANCH, HIT_CRATE and
 * MISSED_ITEMS arrive with the branch/crate cells and bamboo in Phase 1.
 */
export const RUNNER_REASONS = ['FELL_IN_HOLE', 'OFF_TRACK', 'NOT_AT_GOAL'] as const;
export type RunnerReason = (typeof RUNNER_REASONS)[number];
