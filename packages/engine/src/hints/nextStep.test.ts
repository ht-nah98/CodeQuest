import { describe, expect, it } from 'vitest';
import { Events, Options, serialization, Workspace } from 'blockly';
import type { WorkspaceJson } from '@codequest/content-schema';
import {
  correctPrefix,
  editDistance,
  mulberry32,
  NEXT_STEP_BLOCK_ID,
  type NextStep,
  nextStep,
  registerBlockSpecs,
  structuralDistance,
  type StepAnchor,
} from '../index';
import { lineBlocks } from '../testing/lineKind.test';

type Block = Record<string, unknown> & { type: string; id: string };

/** "khi bắt đầu" (`startId`) followed by `blocks` in a chain, plus loose top blocks. */
function ws(blocks: Block[], loose: Block[] = [], startId = 'start'): WorkspaceJson {
  const next = chain(blocks);
  return {
    blocks: {
      languageVersion: 0,
      blocks: [{ type: 'cq_start', id: startId, ...(next && { next }) }, ...loose],
    },
  };
}
function chain(blocks: Block[]): { block: Block } | undefined {
  let next: { block: Block } | undefined;
  for (const block of [...blocks].reverse()) next = { block: { ...block, ...(next && { next }) } };
  return next;
}
const b =
  (type: string) =>
  (id: string): Block => ({ type, id });
const [A, B, C, X] = ['line_step', 'line_win', 'line_boom', 'line_say'].map(b) as [
  (id: string) => Block,
  (id: string) => Block,
  (id: string) => Block,
  (id: string) => Block,
];
const repeat = (id: string, times: number, ...body: Block[]): Block => {
  const inner = chain(body);
  return {
    type: 'cq_repeat',
    id,
    fields: { TIMES: times },
    ...(inner && { inputs: { DO: inner } }),
  };
};
const preview = (type: string, extra: Record<string, unknown> = {}) => ({
  type,
  id: NEXT_STEP_BLOCK_ID,
  ...extra,
});
const abc = ws([A('s1'), B('s2'), C('s3')]);

describe('nextStep: insert, delete, move (blockly-integration.md §8)', () => {
  it('is null when the program matches, whatever the ids and positions', () => {
    expect(nextStep(abc, ws([A('a'), { ...B('b'), x: 9 }, C('c')]))).toBeNull();
  });

  it('removes an extra block in the middle instead of replacing (ABC vs AXBC)', () => {
    expect(nextStep(abc, ws([A('a'), X('x'), B('b'), C('c')]))).toEqual({
      kind: 'remove',
      blockId: 'x',
      midStack: true,
      loose: false,
    });
  });

  it('adds a missing block in the middle (ABC vs AC)', () => {
    expect(nextStep(abc, ws([A('a'), C('c')]))).toEqual({
      kind: 'add',
      block: preview('line_win'),
      anchor: { blockId: 'a', input: null },
    });
  });

  it('adds the first block of an empty program under "khi bắt đầu"', () => {
    expect(nextStep(abc, ws([], [], 'my-start'))).toMatchObject({
      kind: 'add',
      anchor: { blockId: 'my-start', input: null },
    });
  });

  it('moves a block that is already further down (ABC vs ACB)', () => {
    expect(nextStep(abc, ws([A('a'), C('c'), B('b')]))).toEqual({
      kind: 'move',
      blockId: 'b',
      anchor: { blockId: 'a', input: null },
      withTail: false,
    });
  });

  it('removes an extra last block, not mid-stack', () => {
    expect(nextStep(abc, ws([A('a'), B('b'), C('c'), C('y')]))).toEqual({
      kind: 'remove',
      blockId: 'y',
      midStack: false,
      loose: false,
    });
  });

  it('replaces a wrong block with a toolbox block', () => {
    expect(nextStep(ws([A('s1'), B('s2')]), ws([A('a'), X('x')]))).toEqual({
      kind: 'replace',
      block: preview('line_win'),
      anchor: { blockId: 'a', input: null },
      blockId: 'x',
      midStack: false,
    });
  });

  it('adds into an empty statement input', () => {
    const solution = ws([repeat('r', 2, A('in'))]);
    expect(nextStep(solution, ws([repeat('c', 2)]))).toEqual({
      kind: 'add',
      block: preview('line_step'),
      anchor: { blockId: 'c', input: 'DO' },
    });
  });
});

