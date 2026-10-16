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
 *
 * Spells (ADR-0023 §4): on a level whose toolbox offers `làm phép`, the bodies are fixed (mode 1:
 * the solution's; mode 2, `procBodies` k: every body of ≤ k blocks too). For each set S of
 * spells, the main program is searched with `làm phép p ∈ S` as one more statement (it runs the
 * body in place) and a constant size `Σ (1 + |body p|)`; `par` is the minimum over every S.
 */
import { variableMax, type Level } from '@codequest/content-schema';
import {
  analyzeWorkspace,
  CQ_IF,
  CQ_IF_ELSE,
  CQ_PROC_CALL,
  CQ_PROC_CALL_N,
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
import {
  definitionsFromWorkspace,
  formatProgram,
  formatProgramWithDefs,
  programBlockTypes,
  programLoopDepth,
  programSize,
  programToWorkspace,
  type Definitions,
  type Program,
  type Statement,
} from './program';
import { FastSim, LOSS, WIN, type CodeItem } from './sim';

export interface ShortestOptions extends SearchOptions {
  /** Largest program size tried. Default `par`, else `maxBlocks`, else 8; never > `maxBlocks`. */
  maxSize?: number;
  /**
   * Memory cap: catalog statements and body sequences kept (default `MAX_CATALOG_ENTRIES`).
   * Past it the search stops like a spent budget.
   */
  maxCatalogEntries?: number;
  /**
   * Spells, mode 2 (ADR-0023 §4): also try every spell body of ≤ k blocks (k ≤ 4, levels with
   * ≤ 2 spells). Default off: the solution's bodies only (mode 1).
   */
  procBodies?: number;
}

/** How a level with spells was searched (ADR-0023 §4). */
export type SpellSearchMode = 'solution-bodies' | 'small-bodies';

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
  /** Levels with spells only: the spell bodies of each example, in `examples` order. */
  definitions?: Definitions[];
  /** Levels with spells only: what `minBlocks` is proven for. */
  spellMode?: SpellSearchMode;
  /** With `spellMode` 'small-bodies': the k of `procBodies`. */
  procBodies?: number;
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
    /** Spells callable in this search, with the loop depth of their bodies. */
    private readonly calls: readonly SpellCall[] = [],
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
      // `làm phép` only where its body's loops still fit (effective loop depth).
      for (const call of this.calls) if (call.depth <= depth) out.push(this.callEntry(call));
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

  private readonly callEntries = new Map<string, Entry>();

  /** The one catalog entry of a `làm phép` (memoized like any compound block). */
  callEntry(call: SpellCall): Entry {
    const key = `${String(call.index)}:${String(call.arg)}`;
    const known = this.callEntries.get(key);
    if (known !== undefined) return known;
    const { arg } = call;
    const entry: Entry = {
      size: 1,
      statement: arg === undefined ? { call: call.id } : { call: call.id, arg },
      code: arg === undefined ? { call: call.index } : { call: call.index, arg },
      memo: null,
      usage: this.limits.of(arg === undefined ? CQ_PROC_CALL : CQ_PROC_CALL_N),
    };
    this.callEntries.set(key, entry);
    return entry;
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
      for (const call of this.calls) {
        if (call.depth > this.maxDepth) continue;
        const entry = this.callEntry(call);
        const usage = limits.add(used, entry.usage);
        if (usage === null) continue;
        emit(() => entry.statement, this.apply(entry, state), usage);
      }
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
 * A `làm phép` callable in one search: the spell id, its index in `FastSim.procIds`, its body's
 * loop depth and, for `làm phép … với`, the number.
 */
interface SpellCall {
  id: string;
  index: number;
  depth: number;
  arg?: number;
}

/** What one search of the main program found (sizes count the main program only). */
interface MainResult {
  minBlocks: number | null;
  count: number;
  examples: Program[];
  complete: boolean;
  searchedSize: number;
}

/** The layered shortest-path search of the main program, up to `maxSize` blocks. */
function searchMain(
  level: Level,
  sim: FastSim,
  budget: Budget,
  options: ShortestOptions,
  maxSize: number,
  calls: readonly SpellCall[],
): MainResult {
  const maxExamples = options.maxExamples ?? DEFAULT_MAX_EXAMPLES;
  const maxDepth = Math.min(
    options.maxDepth ?? DEFAULT_MAX_DEPTH,
    level.maxLoopDepth ?? Number.POSITIVE_INFINITY,
  );
  const relevant = searchedTypes(sim);
  if (calls.length > 0) {
    relevant.add(CQ_PROC_CALL);
    relevant.add(CQ_PROC_CALL_N);
  }
  const limits = new InstanceLimits(level.maxInstances, relevant);
  const search = new ShortestSearch(
    sim,
    budget,
    maxDepth,
    options.repeatTimes ?? DEFAULT_REPEAT_TIMES,
    limits,
    options.maxCatalogEntries,
    calls,
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

  return { minBlocks, count, examples, complete, searchedSize };
}

/** `MainResult` of a level with spells: sizes count the spells, examples have bodies. */
interface SpellResult extends MainResult {
  definitions: Definitions[] | undefined;
  unsupported?: string[];
}

/** Most spells mode 2 enumerates bodies for (ADR-0023 §4). */
const MAX_ENUMERATED_SPELLS = 2;
/** Largest `procBodies` k. */
export const MAX_PROC_BODIES = 4;

/**
 * Mode 1 (and 2) of ADR-0023 §4: every set S of spells with fixed bodies, the main program
 * searched with `làm phép p ∈ S`, sizes `main + Σ_{p∈S} (1 + |body p|)`, the minimum over S.
 * Each spell is called at least twice at the minimum (once: its body inlined is 2 blocks smaller),
 * so a set with `Σ(1 + |body|) + 2·|S|` over the best size so far is skipped. Larger sets go first.
 */
function searchWithSpells(
  level: Level,
  sim: FastSim,
  budget: Budget,
  options: ShortestOptions,
  maxSize: number,
): SpellResult {
  const maxExamples = options.maxExamples ?? DEFAULT_MAX_EXAMPLES;
  const maxDepth = Math.min(
    options.maxDepth ?? DEFAULT_MAX_DEPTH,
    level.maxLoopDepth ?? Number.POSITIVE_INFINITY,
  );
  const unsupported: string[] = [];
  const boxed = boxedSpells(level);
  const choices = callChoices(level);
  const fromSolution = level.solution === undefined ? {} : definitionsFromWorkspace(level.solution);
  if (fromSolution === null) {
    unsupported.push('solution: a spell body cannot be read (searched without its bodies)');
  }
  const k = options.procBodies;
  if (k !== undefined && (k < 1 || k > MAX_PROC_BODIES)) {
    throw new Error(`procBodies must be 1–${String(MAX_PROC_BODIES)}, got ${String(k)}`);
  }

  let best = null as number | null;
  let count = 0;
  let examples: Program[] = [];
  let definitions: Definitions[] = [];
  let complete = true;
  let searchedSize = maxSize;
  const tried = new Set<string>();

  /**
   * One set of spells with fixed bodies (`chosen`: spell id → index into its candidates).
   * Throws `SearchAborted` once a search runs out of budget: nothing after it is proven.
   */
  const runSet = (chosen: ReadonlyMap<string, number>, bodies: ReadonlyMap<string, Program[]>) => {
    budget.spend();
    const ids = [...chosen.keys()];
    const key = ids.map((id) => `${id}:${String(chosen.get(id))}`).join(';');
    if (tried.has(key)) return;
    tried.add(key);
    const defs: Record<string, Program> = {};
    for (const id of ids) defs[id] = bodies.get(id)?.[chosen.get(id) ?? 0] ?? [];
    const offset = ids.reduce((sum, id) => sum + 1 + programSize(defs[id] ?? []), 0);
    const limit = Math.min(maxSize, best ?? Number.POSITIVE_INFINITY);
    if (offset + 2 * ids.length > limit || limit - offset < 1) return;
    if (ids.some((id) => programLoopDepth(defs[id] ?? []) > maxDepth)) return;
    // The bodies are counted once: what they use comes off every maxInstances cap.
    const used = programBlockTypes([], new Map(), defs, boxed);
    let maxInstances = level.maxInstances;
    if (maxInstances !== undefined) {
      const left: Record<string, number> = {};
      for (const [type, max] of Object.entries(maxInstances)) {
        left[type] = max - (used.get(type) ?? 0);
      }
      if (Object.values(left).some((max) => max < 0)) return;
      maxInstances = left;
    }
    if (!sim.setBodies(defs)) {
      unsupported.push(`spell bodies ${formatProgramWithDefs([], defs)}: not searchable`);
      return;
    }
    const calls = choices
      .filter((choice) => ids.includes(choice.id))
      .map((choice) => ({
        ...choice,
        index: sim.procIds.indexOf(choice.id),
        depth: programLoopDepth(defs[choice.id] ?? []),
      }));
    const searched: Level = {
      ...level,
      ...(level.maxBlocks !== undefined && { maxBlocks: level.maxBlocks - offset }),
      ...(maxInstances !== undefined && { maxInstances }),
    };
    const found = searchMain(searched, sim, budget, options, limit - offset, calls);
    if (!found.complete) {
      complete = false;
      searchedSize = Math.min(searchedSize, offset + found.searchedSize);
    }
    if (found.minBlocks !== null) {
      const total = found.minBlocks + offset;
      if (best === null || total < best) {
        best = total;
        count = 0;
        examples = [];
        definitions = [];
      }
      if (total === best) {
        count += found.count;
        for (const example of found.examples) {
          if (examples.length >= maxExamples) break;
          examples.push(example);
          definitions.push(defs);
        }
      }
    }
    if (!found.complete) throw new SearchAborted('budget spent in a spell search');
  };

  /** Every subset of the chosen spells, larger sets first (the solution's set first of all). */
  const subsets = (chosen: ReadonlyMap<string, number>): Array<Map<string, number>> => {
    const ids = [...chosen.keys()];
    const masks = Array.from({ length: 2 ** ids.length }, (_, mask) => mask);
    const size = (mask: number): number => ids.filter((_, i) => (mask & (1 << i)) !== 0).length;
    masks.sort((a, b) => size(b) - size(a) || b - a);
    return masks.map(
      (mask) =>
        new Map(
          ids
            .filter((_, i) => (mask & (1 << i)) !== 0)
            .map((id): [string, number] => [id, chosen.get(id) ?? 0]),
        ),
    );
  };

  try {
    // Candidate bodies per spell: the solution's first, then (mode 2) every body of ≤ k blocks.
    const bodies = new Map<string, Program[]>();
    for (const id of sim.procIds) {
      const own = fromSolution?.[id];
      bodies.set(id, own !== undefined && own.length > 0 ? [own] : []);
    }
    if (k !== undefined) {
      if (sim.procIds.length > MAX_ENUMERATED_SPELLS) {
        unsupported.push(
          `spell bodies ≤ ${String(k)}: only for levels with ≤ ${String(MAX_ENUMERATED_SPELLS)} spells (solution bodies used)`,
        );
      } else {
        const times = options.repeatTimes ?? DEFAULT_REPEAT_TIMES;
        sim.procIds.forEach((id, index) => {
          const box = sim.procBoxes[index] ?? -1;
          const small = enumerateBodies(sim, k, maxDepth, times, budget, box);
          bodies.set(id, [...(bodies.get(id) ?? []), ...small]);
        });
      }
    }
    // Tuples of one candidate body per spell (or none), the solution's bodies first.
    const tuple = (index: number, chosen: Map<string, number>): void => {
      const id = sim.procIds[index];
      if (id === undefined) {
        for (const set of subsets(chosen)) runSet(set, bodies);
        return;
      }
      const candidates = bodies.get(id)?.length ?? 0;
      if (candidates === 0) tuple(index + 1, chosen);
      for (let body = 0; body < candidates; body++) {
        tuple(index + 1, new Map([...chosen, [id, body]]));
      }
    };
    tuple(0, new Map());
  } catch (error) {
    if (!(error instanceof SearchAborted)) throw error;
    complete = false;
  }
  return {
    minBlocks: best,
    count,
    examples,
    complete,
    // Complete: every size up to the minimum (or the limit) was tried for every set.
    searchedSize: complete ? (best ?? maxSize) : Math.min(searchedSize, best ?? searchedSize),
    definitions,
    unsupported,
  };
}

/** Spells whose `dạy phép` block is `dạy phép … với hộp` (they have a `param`). */
export function boxedSpells(level: Level): Set<string> {
  return new Set(
    (level.procedures ?? []).flatMap((procedure) =>
      procedure.param === undefined ? [] : [procedure.id],
    ),
  );
}

/** Most numbers tried for an unpinned `làm phép … với [n]` (like a `field_number`). */
const MAX_CALL_NUMBERS = 9;

/**
 * The `làm phép` statements the toolbox offers (ADR-0023 §4): `cq_proc_call` for each spell
 * without a box, `cq_proc_call_n` with each pinned number (unpinned: 1…max, at most 9) for each
 * spell with one; a pinned `PROC` keeps its spell only.
 */
export function callChoices(level: Level): Array<{ id: string; arg?: number }> {
  const out: Array<{ id: string; arg?: number }> = [];
  const seen = new Set<string>();
  const add = (id: string, arg?: number): void => {
    const key = `${id}:${String(arg)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(arg === undefined ? { id } : { id, arg });
  };
  for (const entry of level.toolbox) {
    const type = typeof entry === 'string' ? entry : entry.type;
    const fields = typeof entry === 'string' ? {} : (entry.fields ?? {});
    const pinned = fields['PROC'];
    for (const procedure of level.procedures ?? []) {
      if (typeof pinned === 'string' && pinned !== procedure.id) continue;
      if (type === CQ_PROC_CALL && procedure.param === undefined) add(procedure.id);
      if (type !== CQ_PROC_CALL_N || procedure.param === undefined) continue;
      const number = Number(fields['NUM']);
      if (fields['NUM'] !== undefined && Number.isInteger(number)) {
        add(procedure.id, number);
        continue;
      }
      const top = Math.min(variableMax(procedure.param), MAX_CALL_NUMBERS);
      for (let n = 1; n <= top; n++) add(procedure.id, n);
    }
  }
  return out;
}

/**
 * Every spell body of 1…`maxSize` blocks (mode 2, ADR-0023 §4): toolbox statements, and the
 * toolbox's `cq_repeat` (each count), `cq_repeat_until`, `cq_if`, `cq_if_else` with its sensors,
 * loops nested at most `maxDepth` deep, and `lặp [hộp] lần` over the spell's own box. Calls are
 * never in a body.
 */
function enumerateBodies(
  sim: FastSim,
  maxSize: number,
  maxDepth: number,
  times: readonly number[],
  budget: Budget,
  /** Index in `sim.variables` of the spell's own box (-1: none), for `lặp [hộp] lần`. */
  box: number,
): Program[] {
  const memo = new Map<string, Program[]>();
  const boxId = sim.variables[box]?.id;
  const statements = (size: number, depth: number): Statement[] => {
    const out: Statement[] = [];
    if (size === 1) for (const atom of sim.atoms) out.push(atom.statement);
    if (size >= 2 && depth > 0 && sim.hasRepeat) {
      for (const body of sequences(size - 1, depth - 1)) {
        for (const count of times) out.push({ repeat: count, body });
      }
    }
    if (size >= 2 && depth > 0 && boxId !== undefined && sim.controls.has(CQ_REPEAT_VAR)) {
      for (const body of sequences(size - 1, depth - 1)) out.push({ repeatVar: boxId, body });
    }
    if (size >= 3) {
      for (const cond of sim.conds) {
        if (depth > 0 && sim.controls.has(CQ_REPEAT_UNTIL)) {
          for (const body of sequences(size - 2, depth - 1)) {
            out.push({ until: cond.condition, body });
          }
        }
        if (sim.controls.has(CQ_IF)) {
          for (const body of sequences(size - 2, depth))
            out.push({ if: cond.condition, then: body });
        }
        if (sim.controls.has(CQ_IF_ELSE)) {
          for (let thenSize = 0; thenSize <= size - 2; thenSize++) {
            for (const then of sequences(thenSize, depth)) {
              for (const otherwise of sequences(size - 2 - thenSize, depth)) {
                if (then.length + otherwise.length === 0) continue;
                out.push({ if: cond.condition, then, else: otherwise });
              }
            }
          }
        }
      }
    }
    return out;
  };
  const sequences = (size: number, depth: number): Program[] => {
    if (size === 0) return [[]];
    const key = `${String(size)}:${String(depth)}`;
    const known = memo.get(key);
    if (known !== undefined) return known;
    const out: Program[] = [];
    for (let first = 1; first <= size; first++) {
      for (const head of statements(first, depth)) {
        for (const rest of sequences(size - first, depth)) {
          budget.spend();
          out.push([head, ...rest]);
        }
      }
    }
    memo.set(key, out);
    return out;
  };
  const out: Program[] = [];
  for (let size = 1; size <= maxSize; size++) out.push(...sequences(size, maxDepth));
  return out;
}

/**
 * Finds the fewest blocks that win `level` with its toolbox (modes build, parsons, bughunt),
 * how many programs of that size win, and a few examples verified with `runLevel`. On a level
 * with `starGoals` a win must also meet every goal, unless `options.ignoreStarGoals`. On a level
 * with spells, the sizes count the `dạy phép` blocks and bodies too (ADR-0023 §4).
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
  const maxSize = Math.min(
    options.maxSize ?? level.par ?? level.maxBlocks ?? DEFAULT_MAX_SIZE,
    level.maxBlocks ?? Infinity,
  );
  const spells = sim.offersCall && sim.procIds.length > 0;
  const found: SpellResult = spells
    ? searchWithSpells(level, sim, budget, options, maxSize)
    : { ...searchMain(level, sim, budget, options, maxSize, []), definitions: undefined };

  registerBlockSpecs(kind.blocks);
  const mismatches: string[] = [];
  found.examples.forEach((program, index) => {
    const defs = found.definitions?.[index] ?? {};
    const workspace = programToWorkspace(program, defs, boxedSpells(level));
    const outcome = runLevel({ kind, level, workspace });
    const blocks = analyzeWorkspace(workspace).blocksUsed;
    if (!countedWin(outcome) || blocks !== found.minBlocks) {
      const missed = outcome.result === 'success' && !countedWin(outcome) ? ' misses a goal' : '';
      const text = spells ? formatProgramWithDefs(program, defs) : formatProgram(program);
      mismatches.push(
        `${text}: runLevel ${outcome.result} ${outcome.reasonCode ?? ''}${missed}, ${String(blocks)} blocks`.trim(),
      );
    }
  });

  return {
    minBlocks: found.minBlocks,
    count: found.count,
    examples: found.examples,
    complete: found.complete,
    searchedSize: found.searchedSize,
    maxSize,
    work: budget.work,
    states: sim.stateCount,
    mismatches,
    unsupported: [...sim.unsupported, ...(spells ? (found.unsupported ?? []) : [])],
    ...(spells && {
      definitions: found.definitions ?? [],
      spellMode: options.procBodies === undefined ? 'solution-bodies' : 'small-bodies',
      ...(options.procBodies !== undefined && { procBodies: options.procBodies }),
    }),
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
