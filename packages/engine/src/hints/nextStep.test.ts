import { describe, expect, it } from 'vitest';
import { Events, Options, serialization, Workspace } from 'blockly';
import type { WorkspaceJson } from '@codequest/content-schema';
import {
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
  it('every step, done in Blockly, lowers structuralDistance, at worst over two steps', () => {
    const rand = mulberry32(20261002);
    for (let round = 0; round < 300; round++) {
      const solution = ws(randomProgram(rand, 's'));
      let current = ws(randomProgram(rand, 'c'));
      let left = structuralDistance(solution, current);
      expect(left === 0).toBe(editDistance(solution, current) === 0);
      // Distance before the current two-step plan: a step may not help yet (lift blocks out of a
      // loop, add a loop to move blocks into), but the next one always ends below it.
      let planStart = left;
      let planSteps = 0;
      for (let guard = 0; left > 0; guard++) {
        expect(guard).toBeLessThan(60);
        const before = current;
        const step = nextStep(solution, current);
        if (step === null || step.kind === 'reset') {
          throw new Error(`no step: ${JSON.stringify({ solution, current })}`);
        }
        current = doInBlockly(current, step);
        const now = structuralDistance(solution, current);
        const context = JSON.stringify({ step, solution, before });
        planSteps++;
        if (now < planStart) {
          planStart = now;
          planSteps = 0;
        }
        expect(planSteps, context).toBeLessThan(2);
        left = now;
      }
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