describe('nextStep: prefix first (step-by-step hint)', () => {
  // Solution: đi, nhảy, đi, nổ (four blocks), and one with a loop body.
  const abcd = ws([A('s1'), B('s2'), A('s3'), C('s4')]);
  const addAfter = (type: string, blockId: string) => ({
    kind: 'add',
    block: preview(type),
    anchor: { blockId, input: null },
  });

  it('empty program: the first block under "khi bắt đầu"', () => {
    expect(nextStep(abcd, ws([]))).toEqual(addAfter('line_step', 'start'));
  });

  it('a correct start of 1, 2 and 3 blocks: the block right after it', () => {
    expect(nextStep(abcd, ws([A('a')]))).toEqual(addAfter('line_win', 'a'));
    expect(nextStep(abcd, ws([A('a'), B('b')]))).toEqual(addAfter('line_step', 'b'));
    expect(nextStep(abcd, ws([A('a'), B('b'), A('c')]))).toEqual(addAfter('line_boom', 'c'));
  });

  it('each step, once done, moves the hint one block further', () => {
    let current = ws([]);
    const seen: number[] = [];
    for (let step = nextStep(abcd, current); step; step = nextStep(abcd, current)) {
      current = doInBlockly(current, step);
      seen.push(correctPrefix(abcd, current));
    }
    expect(seen).toEqual([1, 2, 3, 4]);
  });

  it('a wrong block at position 2 is pointed at to be changed, not step 1 again', () => {
    expect(nextStep(abcd, ws([A('a'), X('x')]))).toEqual({
      kind: 'replace',
      block: preview('line_win'),
      anchor: { blockId: 'a', input: null },
      blockId: 'x',
      midStack: false,
    });
    // A block that is right one place further down stays: the missing one goes in above it.
    expect(nextStep(abcd, ws([A('a'), A('w')]))).toEqual(addAfter('line_win', 'a'));
  });

  it('a first block of the right type with the wrong number is edited in place', () => {
    // w06-l07: "tiến 2, gắp, tiến 1, …"; the child dragged "tiến" (1 by default) under the start.
    const forward = (id: string, times: number): Block => repeat(id, times);
    const solution = ws([forward('s1', 2), B('s2'), forward('s3', 1), C('s4')]);
    expect(nextStep(solution, ws([forward('kid', 1)]))).toEqual({
      kind: 'edit',
      block: preview('cq_repeat', { fields: { TIMES: 2 } }),
      blockId: 'kid',
    });
  });

  it('a first block of another type: adding above wins when it leaves fewer edits', () => {
    // "đi, nhảy, đi, nổ"; the child put "nổ" first: it stays for the end, "đi" goes above it.
    expect(nextStep(abcd, ws([C('kid')]))).toEqual(addAfter('line_step', 'start'));
  });

  it('edits a real dropdown and a box field (FieldCqVar) in Blockly', () => {
    const set = (id: string, box: string): Block => ({
      type: 'cq_var_set',
      id,
      fields: { VAR: box, NUM: 0 },
    });
    const ask = (id: string, op: string): Block => ({
      type: 'cq_var_compare',
      id,
      fields: { VAR: 'bamboo', OP: op, NUM: 2 },
    });
    const when = (id: string, op: string): Block => ({
      type: 'cq_if',
      id,
      inputs: { COND: { block: ask(`${id}-ask`, op) }, DO: { block: A(`${id}-a`) } },
    });
    const solution = ws([set('s1', 'bamboo'), when('s2', 'EQ')]);
    let current = ws([set('box', 'red'), when('if', 'LT')]);
    const first = nextStep(solution, current);
    expect(first).toEqual({
      kind: 'edit',
      block: preview('cq_var_set', { fields: { VAR: 'bamboo', NUM: 0 } }),
      blockId: 'box',
    });
    if (first === null) return;
    current = doInBlockly(current, first);
    const second = nextStep(solution, current);
    expect(second).toEqual({
      kind: 'edit',
      block: preview('cq_var_compare', { fields: { VAR: 'bamboo', OP: 'EQ', NUM: 2 } }),
      blockId: 'if-ask',
    });
    if (second === null) return;
    current = doInBlockly(current, second);
    expect(nextStep(solution, current)).toBeNull();
  });

  it('bughunt: a block in the wrong place is moved, never added twice', () => {
    // w07-l05: "đặt hộp" inside the loop instead of before it.
    const solution = ws([X('s1'), repeat('s2', 6, A('s3'), B('s4'))]);
    const buggy = ws([repeat('loop', 6, X('set'), A('a'), B('b'))]);
    expect(nextStep(solution, buggy)).toMatchObject({ kind: 'move', blockId: 'set' });
    // w01-l11: two blocks swapped; the wrong one is changed, no copy is added before it.
    const swapped = nextStep(abcd, ws([A('a'), A('c'), B('b'), C('d')]));
    expect(swapped?.kind).not.toBe('add');
  });

  it('extra blocks after a complete program: remove the first extra one', () => {
    expect(nextStep(abcd, ws([A('a'), B('b'), A('c'), C('d'), X('x'), B('y')]))).toEqual({
      kind: 'remove',
      blockId: 'x',
      midStack: true,
      loose: false,
    });
    expect(nextStep(abcd, ws([A('a'), B('b'), A('c'), C('d'), B('y')]))).toMatchObject({
      kind: 'remove',
      blockId: 'y',
    });
  });

  it('inside a loop body: the next block of the body, then the block after the loop', () => {
    const solution = ws([A('s1'), repeat('s2', 3, A('s3'), B('s4')), C('s5')]);
    expect(nextStep(solution, ws([A('a'), repeat('r', 3)]))).toEqual({
      kind: 'add',
      block: preview('line_step'),
      anchor: { blockId: 'r', input: 'DO' },
    });
    expect(nextStep(solution, ws([A('a'), repeat('r', 3, A('in'))]))).toEqual(
      addAfter('line_win', 'in'),
    );
    expect(nextStep(solution, ws([A('a'), repeat('r', 3, A('in'), B('in2'))]))).toEqual(
      addAfter('line_boom', 'r'),
    );
    // A wrong block in the body is pointed at, not the loop.
    expect(nextStep(solution, ws([A('a'), repeat('r', 3, A('in'), X('x'))]))).toMatchObject({
      kind: 'replace',
      blockId: 'x',
      anchor: { blockId: 'in', input: null },
    });
  });

  it('with several solutions, follows the one the child has started', () => {
    const other = ws([B('t1'), A('t2'), A('t3'), C('t4')]);
    expect(nextStep([abcd, other], ws([B('b')]))).toEqual(addAfter('line_step', 'b'));
    expect(nextStep([abcd, other], ws([A('a')]))).toEqual(addAfter('line_win', 'a'));
    expect(nextStep([abcd, other], ws([B('b'), A('a'), A('c'), C('d')]))).toBeNull();
    expect(nextStep([], ws([A('a')]))).toBeNull();
  });
});

