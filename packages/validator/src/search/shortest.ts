/**
 * Exhaustive search for the fewest blocks that win a level (`npm run par`, level editor).
 *
 * Programs are built from the toolbox: statement blocks, `cq_repeat` (every count in
 * `repeatTimes`), `cq_repeat_var` (every box the toolbox allows, ADR-0022), and with sensors `cq_if`, `cq_if_else` (either branch may be empty, not both)
 * and `cq_repeat_until` (P2-11, ADR-0018), loops nested up to `maxDepth` and `maxLoopDepth`,
 * blocks per type up to `maxInstances`. They are searched by size, smallest first, as a
 * shortest-path problem over simulation states: programs whose prefixes reach the same state
 * (with the same `maxInstances` usage) share their continuations, and a state already reached
 * with fewer blocks is not expanded again (any win from it would be smaller). The first size
 * with a win is the minimum, and all winning programs of that size are counted.
 *
 * Statements that cannot be part of a smallest program are skipped, which never changes the
 * minimum or the count: a body that loses or wins before its last block, a top-level `cq_if`
 * whose question answers the same on every map still running (inlining the branch is smaller),
 * a top-level `cq_repeat_until` that asks ✔ at once everywhere (it does nothing), a top-level
 * `cq_repeat_var` whose box is 0 on every map still running (likewise), a branch or
 * loop body that is empty. Deterministic for the same level and options.
 */
import type { Level } from '@codequest/content-schema';
import {
  analyzeWorkspace,
  CQ_IF,
  CQ_IF_ELSE,
  CQ_REPEAT,
  CQ_REPEAT_UNTIL,
  CQ_REPEAT_VAR,
  registerBlockSpecs,
  runLevel,
} from '@codequest/engine';
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
import { InstanceLimits, type Usage } from './limits';
import { formatProgram, programToWorkspace, type Program, type Statement } from './program';
import { FastSim, LOSS, WIN, type CodeItem } from './sim';

export interface ShortestOptions extends SearchOptions {
  /** Largest program size tried. Default `par`, else `maxBlocks`, else 8; never > `maxBlocks`. */
  maxSize?: number;
  /**
   * Memory cap: catalog statements and body sequences kept (default `MAX_CATALOG_ENTRIES`).
   * Past it the search stops like a spent budget.
   */
  maxCatalogEntries?: number;
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
  /** Atom index, or the control block. */
  code: CodeItem;
  memo: Map<number, number> | null;
  /** Its `maxInstances` usage. */
  usage: Usage;
}

interface Node {
  count: number;
  example: Program;
  usage: Usage;
}

/** Called for each statement found: built lazily, its outcome and the usage so far. */
type Emit = (statement: () => Statement, outcome: number, usage: Usage) => void;

const DEFAULT_MAX_SIZE = 8;
/**
 * Most catalog statements kept (each a small object with its body, a few hundred bytes): past
 * it the search stops like a spent budget, so large conditional catalogs (big sizes in the level
 * editor) cannot run the Web Worker out of memory.
 */
export const MAX_CATALOG_ENTRIES = 1_500_000;
/**
 * A lower cap for the level editor's Web Worker (pass it as `maxCatalogEntries` next to
 * `WORKER_MAX_WORK`): a few hundred thousand entries stay well under 200 MB.
 */
export const WORKER_MAX_CATALOG_ENTRIES = 300_000;

/** The usage of a body (entries already fit one by one), or null when it goes over a limit. */
function bodyUsage(limits: InstanceLimits, entries: readonly Entry[], base: Usage): Usage | null {
  return limits.sum([base, ...entries.map((entry) => entry.usage)]);
}

class ShortestSearch {
  private readonly catalogs = new Map<string, Entry[]>();
  private readonly sequences = new Map<string, Entry[][]>();
  private readonly times: readonly number[];
  private readonly maxTimes: number;
  private catalogSize = 0;

