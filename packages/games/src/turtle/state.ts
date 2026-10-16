import type { TurtleConfig } from './config';
import { gridPoint, HEADING_DEGREES, type TurtlePoint } from './lattice';

/**
 * Mutable state of one turtle run: plain data, so the par search can merge equal states. The
 * target is not in it (it never changes): the API reads it with `targetOfLevelConfig`.
 */
export interface TurtleState {
  readonly size: { readonly w: number; readonly h: number };
  /** Where Măng stands. Replaced, never mutated, so emitted events keep their own copy. */
  pos: TurtlePoint;
  /** 0…11, 30° steps counter-clockwise from east. */
  heading: number;
  penDown: boolean;
  /** `segmentKey`s drawn so far: a set, so order and drawing twice do not matter. */
  readonly drawn: Set<string>;
  /** Where Măng stood when the run crashed, for `predictAnswer`; null while nothing crashed. */
  crashAt: TurtlePoint | null;
}

export function createTurtleState(config: TurtleConfig): TurtleState {
  return {
    size: { w: config.size.w, h: config.size.h },
    pos: gridPoint(config.start.x, config.start.y),
    heading: config.start.heading / HEADING_DEGREES,
    penDown: config.penDown ?? true,
    drawn: new Set(),
    crashAt: null,
  };
}