describe('nextStep: edit', () => {
  it('edits a field of the right block, then keeps diffing inside it', () => {
    const solution = ws([repeat('r', 2, A('in'))]);
    expect(nextStep(solution, ws([repeat('c', 3, A('d'))]))).toEqual({
      kind: 'edit',
      block: preview('cq_repeat', { fields: { TIMES: 2 } }),
      blockId: 'c',
    });
    expect(nextStep(solution, ws([repeat('c', 3, B('d'))]))).toMatchObject({ kind: 'edit' });
    expect(nextStep(solution, ws([repeat('c', 2, B('d'))]))).toMatchObject({
      kind: 'replace',
      blockId: 'd',
      anchor: { blockId: 'c', input: 'DO' },
    });
  });

  it('ignores shadow-only differences and keeps shadows in the preview', () => {
    const say = (id: string, n: number): Block => ({
      type: 'line_say',
      id,
      inputs: { VALUE: { shadow: { type: 'math_number', id: `${id}-n`, fields: { NUM: n } } } },
    });
    expect(nextStep(ws([say('s', 1)]), ws([say('c', 2)]))).toBeNull();
    expect(nextStep(ws([say('s', 1)]), ws([]))).toMatchObject({
      block: {
        type: 'line_say',
        inputs: { VALUE: { shadow: { type: 'math_number', id: 's-n', fields: { NUM: 1 } } } },
      },
    });
  });
});

describe('nextStep: unwrapping', () => {
  it('lifts blocks out of an extra loop before deleting it', () => {
    const solution = ws([A('s1'), B('s2')]);
    const wrapped = ws([repeat('r', 3, A('a'), B('b'))]);
    expect(nextStep(solution, wrapped)).toEqual({
      kind: 'move',
      blockId: 'a',
      anchor: { blockId: 'start', input: null },
      withTail: true,
    });
    const lifted = doInBlockly(wrapped, {
      kind: 'move',
      blockId: 'a',
      anchor: { blockId: 'start', input: null },
      withTail: true,
    });
    expect(nextStep(solution, lifted)).toEqual({
      kind: 'remove',
      blockId: 'r',
      midStack: false,
      loose: false,
    });
  });
});

