/**
 * Exhaustive search for the fewest blocks that win a level (`npm run par`, level editor).
 *
 * Programs are straight-line: toolbox statement blocks and `cq_repeat` (every count in
 * `repeatTimes`, nested up to `maxDepth`). They are searched by size, smallest first, as a
 * shortest-path problem over simulation states: programs whose prefixes reach the same state
 * share their continuations, and a state already reached with fewer blocks is not expanded
 * again (any win from it would be smaller). The first size with a win is the minimum, and all
 * winning programs of that size are counted. Deterministic for the same level and options.
 */
import type { Level } from '@codequest/content-schema';
import { analyzeWorkspace, registerBlockSpecs, runLevel } from '@codequest/engine';
import {
  Budget,
  DEFAULT_MAX_DEPTH,
  DEFAULT_MAX_EXAMPLES,
  DEFAULT_REPEAT_TIMES,
  SearchAborted,
  countedWin,
  searchableKind,
  searchedLevel,
  type SearchOptions,
} from './budget';
import { formatProgram, programToWorkspace, type Program, type Statement } from './program';
import { FastSim, LOSS, WIN, type RepeatCode } from './sim';

export interface ShortestOptions extends SearchOptions {
  /** Largest program size tried. Default `par`, else `maxBlocks`, else 8; never > `maxBlocks`. */
  maxSize?: number;
}

export interface ShortestResult {
  /** Fewest blocks of a winning program, or null when none was found. */
  minBlocks: number | null;
  /** Winning programs of `minBlocks` blocks (a lower bound when not `complete`). */
  count: number;
  /** Up to `maxExamples` of them, in search order, each re-run with `runLevel`. */
  examples: Program[];
  /** Every program up to `searchedSize` blocks was tried, and all winners of the last size. */
  complete: boolean;
  /** Largest size whose programs were all tried. */
  searchedSize: number;
  /** Size limit of this search. */
  maxSize: number;
  /** Work units spent (see `SearchOptions.maxWork`). */
  work: number;
  /** Distinct simulation states reached. */
  states: number;
  /** Examples where `runLevel` disagrees with the fast replay (should stay empty). */
  mismatches: string[];
  /** Toolbox entries the search could not use, with the reason. */
  unsupported: string[];
}

/** A statement of the inner catalog with its outcome memoized per start state. */
interface Entry {
  size: number;
  statement: Statement;
  /** Atom index, or the loop. */
  code: number | RepeatCode;
  memo: Map<number, number> | null;
}

interface Node {
  count: number;
  example: Program;
}

const DEFAULT_MAX_SIZE = 8;

class ShortestSearch {
  private readonly catalogs = new Map<string, Entry[]>();
  private readonly sequences = new Map<string, Entry[][]>();
  private readonly times: readonly number[];
  private readonly maxTimes: number;

  constructor(
    private readonly sim: FastSim,
    private readonly budget: Budget,
    private readonly maxDepth: number,
    times: readonly number[],
  ) {
    this.times = [...new Set(times)]
      .filter((t) => Number.isInteger(t) && t > 0)
      .sort((a, b) => a - b);
    this.maxTimes = this.times[this.times.length - 1] ?? 0;
  }

  private get loops(): boolean {
    return this.sim.hasRepeat && this.maxDepth > 0 && this.times.length > 0;
  }

  apply(entry: Entry, state: number): number {
    this.budget.spend();
    if (typeof entry.code === 'number') return this.sim.step(state, entry.code);
    const memo = entry.memo ?? new Map<number, number>();
    entry.memo = memo;
    const known = memo.get(state);
    if (known !== undefined) return known;
    const result = this.sim.run(state, [entry.code]);
    memo.set(state, result);
    return result;
  }

  /** Statements with loops nested at most `depth` deep and exactly `size` blocks. */
  catalog(depth: number, size: number): Entry[] {
    const key = `${String(depth)}:${String(size)}`;
    const known = this.catalogs.get(key);
    if (known !== undefined) return known;
    const out: Entry[] = [];
    if (size === 1) {
      this.sim.atoms.forEach((atom, index) => {
        out.push({ size: 1, statement: atom.statement, code: index, memo: null });
      });
    } else if (depth > 0 && this.loops) {
      for (const body of this.sequence(depth - 1, size - 1)) {
        for (const times of this.times) {
          this.budget.spend();
          out.push({
            size,
            statement: { repeat: times, body: body.map((entry) => entry.statement) },
            code: { times, body: body.map((entry) => entry.code) },
            memo: null,
          });
        }
      }
    }
    this.catalogs.set(key, out);
    return out;
  }

  /** Sequences of catalog statements of `depth` with exactly `size` blocks. */
  sequence(depth: number, size: number): Entry[][] {
    if (size === 0) return [[]];
    const key = `${String(depth)}:${String(size)}`;
    const known = this.sequences.get(key);
    if (known !== undefined) return known;
    const out: Entry[][] = [];
    for (let first = 1; first <= size; first++) {
      for (const entry of this.catalog(depth, first)) {
        for (const rest of this.sequence(depth, size - first)) out.push([entry, ...rest]);
      }
    }
    this.sequences.set(key, out);
    return out;
  }

