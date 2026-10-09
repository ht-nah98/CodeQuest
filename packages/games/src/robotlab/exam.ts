// "Đề mới" (P3-08, game-kinds.md §3.3 "Đề mới và thi thử"): a seeded, deterministic layout of
// the competition blocks on a fixed city board, with a cheap planner that proves a scoring plan
// fits the clock. Pure and headless: no Math.random, no Date, no DOM.
import type { WorkspaceJson } from '@codequest/content-schema';
import { mulberry32 } from '@codequest/engine';
import { boardOfMap, type RobotBoard } from './boards';
import {
  ROBOT_COLORS,
  ROBOT_DIRS,
  ROBOT_FORWARD_MAX,
  STATION_OF,
  type RobotBlock,
  type RobotColor,
  type RobotDir,
  type RobotLabConfig,
  type RobotLabRules,
} from './config';
import type { RobotCell } from './state';

/** Seeds a child or the coach can type: "Đề số 1" … "Đề số 9999". */
export const EXAM_SEED_MIN = 1;
export const EXAM_SEED_MAX = 9999;

/** Fairness of a layout (checked by `examIssues`, so tests and content:check use the same). */
export const EXAM_FAIRNESS = {
  /** Crossings within this many line steps of the lab count as "next to the lab"… */
  nearLabSteps: 2,
  /** …and at most this many blocks may lie there. */
  nearLabMax: 1,
} as const;

/** Layouts tried per seed before giving up (never reached on the known boards: unit tested). */
const ATTEMPTS = 300;

export type PlacedBlock = RobotBlock & { at: [number, number] };

/** One action of a plan, as the child would write it. */
export type PlanStep =
  | { readonly do: 'forward'; readonly n: number }
  | { readonly do: 'left' | 'right' | 'grab' | 'release' };

export interface ExamPlan {
  readonly steps: readonly PlanStep[];
  /** Points at the end of the plan (shared rules of the config). */
  readonly score: number;
  /** Seconds the plan uses (≤ timeLimit). */
  readonly seconds: number;
  /** Jobs finished (not counting the return to the lab). */
  readonly jobs: number;
  /** Whether the plan ends in the lab. */
  readonly home: boolean;
}

export interface Exam {
  readonly seed: number;
  /** In kit order: fences, then neutralisers, then pollution. */
  readonly blocks: readonly PlacedBlock[];
  /** A plan that reaches `target` within the clock (the solvability proof). */
  readonly plan: ExamPlan;
}

/** Whether `seed` is a đề number ("Đề số …"). */
export function isExamSeed(seed: number): boolean {
  return Number.isInteger(seed) && seed >= EXAM_SEED_MIN && seed <= EXAM_SEED_MAX;
}

// ---- Grid and routes -------------------------------------------------------------------------

const STEP: Readonly<Record<RobotDir, RobotCell>> = {
  N: [-1, 0],
  E: [0, 1],
  S: [1, 0],
  W: [0, -1],
};

/** A node is a crossing and a heading: `cell * 4 + dir index`. */
interface Grid {
  readonly map: readonly string[];
  readonly rows: number;
  readonly cols: number;
}

type Move = 'F' | 'L' | 'R';

interface Search {
  dist: Float64Array;
  prev: Int32Array;
  move: Array<Move | null>;
}

const cellIndex = (grid: Grid, [r, c]: RobotCell): number => r * grid.cols + c;
const cellOf = (grid: Grid, index: number): [number, number] => [
  Math.floor(index / grid.cols),
  index % grid.cols,
];

function isCrossing(grid: Grid, [r, c]: RobotCell): boolean {
  const tile = grid.map[r]?.[c];
  return tile !== undefined && tile !== '#';
}

/**
 * Cheapest moves (forward one crossing, turn) from `sources` (node → seconds already used).
 * `blocked` crossings hold a block: Bíp never drives through one; with empty hands it may stop
 * on one (the node is reached but not expanded), holding a block it may not enter at all.
 * Costs are whole seconds (schema), so a bucket queue gives Dijkstra in order of seconds;
 * nodes of one bucket go first in, first out, so the result is deterministic.
 */
