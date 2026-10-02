import type { GameKindApi, SimContext } from '@codequest/engine';
import type { RunnerEvent } from './events';
import type { RunnerState } from './state';

type RunnerContext = SimContext<RunnerState, RunnerEvent>;

/**
 * Măng has just arrived on `to`: a hole ends the run with FELL_IN_HOLE, the flag with success.
 * Ground cells need nothing. The failure event is emitted before `stop` (game-kind-sdk.md §1).
 */
function arrive(ctx: RunnerContext, to: number, blockId: string): void {
  const state = ctx.state;
  state.pos = to;
  const cell = state.cells[to];
  if (cell === 'hole') {
    state.crashAt = to;
    ctx.emit({ type: 'fall', at: to }, blockId);
    ctx.stop('crash', 'FELL_IN_HOLE');
  }
  if (cell === 'flag') {
    ctx.emit({ type: 'win', at: to }, blockId);
    ctx.stop('success');
  }
}

/** Sandbox API of the runner (rules: product/game-kinds.md §3.1). */
export function createRunnerApi(ctx: RunnerContext): GameKindApi {
  return {
    walk: (blockId) => {
      const id = String(blockId);
      const from = ctx.state.pos;
      // The flag is the last cell and reaching it ends the run, so `from + 1` is always on track.
      ctx.emit({ type: 'walk', from, to: from + 1 }, id);
      arrive(ctx, from + 1, id);
    },
    jump: (blockId) => {
      const id = String(blockId);
      const from = ctx.state.pos;
      const to = from + 2;
      // Any cell can be flown over (holes and the flag included); only the landing cell matters.
      if (to >= ctx.state.cells.length) {
        ctx.state.crashAt = from;
        ctx.emit({ type: 'offTrack', from }, id);
        ctx.stop('crash', 'OFF_TRACK');
      }
      ctx.emit({ type: 'jump', from, to }, id);
      arrive(ctx, to, id);
    },
  };
}
