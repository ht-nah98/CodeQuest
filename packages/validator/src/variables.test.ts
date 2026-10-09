// Engine variables in the par searches (P3-09, ADR-0022 §4): the spike's sample levels, now in
// tools/content-check/fixtures/variables-samples, searched with boxes as part of the state.
import { LevelSchema, type Level } from '@codequest/content-schema';
import { resolveLevelConfigs, robotlabRulesSchema } from '@codequest/games';
import { describe, expect, it, vi } from 'vitest';
import {
  formatProgram,
  programBlockTypes,
  programFromWorkspace,
  programLoopDepth,
  programSize,
  programToWorkspace,
  type Program,
} from './search/program';
import { findFixes } from './search/fixes';
import { findShortestPrograms } from './search/shortest';
import { FastSim, UnsearchableLevel } from './search/sim';
import { getGameKind } from '@codequest/games';
import { validateLevel } from './validateLevel';
import { variableIssues, withoutVariables } from './variableRules';

// Loaded through Vite (headless packages have no node:fs).
const sharedJson = await vi.importActual<{ default: unknown }>(
  '../../../content/shared/robotlab.json',
);
const shared = { robotlab: robotlabRulesSchema.parse(sharedJson.default) };

async function sample(id: string): Promise<Level> {
  const json = await vi.importActual<{ default: unknown }>(
    `../../../tools/content-check/fixtures/variables-samples/worlds/_sandbox/levels/${id}.json`,
  );
  return resolveLevelConfigs(LevelSchema.parse(json.default), shared);
}

/** A maze level for the tests below (draft world, no hints). */
function mazeLevel(fields: Partial<Level> & Pick<Level, 'toolbox' | 'config'>): Level {
  return LevelSchema.parse({
    id: 'var-test',
    worldId: '_sandbox',
    stage: 'practice',
    kind: 'maze',
    mode: 'build',
    title: 't',
    objective: 'o',
    learningGoal: 'g',
    hints: [],
    // The searches never read the solution; the schema wants one in mode build.
    solution: programToWorkspace([]),
    ...fields,
  });
}

describe('spike numbers (ADR-0022), reproduced on the sample levels', () => {
  it('var-count (l03): min 5, 15 programs; without boxes min 2 in 6 states', async () => {
    const level = await sample('var-count');
    expect(validateLevel(level, { isDraft: true, shared }).issues).toEqual([]);
    const result = findShortestPrograms(level);
    expect(result).toMatchObject({
      minBlocks: 5,
      count: 15,
      complete: true,
      mismatches: [],
      unsupported: [],
    });
    // Spike: 186 states (max 9), 179 k work; the spike's map sketch was not kept, so the state
    // and work numbers differ a little with this map.
    // The one exact regression sample (the search is deterministic).
    expect([result.states, result.work]).toEqual([188, 101_615]);
    expect(formatProgram(result.examples[0] ?? [])).toBe(
      'repeat 6 [if bamboo_ahead [var_add(VAR=bamboo NUM=1)], forward]',
    );
    // A raised max multiplies the states (spike: ×5 from 9 to 99; max is now at most 20).
    const roomy = { ...level, variables: [{ id: 'bamboo', name: 'số măng', max: 20 }] };
    expect(findShortestPrograms(roomy).states).toBeGreaterThan(result.states);
    // Without boxes and countGoal: "repeat 6 [forward]" (spike: min 2, 6 states, 8 work).
    const plain = findShortestPrograms(withoutVariables(level));
    expect(plain.minBlocks).toBe(2);
    expect(plain.states).toBeLessThanOrEqual(10);
  });

  it('var-order (l11 maze): min 4, 21 programs; R4: no win up to 8 blocks without boxes', async () => {
    const level = await sample('var-order');
    expect(validateLevel(level, { isDraft: true, shared }).issues).toEqual([]);
    const result = findShortestPrograms(level, { maxExamples: 30 });
    expect(result).toMatchObject({ minBlocks: 4, count: 21, complete: true, mismatches: [] });
    // Spike: 261 states, 20 k work.
    expect(result.states).toBeLessThan(400);
    expect(result.work).toBeLessThan(100_000);
    expect(result.examples.map(formatProgram)).toContain(
      'repeat <order> [forward], turn_right, forward',
    );
    // R4 (spike: no win up to 8, 28 states, 155 M work).
    const plain = findShortestPrograms(withoutVariables(level), {
      maxSize: 8,
      maxWork: 1_000_000_000,
    });
    expect(plain).toMatchObject({ minBlocks: null, complete: true, searchedSize: 8 });
    expect(plain.states).toBeLessThan(50);
    expect(plain.work).toBeLessThan(300_000_000);
  }, 60_000);

  it('robot-order (l11 robotlab, measured in P3-09): min 8, 12 programs; R4 holds', async () => {
    const level = await sample('robot-order');
    expect(validateLevel(level, { isDraft: true, shared }).issues).toEqual([]);
    const result = findShortestPrograms(level);
    expect(result).toMatchObject({ minBlocks: 8, count: 12, complete: true, mismatches: [] });
    expect(result.states).toBeLessThan(30_000);
    expect(result.work).toBeLessThan(5_000_000);
    const plain = findShortestPrograms(withoutVariables(level));
    expect(plain).toMatchObject({ minBlocks: null, complete: true, searchedSize: 8 });
  }, 60_000);
});

