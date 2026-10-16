import type { GameKindDefinition } from '@codequest/engine';
import { turtleBlocks } from './blocks';
import { turtleConfigSchema, type TurtleConfig } from './config';
import { evaluateTurtle, turtlePredictAnswer } from './evaluate';
import type { TurtleEvent } from './events';
import { TURTLE_REASONS } from './reasons';
import { createTurtleApi } from './sim';
import { createTurtleState, type TurtleState } from './state';

/**
 * "Họa sĩ" (ADR-0024): Măng holds a brush on dotted paper and draws unit segments on an exact
 * 30° lattice. A run is judged by the set of segments against the target picture, in any
 * order; a stray segment stops the run at once. No star goals (v1).
 */
export const turtle: GameKindDefinition<TurtleConfig, TurtleState, TurtleEvent> = {
  id: 'turtle',
  version: 1,
  configSchema: turtleConfigSchema,
  blocks: turtleBlocks,
  reasonCodes: TURTLE_REASONS,
  createState: (config) => createTurtleState(config),
  createApi: createTurtleApi,
  evaluate: evaluateTurtle,
  predictAnswer: turtlePredictAnswer,
};

export {
  expandPath,
  targetOfLevelConfig,
  targetSegments,
  TURTLE_ANGLES,
  TURTLE_DEFAULT_ANGLES,
  TURTLE_FORWARD_MAX,
  TURTLE_FORWARD_MIN,
  TURTLE_GRIDS,
  TURTLE_MAX_SIZE,
  TURTLE_MIN_SIZE,
  turtleAngles,
  turtleConfigSchema,
} from './config';
export type { TurtleAngle, TurtleConfig, TurtlePath } from './config';
export { drawingKey } from './evaluate';
export type { TurtleEvent, TurtleEventType } from './events';
export {
  gridPoint,
  HEADING_DEGREES,
  HEADINGS,
  onPaper,
  parsePointKey,
  parseSegmentKey,
  pointKey,
  segmentKey,
  toXY,
} from './lattice';
export type { TurtlePoint } from './lattice';
export { TURTLE_REASONS } from './reasons';
export type { TurtleReason } from './reasons';
export type { TurtleState } from './state';