function search(
  grid: Grid,
  rules: RobotLabRules,
  sources: ReadonlyArray<readonly [number, number]>,
  blocked: ReadonlySet<number>,
  holding: boolean,
): Search {
  const size = grid.rows * grid.cols * 4;
  const dist = new Float64Array(size).fill(Infinity);
  const prev = new Int32Array(size).fill(-1);
  const move: Array<Move | null> = new Array<Move | null>(size).fill(null);
  const done = new Uint8Array(size);
  // Still on a source crossing (only turned since): may drive off a block it stands on.
  const onSource = new Uint8Array(size);
  const buckets: number[][] = [];
  const push = (node: number, d: number): void => {
    (buckets[d] ??= []).push(node);
  };
  for (const [node, cost] of sources) {
    if (cost < (dist[node] ?? Infinity)) {
      dist[node] = cost;
      push(node, cost);
    }
    onSource[node] = 1;
  }
  for (let d = 0; d < buckets.length; d++) {
    const bucket = buckets[d];
    if (bucket === undefined) continue;
    for (let k = 0; k < bucket.length; k++) {
      const u = bucket[k] ?? 0;
      if (done[u] === 1 || dist[u] !== d) continue;
      done[u] = 1;
      const cell = Math.floor(u / 4);
      // Stopped on a block: the program may end here, it cannot drive on.
      if (blocked.has(cell) && onSource[u] === 0) continue;
      const dir = u % 4;
      const relax = (v: number, cost: number, m: Move): void => {
        if (d + cost < (dist[v] ?? Infinity)) {
          dist[v] = d + cost;
          prev[v] = u;
          move[v] = m;
          onSource[v] = m === 'F' ? 0 : (onSource[u] ?? 0);
          push(v, d + cost);
        }
      };
      relax(cell * 4 + ((dir + 3) % 4), rules.costs.turn, 'L');
      relax(cell * 4 + ((dir + 1) % 4), rules.costs.turn, 'R');
      const [r, c] = cellOf(grid, cell);
      const [dr, dc] = STEP[ROBOT_DIRS[dir] ?? 'N'];
      const next: RobotCell = [r + dr, c + dc];
      if (!isCrossing(grid, next)) continue;
      const nextCell = cellIndex(grid, next);
      if (blocked.has(nextCell) && holding) continue;
      relax(nextCell * 4 + dir, rules.costs.forward, 'F');
    }
  }
  return { dist, prev, move };
}

/** The cheapest node on `cell`, or -1 when no heading reaches it. */
function bestNode(found: Search, cell: number): number {
  let node = -1;
  for (let d = 0; d < 4; d++) {
    const v = cell * 4 + d;
    if ((found.dist[v] ?? Infinity) < (node === -1 ? Infinity : (found.dist[node] ?? Infinity))) {
      node = v;
    }
  }
  return node;
}

/** Moves from a source of `found` to `node`, in order. */
function movesTo(found: Search, node: number): Move[] {
  const out: Move[] = [];
  for (let v = node; found.prev[v] !== -1 && v !== -1; v = found.prev[v] ?? -1) {
    const m = found.move[v];
    if (m) out.push(m);
  }
  return out.reverse();
}

/** Plan steps of a move list: turns as they are, runs of forward merged (at most 9 per step). */
function stepsOf(moves: readonly Move[]): PlanStep[] {
  const steps: PlanStep[] = [];
  for (const m of moves) {
    if (m === 'L') steps.push({ do: 'left' });
    else if (m === 'R') steps.push({ do: 'right' });
    else {
      const last = steps.at(-1);
      if (last?.do === 'forward' && last.n < ROBOT_FORWARD_MAX) {
        steps[steps.length - 1] = { do: 'forward', n: last.n + 1 };
      } else steps.push({ do: 'forward', n: 1 });
    }
  }
  return steps;
}

// ---- Planner ---------------------------------------------------------------------------------

