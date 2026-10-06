// Parsons uniqueness (coach question G22, curriculum.md §5.3 P2-14 review): a parsons level should
// have exactly one way to join every given block that wins, otherwise the child can "win" without
// the idea of the level. Enumerates every arrangement of the solution's blocks under
// "khi bắt đầu" (every block joined, no empty loop body or if branch, every condition slot
// filled) and runs each one with the real engine in mode `parsons`.
import type { Level, WorkspaceJson } from '@codequest/content-schema';
import { COND_INPUT, runLevel } from '@codequest/engine';
import { getGameKind } from '@codequest/games';
import type { GameKindLookup } from './issue';

/** Arrangements tried before giving up, unless `maxRuns` says otherwise. */
export const DEFAULT_MAX_PARSONS_RUNS = 50_000;

export interface ParsonsOptions {
  /** Arrangements run at most; the result says `complete: false` when it is reached. */
  maxRuns?: number;
  /** Polled before each run; return true to stop (wall clock). */
  shouldStop?: () => boolean;
  /** Game kind registry; defaults to `getGameKind` of `@codequest/games`. */
  getKind?: GameKindLookup;
  /** Winning arrangements kept as examples. Default 3. */
  maxExamples?: number;
}

export interface ParsonsResult {
  /** Arrangements run. */
  runs: number;
  /** Arrangements that win (every given block joined, every block ran). */
  wins: number;
  /** Some winning arrangements, written like `until(HOLE)[walk], jump`. */
  examples: string[];
  /** Every arrangement was run. */
  complete: boolean;
}

/** One given block: its own fields, and the inputs it has in the solution. */
interface Piece {
  sig: string;
  json: Record<string, unknown>;
  label: string;
  /** Statement inputs (loop body, if branches), in solution order. */
  bodies: string[];
  /** Has the condition slot (`COND`). */
  hasCond: boolean;
}

interface Node {
  piece: Piece;
  bodies: Node[][];
}

type Raw = Record<string, unknown>;
const childOf = (input: unknown): Raw | undefined => (input as { block?: Raw } | undefined)?.block;

function pieceOf(block: Raw): Piece {
  const { type, fields, extraState } = block as {
    type: string;
    fields?: Record<string, unknown>;
    extraState?: unknown;
  };
  const inputs = (block['inputs'] ?? {}) as Record<string, unknown>;
  const json: Raw = { type };
  if (fields !== undefined) json['fields'] = fields;
  if (extraState !== undefined) json['extraState'] = extraState;
  const values = Object.values(fields ?? {}).map(String);
  const label = values.length === 0 ? type : `${type}(${values.join(',')})`;
  return {
    sig: JSON.stringify(json),
    json,
    label,
    bodies: Object.keys(inputs).filter((name) => name !== COND_INPUT),
    hasCond: COND_INPUT in inputs,
  };
}

/** The statement and condition blocks of a solution (start block excluded). */
function piecesOf(solution: WorkspaceJson): { statements: Piece[]; conditions: Piece[] } {
  const statements: Piece[] = [];
  const conditions: Piece[] = [];
  const visit = (block: Raw | undefined): void => {
    for (let current = block; current !== undefined; current = childOf(current['next'])) {
      statements.push(pieceOf(current));
      const inputs = (current['inputs'] ?? {}) as Record<string, unknown>;
      for (const [name, input] of Object.entries(inputs)) {
        const child = childOf(input);
        if (child === undefined) continue;
        if (name === COND_INPUT) conditions.push(pieceOf(child));
        else visit(child);
      }
    }
  };
  const [start] = solution.blocks.blocks as Raw[];
  visit(start === undefined ? undefined : childOf(start['next']));
  return { statements, conditions };
}

/** Distinct orderings of a multiset (pieces with the same signature are interchangeable). */
function* distinctOrders(pieces: Piece[]): Generator<Piece[]> {
  if (pieces.length === 0) {
    yield [];
    return;
  }
  const seen = new Set<string>();
  for (const [index, piece] of pieces.entries()) {
    if (seen.has(piece.sig)) continue;
    seen.add(piece.sig);
    const rest = [...pieces.slice(0, index), ...pieces.slice(index + 1)];
    for (const tail of distinctOrders(rest)) yield [piece, ...tail];
  }
}

/** Every way to split a multiset into `groups` multisets, the first `nonEmpty` not empty. */
function* splits(pieces: Piece[], groups: number, nonEmpty: number): Generator<Piece[][]> {
  const seen = new Set<string>();
  const total = groups ** pieces.length;
  for (let code = 0; code < total; code += 1) {
    const out: Piece[][] = Array.from({ length: groups }, () => []);
    let rest = code;
    for (const piece of pieces) {
      out[rest % groups]?.push(piece);
      rest = Math.floor(rest / groups);
    }
    if (out.slice(0, nonEmpty).some((group) => group.length === 0)) continue;
    const key = out
      .map((group) =>
        group
          .map((piece) => piece.sig)
          .sort()
          .join('|'),
      )
      .join('/');
    if (seen.has(key)) continue;
    seen.add(key);
    yield out;
  }
}

