import type { WorkspaceJson } from '@codequest/content-schema';
import { CQ_START } from '../blocks/common';
import { isRecord, type JsonRecord, stableStringify } from '../run/editDistance';

/** Where a block plugs in: an input of `blockId`, or its next connection when `input` is null. */
export interface StepAnchor {
  blockId: string;
  input: string | null;
}

/** Id of the lone block in a next-step preview workspace. */
export const NEXT_STEP_BLOCK_ID = 'cq-next-step';

/**
 * One step towards the solution (blockly-integration.md §8). `block` is the solution block alone
 * (no next block, no child blocks, shadows kept) with id `NEXT_STEP_BLOCK_ID`, for a preview.
 * - `add`: drag `block` from the toolbox to `anchor`;
 * - `move`: drag the existing block `blockId` (with the blocks under it when `withTail`) to `anchor`;
 * - `edit`: `blockId` has the right type, change its fields to those of `block`;
 * - `replace`: delete `blockId` and put `block` from the toolbox in its place (`anchor`);
 * - `remove`: delete `blockId` (`loose`: a loose stack, removed to free capacity);
 * - `reset`: the block needed is nowhere (deleted in a parsons level): press "Làm lại".
 * `midStack`: blocks follow `blockId` in its stack, so deleting it needs "Xóa khối" (it heals).
 */
export type NextStep =
  | { kind: 'add'; block: JsonRecord; anchor: StepAnchor }
  | { kind: 'move'; blockId: string; anchor: StepAnchor; withTail: boolean }
  | { kind: 'edit'; block: JsonRecord; blockId: string }
  | { kind: 'replace'; block: JsonRecord; anchor: StepAnchor; blockId: string; midStack: boolean }
  | { kind: 'remove'; blockId: string; midStack: boolean; loose: boolean }
  | { kind: 'reset' };

export interface NextStepOptions {
  /**
   * Block types the child can drag from the toolbox. `add` / `replace` only use these; an empty
   * list (mode `parsons`) means every step reuses blocks already on the workspace. Default: all.
   */
  toolbox?: readonly string[];
  /** `workspace.remainingCapacity()`; at 0 a new block cannot be dragged, so a block goes first. */
  capacityLeft?: number;
}

/** A block of the program model: shadows are left out (a shadow-only difference is no step). */
interface Node {
  id: string;
  type: string;
  /** Type, fields and mutation: two blocks with the same key are interchangeable. */
  key: string;
  json: JsonRecord;
  inputs: Map<string, Node[]>;
}

interface Program {
  startId: string;
  chain: Node[];
  loose: Node[][];
}

interface Token {
  node: Node;
  depth: number;
  input: string;
  /** The chain (statement list or value input) holding `node`, and its index there. */
  list: Node[];
  index: number;
  parent: Node | null;
}

function blockKey(block: JsonRecord): string {
  const fields = isRecord(block['fields']) ? block['fields'] : {};
  return `${String(block['type'])}|${stableStringify(fields)}|${stableStringify(block['extraState'] ?? null)}`;
}

function inputsOf(block: JsonRecord): JsonRecord {
  return isRecord(block['inputs']) ? block['inputs'] : {};
}

/** The real block plugged into a connection; shadows are ignored on purpose. */
function realBlock(connection: unknown): JsonRecord | null {
  return isRecord(connection) && isRecord(connection['block']) ? connection['block'] : null;
}

function toChain(first: JsonRecord | null): Node[] {
  const chain: Node[] = [];
  for (let block = first; block !== null; block = realBlock(block['next'])) {
    const inputs = new Map<string, Node[]>();
    for (const [name, input] of Object.entries(inputsOf(block))) {
      const child = toChain(realBlock(input));
      if (child.length > 0) inputs.set(name, child);
    }
    chain.push({
      id: String(block['id']),
      type: String(block['type']),
      key: blockKey(block),
      json: block,
      inputs,
    });
  }
  return chain;
}

function isDefinition(block: JsonRecord): boolean {
  return block['type'] === 'procedures_defnoreturn' || block['type'] === 'procedures_defreturn';
}