interface PlanBlock {
  readonly block: RobotBlock;
  /** Crossing index, or null once retrieved into the lab. */
  at: number | null;
}

function findLab(grid: Grid): number {
  for (const [r, row] of grid.map.entries()) {
    const c = row.indexOf('L');
    if (c !== -1) return cellIndex(grid, [r, c]);
  }
  return -1;
}

function tileOf(grid: Grid, cell: number): string {
  const [r, c] = cellOf(grid, cell);
  return grid.map[r]?.[c] ?? '#';
}

/** Whether a block already scores where it lies (a fence on Z, a neutraliser on its station). */
function scoring(grid: Grid, item: PlanBlock): boolean {
  if (item.at === null) return item.block.kind === 'pollution';
  const tile = tileOf(grid, item.at);
  if (item.block.kind === 'fence') return tile === 'Z';
  if (item.block.kind === 'neutralizer') return tile === STATION_OF[item.block.color];
  return false;
}

function points(rules: RobotLabRules, block: RobotBlock): number {
  if (block.kind === 'fence') return rules.points.contain;
  return block.kind === 'neutralizer' ? rules.points.neutralize : rules.points.retrieve;
}

/** Where a held block may be released for points. */
function targetsOf(grid: Grid, block: RobotBlock, lab: number): number[] {
  if (block.kind === 'pollution') return [lab];
  const tile = block.kind === 'fence' ? 'Z' : STATION_OF[block.color];
  const out: number[] = [];
  grid.map.forEach((row, r) => {
    Array.from(row).forEach((t, c) => {
      if (t === tile) out.push(cellIndex(grid, [r, c]));
    });
  });
  return out;
}

interface Job {
  index: number;
  /** Moves to the block's crossing (then grab), and from there to the target (then release). */
  fetch: Move[];
  carry: Move[];
  end: number;
  t: number;
  gain: number;
}

/** Every job worth doing from `node` at `t`, cheapest route to each target. */
function jobsFrom(
  grid: Grid,
  rules: RobotLabRules,
  items: readonly PlanBlock[],
  node: number,
  t: number,
  lab: number,
): Job[] {
  const lying = (skip: number): Set<number> =>
    new Set(items.flatMap((item, i) => (i === skip || item.at === null ? [] : [item.at])));
  const toBlock = search(grid, rules, [[node, t]], lying(-1), false);
  const jobs: Job[] = [];
  items.forEach((item, index) => {
    if (item.at === null || scoring(grid, item)) return;
    const from = item.at;
    const arrivals: Array<[number, number]> = [];
    for (let d = 0; d < 4; d++) {
      const v = from * 4 + d;
      const cost = toBlock.dist[v] ?? Infinity;
      if (cost < Infinity) arrivals.push([v, cost + rules.costs.grab]);
    }
    if (arrivals.length === 0) return;
    const others = lying(index);
    const carry = search(grid, rules, arrivals, others, true);
    for (const target of targetsOf(grid, item.block, lab)) {
      if (others.has(target)) continue;
      const end = bestNode(carry, target);
      if (end === -1) continue;
      const finish = (carry.dist[end] ?? Infinity) + rules.costs.release;
      if (finish > rules.timeLimit) continue;
      // The carry search started on the block's crossing: its first node is where Bíp arrived.
      let first = end;
      while ((carry.prev[first] ?? -1) !== -1) first = carry.prev[first] ?? -1;
      jobs.push({
        index,
        fetch: movesTo(toBlock, first),
        carry: movesTo(carry, end),
        end,
        t: finish,
        gain: points(rules, item.block),
      });
    }
  });
  return jobs;
}

/**
 * A greedy plan on a resolved config: from the start, repeatedly do the job with the most points
 * per second that still fits the clock (grab at the block, release on a free target), then drive
 * home if there is time. Cheap (no program search); used as the solvability proof of a đề.
 */
