import Interpreter from 'js-interpreter';
import type { WorkspaceJson } from '@codequest/content-schema';
import { describe, expect, it, vi } from 'vitest';
import {
  analyzeWorkspace,
  compileProgram,
  DEFAULT_MAX_STEPS,
  fnv1a,
  mulberry32,
  runLevel,
  registerBlockSpecs,
  StopSignal,
  type BlockSpec,
  type RunOutcome,
} from '../index';
import { lineKind, lineLevel, program, step, type LineEvent } from '../testing/lineKind.test';

const repeat = (id: string, times: number, body: object): object => ({
  type: 'cq_repeat',
  id,
  fields: { TIMES: times },
  inputs: { DO: { block: body } },
});

const forever = (body?: object): object => ({
  type: 'controls_whileUntil',
  id: 'loop',
  fields: { MODE: 'WHILE' },
  inputs: {
    BOOL: { block: { type: 'logic_boolean', id: 'true', fields: { BOOL: 'TRUE' } } },
    ...(body !== undefined && { DO: { block: body } }),
  },
});

function actionsOf(outcome: RunOutcome<LineEvent>): LineEvent[] {
  return outcome.events.filter((event): event is LineEvent => event.type !== 'highlight');
}

describe('runLevel', () => {
  it('wins when the program reaches the goal, highlighting each statement first', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel(),
      workspace: program([step('a'), step('b'), step('c')]),
    });
    expect(outcome.result).toBe('success');
    expect(outcome.reasonCode).toBeNull();
    expect(outcome.stats).toMatchObject({ actions: 3, blocksUsed: 3 });
    expect(outcome.events.map((event) => `${event.type}:${event.blockId ?? ''}`)).toEqual([
      'highlight:start',
      'highlight:a',
      'step:a',
      'highlight:b',
      'step:b',
      'highlight:c',
      'step:c',
    ]);
  });

  it('returns incomplete with the reason from evaluate when the program ends early', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel(),
      workspace: program([step('a')]),
    });
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_AT_GOAL' });
  });

  it('rejects an empty program without running it', () => {
    const outcome = runLevel({ kind: lineKind, level: lineLevel(), workspace: program([]) });
    expect(outcome).toEqual({
      result: 'error',
      reasonCode: 'EMPTY_PROGRAM',
      events: [],
      stats: { steps: 0, actions: 0, blocksUsed: 0 },
    });
  });

  it('treats a workspace without cq_start as empty', () => {
    const workspace = {
      blocks: { languageVersion: 0 as const, blocks: [step('lonely') as { type: string }] },
    };
    const outcome = runLevel({ kind: lineKind, level: lineLevel(), workspace });
    expect(outcome.reasonCode).toBe('EMPTY_PROGRAM');
  });

  it('rejects a program over maxBlocks without running it', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel({ maxBlocks: 2 }),
      workspace: program([step('a'), step('b'), step('c')]),
    });
    expect(outcome).toMatchObject({ result: 'error', reasonCode: 'TOO_MANY_BLOCKS', events: [] });
    expect(outcome.stats.blocksUsed).toBe(3);
  });

  it('accepts a program exactly at maxBlocks', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel({ maxBlocks: 3 }),
      workspace: program([step('a'), step('b'), step('c')]),
    });
    expect(outcome.result).toBe('success');
  });

  it('does not run orphan blocks', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel({ config: { length: 10, goal: 1 } }),
      workspace: program([step('a')], [{ ...step('orphan'), x: 200, y: 200 }]),
    });
    expect(outcome.result).toBe('success');
    expect(outcome.stats.blocksUsed).toBe(1);
    expect(outcome.events.some((event) => event.blockId === 'orphan')).toBe(false);
  });

  it('cuts an infinite loop with TIMEOUT at maxSteps', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel({ limits: { maxSteps: 500 } }),
      workspace: program([forever({ type: 'line_say', id: 'say' })]),
    });
    expect(outcome).toMatchObject({ result: 'timeout', reasonCode: 'TIMEOUT' });
    expect(outcome.stats.steps).toBe(500);
  });

  it('cuts an empty infinite loop at the default maxSteps', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel(),
      workspace: program([forever()]),
    });
    expect(outcome).toMatchObject({ result: 'timeout', reasonCode: 'TIMEOUT' });
    expect(outcome.stats.steps).toBe(DEFAULT_MAX_STEPS);
  });

  it('times out when the program emits more than maxActions events', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel({ limits: { maxActions: 5 } }),
      workspace: program([forever({ type: 'line_say', id: 'say' })]),
    });
    expect(outcome).toMatchObject({ result: 'timeout', reasonCode: 'TIMEOUT' });
    expect(outcome.stats.actions).toBe(5);
    expect(actionsOf(outcome)).toHaveLength(5);
  });

  it('stops at a crash raised by the simulation, after its failure event', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel({ config: { length: 10, goal: 3, holes: [2] } }),
      workspace: program([step('a'), step('b'), step('c')]),
    });
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'FELL_IN_HOLE' });
    expect(actionsOf(outcome).map((event) => event.type)).toEqual(['step', 'step', 'fall']);
    expect(outcome.events.at(-1)).toMatchObject({ type: 'fall', blockId: 'b' });
  });

  it('stops with success when the simulation wins mid-run', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel(),
      workspace: program([step('a'), { type: 'line_win', id: 'w' }, step('never')]),
    });
    expect(outcome).toMatchObject({ result: 'success', reasonCode: null });
    expect(outcome.events.some((event) => event.blockId === 'never')).toBe(false);
  });

  it('exposes StopSignal as an Error carrying the result', () => {
    const signal = new StopSignal('crash', 'HIT_WALL');
    expect(signal).toBeInstanceOf(Error);
    expect(signal).toMatchObject({ result: 'crash', reasonCode: 'HIT_WALL', name: 'StopSignal' });
    expect(new StopSignal('success', null).message).toBe('stopped: success');
  });

  it('repeats cq_repeat bodies and highlights the loop on every pass', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel(),
      workspace: program([repeat('r', 3, step('s'))]),
    });
    expect(outcome.result).toBe('success');
    expect(outcome.events.filter((event) => event.blockId === 'r')).toHaveLength(4);
  });

  it('passes sensor values back into the program', () => {
    const until = {
      type: 'controls_whileUntil',
      id: 'until',
      fields: { MODE: 'UNTIL' },
      inputs: { BOOL: { block: { type: 'line_at_goal', id: 'g' } }, DO: { block: step('s') } },
    };
    const outcome = runLevel({ kind: lineKind, level: lineLevel(), workspace: program([until]) });
    expect(outcome.result).toBe('success');
    expect(outcome.stats.actions).toBe(3);
  });

  it('is deterministic: the same input gives the same outcome', () => {
    const input = {
      kind: lineKind,
      level: lineLevel({ config: { length: 10, goal: 2, holes: [5] } }),
      workspace: program([
        {
          type: 'line_say',
          id: 'r1',
          inputs: { VALUE: { block: { type: 'math_random_float', id: 'f1' } } },
        },
        repeat('r', 2, step('s')),
        {
          type: 'line_say',
          id: 'r2',
          inputs: {
            VALUE: {
              block: {
                type: 'math_random_int',
                id: 'i',
                inputs: {
                  FROM: { shadow: { type: 'math_number', id: 'n1', fields: { NUM: 1 } } },
                  TO: { shadow: { type: 'math_number', id: 'n2', fields: { NUM: 100 } } },
                },
              },
            },
          },
        },
      ]),
    };
    const first = runLevel(input);
    expect(runLevel(input)).toEqual(first);
    expect(first).toMatchSnapshot();
  });

  it('seeds Math.random in the sandbox from the level id unless a seed is given', () => {
    const workspace = program([
      {
        type: 'line_say',
        id: 'r',
        inputs: { VALUE: { block: { type: 'math_random_float', id: 'f' } } },
      },
    ]);
    const said = (seed?: number): unknown => {
      const outcome = runLevel({
        kind: lineKind,
        level: lineLevel({ mode: 'creative' }),
        workspace,
        ...(seed !== undefined && { seed }),
      });
      return actionsOf(outcome)[0];
    };
    expect(said()).toMatchObject({ value: mulberry32(fnv1a('w01-l01'))() });
    expect(said(7)).toMatchObject({ value: mulberry32(7)() });
  });

  it('skips evaluate in mode creative', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel({ mode: 'creative' }),
      workspace: program([step('a')]),
    });
    expect(outcome).toMatchObject({ result: 'success', reasonCode: null });
  });

  it('runs level.initialWorkspace and computes answerKey in mode predict', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel({
        mode: 'predict',
        config: { length: 10, goal: 3, holes: [2] },
        initialWorkspace: program([step('a'), step('b'), step('c')]),
      }),
      workspace: program([]),
    });
    expect(outcome).toMatchObject({ result: 'crash', answerKey: 'FELL_IN_HOLE@2' });
  });

  it('counts edits against level.initialWorkspace in mode bughunt', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel({ mode: 'bughunt', initialWorkspace: program([step('a'), step('b')]) }),
      workspace: program([step('a'), step('b'), step('c')]),
    });
    expect(outcome).toMatchObject({ result: 'success', edits: 1 });
  });

  it('reports INTERNAL_ERROR for an unknown block type', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel(),
      workspace: program([{ type: 'no_such_block', id: 'x' }]),
    });
    expect(outcome).toMatchObject({ result: 'error', reasonCode: 'INTERNAL_ERROR' });
    expect(outcome.debug?.message).toContain('workspace');
  });

  it('reports INTERNAL_ERROR for a config the kind rejects', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel({ config: { length: 'long' } }),
      workspace: program([step('a')]),
    });
    expect(outcome).toMatchObject({ result: 'error', reasonCode: 'INTERNAL_ERROR' });
    expect(outcome.debug?.message).toContain('config');
  });

  it('reports INTERNAL_ERROR with the events so far when the game API throws', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel(),
      workspace: program([step('a'), { type: 'line_boom', id: 'b' }]),
    });
    expect(outcome).toMatchObject({
      result: 'error',
      reasonCode: 'INTERNAL_ERROR',
      debug: { message: 'boom' },
    });
    expect(outcome.stats.actions).toBe(1);
  });
});

