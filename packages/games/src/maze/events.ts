import type { MazeDir } from './config';
import type { MazeCell } from './state';

/**
 * Maze game events, in the order a run emits them (game-kind-sdk.md §1.2).
 * Pure JSON data: the stage can replay a run from `config` + events without reading the state.
 * Cells are `[row, column]`; every event carries the `blockId` of the block that caused it.
 */
export type MazeEvent =
  /** Măng steps one cell from `from` to `to`, facing `dir`. */
  | { type: 'move'; blockId: string | null; from: MazeCell; to: MazeCell; dir: MazeDir }
  /** Măng turns 90° on the spot, from facing `from` to facing `to`. */
  | { type: 'turn'; blockId: string | null; from: MazeDir; to: MazeDir }
  /** Măng, standing on `at` and facing `dir`, walks into a wall or the map edge: crash HIT_WALL. */
  | { type: 'bump'; blockId: string | null; at: MazeCell; dir: MazeDir }
  /** Măng picks up the bamboo shoot on `at`. Right after the `move` onto `at`. */
  | { type: 'collect'; blockId: string | null; at: MazeCell }
  /** Măng stands on the goal `at` with the goal met; the run ends with success. */
  | { type: 'win'; blockId: string | null; at: MazeCell };

export type MazeEventType = MazeEvent['type'];
