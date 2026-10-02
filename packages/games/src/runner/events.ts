/** Obstacles Măng can bump into. */
export type RunnerObstacle = 'branch' | 'crate';

/** Moves that can end in a bump. */
export type RunnerMove = 'walk' | 'crouch' | 'jump';

/**
 * Runner game events, in the order a run emits them (game-kind-sdk.md §1.1).
 * Pure JSON data: the stage can replay a run from `config` + events without reading the state.
 * Every event carries the `blockId` of the block that caused it.
 */
export type RunnerEvent =
  /** Măng moves one cell right, `to = from + 1`. Followed by `fall` if `to` is a hole. */
  | { type: 'walk'; blockId: string | null; from: number; to: number }
  /** Măng ducks and moves one cell right, `to = from + 1` (passes under a branch). */
  | { type: 'crouch'; blockId: string | null; from: number; to: number }
  /** Măng jumps over `from + 1` and lands on `to = from + 2`. Followed by `fall` if `to` is a hole. */
  | { type: 'jump'; blockId: string | null; from: number; to: number }
  /** Măng kicks cell `at` (= her cell + 1) without moving; `hit`: a crate fell and `at` is ground now. */
  | { type: 'kick'; blockId: string | null; at: number; hit: boolean }
  /** Măng picks up the bamboo shoot on `at`, the cell she just stopped on. */
  | { type: 'collect'; blockId: string | null; at: number }
  /** Măng drops into the hole at `at`; the run ends with crash FELL_IN_HOLE. */
  | { type: 'fall'; blockId: string | null; at: number }
  /**
   * Măng, trying `move` from `from`, hits the `obstacle` on `at` and stays on `from`; the run ends
   * with crash HIT_BRANCH / HIT_CRATE. For a jump, `at = from + 1` means mid-air, `from + 2` landing.
   */
  | {
      type: 'bump';
      blockId: string | null;
      from: number;
      at: number;
      obstacle: RunnerObstacle;
      move: RunnerMove;
    }
  /** Măng jumps from `from` past the end of the track; the run ends with crash OFF_TRACK. */
  | { type: 'offTrack'; blockId: string | null; from: number }
  /** Măng stands on the flag at `at`; the run ends with success. */
  | { type: 'win'; blockId: string | null; at: number }
  /**
   * Măng stands on the flag at `at` but `goal.collectAll` and the shoots on `left` remain;
   * the run ends with incomplete MISSED_ITEMS.
   */
  | { type: 'missed'; blockId: string | null; at: number; left: number[] };

export type RunnerEventType = RunnerEvent['type'];
