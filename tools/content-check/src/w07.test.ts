// World 7 "Chợ Đếm Số" (curriculum.md §6.2): variables as named boxes ("hộp", ADR-0022). These
// tests pin what the levels teach: what each lesson demo leaves in the box, the predict answers,
// the one real fix of each bughunt, that a box is needed where it steers the program (authoring
// rule R4), that each new block is introduced with its tooltip, and the "khối" / "lệnh" copy.
import { readFileSync } from 'node:fs';
import {
  LessonSchema,
  LevelSchema,
  WorldSchema,
  type LessonCard,
  type Level,
  type WorkspaceJson,
} from '@codequest/content-schema';
import { runLevel, VARIABLE_BLOCKS, type RunOutcome } from '@codequest/engine';
import { getGameKind, resolveLevelConfigs, robotlabRulesSchema } from '@codequest/games';
import {
  blockTypesOf,
  countWords,
  findParsonsArrangements,
  findShortestPrograms,
  toolboxTypes,
  withoutVariables,
} from '@codequest/validator';
import { describe, expect, it } from 'vitest';

const CONTENT = new URL('../../../content/', import.meta.url);
const W07 = new URL('worlds/w07-cho-dem-so/', CONTENT);
const read = (path: string, base = W07): unknown =>
  JSON.parse(readFileSync(new URL(path, base), 'utf8'));

const shared = { robotlab: robotlabRulesSchema.parse(read('shared/robotlab.json', CONTENT)) };
const world = WorldSchema.parse(read('world.json'));
const lessons = new Map(
  world.lessonIds.map((id) => [id, LessonSchema.parse(read(`lessons/${id}.json`))] as const),
);
const levels = new Map(
  world.levelIds.map((id) => [id, LevelSchema.parse(read(`levels/${id}.json`))] as const),
);
const levelById = (id: string): Level => {
  const level = levels.get(id);
  if (level === undefined) throw new Error(`no level ${id}`);
  return level;
};

/**
 * Programs written short. Maze: `F` tiến, `L` / `R` rẽ. Robot: `f1` tiến 1 ô, `L` / `R`, `G` gắp,
 * `T` thả. Boxes: `{ set: 'bamboo', n: 0 }`, `{ add: 'bamboo' }`, loops `{ rep: 3, b }`,
 * `{ rv: 'steps', b }` (lặp [hộp] lần), `{ until: ask, b }`, and `{ if: ask, then, else }`.
 */
type Ask =
  | 'BAMBOO'
  | 'GOAL'
  | 'RED'
  | 'YELLOW'
  | 'AHEAD'
  | 'RIGHT_PATH'
  | ['GT' | 'LT' | 'EQ', string, number];
type Item =
  | string
  | { set: string; n: number }
  | { add: string }
  | { rep: number; b: Item[] }
  | { rv: string; b: Item[] }
  | { until: Ask; b: Item[] }
  | { if: Ask; then: Item[]; else?: Item[] };
type Kind = 'maze' | 'robotlab';

const sensor = (ask: Ask, id: string): Record<string, unknown> => {
  if (Array.isArray(ask)) {
    const [op, box, n] = ask;
    return { type: 'cq_var_compare', id, fields: { VAR: box, OP: op, NUM: n } };
  }
  if (ask === 'BAMBOO') return { type: 'maze_bamboo_ahead', id };
  if (ask === 'GOAL') return { type: 'maze_at_goal', id };
  if (ask === 'AHEAD') return { type: 'maze_is_path', id, fields: { DIR: 'AHEAD' } };
  if (ask === 'RIGHT_PATH') return { type: 'maze_is_path', id, fields: { DIR: 'RIGHT' } };
  return { type: 'robot_block_color', id, fields: { COLOR: ask } };
};

const MAZE_ACTIONS: Readonly<Record<string, string>> = {
  F: 'maze_forward',
  L: 'maze_turn_left',
  R: 'maze_turn_right',
};
const ROBOT_ACTIONS: Readonly<Record<string, string>> = {
  L: 'robot_turn_left',
  R: 'robot_turn_right',
  G: 'robot_grab',
  T: 'robot_release',
};

