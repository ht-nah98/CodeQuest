import type { GameKindDefinition } from '@codequest/engine';
import { sorterBlocks } from './blocks';
import { sorterConfigSchema, type SorterConfig } from './config';
import { evaluateSorter, sorterPredictAnswer } from './evaluate';
import type { SorterEvent } from './events';
import { SORTER_REASONS } from './reasons';
import { createSorterApi } from './sim';
import { createSorterState, type SorterState } from './state';

/**
 * "Kệ sách" (ADR-0025): Bíp's hand walks a shelf of numbered books, asks about them and swaps
 * neighbours; judged when the program ends (sorted / find / end). Book questions may have a
 * budget (`maxQuestions`). No star goals (v1).
 */
export const sorter: GameKindDefinition<SorterConfig, SorterState, SorterEvent> = {
  id: 'sorter',
  version: 1,
  configSchema: sorterConfigSchema,
  blocks: sorterBlocks,
  reasonCodes: SORTER_REASONS,
  createState: (config) => createSorterState(config),
  createApi: createSorterApi,
  evaluate: evaluateSorter,
  predictAnswer: sorterPredictAnswer,
  questionCounter: 'questionsLeft',
};

export {
  SORTER_MAX_BOOKS,
  SORTER_MAX_NUMBER,
  SORTER_MAX_QUESTIONS,
  SORTER_MIN_BOOKS,
  SORTER_MIN_NUMBER,
  SORTER_OPS,
  sorterConfigSchema,
} from './config';
export type { SorterConfig, SorterOp } from './config';
export { isSorted, shelfKey } from './evaluate';
export type { SorterEvent, SorterEventType } from './events';
export { SORTER_REASONS } from './reasons';
export type { SorterReason } from './reasons';
export type { SorterState } from './state';
