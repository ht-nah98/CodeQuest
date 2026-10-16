// Robot lab time planner for the W8 boss order trap (curriculum.md §6.3.1): the fastest way to
// finish every job and end in the lab, over all orders and routes (Dijkstra on position,
// heading and where each cube is), optionally forcing which cube is picked up first.
// Costs and the "no driving onto a cube while holding one" rule follow robotlab/sim.ts.
import { shared } from './dsl';

export interface Cube {
  kind: 'neutralizer' | 'pollution';
  color: 'RED' | 'YELLOW' | 'GREEN';
  at: [number, number];
}
export interface Board {
  map: string[];
  startDir: 'N' | 'E' | 'S' | 'W';
  blocks: Cube[];
}

const DIRS = ['N', 'E', 'S', 'W'] as const;
const STEP: Record<string, [number, number]> = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
const STATION: Record<string, string> = { RED: 'r', YELLOW: 'y', GREEN: 'g' };

/**
 * Seconds of the fastest plan. `firstGrab` forces the index of the first cube picked up.
 * Cube state per cube: 0 = in place, 1 = held, 2 = done.
 */
export function fastest(board: Board, firstGrab?: number): number {
  const { costs } = shared.robotlab;
  const tile = (r: number, c: number): string | undefined => board.map[r]?.[c];
  const lab = board.map.findIndex((row) => row.includes('L'));
  const start: [number, number] = [lab, board.map[lab]?.indexOf('L') ?? 0];
  const n = board.blocks.length;
  type State = { r: number; c: number; d: number; s: number[]; grabbed: boolean };
  const key = (x: State): string =>
    `${String(x.r)},${String(x.c)},${String(x.d)},${x.s.join('')},${String(x.grabbed)}`;
  const dist = new Map<string, number>();
  // Bucket queue: every cost is a small integer.
  const buckets: State[][] = [];
  const push = (t: number, x: State): void => {
    const k = key(x);
    if ((dist.get(k) ?? Infinity) <= t) return;
    dist.set(k, t);
    (buckets[t] ??= []).push(x);
  };
  push(0, {
    r: start[0],
    c: start[1],
    d: DIRS.indexOf(board.startDir),
    s: Array<number>(n).fill(0),
    grabbed: false,
  });
  for (let t = 0; t < buckets.length; t++) {
    for (const x of buckets[t] ?? []) {
      if ((dist.get(key(x)) ?? Infinity) < t) continue;
      if (x.s.every((v) => v === 2) && tile(x.r, x.c) === 'L') return t;
      const holding = x.s.indexOf(1);
      const cubeAt = (r: number, c: number): number =>
        board.blocks.findIndex((b, i) => x.s[i] === 0 && b.at[0] === r && b.at[1] === c);
      // turns
      for (const turn of [1, 3]) push(t + costs.turn, { ...x, d: (x.d + turn) % 4 });
      // forward 1
      const [dr, dc] = STEP[DIRS[x.d] ?? 'N'] ?? [0, 0];
      const nr = x.r + dr;
      const nc = x.c + dc;
      const to = tile(nr, nc);
      if (to !== undefined && to !== '#' && !(cubeAt(nr, nc) !== -1 && holding !== -1)) {
        push(t + costs.forward, { ...x, r: nr, c: nc });
      }
      // grab
      const here = cubeAt(x.r, x.c);
      if (
        holding === -1 &&
        here !== -1 &&
        (x.grabbed || firstGrab === undefined || firstGrab === here)
      ) {
        const s = [...x.s];
        s[here] = 1;
        push(t + costs.grab, { ...x, s, grabbed: true });
      }
      // release where it finishes the job
      if (holding !== -1) {
        const cube = board.blocks[holding];
        const at = tile(x.r, x.c);
        const done = cube?.kind === 'pollution' ? at === 'L' : at === STATION[cube?.color ?? 'RED'];
        if (done) {
          const s = [...x.s];
          s[holding] = 2;
          push(t + costs.release, { ...x, s });
        }
      }
    }
  }
  return Infinity;
}
