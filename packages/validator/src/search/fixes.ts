/**
 * Exhaustive search for the fewest edits that fix a `bughunt` level: breadth-first over the
 * programs at edit distance 1, 2, … from `initialWorkspace`, with the same block-token edits
 * as `editDistance` (insert, delete or change one block; a `cq_repeat` count change, a sensor's
 * dropdown, a block moved into another input are one change each, P2-11). The first distance
 * with a win is the minimum; all fixes at it are counted.
 */
import type { Level } from '@codequest/content-schema';
import {
  COND_INPUT,
  CQ_IF,
  CQ_IF_ELSE,
  CQ_REPEAT_UNTIL,
  editDistance,
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
import { InstanceLimits } from './limits';
import {
  formatProgram,
  programBlockTypes,
  programFromWorkspace,
  programLoopDepth,
  programToWorkspace,
  type Condition,
  type Program,
  type Statement,
} from './program';
import { searchedTypes } from './shortest';
import { EMPTY_SLOT, FastSim, type Code } from './sim';

export interface FixOptions extends SearchOptions {
  /** Largest number of edits tried. Default `parEdits` (1 when missing). */
  maxEdits?: number;
  /** Cap on programs kept for expanding (tests lower it). Default `MAX_KEPT_FIXES`. */
  maxKept?: number;
  /** Tests only: try every writable token at the last distance too (checks the depth filter). */
  unfilteredEdits?: boolean;
}

/**
 * Most programs the fix search keeps to expand at the next distance (each about 300 bytes: its
 * token list and its key in `seen`). Past it the search stops like a spent budget
 * (`SearchAborted`, `complete: false`, CLI "search stopped"), instead of running Node out of
 * memory: `w03-boss` (parEdits 4) passed 2 GB of heap at 3 edits without it.
 */
export const MAX_KEPT_FIXES = 2_000_000;

export interface FixResult {
  /** Fewest edits that make `initialWorkspace` win, or null when none was found. */
  minEdits: number | null;
  /** Distinct fixed programs at `minEdits` (a lower bound when not `complete`). */
  count: number;
  /** Up to `maxExamples` fixes, each re-run with `runLevel`. */
  examples: Program[];
  /** Every program up to `searchedEdits` edits away was tried, and all fixes at the last one. */
  complete: boolean;
  /** Largest edit distance whose programs were all tried. */
  searchedEdits: number;
  /** Edit limit of this search. */
  maxEdits: number;
  work: number;
  /** Examples where `runLevel` disagrees with the fast replay (should stay empty). */
  mismatches: string[];
  unsupported: string[];
}

/** One token symbol: a block, a sensor, a `cq_repeat` count or a conditional control block. */
type TokenSymbol = { repeat: number } | { atom: number } | { cond: number } | { control: string };

/** Input names of tokens, as in `editDistance`: '' under `cq_start`, then the inputs. */
const INPUTS = ['', 'DO', 'ELSE', COND_INPUT] as const;
const TOP = 0;
const DO = 1;
const ELSE = 2;
const COND = 3;
/** Order of a block's inputs in a pre-order token list (sorted by name: COND, DO, ELSE). */
const INPUT_ORDER: readonly number[] = [-1, 1, 2, 0];

function blockStatements(program: Program): Statement[] {
  return program.flatMap((statement): Statement[] => {
    if ('repeat' in statement || 'until' in statement) return blockStatements(statement.body);
    if ('if' in statement) {
      return [...blockStatements(statement.then), ...blockStatements(statement.else ?? [])];
    }
    return [statement];
  });
}

function conditionsOf(program: Program): Condition[] {
  return program.flatMap((statement): Condition[] => {
    if ('repeat' in statement) return conditionsOf(statement.body);
    if ('until' in statement) {
      return [
        ...(statement.until === null ? [] : [statement.until]),
        ...conditionsOf(statement.body),
      ];
    }
    if ('if' in statement) {
      return [
        ...(statement.if === null ? [] : [statement.if]),
        ...conditionsOf(statement.then),
        ...conditionsOf(statement.else ?? []),
      ];
    }
    return [];
  });
}

function repeatCounts(program: Program): number[] {
  return program.flatMap((statement): number[] => {
    if ('repeat' in statement) return [statement.repeat, ...repeatCounts(statement.body)];
    if ('until' in statement) return repeatCounts(statement.body);
    if ('if' in statement)
      return [...repeatCounts(statement.then), ...repeatCounts(statement.else ?? [])];
    return [];
  });
}

function controlTypes(program: Program, out = new Set<string>()): Set<string> {
  for (const statement of program) {
    if ('repeat' in statement) controlTypes(statement.body, out);
    else if ('until' in statement) {
      out.add(CQ_REPEAT_UNTIL);
      controlTypes(statement.body, out);
    } else if ('if' in statement) {
      out.add(statement.else === undefined ? CQ_IF : CQ_IF_ELSE);
      controlTypes(statement.then, out);
      controlTypes(statement.else ?? [], out);
    }
  }
  return out;
}

/**
 * A loop or `cq_if` with an empty body, or a `cq_if_else` with both branches empty, changes
 * nothing, so fixes that add one are not counted (unless the initial program already has one).
 */
function hasEmptyBody(code: Code): boolean {
  return code.some((item) => {
    if (typeof item === 'number') return false;
    if ('times' in item || 'until' in item)
      return item.body.length === 0 || hasEmptyBody(item.body);
    const otherwise = item.else ?? [];
    return (
      (item.then.length === 0 && (item.else === null || otherwise.length === 0)) ||
      hasEmptyBody(item.then) ||
      hasEmptyBody(otherwise)
    );
  });
}

type MutableItem =
  | number
  | { times: number; body: MutableItem[] }
  | { cond: number; then: MutableItem[]; else: MutableItem[] | null }
  | { until: number; body: MutableItem[] };

/**
 * Finds the fewest edits that fix a `bughunt` level's `initialWorkspace` with its toolbox, how
 * many fixes there are at that distance, and a few examples verified with `runLevel`. On a
 * level with `starGoals` a fix must also meet every goal, unless `options.ignoreStarGoals`.
 * A fix must respect `maxBlocks`, `maxInstances` and `maxLoopDepth` (programs on the way need
 * not: `editDistance` does not depend on the order of the edits).
 */
export function findFixes(original: Level, options: FixOptions = {}): FixResult {
  const level = searchedLevel(original, options);
  const kind = searchableKind(level, options);
  if (level.mode !== 'bughunt' || level.initialWorkspace === undefined) {
    throw new Error('only bughunt levels with an initialWorkspace have fixes');
  }
  const initial = programFromWorkspace(level.initialWorkspace);
  if (initial === null) throw new Error('initialWorkspace is not a program the search can read');
  const sim = new FastSim(kind, level, blockStatements(initial), undefined, conditionsOf(initial));
  const budget = new Budget(options);
  const maxEdits = options.maxEdits ?? level.parEdits ?? 1;
  const maxExamples = options.maxExamples ?? DEFAULT_MAX_EXAMPLES;
  const loopDepth = Math.min(
    options.maxDepth ?? DEFAULT_MAX_DEPTH,
    level.maxLoopDepth ?? Number.POSITIVE_INFINITY,
  );
  const maxKept = options.maxKept ?? MAX_KEPT_FIXES;

  // Controls a token can be: the toolbox's, and those of initialWorkspace (keep or delete only).
  const initialControls = controlTypes(initial);
  const controls = [CQ_IF, CQ_IF_ELSE, CQ_REPEAT_UNTIL].filter(
    (type) => sim.controls.has(type) || initialControls.has(type),
  );
  const conditional = controls.length > 0 || sim.conds.length > 0;

  const symbols: TokenSymbol[] = sim.atoms.map((_, atom) => ({ atom }));
  const counts = new Set(repeatCounts(initial));
  if (sim.hasRepeat)
    for (const times of options.repeatTimes ?? DEFAULT_REPEAT_TIMES) counts.add(times);
  for (const times of [...counts].sort((a, b) => a - b)) symbols.push({ repeat: times });
  for (const control of controls) symbols.push({ control });
  sim.conds.forEach((_, cond) => symbols.push({ cond }));
  const base = symbols.length;
  const token = (depth: number, input: number, symbol: number): number =>
    (depth * INPUTS.length + input) * base + symbol;
  const symbolOf = (value: number): TokenSymbol => symbols[value % base] ?? { atom: 0 };
  const inputOf = (value: number): number => Math.floor(value / base) % INPUTS.length;
  const depthOf = (value: number): number => Math.floor(value / base / INPUTS.length);

  const toTokens = (program: Program, depth: number, input: number, out: number[]): void => {
    const find = (match: (symbol: TokenSymbol) => boolean): number => symbols.findIndex(match);
    for (const statement of program) {
      if ('repeat' in statement) {
        out.push(
          token(
            depth,
            input,
            find((s) => 'repeat' in s && s.repeat === statement.repeat),
          ),
        );
        toTokens(statement.body, depth + 1, DO, out);
      } else if ('if' in statement || 'until' in statement) {
        const isIf = 'if' in statement;
        const type = isIf ? (statement.else === undefined ? CQ_IF : CQ_IF_ELSE) : CQ_REPEAT_UNTIL;
        out.push(
          token(
            depth,
            input,
            find((s) => 'control' in s && s.control === type),
          ),
        );
        const condition = isIf ? statement.if : statement.until;
        if (condition !== null) {
          const cond = sim.condIndex(condition);
          out.push(
            token(
              depth + 1,
              COND,
              find((s) => 'cond' in s && s.cond === cond),
            ),
          );
        }
        toTokens(isIf ? statement.then : statement.body, depth + 1, DO, out);
        if (isIf) toTokens(statement.else ?? [], depth + 1, ELSE, out);
      } else {
        const atom = sim.atomIndex(statement);
        if (atom === -1)
          throw new Error(`initialWorkspace block ${statement.block} is not searchable`);
        out.push(token(depth, input, atom));
      }
    }
  };
  const start: number[] = [];
  toTokens(initial, 0, TOP, start);
  const initialCode = sim.compile(initial);
  const allowEmptyBodies = initialCode !== null && hasEmptyBody(initialCode);

  // Tokens an edit may write. Without conditions: toolbox blocks at every depth up to the loop
  // depth, loops above it (as before P2-11). With them: any depth an edit can reach (the initial
  // nesting plus one per edit), in every input; loop nesting is checked on each fix instead.
  // Blocks only found in initialWorkspace can be kept or deleted, never added.
  const maxTokenDepth = conditional
    ? start.reduce((deepest, value) => Math.max(deepest, depthOf(value)), 0) + maxEdits
    : loopDepth;
  const writableAt: number[][] = [];
  for (let depth = 0; depth <= maxTokenDepth; depth++) {
    const here: number[] = [];
    const inputs = depth === 0 ? [TOP] : conditional ? [DO, ELSE, COND] : [DO];
    for (const input of inputs) {
      if (input === ELSE && !controls.includes(CQ_IF_ELSE)) continue;
      symbols.forEach((symbol, index) => {
        let allowed: boolean;
        if ('cond' in symbol)
          allowed = input === COND && sim.conds[symbol.cond]?.inToolbox === true;
        else if (input === COND) allowed = false;
        else if ('atom' in symbol) allowed = sim.atoms[symbol.atom]?.inToolbox === true;
        else if ('repeat' in symbol) allowed = sim.hasRepeat && depth < maxTokenDepth;
        else allowed = sim.controls.has(symbol.control) && depth < maxTokenDepth;
        if (!conditional && 'repeat' in symbol) allowed = depth < loopDepth;
        if (allowed) here.push(token(depth, input, index));
      });
    }
    writableAt.push(here);
  }
  const writable = writableAt.flat();
  /**
   * Tokens worth writing between `before` and `after`. In a well-formed (pre-order) list a token
   * is at most one level deeper than the one before it, and the one after it is at most one
   * level deeper than it; any other token makes a list that `parse` rejects. So on the **last**
   * distance, whose lists are only checked for a win and never expanded, only those depths are
   * tried. Earlier distances try every writable token: an ill-formed list there can still be
   * completed by a later edit. Without conditions every writable token is tried, as before.
   */
  const between = (
    before: number | undefined,
    after: number | undefined,
    last: boolean,
  ): number[] => {
    if (!conditional || !last || options.unfilteredEdits === true) return writable;
    const deepest = before === undefined ? 0 : depthOf(before) + 1;
    const shallowest = after === undefined ? 0 : Math.max(0, depthOf(after) - 1);
    return writableAt.slice(shallowest, deepest + 1).flat();
  };

  /** Code of a well-formed token list, or null (pre-order of blocks and their inputs). */
  const parse = (tokens: readonly number[]): Code | null => {
    const root: MutableItem[] = [];
    // The last block placed at each depth, and the open input chain at each depth > 0.
    const last: Array<MutableItem | undefined> = [];
    const chains: Array<{ owner: MutableItem; input: number; list: MutableItem[] | null }> = [];
    let previousDepth = -1;
    for (const value of tokens) {
      const depth = depthOf(value);
      const input = inputOf(value);
      const symbol = symbolOf(value);
      if (depth > previousDepth + 1) return null;
      previousDepth = depth;
      if (depth === 0) {
        if (input !== TOP || 'cond' in symbol) return null;
        const item = make(symbol);
        root.push(item);
        last.length = 0;
        last.push(item);
        chains.length = 0;
        continue;
      }
      const owner = last[depth - 1];
      if (owner === undefined || typeof owner === 'number') return null;
      let chain = chains[depth];
      if (chain?.owner !== owner || chain.input !== input) {
        if (
          chain?.owner === owner &&
          (INPUT_ORDER[input] ?? -1) <= (INPUT_ORDER[chain.input] ?? -1)
        ) {
          return null;
        }
        const list = openInput(owner, input);
        if (list === undefined) return null;
        chain = { owner, input, list };
        chains[depth] = chain;
      } else if (input === COND) {
        return null;
      }
      chains.length = depth + 1;
      if (input === COND) {
        if (!('cond' in symbol)) return null;
        if ('until' in owner) owner.until = symbol.cond;
        else if ('cond' in owner) owner.cond = symbol.cond;
        last[depth] = symbol.cond;
        last.length = depth + 1;
        continue;
      }
      if ('cond' in symbol || chain.list === null) return null;
      const item = make(symbol);
      chain.list.push(item);
      last[depth] = item;
      last.length = depth + 1;
    }
    return root;
  };
  /** A fresh code item for a statement symbol. */
  function make(symbol: TokenSymbol): MutableItem {
    if ('atom' in symbol) return symbol.atom;
    if ('repeat' in symbol) return { times: symbol.repeat, body: [] };
    if ('control' in symbol) {
      if (symbol.control === CQ_REPEAT_UNTIL) return { until: EMPTY_SLOT, body: [] };
      return { cond: EMPTY_SLOT, then: [], else: symbol.control === CQ_IF_ELSE ? [] : null };
    }
    return -1;
  }
  /** The list an input of `owner` holds (null for the condition slot), or undefined if none. */
  function openInput(owner: MutableItem, input: number): MutableItem[] | null | undefined {
    if (typeof owner === 'number') return undefined;
    if (input === COND) return 'times' in owner ? undefined : null;
    if (input === DO) return 'then' in owner ? owner.then : owner.body;
    if (input === ELSE && 'then' in owner && owner.else !== null) return owner.else;
    return undefined;
  }
  const toProgram = (code: Code): Program =>
    code.map((item): Statement => {
      if (typeof item === 'number') return sim.atoms[item]?.statement ?? { block: '?' };
      if ('times' in item) return { repeat: item.times, body: toProgram(item.body) };
      const conditionOf = (index: number): Condition | null =>
        index === EMPTY_SLOT ? null : (sim.conds[index]?.condition ?? null);
      if ('until' in item) return { until: conditionOf(item.until), body: toProgram(item.body) };
      return item.else === null
        ? { if: conditionOf(item.cond), then: toProgram(item.then) }
        : { if: conditionOf(item.cond), then: toProgram(item.then), else: toProgram(item.else) };
    });
  const limits = new InstanceLimits(
    level.maxInstances,
    new Set([...searchedTypes(sim), ...initialControls]),
  );
  /** maxInstances and maxLoopDepth on a fix (maxBlocks is checked by `sim.wins`). */
  const withinLimits = (code: Code): boolean => {
    if (limits.types.length === 0 && level.maxLoopDepth === undefined && !conditional) return true;
    const program = toProgram(code);
    return limits.allows(programBlockTypes(program)) && programLoopDepth(program) <= loopDepth;
  };

  // Every list of the earlier distances (needed to expand them); the last distance is never
  // expanded, so only its winners are remembered, which keeps memory flat at parEdits 3.
  const seen = new Set<string>([start.join(',')]);
  const winners = new Set<string>();
  let frontier: number[][] = [start];
  let minEdits: number | null = null;
  let count = 0;
  const examples: Program[] = [];
  let searchedEdits = 0;
  let complete = true;

  const consider = (tokens: number[], keep: number[][] | null): void => {
    budget.spend();
    const key = tokens.join(',');
    if (seen.has(key)) return;
    if (keep !== null) {
      if (seen.size >= maxKept) throw new SearchAborted('memory cap: too many programs kept');
      seen.add(key);
      keep.push(tokens);
    }
    const code = parse(tokens);
    if (
      code !== null &&
      (allowEmptyBodies || !hasEmptyBody(code)) &&
      sim.wins(code, tokens.length) &&
      withinLimits(code)
    ) {
      if (winners.has(key)) return;
      winners.add(key);
      count++;
      if (examples.length < maxExamples) examples.push(toProgram(code));
    }
  };

  try {
    for (let edits = 1; edits <= maxEdits; edits++) {
      const next: number[][] | null = edits < maxEdits ? [] : null;
      for (const tokens of frontier) {
        for (let i = 0; i < tokens.length; i++) {
          consider([...tokens.slice(0, i), ...tokens.slice(i + 1)], next);
          for (const value of between(tokens[i - 1], tokens[i + 1], next === null)) {
            if (value === tokens[i]) continue;
            const changed = [...tokens];
            changed[i] = value;
            consider(changed, next);
          }
        }
        for (let i = 0; i <= tokens.length; i++) {
          for (const value of between(tokens[i - 1], tokens[i], next === null)) {
            consider([...tokens.slice(0, i), value, ...tokens.slice(i)], next);
          }
        }
      }
      searchedEdits = edits;
      if (count > 0) {
        minEdits = edits;
        break;
      }
      frontier = next ?? [];
    }
  } catch (error) {
    if (!(error instanceof SearchAborted)) throw error;
    complete = false;
    if (count > 0) minEdits = searchedEdits + 1;
  }

  registerBlockSpecs(kind.blocks);
  const mismatches: string[] = [];
  for (const program of examples) {
    const workspace = programToWorkspace(program);
    const outcome = runLevel({ kind, level, workspace });
    const edits = editDistance(level.initialWorkspace, workspace);
    if (!countedWin(outcome) || edits !== minEdits) {
      const missed = outcome.result === 'success' && !countedWin(outcome) ? ' misses a goal' : '';
      mismatches.push(
        `${formatProgram(program)}: runLevel ${outcome.result} ${outcome.reasonCode ?? ''}${missed}, ${String(edits)} edits`,
      );
    }
  }

  return {
    minEdits,
    count,
    examples,
    complete,
    searchedEdits,
    maxEdits,
    work: budget.work,
    mismatches,
    unsupported: sim.unsupported,
  };
}
