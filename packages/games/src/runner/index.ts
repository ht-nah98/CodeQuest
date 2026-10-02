import type { GameKindDefinition } from '@codequest/engine';
import { runnerBlocks } from './blocks';
import { runnerConfigSchema, type RunnerConfig } from './config';
import { evaluateRunner, runnerPredictAnswer } from './evaluate';
import type { RunnerEvent } from './events';
import { RUNNER_REASONS } from './reasons';
import { createRunnerApi } from './sim';
import { createRunnerState, type RunnerState } from './state';

/** "Đường chạy của Măng": one lane, Măng walks and jumps right to the flag. */
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
};

export { RUNNER_CELLS, RUNNER_MAX_CELLS, RUNNER_MIN_CELLS, runnerConfigSchema } from './config';
export type { RunnerCell, RunnerConfig } from './config';
export type { RunnerEvent, RunnerEventType } from './events';
export { RUNNER_REASONS } from './reasons';
export type { RunnerReason } from './reasons';
export type { RunnerState } from './state';