/** Every statement list using exactly these pieces, with no empty body. */
function* forests(pieces: Piece[]): Generator<Node[]> {
  if (pieces.length === 0) {
    yield [];
    return;
  }
  const seen = new Set<string>();
  for (const [index, first] of pieces.entries()) {
    if (seen.has(first.sig)) continue;
    seen.add(first.sig);
    const rest = [...pieces.slice(0, index), ...pieces.slice(index + 1)];
    const count = first.bodies.length;
    for (const groups of splits(rest, count + 1, count)) {
      const after = groups[count] ?? [];
      for (const bodies of bodyLists(groups.slice(0, count))) {
        for (const tail of forests(after)) yield [{ piece: first, bodies }, ...tail];
      }
    }
  }
}

function* bodyLists(groups: Piece[][]): Generator<Node[][]> {
  const [head, ...rest] = groups;
  if (head === undefined) {
    yield [];
    return;
  }
  for (const list of forests(head)) for (const others of bodyLists(rest)) yield [list, ...others];
}

const countConds = (nodes: Node[]): number =>
  nodes.reduce(
    (sum, node) =>
      sum + (node.piece.hasCond ? 1 : 0) + node.bodies.reduce((s, b) => s + countConds(b), 0),
    0,
  );

/** The workspace of an arrangement (conditions filled in order) and a short text for it. */
function build(nodes: Node[], conditions: Piece[]): { workspace: WorkspaceJson; text: string } {
  let n = 0;
  let c = 0;
  const chain = (list: Node[]): { block: Raw | undefined; text: string } => {
    let head: Raw | undefined;
    let tail: Raw | undefined;
    const texts: string[] = [];
    for (const node of list) {
      n += 1;
      const block: Raw = { ...node.piece.json, id: `p${String(n)}` };
      const inputs: Raw = {};
      let text = node.piece.label;
      if (node.piece.hasCond) {
        const cond = conditions[c];
        c += 1;
        if (cond !== undefined) {
          n += 1;
          inputs[COND_INPUT] = { block: { ...cond.json, id: `p${String(n)}` } };
          text += ` ${cond.label}`;
        }
      }
      node.piece.bodies.forEach((name, i) => {
        const body = chain(node.bodies[i] ?? []);
        if (body.block !== undefined) inputs[name] = { block: body.block };
        text += ` [${body.text}]`;
      });
      if (Object.keys(inputs).length > 0) block['inputs'] = inputs;
      if (tail === undefined) head = block;
      else tail['next'] = { block };
      tail = block;
      texts.push(text);
    }
    return { block: head, text: texts.join(', ') };
  };
  const body = chain(nodes);
  const start: Raw = { type: 'cq_start', id: 'start', x: 40, y: 40, deletable: false };
  if (body.block !== undefined) start['next'] = { block: body.block };
  return {
    workspace: { blocks: { languageVersion: 0, blocks: [start] } } as WorkspaceJson,
    text: body.text,
  };
}

/**
 * Runs every arrangement of a parsons level's given blocks and counts the winning ones. A level
 * whose count is more than 1 can be won without the arrangement the level teaches.
 */
export function findParsonsArrangements(level: Level, options: ParsonsOptions = {}): ParsonsResult {
  const kind = (options.getKind ?? getGameKind)(level.kind);
  if (kind === undefined) throw new Error(`game kind "${level.kind}" is not implemented yet`);
  if (level.solution === undefined) throw new Error('level has no solution');
  const maxRuns = options.maxRuns ?? DEFAULT_MAX_PARSONS_RUNS;
  const maxExamples = options.maxExamples ?? 3;
  const { statements, conditions } = piecesOf(level.solution);
  const parsons: Level = { ...level, mode: 'parsons' };
  const result: ParsonsResult = { runs: 0, wins: 0, examples: [], complete: true };
  for (const forest of forests(statements)) {
    if (countConds(forest) !== conditions.length) continue;
    for (const order of distinctOrders(conditions)) {
      if (result.runs >= maxRuns || options.shouldStop?.() === true) {
        result.complete = false;
        return result;
      }
      const { workspace, text } = build(forest, order);
      result.runs += 1;
      if (runLevel({ kind, level: parsons, workspace }).result === 'success') {
        result.wins += 1;
        if (result.examples.length < maxExamples) result.examples.push(text);
      }
    }
  }
  return result;
}
