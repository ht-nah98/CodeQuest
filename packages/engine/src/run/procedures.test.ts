// Spells ("phép thuật", ADR-0023 §1–§3): compile, run, events, reasons, effective loop depth,
// block counts, bughunt edits and the tier-2 next step, on the fake `line` kind.
import { Events, FieldDropdown, Options, Workspace, serialization } from 'blockly';
import type { Level, LevelProcedure, WorkspaceJson } from '@codequest/content-schema';
import { describe, expect, it } from 'vitest';
import {
  analyzeWorkspace,
  editDistance,
  FieldCqProc,
  loopDepth,
  nextStep,
  NO_PROCEDURE,
  registerBlockSpecs,
  runLevel,
  setWorkspaceProcedures,
} from '../index';
import { lineBlocks, lineKind, program, step } from '../testing/lineKind.test';

const SPELLS: LevelProcedure[] = [
  { id: 'hop', name: 'nhảy cóc' },
  { id: 'skip', name: 'bước dài' },
];

function chain(blocks: object[]): object | undefined {
  let next: object | undefined;
  for (const block of [...blocks].reverse()) {
    next = next === undefined ? block : { ...block, next: { block: next } };
  }
  return next;
}

function def(id: string, spell: string, body: object[]): object {
  const first = chain(body);
  return {
    type: 'cq_proc_def',
    id,
    fields: { PROC: spell },
    ...(first !== undefined && { inputs: { BODY: { block: first } } }),
  };
}

const call = (id: string, spell = 'hop'): object => ({
  type: 'cq_proc_call',
  id,
  fields: { PROC: spell },
});

const repeat = (id: string, times: number, body: object[]): object => ({
  type: 'cq_repeat',
  id,
  fields: { TIMES: times },
  inputs: { DO: { block: chain(body) } },
});

const hop = def('def1', 'hop', [step('h1'), step('h2')]);

function level(overrides: Partial<Level> = {}): Level {
  const base: Level = {
    id: 'proc-test',
    worldId: '_sandbox',
    stage: 'practice',
    kind: 'runner',
    mode: 'build',
    title: 't',
    objective: 'o',
    learningGoal: 'g',
    toolbox: [],
    config: { length: 10, goal: 6 },
    hints: [],
    procedures: SPELLS,
  };
  return { ...base, ...overrides };
}

function run(workspace: WorkspaceJson, overrides: Partial<Level> = {}) {
  return runLevel({ kind: lineKind, level: level(overrides), workspace });
}

describe('spells run in place (ADR-0023 §3)', () => {
  it('runs the body once per call: 0, 1 and 3 calls', () => {
    expect(run(program([step('a')], [hop])).answerKey).toBeUndefined();
    expect(run(program([step('a')], [hop]))).toMatchObject({
      result: 'incomplete',
      reasonCode: 'NOT_AT_GOAL',
    });
    const once = run(program([call('c1')], [hop]), {
      mode: 'predict',
      initialWorkspace: program([call('c1')], [hop]),
    });
    expect(once.answerKey).toBe('NOT_AT_GOAL@2');
    expect(run(program([call('c1'), call('c2'), call('c3')], [hop])).result).toBe('success');
  });

  it('teaching a spell without calling it runs nothing of it, yet its blocks count', () => {
    const outcome = run(program([step('a')], [hop]));
    expect(outcome.events.filter((event) => event.type === 'step')).toHaveLength(1);
    expect(outcome.stats.blocksUsed).toBe(4);
    const analysis = analyzeWorkspace(program([step('a')], [hop]));
    expect(analysis.blocksUsed).toBe(4);
    expect(analysis.orphanBlockIds).toEqual([]);
    expect(analysis.programBlockIds).toEqual(['a', 'def1', 'h1', 'h2']);
  });

  it('calls inside a loop, then goes on with the block right after the call', () => {
    expect(run(program([repeat('r', 3, [call('c1')])], [hop])).result).toBe('success');
    const outcome = run(program([call('c1'), step('a')], [hop]), {
      mode: 'predict',
      initialWorkspace: program([call('c1'), step('a')], [hop]),
    });
    expect(outcome.answerKey).toBe('NOT_AT_GOAL@3');
    const trace = outcome.events.map((event) =>
      event.type === 'call' || event.type === 'ret'
        ? `${event.type}:${(event as { id: string }).id}`
        : `${event.type}:${String(event.blockId)}`,
    );
    expect(trace).toEqual([
      'highlight:start',
      'highlight:c1',
      'call:hop',
      'highlight:h1',
      'step:h1',
      'highlight:h2',
      'step:h2',
      'ret:hop',
      'highlight:a',
      'step:a',
    ]);
    expect(outcome.events.find((event) => event.type === 'call')?.blockId).toBe('c1');
  });

  it('counts call and ret towards maxActions', () => {
    // 3 calls × (call + 2 steps + ret) = 12 actions.
    const workspace = program([call('c1'), call('c2'), call('c3')], [hop]);
    expect(run(workspace, { limits: { maxActions: 12 } }).result).toBe('success');
    expect(run(workspace, { limits: { maxActions: 11 } })).toMatchObject({
      result: 'timeout',
      reasonCode: 'TIMEOUT',
    });
  });

  it('is deterministic: two runs give the same event log', () => {
    const workspace = program(
      [repeat('r', 2, [call('c1')]), call('c2', 'skip')],
      [hop, def('def2', 'skip', [step('s1')])],
    );
    expect(run(workspace)).toEqual(run(workspace));
  });
});