describe('boxes in the search state', () => {
  it('records the __var calls of a variable block and replays them on the boxes', async () => {
    const level = await sample('var-count');
    const kind = getGameKind('maze');
    if (kind === undefined) throw new Error('no maze');
    const sim = new FastSim(kind, level);
    const add = sim.atoms.find((atom) => atom.statement.block === 'cq_var_add');
    expect(add?.calls).toEqual([{ name: '__varAdd', args: ['bamboo', 1, 'b1'] }]);
    expect(sim.conds.map((cond) => cond.condition.block)).toEqual(['maze_bamboo_ahead']);
  });

  it('a box over max loses (BOX_FULL), like the engine', () => {
    const level = mazeLevel({
      toolbox: ['maze_forward', { type: 'cq_var_add', fields: { VAR: 'n', NUM: 2 } }],
      config: { map: ['####', 'S.G#', '####'], startDir: 'E' },
      variables: [{ id: 'n', name: 'số', max: 3 }],
      countGoal: { var: 'n', equals: [3] },
      par: 4,
    });
    // n = 2 then 4 > 3: no program reaches 3, so nothing wins.
    expect(findShortestPrograms(level, { maxSize: 5 })).toMatchObject({
      minBlocks: null,
      complete: true,
    });
  });

  it('a comparison is a question per map (cq_if_else on the box)', () => {
    const level = mazeLevel({
      toolbox: [
        'maze_forward',
        'maze_turn_left',
        'maze_turn_right',
        'cq_if_else',
        { type: 'cq_var_compare', fields: { VAR: 'order', OP: 'GT', NUM: 2 } },
      ],
      config: { map: ['###.#', 'S...#', '###G#'], startDir: 'E' },
      variants: [{ map: ['###G#', 'S...#', '###.#'], startDir: 'E' }],
      variables: [{ id: 'order', name: 'số đơn', start: [3, 1] }],
      par: 8,
    });
    const result = findShortestPrograms(level);
    expect(result).toMatchObject({ minBlocks: 8, complete: true, mismatches: [] });
    expect(result.examples.map(formatProgram)).toContain(
      'forward, forward, forward, if var_compare(VAR=order OP=GT NUM=2) [turn_right] else [turn_left], forward',
    );
    // R4: without the box, Măng tries both branches (A1) and needs 9 blocks.
    expect(findShortestPrograms(withoutVariables(level)).minBlocks).toBeNull();
    expect(findShortestPrograms(withoutVariables(level), { maxSize: 9 }).minBlocks).toBe(9);
  });

  it('a level with starGoals and countGoal needs both for par', () => {
    const level = mazeLevel({
      toolbox: [
        'maze_forward',
        'maze_turn_left',
        'maze_turn_right',
        { type: 'cq_var_add', fields: { VAR: 'n', NUM: 1 } },
      ],
      config: { map: ['S.G', '.b.', '...'], startDir: 'E' },
      variables: [{ id: 'n', name: 'số' }],
      countGoal: { var: 'n', equals: [1] },
      starGoals: [{ kind: 'collectAll' }],
      par: 8,
    });
    const goals = findShortestPrograms(level);
    expect(goals).toMatchObject({ minBlocks: 8, complete: true, mismatches: [] });
    const plain = findShortestPrograms(level, { ignoreStarGoals: true, maxExamples: 10 });
    expect(plain).toMatchObject({ minBlocks: 3, complete: true, mismatches: [] });
    // "tăng" before either step; after the second one Măng has already won on G (A1).
    expect(plain.count).toBe(2);
    for (const example of plain.examples) expect(formatProgram(example)).toContain('var_add');
    // Without countGoal the plain win needs no box at all.
    const uncounted: Level = { ...level };
    delete uncounted.countGoal;
    expect(findShortestPrograms(uncounted, { ignoreStarGoals: true }).minBlocks).toBe(2);
  });

  it('findFixes edits a box loop program (bughunt)', async () => {
    const level = await sample('var-order');
    const buggy: Program = [
      { repeatVar: 'order', body: [{ block: 'maze_forward' }] },
      { block: 'maze_turn_left' },
      { block: 'maze_forward' },
    ];
    const bughunt: Level = {
      ...level,
      mode: 'bughunt',
      initialWorkspace: programToWorkspace(buggy),
      parEdits: 1,
    };
    const fixes = findFixes(bughunt);
    expect(fixes).toMatchObject({ minEdits: 1, complete: true, mismatches: [] });
    expect(fixes.examples.map(formatProgram)).toContain(
      'repeat <order> [forward], turn_right, forward',
    );
  });
});