function program(kind: Kind, items: Item[]): WorkspaceJson {
  let n = 0;
  const one = (item: Item): Record<string, unknown> => {
    n += 1;
    const id = `b${String(n)}`;
    if (typeof item === 'string') {
      if (kind === 'robotlab' && item.startsWith('f'))
        return { type: 'robot_forward', id, fields: { N: Number(item.slice(1)) } };
      const type = (kind === 'maze' ? MAZE_ACTIONS : ROBOT_ACTIONS)[item];
      if (type === undefined) throw new Error(`unknown item ${item}`);
      return { type, id };
    }
    if ('set' in item) return { type: 'cq_var_set', id, fields: { VAR: item.set, NUM: item.n } };
    if ('add' in item) return { type: 'cq_var_add', id, fields: { VAR: item.add, NUM: 1 } };
    const inputs: Record<string, unknown> = {};
    if ('if' in item) {
      inputs['COND'] = { block: sensor(item.if, `${id}c`) };
      const then = chain(item.then);
      if (then !== undefined) inputs['DO'] = { block: then };
      const otherwise = item.else === undefined ? undefined : chain(item.else);
      if (otherwise !== undefined) inputs['ELSE'] = { block: otherwise };
      return { type: item.else === undefined ? 'cq_if' : 'cq_if_else', id, inputs };
    }
    if ('until' in item) inputs['COND'] = { block: sensor(item.until, `${id}c`) };
    const body = chain(item.b);
    if (body !== undefined) inputs['DO'] = { block: body };
    if ('rep' in item) return { type: 'cq_repeat', id, fields: { TIMES: item.rep }, inputs };
    if ('rv' in item) return { type: 'cq_repeat_var', id, fields: { VAR: item.rv }, inputs };
    return { type: 'cq_repeat_until', id, inputs };
  };
  function chain(list: Item[]): Record<string, unknown> | undefined {
    const blocks = list.map(one);
    blocks.forEach((block, i) => {
      const next = blocks[i + 1];
      if (next !== undefined) block['next'] = { block: next };
    });
    return blocks[0];
  }
  const start: { type: string; [key: string]: unknown } = { type: 'cq_start', id: 'start' };
  const body = chain(items);
  if (body !== undefined) start['next'] = { block: body };
  return { blocks: { languageVersion: 0, blocks: [start] } };
}

/**
 * The answer key (`stop@1,4#bamboo=3`) of a program on every map of a level: each map run alone
 * in mode `predict`, with that map's box starts, so the key carries the boxes.
 */
function keysOf(id: string, items: Item[] | WorkspaceJson): (string | undefined)[] {
  const level = levelById(id);
  const kind = getGameKind(level.kind);
  if (kind === undefined) throw new Error(`no game kind ${level.kind}`);
  const workspace = Array.isArray(items) ? program(level.kind as Kind, items) : items;
  return [level.config, ...(level.variants ?? [])].map((config, map) => {
    const probe: Level = {
      id: `${id}-map${String(map)}`,
      worldId: world.id,
      stage: 'practice',
      kind: level.kind,
      mode: 'predict',
      title: 'probe',
      objective: 'probe',
      learningGoal: 'probe',
      toolbox: [],
      config,
      initialWorkspace: workspace,
      hints: [],
      ...(level.variables === undefined
        ? {}
        : {
            variables: level.variables.map((box) =>
              box.start === undefined ? box : { ...box, start: [box.start[map] ?? 0] },
            ),
          }),
    };
    return runLevel({ kind, level: resolveLevelConfigs(probe, shared), workspace }).answerKey;
  });
}

/** A run of the real level (every map, countGoal, maxBlocks), as the child plays it. */
function play(id: string, items: Item[] | WorkspaceJson): RunOutcome {
  const level = levelById(id);
  const kind = getGameKind(level.kind);
  if (kind === undefined) throw new Error(`no game kind ${level.kind}`);
  const workspace = Array.isArray(items) ? program(level.kind as Kind, items) : items;
  return runLevel({ kind, level: resolveLevelConfigs(level, shared), workspace });
}
const result = (outcome: RunOutcome): string =>
  `${outcome.result}${outcome.reasonCode === null ? '' : `:${outcome.reasonCode}`}`;