describe('static spell errors, before any event', () => {
  it.each([
    ['NO_SPELL', program([call('c1')])],
    ['NO_SPELL', program([call('c1', 'skip')], [hop])],
    ['TWO_SPELLS', program([call('c1')], [hop, def('def2', 'hop', [step('x')])])],
    ['EMPTY_SPELL', program([call('c1')], [def('def1', 'hop', [])])],
    ['SPELL_IN_SPELL', program([call('c1')], [def('def1', 'hop', [step('x'), call('c9')])])],
    [
      'SPELL_IN_SPELL',
      program(
        [call('c1')],
        [
          hop,
          {
            type: 'procedures_defnoreturn',
            id: 'fn',
            fields: { NAME: 'f' },
            inputs: { STACK: { block: call('c9') } },
          },
        ],
      ),
    ],
    ['NO_SPELL', program([call('c1', NO_PROCEDURE)], [def('def1', NO_PROCEDURE, [step('x')])])],
  ])('%s', (reason, workspace) => {
    const outcome = run(workspace);
    expect(outcome).toMatchObject({ result: 'error', reasonCode: reason, events: [] });
  });

  it('an empty spell that is never called is fine', () => {
    expect(run(program([step('a')], [def('def1', 'hop', [])])).result).toBe('incomplete');
  });
});

describe('parsons and spells', () => {
  const parsons = (workspace: WorkspaceJson) =>
    run(workspace, {
      mode: 'parsons',
      initialWorkspace: workspace,
      config: { length: 10, goal: 1 },
    });

  it('a spell taught but not called is UNUSED_BLOCKS', () => {
    expect(parsons(program([step('a')], [hop]))).toMatchObject({
      result: 'incomplete',
      reasonCode: 'UNUSED_BLOCKS',
    });
  });

  it('a called spell counts its dạy phép block as run', () => {
    const workspace = program([call('c1')], [def('def1', 'hop', [step('h1')])]);
    expect(parsons(workspace).result).toBe('success');
  });
});

describe('effective loop depth (ADR-0023 §3)', () => {
  const looping = def('def1', 'hop', [repeat('r1', 2, [step('h1')])]);

  it('a spell with a loop called from a loop is 2', () => {
    expect(loopDepth(program([repeat('r', 2, [call('c1')])], [looping]))).toBe(2);
  });

  it('a spell with a loop called outside loops is 1; a plain spell in a loop is 1', () => {
    expect(loopDepth(program([call('c1')], [looping]))).toBe(1);
    expect(loopDepth(program([repeat('r', 2, [call('c1')])], [hop]))).toBe(1);
  });

  it('a spell nobody calls counts its own nesting only', () => {
    expect(loopDepth(program([step('a')], [looping]))).toBe(1);
    expect(loopDepth(program([step('a')], [hop]))).toBe(0);
  });
});

