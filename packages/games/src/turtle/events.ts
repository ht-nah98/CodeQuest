import type { TurtlePoint } from './lattice';

/**
 * Turtle events, in the order a run emits them (game-kind-sdk.md §1.4). Pure JSON data: the
 * stage replays a run from `config` + events without reading the state. Points are lattice
 * points (`lattice.ts`); headings are 0…11. Each unit step is one event.
 */
export type TurtleEvent =
  /** One unit step with the pen up: no line. */
  | { type: 'move'; blockId: string | null; from: TurtlePoint; to: TurtlePoint }
  /** One unit step with the pen down: the segment `from`–`to` is drawn (maybe again). */
  | { type: 'line'; blockId: string | null; from: TurtlePoint; to: TurtlePoint }
  /** A turn on the spot from heading `from` to `to` (`deg` degrees to `side`). */
  | {
      type: 'turn';
      blockId: string | null;
      from: number;
      to: number;
      side: 'LEFT' | 'RIGHT';
      deg: number;
    }
  /** The pen goes up (`down: false`) or down. */
  | { type: 'pen'; blockId: string | null; down: boolean }
  /**
   * The pen is down and the next segment is not in the target: Măng stays at `from`, the stage
   * paints `from`–`to` red; crash EXTRA_LINE.
   */
  | { type: 'extraLine'; blockId: string | null; from: TurtlePoint; to: TurtlePoint }
  /** The next step would leave the paper: Măng stays at `from`; crash OFF_PAPER. */
  | { type: 'offPaper'; blockId: string | null; from: TurtlePoint; to: TurtlePoint };

export type TurtleEventType = TurtleEvent['type'];
