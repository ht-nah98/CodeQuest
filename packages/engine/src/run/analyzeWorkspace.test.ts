import { describe, expect, it } from 'vitest';
import { analyzeWorkspace, registerBlockSpecs } from '../index';
import { lineBlocks, program, step } from '../testing/lineKind.test';

registerBlockSpecs(lineBlocks);

describe('analyzeWorkspace', () => {
  it('counts program blocks without cq_start and shadow blocks', () => {
    const analysis = analyzeWorkspace(
      program(
        [
          {
            type: 'controls_repeat_ext',
            id: 'rep',
            inputs: {
              TIMES: { shadow: { type: 'math_number', id: 'num', fields: { NUM: 3 } } },
              DO: { block: step('a') },
            },
          },
          step('b'),
        ],
        [{ ...step('o1'), x: 300, next: { block: step('o2') } }],
      ),
    );
    expect(analysis).toEqual({
      startBlockId: 'start',
      programBlockIds: ['rep', 'a', 'b'],
      orphanBlockIds: ['o1', 'o2'],
      blocksUsed: 3,
      blockTypesUsed: { controls_repeat_ext: 1, line_step: 2 },
      topBlockCount: 2,
    });
  });

  it('reports an empty program', () => {
    expect(analyzeWorkspace(program([]))).toMatchObject({
      startBlockId: 'start',
      programBlockIds: [],
      blocksUsed: 0,
      topBlockCount: 1,
    });
  });

  it('treats everything as orphan without cq_start, including a second cq_start', () => {
    const workspace = program([step('a')], [{ type: 'cq_start', id: 'start2', x: 400 }]);
    expect(analyzeWorkspace(workspace)).toMatchObject({
      startBlockId: 'start',
      orphanBlockIds: ['start2'],
    });
    const noStart = {
      blocks: { languageVersion: 0 as const, blocks: [{ type: 'line_step', id: 'a' }] },
    };
    expect(analyzeWorkspace(noStart)).toMatchObject({
      startBlockId: null,
      orphanBlockIds: ['a'],
      blocksUsed: 0,
    });
  });

  it('throws on a block type that is not registered', () => {
    expect(() => analyzeWorkspace(program([{ type: 'nope_block', id: 'x' }]))).toThrow();
  });

  it('counts the question and both branches of cq_if_else (P2-11)', () => {
    const analysis = analyzeWorkspace(
      program([
        {
          type: 'cq_if_else',
          id: 'if',
          inputs: {
            COND: { block: { type: 'line_at_goal', id: 'q' } },
            DO: { block: step('a') },
            ELSE: { block: { ...step('b'), next: { block: step('c') } } },
          },
        },
      ]),
    );
    expect(analysis.programBlockIds).toEqual(['if', 'q', 'a', 'b', 'c']);
    expect(analysis.blocksUsed).toBe(5);
    expect(analysis.blockTypesUsed).toEqual({ cq_if_else: 1, line_at_goal: 1, line_step: 3 });
  });
});