describe('bughunt edits and the next step see the spell stacks', () => {
  const order = SPELLS.map((spell) => spell.id);

  it('an edit inside the body is one edit', () => {
    const fixed = program([call('c1'), call('c2')], [hop]);
    const broken = program([call('c1'), call('c2')], [def('def1', 'hop', [step('h1')])]);
    expect(editDistance(broken, fixed, order)).toBe(1);
    const outcome = run(fixed, { mode: 'bughunt', initialWorkspace: broken });
    expect(outcome.edits).toBe(1);
  });

  it('compares spells in procedures order, whatever order they are written in', () => {
    const skip = def('def2', 'skip', [step('s1')]);
    const a = program([call('c1')], [hop, skip]);
    const b = program([call('c1')], [skip, hop]);
    expect(editDistance(a, b, order)).toBe(0);
  });

  it('nextStep adds the missing block into the body of the spell', () => {
    const solution = program([call('c1'), call('c2')], [hop]);
    const current = program([call('x1'), call('x2')], [def('d', 'hop', [step('y1')])]);
    expect(nextStep(solution, current, { procedureOrder: order })).toMatchObject({
      kind: 'add',
      block: { type: 'line_step' },
      anchor: { blockId: 'y1', input: null },
    });
    const empty = program([call('x1'), call('x2')], [def('d', 'hop', [])]);
    expect(nextStep(solution, empty, { procedureOrder: order })).toMatchObject({
      kind: 'add',
      block: { type: 'line_step' },
      anchor: { blockId: 'd', input: 'BODY' },
    });
  });

  it('nextStep adds a missing first spell instead of renaming a correct second one', () => {
    const skip = def('def2', 'skip', [step('s1')]);
    const solution = program([call('c1'), call('c2', 'skip')], [hop, skip]);
    const current = program([call('x1'), call('x2', 'skip')], [def('d2', 'skip', [step('y1')])]);
    expect(nextStep(solution, current, { procedureOrder: order })).toMatchObject({
      kind: 'add',
      block: { type: 'cq_proc_def', fields: { PROC: 'hop' } },
      anchor: { blockId: '', input: null },
    });
  });

  it('nextStep asks for a missing dạy phép block as a new top block', () => {
    const solution = program([call('c1'), call('c2')], [hop]);
    const current = program([call('x1'), call('x2')]);
    expect(nextStep(solution, current, { procedureOrder: order })).toMatchObject({
      kind: 'add',
      block: { type: 'cq_proc_def', fields: { PROC: 'hop' } },
      anchor: { blockId: '', input: null },
    });
  });
});

describe('field_cq_proc', () => {
  it('shows a placeholder without a level and keeps any valid id', () => {
    const field = new FieldCqProc();
    expect(field.getValue()).toBe(NO_PROCEDURE);
    expect(field.getText()).toBe('phép');
    expect(FieldCqProc.fromJson({ value: 'hop' } as never).getText()).toBe('hop');
  });

  it('names the spells the workspace declares', () => {
    registerBlockSpecs(lineBlocks);
    const ws = new Workspace(new Options({}));
    setWorkspaceProcedures(ws, SPELLS);
    Events.disable();
    try {
      serialization.workspaces.load(program([call('c1', 'skip')], [hop]), ws, {
        recordUndo: false,
      });
    } finally {
      Events.enable();
    }
    expect(ws.getBlockById('c1')?.getField('PROC')?.getText()).toBe('bước dài');
    expect(ws.getBlockById('def1')?.getField('PROC')?.getText()).toBe('nhảy cóc');
    ws.dispose();
  });

  it('labels and tooltips are the curriculum’s, word for word', () => {
    registerBlockSpecs([]);
    const ws = new Workspace(new Options({}));
    const taught = ws.newBlock('cq_proc_def');
    const cast = ws.newBlock('cq_proc_call');
    expect(taught.toString()).toContain('dạy phép');
    expect(taught.getTooltip()).toBe('Dạy phép: nhớ các lệnh bên trong, chưa làm ngay');
    expect(cast.getTooltip()).toBe('Làm phép: làm hết lệnh trong phép, rồi làm tiếp');
    expect(taught.previousConnection).toBeNull();
    expect(taught.nextConnection).toBeNull();
    ws.dispose();
  });
});

