import { describe, expect, it } from 'vitest';
import { blockTypeCounts, loopDepth } from '../index';
import { program, step } from '../testing/lineKind.test';

const loop = (type: string, id: string, body: object[]): object => {
  let chain: object | undefined;
  for (const block of [...body].reverse()) {
    chain = chain === undefined ? block : { ...block, next: { block: chain } };
  }
  return {
    type,
    id,
    ...(type === 'cq_repeat' && { fields: { TIMES: 3 } }),
    inputs: {
      COND: { block: { type: 'line_at_goal', id: `${id}c` } },
      ...(chain !== undefined && { DO: { block: chain } }),
    },
  };
};

describe('loopDepth (T16b)', () => {
  it('is 0 without loops and 1 for loops side by side', () => {
    expect(loopDepth(program([step('a')]))).toBe(0);
    expect(
      loopDepth(
        program([loop('cq_repeat', 'r', [step('a')]), loop('cq_repeat_until', 'u', [step('b')])]),
      ),
    ).toBe(1);
  });

  it('counts a repeat-until inside a repeat (what maxInstances alone cannot stop)', () => {
    const nested = loop('cq_repeat', 'r', [step('a'), loop('cq_repeat_until', 'u', [step('b')])]);
    expect(loopDepth(program([nested]))).toBe(2);
  });

  it('does not count an if as a loop, but looks inside it and in loose stacks', () => {
    const inIf = loop('cq_if', 'i', [
      loop('cq_repeat', 'r', [loop('cq_repeat', 'r2', [step('a')])]),
    ]);
    expect(loopDepth(program([inIf]))).toBe(2);
    expect(loopDepth(program([step('a')], [loop('cq_repeat', 'r', [])]))).toBe(1);
  });
});

describe('blockTypeCounts', () => {
  it('counts every non-shadow block, loose ones included', () => {
    const counts = blockTypeCounts(
      program([loop('cq_repeat', 'r', [step('a'), step('b')])], [step('c')]),
    );
    expect(counts.get('line_step')).toBe(3);
    expect(counts.get('cq_repeat')).toBe(1);
    expect(counts.get('cq_start')).toBe(1);
  });
});
