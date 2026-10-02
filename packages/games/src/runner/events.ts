/**
 * Runner game events, in the order a run emits them (game-kind-sdk.md §1.1).
 * Pure JSON data: the stage can replay a run from `config` + events without reading the state.
 * Every event carries the `blockId` of the block that caused it.
 */
export type RunnerEvent =
  /** Măng moves one cell right, `to = from + 1`. Followed by `fall` if `to` is a hole. */
  | { type: 'walk'; blockId: string | null; from: number; to: number }
  /** Măng jumps over `from + 1` and lands on `to = from + 2`. Followed by `fall` if `to` is a hole. */
  | { type: 'jump'; blockId: string | null; from: number; to: number }
  /** Măng drops into the hole at `at`; the run ends with crash FELL_IN_HOLE. */
  | { type: 'fall'; blockId: string | null; at: number }
  /** Măng jumps from `from` past the end of the track; the run ends with crash OFF_TRACK. */
  | { type: 'offTrack'; blockId: string | null; from: number }
  /** Măng stands on the flag at `at`; the run ends with success. */
  | { type: 'win'; blockId: string | null; at: number };

export type RunnerEventType = RunnerEvent['type'];