function toProgram(workspace: WorkspaceJson): Program | null {
  const start = workspace.blocks.blocks.find((block) => block.type === CQ_START);
  if (start === undefined) return null;
  return {
    startId: String(start['id']),
    chain: toChain(realBlock(start['next'])),
    loose: workspace.blocks.blocks
      .filter((block) => block.type !== CQ_START && !isDefinition(block))
      .map((block) => toChain(block)),
  };
}

function tokensOf(chain: Node[], depth = 0, input = '', parent: Node | null = null): Token[] {
  return chain.flatMap((node, index) => [
    { node, depth, input, list: chain, index, parent },
    ...[...node.inputs.keys()]
      .sort()
      .flatMap((name) => tokensOf(node.inputs.get(name) ?? [], depth + 1, name, node)),
  ]);
}

/** Same position and same block; the program-order tokens of `editDistance`, minus shadows. */
function same(a: Token, b: Token): boolean {
  return a.depth === b.depth && a.input === b.input && a.node.key === b.node.key;
}

/**
 * Suffix edit distances: `d[i][j]` = edits from `cur[j..]` to `sol[i..]`. Changing a token into
 * one at another depth or input costs `moveCost`: 1 measures like `editDistance`, 2 makes the
 * chosen path only change blocks in place (a block cannot become one in another input).
 */
function suffixTable(sol: Token[], cur: Token[], moveCost: number): number[][] {
  const d = Array.from({ length: sol.length + 1 }, () => new Array<number>(cur.length + 1).fill(0));
  const at = (i: number, j: number): number => d[i]?.[j] ?? 0;
  for (let i = sol.length; i >= 0; i--) {
    for (let j = cur.length; j >= 0; j--) {
      const row = d[i];
      if (row === undefined) continue;
      if (i === sol.length) row[j] = cur.length - j;
      else if (j === cur.length) row[j] = sol.length - i;
      else {
        const s = sol[i];
        const c = cur[j];
        const match =
          s === undefined || c === undefined
            ? 1
            : same(s, c)
              ? 0
              : s.depth === c.depth && s.input === c.input
                ? 1
                : moveCost;
        row[j] = Math.min(at(i + 1, j + 1) + match, at(i + 1, j) + 1, at(i, j + 1) + 1);
      }
    }
  }
  return d;
}

function distance(solution: Program, current: Program): number {
  const sol = tokensOf(solution.chain);
  const cur = tokensOf(current.chain);
  return suffixTable(sol, cur, 2)[0]?.[0] ?? 0;
}

/**
 * Edits left between the blocks under `cq_start` of two programs, like `editDistance` but
 * shadows are ignored and a block can only change in place (a change to another depth or input
 * counts as delete + insert). Every `nextStep` lowers it. 0 when the programs match.
 */
export function structuralDistance(solution: WorkspaceJson, current: WorkspaceJson): number {
  const solProgram = toProgram(solution);
  const program = toProgram(current);
  return solProgram && program ? distance(solProgram, program) : 0;
}

// ---- Applying a step to a copy of the program (what the child's drag does in Blockly) ----

function cloneChain(chain: Node[]): Node[] {
  return chain.map((node) => ({
    ...node,
    inputs: new Map([...node.inputs].map(([name, list]) => [name, cloneChain(list)])),
  }));
}

function clone(program: Program): Program {
  return { ...program, chain: cloneChain(program.chain), loose: program.loose.map(cloneChain) };
}

/** The chain holding block `id` and its index there. */
function locate(program: Program, id: string): { list: Node[]; index: number } | null {
  const search = (chain: Node[]): { list: Node[]; index: number } | null => {
    for (const [index, node] of chain.entries()) {
      if (node.id === id) return { list: chain, index };
      for (const list of node.inputs.values()) {
        const found = search(list);
        if (found) return found;
      }
    }
    return null;
  };
  return search(program.chain) ?? program.loose.map(search).find((found) => found) ?? null;
}

