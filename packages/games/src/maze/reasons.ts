/** Maze reason codes (product/game-kinds.md §3.2). */
export const MAZE_REASONS = [
  'HIT_WALL',
  'NOT_AT_GOAL',
  'MISSED_ITEMS',
  'NEED_KEY',
  'NEED_FRIEND',
] as const;
export type MazeReason = (typeof MAZE_REASONS)[number];