export function planExam(config: RobotLabConfig): ExamPlan {
  const grid: Grid = { map: config.map, rows: config.map.length, cols: config.map[0]?.length ?? 0 };
  const { rules } = config;
  const lab = findLab(grid);
  const items: PlanBlock[] = (config.blocks ?? []).map(({ at, ...block }) => ({
    block: block,
    at: cellIndex(grid, at),
  }));
  const startCell = config.start === undefined ? lab : cellIndex(grid, config.start);
  let node = startCell * 4 + ROBOT_DIRS.indexOf(config.startDir);
  let t = 0;
  let jobs = 0;
  let score = 0;
  const steps: PlanStep[] = [];
  for (;;) {
    const options = jobsFrom(grid, rules, items, node, t, lab);
    let pick: Job | undefined;
    for (const job of options) {
      const rate = job.gain / Math.max(1, job.t - t);
      const pickRate = pick === undefined ? -1 : pick.gain / Math.max(1, pick.t - t);
      if (rate > pickRate) pick = job;
    }
    if (pick === undefined) break;
    steps.push(...stepsOf(pick.fetch), { do: 'grab' }, ...stepsOf(pick.carry), { do: 'release' });
    const item = items[pick.index];
    if (item) {
      const endCell = Math.floor(pick.end / 4);
      item.at = item.block.kind === 'pollution' && endCell === lab ? null : endCell;
    }
    node = pick.end;
    t = pick.t;
    jobs += 1;
    score += pick.gain;
  }
  let home = Math.floor(node / 4) === lab;
  if (!home) {
    const lying = new Set(items.flatMap((item) => (item.at === null ? [] : [item.at])));
    const back = search(grid, rules, [[node, t]], lying, false);
    const end = bestNode(back, lab);
    if (end !== -1 && (back.dist[end] ?? Infinity) <= rules.timeLimit) {
      steps.push(...stepsOf(movesTo(back, end)));
      t = back.dist[end] ?? t;
      home = true;
    }
  }
  if (home) score += rules.points.return;
  return { steps, score, seconds: t, jobs, home };
}

// ---- Fairness and generation -----------------------------------------------------------------

/** Line steps from `from` to every crossing, ignoring blocks and headings (BFS). */
function lineSteps(grid: Grid, from: number): Int32Array {
  const steps = new Int32Array(grid.rows * grid.cols).fill(-1);
  steps[from] = 0;
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const cell = queue[i] ?? 0;
    const [r, c] = cellOf(grid, cell);
    for (const dir of ROBOT_DIRS) {
      const next: RobotCell = [r + STEP[dir][0], c + STEP[dir][1]];
      if (!isCrossing(grid, next)) continue;
      const n = cellIndex(grid, next);
      if (steps[n] !== -1) continue;
      steps[n] = (steps[cell] ?? 0) + 1;
      queue.push(n);
    }
  }
  return steps;
}

/**
 * Why a layout is not a fair đề on `board` (empty when fair): blocks only on free `.` crossings
 * (not the bridges), never side by side, at most `nearLabMax` within `nearLabSteps` line steps of
 * the lab, the board's kit exactly, and **every** job doable alone from the start and back to the
 * lab within the clock (with the other blocks in place).
 */
