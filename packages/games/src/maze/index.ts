import type { GameKindDefinition } from '@codequest/engine';
import { mazeBlocks } from './blocks';
import { mazeConfigSchema, type MazeConfig } from './config';
import { evaluateMaze, mazePredictAnswer } from './evaluate';
import type { MazeEvent } from './events';
import { MAZE_REASONS } from './reasons';
import { createMazeApi } from './sim';
import { createMazeState, type MazeState } from './state';

/** "Mê cung": a top-down grid; Măng walks forward and turns to reach the goal G. */
export const maze: GameKindDefinition<MazeConfig, MazeState, MazeEvent> = {
  id: 'maze',
  version: 1,
  configSchema: mazeConfigSchema,
  blocks: mazeBlocks,
  reasonCodes: MAZE_REASONS,
  createState: (config) => createMazeState(config),
  createApi: createMazeApi,
  evaluate: evaluateMaze,
  predictAnswer: mazePredictAnswer,
};

export {
  MAZE_DIRS,
  MAZE_MAX_SIZE,
  MAZE_MIN_SIZE,
  MAZE_SENSE_DIRS,
  MAZE_TILES,
  mazeConfigSchema,
} from './config';
export type { MazeConfig, MazeDir, MazeSenseDir, MazeTile } from './config';
export type { MazeEvent, MazeEventType } from './events';
export { MAZE_REASONS } from './reasons';
export type { MazeReason } from './reasons';
export type { MazeCell, MazeState } from './state';
