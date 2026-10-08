// Robotlab levels through the validator and the searches (P3-01b): the three sample levels of
// curriculum.md §6.1 (l09, l14, l12) in tools/content-check/fixtures/robotlab-samples.
import { LevelSchema, type Level } from '@codequest/content-schema';
import { resolveLevelConfigs, robotlabRulesSchema } from '@codequest/games';
import { describe, expect, it, vi } from 'vitest';
import { findParsonsArrangements } from './parsons';
import { formatProgram, programToWorkspace } from './search/program';
import { findShortestPrograms } from './search/shortest';
import { validateLevel } from './validateLevel';

// Loaded through Vite (headless packages have no node:fs).
const sharedJson = await vi.importActual<{ default: unknown }>(
  '../../../content/shared/robotlab.json',
);
const shared = { robotlab: robotlabRulesSchema.parse(sharedJson.default) };

async function sample(id: string): Promise<Level> {
  const json = await vi.importActual<{ default: unknown }>(
    `../../../tools/content-check/fixtures/robotlab-samples/worlds/_sandbox/levels/${id}.json`,
  );
  return LevelSchema.parse(json.default);
}

const SAMPLES: ReadonlyArray<[string, number]> = [
  ['robot-missions', 7],
  ['robot-maps', 3],
  ['robot-score', 7],
];

describe('validateLevel on robotlab', () => {
  it.each(SAMPLES)('%s passes with the shared rules', async (id) => {
    const checked = validateLevel(await sample(id), { isDraft: true, shared });
    expect(checked.issues).toEqual([]);
  });

  it('reports rule 1 instead of running a robotlab level without the shared rules', async () => {
    const checked = validateLevel(await sample('robot-missions'), { isDraft: true });
    expect(checked.issues).toEqual([
      { rule: 1, message: 'robotlab needs the shared rules shared/robotlab.json' },
    ]);
  });

  it('rule 19: robotlab has no star goals', async () => {
    const level = { ...(await sample('robot-missions')), starGoals: [{ kind: 'collectAll' }] };
    expect(validateLevel(level, { isDraft: true, shared }).issues).toEqual([
      { rule: 19, message: 'game kind "robotlab" has no star goals' },
    ]);
  });

  it('reports a time limit whose turn loop would hit maxActions before OUT_OF_TIME', async () => {
    const level = await sample('robot-maps');
    const config = { ...(level.config as object), rules: { timeLimit: 600 } };
    const long = { ...level, config };
    expect(validateLevel(long, { isDraft: true, shared }).issues).toEqual([
      {
        rule: 1,
        message:
          'timeLimit 600 allows 1202 actions > maxActions 1000 on map 1: a loop would end with TIMEOUT before OUT_OF_TIME',
      },
    ]);
    const raised = { ...long, limits: { maxActions: 1202 } };
    expect(validateLevel(raised, { isDraft: true, shared }).issues).toEqual([]);
  });
});

describe('findShortestPrograms on robotlab', () => {
  it.each(SAMPLES)('%s: nothing shorter than par %i wins', async (id, par) => {
    const level = resolveLevelConfigs(await sample(id), shared);
    expect(level.par).toBe(par);
    const result = findShortestPrograms(level);
    expect(result.complete).toBe(true);
    expect(result.unsupported).toEqual([]);
    expect(result.mismatches).toEqual([]);
    expect(result.minBlocks).toBe(par);
  });

  it('tries every value of the "tiến [N] ô" field', async () => {
    const level = resolveLevelConfigs(await sample('robot-missions'), shared);
    const result = findShortestPrograms(level);
    expect(result.examples.map(formatProgram)[0]).toMatch(/^forward\(N=3\), turn_\w+, turn_/);
  });

  it('finds no win on a level whose shared rules were not merged (INTERNAL_ERROR)', async () => {
    const unmerged = await sample('robot-missions');
    expect(() => findShortestPrograms(unmerged)).toThrow('robotlab config not resolved');
  });
});

describe('findParsonsArrangements on robotlab', () => {
  it('runs every arrangement of a robotlab solution', async () => {
    const level = resolveLevelConfigs(await sample('robot-maps'), shared);
    // Map 1 only: "tiến 2 ô, tiến 4 ô" wins in either order (6 crossings to the lab).
    const solution = programToWorkspace([
      { block: 'robot_forward', fields: { N: 2 } },
      { block: 'robot_forward', fields: { N: 4 } },
    ]);
    const plain: Level = { ...level, mode: 'parsons', initialWorkspace: solution, solution };
    delete plain.variants;
    const result = findParsonsArrangements(plain);
    expect(result).toMatchObject({ complete: true, wins: 2 });
  });
});
