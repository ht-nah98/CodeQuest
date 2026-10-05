export { getGameKind, gameKinds } from './registry';
export { registerAllBlocks } from './registerAllBlocks';
// Mission items (P2-11c): `config.goal.items` of runner and maze levels.
export { GOAL_ITEM_KINDS, NEED_REASONS } from './goalItems';
export type { GoalItemKind } from './goalItems';
// Runner types and constants for the web stage; the definition itself is reached via the registry.
export {
  RUNNER_AHEAD_KINDS,
  RUNNER_CELLS,
  RUNNER_MAX_CELLS,
  RUNNER_MIN_CELLS,
  RUNNER_REASONS,
  runnerConfigSchema,
} from './runner';
export type {
  RunnerAheadKind,
  RunnerCell,
  RunnerConfig,
  RunnerEvent,
  RunnerEventType,
  RunnerMove,
  RunnerObstacle,
  RunnerReason,
} from './runner';
// Maze types and constants for the web stage; the definition itself is reached via the registry.
export {
  MAZE_DIRS,
  MAZE_MAX_SIZE,
  MAZE_MIN_SIZE,
  MAZE_REASONS,
  MAZE_SENSE_DIRS,
  MAZE_TILES,
  mazeConfigSchema,
} from './maze';
export type {
  MazeCell,
  MazeConfig,
  MazeDir,
  MazeEvent,
  MazeEventType,
  MazeReason,
  MazeSenseDir,
  MazeTile,
} from './maze';
