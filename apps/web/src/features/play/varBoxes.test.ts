import { describe, expect, it } from 'vitest';
import type { LevelVariable } from '@codequest/content-schema';
import {
  applyCountVerdict,
  applyVarCompare,
  applyVarEvent,
  varBoxesAt,
  varOpOfBlockType,
} from './varBoxes';

const VARIABLES: LevelVariable[] = [
  { id: 'bamboo', name: 'số măng', max: 4 },
  { id: 'order', name: 'số ô', start: [3, 5] },
];

describe('box panel reducer (ADR-0022 §6)', () => {
  it('starts each box at its start on the map shown, with its max (default 9)', () => {
    expect(varBoxesAt(VARIABLES, 0)).toEqual({
      boxes: [
        { id: 'bamboo', name: 'số măng', max: 4, value: 0 },
        { id: 'order', name: 'số ô', max: 9, value: 3 },
      ],
      pulse: null,
      full: null,
      verdict: null,
    });
    expect(varBoxesAt(VARIABLES, 1).boxes.map((box) => box.value)).toEqual([0, 5]);
    expect(varBoxesAt(undefined, 0).boxes).toEqual([]);
  });

  it('tăng pops with its amount, đặt drops in, each change a new seq', () => {
    let state = varBoxesAt(VARIABLES, 0);
    state = applyVarEvent(state, { id: 'bamboo', value: 1 }, 'add');
    expect(state.boxes[0]?.value).toBe(1);
    expect(state.pulse).toEqual({ id: 'bamboo', kind: 'add', delta: 1, seq: 1 });
    state = applyVarEvent(state, { id: 'order', value: 3 }, 'set');
    expect(state.pulse).toEqual({ id: 'order', kind: 'set', delta: 0, seq: 2 });
    // The same value again still replays (tăng 0 is impossible, đặt to the same number is not).
    state = applyVarEvent(state, { id: 'order', value: 3 }, 'set');
    expect(state.pulse?.seq).toBe(3);
  });

  it('without an op, a rise counts as tăng and anything else as đặt', () => {
    const start = varBoxesAt(VARIABLES, 0);
    expect(applyVarEvent(start, { id: 'bamboo', value: 2 }).pulse?.kind).toBe('add');
    expect(applyVarEvent(start, { id: 'order', value: 1 }).pulse?.kind).toBe('set');
  });

  it('overflow keeps the number and marks the box full until the next reset', () => {
    let state = applyVarEvent(varBoxesAt(VARIABLES, 0), { id: 'bamboo', value: 4 }, 'add');
    state = applyVarEvent(state, { id: 'bamboo', value: 4, overflow: true }, 'add');
    expect(state.boxes[0]?.value).toBe(4);
    expect(state.full).toBe('bamboo');
    expect(state.pulse?.kind).toBe('full');
    state = applyVarEvent(state, { id: 'order', value: 4 }, 'add');
    expect(state.full).toBe('bamboo');
  });

  it('ignores a box the panel does not show', () => {
    const start = varBoxesAt(VARIABLES, 0);
    expect(applyVarEvent(start, { id: 'fish', value: 1 })).toBe(start);
  });

  it('tells đặt from tăng by block type', () => {
    expect(varOpOfBlockType('cq_var_set')).toBe('set');
    expect(varOpOfBlockType('cq_var_add')).toBe('add');
    expect(varOpOfBlockType(undefined)).toBe('add');
  });

  it('a question about a box lights ✔ / ✘ on it without changing the number', () => {
    let state = applyVarEvent(varBoxesAt(VARIABLES, 0), { id: 'order', value: 4 }, 'add');
    state = applyVarCompare(state, 'order', true);
    expect(state.pulse).toEqual({ id: 'order', kind: 'yes', delta: 0, seq: 2 });
    expect(state.boxes[1]?.value).toBe(4);
    state = applyVarCompare(state, 'order', false);
    expect(state.pulse).toEqual({ id: 'order', kind: 'no', delta: 0, seq: 3 });
    expect(applyVarCompare(state, 'fish', true)).toBe(state);
  });

  it('end of a counted run: ✔ when the box holds the number, else what it needs', () => {
    let state = applyVarEvent(varBoxesAt(VARIABLES, 0), { id: 'bamboo', value: 2 }, 'add');
    expect(applyCountVerdict(state, 'bamboo', 2).verdict).toEqual({
      id: 'bamboo',
      need: 2,
      ok: true,
    });
    state = applyCountVerdict(state, 'bamboo', 4);
    expect(state.verdict).toEqual({ id: 'bamboo', need: 4, ok: false });
    // A reset clears it.
    expect(varBoxesAt(VARIABLES, 1).verdict).toBeNull();
    expect(applyCountVerdict(state, 'fish', 1)).toBe(state);
  });
});
