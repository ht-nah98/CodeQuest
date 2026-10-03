import type { GameKindDefinition } from '@codequest/engine';
import { runnerBlocks } from './blocks';
import { runnerConfigSchema, type RunnerConfig } from './config';
import { evaluateRunner, runnerPredictAnswer, runnerStarGoal } from './evaluate';
import type { RunnerEvent } from './events';
import { RUNNER_REASONS } from './reasons';
import { createRunnerApi } from './sim';
import { createRunnerState, type RunnerState } from './state';

/** "Đường chạy của Măng": one lane; Măng walks, jumps, crouches and kicks right to the flag. */
export const runner: GameKindDefinition<RunnerConfig, RunnerState, RunnerEvent> = {
  id: 'runner',
  version: 1,
  configSchema: runnerConfigSchema,
  blocks: runnerBlocks,
  reasonCodes: RUNNER_REASONS,
  createState: (config) => createRunnerState(config),
  createApi: createRunnerApi,
  evaluate: evaluateRunner,
  predictAnswer: runnerPredictAnswer,
  checkStarGoal: runnerStarGoal,
};

export {
  RUNNER_AHEAD_KINDS,
  RUNNER_CELLS,
  RUNNER_MAX_CELLS,
  RUNNER_MIN_CELLS,
  runnerConfigSchema,
} from './config';
export type { RunnerAheadKind, RunnerCell, RunnerConfig } from './config';
export type { RunnerEvent, RunnerEventType, RunnerMove, RunnerObstacle } from './events';
export { RUNNER_REASONS } from './reasons';
export type { RunnerReason } from './reasons';
export type { RunnerState } from './state';
