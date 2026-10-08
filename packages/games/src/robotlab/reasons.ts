/** Robotlab reason codes (product/game-kinds.md §3.3). */
export const ROBOTLAB_REASONS = [
  'OFF_LINE',
  'HIT_BLOCK',
  'NOTHING_TO_GRAB',
  'HANDS_FULL',
  'HANDS_EMPTY',
  'CELL_TAKEN',
  'WRONG_PLACE',
  'WRONG_COLOR',
  'OUT_OF_TIME',
  'MISSIONS_LEFT',
  'NOT_HOME',
  'LOW_SCORE',
] as const;
export type RobotLabReason = (typeof ROBOTLAB_REASONS)[number];
