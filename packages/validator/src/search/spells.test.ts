// Spell search (ADR-0023 §4): reproduces the P4-01 spike numbers on the same sketch levels.
import { LevelSchema } from '@codequest/content-schema';
import { describe, expect, it } from 'vitest';
import { findParsonsArrangements } from '../parsons';
import { findFixes } from './fixes';
import { findShortestPrograms } from './shortest';
import { formatProgramWithDefs, programToWorkspace } from './program';
import { spellsNeeded } from './spellsNeeded';
import { editDistance } from '@codequest/engine';
import {
  boxStairsLevel,
  climbLevel,
  corridorLevel,
  deliverLevel,
  forkLevel,
  stairLevel,
  twoSpellLevel,
} from './spellLevels';

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
    expect(
      shown(result).every((text) => text.includes('stair = [forward, turn_left, forward]')),
    ).toBe(true);
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

describe('bughunt fixes inside a spell', () => {
  const broken = programToWorkspace(
    [
      { call: 'stair' },
      { block: 'maze_forward' },
      { call: 'stair' },
      { block: 'maze_turn_left' },
      { call: 'stair' },
    ],
    {
      stair: [
        { block: 'maze_forward' },
        { block: 'maze_turn_left' },
        { block: 'maze_forward' },
        { block: 'maze_turn_left' },
      ],
    },
  );
  const bughunt = {
    ...stairLevel,
    mode: 'bughunt' as const,
    parEdits: 1,
    initialWorkspace: broken,
  };

  it('one change in the body fixes every call', () => {
    const fixes = findFixes(bughunt);
    expect(fixes).toMatchObject({ minEdits: 1, complete: true, mismatches: [] });
    expect(fixes.count).toBeGreaterThanOrEqual(1);
    const fixed = (fixes.examples[0] ?? []).length;
    expect(fixed).toBe(5);
    expect(fixes.definitions?.[0]?.['stair']).toEqual([
      { block: 'maze_forward' },
      { block: 'maze_turn_left' },
      { block: 'maze_forward' },
      { block: 'maze_turn_right' },
    ]);
  });

  it('a call to an untaught spell is never a fix', () => {
    const noSpell = programToWorkspace([{ call: 'stair' }, { call: 'stair' }]);
    const fixes = findFixes({ ...bughunt, initialWorkspace: noSpell, parEdits: 1 });
    expect(fixes.minEdits).toBeNull();
    expect(fixes.complete).toBe(true);
  });
});

describe('two spells: every subset, the minimum over all', () => {
  it('both spells win at 14; one spell alone needs 15 (the last turn is not needed)', () => {
    const result = findShortestPrograms(twoSpellLevel);
    expect(result).toMatchObject({ minBlocks: 14, complete: true, mismatches: [] });
    expect(Object.keys(result.definitions?.[0] ?? {}).sort()).toEqual(['run', 'step']);
    const oneSpell = findShortestPrograms(
      { ...twoSpellLevel, maxBlocks: 16, par: 16 },
      {
        maxSize: 16,
      },
    );
    expect(oneSpell.minBlocks).toBe(14);
    const noStep = {
      ...twoSpellLevel,
      maxBlocks: 18,
      par: 18,
      maxInstances: { cq_proc_def: 1 },
    };
    expect(findShortestPrograms(noStep, { maxSize: 18 })).toMatchObject({
      minBlocks: 15,
      complete: true,
      mismatches: [],
    });
  });

  it('mode 2 keeps the minimum and stays complete (sets tried once)', () => {
    const result = findShortestPrograms(twoSpellLevel, { procBodies: 1 });
    expect(result).toMatchObject({ minBlocks: 14, complete: true, mismatches: [] });
  });
});

describe('mode 2 stops on its budget', () => {
  it('a tiny work budget ends incomplete, without hanging', () => {
    const result = findShortestPrograms(deliverLevel(), { procBodies: 4, maxWork: 20_000 });
    expect(result.complete).toBe(false);
    expect(result.work).toBeLessThan(40_000);
  });

  it('shouldStop ends it too', () => {
    let polls = 0;
    const result = findShortestPrograms(deliverLevel(), {
      procBodies: 3,
      shouldStop: () => ++polls > 2,
    });
    expect(result.complete).toBe(false);
  });
});

