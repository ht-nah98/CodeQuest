import type { RobotBlock, RobotDir } from './config';
import type { RobotCell } from './state';

/** Why `release` succeeded: dropped on a crossing, or one job done. */
export type RobotReleaseResult = 'placed' | 'contained' | 'neutralized' | 'retrieved';

/** Reason carried by a failed grab or release. */
export type RobotGripFailReason =
  'NOTHING_TO_GRAB' | 'HANDS_FULL' | 'HANDS_EMPTY' | 'CELL_TAKEN' | 'WRONG_PLACE' | 'WRONG_COLOR';

/**
 * Robotlab events, in the order a run emits them (product/game-kinds.md §3.3). Pure JSON: the
 * stage replays a run from `config` + events. Cells are `[row, column]`. Every action event
 * carries `t`, the clock (`elapsed`) right after the action. `index` is the block's fixed index
 * (`startHolding` first, then `config.blocks`). There is no `win` event: the stage celebrates
 * in `finish(outcome)`.
 */
export type RobotLabEvent =
  /** The robot drives one crossing from `from` to `to`, facing `dir`. */
  | {
      type: 'move';
      blockId: string | null;
      from: RobotCell;
      to: RobotCell;
      dir: RobotDir;
      t: number;
    }
  /** The robot turns 90° on the spot. */
  | { type: 'turn'; blockId: string | null; from: RobotDir; to: RobotDir; t: number }
  /**
   * The robot, standing on `at` and facing `dir`, cannot drive on: no line ahead (`offLine`,
   * crash OFF_LINE) or a block in the way (`block`, crash HIT_BLOCK).
   */
  | {
      type: 'bump';
      blockId: string | null;
      at: RobotCell;
      dir: RobotDir;
      into: 'offLine' | 'block';
    }
  /** The robot picks up block `index` from the crossing `at`. */
  | {
      type: 'grab';
      blockId: string | null;
      at: RobotCell;
      block: RobotBlock;
      index: number;
      t: number;
    }
  /** The robot puts block `index` down on `at` (`retrieved`: it vanishes into the lab). */
  | {
      type: 'release';
      blockId: string | null;
      at: RobotCell;
      block: RobotBlock;
      index: number;
      result: RobotReleaseResult;
      t: number;
    }
  /** A grab or release on `at` is not allowed; the run crashes with `reason`. */
  | { type: 'gripFail'; blockId: string | null; at: RobotCell; reason: RobotGripFailReason }
  /** The next action would pass the time limit; the robot stops on `at` with `t` used. */
  | { type: 'timeUp'; blockId: string | null; at: RobotCell; t: number };

export type RobotLabEventType = RobotLabEvent['type'];
