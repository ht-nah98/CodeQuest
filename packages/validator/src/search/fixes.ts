/**
 * Exhaustive search for the fewest edits that fix a `bughunt` level: breadth-first over the
 * programs at edit distance 1, 2, … from `initialWorkspace`, with the same block-token edits
 * as `editDistance` (insert, delete or change one block; a `cq_repeat` count change is one
 * change). The first distance with a win is the minimum; all fixes at it are counted.
 */
import type { Level } from '@codequest/content-schema';
import { editDistance, registerBlockSpecs, runLevel } from '@codequest/engine';
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
import {
  formatProgram,
  programFromWorkspace,
  programToWorkspace,
  type Program,
  type Statement,
} from './program';
import { FastSim, type Code, type RepeatCode } from './sim';

export interface FixOptions extends SearchOptions {
  /** Largest number of edits tried. Default `parEdits` (1 when missing). */
  maxEdits?: number;
  /** Cap on programs kept for expanding (tests lower it). Default `MAX_KEPT_FIXES`. */
  maxKept?: number;
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

/** `cq_repeat` or a block, as one token symbol. */
type TokenSymbol = { repeat: number } | { atom: number };

function blockStatements(program: Program): Statement[] {
  return program.flatMap((statement) =>
    'repeat' in statement ? blockStatements(statement.body) : [statement],
  );
}

function repeatCounts(program: Program): number[] {
  return program.flatMap((statement) =>
    'repeat' in statement ? [statement.repeat, ...repeatCounts(statement.body)] : [],
  );
}

/**
 * An empty `cq_repeat` changes nothing, so fixes that add one are not counted (unless the
 * initial program already has one).
 */
function hasEmptyLoop(code: Code): boolean {
  return code.some(
    (item) => typeof item !== 'number' && (item.body.length === 0 || hasEmptyLoop(item.body)),
  );
}

/**
 * Finds the fewest edits that fix a `bughunt` level's `initialWorkspace` with its toolbox, how
 * many fixes there are at that distance, and a few examples verified with `runLevel`. On a
 * level with `starGoals` a fix must also meet every goal, unless `options.ignoreStarGoals`.
 */
export function findFixes(original: Level, options: FixOptions = {}): FixResult {
  const level = searchedLevel(original, options);
  const kind = searchableKind(level, options);
  if (level.mode !== 'bughunt' || level.initialWorkspace === undefined) {
    throw new Error('only bughunt levels with an initialWorkspace have fixes');
  }
  const initial = programFromWorkspace(level.initialWorkspace);
  if (initial === null) throw new Error('initialWorkspace is not a straight-line program');
  const sim = new FastSim(kind, level, blockStatements(initial));
  const budget = new Budget(options);
  const maxEdits = options.maxEdits ?? level.parEdits ?? 1;
  const maxExamples = options.maxExamples ?? DEFAULT_MAX_EXAMPLES;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxKept = options.maxKept ?? MAX_KEPT_FIXES;

  const symbols: TokenSymbol[] = sim.atoms.map((_, atom) => ({ atom }));
  const counts = new Set(repeatCounts(initial));
  if (sim.hasRepeat)
    for (const times of options.repeatTimes ?? DEFAULT_REPEAT_TIMES) counts.add(times);
  for (const times of [...counts].sort((a, b) => a - b)) symbols.push({ repeat: times });
  const base = symbols.length;
  // Tokens an edit may write: toolbox blocks at every depth, loops above the deepest level.
  // Blocks only found in initialWorkspace can be kept or deleted, never added.
  const writable: number[] = [];
  for (let depth = 0; depth <= maxDepth; depth++) {
    symbols.forEach((symbol, index) => {
      const allowed =
        'repeat' in symbol ? depth < maxDepth : sim.atoms[symbol.atom]?.inToolbox === true;
      if (allowed) writable.push(depth * base + index);
    });
  }
  const symbolOf = (token: number): TokenSymbol => symbols[token % base] ?? { atom: 0 };
  const depthOf = (token: number): number => Math.floor(token / base);

  const toTokens = (program: Program, depth: number, out: number[]): void => {
    for (const statement of program) {
      if ('repeat' in statement) {
        out.push(
          depth * base + symbols.findIndex((s) => 'repeat' in s && s.repeat === statement.repeat),
        );
        toTokens(statement.body, depth + 1, out);
      } else {
        const atom = sim.atomIndex(statement);
        if (atom === -1)
          throw new Error(`initialWorkspace block ${statement.block} is not searchable`);
        out.push(depth * base + atom);
      }
    }
  };
  const start: number[] = [];
  toTokens(initial, 0, start);
  const initialCode = sim.compile(initial);
  const allowEmptyLoops = initialCode !== null && hasEmptyLoop(initialCode);

  /** Code of a well-formed token list, or null (a child needs a loop right above it). */
  const parse = (tokens: readonly number[]): Code | null => {
    const root: Array<number | RepeatCode> = [];
    const stack: Array<Array<number | RepeatCode>> = [root];
    let previous: TokenSymbol | null = null;
    for (const token of tokens) {
      const depth = depthOf(token);
      if (depth > stack.length - 1) {
        if (depth !== stack.length || previous === null || !('repeat' in previous)) return null;
        const parent = stack[stack.length - 1];
        const loop = parent?.[parent.length - 1];
        if (loop === undefined || typeof loop === 'number') return null;
        stack.push(loop.body as Array<number | RepeatCode>);
      }
      stack.length = depth + 1;
      const symbol = symbolOf(token);
      const list = stack[depth];
      if (list === undefined) return null;
      list.push('repeat' in symbol ? { times: symbol.repeat, body: [] } : symbol.atom);
      previous = symbol;
    }
    return root;
  };
  const toProgram = (code: Code): Program =>
    code.map((item): Statement =>
      typeof item === 'number'
        ? (sim.atoms[item]?.statement ?? { block: '?' })
        : { repeat: item.times, body: toProgram(item.body) },
    );

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
      (allowEmptyLoops || !hasEmptyLoop(code)) &&
      sim.wins(code, tokens.length)
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
          for (const token of writable) {
            if (token === tokens[i]) continue;
            const changed = [...tokens];
            changed[i] = token;
            consider(changed, next);
          }
        }
        for (let i = 0; i <= tokens.length; i++) {
          for (const token of writable) {
            consider([...tokens.slice(0, i), token, ...tokens.slice(i)], next);
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