  constructor(
    private readonly sim: FastSim,
    private readonly budget: Budget,
    private readonly maxDepth: number,
    times: readonly number[],
    readonly limits: InstanceLimits,
    private readonly maxCatalogEntries = MAX_CATALOG_ENTRIES,
  ) {
    this.times = [...new Set(times)]
      .filter((t) => Number.isInteger(t) && t > 0)
      .sort((a, b) => a - b);
    this.maxTimes = this.times[this.times.length - 1] ?? 0;
  }

  private get loops(): boolean {
    return this.sim.hasRepeat && this.maxDepth > 0 && this.times.length > 0;
  }

  /** Whether the toolbox offers a control block that takes a condition, and a sensor for it. */
  private offers(type: string): boolean {
    return this.sim.controls.has(type) && this.sim.conds.length > 0;
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

  /** `apply` on the maps of `mask` only (a branch of a top-level `cq_if`, a first loop pass). */
  private applyMasked(entry: Entry, state: number, mask: number): number {
    if (mask === this.sim.liveMask(state)) return this.apply(entry, state);
    this.budget.spend();
    const memo = entry.memo ?? new Map<number, number>();
    entry.memo = memo;
    // Masks have one bit per map (≤ 3 maps), so this never collides with a plain state key.
    const key = -1 - (state * 8 + mask);
    const known = memo.get(key);
    if (known !== undefined) return known;
    const result = this.sim.runMasked(state, [entry.code], mask);
    memo.set(key, result);
    return result;
  }

  private push(out: Entry[], entry: Omit<Entry, 'memo'>): void {
    this.budget.spend();
    this.count();
    out.push({ ...entry, memo: null });
  }

  /**
   * Counts one kept catalog entry or body sequence towards the memory cap. Not budget work:
   * searches without conditions keep spending exactly what they did before P2-11.
   */
  private count(): void {
    if (++this.catalogSize > this.maxCatalogEntries) {
      throw new SearchAborted('memory cap: too many catalog statements');
    }
  }

  /** Statements with loops nested at most `depth` deep and exactly `size` blocks. */
  catalog(depth: number, size: number): Entry[] {
    const key = `${String(depth)}:${String(size)}`;
    const known = this.catalogs.get(key);
    if (known !== undefined) return known;
    const out: Entry[] = [];
    const { limits, sim } = this;
    if (size === 1) {
      sim.atoms.forEach((atom, index) => {
        out.push({
          size: 1,
          statement: atom.statement,
          code: index,
          memo: null,
          usage: limits.of(atom.statement.block),
        });
      });
    } else {
      if (depth > 0 && this.loops) {
        for (const body of this.sequence(depth - 1, size - 1)) {
          const usage = bodyUsage(limits, body, limits.of(CQ_REPEAT));
          for (const times of this.times) {
            this.budget.spend();
            if (usage === null) continue;
            this.count();
            out.push({
              size,
              statement: { repeat: times, body: body.map((entry) => entry.statement) },
              code: { times, body: body.map((entry) => entry.code) },
              memo: null,
              usage,
            });
          }
        }
      }
      if (depth > 0 && this.sim.repeatVars.length > 0) {
        for (const body of this.sequence(depth - 1, size - 1)) {
          const usage = bodyUsage(limits, body, limits.of(CQ_REPEAT_VAR));
          for (const timesVar of this.sim.repeatVars) {
            this.budget.spend();
            if (usage === null) continue;
            this.count();
            out.push({
              size,
              statement: {
                repeatVar: sim.variables[timesVar]?.id ?? '',
                body: body.map((entry) => entry.statement),
              },
              code: { timesVar, body: body.map((entry) => entry.code) },
              memo: null,
              usage,
            });
          }
        }
      }
      if (size >= 3) this.conditionalCatalog(depth, size, out);
    }
    this.catalogs.set(key, out);
    return out;
  }

  /** The `cq_repeat_until`, `cq_if` and `cq_if_else` statements of `catalog(depth, size)`. */
  private conditionalCatalog(depth: number, size: number, out: Entry[]): void {
    const { limits, sim } = this;
    sim.conds.forEach((cond, index) => {
      const asked = limits.of(cond.condition.block);
      if (depth > 0 && this.offers(CQ_REPEAT_UNTIL)) {
        const base = limits.add(limits.of(CQ_REPEAT_UNTIL), asked);
        for (const body of this.sequence(depth - 1, size - 2)) {
          const usage = base === null ? null : bodyUsage(limits, body, base);
          if (usage === null) continue;
          this.push(out, {
            size,
            statement: { until: cond.condition, body: body.map((entry) => entry.statement) },
            code: { until: index, body: body.map((entry) => entry.code) },
            usage,
          });
        }
      }
      if (this.offers(CQ_IF)) {
        const base = limits.add(limits.of(CQ_IF), asked);
        for (const body of this.sequence(depth, size - 2)) {
          const usage = base === null ? null : bodyUsage(limits, body, base);
          if (usage === null) continue;
          this.push(out, {
            size,
            statement: { if: cond.condition, then: body.map((entry) => entry.statement) },
            code: { cond: index, then: body.map((entry) => entry.code), else: null },
            usage,
          });
        }
      }
      if (this.offers(CQ_IF_ELSE)) {
        const base = limits.add(limits.of(CQ_IF_ELSE), asked);
        for (let thenSize = 0; thenSize <= size - 2; thenSize++) {
          for (const then of this.sequence(depth, thenSize)) {
            const withThen = base === null ? null : bodyUsage(limits, then, base);
            if (withThen === null) continue;
            for (const otherwise of this.sequence(depth, size - 2 - thenSize)) {
              const usage = bodyUsage(limits, otherwise, withThen);
              if (usage === null) continue;
              this.push(out, {
                size,
                statement: {
                  if: cond.condition,
                  then: then.map((entry) => entry.statement),
                  else: otherwise.map((entry) => entry.statement),
                },
                code: {
                  cond: index,
                  then: then.map((entry) => entry.code),
                  else: otherwise.map((entry) => entry.code),
                },
                usage,
              });
            }
          }
        }
      }
    });
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
        for (const rest of this.sequence(depth, size - first)) {
          if (this.limits.types.length > 0 && bodyUsage(this.limits, rest, entry.usage) === null) {
            continue;
          }
          this.count();
          out.push([entry, ...rest]);
        }
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
   * Builds bodies of exactly `size` blocks from catalog(`depth`) block by block while running
   * them once on the maps of `mask`, so a prefix that already loses (or wins with blocks still
   * to add: a smaller program wins) is never extended. `done` gets each body, the state after it
   * and the usage with it.
   */
  private grow(
    state: number,
    mask: number,
    depth: number,
    size: number,
    usage: Usage,
    done: (body: Entry[], after: number, usage: Usage) => void,
  ): void {
    const step = (body: Entry[], left: number, current: number, used: Usage): void => {
      for (let first = 1; first <= left; first++) {
        for (const entry of this.catalog(depth, first)) {
          const withEntry = this.limits.add(used, entry.usage);
          if (withEntry === null) continue;
          const next = this.applyMasked(entry, current, mask);
          if (next === LOSS) continue;
          const whole = [...body, entry];
          if (first === left) done(whole, next, withEntry);
          else if (next !== WIN) step(whole, left - first, next, withEntry);
        }
      }
    };
    step([], size, state, usage);
  }

  /**
   * Calls `emit` for every top-level statement of exactly `size` blocks run from `state` with
   * `used` blocks so far, except those that cannot be part of a smallest program (header).
   */
  statements(state: number, size: number, used: Usage, emit: Emit): void {
    const { limits, sim } = this;
    if (size === 1) {
      sim.atoms.forEach((atom, index) => {
        this.budget.spend();
        const usage = limits.add(used, limits.of(atom.statement.block));
        if (usage === null) return;
        emit(() => atom.statement, sim.step(state, index), usage);
      });
      return;
    }
    if (this.loops) this.repeats(state, size, used, emit);
    if (this.maxDepth > 0) this.boxRepeats(state, size, used, emit);
    if (size >= 3) this.conditionals(state, size, used, emit);
  }

  /**
   * Top-level `cq_repeat_var` statements (ADR-0022): the body is grown on the maps whose box
   * holds at least 1 (a first pass there; prefixes that lose are cut as in `repeats`), then the
   * whole loop runs per map (each map has its own count). Skipped when the box is 0 on every map
   * still running: the loop does nothing, so the program without it is smaller.
   */
  private boxRepeats(state: number, size: number, used: Usage, emit: Emit): void {
    const { limits, sim } = this;
    const start = limits.add(used, limits.of(CQ_REPEAT_VAR));
    if (start === null) return;
    for (const timesVar of sim.repeatVars) {
      this.budget.spend();
      const mask = sim.varMask(state, timesVar);
      if (mask === 0) continue;
      const box = sim.variables[timesVar]?.id ?? '';
      this.grow(state, mask, this.maxDepth - 1, size - 1, start, (body, _after, usage) => {
        this.budget.spend();
        const outcome = sim.run(state, [{ timesVar, body: body.map((entry) => entry.code) }]);
        emit(
          () => ({ repeatVar: box, body: body.map((entry) => entry.statement) }),
          outcome,
          usage,
        );
      });
    }
  }

  /** Top-level `cq_repeat` statements: every count from one run of the body per pass. */
  private repeats(state: number, size: number, used: Usage, emit: Emit): void {
    const start = this.limits.add(used, this.limits.of(CQ_REPEAT));
    if (start === null) return;
    const inner = this.maxDepth - 1;
    const close = (body: Entry[], afterFirst: number, usage: Usage): void => {
      let outcome = afterFirst;
      for (let t = 1; t <= this.maxTimes; t++) {
        if (t > 1 && outcome >= 0) outcome = this.runBody(outcome, body);
        if (this.times.includes(t)) {
          const times = t;
          emit(
            () => ({ repeat: times, body: body.map((entry) => entry.statement) }),
            outcome,
            usage,
          );
        }
      }
    };
    // Bodies are built block by block while running the first pass, so a body prefix that
    // already loses is never extended.
    const grow = (body: Entry[], left: number, current: number, usage: Usage): void => {
      for (let first = 1; first <= left; first++) {
        for (const entry of this.catalog(inner, first)) {
          const withEntry = this.limits.add(usage, entry.usage);
          if (withEntry === null) continue;
          const next = this.apply(entry, current);
          if (next === LOSS) continue;
          const whole = [...body, entry];
          if (first === left) close(whole, next, withEntry);
          // A win with blocks still to add means a smaller program wins: never at the minimum.
          else if (next !== WIN) grow(whole, left - first, next, withEntry);
        }
      }
    };
    grow([], size - 1, state, start);
  }

  /** Top-level `cq_repeat_until`, `cq_if` and `cq_if_else` statements (P2-11). */
  private conditionals(state: number, size: number, used: Usage, emit: Emit): void {
    const { limits, sim } = this;
    const live = sim.liveMask(state);
    const statementsOf = (body: readonly Entry[]): Statement[] =>
      body.map((entry) => entry.statement);
    sim.conds.forEach((cond, index) => {
      this.budget.spend();
      const yes = sim.trueMask(state, index);
      const no = live & ~yes;
      const asked = limits.add(used, limits.of(cond.condition.block));
      if (asked === null) return;
      // Until: maps that answer ✘ run a first pass; then the loop goes on from there (with its
      // own `untilCap`, so a top-level loop may get one pass more than an inner one before it
      // counts as never stopping; the examples are re-run with runLevel anyway, ADR-0018).
      const untilBase = limits.add(asked, limits.of(CQ_REPEAT_UNTIL));
      if (this.maxDepth > 0 && this.offers(CQ_REPEAT_UNTIL) && no !== 0 && untilBase !== null) {
        this.grow(state, no, this.maxDepth - 1, size - 2, untilBase, (body, after, usage) => {
          this.budget.spend();
          const code = { until: index, body: body.map((entry) => entry.code) };
          const outcome = after < 0 ? after : sim.run(after, [code]);
          emit(() => ({ until: cond.condition, body: statementsOf(body) }), outcome, usage);
        });
      }
      // If: only a question that splits the maps still running can be needed at the top level.
      if (yes === 0 || no === 0) return;
      const ifBase = limits.add(asked, limits.of(CQ_IF));
      if (this.offers(CQ_IF) && ifBase !== null) {
        this.grow(state, yes, this.maxDepth, size - 2, ifBase, (body, after, usage) => {
          emit(() => ({ if: cond.condition, then: statementsOf(body) }), after, usage);
        });
      }
      const elseBase = limits.add(asked, limits.of(CQ_IF_ELSE));
      if (!this.offers(CQ_IF_ELSE) || elseBase === null) return;
      for (let thenSize = 0; thenSize <= size - 2; thenSize++) {
        const elseSize = size - 2 - thenSize;
        const otherwise = (then: Entry[], afterThen: number, withThen: Usage): void => {
          const finish = (orElse: Entry[], after: number, usage: Usage): void => {
            emit(
              () => ({
                if: cond.condition,
                then: statementsOf(then),
                else: statementsOf(orElse),
              }),
              after,
              usage,
            );
          };
          if (elseSize === 0) finish([], afterThen, withThen);
          else if (afterThen >= 0)
            this.grow(afterThen, no, this.maxDepth, elseSize, withThen, finish);
        };
        if (thenSize === 0) otherwise([], state, elseBase);
        else this.grow(state, yes, this.maxDepth, thenSize, elseBase, otherwise);
      }
    });
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
  const maxDepth = Math.min(
    options.maxDepth ?? DEFAULT_MAX_DEPTH,
    level.maxLoopDepth ?? Number.POSITIVE_INFINITY,
  );
  const limits = new InstanceLimits(level.maxInstances, searchedTypes(sim));
  const search = new ShortestSearch(
    sim,
    budget,
    maxDepth,
    options.repeatTimes ?? DEFAULT_REPEAT_TIMES,
    limits,
    options.maxCatalogEntries,
  );
  // Search nodes: a state and the maxInstances usage of the program that reached it.
  const radix = limits.radix;
  const keyOf = (state: number, usage: Usage): number =>
    radix === 1 ? state : state * radix + limits.index(usage);
  const stateOf = (key: number): number => (radix === 1 ? key : Math.floor(key / radix));

  const start = keyOf(sim.initial, limits.none);
  const layers: Array<Map<number, Node>> = [
    new Map([[start, { count: 1, example: [], usage: limits.none }]]),
  ];
  const firstLayer = new Map<number, number>([[start, 0]]);
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
        for (const [key, node] of layers[from] ?? []) {
          search.statements(stateOf(key), size - from, node.usage, (statement, outcome, usage) => {
            if (outcome === LOSS) return;
            if (outcome === WIN) {
              minBlocks = size;
              win(node, statement());
              return;
            }
            const next = keyOf(outcome, usage);
            if ((firstLayer.get(next) ?? size) < size) return;
            firstLayer.set(next, size);
            const known = layer.get(next);
            if (known !== undefined) known.count += node.count;
            else {
              layer.set(next, {
                count: node.count,
                example: [...node.example, statement()],
                usage,
              });
            }
          });
        }
      }
      // Programs that end without a stop and win on `evaluate`.
      for (const [key, node] of layer) {
        if (sim.finish(stateOf(key))) {
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

/** Block types a searched program can contain (what `maxInstances` may need to count). */
export function searchedTypes(sim: FastSim): Set<string> {
  return new Set([
    ...sim.atoms.map((atom) => atom.statement.block),
    ...sim.conds.map((cond) => cond.condition.block),
    ...sim.controls,
  ]);
}
