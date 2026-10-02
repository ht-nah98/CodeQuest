import type { GameKindApi, Primitive, SimContext } from '@codequest/engine';
import { MAZE_DIRS, MAZE_SENSE_DIRS, type MazeDir, type MazeSenseDir } from './config';
import type { MazeEvent } from './events';
import { cellKey, tileAt, type MazeCell, type MazeState } from './state';

type MazeContext = SimContext<MazeState, MazeEvent>;

const STEP: Readonly<Record<MazeDir, MazeCell>> = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };

/** `dir` turned by `quarterTurns` × 90° clockwise (negative: counter-clockwise). */
function rotate(dir: MazeDir, quarterTurns: number): MazeDir {
  const index = (MAZE_DIRS.indexOf(dir) + quarterTurns + 4) % 4;
  return MAZE_DIRS[index] ?? dir;
}

function neighbour([r, c]: MazeCell, dir: MazeDir): MazeCell {
  const [dr, dc] = STEP[dir];
  return [r + dr, c + dc];
}

/** Walls and everything outside the map block Măng; every other tile is walkable. */
function isOpen(state: MazeState, cell: MazeCell): boolean {
  const tile = tileAt(state.map, cell);
  return tile !== undefined && tile !== '#';
}

function goalMet(state: MazeState): boolean {
  return !state.collectAll || state.collected.size === state.bambooTotal;
}

function senseDir(value: Primitive): MazeSenseDir {
  const dir = MAZE_SENSE_DIRS.find((candidate) => candidate === value);
  if (dir === undefined) throw new Error(`isPath: unknown direction ${String(value)}`);
  return dir;
}

const SENSE_TURNS: Readonly<Record<MazeSenseDir, number>> = { AHEAD: 0, LEFT: -1, RIGHT: 1 };

/** Sandbox API of the maze (rules: product/game-kinds.md §3.2). */
export function createMazeApi(ctx: MazeContext): GameKindApi {
  return {
    forward: (blockId) => {
      const id = String(blockId);
      const state = ctx.state;
      const from = state.pos;
      const to = neighbour(from, state.dir);
      if (!isOpen(state, to)) {
        state.crashAt = from;
        ctx.emit({ type: 'bump', at: from, dir: state.dir }, id);
        ctx.stop('crash', 'HIT_WALL');
      }
      ctx.emit({ type: 'move', from, to, dir: state.dir }, id);
      state.pos = to;
      const tile = tileAt(state.map, to);
      if (tile === 'b' && !state.collected.has(cellKey(to))) {
        state.collected.add(cellKey(to));
        ctx.emit({ type: 'collect', at: to }, id);
      }
      // Win at once, mid-program (like Blockly Games); with bamboo left, G is an ordinary cell.
      if (tile === 'G' && goalMet(state)) {
        ctx.emit({ type: 'win', at: to }, id);
        ctx.stop('success');
      }
    },
    turn: (side, blockId) => {
      if (side !== 'LEFT' && side !== 'RIGHT')
        throw new Error(`turn: unknown side ${String(side)}`);
      const from = ctx.state.dir;
      const to = rotate(from, side === 'LEFT' ? -1 : 1);
      ctx.state.dir = to;
      ctx.emit({ type: 'turn', from, to }, String(blockId));
    },
    isPath: (dir) => {
      const state = ctx.state;
      return isOpen(state, neighbour(state.pos, rotate(state.dir, SENSE_TURNS[senseDir(dir)])));
    },
    atGoal: () => tileAt(ctx.state.map, ctx.state.pos) === 'G',
  };
}