/** The chain and index where a block plugged at `anchor` lands (before what is there now). */
function slot(program: Program, anchor: StepAnchor): { list: Node[]; index: number } | null {
  if (anchor.input === null) {
    if (anchor.blockId === program.startId) return { list: program.chain, index: 0 };
    const found = locate(program, anchor.blockId);
    return found && { list: found.list, index: found.index + 1 };
  }
  const found = locate(program, anchor.blockId);
  const node = found?.list[found.index];
  if (!node) return null;
  const list = node.inputs.get(anchor.input) ?? [];
  node.inputs.set(anchor.input, list);
  return { list, index: 0 };
}

function newNode(block: JsonRecord): Node {
  return {
    id: NEXT_STEP_BLOCK_ID,
    type: String(block['type']),
    key: blockKey(block),
    json: block,
    inputs: new Map(),
  };
}

function contains(stack: Node[], id: string): boolean {
  return stack.some(
    (node) => node.id === id || [...node.inputs.values()].some((list) => contains(list, id)),
  );
}

/** The program after the child does `step`; null when the step cannot be done. */
function apply(program: Program, step: NextStep): Program | null {
  const next = clone(program);
  next.loose = next.loose.filter((stack) => stack.length > 0);
  switch (step.kind) {
    case 'reset':
      return null;
    case 'edit': {
      const found = locate(next, step.blockId);
      const node = found?.list[found.index];
      if (!node) return null;
      node.key = blockKey(step.block);
      return next;
    }
    case 'remove': {
      const found = locate(next, step.blockId);
      if (!found) return null;
      // A loose stack goes to the trash whole; a block in the chain is deleted and the stack heals.
      if (step.loose) found.list.splice(found.index);
      else found.list.splice(found.index, 1);
      return next;
    }
    case 'add': {
      const target = slot(next, step.anchor);
      if (!target) return null;
      target.list.splice(target.index, 0, newNode(step.block));
      return next;
    }
    case 'replace': {
      const found = locate(next, step.blockId);
      if (!found) return null;
      found.list.splice(found.index, 1);
      const target = slot(next, step.anchor);
      if (!target) return null;
      target.list.splice(target.index, 0, newNode(step.block));
      return next;
    }
    case 'move': {
      const found = locate(next, step.blockId);
      if (!found) return null;
      // Blockly drags a block with everything under it.
      const stack = found.list.slice(found.index);
      if (contains(stack, step.anchor.blockId)) return null;
      found.list.splice(found.index);
      const target = slot(next, step.anchor);
      if (!target) return null;
      target.list.splice(target.index, 0, ...stack);
      return next;
    }
  }
}

// ---- Choosing the step ----

function previewBlock(block: JsonRecord): JsonRecord {
  const inputs: JsonRecord = {};
  for (const [name, input] of Object.entries(inputsOf(block))) {
    if (isRecord(input) && isRecord(input['shadow'])) inputs[name] = { shadow: input['shadow'] };
  }
  const preview: JsonRecord = { type: block['type'], id: NEXT_STEP_BLOCK_ID };
  if (isRecord(block['fields'])) preview['fields'] = block['fields'];
  if (block['extraState'] !== undefined) preview['extraState'] = block['extraState'];
  if (Object.keys(inputs).length > 0) preview['inputs'] = inputs;
  return preview;
}

/** One edit of the chosen alignment path, at solution token `i` / current token `j`. */
interface PathOp {
  op: 'sub' | 'ins' | 'del';
  i: number;
  j: number;
}

/**
 * Walks one optimal alignment (in-place changes cost 1, cross-position ones 2) and returns its
 * edits in program order, plus which current block each solution block is aligned with.
 */
function alignmentPath(sol: Token[], cur: Token[]): { ops: PathOp[]; aligned: Map<Node, Node> } {
  const d = suffixTable(sol, cur, 2);
  const at = (i: number, j: number): number => d[i]?.[j] ?? 0;
  const ops: PathOp[] = [];
  const aligned = new Map<Node, Node>();
  let i = 0;
  let j = 0;
  while (i < sol.length || j < cur.length) {
    const s = sol[i];
    const c = cur[j];
    const here = at(i, j);
    const inPlace =
      s !== undefined && c !== undefined && s.depth === c.depth && s.input === c.input;
    if (s && c && same(s, c) && here === at(i + 1, j + 1)) {
      aligned.set(s.node, c.node);
      i++;
      j++;
    } else if (s && c && inPlace && here === at(i + 1, j + 1) + 1) {
      // Only a block of the same type keeps its inputs; another type gets replaced.
      if (s.node.type === c.node.type) aligned.set(s.node, c.node);
      ops.push({ op: 'sub', i, j });
      i++;
      j++;
    } else if (c && here === at(i, j + 1) + 1) {
      ops.push({ op: 'del', i, j });
      j++;
    } else {
      ops.push({ op: 'ins', i, j });
      i++;
    }
  }
  return { ops, aligned };
}

