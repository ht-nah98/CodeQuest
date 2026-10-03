import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import {
  BadgeSchema,
  ContentWorkspaceJsonSchema,
  BadgesFileSchema,
  FeedbackFileSchema,
  HintRuleSchema,
  LessonCardSchema,
  LessonSchema,
  LevelSchema,
  ShopFileSchema,
  ShopItemSchema,
  ToolboxEntrySchema,
  WorkspaceJsonSchema,
  WorldSchema,
} from './index';

const workspace = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: 'cq_start',
        id: 'start',
        deletable: false,
        next: { block: { type: 'runner_walk', id: 'walk1' } },
      },
    ],
  },
};

const buildLevel = {
  id: 'w02-l05',
  worldId: 'w02-rung-lap-lai',
  stage: 'practice',
  kind: 'runner',
  mode: 'build',
  title: 'Đi và nhảy',
  objective: 'Đến lá cờ, dùng không quá 3 khối',
  learningGoal: 'Đặt nhiều khối bên trong một vòng lặp',
  misconception: 'Vòng lặp chỉ chứa được một khối',
  toolbox: ['runner_walk', 'runner_jump', { type: 'cq_repeat', fields: { TIMES: 2 } }],
  maxBlocks: 3,
  par: 3,
  config: { cells: ['ground', 'flag'], start: 0 },
  solution: workspace,
  hints: [
    {
      id: 'cap',
      when: { capacityFull: true, missing: 'cq_repeat' },
      say: 'Hết chỗ rồi! Thử khối lặp xem',
      point: 'toolbox:cq_repeat',
    },
  ],
  thinkingHint: 'Con thấy mẫu nào lặp đi lặp lại?',
};

function expectValid(schema: z.ZodType, value: unknown): void {
  const result = schema.safeParse(value);
  expect(result.error?.issues).toBeUndefined();
}

function expectInvalid(schema: z.ZodType, value: unknown): void {
  expect(schema.safeParse(value).success).toBe(false);
}

describe('WorkspaceJsonSchema', () => {
  it('accepts Blockly serialization JSON and keeps unknown keys', () => {
    const parsed = WorkspaceJsonSchema.parse({ ...workspace, procedures: [] });
    expect(parsed).toHaveProperty('procedures');
  });
  it.each([
    ['missing blocks', {}],
    ['wrong languageVersion', { blocks: { languageVersion: 1, blocks: [] } }],
    ['block without type', { blocks: { languageVersion: 0, blocks: [{ id: 'a' }] } }],
    ['blocks not an array', { blocks: { languageVersion: 0, blocks: {} } }],
  ])('rejects %s', (_name, value) => {
    expectInvalid(WorkspaceJsonSchema, value);
  });
});

describe('ContentWorkspaceJsonSchema', () => {
  it('accepts authored workspaces where every block has a safe id', () => {
    expectValid(ContentWorkspaceJsonSchema, workspace);
  });
  const withNested = (nested: object): object => ({
    blocks: {
      languageVersion: 0,
      blocks: [{ type: 'cq_start', id: 'start', next: { block: nested } }],
    },
  });
  it.each([
    ['a nested block without id', withNested({ type: 'runner_walk' })],
    ['an id with a quote', withNested({ type: 'runner_walk', id: "it's" })],
    ['an id with a line break', withNested({ type: 'runner_walk', id: 'a\nb' })],
    [
      'a shadow without id',
      withNested({
        type: 'cq_repeat',
        id: 'r',
        inputs: { TIMES: { shadow: { type: 'math_number' } } },
      }),
    ],
    ['duplicate ids', withNested({ type: 'runner_walk', id: 'start' })],
    [
      'a block disabled as an orphan (P2-07 review)',
      withNested({ type: 'runner_walk', id: 'w', disabledReasons: ['ORPHANED_BLOCK'] }),
    ],
    ['a block with enabled false', withNested({ type: 'runner_walk', id: 'w', enabled: false })],
  ])('rejects %s', (_name, value) => {
    expectInvalid(ContentWorkspaceJsonSchema, value);
  });
  it('accepts an explicitly enabled block', () => {
    expectValid(
      ContentWorkspaceJsonSchema,
      withNested({ type: 'runner_walk', id: 'w', enabled: true }),
    );
  });
  it('is stricter than the runtime schema, which accepts Blockly-generated ids', () => {
    expectValid(WorkspaceJsonSchema, withNested({ type: 'runner_walk', id: "#a'b" }));
  });
});

describe('ToolboxEntrySchema', () => {
  it('accepts a type or a type with fields', () => {
    expectValid(ToolboxEntrySchema, 'runner_walk');
    expectValid(ToolboxEntrySchema, { type: 'cq_repeat', fields: { TIMES: 3 } });
  });
  it.each([
    ['empty string', ''],
    ['inputs (would carry shadows)', { type: 'controls_repeat_ext', inputs: {} }],
    ['missing type', { fields: {} }],
  ])('rejects %s', (_name, value) => {
    expectInvalid(ToolboxEntrySchema, value);
  });
});

