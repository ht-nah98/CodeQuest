import type { AnyGameKindDefinition } from '@codequest/engine';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { getGameKind } from '@codequest/games';
import { checkContent, type ContentFile, type GameKindLookup } from './rules';

/** Stand-in for the runner until it exists (P0-07); only `configSchema` matters to rule 1. */
const fakeRunner = {
  id: 'runner',
  configSchema: z.strictObject({ cells: z.array(z.string()).min(1) }),
} as unknown as AnyGameKindDefinition;
const lookup: GameKindLookup = (id) => (id === 'runner' ? fakeRunner : undefined);

const workspace = { blocks: { languageVersion: 0, blocks: [{ type: 'cq_start', id: 'start' }] } };

/** Minimal valid content object for a path, so rule-2 tests are not drowned by rule 1. */
function valid(path: string, id: string): object {
  if (path.endsWith('world.json')) {
    return {
      id,
      order: 1,
      title: 'Làng Tre',
      emoji: '🎋',
      concept: 'Tuần tự',
      story: 'Măng về làng.',
      theme: { tileset: '/tiles/a.png' },
      lessonIds: [],
      levelIds: ['w01-l01'],
      unlock: { minStarRatio: 0.6 },
    };
  }
  if (path.includes('/lessons/')) {
    return {
      id,
      worldId: 'w01-a',
      title: 'Bài',
      cards: [{ type: 'say', pose: 'talk', text: 'Chào' }],
    };
  }
  return {
    id,
    worldId: 'w01-a',
    stage: 'creative',
    kind: 'runner',
    mode: 'creative',
    title: 'Thử',
    objective: 'Đi',
    learningGoal: 'Tuần tự',
    toolbox: [],
    config: { cells: ['ground', 'flag'] },
    hints: [],
    initialWorkspace: workspace,
  };
}

const shopItem = {
  id: 'skin-astro-panda',
  kind: 'skin',
  title: 'Măng vũ trụ',
  price: 120,
  asset: '/a.png',
};
const badge = {
  id: 'first-run',
  title: 'Lần đầu chạy code',
  description: 'Bấm chạy lần đầu',
  icon: '/b.png',
  rule: { type: 'event', name: 'first-run' },
};

function json(path: string, value: unknown): ContentFile {
  return { path, text: JSON.stringify(value) };
}

/** A schema-valid file whose id is `id`. */
function entity(path: string, id: string): ContentFile {
  return json(path, valid(path, id));
}

function rulesOf(files: ContentFile[]): number[] {
  return checkContent(files, lookup).issues.map((issue) => issue.rule);
}

