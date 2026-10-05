import type { GameKindApi, SimContext } from '@codequest/engine';
import { NEED_REASONS } from '../goalItems';
import { RUNNER_AHEAD_KINDS, type RunnerAheadKind, type RunnerCell } from './config';
import type { RunnerEvent, RunnerMove } from './events';
import type { RunnerState } from './state';

type RunnerContext = SimContext<RunnerState, RunnerEvent>;

/** Cells each sensor value is true for. */
const AHEAD_MATCHES: Readonly<Record<RunnerAheadKind, readonly RunnerCell[]>> = {
  HOLE: ['hole'],
  BRANCH: ['branch'],
  CRATE: ['crate'],
  CLEAR: ['ground', 'flag'],
};

function isAheadKind(value: unknown): value is RunnerAheadKind {
  return (RUNNER_AHEAD_KINDS as readonly unknown[]).includes(value);
}

/**
 * Ends the run if `move` from Măng's cell cannot get past the cell `at`: a branch (unless she
 * crouches) or a crate. Măng stays where she is. The failure event is emitted before `stop`
 * (game-kind-sdk.md §1).
 */
function crashIfBlocked(ctx: RunnerContext, at: number, move: RunnerMove, blockId: string): void {
  const state = ctx.state;
  const cell = state.cells[at];
  const from = state.pos;
  if (cell === 'branch' && move !== 'crouch') {
    state.crashAt = at;
    ctx.emit({ type: 'bump', from, at, obstacle: 'branch', move }, blockId);
    ctx.stop('crash', 'HIT_BRANCH');
  }
  if (cell === 'crate') {
    state.crashAt = at;
    ctx.emit({ type: 'bump', from, at, obstacle: 'crate', move }, blockId);
    ctx.stop('crash', 'HIT_CRATE');
  }
}

/**
 * Măng has just arrived on `to`: a hole ends the run with FELL_IN_HOLE, a bamboo shoot or a
 * mission item is picked up, and the flag ends the run: NEED_KEY / NEED_FRIEND while a mission
 * item remains, else MISSED_ITEMS while `collectAll` shoots remain, else success.
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
  const shoot = state.bamboo.indexOf(to);
  if (shoot !== -1) {
    state.bamboo.splice(shoot, 1);
    ctx.emit({ type: 'collect', at: to }, blockId);
  }
  const item = state.items.findIndex((candidate) => candidate.at === to);
  if (item !== -1) {
    const [picked] = state.items.splice(item, 1);
    if (picked !== undefined) ctx.emit({ type: 'collect', at: to, item: picked.kind }, blockId);
  }
  if (cell === 'flag') {
    const first = state.items[0];
    if (first !== undefined) {
      // Ascending like `bamboo`; `item` stays the first missing kind in config order.
      const left = state.items.map((rest) => rest.at).sort((a, b) => a - b);
      ctx.emit({ type: 'missed', at: to, left, item: first.kind }, blockId);
      ctx.stop('incomplete', NEED_REASONS[first.kind]);
    }
    if (state.collectAll && state.bamboo.length > 0) {
      ctx.emit({ type: 'missed', at: to, left: [...state.bamboo] }, blockId);
      ctx.stop('incomplete', 'MISSED_ITEMS');
    }
    ctx.emit({ type: 'win', at: to }, blockId);
    ctx.stop('success');
  }
}

/** Walk and crouch: one cell right; crouching is the only way under a branch. */
function step(ctx: RunnerContext, move: 'walk' | 'crouch', blockId: unknown): void {
  const id = String(blockId);
  const from = ctx.state.pos;
  // The flag is the last cell and reaching it ends the run, so `from + 1` is always on track.
  crashIfBlocked(ctx, from + 1, move, id);
  ctx.emit({ type: move, from, to: from + 1 }, id);
  arrive(ctx, from + 1, id);
}

/** Sandbox API of the runner (rules: product/game-kinds.md §3.1). */
export function createRunnerApi(ctx: RunnerContext): GameKindApi {
  return {
    walk: (blockId) => {
      step(ctx, 'walk', blockId);
    },
    crouch: (blockId) => {
      step(ctx, 'crouch', blockId);
    },
    jump: (blockId) => {
      const id = String(blockId);
      const from = ctx.state.pos;
      const to = from + 2;
      // Holes and the flag can be flown over; a branch or crate in the way stops Măng mid-air.
      // `from + 1` is always on track (Măng never stands on the flag), so only `to` can be off it.
      crashIfBlocked(ctx, from + 1, 'jump', id);
      if (to >= ctx.state.cells.length) {
        ctx.state.crashAt = from;
        ctx.emit({ type: 'offTrack', from }, id);
        ctx.stop('crash', 'OFF_TRACK');
      }
      crashIfBlocked(ctx, to, 'jump', id);
      ctx.emit({ type: 'jump', from, to }, id);
      arrive(ctx, to, id);
    },
    kick: (blockId) => {
      const state = ctx.state;
      const at = state.pos + 1;
      // Only a crate reacts; kicking anything else is harmless and Măng never moves.
      const hit = state.cells[at] === 'crate';
      if (hit) state.cells[at] = 'ground';
      ctx.emit({ type: 'kick', at, hit }, String(blockId));
    },
    isAhead: (kind, blockId) => {
      if (!isAheadKind(kind)) throw new Error(`isAhead: unknown kind ${String(kind)}`);
      const cell = ctx.state.cells[ctx.state.pos + 1];
      // Past the end of the track every value is false.
      return ctx.sense(cell !== undefined && AHEAD_MATCHES[kind].includes(cell), String(blockId));
    },
    // Reaching the flag ends the run at once, so while a program runs this is always false
    // (curriculum.md §5.4 T6, like the maze's `atGoal`).
    atGoal: (blockId) => ctx.sense(ctx.state.cells[ctx.state.pos] === 'flag', String(blockId)),
  };
}