/** Where solution token `i` goes in the child's program; null if its neighbour is not there yet. */
function anchorFor(
  sol: Token[],
  i: number,
  aligned: Map<Node, Node>,
  startId: string,
): StepAnchor | null {
  const token = sol[i];
  if (token === undefined) return null;
  const previous = token.list[token.index - 1];
  if (previous !== undefined) {
    const node = aligned.get(previous);
    return node ? { blockId: node.id, input: null } : null;
  }
  if (token.parent !== null) {
    const node = aligned.get(token.parent);
    return node ? { blockId: node.id, input: token.input } : null;
  }
  return { blockId: startId, input: null };
}

/** Where a block of the child's program is plugged in now. */
function currentAnchor(token: Token, startId: string): StepAnchor {
  const previous = token.list[token.index - 1];
  if (previous !== undefined) return { blockId: previous.id, input: null };
  if (token.parent !== null) return { blockId: token.parent.id, input: token.input };
  return { blockId: startId, input: null };
}

interface Candidates {
  steps: NextStep[];
  /** The first block the alignment adds from the toolbox, kept when nothing else helps. */
  firstAdd: NextStep | null;
  /** The alignment starts with an insertion (a new block is needed first). */
  needsBlockFirst: boolean;
}

/** Steps for the edits of one optimal alignment, in program order. */
function candidatesFor(
  solProgram: Program,
  program: Program,
  options: NextStepOptions,
): Candidates {
  const sol = tokensOf(solProgram.chain);
  const cur = tokensOf(program.chain);
  const { ops, aligned } = alignmentPath(sol, cur);
  const allowed = (type: string): boolean =>
    options.toolbox === undefined || options.toolbox.includes(type);
  const capacityFull = (options.capacityLeft ?? Infinity) <= 0;
  const midStack = (token: Token): boolean => token.index < token.list.length - 1;
  const looseNodes = program.loose.flatMap((stack) => tokensOf(stack).map((token) => token.node));
  const move = (node: Node, anchor: StepAnchor): NextStep => {
    const found = locate(program, node.id);
    const withTail = found !== null && found.index < found.list.length - 1;
    return { kind: 'move', blockId: node.id, anchor, withTail };
  };
  const moves = (key: string, from: number, anchor: StepAnchor, skip: string | null): NextStep[] =>
    [...cur.slice(from).map((token) => token.node), ...looseNodes]
      .filter((node) => node.key === key && node.id !== skip)
      .map((node) => move(node, anchor));

  let firstAdd: NextStep | null = null;
  const steps: NextStep[] = [];
  for (const op of ops) {
    const want = sol[op.i];
    const have = cur[op.j];
    if (op.op === 'del') {
      if (!have) continue;
      steps.push({ kind: 'remove', blockId: have.node.id, midStack: midStack(have), loose: false });
      // Deleting a block deletes what is inside it: lift what must stay out first.
      for (const inner of have.node.inputs.values()) {
        const first = inner[0];
        if (!first) continue;
        const home = sol.findIndex((token) => aligned.get(token.node) === first);
        const anchor = home === -1 ? null : anchorFor(sol, home, aligned, program.startId);
        if (anchor) steps.push(move(first, anchor));
        steps.push(move(first, currentAnchor(have, program.startId)));
      }
      continue;
    }
    if (!want) continue;
    if (op.op === 'sub' && have && want.node.type === have.node.type) {
      steps.push({ kind: 'edit', block: previewBlock(want.node.json), blockId: have.node.id });
      continue;
    }
    const anchor = anchorFor(sol, op.i, aligned, program.startId);
    if (anchor === null) continue;
    steps.push(...moves(want.node.key, op.j, anchor, have?.node.id ?? null));
    if (!allowed(want.node.type)) continue;
    const block = previewBlock(want.node.json);
    if (op.op === 'ins') {
      const add: NextStep = { kind: 'add', block, anchor };
      firstAdd ??= add;
      if (!capacityFull) steps.push(add);
    } else if (have) {
      steps.push({
        kind: 'replace',
        block,
        anchor,
        blockId: have.node.id,
        midStack: midStack(have),
      });
    }
  }
  // Blocks already in place whose solution parent is missing around them (a loop to wrap them):
  // once that parent block is on the workspace, move them into it.
  const used = new Set(aligned.values());
  const free = [...cur.map((token) => token.node), ...looseNodes].filter((node) => !used.has(node));
  for (const token of sol) {
    const inner = aligned.get(token.node);
    if (token.index !== 0 || token.parent === null || aligned.has(token.parent) || !inner) continue;
    const parentKey = token.parent.key;
    const host = free.find((node) => node.key === parentKey);
    if (host) steps.push(move(inner, { blockId: host.id, input: token.input }));
  }
  return { steps, firstAdd, needsBlockFirst: ops[0]?.op === 'ins' };
}