type DemoCard = Extract<LessonCard, { type: 'demo' }>;
function demosOf(lessonId: string): RunOutcome[] {
  const lesson = lessons.get(lessonId);
  if (lesson === undefined) throw new Error(`no lesson ${lessonId}`);
  return lesson.cards
    .filter((card): card is DemoCard => card.type === 'demo')
    .map((card) => {
      const kind = getGameKind(card.kind);
      if (kind === undefined) throw new Error(`no game kind ${card.kind}`);
      const probe: Level = {
        id: `${lessonId}-demo`,
        worldId: world.id,
        stage: 'practice',
        kind: card.kind,
        mode: 'predict',
        title: 'demo',
        objective: 'demo',
        learningGoal: 'demo',
        toolbox: [],
        config: card.config,
        initialWorkspace: card.workspace,
        hints: [],
        ...(card.variables === undefined ? {} : { variables: card.variables }),
      };
      return runLevel({
        kind,
        level: resolveLevelConfigs(probe, shared),
        workspace: card.workspace,
      });
    });
}
const demoKeys = (lessonId: string): (string | undefined)[] =>
  demosOf(lessonId).map((outcome) => outcome.answerKey);
const count = (outcome: RunOutcome | undefined, type: string): number =>
  (outcome?.events ?? []).filter((event) => event.type === type).length;

const tooltipOf = (type: string): string => {
  const specs = [...VARIABLE_BLOCKS, ...(getGameKind('maze')?.blocks ?? [])];
  return String(specs.find((spec) => spec.type === type)?.json.tooltip);
};

/** Kid copy of the world: level texts, hints, feedback, lesson cards and story chapters. */
const kidCopy = (): string[] => [
  ...[...levels.values()].flatMap((level) => [
    level.title,
    level.objective,
    level.mission ?? '',
    level.thinkingHint ?? '',
    ...level.hints.map((hint) => hint.say),
    ...Object.values(level.feedback ?? {}),
    ...(level.predict?.options.map((option) => option.label) ?? []),
  ]),
  ...[...lessons.values()].flatMap((lesson) =>
    lesson.cards.flatMap((card: LessonCard) => [
      card.text,
      ...(card.type === 'quiz' ? [card.explain, ...card.options] : []),
    ]),
  ),
  ...(world.chapters ?? []).flatMap((chapter) => [chapter.title, ...chapter.lines]),
];

/** The new blocks of W7, the level that first offers each, and its block lesson. */
const NEW_BLOCKS = [
  ['cq_var_set', 'w07-l01', 'w07-lesson-dat-tang'],
  ['cq_var_add', 'w07-l01', 'w07-lesson-dat-tang'],
  ['maze_bamboo_ahead', 'w07-l03', 'w07-lesson-mang-truoc'],
  ['cq_repeat_var', 'w07-l04', 'w07-lesson-lap-hop'],
  ['cq_var_compare', 'w07-l08', 'w07-lesson-so-sanh'],
] as const;

describe('World 7 story and copy', () => {
  it('picks up the tale where World 6 ended (the market fair)', () => {
    const w06 = WorldSchema.parse(read('worlds/w06-thanh-pho-robot/world.json', CONTENT));
    expect(w06.chapters?.at(-1)?.lines.join(' ')).toMatch(/chợ/);
    expect(world.chapters?.[0]?.lines[0]).toMatch(/^Chợ phiên mở rồi!/);
    expect(lessons.get('w07-lesson')?.cards[0]?.text).toMatch(/^Chợ phiên mở rồi!/);
  });

  it('the opening lesson calls a variable "chiếc hộp có tên"', () => {
    const texts = lessons.get('w07-lesson')?.cards.map((card) => card.text) ?? [];
    expect(texts.some((text) => text.includes('Biến là chiếc hộp có tên'))).toBe(true);
  });

  it('cards are short: at most 6 cards (block lessons 5) of at most 12 words each', () => {
    for (const lesson of lessons.values()) {
      expect(lesson.cards.length).toBeLessThanOrEqual(lesson.beforeLevel === undefined ? 6 : 5);
      const texts = lesson.cards.flatMap((card: LessonCard) => [
        card.text,
        ...(card.type === 'quiz' ? [card.explain, ...card.options] : []),
      ]);
      expect(texts.filter((text) => countWords(text) > 12)).toEqual([]);
    }
  });

  // Coach (08/10/2026): "khối" in the UI, "lệnh" in tooltips. W7 copy calls a code block
  // "khối"; "lệnh" appears only inside a quoted tooltip. No W6-style "lệnh" overrides.
  it('kid copy says "khối" for code; "lệnh" only inside a quoted tooltip', () => {
    const tooltips = [...VARIABLE_BLOCKS.map((spec) => String(spec.json.tooltip))].map((text) =>
      text.toLowerCase(),
    );
    const quotes = (text: string): boolean => {
      const said = text
        .toLowerCase()
        .replace(/^khối mới! /, '')
        .replace(/\.$/, '');
      return tooltips.some((tooltip) => tooltip.startsWith(said));
    };
    const outsideTooltips = kidCopy()
      .filter((text) => !quotes(text))
      .map((text) =>
        tooltips.reduce((rest, tooltip) => rest.split(tooltip).join(' '), text.toLowerCase()),
      );
    expect(outsideTooltips.filter((text) => /\blệnh\b/u.test(text))).toEqual([]);
    for (const level of levels.values()) {
      for (const line of Object.values(level.feedback ?? {})) expect(line).not.toMatch(/lệnh/);
    }
  });

  it.each(NEW_BLOCKS)(
    '%s: the enter hint of %s is its tooltip (or the start of it)',
    (type, levelId) => {
      const level = levelById(levelId);
      const point = `${level.mode === 'parsons' ? 'block' : 'toolbox'}:${type}`;
      const hint = level.hints.find((rule) => rule.point === point);
      expect(hint?.when).toMatchObject({ trigger: 'enter' });
      const said = (hint?.say ?? '').replace(/^Khối mới! /, '').replace(/\.$/, '');
      expect(said.length).toBeGreaterThan(20);
      expect(tooltipOf(type).startsWith(said)).toBe(true);
    },
  );

  it.each(NEW_BLOCKS)(
    '%s: first offered in %s, its lesson %s sits right before',
    (type, id, lessonId) => {
      const first = [...levels.values()].find(
        (level) =>
          toolboxTypes(level).has(type) ||
          (level.mode === 'parsons' &&
            blockTypesOf(level.initialWorkspace ?? program('maze', [])).has(type)),
      );
      expect(first?.id).toBe(id);
      expect(lessons.get(lessonId)?.beforeLevel).toBe(id);
    },
  );
});

