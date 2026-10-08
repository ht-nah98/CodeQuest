import type { DistributiveOmit, GameKindApi, Primitive, SimContext } from '@codequest/engine';
import {
  ROBOT_COLORS,
  ROBOT_DIRS,
  ROBOT_FORWARD_MAX,
  ROBOT_FORWARD_MIN,
  STATION_OF,
  type RobotColor,
  type RobotDir,
} from './config';
import { scoreVerdict } from './evaluate';
import type { RobotGripFailReason, RobotLabEvent, RobotReleaseResult } from './events';
import type { RobotLabReason } from './reasons';
import {
  blockIndexAt,
  blockOf,
  heldIndex,
  tileAt,
  type RobotBlockState,
  type RobotCell,
  type RobotLabState,
} from './state';

type RobotContext = SimContext<RobotLabState, RobotLabEvent>;
type FailEvent = DistributiveOmit<Extract<RobotLabEvent, { type: 'bump' | 'gripFail' }>, 'blockId'>;

/** Why an action is not allowed: the event to emit and the crash reason. */
interface Failure {
  event: FailEvent;
  reason: RobotLabReason;
}

const STEP: Readonly<Record<RobotDir, RobotCell>> = {
  N: [-1, 0],
  E: [0, 1],
  S: [1, 0],
  W: [0, -1],
};

function rotate(dir: RobotDir, quarterTurns: number): RobotDir {
  return ROBOT_DIRS[(ROBOT_DIRS.indexOf(dir) + quarterTurns + 4) % 4] ?? dir;
}

function ahead(state: RobotLabState): RobotCell {
  const [dr, dc] = STEP[state.dir];
  return [state.pos[0] + dr, state.pos[1] + dc];
}

/** A crossing with line: on the map and not a house. Blocks do not matter here. */
function hasLine(state: RobotLabState, cell: RobotCell): boolean {
  const tile = tileAt(state.map, cell);
  return tile !== undefined && tile !== '#';
}

/**
 * The one fixed order of every action (game-kinds.md §3.3):
 * 1. check the cell: a failure emits its event and crashes, no time spent;
 * 2. check the clock: `elapsed + cost > timeLimit` emits `timeUp` and stops (`missions`:
 *    OUT_OF_TIME; `score`: judged on the points so far), the action is not done;
 * 3. do it: add `cost` once, then `apply` changes the state and emits with the new `t`.
 */
function perform(
  ctx: RobotContext,
  blockId: string,
  cost: number,
  check: () => Failure | null,
  apply: (t: number) => void,
): void {
  const state = ctx.state;
  const failure = check();
  if (failure !== null) {
    state.crashAt = state.pos;
    ctx.emit(failure.event, blockId);
    ctx.stop('crash', failure.reason);
  }
  if (state.elapsed + cost > state.rules.timeLimit) {
    ctx.emit({ type: 'timeUp', at: state.pos, t: state.elapsed }, blockId);
    if (state.goal.type === 'score') {
      const verdict = scoreVerdict(state, state.goal.target);
      if (verdict.success) ctx.stop('success');
      ctx.stop('incomplete', verdict.reasonCode);
    }
    ctx.stop('incomplete', 'OUT_OF_TIME');
  }
  state.elapsed += cost;
  apply(state.elapsed);
}

function gripFail(state: RobotLabState, reason: RobotGripFailReason): Failure {
  return { event: { type: 'gripFail', at: state.pos, reason }, reason };
}

/** Release table ("Thả ở đâu"): the result on the robot's tile, or why not. */
function releaseResult(
  state: RobotLabState,
  block: RobotBlockState,
): RobotReleaseResult | 'WRONG_PLACE' | 'WRONG_COLOR' {
  const tile = tileAt(state.map, state.pos);
  switch (tile) {
    case '.':
      return 'placed';
    case 'L':
      return block.kind === 'pollution' ? 'retrieved' : 'WRONG_PLACE';
    case 'Z':
      return block.kind === 'fence' ? 'contained' : 'WRONG_PLACE';
    case 'r':
    case 'y':
    case 'g':
      if (block.kind !== 'neutralizer') return 'WRONG_PLACE';
      return STATION_OF[block.color] === tile ? 'neutralized' : 'WRONG_COLOR';
    default:
      return 'WRONG_PLACE';
  }
}

function crossings(value: Primitive): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < ROBOT_FORWARD_MIN ||
    value > ROBOT_FORWARD_MAX
  ) {
    throw new Error(`forward: crossings must be an integer 1–9, got ${String(value)}`);
  }
  return value;
}

