import type { GameKindDefinition } from '@codequest/engine';
import { robotlabBlocks } from './blocks';
import { robotlabLevelConfigSchema, type RobotLabLevelConfig } from './config';
import { evaluateRobotLab, robotlabPredictAnswer } from './evaluate';
import type { RobotLabEvent } from './events';
import { ROBOTLAB_REASONS } from './reasons';
import { createRobotLabApi } from './sim';
import { createRobotLabState, type RobotLabState } from './state';

/**
 * "Phòng thí nghiệm Robot": a top-down grid of line crossings; the robot Bíp drives, turns,
 * grabs and releases blocks on a virtual clock, and is judged only when the program ends.
 * `configSchema` checks the level file (rules not merged); `createState` only accepts a config
 * passed through `resolveRobotlabRules`. No `checkStarGoal`: robotlab has no star goals (v1).
 */
export const robotlab: GameKindDefinition<RobotLabLevelConfig, RobotLabState, RobotLabEvent> = {
  id: 'robotlab',
  version: 1,
  // A resolved config is also a valid level config, so `runLevel` keeps the merged rules.
  configSchema: robotlabLevelConfigSchema,
  blocks: robotlabBlocks,
  reasonCodes: ROBOTLAB_REASONS,
  createState: (config) => createRobotLabState(config),
  createApi: createRobotLabApi,
  evaluate: (state) => evaluateRobotLab(state),
  predictAnswer: robotlabPredictAnswer,
};

export {
  ROBOT_BLOCK_KINDS,
  ROBOT_COLORS,
  ROBOT_DIRS,
  ROBOT_FORWARD_MAX,
  ROBOT_FORWARD_MIN,
  ROBOT_MAX_BLOCKS,
  ROBOT_MAX_SIZE,
  ROBOT_MIN_SIZE,
  ROBOT_TILES,
  resolveRobotlabRules,
  robotlabLevelConfigSchema,
  robotlabResolvedSchema,
  robotlabRulesSchema,
  STATION_OF,
} from './config';
export type {
  RobotBlock,
  RobotBlockKind,
  RobotColor,
  RobotDir,
  RobotLabConfig,
  RobotLabGoal,
  RobotLabLevelConfig,
  RobotLabRules,
  RobotLabRulesOverride,
  RobotTile,
} from './config';
export { robotlabScore } from './evaluate';
export type {
  RobotGripFailReason,
  RobotLabEvent,
  RobotLabEventType,
  RobotReleaseResult,
} from './events';
export { ROBOTLAB_REASONS } from './reasons';
export type { RobotLabReason } from './reasons';
export type { RobotBlockState, RobotBlockWhere, RobotCell, RobotLabState } from './state';
export { boardOfMap, ROBOT_BOARDS, ROBOT_SCENERY, THANH_PHO_MANG } from './boards';
export type { RobotBoard, RobotBoardKit, RobotScenery } from './boards';
export {
  EXAM_FAIRNESS,
  EXAM_SEED_MAX,
  EXAM_SEED_MIN,
  examConfig,
  examIssues,
  generateExam,
  isExamSeed,
  planExam,
  planWorkspace,
} from './exam';
export type { Exam, ExamPlan, PlacedBlock, PlanStep } from './exam';