describe('World 7 lessons: what each demo leaves in the box', () => {
  it('opening: picking up two shoots and adding after each → 2', () => {
    expect(demoKeys('w07-lesson')).toEqual(['stop@1,3#bamboo=2']);
  });

  it('đặt / tăng: setting 5 to 0 loses the 5 and Măng stays; adding 1 to 2 → 3', () => {
    expect(demoKeys('w07-lesson-dat-tang')).toEqual(['stop@1,1#bamboo=0', 'stop@1,2#bamboo=3']);
    expect(count(demosOf('w07-lesson-dat-tang')[0], 'move')).toBe(0);
  });

  it('phía trước có măng?: ✔ adds and Măng stays; ✘ keeps the box', () => {
    expect(demoKeys('w07-lesson-mang-truoc')).toEqual(['stop@1,1#bamboo=1', 'stop@1,1#bamboo=0']);
    for (const demo of demosOf('w07-lesson-mang-truoc')) expect(count(demo, 'move')).toBe(0);
  });

  it('lặp hộp lần: the same program walks 3 cells with 3 in the box, 1 with 1', () => {
    expect(demoKeys('w07-lesson-lap-hop')).toEqual(['stop@1,4#steps=3', 'stop@1,2#steps=1']);
  });

  it('hai hộp: the step box sets the rounds, the shoot box counts (2 → 2, 4 → 3)', () => {
    expect(demoKeys('w07-lesson-hai-hop')).toEqual([
      'stop@1,3#bamboo=2#steps=2',
      'stop@1,5#bamboo=3#steps=4',
    ]);
  });

  it('so sánh: 4 > 2 turns left; 1 > 2 does not', () => {
    const [big, small] = demosOf('w07-lesson-so-sanh');
    expect([count(big, 'turn'), count(small, 'turn')]).toEqual([1, 0]);
  });
});

describe('World 7 predict levels: the engine agrees with the right card', () => {
  it.each([
    ['w07-l02', 'stop@1,4#bamboo=4'], // 1 in the box, plus 1 three times
    ['w07-l07', 'stop@1,5#bamboo=0#steps=4'], // the box does not count by itself
    ['w07-l12', 'stop@1,3#steps=4'], // lặp [hộp] lần reads the box once: 2 rounds
    ['w07-l18', 'win#bamboo=3'], // the shoot off Măng's path is never asked about
  ])('%s → %s', (id, key) => {
    const level = levelById(id);
    if (level.initialWorkspace === undefined) throw new Error(`${id} has no program`);
    expect(keysOf(id, level.initialWorkspace)).toEqual([key]);
    expect(level.predict?.options.filter((option) => option.key === key)).toHaveLength(1);
  });

  it('l12: reading the box every round would walk into the wall (the wrong card)', () => {
    const options = levelById('w07-l12').predict?.options.map((option) => option.key);
    expect(options).toContain('crash:HIT_WALL@1,6#steps=7');
  });
});

