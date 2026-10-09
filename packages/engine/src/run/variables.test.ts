// Engine variables ("hộp", ADR-0022 §3): the pure box rules, the sandbox functions, the `var`
// event, BOX_FULL, countGoal on both ways to win, the predict key suffix and determinism.
import type { Level, LevelVariable } from '@codequest/content-schema';
import { describe, expect, it } from 'vitest';
import {
  applyVarCall,
  compileProgram,
  LOOP_BLOCK_TYPES,
  loopDepth,
  runLevel,
  splitVarSuffix,
  varSuffix,
  type RunOutcome,
} from '../index';
import { lineKind, lineLevel, program, step, type LineEvent } from '../testing/lineKind.test';

const BOX: LevelVariable = { id: 'bamboo', name: 'số măng' };

const set = (id: string, value: number, box = 'bamboo'): object => ({
  type: 'cq_var_set',
  id,
  fields: { VAR: box, NUM: value },
});
const add = (id: string, value = 1, box = 'bamboo'): object => ({
  type: 'cq_var_add',
  id,
  fields: { VAR: box, NUM: value },
});
const compare = (id: string, op: 'EQ' | 'LT' | 'GT', value: number, box = 'bamboo'): object => ({
  type: 'cq_var_compare',
  id,
  fields: { VAR: box, OP: op, NUM: value },
});
const chain = (blocks: object[]): object | undefined => {
  let next: object | undefined;
  for (const block of [...blocks].reverse()) {
    next = next === undefined ? block : { ...block, next: { block: next } };
  }
  return next;
};
const repeatVar = (id: string, body: object[], box = 'bamboo'): object => ({
  type: 'cq_repeat_var',
  id,
  fields: { VAR: box },
  inputs: { DO: { block: chain(body) } },
});
const repeat = (id: string, times: number, body: object[]): object => ({
  type: 'cq_repeat',
  id,
  fields: { TIMES: times },
  inputs: { DO: { block: chain(body) } },
});
const ifThen = (id: string, condition: object, body: object[]): object => ({
  type: 'cq_if',
  id,
  inputs: { COND: { block: condition }, DO: { block: chain(body) } },
});

function boxLevel(overrides: Partial<Level> = {}): Level {
  return lineLevel({
    toolbox: ['line_step', 'cq_var_set', 'cq_var_add', 'cq_var_compare', 'cq_repeat_var'],
    variables: [BOX],
    ...overrides,
  });
}

function varEvents(outcome: RunOutcome<LineEvent>): string[] {
  return outcome.events
    .filter((event) => event.type === 'var' || event.type === 'sense')
    .map((event) => {
      if (event.type === 'sense') return `sense:${event.blockId ?? ''}=${String(event.value)}`;
      const over = event.overflow === true ? '!' : '';
      return `var:${event.blockId ?? ''}:${event.id}=${String(event.value)}${over}`;
    });
}

describe('applyVarCall (pure box rules)', () => {
  const decls: LevelVariable[] = [BOX, { id: 'fish', name: 'số cá', max: 3 }];
  const vars = { bamboo: 2, fish: 1 };

  it('sets, adds, reads and compares without touching its input', () => {
    expect(applyVarCall(vars, decls, '__varSet', ['bamboo', 7, 'b'])).toEqual({
      vars: { bamboo: 7, fish: 1 },
      value: 7,
    });
    expect(applyVarCall(vars, decls, '__varAdd', ['fish', 2, 'b'])).toEqual({
      vars: { bamboo: 2, fish: 3 },
      value: 3,
    });
    expect(applyVarCall(vars, decls, '__varGet', ['bamboo', 'b']).value).toBe(2);
    expect(applyVarCall(vars, decls, '__varCmp', ['bamboo', 'EQ', 2, 'b']).value).toBe(true);
    expect(applyVarCall(vars, decls, '__varCmp', ['bamboo', 'LT', 2, 'b']).value).toBe(false);
    expect(applyVarCall(vars, decls, '__varCmp', ['bamboo', 'GT', 1, 'b']).value).toBe(true);
    expect(vars).toEqual({ bamboo: 2, fish: 1 });
  });

  it('going over max is an overflow that keeps the boxes (default max 9)', () => {
    expect(applyVarCall(vars, decls, '__varAdd', ['fish', 3, 'b'])).toEqual({
      vars,
      value: 1,
      overflow: true,
    });
    expect(applyVarCall(vars, decls, '__varSet', ['bamboo', 10, 'b']).overflow).toBe(true);
    expect(applyVarCall(vars, decls, '__varSet', ['bamboo', 9, 'b']).overflow).toBeUndefined();
  });

  it('throws for an unknown box, an unknown comparison or another function', () => {
    expect(() => applyVarCall(vars, decls, '__varAdd', ['apple', 1, 'b'])).toThrow(
      'unknown variable apple',
    );
    expect(() => applyVarCall(vars, undefined, '__varGet', ['bamboo', 'b'])).toThrow(
      'unknown variable bamboo',
    );
    expect(() => applyVarCall(vars, decls, '__varCmp', ['bamboo', 'NE', 1, 'b'])).toThrow(
      'unknown comparison',
    );
    expect(() => applyVarCall(vars, decls, 'forward', ['bamboo'])).toThrow('not a variable');
  });
});