describe('maxInstances caps on the spell blocks', () => {
  it('cq_proc_call 2 forbids the 3-call solution', () => {
    const capped = { ...stairLevel, maxInstances: { cq_proc_call: 2 } };
    const result = findShortestPrograms(capped);
    expect(result.minBlocks).toBeNull();
    expect(result.complete).toBe(true);
  });

  it('fixes respect the caps as well', () => {
    const broken = programToWorkspace(
      [
        { call: 'stair' },
        { block: 'maze_forward' },
        { call: 'stair' },
        { block: 'maze_turn_left' },
        { call: 'stair' },
      ],
      {
        stair: [
          { block: 'maze_forward' },
          { block: 'maze_turn_left' },
          { block: 'maze_forward' },
          { block: 'maze_turn_left' },
        ],
      },
    );
    const level = {
      ...stairLevel,
      mode: 'bughunt' as const,
      parEdits: 1,
      initialWorkspace: broken,
      maxInstances: { cq_proc_call: 2 },
    };
    expect(findFixes(level)).toMatchObject({ minEdits: null, complete: true });
  });
});

describe('bughunt: teaching or deleting a dạy phép block counts like editDistance', () => {
  const order = ['two', 'one'];

  it('a missing dạy phép is 1 + its body edits', () => {
    const noSpell = programToWorkspace([{ call: 'two' }, { call: 'two' }]);
    const level = {
      ...corridorLevel(),
      mode: 'bughunt' as const,
      parEdits: 3,
      initialWorkspace: noSpell,
    };
    const fixes = findFixes(level);
    expect(fixes).toMatchObject({ minEdits: 3, complete: true, mismatches: [] });
    const fixed = programToWorkspace(fixes.examples[0] ?? [], fixes.definitions?.[0] ?? {});
    expect(editDistance(noSpell, fixed, order)).toBe(3);
  });

  it('deleting an unused spell and its body is 2 edits', () => {
    const extra = programToWorkspace([{ call: 'two' }, { call: 'two' }], {
      two: [{ block: 'maze_forward' }, { block: 'maze_forward' }],
      one: [{ block: 'maze_forward' }],
    });
    const level = {
      ...corridorLevel({ maxBlocks: 5 }),
      mode: 'bughunt' as const,
      parEdits: 2,
      initialWorkspace: extra,
    };
    const fixes = findFixes(level);
    expect(fixes).toMatchObject({ minEdits: 2, complete: true, mismatches: [] });
    expect(Object.keys(fixes.definitions?.[0] ?? {})).toEqual(['two']);
  });
});

describe('parsons with two spells', () => {
  it('counts every way the blocks share out between the stacks', () => {
    const solution = programToWorkspace([{ call: 'two' }, { call: 'one' }], {
      two: [{ block: 'maze_forward' }, { block: 'maze_forward' }],
      one: [{ block: 'maze_forward' }],
    });
    const level = LevelSchema.parse({
      ...corridorLevel({ config: { map: ['######', '#S..G#', '######'], startDir: 'E' } }),
      mode: 'parsons',
      initialWorkspace: solution,
      solution,
    });
    const found = findParsonsArrangements(level);
    // Both casts in the main program; the 3 forwards shared as (main, two, one) = (0, 1, 2) or
    // (0, 2, 1) with 2 call orders each, or (1, 1, 1) with 6 orders: 10.
    expect(found).toMatchObject({ wins: 10, complete: true });
  });

  it('stops at maxRuns', () => {
    const level = {
      ...stairLevel,
      mode: 'parsons' as const,
      initialWorkspace: stairLevel.solution,
    };
    expect(findParsonsArrangements(level, { maxRuns: 5 })).toMatchObject({
      runs: 5,
      complete: false,
    });
  });
});

describe('spells with a box (P4-04)', () => {
  it('the stairs level: par 9 with calls 1 and 3, checked by runLevel', () => {
    const result = findShortestPrograms(boxStairsLevel);
    expect(result).toMatchObject({ minBlocks: 9, complete: true, mismatches: [] });
    expect(shown(result)[0]).toContain('cast stairs 1');
    expect(spellsNeeded(boxStairsLevel).verdict).toBe('proven');
  });

  it('is deterministic', () => {
    expect(shown(findShortestPrograms(boxStairsLevel))).toEqual(
      shown(findShortestPrograms(boxStairsLevel)),
    );
  });

  it('a wrong number is one edit', () => {
    const wrong = programToWorkspace(
      [{ call: 'stairs', arg: 1 }, { block: 'maze_forward' }, { call: 'stairs', arg: 2 }],
      {
        stairs: [
          {
            repeatVar: 'steps',
            body: [
              { block: 'maze_forward' },
              { block: 'maze_turn_left' },
              { block: 'maze_forward' },
              { block: 'maze_turn_right' },
            ],
          },
        ],
      },
      new Set(['stairs']),
    );
    const level = {
      ...boxStairsLevel,
      mode: 'bughunt' as const,
      parEdits: 1,
      initialWorkspace: wrong,
    };
    const fixes = findFixes(level);
    expect(fixes).toMatchObject({ minEdits: 1, complete: true, mismatches: [] });
    expect(formatProgramWithDefs(fixes.examples[0] ?? [], {})).toContain('cast stairs 3');
  });
});
