export { getGameKind, gameKinds } from './registry';
export { registerAllBlocks } from './registerAllBlocks';
// Shared rules merged into level configs before a run (robotlab: content/shared/robotlab.json).
export { needsSharedRules, resolveLevelConfigs } from './resolveLevel';
export type { SharedLevelRules } from './resolveLevel';
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
// Robotlab constants, schemas and the shared-rules merge for content loaders, tools and the stage.
export {
  resolveRobotlabRules,
  ROBOT_BLOCK_KINDS,
  ROBOT_COLORS,
  ROBOT_DIRS,
  ROBOT_FORWARD_MAX,
  ROBOT_FORWARD_MIN,
  ROBOT_MAX_BLOCKS,
  ROBOT_MAX_SIZE,
  ROBOT_MIN_SIZE,
  ROBOT_TILES,
  ROBOTLAB_REASONS,
  robotlabLevelConfigSchema,
  robotlabResolvedSchema,
  robotlabRulesSchema,
  robotlabScore,
  STATION_OF,
  // Thành Phố Măng board and "Đề mới" (P3-08).
  boardOfMap,
  EXAM_FAIRNESS,
  EXAM_SEED_MAX,
  EXAM_SEED_MIN,
  examConfig,
  examIssues,
  generateExam,
  isExamSeed,
  planExam,
  planWorkspace,
  ROBOT_BOARDS,
  ROBOT_SCENERY,
  THANH_PHO_MANG,
} from './robotlab';
export type {
  RobotBlock,
  RobotBlockKind,
  RobotBlockState,
  RobotBlockWhere,
  RobotCell,
  RobotColor,
  RobotDir,
  RobotGripFailReason,
  RobotLabConfig,
  RobotLabEvent,
  RobotLabEventType,
  RobotLabGoal,
  RobotLabLevelConfig,
  RobotLabReason,
  RobotLabRules,
  RobotLabRulesOverride,
  RobotLabState,
  RobotReleaseResult,
  RobotTile,
  Exam,
  ExamPlan,
  PlacedBlock,
  PlanStep,
  RobotBoard,
  RobotBoardKit,
  RobotScenery,
} from './robotlab';