describe('HintRuleSchema', () => {
  it('accepts nested all/any/not conditions', () => {
    expectValid(HintRuleSchema, {
      id: 'h1',
      when: {
        all: [{ trigger: 'run-end' }, { any: [{ has: 'cq_repeat' }, { not: { orphans: true } }] }],
      },
      say: 'Thử lại nhé',
      point: 'block:cq_start',
      priority: 2,
    });
  });
  it.each([
    ['unknown condition key', { id: 'h', when: { hasBlock: 'x' }, say: 'x' }],
    ['bad target', { id: 'h', when: {}, say: 'x', point: 'workspace' }],
    ['bad trigger', { id: 'h', when: { trigger: 'click' }, say: 'x' }],
    ['empty all', { id: 'h', when: { all: [] }, say: 'x' }],
    ['missing say', { id: 'h', when: {} }],
  ])('rejects %s', (_name, value) => {
    expectInvalid(HintRuleSchema, value);
  });
});

describe('LevelSchema', () => {
  it('accepts the example level of content-model.md §4', () => {
    expectValid(LevelSchema, buildLevel);
  });
  it('accepts a predict level without solution', () => {
    expectValid(LevelSchema, {
      ...buildLevel,
      solution: undefined,
      par: undefined,
      mode: 'predict',
      toolbox: [],
      initialWorkspace: workspace,
      predict: {
        options: [
          { key: 'win', label: 'Tới cờ' },
          { key: 'stop@1', label: 'Dừng ở 1' },
          { key: 'crash:FELL_IN_HOLE@2', label: 'Rơi hố' },
        ],
      },
    });
  });
  it('accepts 1–2 variants in modes build and bughunt', () => {
    const map = { cells: ['ground', 'ground', 'flag'], start: 0 };
    expectValid(LevelSchema, { ...buildLevel, variants: [map] });
    expectValid(LevelSchema, {
      ...buildLevel,
      mode: 'bughunt',
      parEdits: 1,
      initialWorkspace: workspace,
      variants: [map, map],
    });
  });
  it.each([
    ['unknown kind', { ...buildLevel, kind: 'racing' }],
    ['empty variants', { ...buildLevel, variants: [] }],
    ['three variants', { ...buildLevel, variants: [{}, {}, {}] }],
    [
      'variants in parsons',
      { ...buildLevel, mode: 'parsons', initialWorkspace: workspace, variants: [{}] },
    ],
    [
      'variants in predict',
      {
        ...buildLevel,
        mode: 'predict',
        par: undefined,
        solution: undefined,
        initialWorkspace: workspace,
        predict: {
          options: [
            { key: 'win', label: 'a' },
            { key: 'stop@1', label: 'b' },
            { key: 'stop@2', label: 'c' },
          ],
        },
        variants: [{}],
      },
    ],
    ['variants in creative', { ...buildLevel, mode: 'creative', variants: [{}] }],
    ['unknown mode', { ...buildLevel, mode: 'quiz' }],
    ['unknown stage', { ...buildLevel, stage: 'lesson' }],
    ['typo in a key', { ...buildLevel, objectve: 'x' }],
    ['build without par', { ...buildLevel, par: undefined }],
    ['build without solution', { ...buildLevel, solution: undefined }],
    ['parsons without initialWorkspace', { ...buildLevel, mode: 'parsons' }],
    ['predict without options', { ...buildLevel, mode: 'predict', initialWorkspace: workspace }],
    ['parEdits outside bughunt', { ...buildLevel, parEdits: 1 }],
    ['zero maxBlocks', { ...buildLevel, maxBlocks: 0 }],
    ['duplicate hint ids', { ...buildLevel, hints: [buildLevel.hints[0], buildLevel.hints[0]] }],
    [
      'solution block without id',
      {
        ...buildLevel,
        solution: { blocks: { languageVersion: 0, blocks: [{ type: 'cq_start' }] } },
      },
    ],
    ['lowercase feedback key', { ...buildLevel, feedback: { fell_in_hole: 'Ối!' } }],
    ['maxSteps above the cap', { ...buildLevel, limits: { maxSteps: 2_000_000 } }],
    ['maxActions above the cap', { ...buildLevel, limits: { maxActions: 20_000 } }],
    [
      'duplicate predict keys',
      {
        ...buildLevel,
        mode: 'predict',
        initialWorkspace: workspace,
        predict: {
          options: [
            { key: 'win', label: 'a' },
            { key: 'win', label: 'b' },
            { key: 'stop@1', label: 'c' },
          ],
        },
      },
    ],
  ])('rejects %s', (_name, value) => {
    expectInvalid(LevelSchema, value);
  });
});