export function examIssues(
  board: RobotBoard,
  blocks: readonly PlacedBlock[],
  rules: RobotLabRules,
): string[] {
  const issues: string[] = [];
  const grid: Grid = { map: board.map, rows: board.map.length, cols: board.map[0]?.length ?? 0 };
  const lab = findLab(grid);
  const fromLab = lineSteps(grid, lab);
  const clear = new Set(board.keepClear.map((cell) => cellIndex(grid, cell)));
  const cells = blocks.map((block) => cellIndex(grid, block.at));
  const key = (cell: RobotCell): string => `${String(cell[0])},${String(cell[1])}`;
  blocks.forEach((block, i) => {
    const cell = cells[i] ?? -1;
    if (board.map[block.at[0]]?.[block.at[1]] !== '.') issues.push(`${key(block.at)} is not "."`);
    if (clear.has(cell)) issues.push(`${key(block.at)} must stay clear`);
    if (cells.indexOf(cell) !== i) issues.push(`${key(block.at)} holds two blocks`);
    const [r, c] = block.at;
    const touching = blocks.some(
      (other, j) => j !== i && Math.abs(other.at[0] - r) + Math.abs(other.at[1] - c) === 1,
    );
    if (touching) issues.push(`${key(block.at)} touches another block`);
  });
  const near = cells.filter((cell) => {
    const steps = fromLab[cell] ?? -1;
    return steps !== -1 && steps <= EXAM_FAIRNESS.nearLabSteps;
  }).length;
  if (near > EXAM_FAIRNESS.nearLabMax) {
    issues.push(
      `${String(near)} blocks within ${String(EXAM_FAIRNESS.nearLabSteps)} steps of the lab`,
    );
  }
  const { kit } = board;
  const fences = blocks.filter((block) => block.kind === 'fence').length;
  const pollution = blocks.filter((block) => block.kind === 'pollution').length;
  const neutralizers = blocks
    .flatMap((block) => (block.kind === 'neutralizer' ? [block.color] : []))
    .sort()
    .join(',');
  if (
    fences !== kit.fences ||
    pollution !== kit.pollution ||
    neutralizers !== [...kit.neutralizers].sort().join(',')
  ) {
    issues.push('blocks do not match the board kit');
  }
  if (issues.length > 0) return issues;

  // Every job alone: start → block → target → lab within the clock.
  const items: PlanBlock[] = blocks.map(({ at, ...block }) => ({
    block: block,
    at: cellIndex(grid, at),
  }));
  const start = lab * 4 + ROBOT_DIRS.indexOf(board.startDir);
  const jobs = jobsFrom(grid, rules, items, start, 0, lab);
  items.forEach((item, index) => {
    const doable = jobs.some((job) => {
      if (job.index !== index) return false;
      const endCell = Math.floor(job.end / 4);
      if (endCell === lab) return true;
      const lying = new Set(
        items.flatMap((other, i) =>
          i === index ? [endCell] : other.at === null ? [] : [other.at],
        ),
      );
      const back = search(grid, rules, [[job.end, job.t]], lying, false);
      const end = bestNode(back, lab);
      return end !== -1 && (back.dist[end] ?? Infinity) <= rules.timeLimit;
    });
    if (!doable) {
      const [r, c] = cellOf(grid, item.at ?? 0);
      issues.push(`the ${item.block.kind} at ${String(r)},${String(c)} cannot be done in time`);
    }
  });
  return issues;
}

/** A fresh config of `board` with `blocks`, the given rules and goal. */
function boardConfig(
  board: RobotBoard,
  blocks: readonly PlacedBlock[],
  rules: RobotLabRules,
  target: number,
): RobotLabConfig {
  return {
    map: [...board.map],
    startDir: board.startDir,
    blocks: blocks.map((block) => ({ ...block, at: [block.at[0], block.at[1]] })),
    goal: { type: 'score', target },
    rules,
  };
}

/**
 * The đề number `seed` of `board`: the kit's blocks placed by a mulberry32 stream of the seed,
 * re-drawn until the layout is fair (`examIssues`) and the greedy plan reaches `target` points
 * within the clock. Same seed, board, rules and target ⇒ same layout, on every machine.
 * Throws for a seed outside 1–9999, or (never on the known boards, see the tests) when no fair
 * layout is found.
 */