describe('checkContent', () => {
  it('passes when there is no content', () => {
    expect(checkContent([], lookup)).toEqual({ entries: [], issues: [] });
  });

  it('accepts well-formed world, level, lesson and shared files', () => {
    const report = checkContent(
      [
        entity('worlds/w01-lang-tre/world.json', 'w01-lang-tre'),
        entity('worlds/w01-lang-tre/levels/w01-l03.json', 'w01-l03'),
        entity('worlds/w01-lang-tre/levels/w01-boss.json', 'w01-boss'),
        entity('worlds/w01-lang-tre/levels/w01-creative.json', 'w01-creative'),
        entity('worlds/w01-lang-tre/levels/w01-bonus01.json', 'w01-bonus01'),
        entity('worlds/w01-lang-tre/lessons/w01-lesson.json', 'w01-lesson'),
        entity('worlds/w01-lang-tre/lessons/w01-lesson-loops.json', 'w01-lesson-loops'),
        json('shared/feedback.json', { FELL_IN_HOLE: 'Ối, hố!' }),
        json('shared/shop.json', [shopItem]),
        json('shared/badges.json', [badge]),
      ],
      lookup,
    );
    expect(report.issues).toEqual([]);
    expect(report.entries.map((entry) => entry.kind)).toEqual([
      'world',
      'level',
      'level',
      'level',
      'level',
      'lesson',
      'lesson',
      'shared',
      'shared',
      'shared',
    ]);
  });

  it('reports invalid JSON as rule 1', () => {
    expect(rulesOf([{ path: 'worlds/w01-a/world.json', text: '{ id: ' }])).toEqual([1]);
    expect(rulesOf([{ path: 'shared/shop.json', text: '[' }])).toEqual([1]);
  });

  it('reports a missing id as rule 1', () => {
    expect(rulesOf([json('worlds/w01-a/levels/w01-l01.json', { title: 'x' })])).toEqual([1]);
    expect(rulesOf([json('worlds/w01-a/levels/w01-l01.json', ['w01-l01'])])).toEqual([1]);
  });

  it.each([
    ['worlds/w1-a/world.json', 'w1-a'],
    ['worlds/w01-Lang/world.json', 'w01-Lang'],
    ['worlds/w01-a/levels/w01-l3.json', 'w01-l3'],
    ['worlds/w01-a/levels/w01-level03.json', 'w01-level03'],
    ['worlds/w01-a/lessons/w01-intro.json', 'w01-intro'],
  ])('rejects id pattern of %s', (path, id) => {
    expect(rulesOf([entity(path, id)])).toEqual([2]);
  });

  it('requires the id to match the file or folder name', () => {
    expect(rulesOf([entity('worlds/w01-a/levels/w01-l01.json', 'w01-l02')])).toEqual([2]);
    expect(rulesOf([entity('worlds/w01-a/world.json', 'w01-b')])).toEqual([2]);
  });

  it('rejects duplicate ids across worlds', () => {
    const issues = checkContent(
      [
        entity('worlds/w01-a/levels/w01-l01.json', 'w01-l01'),
        entity('worlds/w01-b/levels/w01-l01.json', 'w01-l01'),
      ],
      lookup,
    ).issues;
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('duplicate id "w01-l01"');
  });

  it('exempts draft folders from the id pattern but not from file-name matching', () => {
    expect(rulesOf([entity('worlds/_sandbox/levels/try-jump.json', 'try-jump')])).toEqual([]);
    expect(rulesOf([entity('worlds/_sandbox/levels/try-jump.json', 'other')])).toEqual([2]);
  });

  it('requires level and lesson ids to share the world prefix', () => {
    expect(rulesOf([entity('worlds/w01-a/levels/w02-l01.json', 'w02-l01')])).toEqual([2]);
    expect(rulesOf([entity('worlds/w01-a/lessons/w02-lesson.json', 'w02-lesson')])).toEqual([2]);
  });

  it('accepts only the known shared files', () => {
    expect(rulesOf([json('shared/shopp.json', [])])).toEqual([2]);
  });

  it('rejects files in unexpected places', () => {
    expect(rulesOf([json('levels/w01-l01.json', { id: 'w01-l01' })])).toEqual([2]);
    expect(rulesOf([entity('worlds/w01-a/extra/w01-l01.json', 'w01-l01')])).toEqual([2]);
  });

  it('reports schema violations as rule 1 with the field path', () => {
    const level = valid('worlds/w01-a/levels/w01-l01.json', 'w01-l01');
    const issues = checkContent(
      [json('worlds/w01-a/levels/w01-l01.json', { ...level, mode: 'quiz' })],
      lookup,
    ).issues;
    expect(issues.map((issue) => issue.rule)).toEqual([1]);
    expect(issues[0]?.message).toMatch(/^mode: /);
    expect(rulesOf([json('worlds/w01-a/world.json', { id: 'w01-a' })])).toContain(1);
    expect(
      rulesOf([json('worlds/w01-a/lessons/w01-lesson.json', { id: 'w01-lesson', cards: [] })]),
    ).toContain(1);
  });

  it("checks level.config against its kind's configSchema", () => {
    const level = valid('worlds/w01-a/levels/w01-l01.json', 'w01-l01');
    const issues = checkContent(
      [json('worlds/w01-a/levels/w01-l01.json', { ...level, config: { cells: [] } })],
      lookup,
    ).issues;
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      rule: 1,
      message: expect.stringMatching(/^config\.cells: /) as unknown,
    });
  });

  it('requires an id on every authored block (rule 1)', () => {
    const level = valid('worlds/w01-a/levels/w01-l01.json', 'w01-l01');
    const idless = {
      blocks: {
        languageVersion: 0,
        blocks: [{ type: 'cq_start', id: 'start', next: { block: { type: 'runner_walk' } } }],
      },
    };
    const issues = checkContent(
      [json('worlds/w01-a/levels/w01-l01.json', { ...level, initialWorkspace: idless })],
      lookup,
    ).issues;
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      rule: 1,
      message: expect.stringContaining('initialWorkspace.blocks.blocks.0.next.block.id') as unknown,
    });
  });

  it('reports a level whose game kind is not implemented', () => {
    const level = valid('worlds/w01-a/levels/w01-l01.json', 'w01-l01');
    const issues = checkContent(
      [json('worlds/w01-a/levels/w01-l01.json', { ...level, kind: 'maze' })],
      lookup,
    ).issues;
    expect(issues).toEqual([
      {
        path: 'worlds/w01-a/levels/w01-l01.json',
        rule: 1,
        message: 'game kind "maze" is not implemented yet',
      },
    ]);
  });

  it('uses the real registry by default', () => {
    const level = valid('worlds/w01-a/levels/w01-l01.json', 'w01-l01');
    const report = checkContent([json('worlds/w01-a/levels/w01-l01.json', level)]);
    expect(report.issues.every((issue) => issue.rule === 1)).toBe(true);
  });

  it('validates feedback.json keys and sentences', () => {
    expect(rulesOf([json('shared/feedback.json', { fell_in_hole: 'x' })])).toEqual([1]);
    expect(rulesOf([json('shared/feedback.json', { TIMEOUT: '' })])).toEqual([1]);
  });

  it('validates shop items and their ids', () => {
    expect(rulesOf([json('shared/shop.json', [{ ...shopItem, price: -1 }])])).toEqual([1]);
    expect(rulesOf([json('shared/shop.json', [{ ...shopItem, id: 'Skin_Astro' }])])).toEqual([
      2, 2,
    ]);
    expect(rulesOf([json('shared/shop.json', [{ ...shopItem, id: 'fx-astro' }])])).toEqual([2]);
    expect(rulesOf([json('shared/shop.json', [shopItem, shopItem])])).toEqual([2]);
  });

  it('validates badges and their ids', () => {
    expect(rulesOf([json('shared/badges.json', [{ ...badge, rule: { type: 'coins' } }])])).toEqual([
      1,
    ]);
    expect(rulesOf([json('shared/badges.json', [{ ...badge, id: 'First Run' }])])).toEqual([2]);
    expect(rulesOf([json('shared/badges.json', [badge, badge])])).toEqual([2]);
  });
});