describe('LessonSchema and LessonCardSchema', () => {
  const lesson = {
    id: 'w01-lesson',
    worldId: 'w01-lang-tre',
    title: 'Từng bước một',
    cards: [
      { type: 'say', pose: 'talk', text: 'Chào con!' },
      { type: 'demo', text: 'Xem Măng đi', kind: 'runner', config: {}, workspace },
      { type: 'quiz', text: 'Măng đi mấy bước?', options: ['1', '2'], correct: 1, explain: 'Hai' },
    ],
  };
  it('accepts a lesson with every card type', () => {
    expectValid(LessonSchema, lesson);
  });
  it.each([
    ['unknown card type', { type: 'video', text: 'x' }],
    ['unknown pose', { type: 'say', pose: 'dance', text: 'x' }],
    [
      'quiz answer out of range',
      { type: 'quiz', text: 'x', options: ['a', 'b'], correct: 2, explain: 'x' },
    ],
    ['demo with unknown kind', { type: 'demo', text: 'x', kind: 'racing', config: {}, workspace }],
  ])('rejects card with %s', (_name, value) => {
    expectInvalid(LessonCardSchema, value);
  });
  it('rejects a lesson without cards', () => {
    expectInvalid(LessonSchema, { ...lesson, cards: [] });
  });
});

describe('WorldSchema', () => {
  const world = {
    id: 'w01-lang-tre',
    order: 1,
    title: 'Làng Tre',
    emoji: '🎋',
    concept: 'Tuần tự',
    story: 'Măng về làng.',
    theme: { tileset: '/tiles/bamboo.png', palette: 'day' },
    lessonIds: ['w01-lesson'],
    levelIds: ['w01-l01', 'w01-boss'],
    unlock: { minStarRatio: 0.6 },
  };
  it('accepts a world', () => {
    expectValid(WorldSchema, world);
  });
  it.each([
    ['order 11', { ...world, order: 11 }],
    ['ratio above 1', { ...world, unlock: { minStarRatio: 1.5 } }],
    ['unknown palette', { ...world, theme: { tileset: 'x', palette: 'noon' } }],
    ['no levels', { ...world, levelIds: [] }],
  ])('rejects %s', (_name, value) => {
    expectInvalid(WorldSchema, value);
  });
});

describe('ShopItemSchema', () => {
  const item = {
    id: 'skin-astro-panda',
    kind: 'skin',
    title: 'Măng vũ trụ',
    price: 120,
    asset: '/x.png',
  };
  it('accepts an item and a shop file', () => {
    expectValid(ShopItemSchema, item);
    expectValid(ShopFileSchema, [item, { ...item, id: 'fx-confetti', kind: 'fx', price: 30 }]);
  });
  it.each([
    ['unknown kind', { ...item, kind: 'hat' }],
    ['free item', { ...item, price: 0 }],
    ['fractional price', { ...item, price: 1.5 }],
    ['missing asset', { ...item, asset: undefined }],
  ])('rejects %s', (_name, value) => {
    expectInvalid(ShopItemSchema, value);
  });
  it('rejects a shop file that is not an array', () => {
    expectInvalid(ShopFileSchema, { items: [item] });
  });
});

describe('BadgeSchema', () => {
  const badge = {
    id: 'bug-detective',
    title: 'Thám tử sửa lỗi',
    description: '5 màn săn lỗi đạt 2 sao',
    icon: '/icons/badge-bug.png',
    rule: { type: 'count-levels', minStars: 2, mode: 'bughunt', gte: 5 },
  };
  it('accepts every rule type', () => {
    expectValid(BadgesFileSchema, [
      badge,
      {
        ...badge,
        id: 'loop-master',
        rule: { type: 'count-levels', minStars: 3, withAnyBlock: ['cq_repeat'], gte: 10 },
      },
      { ...badge, id: 'fortune-teller', rule: { type: 'predict-first-try', gte: 5 } },
      { ...badge, id: 'world-1-clear', rule: { type: 'world-clear', worldId: 'w01-lang-tre' } },
      { ...badge, id: 'streak-7', rule: { type: 'streak', gte: 7 } },
      { ...badge, id: 'first-run', rule: { type: 'event', name: 'first-run' } },
    ]);
  });
  it.each([
    ['unknown rule type', { ...badge, rule: { type: 'coins', gte: 1 } }],
    ['minStars 4', { ...badge, rule: { ...badge.rule, minStars: 4 } }],
    ['unknown event', { ...badge, rule: { type: 'event', name: 'birthday' } }],
    ['missing rule', { ...badge, rule: undefined }],
  ])('rejects %s', (_name, value) => {
    expectInvalid(BadgeSchema, value);
  });
});

describe('FeedbackFileSchema', () => {
  it('accepts reasonCode sentences', () => {
    expectValid(FeedbackFileSchema, {
      FELL_IN_HOLE: 'Ối, hố! Thử khối nhảy nhé.',
      TIMEOUT: 'Măng chóng mặt rồi!',
    });
  });
  it.each([
    ['lowercase code', { fell_in_hole: 'x' }],
    ['empty sentence', { TIMEOUT: '' }],
    ['non-string sentence', { TIMEOUT: 1 }],
    ['an array', ['TIMEOUT']],
  ])('rejects %s', (_name, value) => {
    expectInvalid(FeedbackFileSchema, value);
  });
});
