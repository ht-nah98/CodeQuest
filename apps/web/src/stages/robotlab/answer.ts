// Pixi-free reading of a robotlab predict key (game-kinds.md §3.3 `predictAnswer`) and where the
// answer picture puts Bíp. Keys: `win` · `stop@r,c` · `outOfTime@r,c` · `crash:<REASON>@r,c` ·
// `timeout` (missions) and `score:<n>` (score levels). Unit tested in answer.test.ts.
import type { RobotCell, RobotDir, RobotLabConfig } from '@codequest/games';
import { cellsOf, DIR_STEP, isCrossing } from './layout';

export type RobotAnswerOutcome = 'win' | 'stop' | 'outOfTime' | 'crash' | 'score' | 'timeout';

export interface RobotAnswer {
  outcome: RobotAnswerOutcome;
  /** Crash reason (OFF_LINE, HIT_BLOCK, WRONG_COLOR…); null otherwise. */
  reason: string | null;
  /** The crossing Bíp stands on (stop, outOfTime, crash); null for win, score, timeout. */
  cell: [number, number] | null;
  /** Points of a `score:<n>` key; null otherwise. */
  points: number | null;
}

const AT_KEY = /^(stop|outOfTime|crash:([A-Z][A-Z0-9_]*))@(\d+),(\d+)$/;
const SCORE_KEY = /^score:(\d+)$/;

/** Null when the key is not a robotlab predictAnswer key (a content error content:check reports). */
export function parseRobotKey(key: string): RobotAnswer | null {
  if (key === 'win' || key === 'timeout') {
    return { outcome: key, reason: null, cell: null, points: null };
  }
  const score = SCORE_KEY.exec(key);
  if (score) return { outcome: 'score', reason: null, cell: null, points: Number(score[1]) };
  const match = AT_KEY.exec(key);
  if (match === null) return null;
  const [, head = '', reason, r = '0', c = '0'] = match;
  const cell: [number, number] = [Number(r), Number(c)];
  if (reason !== undefined) return { outcome: 'crash', reason, cell, points: null };
  return { outcome: head === 'outOfTime' ? 'outOfTime' : 'stop', reason: null, cell, points: null };
}

const ORDER: Readonly<Record<RobotDir, readonly RobotDir[]>> = {
  N: ['N', 'W', 'E', 'S'],
  E: ['E', 'N', 'S', 'W'],
  S: ['S', 'E', 'W', 'N'],
  W: ['W', 'S', 'N', 'E'],
};

/** Where Bíp starts: `start`, else the lab. */
export function startCell(config: RobotLabConfig): [number, number] {
  const start = config.start ?? cellsOf(config.map, 'L')[0] ?? [0, 0];
  return [start[0], start[1]];
}

/**
 * Which way Bíp most likely faces on `cell`: the last step of a shortest path along the line
 * from the start (startDir on the start itself). A key has only the cell, so this is a picture
 * heuristic, like the maze's (stage-rendering.md §4).
 */
export function arrivalDir(config: RobotLabConfig, cell: RobotCell): RobotDir {
  const { map } = config;
  const start = startCell(config);
  const seen = new Map<string, RobotDir>([[String(start), config.startDir]]);
  const queue: Array<[number, number]> = [start];
  for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
    if (next[0] === cell[0] && next[1] === cell[1]) break;
    for (const dir of ['N', 'E', 'S', 'W'] as const) {
      const step: [number, number] = [next[0] + DIR_STEP[dir][0], next[1] + DIR_STEP[dir][1]];
      if (!isCrossing(map, step) || seen.has(String(step))) continue;
      seen.set(String(step), dir);
      queue.push(step);
    }
  }
  return seen.get(String(cell)) ?? config.startDir;
}

/**
 * The direction of a bump from `cell`: OFF_LINE → the first of facing, left, right, back with no
 * line ahead; HIT_BLOCK → the first with a block on the next crossing. Null for other reasons
 * (grab / release failures happen on the spot).
 */
export function bumpDir(config: RobotLabConfig, cell: RobotCell, reason: string): RobotDir | null {
  if (reason !== 'OFF_LINE' && reason !== 'HIT_BLOCK') return null;
  const facing = arrivalDir(config, cell);
  const blocks = new Set((config.blocks ?? []).map(({ at }) => String(at)));
  return (
    ORDER[facing].find((dir) => {
      const next: [number, number] = [cell[0] + DIR_STEP[dir][0], cell[1] + DIR_STEP[dir][1]];
      return reason === 'OFF_LINE' ? !isCrossing(config.map, next) : blocks.has(String(next));
    }) ?? facing
  );
}