describe('runLevel hardening', () => {
  const sayText = (id: string, text: object): object => ({
    type: 'line_say',
    id,
    inputs: { VALUE: { block: text } },
  });
  const replaceBlock = {
    type: 'text_replace',
    id: 'rep',
    inputs: {
      FROM: { block: { type: 'text', id: 't1', fields: { TEXT: 'a' } } },
      TO: { block: { type: 'text', id: 't2', fields: { TEXT: 'o' } } },
      TEXT: { block: { type: 'text', id: 't3', fields: { TEXT: 'banana' } } },
    },
  };

  it('runs regex-based text blocks synchronously even where a Web Worker exists', () => {
    const savedVm = Interpreter.vm;
    // Any constructor makes js-interpreter believe Web Workers are available.
    vi.stubGlobal('Worker', function Worker() {
      return undefined;
    });
    Interpreter.vm = null;
    try {
      const outcome = runLevel({
        kind: lineKind,
        level: lineLevel({ mode: 'creative' }),
        workspace: program([sayText('s', replaceBlock)]),
      });
      expect(outcome.result).toBe('success');
      expect(actionsOf(outcome)[0]).toMatchObject({ type: 'say', value: 'bonono' });
    } finally {
      Interpreter.vm = savedVm;
      vi.unstubAllGlobals();
    }
  });

  it('is deterministic for blocks without ids', () => {
    const idless = {
      blocks: {
        languageVersion: 0 as const,
        blocks: [
          {
            type: 'cq_start',
            next: {
              block: {
                type: 'cq_repeat',
                fields: { TIMES: 3 },
                inputs: { DO: { block: { type: 'line_step' } } },
              },
            },
          },
        ],
      },
    };
    const first = runLevel({ kind: lineKind, level: lineLevel(), workspace: idless });
    expect(first.result).toBe('success');
    expect(runLevel({ kind: lineKind, level: lineLevel(), workspace: idless })).toEqual(first);
    expect(new Set(first.events.map((event) => event.blockId))).toEqual(
      new Set(['b0', 'b0.n', 'b0.n.DO']),
    );
  });

  it('runs top-level function definitions called from the program', () => {
    const definition = {
      type: 'procedures_defnoreturn',
      id: 'def',
      x: 300,
      fields: { NAME: 'two steps' },
      inputs: { STACK: { block: { ...step('d1'), next: { block: step('d2') } } } },
    };
    const call = (id: string): object => ({
      type: 'procedures_callnoreturn',
      id,
      extraState: { name: 'two steps' },
    });
    const workspace = program([call('c1'), step('x')], [definition]);
    const outcome = runLevel({ kind: lineKind, level: lineLevel(), workspace });
    expect(outcome.result).toBe('success');
    expect(outcome.stats.blocksUsed).toBe(5);
    expect(analyzeWorkspace(workspace).orphanBlockIds).toEqual([]);
    const defOnly = runLevel({
      kind: lineKind,
      level: lineLevel(),
      workspace: program([], [definition]),
    });
    expect(defOnly.reasonCode).toBe('EMPTY_PROGRAM');
  });

  it('reports INTERNAL_ERROR when predictAnswer throws', () => {
    const kind = {
      ...lineKind,
      predictAnswer: () => {
        throw new Error('no key');
      },
    };
    const outcome = runLevel({
      kind,
      level: lineLevel({ mode: 'predict', initialWorkspace: program([step('a')]) }),
      workspace: program([]),
    });
    expect(outcome).toMatchObject({
      result: 'error',
      reasonCode: 'INTERNAL_ERROR',
      debug: { message: 'no key' },
    });
  });

  it('reports INTERNAL_ERROR when a game API returns a non-primitive', () => {
    const kind = {
      ...lineKind,
      createApi: (ctx: Parameters<typeof lineKind.createApi>[0]) => ({
        ...lineKind.createApi(ctx),
        step: () => ({}) as unknown as undefined,
      }),
    };
    const outcome = runLevel({ kind, level: lineLevel(), workspace: program([step('a')]) });
    expect(outcome.debug?.message).toMatch(/step returned a non-primitive/);
  });

  it('reports INTERNAL_ERROR when createApi lacks a function named in apiNames', () => {
    const kind = {
      ...lineKind,
      createApi: (ctx: Parameters<typeof lineKind.createApi>[0]) => {
        const api = { ...lineKind.createApi(ctx) };
        Reflect.deleteProperty(api, 'atGoal');
        return api;
      },
    };
    const outcome = runLevel({ kind, level: lineLevel(), workspace: program([step('a')]) });
    expect(outcome.debug?.message).toBe('createApi lacks atGoal');
  });

  it('keeps a child variable named like an API registered after an earlier compile', () => {
    const zap: BlockSpec = {
      type: 'test_zap',
      category: 'move',
      apiNames: ['zap'],
      json: { message0: 'zap', previousStatement: null, nextStatement: null },
      generator: (block, gen) => `zap(${gen.quote_(block.id)});\n`,
    };
    const withVariable = (name: string): WorkspaceJson => ({
      ...program([
        {
          type: 'variables_set',
          id: 'set',
          fields: { VAR: { id: 'v' } },
          inputs: { VALUE: { block: { type: 'math_number', id: 'n', fields: { NUM: 1 } } } },
        },
        step('a'),
        step('b'),
        step('c'),
      ]),
      variables: [{ name, id: 'v' }],
    });
    compileProgram(withVariable('zap'));
    registerBlockSpecs([zap]);
    expect(compileProgram(withVariable('zap'))).toContain('var zap2;');
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel(),
      workspace: withVariable('step'),
    });
    expect(outcome.result).toBe('success');
  });
});
