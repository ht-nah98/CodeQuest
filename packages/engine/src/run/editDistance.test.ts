import { describe, expect, it } from 'vitest';
import { editDistance } from '../index';
import { program, step } from '../testing/lineKind.test';

const repeat = (times: number, body: object, id = 'r'): object => ({
  type: 'cq_repeat',
  id,
  fields: { TIMES: times },
  inputs: { DO: { block: body } },
});
const jump = (id: string): object => ({ type: 'runner_jump', id });
const ifElse = (thenBlock: object | null, elseBlock: object | null): object => ({
  type: 'controls_if',
  id: 'if',
  extraState: { hasElse: true },
  inputs: {
    IF0: { block: { type: 'logic_boolean', id: 'b', fields: { BOOL: 'TRUE' } } },
    ...(thenBlock !== null && { DO0: { block: thenBlock } }),
    ...(elseBlock !== null && { ELSE: { block: elseBlock } }),
  },
});

describe('editDistance (runtime-engine.md §9)', () => {
  it('is 0 for the same program, ignoring ids and positions', () => {
    const a = program([step('a'), jump('b')]);
    const b = program([step('x'), { ...jump('y'), x: 50, y: 70 }]);
    expect(editDistance(a, b)).toBe(0);
  });

  it('counts changing a repeat count 3 -> 2 as 1', () => {
    expect(editDistance(program([repeat(3, step('a'))]), program([repeat(2, step('a'))]))).toBe(1);
  });

  it('counts adding one block as 1', () => {
    expect(
      editDistance(program([step('a'), jump('b')]), program([step('a'), jump('b'), step('c')])),
    ).toBe(1);
  });

  it('counts swapping two adjacent blocks as 2', () => {
    expect(editDistance(program([step('a'), jump('b')]), program([jump('b'), step('a')]))).toBe(2);
  });

  it('distinguishes the then-branch from the else-branch', () => {
    expect(
      editDistance(program([ifElse(step('a'), null)]), program([ifElse(null, step('a'))])),
    ).toBe(1);
  });

  it('distinguishes mutations, such as an if gaining an else', () => {
    const withElse = ifElse(step('a'), null);
    const withoutElse = { ...withElse, extraState: undefined };
    expect(editDistance(program([withElse]), program([withoutElse]))).toBe(1);
  });

  it('ignores orphan blocks and counts shadow values', () => {
    const shadowRepeat = (n: number): object => ({
      type: 'controls_repeat_ext',
      id: 'r',
      inputs: {
        TIMES: { shadow: { type: 'math_number', id: 's', fields: { NUM: n } } },
        DO: { block: step('a') },
      },
    });
    expect(
      editDistance(program([shadowRepeat(3)]), program([shadowRepeat(3)], [step('orphan')])),
    ).toBe(0);
    expect(editDistance(program([shadowRepeat(3)]), program([shadowRepeat(2)]))).toBe(1);
  });

  it('counts every block when one side has no cq_start', () => {
    const empty = { blocks: { languageVersion: 0 as const, blocks: [] } };
    expect(editDistance(empty, program([step('a'), jump('b')]))).toBe(2);
  });

  describe('with cq_if_else and cq_repeat_until (P2-11, T13)', () => {
    const sensor = (kind: string): object => ({
      type: 'runner_is_ahead',
      id: `s${kind}`,
      fields: { KIND: kind },
    });
    const cqIfElse = (cond: object | null, then: object | null, otherwise: object | null) => ({
      type: 'cq_if_else',
      id: 'i',
      inputs: {
        ...(cond !== null && { COND: { block: cond } }),
        ...(then !== null && { DO: { block: then } }),
        ...(otherwise !== null && { ELSE: { block: otherwise } }),
      },
    });
    const loop = (body: object): object => repeat(8, body);

    it('W4 l05: asking "ô trống" instead of "hố" is 1 edit; swapping the branches is 2', () => {
      const initial = program([loop(cqIfElse(sensor('HOLE'), step('w'), jump('j')))]);
      expect(
        editDistance(initial, program([loop(cqIfElse(sensor('CLEAR'), step('w'), jump('j')))])),
      ).toBe(1);
      expect(
        editDistance(initial, program([loop(cqIfElse(sensor('HOLE'), jump('j'), step('w')))])),
      ).toBe(2);
    });

    it('W5 l12: one block added to an empty else-branch is 1 edit', () => {
      const initial = program([cqIfElse(sensor('HOLE'), step('w'), null)]);
      expect(editDistance(initial, program([cqIfElse(sensor('HOLE'), step('w'), jump('j'))]))).toBe(
        1,
      );
    });

    it('W5 l13: repeat → repeat-until plus a plugged question is 2 edits', () => {
      const body = cqIfElse(sensor('HOLE'), jump('j'), step('w'));
      const until = {
        type: 'cq_repeat_until',
        id: 'u',
        inputs: { COND: { block: { type: 'runner_at_goal', id: 'g' } }, DO: { block: body } },
      };
      expect(editDistance(program([repeat(20, body)]), program([until]))).toBe(2);
    });
  });
});