describe('World 7 parsons', () => {
  it(
    'l01: every winning arrangement keeps the box; forgetting or looping đặt 0 fails',
    { timeout: 60_000 },
    () => {
      // 5 wins: tiến / tăng may swap inside the loop (A1 ends the run on the stall).
      expect(
        findParsonsArrangements(resolveLevelConfigs(levelById('w07-l01'), shared)),
      ).toMatchObject({ wins: 5, complete: true });
      const add = { add: 'bamboo' };
      const reset = { set: 'bamboo', n: 0 };
      // Old box: 3 left from yesterday.
      expect(result(play('w07-l01', [{ rep: 2, b: ['F', add] }, 'F']))).toBe(
        'incomplete:WRONG_COUNT',
      );
      expect(result(play('w07-l01', [{ rep: 2, b: ['F', add, reset] }, 'F']))).toBe(
        'incomplete:WRONG_COUNT',
      );
      expect(result(play('w07-l01', [reset, { rep: 2, b: ['F', add] }, 'F']))).toBe('success');
    },
  );

  it('l09: asking after stepping stops one cell early and turns into a wall', () => {
    const add = { add: 'bamboo' };
    const ask: Item = { if: 'BAMBOO', then: [add] };
    const until = (body: Item[]): Item[] => [{ until: ['EQ', 'bamboo', 3], b: body }, 'R', 'F'];
    expect(keysOf('w07-l09', until([ask, 'F']))).toEqual(['win#bamboo=3']);
    expect(keysOf('w07-l09', until(['F', ask]))).toEqual(['crash:HIT_WALL@1,5#bamboo=3']);
  });

  it('l14: swapping the two boxes counts the shoots as empty cells', () => {
    const body = (yes: string, no: string): Item[] => [
      { rep: 5, b: [{ if: 'BAMBOO', then: [{ add: yes }], else: [{ add: no }] }, 'F'] },
      'R',
      'F',
    ];
    expect(result(play('w07-l14', body('bamboo', 'empty')))).toBe('success');
    expect(result(play('w07-l14', body('empty', 'bamboo')))).toBe('incomplete:WRONG_COUNT');
  });
});