export function generateExam(
  board: RobotBoard,
  seed: number,
  rules: RobotLabRules,
  target: number,
): Exam {
  if (!isExamSeed(seed)) {
    throw new Error(
      `exam seed must be an integer ${String(EXAM_SEED_MIN)}–${String(EXAM_SEED_MAX)}`,
    );
  }
  const grid: Grid = { map: board.map, rows: board.map.length, cols: board.map[0]?.length ?? 0 };
  const clear = new Set(board.keepClear.map((cell) => cellIndex(grid, cell)));
  const free: number[] = [];
  board.map.forEach((row, r) => {
    Array.from(row).forEach((tile, c) => {
      const cell = cellIndex(grid, [r, c]);
      if (tile === '.' && !clear.has(cell)) free.push(cell);
    });
  });
  const kinds: RobotBlock[] = [
    ...Array.from({ length: board.kit.fences }, (): RobotBlock => ({ kind: 'fence' })),
    ...board.kit.neutralizers.map((color): RobotBlock => ({ kind: 'neutralizer', color })),
    ...Array.from({ length: board.kit.pollution }, (): RobotBlock => ({
      kind: 'pollution',
      color: 'RED',
    })),
  ];
  const lab = findLab(grid);
  const fromLab = lineSteps(grid, lab);
  const rng = mulberry32(seed);
  const pickInt = (n: number): number => Math.min(n - 1, Math.floor(rng() * n));
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const order = [...free];
    for (let i = order.length - 1; i > 0; i--) {
      const j = pickInt(i + 1);
      [order[i], order[j]] = [order[j] ?? 0, order[i] ?? 0];
    }
    const chosen: number[] = [];
    let near = 0;
    for (const cell of order) {
      if (chosen.length === kinds.length) break;
      const [r, c] = cellOf(grid, cell);
      const touches = chosen.some((other) => {
        const [r2, c2] = cellOf(grid, other);
        return Math.abs(r - r2) + Math.abs(c - c2) === 1;
      });
      if (touches) continue;
      const steps = fromLab[cell] ?? -1;
      const isNear = steps !== -1 && steps <= EXAM_FAIRNESS.nearLabSteps;
      if (isNear && near >= EXAM_FAIRNESS.nearLabMax) continue;
      if (isNear) near += 1;
      chosen.push(cell);
    }
    // Pollution colours do not change the points; they matter to `khối ở chỗ Bíp màu …?`.
    const blocks: PlacedBlock[] = kinds.map((kind, i) => {
      const at = cellOf(grid, chosen[i] ?? 0);
      if (kind.kind !== 'pollution') return { ...kind, at };
      const color: RobotColor = ROBOT_COLORS[pickInt(ROBOT_COLORS.length)] ?? 'RED';
      return { kind: 'pollution', color, at };
    });
    if (chosen.length < kinds.length) continue;
    if (examIssues(board, blocks, rules).length > 0) continue;
    const plan = planExam(boardConfig(board, blocks, rules, target));
    if (plan.score < target) continue;
    return { seed, blocks, plan };
  }
  throw new Error(`no fair layout for seed ${String(seed)} on board ${board.id}`);
}

/**
 * `config` (a resolved config on a known board, `score` goal) with the blocks of đề `seed`.
 * Everything else (rules, goal, start) is kept. Throws when the map is not a known board or the
 * goal is not `score`.
 */
export function examConfig(config: RobotLabConfig, seed: number): RobotLabConfig {
  const board = boardOfMap(config.map);
  if (board === undefined) throw new Error('exam config: map is not a known board');
  if (config.goal.type !== 'score') throw new Error('exam config: goal must be score');
  const exam = generateExam(board, seed, config.rules, config.goal.target);
  return { ...config, blocks: exam.blocks.map((block) => ({ ...block, at: [...block.at] })) };
}

/** A plan as a program under "khi bắt đầu" (content block ids `p1`, `p2`, …). */
export function planWorkspace(steps: readonly PlanStep[]): WorkspaceJson {
  let next: Record<string, unknown> | undefined;
  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i];
    if (step === undefined) continue;
    const type =
      step.do === 'forward'
        ? 'robot_forward'
        : step.do === 'left'
          ? 'robot_turn_left'
          : step.do === 'right'
            ? 'robot_turn_right'
            : step.do === 'grab'
              ? 'robot_grab'
              : 'robot_release';
    next = {
      type,
      id: `p${String(i + 1)}`,
      ...(step.do === 'forward' && { fields: { N: step.n } }),
      ...(next !== undefined && { next: { block: next } }),
    };
  }
  const start = {
    type: 'cq_start',
    id: 'start',
    x: 40,
    y: 40,
    deletable: false,
    ...(next !== undefined && { next: { block: next } }),
  };
  return { blocks: { languageVersion: 0, blocks: [start] } };
}
