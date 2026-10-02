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
});