  private runBody(state: number, body: readonly Entry[]): number {
    let current = state;
    for (const entry of body) {
      current = this.apply(entry, current);
      if (current < 0) return current;
    }
    return current;
  }

  /**
   * Calls `emit` for every top-level statement of exactly `size` blocks run from `state`,
   * except those that lose inside the first loop pass (all counts lose alike).
   */
  statements(
    state: number,
    size: number,
    emit: (statement: () => Statement, outcome: number) => void,
  ): void {
    if (size === 1) {
      this.sim.atoms.forEach((atom, index) => {
        this.budget.spend();
        emit(() => atom.statement, this.sim.step(state, index));
      });
      return;
    }
    if (!this.loops) return;
    const inner = this.maxDepth - 1;
    const close = (body: Entry[], afterFirst: number): void => {
      let outcome = afterFirst;
      for (let t = 1; t <= this.maxTimes; t++) {
        if (t > 1 && outcome >= 0) outcome = this.runBody(outcome, body);
        if (this.times.includes(t)) {
          const times = t;
          emit(() => ({ repeat: times, body: body.map((entry) => entry.statement) }), outcome);
        }
      }
    };
    // Bodies are built block by block while running the first pass, so a body prefix that
    // already loses is never extended.
    const grow = (body: Entry[], left: number, current: number): void => {
      for (let first = 1; first <= left; first++) {
        for (const entry of this.catalog(inner, first)) {
          const next = this.apply(entry, current);
          if (next === LOSS) continue;
          const whole = [...body, entry];
          if (first === left) close(whole, next);
          // A win with blocks still to add means a smaller program wins: never at the minimum.
          else if (next !== WIN) grow(whole, left - first, next);
        }
      }
    };
    grow([], size - 1, state);
  }
}

/**
 * Finds the fewest blocks that win `level` with its toolbox (modes build, parsons, bughunt),
 * how many programs of that size win, and a few examples verified with `runLevel`. On a level
 * with `starGoals` a win must also meet every goal, unless `options.ignoreStarGoals`.
 * Throws for modes without a program (predict, creative) and unknown kinds.
 */
export function findShortestPrograms(
  original: Level,
  options: ShortestOptions = {},
): ShortestResult {
  const level = searchedLevel(original, options);
  const kind = searchableKind(level, options);
  const sim = new FastSim(kind, level);
  const budget = new Budget(options);
  const maxExamples = options.maxExamples ?? DEFAULT_MAX_EXAMPLES;
  const maxSize = Math.min(
    options.maxSize ?? level.par ?? level.maxBlocks ?? DEFAULT_MAX_SIZE,
    level.maxBlocks ?? Infinity,
  );
  const search = new ShortestSearch(
    sim,
    budget,
    options.maxDepth ?? DEFAULT_MAX_DEPTH,
    options.repeatTimes ?? DEFAULT_REPEAT_TIMES,
  );

  const layers: Array<Map<number, Node>> = [new Map([[sim.initial, { count: 1, example: [] }]])];
  const firstLayer = new Map<number, number>([[sim.initial, 0]]);
  let minBlocks: number | null = null;
  let count = 0;
  const examples: Program[] = [];
  let searchedSize = 0;
  let complete = true;
  const win = (node: Node, last: Statement | null): void => {
    count += node.count;
    if (examples.length < maxExamples) {
      examples.push(last === null ? node.example : [...node.example, last]);
    }
  };

  try {
    for (let size = 1; size <= maxSize; size++) {
      const layer = new Map<number, Node>();
      layers.push(layer);
      for (let from = 0; from < size; from++) {
        for (const [state, node] of layers[from] ?? []) {
          search.statements(state, size - from, (statement, outcome) => {
            if (outcome === LOSS) return;
            if (outcome === WIN) {
              minBlocks = size;
              win(node, statement());
              return;
            }
            if ((firstLayer.get(outcome) ?? size) < size) return;
            firstLayer.set(outcome, size);
            const known = layer.get(outcome);
            if (known !== undefined) known.count += node.count;
            else layer.set(outcome, { count: node.count, example: [...node.example, statement()] });
          });
        }
      }
      // Programs that end without a stop and win on `evaluate`.
      for (const [state, node] of layer) {
        if (sim.finish(state)) {
          minBlocks = size;
          win(node, null);
        }
      }
      searchedSize = size;
      if (minBlocks !== null) break;
    }
  } catch (error) {
    if (!(error instanceof SearchAborted)) throw error;
    complete = false;
  }

  registerBlockSpecs(kind.blocks);
  const mismatches: string[] = [];
  for (const program of examples) {
    const workspace = programToWorkspace(program);
    const outcome = runLevel({ kind, level, workspace });
    const blocks = analyzeWorkspace(workspace).blocksUsed;
    if (!countedWin(outcome) || blocks !== minBlocks) {
      const missed = outcome.result === 'success' && !countedWin(outcome) ? ' misses a goal' : '';
      mismatches.push(
        `${formatProgram(program)}: runLevel ${outcome.result} ${outcome.reasonCode ?? ''}${missed}, ${String(blocks)} blocks`.trim(),
      );
    }
  }

  return {
    minBlocks,
    count,
    examples,
    complete,
    searchedSize,
    maxSize,
    work: budget.work,
    states: sim.stateCount,
    mismatches,
    unsupported: sim.unsupported,
  };
}