/**
 * Every single action that could matter, for when the alignment's own edits do not help: delete
 * any block, move any block (with its tail) or add a solution block to any place the solution
 * or the program suggests.
 */
function broadCandidates(
  solProgram: Program,
  program: Program,
  options: NextStepOptions,
): NextStep[] {
  const sol = tokensOf(solProgram.chain);
  const cur = tokensOf(program.chain);
  const { aligned } = alignmentPath(sol, cur);
  const looseTokens = program.loose.flatMap((stack) => tokensOf(stack));
  const anchors = new Map<string, StepAnchor>();
  const addAnchor = (anchor: StepAnchor | null) => {
    if (anchor) anchors.set(`${anchor.blockId}|${anchor.input ?? ''}`, anchor);
  };
  addAnchor({ blockId: program.startId, input: null });
  for (const [i] of sol.entries()) addAnchor(anchorFor(sol, i, aligned, program.startId));
  const inputsByKey = new Map<string, Set<string>>();
  for (const token of sol) {
    if (token.parent) {
      const names = inputsByKey.get(token.parent.key) ?? new Set<string>();
      names.add(token.input);
      inputsByKey.set(token.parent.key, names);
    }
  }
  for (const token of [...cur, ...looseTokens]) {
    addAnchor({ blockId: token.node.id, input: null });
    for (const name of inputsByKey.get(token.node.key) ?? []) {
      addAnchor({ blockId: token.node.id, input: name });
    }
  }
  const steps: NextStep[] = [];
  for (const token of cur) {
    steps.push({
      kind: 'remove',
      blockId: token.node.id,
      midStack: token.index < token.list.length - 1,
      loose: false,
    });
  }
  for (const token of [...cur, ...looseTokens]) {
    const withTail = token.index < token.list.length - 1;
    for (const anchor of anchors.values()) {
      if (anchor.blockId !== token.node.id) {
        steps.push({ kind: 'move', blockId: token.node.id, anchor, withTail });
      }
    }
  }
  if ((options.capacityLeft ?? Infinity) > 0) {
    const seen = new Set<string>();
    for (const token of sol) {
      if (seen.has(token.node.key)) continue;
      seen.add(token.node.key);
      if (options.toolbox !== undefined && !options.toolbox.includes(token.node.type)) continue;
      for (const anchor of anchors.values()) {
        steps.push({ kind: 'add', block: previewBlock(token.node.json), anchor });
      }
    }
  }
  return steps;
}

/** The whole program with ids, to tell a step that changes nothing. */
function shape(program: Program): string {
  return [program.chain, ...program.loose]
    .map((stack) =>
      tokensOf(stack)
        .map((t) => `${String(t.depth)}${t.input}:${t.node.id}=${t.node.key}`)
        .join(','),
    )
    .join(';');
}