/** A schema-valid runner build level modelled on w01-l03 (ground, ground, hole, ground, flag). */
function runnerLevel(overrides: Record<string, unknown> = {}): ContentFile {
  const chain = (types: string[]): object | undefined =>
    types.reduceRight<object | undefined>(
      (next, type, index) => ({
        type,
        id: `b${String(index)}`,
        ...(next !== undefined && { next: { block: next } }),
      }),
      undefined,
    );
  const solution = (types: string[]): object => ({
    blocks: {
      languageVersion: 0,
      blocks: [{ type: 'cq_start', id: 'start', next: { block: chain(types) } }],
    },
  });
  return json('worlds/w01-lang-tre/levels/w01-l03.json', {
    id: 'w01-l03',
    worldId: 'w01-lang-tre',
    stage: 'guided',
    kind: 'runner',
    mode: 'build',
    title: 'Nhảy qua hố',
    objective: 'Nhảy qua hố để tới lá cờ nhé!',
    learningGoal: 'Dùng khối nhảy',
    toolbox: ['runner_walk', 'runner_jump'],
    par: 3,
    config: { cells: ['ground', 'ground', 'hole', 'ground', 'flag'], start: 0 },
    solution: solution(['runner_walk', 'runner_jump', 'runner_walk']),
    hints: [],
    ...overrides,
    ...(Array.isArray(overrides['solution']) && {
      solution: solution(overrides['solution'] as string[]),
    }),
    ...(Array.isArray(overrides['initialWorkspace']) && {
      initialWorkspace: solution(overrides['initialWorkspace'] as string[]),
    }),
  });
}

function realIssues(file: ContentFile): Array<{ rule: number; message: string }> {
  return checkContent([file], getGameKind).issues.map(({ rule, message }) => ({ rule, message }));
}