describe('nextStep: parsons, bughunt and capacity', () => {
  it('moves a loose block in parsons instead of asking for a toolbox block', () => {
    const loose = [{ ...B('loose'), x: 200, y: 40 }];
    expect(nextStep(abc, ws([A('a')], loose), { toolbox: [] })).toEqual({
      kind: 'move',
      blockId: 'loose',
      anchor: { blockId: 'a', input: null },
      withTail: false,
    });
  });

  it('moves a loose stack with its tail', () => {
    const stack = [{ ...B('b'), next: { block: C('c') } }];
    expect(nextStep(abc, ws([A('a')], stack), { toolbox: [] })).toMatchObject({
      kind: 'move',
      blockId: 'b',
      withTail: true,
    });
  });

  it('moves a block from further down the chain in parsons (never add / replace)', () => {
    const step = nextStep(abc, ws([A('a'), C('c'), B('b')]), { toolbox: [] });
    expect(step).toMatchObject({ kind: 'move', blockId: 'b' });
    const swapped = nextStep(ws([A('s1'), B('s2')]), ws([B('b'), A('a')]), { toolbox: [] });
    expect(swapped?.kind).toBe('move');
  });

  it('only uses toolbox blocks for add / replace', () => {
    expect(nextStep(abc, ws([A('a'), C('c')]), { toolbox: ['line_step'] })).toEqual({
      kind: 'reset',
    });
    expect(nextStep(abc, ws([A('a'), C('c')]), { toolbox: ['line_win'] })?.kind).toBe('add');
  });

  it('asks for "Làm lại" in parsons when the needed block is gone', () => {
    expect(nextStep(abc, ws([A('a'), C('c')]), { toolbox: [] })).toEqual({ kind: 'reset' });
  });

  it('frees a slot first when capacity is full: a loose stack, then an extra block', () => {
    const loose = [{ ...X('junk'), x: 300, y: 0 }];
    expect(nextStep(abc, ws([A('a'), C('c')], loose), { capacityLeft: 0 })).toEqual({
      kind: 'remove',
      blockId: 'junk',
      midStack: false,
      loose: true,
    });
    const extra = ws([A('a'), C('c'), repeat('r', 2)]);
    const solution = ws([A('s1'), B('s2'), C('s3'), repeat('s4', 2, A('s5'))]);
    expect(
      nextStep(solution, ws([A('a'), C('c'), repeat('r', 2, B('y'))]), { capacityLeft: 0 }),
    ).toMatchObject({
      kind: 'move',
      blockId: 'y',
    });
    expect(nextStep(solution, extra, { capacityLeft: 1 })?.kind).toBe('add');
    // Nothing to free: the add stays.
    expect(nextStep(abc, ws([A('a'), C('c')]), { capacityLeft: 0 })?.kind).toBe('add');
    expect(nextStep(abc, ws([A('a'), C('c')]), { capacityLeft: 1 })?.kind).toBe('add');
  });

  it('is null without "khi bắt đầu" on either side', () => {
    const none: WorkspaceJson = { blocks: { languageVersion: 0, blocks: [A('a')] } };
    expect(nextStep(none, ws([]))).toBeNull();
    expect(nextStep(abc, none)).toBeNull();
  });
});

// ---- Property: doing the step in real (headless) Blockly brings the program strictly closer ----

/** Does `step` the way the child would in Blockly and returns the new workspace JSON. */
function doInBlockly(json: WorkspaceJson, step: NextStep): WorkspaceJson {
  registerBlockSpecs(lineBlocks);
  const workspace = new Workspace(new Options({}));
  Events.disable();
  try {
    serialization.workspaces.load(json, workspace, { recordUndo: false });
    const get = (id: string) => {
      const block = workspace.getBlockById(id);
      if (!block) throw new Error(`no block ${id}`);
      return block;
    };
    const connect = (anchor: StepAnchor, id: string) => {
      const target = get(anchor.blockId);
      const connection =
        anchor.input === null ? target.nextConnection : target.getInput(anchor.input)?.connection;
      const previous = get(id).previousConnection;
      if (!connection || !previous)
        throw new Error(`no connection: ${JSON.stringify({ json, step })}`);
      connection.connect(previous);
    };
    const add = (block: Record<string, unknown>, anchor: StepAnchor) => {
      // A block dragged from the toolbox gets a fresh id.
      const fresh = { ...block };
      delete fresh['id'];
      const created = serialization.blocks.append(
        { ...fresh, type: String(block['type']) },
        workspace,
      );
      connect(anchor, created.id);
    };
    switch (step.kind) {
      case 'add':
        add(step.block, step.anchor);
        break;
      case 'replace':
        get(step.blockId).dispose(true);
        add(step.block, step.anchor);
        break;
      case 'remove':
        get(step.blockId).dispose(!step.loose);
        break;
      case 'move':
        get(step.blockId).unplug(false);
        connect(step.anchor, step.blockId);
        break;
      case 'edit': {
        const fields = step.block['fields'] as Record<string, unknown>;
        for (const [name, value] of Object.entries(fields)) {
          get(step.blockId).setFieldValue(value, name);
        }
        break;
      }
      case 'reset':
        throw new Error('reset in build mode');
    }
    return serialization.workspaces.save(workspace) as WorkspaceJson;
  } finally {
    Events.enable();
    workspace.dispose();
  }
}