function colorOf(value: Primitive): RobotColor {
  const color = ROBOT_COLORS.find((candidate) => candidate === value);
  if (color === undefined) throw new Error(`blockColor: unknown colour ${String(value)}`);
  return color;
}

/** Sandbox API of the robot lab (rules: product/game-kinds.md §3.3). */
export function createRobotLabApi(ctx: RobotContext): GameKindApi {
  const { costs } = ctx.state.rules;
  return {
    // `tiến N ô`: N single-crossing actions in a row, each through the full order.
    forward: (n, blockId) => {
      const id = String(blockId);
      const total = crossings(n);
      for (let step = 1; step <= total; step++) {
        const state = ctx.state;
        const to = ahead(state);
        perform(
          ctx,
          id,
          costs.forward,
          () => {
            if (!hasLine(state, to)) {
              return {
                event: { type: 'bump', at: state.pos, dir: state.dir, into: 'offLine' },
                reason: 'OFF_LINE',
              };
            }
            // A block may only be driven onto as the last crossing, with an empty gripper.
            const blocked =
              blockIndexAt(state, to) !== -1 && (step < total || heldIndex(state) !== -1);
            return blocked
              ? {
                  event: { type: 'bump', at: state.pos, dir: state.dir, into: 'block' },
                  reason: 'HIT_BLOCK',
                }
              : null;
          },
          (t) => {
            const from = state.pos;
            state.pos = to;
            ctx.emit({ type: 'move', from, to, dir: state.dir, t }, id);
          },
        );
      }
    },
    turn: (side, blockId) => {
      if (side !== 'LEFT' && side !== 'RIGHT') {
        throw new Error(`turn: unknown side ${String(side)}`);
      }
      const id = String(blockId);
      const state = ctx.state;
      perform(
        ctx,
        id,
        costs.turn,
        () => null,
        (t) => {
          const from = state.dir;
          state.dir = rotate(from, side === 'LEFT' ? -1 : 1);
          ctx.emit({ type: 'turn', from, to: state.dir, t }, id);
        },
      );
    },
    grab: (blockId) => {
      const id = String(blockId);
      const state = ctx.state;
      const index = blockIndexAt(state, state.pos);
      perform(
        ctx,
        id,
        costs.grab,
        () => {
          if (heldIndex(state) !== -1) return gripFail(state, 'HANDS_FULL');
          return index === -1 ? gripFail(state, 'NOTHING_TO_GRAB') : null;
        },
        (t) => {
          const block = state.blocks[index];
          if (block === undefined) return;
          state.blocks[index] = { ...block, where: 'held' };
          ctx.emit({ type: 'grab', at: state.pos, block: blockOf(block), index, t }, id);
        },
      );
    },
    release: (blockId) => {
      const id = String(blockId);
      const state = ctx.state;
      const index = heldIndex(state);
      const held = state.blocks[index];
      let result: RobotReleaseResult = 'placed';
      perform(
        ctx,
        id,
        costs.release,
        () => {
          if (held === undefined) return gripFail(state, 'HANDS_EMPTY');
          if (blockIndexAt(state, state.pos) !== -1) return gripFail(state, 'CELL_TAKEN');
          const verdict = releaseResult(state, held);
          if (verdict === 'WRONG_PLACE' || verdict === 'WRONG_COLOR') {
            return gripFail(state, verdict);
          }
          result = verdict;
          return null;
        },
        (t) => {
          if (held === undefined) return;
          const at = state.pos;
          state.blocks[index] = { ...held, where: result === 'retrieved' ? 'done' : { at } };
          ctx.emit({ type: 'release', at, block: blockOf(held), index, result, t }, id);
        },
      );
    },
    // Sensors only read the state: no time, no event besides the engine's `sense`.
    lineAhead: (blockId) => ctx.sense(hasLine(ctx.state, ahead(ctx.state)), String(blockId)),
    blockColor: (color, blockId) => {
      const wanted = colorOf(color);
      const state = ctx.state;
      const held = heldIndex(state);
      const block = state.blocks[held !== -1 ? held : blockIndexAt(state, state.pos)];
      const answer = block !== undefined && block.kind !== 'fence' && block.color === wanted;
      return ctx.sense(answer, String(blockId));
    },
    atLab: (blockId) => ctx.sense(tileAt(ctx.state.map, ctx.state.pos) === 'L', String(blockId)),
    holding: (blockId) => ctx.sense(heldIndex(ctx.state) !== -1, String(blockId)),
  };
}