describe('boxes the level does not declare', () => {
  it('a compare or add pinned to an undeclared box is not searched (no abort)', async () => {
    const level = await sample('var-count');
    const odd: Level = {
      ...level,
      toolbox: [
        ...level.toolbox,
        { type: 'cq_var_compare', fields: { VAR: 'fish', OP: 'EQ', NUM: 1 } },
        { type: 'cq_var_add', fields: { VAR: 'fish', NUM: 1 } },
      ],
    };
    const result = findShortestPrograms(odd, { maxSize: 5 });
    expect(result.unsupported).toEqual([
      'cq_var_compare: names box "fish", which the level does not declare',
      'cq_var_add: names box "fish", which the level does not declare',
    ]);
    expect(result.minBlocks).toBe(5);
  });

  it('findFixes reports an undeclared box loop in initialWorkspace as unsearchable', async () => {
    const level = await sample('var-order');
    const bughunt: Level = {
      ...level,
      mode: 'bughunt',
      initialWorkspace: programToWorkspace([
        { repeatVar: 'fish', body: [{ block: 'maze_forward' }] },
      ]),
    };
    expect(() => findFixes(bughunt)).toThrow(UnsearchableLevel);
  });
});

describe('rule 23 (j): predict keys', () => {
  const predict = (keys: string[]): Level =>
    mazeLevel({
      mode: 'predict',
      toolbox: [],
      config: { map: ['#####', 'S...G', '#####'], startDir: 'E' },
      variables: [
        { id: 'bamboo', name: 'số măng', max: 5 },
        { id: 'fish', name: 'số cá' },
      ],
      initialWorkspace: programToWorkspace([{ block: 'maze_forward' }]),
      predict: { options: keys.map((key) => ({ key, label: key })) },
    });

  it('needs each box once, in order, within its max', () => {
    const messages = variableIssues(
      predict([
        'stop@1,1#bamboo=0#fish=0',
        'win#bamboo=1#bamboo=2',
        'win#fish=0#bamboo=0',
        'win#bamboo=6#fish=0',
      ]),
    ).errors.map((issue) => issue.message);
    expect(messages).toEqual([
      '(j) predict key "win#bamboo=1#bamboo=2" must end with #<id>=<n> for bamboo, fish, in that order',
      '(j) predict key "win#fish=0#bamboo=0" must end with #<id>=<n> for bamboo, fish, in that order',
      '(j) predict key "win#bamboo=6#fish=0" gives box "bamboo" 6 > max 5',
    ]);
  });
});

describe('cq_repeat_var in programs', () => {
  const program: Program = [
    { repeatVar: 'order', body: [{ block: 'maze_forward' }, { repeat: 2, body: [] }] },
  ];

  it('round-trips through workspace JSON and counts as a loop block', () => {
    const workspace = programToWorkspace(program);
    expect(programFromWorkspace(workspace)).toEqual(program);
    expect(programSize(program)).toBe(3);
    expect(programLoopDepth(program)).toBe(2);
    expect(Object.fromEntries(programBlockTypes(program))).toEqual({
      cq_repeat_var: 1,
      maze_forward: 1,
      cq_repeat: 1,
    });
    expect(formatProgram(program)).toBe('repeat <order> [forward, repeat 2 []]');
  });

  it('is not searchable without a VAR', () => {
    const workspace = programToWorkspace(program);
    const start = workspace.blocks.blocks[0] as unknown as { next: { block: { fields?: object } } };
    const loop = start.next.block;
    delete loop.fields;
    expect(programFromWorkspace(workspace)).toBeNull();
  });
});