describe('checkContent rules 9–11', () => {
  it('accepts a winning solution within par and toolbox, and reports its detail', () => {
    const report = checkContent([runnerLevel()], getGameKind);
    expect(report.issues).toEqual([]);
    expect(report.entries[0]?.detail).toBe('runner/build  par 3  sol 3');
  });

  it('rule 9: reports a solution that crashes, with where it ended', () => {
    expect(realIssues(runnerLevel({ solution: ['runner_walk', 'runner_walk'] }))).toEqual([
      { rule: 9, message: 'solution ends crash FELL_IN_HOLE (crash:FELL_IN_HOLE@2)' },
    ]);
  });

  it('rule 9: reports a solution that stops before the flag', () => {
    expect(realIssues(runnerLevel({ solution: ['runner_walk'] }))).toEqual([
      { rule: 9, message: 'solution ends incomplete NOT_AT_GOAL (stop@1)' },
    ]);
  });

  it('rule 9: reports an empty solution', () => {
    expect(realIssues(runnerLevel({ solution: [] })).map((issue) => issue.message)).toEqual([
      'solution ends error EMPTY_PROGRAM',
    ]);
  });

  it('rules 9 and 10: report a solution with an unknown block', () => {
    const issues = realIssues(runnerLevel({ solution: ['runner_fly'], toolbox: ['runner_fly'] }));
    expect(issues.map((issue) => issue.rule)).toEqual([9, 10]);
    expect(issues[0]?.message).toMatch(/^solution ends error INTERNAL_ERROR .*runner_fly/);
  });

  it('rule 10: solution blocks must not exceed par', () => {
    expect(realIssues(runnerLevel({ par: 2 }))).toEqual([
      { rule: 10, message: 'solution uses 3 blocks > par 2' },
    ]);
  });

  it('rule 10: par must not exceed maxBlocks', () => {
    expect(realIssues(runnerLevel({ par: 4, maxBlocks: 3 }))).toEqual([
      { rule: 10, message: 'par 4 > maxBlocks 3' },
    ]);
  });

  it('rule 10: solution blocks must not exceed maxBlocks', () => {
    const issues = realIssues(runnerLevel({ par: 2, maxBlocks: 2 }));
    expect(issues.map((issue) => issue.rule)).toEqual([9, 10, 10]);
    expect(issues.map((issue) => issue.message)).toContain('solution uses 3 blocks > maxBlocks 2');
  });

  it('rule 11: solution blocks must come from the toolbox', () => {
    expect(realIssues(runnerLevel({ toolbox: ['runner_walk'] }))).toEqual([
      { rule: 11, message: 'solution uses "runner_jump", which is not in toolbox' },
    ]);
    expect(realIssues(runnerLevel({ toolbox: ['runner_walk', { type: 'runner_jump' }] }))).toEqual(
      [],
    );
  });

  it('rule 11: checks blocks nested inside cq_repeat', () => {
    const solution = {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'cq_start',
            id: 'start',
            next: {
              block: {
                type: 'cq_repeat',
                id: 'r',
                fields: { TIMES: 4 },
                inputs: { DO: { block: { type: 'runner_walk', id: 'w' } } },
              },
            },
          },
        ],
      },
    };
    const config = { cells: ['ground', 'ground', 'ground', 'ground', 'flag'], start: 0 };
    expect(realIssues(runnerLevel({ solution, config, par: 2 }))).toEqual([
      { rule: 11, message: 'solution uses "cq_repeat", which is not in toolbox' },
    ]);
    expect(
      realIssues(runnerLevel({ solution, config, par: 2, toolbox: ['runner_walk', 'cq_repeat'] })),
    ).toEqual([]);
  });

  it('rule 11: parsons compares the solution with initialWorkspace', () => {
    const parsons = { mode: 'parsons', toolbox: [] };
    expect(
      realIssues(
        runnerLevel({
          ...parsons,
          initialWorkspace: ['runner_walk', 'runner_jump', 'runner_walk'],
        }),
      ),
    ).toEqual([]);
    expect(realIssues(runnerLevel({ ...parsons, initialWorkspace: ['runner_walk'] }))).toEqual([
      { rule: 11, message: 'solution uses "runner_jump", which is not in initialWorkspace' },
    ]);
  });

  it('skips rules 9–11 when the config is invalid', () => {
    const issues = realIssues(runnerLevel({ config: { cells: ['ground'], start: 0 }, par: 1 }));
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every((issue) => issue.rule === 1)).toBe(true);
  });

  it('reports detail without sol for levels that have no solution', () => {
    const level = valid('worlds/w01-a/levels/w01-l01.json', 'w01-l01');
    const report = checkContent(
      [
        json('worlds/w01-a/levels/w01-l01.json', {
          ...level,
          config: { cells: ['ground', 'ground', 'flag'], start: 0 },
        }),
      ],
      getGameKind,
    );
    expect(report.issues).toEqual([]);
    expect(report.entries[0]?.detail).toBe('runner/creative');
  });
});