describe('World 7 bughunts: one real fix each', () => {
  const add = { add: 'bamboo' };
  const ask: Item = { if: 'BAMBOO', then: [add] };
  const count = (times: number): Item => ({ rep: times, b: [ask, 'F'] });
  // The 2-D roads of l05 and l10 (difficulty pass E): the given program already finds the way.
  const wallTurn: Item = { if: 'AHEAD', then: ['F'], else: ['R'] };
  const rightTurn: Item = { if: 'RIGHT_PATH', then: ['R'] };

  it('l05: đặt 0 inside the loop empties the box; moving it out wins every map', () => {
    const level = levelById('w07-l05');
    if (level.initialWorkspace === undefined) throw new Error('l05 has no program');
    const reset: Item = { set: 'bamboo', n: 0 };
    expect(result(play('w07-l05', level.initialWorkspace))).toBe('incomplete:WRONG_COUNT');
    expect(result(play('w07-l05', [reset, { rep: 15, b: [rightTurn, ask, 'F'] }]))).toBe('success');
    // Deleting it instead keeps yesterday's shoots (every map starts with some).
    expect(level.variables?.[0]?.start?.every((start) => start > 0)).toBe(true);
    expect(result(play('w07-l05', [{ rep: 15, b: [rightTurn, ask, 'F'] }]))).toBe(
      'incomplete:WRONG_COUNT',
    );
    // Emptying the box at each turn loses the shoots before the last turn.
    const atTurns: Item = { if: 'RIGHT_PATH', then: ['R', reset] };
    expect(result(play('w07-l05', [{ rep: 15, b: [atTurns, ask, 'F'] }]))).toBe(
      'incomplete:WRONG_COUNT',
    );
  });

  it('l05: turning only at walls walks into a dead end ahead on every map', () => {
    const reset: Item = { set: 'bamboo', n: 0 };
    const maps = play('w07-l05', [reset, { rep: 20, b: [ask, wallTurn] }]).maps ?? [];
    expect(maps.map((map) => map.result)).toEqual(['incomplete', 'incomplete', 'incomplete']);
  });

  it('l10: tăng outside nếu counts rounds (turns too); inside nếu it counts shoots', () => {
    const level = levelById('w07-l10');
    if (level.initialWorkspace === undefined) throw new Error('l10 has no program');
    expect(keysOf('w07-l10', level.initialWorkspace)).toEqual(['win#bamboo=17', 'win#bamboo=11']);
    expect(result(play('w07-l10', [{ rep: 20, b: [ask, wallTurn] }]))).toBe('success');
  });

  it('l15: the yellow question adds to the red box; naming the yellow box fixes it', () => {
    const level = levelById('w07-l15');
    if (level.initialWorkspace === undefined) throw new Error('l15 has no program');
    expect(result(play('w07-l15', level.initialWorkspace))).toBe('incomplete:WRONG_COUNT');
    const fixed: Item[] = [{ rep: 4, b: ['f1', { if: 'YELLOW', then: [{ add: 'yellow' }] }] }];
    expect(result(play('w07-l15', fixed))).toBe('success');
  });

  it('l19: both bugs must go; fixing one leaves a map wrong', () => {
    const choose = (op: 'GT' | 'LT'): Item => ({ if: [op, 'bamboo', 2], then: ['L'], else: ['R'] });
    const reset: Item = { set: 'bamboo', n: 0 };
    const inside: Item = { rv: 'steps', b: [reset, ask, 'F'] };
    const counted: Item = { rv: 'steps', b: [ask, 'F'] };
    expect(result(play('w07-l19', [inside, choose('LT'), 'F']))).toBe('crash:HIT_WALL');
    expect(result(play('w07-l19', [inside, choose('GT'), 'F']))).toBe('crash:HIT_WALL');
    expect(result(play('w07-l19', [reset, counted, choose('LT'), 'F']))).toBe('crash:HIT_WALL');
    expect(result(play('w07-l19', [reset, counted, choose('GT'), 'F']))).toBe('success');
    // A fixed count stops at the wrong side road on some map.
    for (const times of [2, 3, 4])
      expect(result(play('w07-l19', [reset, count(times), choose('GT'), 'F']))).not.toBe('success');
  });
});

describe('World 7 build levels', () => {
  it('l03: asking after stepping misses the first shoot on map 2', () => {
    const add = { add: 'bamboo' };
    expect(keysOf('w07-l03', [{ rep: 6, b: [{ if: 'BAMBOO', then: [add] }, 'F'] }])).toEqual([
      'win#bamboo=2',
      'win#bamboo=4',
    ]);
    expect(keysOf('w07-l03', [{ rep: 6, b: ['F', { if: 'BAMBOO', then: [add] }] }])).toEqual([
      'win#bamboo=2',
      'win#bamboo=3',
    ]);
  });

  it('l06: the box keeps its old number; two trips add 2 on both maps', () => {
    const solution = levelById('w07-l06').solution;
    if (solution === undefined) throw new Error('l06 has no solution');
    expect(keysOf('w07-l06', solution)).toEqual(['win#blocks=2', 'win#blocks=5']);
  });

  it('l13: tiến 4 runs through the blocks; counting every block is wrong', () => {
    expect(result(play('w07-l13', ['f4']))).toBe('crash:HIT_BLOCK');
    expect(result(play('w07-l13', [{ rep: 4, b: ['f1', { add: 'red' }] }]))).toBe(
      'incomplete:WRONG_COUNT',
    );
    const red: Item[] = [{ rep: 4, b: ['f1', { if: 'RED', then: [{ add: 'red' }] }] }];
    expect(keysOf('w07-l13', red)).toEqual(['score:40#red=2', 'score:40#red=1']);
  });

  it('l17: count the way out, walk the box back home', () => {
    const solution = levelById('w07-l17').solution;
    if (solution === undefined) throw new Error('l17 has no solution');
    expect(keysOf('w07-l17', solution)).toEqual(['win#steps=3', 'win#steps=5']);
  });

  it('boss: the step box picks the column, the counted shoots are the steps to each house', () => {
    const solution = levelById('w07-boss').solution;
    if (solution === undefined) throw new Error('boss has no solution');
    expect(keysOf('w07-boss', solution)).toEqual([
      'win#bamboo=2#steps=3',
      'win#bamboo=4#steps=5',
      'win#bamboo=3#steps=5',
    ]);
  });

  // Two boxes (w07-lesson-hai-hop): the step box says how far to count; the side roads are
  // the real road on one map and a dead end on another, so no fixed count wins.
  const add = { add: 'bamboo' };
  const ask: Item = { if: 'BAMBOO', then: [add] };
  it('l16: the step box stops the count at the right side road; fixed counts fail', () => {
    const choose: Item = { if: ['GT', 'bamboo', 2], then: ['L'], else: ['R'] };
    expect(result(play('w07-l16', [{ rv: 'steps', b: [ask, 'F'] }, choose, 'F']))).toBe('success');
    for (const times of [3, 4, 5, 6])
      expect(result(play('w07-l16', [{ rep: times, b: [ask, 'F'] }, choose, 'F']))).not.toBe(
        'success',
      );
  });

  it('boss: turning the wrong way at the house walks into a dead end', () => {
    const deliver = (turn: string): Item[] => [
      { rv: 'steps', b: [ask, 'F'] },
      'R',
      { rv: 'bamboo', b: ['F'] },
      turn,
      'F',
    ];
    expect(result(play('w07-boss', deliver('L')))).toBe('success');
    expect(result(play('w07-boss', deliver('R')))).toBe('incomplete:NOT_AT_GOAL');
  });

  it('counting levels have maps that need different counts (R4, counting only)', () => {
    for (const level of levels.values()) {
      if (level.countGoal === undefined || level.mode === 'parsons') continue;
      if (level.mode !== 'build' && level.mode !== 'bughunt') continue;
      expect(new Set(level.countGoal.equals).size, level.id).toBeGreaterThan(1);
    }
  });
});

