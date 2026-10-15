// Spell search (ADR-0023 §4): reproduces the P4-01 spike numbers on the same sketch levels.
import { LevelSchema } from '@codequest/content-schema';
import { describe, expect, it } from 'vitest';
import { findParsonsArrangements } from '../parsons';
import { findShortestPrograms } from './shortest';
import { formatProgramWithDefs, programToWorkspace } from './program';
import { spellsNeeded } from './spellsNeeded';
import { climbLevel, deliverLevel, forkLevel, stairLevel } from './spellLevels';

const shown = (result: ReturnType<typeof findShortestPrograms>): string[] =>
  result.examples.map((program, index) =>
    formatProgramWithDefs(program, result.definitions?.[index] ?? {}),
  );

describe('mode 1: the solution’s bodies (spike numbers)', () => {
  it('l03: par 10, 2 programs, every one checked by runLevel', () => {
    const result = findShortestPrograms(stairLevel);
    expect(result).toMatchObject({
      minBlocks: 10,
      count: 2,
      complete: true,
      mismatches: [],
      unsupported: [],
      spellMode: 'solution-bodies',
    });
    // Two programs share a prefix, so one example stands for both.
    expect(shown(result)[0]).toMatch(
      /cast stair.*\| stair = \[forward, turn_left, forward, turn_right\]$/,
    );
  });

  it('l11: par 9 on 3 maps, 1 program', () => {
    expect(findShortestPrograms(forkLevel)).toMatchObject({
      minBlocks: 9,
      count: 1,
      complete: true,
      mismatches: [],
    });
  });

  it('l06 robotlab: par 14, 1 program', () => {
    expect(findShortestPrograms(deliverLevel())).toMatchObject({
      minBlocks: 14,
      count: 1,
      complete: true,
      mismatches: [],
    });
  });

  it('l08 with maze_forward 3: par 10, 40 programs, calls inside a loop allowed', () => {
    const result = findShortestPrograms(climbLevel({ maze_forward: 3 }));
    expect(result).toMatchObject({ minBlocks: 10, count: 40, complete: true, mismatches: [] });
    expect(shown(result).some((text) => text.includes('repeat 2 [cast climb'))).toBe(true);
  });

  it('is deterministic', () => {
    expect(shown(findShortestPrograms(stairLevel))).toEqual(
      shown(findShortestPrograms(stairLevel)),
    );
  });
});

describe('mode 2: every body of ≤ k blocks', () => {
  it('l03 k=3 finds the shorter body (par 9)', () => {
    const result = findShortestPrograms(stairLevel, { procBodies: 3 });
    expect(result).toMatchObject({
      minBlocks: 9,
      complete: true,
      mismatches: [],
      spellMode: 'small-bodies',
      procBodies: 3,
    });
    expect(shown(result).every((text) => text.includes('stair = [forward, turn_left, forward]'))).toBe(
      true,
    );
  });

  it('l11 k=3 keeps par 9', () => {
    expect(findShortestPrograms(forkLevel, { procBodies: 3 })).toMatchObject({
      minBlocks: 9,
      complete: true,
    });
  });
});

describe('effective loop depth in the catalogue', () => {
  it('never puts a spell that loops inside a loop at maxLoopDepth 1', () => {
    const result = findShortestPrograms(forkLevel, { maxSize: 12 });
    for (const text of shown(result)) expect(text).not.toMatch(/(repeat|until)[^|]*cast fork/);
  });
});

describe('R5: nothing wins without spells', () => {
  it('l03, l11, l06 are proven by maxBlocks alone', () => {
    for (const level of [stairLevel, forkLevel, deliverLevel()]) {
      expect(spellsNeeded(level).verdict).toBe('proven');
    }
  });

  it('l08 fails with maxBlocks alone and holds with maxInstances', () => {
    const loose = spellsNeeded(climbLevel());
    expect(loose.verdict).toBe('wins');
    expect(loose.win).not.toBeNull();
    expect(spellsNeeded(climbLevel({ maze_forward: 3 })).verdict).toBe('proven');
    expect(spellsNeeded(deliverLevel({ robot_release: 1 })).verdict).toBe('proven');
  });

  it('reports a spent budget as unproven', () => {
    expect(spellsNeeded(deliverLevel(), { maxWork: 50 }).verdict).toBe('unproven');
  });
});

describe('parsons with spells: both stacks are arranged', () => {
  it('a corridor of 4 with a 2-step spell has exactly one winning arrangement', () => {
    const solution = programToWorkspace([{ call: 'two' }, { call: 'two' }], {
      two: [{ block: 'maze_forward' }, { block: 'maze_forward' }],
    });
    const level = LevelSchema.parse({
      id: 'spell-parsons',
      worldId: '_sandbox',
      stage: 'guided',
      kind: 'maze',
      mode: 'parsons',
      title: 'Ghép phép',
      objective: 'Tới đích',
      learningGoal: 'Dạy phép',
      toolbox: [],
      par: 5,
      procedures: [{ id: 'two', name: 'đi hai' }],
      config: { map: ['#######', '#S...G#', '#######'], startDir: 'E' },
      initialWorkspace: solution,
      solution,
      hints: [],
    });
    const found = findParsonsArrangements(level);
    expect(found).toMatchObject({ wins: 1, complete: true });
    expect(found.runs).toBeGreaterThan(1);
    expect(found.examples[0]).toContain('cq_proc_def(two) [maze_forward, maze_forward]');
  });
});
