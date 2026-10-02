import { describe, expect, it } from 'vitest';
import { normalizeIds } from '../index';

describe('normalizeIds', () => {
  const idless = {
    blocks: {
      languageVersion: 0 as const,
      blocks: [
        {
          type: 'cq_start',
          id: 'start',
          next: {
            block: {
              type: 'controls_repeat_ext',
              inputs: {
                TIMES: { shadow: { type: 'math_number', fields: { NUM: 3 } } },
                DO: { block: { type: 'line_step' } },
              },
            },
          },
        },
        { type: 'line_step', id: 'b1.n' },
        { type: 'line_step', next: { block: { type: 'line_step' } } },
      ],
    },
  };

  it('assigns path-based ids only where they are missing, without mutating the input', () => {
    const before = structuredClone(idless);
    const result = normalizeIds(idless);
    expect(idless).toEqual(before);
    const [start, , third] = result.blocks.blocks as Array<Record<string, unknown>>;
    expect(start).toMatchObject({
      id: 'start',
      next: {
        block: {
          id: 'b0.n',
          inputs: { TIMES: { shadow: { id: 'b0.n.TIMES.s' } }, DO: { block: { id: 'b0.n.DO' } } },
        },
      },
    });
    expect(third).toMatchObject({ id: 'b2', next: { block: { id: 'b2.n' } } });
  });

  it('never reuses an existing id', () => {
    const clash = {
      blocks: {
        languageVersion: 0 as const,
        blocks: [{ type: 'a', id: 'b1' }, { type: 'b' }],
      },
    };
    expect(normalizeIds(clash).blocks.blocks[1]).toMatchObject({ id: 'b1_2' });
  });

  it('is stable: the same input always gives the same ids', () => {
    expect(normalizeIds(idless)).toEqual(normalizeIds(idless));
  });
});