describe('spells with a box (ADR-0023 §2)', () => {
  const STAIRS: LevelProcedure[] = [
    { id: 'stairs', name: 'cầu thang', param: { id: 'steps', name: 'số bậc', max: 4 } },
  ];
  const callN = (id: string, n: number): object => ({
    type: 'cq_proc_call_n',
    id,
    fields: { PROC: 'stairs', NUM: n },
  });
  const loopBox = (id: string, body: object[]): object => ({
    type: 'cq_repeat_var',
    id,
    fields: { VAR: 'steps' },
    inputs: { DO: { block: chain(body) } },
  });
  const stairs = {
    type: 'cq_proc_def_n',
    id: 'defn',
    fields: { PROC: 'stairs' },
    inputs: { BODY: { block: loopBox('rv', [step('s')]) } },
  };
  const boxed = (workspace: WorkspaceJson, overrides: Partial<Level> = {}) =>
    run(workspace, { procedures: STAIRS, config: { length: 10, goal: 4 }, ...overrides });

  it('call with 1 then 3 walks 1 then 3, and the box is back to 0 after each', () => {
    const outcome = boxed(program([callN('c1', 1), callN('c2', 3)], [stairs]));
    expect(outcome.result).toBe('success');
    expect(outcome.vars).toEqual({ steps: 0 });
    const trace = outcome.events
      .filter((event) => ['call', 'ret', 'var', 'step'].includes(event.type))
      .map((event) =>
        event.type === 'var' ? `var ${String((event as { value: number }).value)}` : event.type,
      );
    expect(trace).toEqual([
      'call',
      'var 1',
      'step',
      'var 0',
      'ret',
      'call',
      'var 3',
      'step',
      'step',
      'step',
      'var 0',
      'ret',
    ]);
  });

  it('a number over the box’s max is BOX_FULL', () => {
    expect(boxed(program([callN('c1', 5)], [stairs]))).toMatchObject({
      result: 'crash',
      reasonCode: 'BOX_FULL',
    });
  });

  it('the spell’s box outside its body is BOX_OUTSIDE_SPELL, before any event', () => {
    const outside = program([callN('c1', 1), loopBox('rv2', [step('x')])], [stairs]);
    expect(boxed(outside)).toMatchObject({
      result: 'error',
      reasonCode: 'BOX_OUTSIDE_SPELL',
      events: [],
    });
    const otherSpell = program(
      [call('c1')],
      [stairs, def('def1', 'hop', [loopBox('rv3', [step('y')])])],
    );
    const both = [...STAIRS, { id: 'hop', name: 'nhảy cóc' }];
    expect(boxed(otherSpell, { procedures: both }).reasonCode).toBe('BOX_OUTSIDE_SPELL');
  });

  it('the box dropdown shows the spell’s box only inside its body', () => {
    registerBlockSpecs(lineBlocks);
    const ws = new Workspace(new Options({}));
    setWorkspaceProcedures(ws, STAIRS);
    Events.disable();
    try {
      serialization.workspaces.load(program([loopBox('out', [step('o')])], [stairs]), ws, {
        recordUndo: false,
      });
    } finally {
      Events.enable();
    }
    const options = (id: string): unknown =>
      (ws.getBlockById(id)?.getField('VAR') as FieldDropdown | null)?.getOptions(false);
    expect(options('rv')).toEqual([['số bậc', 'steps']]);
    expect(options('out')).toEqual([['steps', 'steps']]);
    // Only `lặp [hộp] lần` is offered the spell's box, even inside the body (rule 25 (j)).
    const writer = ws.newBlock('cq_var_add');
    const below = writer.previousConnection;
    if (below === null) throw new Error('cq_var_add is a statement');
    ws.getBlockById('rv')?.getInput('DO')?.connection?.connect(below);
    expect((writer.getField('VAR') as FieldDropdown | null)?.getOptions(false)).toEqual([
      ['hộp', '__none'],
    ]);
    // Outside its spell the menu stays the same, but the label is the box's name, not its id.
    expect(ws.getBlockById('out')?.getField('VAR')?.getText()).toBe('số bậc');
    expect(ws.getBlockById('defn')?.getField('BOX')?.getText()).toBe('số bậc');
    ws.dispose();
  });

  it('labels and tooltips of the box blocks are the curriculum’s', () => {
    registerBlockSpecs([]);
    const ws = new Workspace(new Options({}));
    expect(ws.newBlock('cq_proc_def_n').getTooltip()).toBe(
      'Dạy phép với hộp: làm phép thì hộp nhận số',
    );
    expect(ws.newBlock('cq_proc_call_n').getTooltip()).toBe(
      'Làm phép với số: hộp của phép nhận số này',
    );
    ws.dispose();
  });

  it('a level with only spell boxes keeps predict keys without a box suffix', () => {
    const workspace = program([callN('c1', 2)], [stairs]);
    const outcome = boxed(workspace, { mode: 'predict', initialWorkspace: workspace });
    expect(outcome.answerKey).toBe('NOT_AT_GOAL@2');
  });
});