function randomProgram(rand: () => number, prefix: string): Block[] {
  let n = 0;
  const make = (depth: number): Block[] =>
    Array.from({ length: Math.floor(rand() * (depth === 0 ? 6 : 3)) }, () => {
      const id = `${prefix}${String(n++)}`;
      const pick = rand();
      if (depth < 2 && pick < 0.25) return repeat(id, rand() < 0.5 ? 2 : 3, ...make(depth + 1));
      return (pick < 0.55 ? A : pick < 0.8 ? B : C)(id);
    });
  return make(0);
}

describe('nextStep property', () => {
  it('every step, done in Blockly, lengthens the correct start or lowers structuralDistance', () => {
    const rand = mulberry32(20261002);
    for (let round = 0; round < 300; round++) {
      const solution = ws(randomProgram(rand, 's'));
      let current = ws(randomProgram(rand, 'c'));
      let left = structuralDistance(solution, current);
      expect(left === 0).toBe(editDistance(solution, current) === 0);
      // Progress is (correct start, edits left): a longer correct start, or the same one with
      // fewer edits left. A step of the fallback search may not help yet (lift blocks out of a
      // loop, add a loop to move blocks into), but the next one always does.
      let plan = { prefix: correctPrefix(solution, current), left };
      let planSteps = 0;
      const budget = left + 3;
      let steps = 0;
      for (let guard = 0; left > 0; guard++) {
        expect(guard).toBeLessThan(60);
        const before = current;
        const step = nextStep(solution, current);
        if (step === null || step.kind === 'reset') {
          throw new Error(`no step: ${JSON.stringify({ solution, current })}`);
        }
        current = doInBlockly(current, step);
        steps++;
        const now = {
          prefix: correctPrefix(solution, current),
          left: structuralDistance(solution, current),
        };
        const context = JSON.stringify({ step, solution, before });
        planSteps++;
        if (now.prefix > plan.prefix || (now.prefix === plan.prefix && now.left < plan.left)) {
          plan = now;
          planSteps = 0;
        }
        expect(planSteps, context).toBeLessThan(2);
        left = now.left;
      }
      // Never far more steps than the edits the program needed at first.
      expect(steps).toBeLessThanOrEqual(budget);
      expect(nextStep(solution, current)).toBeNull();
      expect(editDistance(solution, current)).toBe(0);
    }
  });

  it('solves a scrambled parsons level with moves only', () => {
    const rand = mulberry32(7);
    for (let round = 0; round < 100; round++) {
      const blocks = randomProgram(rand, 's');
      const solution = ws(blocks);
      const pieces = blocks
        .map((block, k) => ({ block: { ...block, x: 10 * k, y: 0 }, order: rand() }))
        .sort((a, b2) => a.order - b2.order)
        .map((piece) => piece.block);
      let current = ws([], pieces);
      for (let guard = 0; nextStep(solution, current, { toolbox: [] }) !== null; guard++) {
        const step = nextStep(solution, current, { toolbox: [] });
        expect(guard, JSON.stringify({ step, solution, current })).toBeLessThan(40);
        expect(['move', 'edit', 'remove'], JSON.stringify({ solution, current })).toContain(
          step?.kind,
        );
        if (step) current = doInBlockly(current, step);
      }
      expect(editDistance(solution, current)).toBe(0);
    }
  });

  it('strictly lowers editDistance on the review examples', () => {
    for (const current of [
      ws([A('a'), X('x'), B('b'), C('c')]),
      ws([A('a'), C('c')]),
      ws([A('a'), C('c'), B('b')]),
    ]) {
      const step = nextStep(abc, current);
      if (step === null) throw new Error('expected a step');
      expect(editDistance(abc, doInBlockly(current, step))).toBeLessThan(
        editDistance(abc, current),
      );
    }
  });
});
