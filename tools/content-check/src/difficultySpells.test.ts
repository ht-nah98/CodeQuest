// Rule 24 with spells and turtle (P4-05): spell body families and shapes without degrees.
import { describe, expect, it } from 'vitest';
import { programShape, spellFamily } from './difficulty';

const F = { block: 'maze_forward' };
const L = { block: 'maze_turn_left' };
const R = { block: 'maze_turn_right' };

describe('spell body families (M2)', () => {
  it('a rotation or a mirror image of a body is the same family', () => {
    const family = spellFamily([F, L, F, R]);
    expect(spellFamily([L, F, R, F])).toBe(family);
    expect(spellFamily([F, R, F, L])).toBe(family);
    expect(spellFamily([F, F, L, L])).not.toBe(family);
  });

  it('merges runs after rotating, so a run split across the cycle is the same family', () => {
    expect(spellFamily([F, L, F])).toBe(spellFamily([F, F, L]));
    expect(spellFamily([L, F, F])).toBe(spellFamily([F, F, L]));
    expect(spellFamily([F, L, F, F, R])).toBe(spellFamily([F, F, R, F, L]));
    // Mirror then rotate: [L, repeat [F, R]] → [R, repeat [F, L]] → [repeat [F, L], R].
    expect(spellFamily([{ repeat: 2, body: [F, L] }, R])).toBe(
      spellFamily([L, { repeat: 2, body: [F, R] }]),
    );
    expect(spellFamily([{ repeat: 2, body: [F, L] }, R])).not.toBe(
      spellFamily([R, { repeat: 2, body: [F, R] }]),
    );
  });
});

describe('turtle shapes (M2)', () => {
  it('drop step counts and degrees', () => {
    const square = [
      {
        repeat: 4,
        body: [
          { block: 'turtle_forward', fields: { N: 2 } },
          { block: 'turtle_turn_right', fields: { DEG: '90' } },
        ],
      },
    ];
    const triangle = [
      {
        repeat: 3,
        body: [
          { block: 'turtle_forward', fields: { N: 3 } },
          { block: 'turtle_turn_right', fields: { DEG: '120' } },
        ],
      },
    ];
    expect(programShape(square)).toBe(programShape(triangle));
  });
});