describe('predict key suffix', () => {
  it('appends every box in declaration order and splits it back', () => {
    const decls: LevelVariable[] = [BOX, { id: 'fish', name: 'số cá' }];
    expect(varSuffix(decls, { fish: 0, bamboo: 2 })).toBe('#bamboo=2#fish=0');
    expect(splitVarSuffix('stop@1,4#bamboo=2#fish=0')).toEqual({
      base: 'stop@1,4',
      vars: { bamboo: 2, fish: 0 },
    });
    expect(splitVarSuffix('crash:HIT_WALL@1,3')).toEqual({ base: 'crash:HIT_WALL@1,3', vars: {} });
    expect(splitVarSuffix('win#bamboo=13')).toEqual({ base: 'win', vars: { bamboo: 13 } });
  });
});

describe('runLevel with variables', () => {
  it('set and add log a var event each (also when the number stays), counted as actions', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: boxLevel(),
      workspace: program([set('s', 0), add('a', 2), set('z', 2), step('1'), step('2'), step('3')]),
    });
    expect(outcome.result).toBe('success');
    expect(varEvents(outcome)).toEqual(['var:s:bamboo=0', 'var:a:bamboo=2', 'var:z:bamboo=2']);
    expect(outcome.stats.actions).toBe(6);
    expect(outcome.vars).toEqual({ bamboo: 2 });
  });

  it('a comparison is a question: a sense event on the compare block', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: boxLevel({ variables: [{ ...BOX, start: [3] }] }),
      workspace: program([
        ifThen('if1', compare('c1', 'GT', 2), [step('1'), step('2'), step('3')]),
        ifThen('if2', compare('c2', 'LT', 3), [step('4')]),
      ]),
    });
    expect(outcome.result).toBe('success');
    expect(varEvents(outcome)).toEqual(['sense:c1=true', 'sense:c2=false']);
  });

  it('lặp [hộp] lần reads the box once, when the loop begins', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: boxLevel({ variables: [{ ...BOX, start: [3] }] }),
      workspace: program([repeatVar('r', [step('x'), add('a')])]),
    });
    // 3 passes although the body adds to the box: the count was read before the first pass.
    expect(outcome.result).toBe('success');
    expect(outcome.vars).toEqual({ bamboo: 6 });
    expect(outcome.events.filter((event) => event.type === 'step')).toHaveLength(3);
  });

  it('lặp [hộp] lần with an empty box runs no pass', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: boxLevel(),
      workspace: program([repeatVar('r', [step('x')])]),
    });
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_AT_GOAL' });
  });

  it('going over max crashes BOX_FULL after an overflow var event with the old number', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: boxLevel({ variables: [{ ...BOX, max: 2 }] }),
      workspace: program([repeat('r', 3, [add('a')]), step('never')]),
    });
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'BOX_FULL' });
    expect(varEvents(outcome)).toEqual(['var:a:bamboo=1', 'var:a:bamboo=2', 'var:a:bamboo=2!']);
    expect(outcome.vars).toEqual({ bamboo: 2 });
  });

  it('a loop of only box changes still ends deterministically (maxActions)', () => {
    const forever = {
      type: 'controls_whileUntil',
      id: 'loop',
      fields: { MODE: 'WHILE' },
      inputs: {
        BOOL: { block: { type: 'logic_boolean', id: 'true', fields: { BOOL: 'TRUE' } } },
        DO: { block: set('s', 1) },
      },
    };
    const outcome = runLevel({
      kind: lineKind,
      level: boxLevel({ limits: { maxActions: 5 } }),
      workspace: program([forever]),
    });
    expect(outcome).toMatchObject({ result: 'timeout', reasonCode: 'TIMEOUT' });
    expect(outcome.stats.actions).toBe(5);
  });

  it('each map starts from its own start number', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: boxLevel({
        config: { length: 10, goal: 2 },
        variants: [
          { length: 10, goal: 4 },
          { length: 10, goal: 1 },
        ],
        variables: [{ ...BOX, start: [2, 4, 1] }],
      }),
      workspace: program([repeatVar('r', [step('x')])]),
    });
    expect(outcome.result).toBe('success');
    expect(outcome.maps?.map((map) => map.vars)).toEqual([
      { bamboo: 2 },
      { bamboo: 4 },
      { bamboo: 1 },
    ]);
  });

  describe('countGoal', () => {
    const counted = (equals: number[], variants?: unknown[]): Level =>
      boxLevel({
        countGoal: { var: 'bamboo', equals },
        ...(variants !== undefined && { variants }),
      });

    it('a kind win with the wrong number is incomplete WRONG_COUNT, on every map', () => {
      const workspace = program([step('1'), add('a'), step('2'), add('b'), step('3')]);
      const level = counted([2, 2], [{ length: 10, goal: 3 }]);
      expect(runLevel({ kind: lineKind, level, workspace }).result).toBe('success');
      const wrong = runLevel({
        kind: lineKind,
        level: counted([2, 3], [{ length: 10, goal: 3 }]),
        workspace,
      });
      expect(wrong).toMatchObject({ result: 'incomplete', reasonCode: 'WRONG_COUNT', mapIndex: 1 });
      expect(wrong.maps?.map((map) => map.result)).toEqual(['success', 'incomplete']);
    });

    it('the deciding map of a loss gives the top-level vars', () => {
      // Both maps reach the goal; map 2 starts its box at 0 and needs 1, so it loses
      // WRONG_COUNT and decides the result.
      const outcome = runLevel({
        kind: lineKind,
        level: boxLevel({
          variables: [{ ...BOX, start: [2, 0] }],
          variants: [{ length: 10, goal: 3 }],
          countGoal: { var: 'bamboo', equals: [2, 1] },
        }),
        workspace: program([step('1'), step('2'), step('3')]),
      });
      expect(outcome).toMatchObject({
        result: 'incomplete',
        reasonCode: 'WRONG_COUNT',
        mapIndex: 1,
      });
      expect(outcome.vars).toEqual({ bamboo: 0 });
      expect(outcome.maps?.[0]?.vars).toEqual({ bamboo: 2 });
    });

    it('a mid-run win counts the box at that moment', () => {
      const win = { type: 'line_win', id: 'w' };
      const early = runLevel({
        kind: lineKind,
        level: counted([1]),
        workspace: program([add('a'), win, add('late')]),
      });
      expect(early.result).toBe('success');
      const tooEarly = runLevel({
        kind: lineKind,
        level: counted([2]),
        workspace: program([add('a'), win, add('late')]),
      });
      expect(tooEarly).toMatchObject({ result: 'incomplete', reasonCode: 'WRONG_COUNT' });
    });

    it('a loss keeps the kind reason', () => {
      const outcome = runLevel({
        kind: lineKind,
        level: counted([0]),
        workspace: program([step('1')]),
      });
      expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_AT_GOAL' });
    });
  });

  it('predict keys end with #<id>=<n> of every box, from the deciding map', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel({
        mode: 'predict',
        variables: [BOX, { id: 'fish', name: 'số cá', start: [1] }],
        initialWorkspace: program([add('a', 2), step('1')]),
        predict: {
          options: [
            { key: 'NOT_AT_GOAL@1#bamboo=2#fish=1', label: 'a' },
            { key: 'win#bamboo=2#fish=1', label: 'b' },
            { key: 'NOT_AT_GOAL@1#bamboo=0#fish=1', label: 'c' },
          ],
        },
      }),
      workspace: program([]),
    });
    expect(outcome.answerKey).toBe('NOT_AT_GOAL@1#bamboo=2#fish=1');
  });

  it('an undeclared box is INTERNAL_ERROR unknown variable', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: boxLevel(),
      workspace: program([add('a', 1, 'apple')]),
    });
    expect(outcome).toMatchObject({
      result: 'error',
      reasonCode: 'INTERNAL_ERROR',
      debug: { message: 'unknown variable apple' },
    });
  });

  it('is deterministic: two runs give the same event log', () => {
    const run = (): RunOutcome<LineEvent> =>
      runLevel({
        kind: lineKind,
        level: boxLevel({ variables: [{ ...BOX, start: [2] }] }),
        workspace: program([
          repeatVar('r', [step('x'), add('a')]),
          ifThen('i', compare('c', 'EQ', 4), [step('y')]),
        ]),
      });
    const first = run();
    expect(first.result).toBe('success');
    expect(run()).toEqual(first);
    expect(varEvents(first)).toMatchSnapshot();
  });

  it('the engineCalls option replaces the box functions (par search recording)', () => {
    const calls: string[] = [];
    const outcome = runLevel({
      kind: lineKind,
      level: boxLevel({ mode: 'creative' }),
      workspace: program([set('s', 4), repeatVar('r', [step('x')])]),
      engineCalls: (name, args) => {
        calls.push(`${name}(${args.join(',')})`);
        return undefined;
      },
    });
    expect(outcome.result).toBe('success');
    expect(calls).toEqual(['__varSet(bamboo,4,s)', '__varGet(bamboo,r)']);
    expect(varEvents(outcome)).toEqual([]);
  });
});

describe('cq_repeat_var as a loop', () => {
  it('counts in maxLoopDepth', () => {
    expect(LOOP_BLOCK_TYPES).toContain('cq_repeat_var');
    expect(loopDepth(program([repeatVar('r', [repeat('i', 2, [step('x')])])]))).toBe(2);
  });

  it('compiles to one read of the box before the loop', () => {
    const code = compileProgram(program([repeatVar('r', [step('x')])]), [BOX]);
    expect(code).toContain("var times = __varGet('bamboo', 'r');");
    expect(code).toContain('for (var count = 0; count < times; count++)');
  });
});