function keyCounts(program: Program): Map<string, number> {
  const counts = new Map<string, number>();
  for (const stack of [program.chain, ...program.loose]) {
    for (const token of tokensOf(stack)) {
      counts.set(token.node.key, (counts.get(token.node.key) ?? 0) + 1);
    }
  }
  return counts;
}

/** True when `after` still has every block the solution needs that the toolbox cannot give back. */
function keepsNeededBlocks(
  solProgram: Program,
  program: Program,
  after: Program,
  options: NextStepOptions,
): boolean {
  if (options.toolbox === undefined) return true;
  const need = keyCounts(solProgram);
  const had = keyCounts(program);
  const has = keyCounts(after);
  for (const token of tokensOf(solProgram.chain)) {
    if (options.toolbox.includes(token.node.type)) continue;
    const key = token.node.key;
    const wanted = Math.min(need.get(key) ?? 0, had.get(key) ?? 0);
    if ((has.get(key) ?? 0) < wanted) return false;
  }
  return true;
}

function isLooseMove(program: Program, step: NextStep): boolean {
  return step.kind === 'move' && program.loose.some((stack) => contains(stack, step.blockId));
}

/**
 * The next thing the child should do to get closer to `solution`. Compares the blocks under
 * `cq_start` in program order (the tokens of `editDistance`, shadows ignored), aligns them with
 * an edit-distance table, and returns the first edit of that alignment that brings the program
 * closer (`structuralDistance`) once done the way Blockly does it: a drag takes the blocks below
 * along, a delete takes the blocks inside. When no single step can (a loop to unwrap or to
 * wrap around blocks), it returns a step after which one can. Null when the program already matches (or either
 * workspace has no `cq_start`). Pure, works on JSON.
 */
export function nextStep(
  solution: WorkspaceJson,
  current: WorkspaceJson,
  options: NextStepOptions = {},
): NextStep | null {
  const solProgram = toProgram(solution);
  const program = toProgram(current);
  if (solProgram === null || program === null) return null;
  const before = distance(solProgram, program);
  if (before === 0) return null;
  const { steps, firstAdd, needsBlockFirst } = candidatesFor(solProgram, program, options);

  // No free slot for the next new block: a loose stack (useless, yet it fills the capacity) goes first.
  const orphan = program.loose[0]?.[0];
  if ((options.capacityLeft ?? Infinity) <= 0 && orphan && needsBlockFirst) {
    return { kind: 'remove', blockId: orphan.id, midStack: false, loose: true };
  }

  const outcomesOf = (list: NextStep[]) =>
    list.flatMap((step) => {
      const after = apply(program, step);
      return after === null ||
        shape(after) === shape(program) ||
        !keepsNeededBlocks(solProgram, program, after, options)
        ? []
        : [{ step, after, now: distance(solProgram, after) }];
    });
  const helps = (after: Program, list: NextStep[]): boolean =>
    list.some((next) => {
      const done = apply(after, next);
      return (
        done !== null &&
        keepsNeededBlocks(solProgram, after, done, options) &&
        distance(solProgram, done) < before
      );
    });
  const choose = (list: NextStep[], wide: boolean): NextStep | null => {
    const outcomes = outcomesOf(list);
    // The step that helps most (first one on a tie), so a two-step plan always pays off.
    let strict: (typeof outcomes)[number] | undefined;
    for (const o of outcomes) if (o.now < before && (!strict || o.now < strict.now)) strict = o;
    if (strict) return strict.step;
    // Moving a loose block in is progress even when its tail still needs fixing.
    const looseIn = outcomes.find((o) => o.now <= before && isLooseMove(program, o.step));
    if (looseIn) return looseIn.step;
    // No single step helps (lift blocks out of a loop, add a loop then move blocks into it):
    // a step after which one does.
    const opening = outcomes.find(
      (o) =>
        helps(o.after, candidatesFor(solProgram, o.after, options).steps) ||
        (wide && helps(o.after, broadCandidates(solProgram, o.after, options))),
    );
    return opening?.step ?? null;
  };
  const chosen =
    choose(steps, false) ?? choose(broadCandidates(solProgram, program, options), true);
  if (chosen) return chosen;
  return firstAdd ?? steps[0] ?? { kind: 'reset' };
}