describe('World 7 R4: where the box steers the program, nothing wins without it', () => {
  // A box-free (or count-free) program can look at one cell and pick the turn: the step box
  // alone finds the side road. On l16 and l19 no cell (road or dead end) holds a shoot on every
  // "up" map and on no "down" map (or the reverse).
  it.each(['w07-l16', 'w07-l19'])('%s: no single cell tells "up" maps from "down" maps', (id) => {
    const level = levelById(id);
    const maps = [level.config, ...(level.variants ?? [])].map(
      (config) => (config as { map: string[] }).map,
    );
    const up = (map: string[]): boolean => map[1]?.includes('G') === true;
    const rows = Math.max(...maps.map((map) => map.length));
    const width = Math.max(...maps.map((map) => map[0]?.length ?? 0));
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < width; col++) {
        const shoot = (map: string[]): boolean => map[row]?.[col] === 'b';
        const ups = new Set(maps.filter(up).map(shoot));
        const downs = new Set(maps.filter((map) => !up(map)).map(shoot));
        const separates = ups.size === 1 && downs.size === 1 && [...ups][0] !== [...downs][0];
        expect(separates, `${id} cell ${String(row)},${String(col)}`).toBe(false);
      }
    }
  });

  // Up to maxBlocks (l19 has none: to par 11). Repeat counts 2–6 for the par-10+ maze levels:
  // their corridors are at most 7 cells, and with every count 2–20 the search hits its
  // catalogue cap before size 10 (curriculum.md §6.2).
  const SHORT = [2, 3, 4, 5, 6];
  it.each([
    ['w07-l04', undefined, undefined],
    ['w07-l08', undefined, undefined],
    ['w07-l11', undefined, undefined],
    ['w07-l17', undefined, undefined],
    ['w07-l16', SHORT, undefined],
    ['w07-boss', SHORT, undefined],
    ['w07-l19', SHORT, 11],
  ] as const)('%s', { timeout: 120_000 }, (id, repeatTimes, maxSize) => {
    const level = levelById(id);
    const steering = toolboxTypes(level);
    expect(steering.has('cq_repeat_var') || steering.has('cq_var_compare')).toBe(true);
    const plain = resolveLevelConfigs(withoutVariables(level), shared);
    const limit = maxSize ?? level.maxBlocks ?? level.par;
    if (limit === undefined) throw new Error(`${id} has no par`);
    const search = findShortestPrograms(plain, {
      maxSize: limit,
      maxWork: 400_000_000,
      ...(repeatTimes === undefined ? {} : { repeatTimes }),
    });
    expect(search).toMatchObject({ minBlocks: null, complete: true });
  });
});
