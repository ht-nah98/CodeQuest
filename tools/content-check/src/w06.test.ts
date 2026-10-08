// World 6 "Thành Phố Robot" (curriculum.md §6.1): robot Bíp on a grid of line crossings. These
// tests pin what the levels teach: where Bíp stops in each lesson demo, the predict answers,
// each wrong parsons arrangement and bughunt fix, the questions needed on the multi-map levels,
// and that only the right jobs reach the target score on l12, l19 and the boss.
import { readFileSync } from 'node:fs';
import {
  LessonSchema,
  LevelSchema,
  WorldSchema,
  type LessonCard,
  type Level,
  type WorkspaceJson,
} from '@codequest/content-schema';
import { runLevel, type RunOutcome } from '@codequest/engine';
import { getGameKind, resolveLevelConfigs, robotlabRulesSchema } from '@codequest/games';
import {
  blockTypesOf,
  countWords,
  findParsonsArrangements,
  findShortestPrograms,
  toolboxTypes,
} from '@codequest/validator';
import { describe, expect, it } from 'vitest';

const CONTENT = new URL('../../../content/', import.meta.url);
const W06 = new URL('worlds/w06-thanh-pho-robot/', CONTENT);
const read = (path: string, base = W06): unknown =>
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

/** `f3` = tiến 3 ô, `L` / `R` = rẽ trái / phải, `G` = gắp, `T` = thả. */
type Ask = 'LAB' | 'LINE' | 'RED' | 'YELLOW';
type Item =
  | string
  | { r: number; b: Item[] }
  | { u: Ask; b: Item[] }
  | { if: Ask; then: Item[]; else?: Item[] };

const ACTIONS: Readonly<Record<string, string>> = {
  L: 'robot_turn_left',
  R: 'robot_turn_right',
  G: 'robot_grab',
  T: 'robot_release',
};

const sensor = (ask: Ask, id: string): Record<string, unknown> => {
  if (ask === 'LAB') return { type: 'robot_at_lab', id };
  if (ask === 'LINE') return { type: 'robot_line_ahead', id };
  return { type: 'robot_block_color', id, fields: { COLOR: ask } };
};

/** A program like ['f2', { r: 2, b: ['G', 'T'] }] under the start block. */
function program(items: Item[]): WorkspaceJson {
  let n = 0;
  const chain = (list: Item[]): Record<string, unknown> | undefined => {
    let head: Record<string, unknown> | undefined;
    for (const item of [...list].reverse()) {
      n += 1;
      const id = `b${String(n)}`;
      let block: Record<string, unknown>;
      if (typeof item === 'string') {
        block = item.startsWith('f')
          ? { type: 'robot_forward', id, fields: { N: Number(item.slice(1)) } }
          : { type: ACTIONS[item], id };
      } else if ('r' in item || 'u' in item) {
        const inputs: Record<string, unknown> = {};
        if ('u' in item) inputs['COND'] = { block: sensor(item.u, `${id}c`) };
        const body = chain(item.b);
        if (body !== undefined) inputs['DO'] = { block: body };
        block =
          'r' in item
            ? { type: 'cq_repeat', id, fields: { TIMES: item.r }, inputs }
            : { type: 'cq_repeat_until', id, inputs };
      } else {
        const inputs: Record<string, unknown> = { COND: { block: sensor(item.if, `${id}c`) } };
        const then = chain(item.then);
        if (then !== undefined) inputs['DO'] = { block: then };
        if (item.else !== undefined) {
          const otherwise = chain(item.else);
          if (otherwise !== undefined) inputs['ELSE'] = { block: otherwise };
        }
        block = { type: item.else === undefined ? 'cq_if' : 'cq_if_else', id, inputs };
      }
      if (head !== undefined) block['next'] = { block: head };
      head = block;
    }
    return head;
  };
  const start: { type: string; [key: string]: unknown } = { type: 'cq_start', id: 'start' };
  const body = chain(items);
  if (body !== undefined) start['next'] = { block: body };
  return { blocks: { languageVersion: 0, blocks: [start] } };
}

/** One run on one map (shared rules merged in), in mode `predict` so it carries an answer key. */
function runOn(config: unknown, workspace: WorkspaceJson): RunOutcome {
  const kind = getGameKind('robotlab');
  if (kind === undefined) throw new Error('no game kind robotlab');
  const probe: Level = {
    id: 'probe',
    worldId: world.id,
    stage: 'practice',
    kind: 'robotlab',
    mode: 'predict',
    title: 'probe',
    objective: 'probe',
    learningGoal: 'probe',
    toolbox: [],
    config,
    initialWorkspace: workspace,
    hints: [],
  };
  return runLevel({ kind, level: resolveLevelConfigs(probe, shared), workspace });
}

/** The answer key of a program on every map of a level (config first, then variants). */
const keysOf = (id: string, items: Item[] | WorkspaceJson): (string | undefined)[] => {
  const level = levelById(id);
  const workspace = Array.isArray(items) ? program(items) : items;
  return [level.config, ...(level.variants ?? [])].map(
    (config) => runOn(config, workspace).answerKey,
  );
};

/** A run of the real level (mode, maxBlocks and all), as the child plays it. */
function playReal(id: string, workspace: WorkspaceJson): RunOutcome {
  const kind = getGameKind('robotlab');
  if (kind === undefined) throw new Error('no game kind robotlab');
  return runLevel({ kind, level: resolveLevelConfigs(levelById(id), shared), workspace });
}

type DemoCard = Extract<LessonCard, { type: 'demo' }>;
const demosOf = (lessonId: string): RunOutcome[] => {
  const lesson = lessons.get(lessonId);
  if (lesson === undefined) throw new Error(`no lesson ${lessonId}`);
  return lesson.cards
    .filter((card): card is DemoCard => card.type === 'demo')
    .map((card) => runOn(card.config, card.workspace));
};
const demoKeys = (lessonId: string): (string | undefined)[] =>
  demosOf(lessonId).map((outcome) => outcome.answerKey);
const moves = (outcome: RunOutcome | undefined): number =>
  (outcome?.events ?? []).filter((event) => event.type === 'move').length;

const HANDS = [
  'robot_forward',
  'robot_turn_left',
  'robot_turn_right',
  'robot_grab',
  'robot_release',
];

/**
 * Whether any loop-free program can reach `target` with these points in the level's time limit.
 * Every action costs at least 1 s, so 30 blocks cover every action sequence of l12, the boss
 * and l19, and the search merges states, so it stays small.
 */
function canScore(
  id: string,
  mapIndex: number,
  points: Record<string, number>,
  target: number,
): ReturnType<typeof findShortestPrograms> {
  const level = levelById(id);
  const map = [level.config, ...(level.variants ?? [])][mapIndex] as Record<string, unknown>;
  const rules = (map['rules'] ?? {}) as Record<string, unknown>;
  const probe: Level = {
    id: `${id}-jobs`,
    worldId: world.id,
    stage: 'practice',
    kind: 'robotlab',
    mode: 'build',
    title: 'probe',
    objective: 'probe',
    learningGoal: 'probe',
    toolbox: HANDS,
    maxBlocks: 30,
    config: { ...map, goal: { type: 'score', target }, rules: { ...rules, points } },
    hints: [],
  };
  return findShortestPrograms(resolveLevelConfigs(probe, shared), { maxSize: 30 });
}
const NONE = { contain: 0, neutralize: 0, retrieve: 0, return: 0 };

describe('World 6 lessons', () => {
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

  it('robot copy calls code "lệnh", never "khối" in the Blockly sense', () => {
    const texts = [
      ...[...levels.values()].flatMap((level) => [
        level.title,
        level.objective,
        level.mission ?? '',
        level.thinkingHint ?? '',
        ...level.hints.map((hint) => hint.say),
        ...Object.values(level.feedback ?? {}),
      ]),
      ...[...lessons.values()].flatMap((lesson) =>
        lesson.cards.flatMap((card: LessonCard) => [
          card.text,
          ...(card.type === 'quiz' ? [card.explain, ...card.options] : []),
        ]),
      ),
      ...(world.chapters ?? []).flatMap((chapter) => [chapter.title, ...chapter.lines]),
    ];
    const codeKhoi = /khối (lệnh|lặp|mới|hỏi|nào|chưa ghép|chưa chạy)|(ghép|kéo|nối|nhiều) khối/i;
    expect(texts.filter((text) => codeKhoi.test(text))).toEqual([]);
  });

  // The shared lines of these reasons say "khối" for code (feedback.json); W6 overrides them.
  it('every level that can end with a code reason has its own "lệnh" line', () => {
    for (const level of levels.values()) {
      if (level.mode === 'predict') continue;
      const feedback = level.feedback ?? {};
      const needed = [
        'EMPTY_PROGRAM',
        ...(level.maxBlocks === undefined ? [] : ['TOO_MANY_BLOCKS']),
        ...(level.mode === 'parsons' ? ['LOOSE_BLOCKS', 'UNUSED_BLOCKS'] : []),
        ...(/cq_if|cq_repeat_until/.test(JSON.stringify([level.toolbox, level.initialWorkspace]))
          ? ['EMPTY_CONDITION']
          : []),
      ];
      for (const reason of needed) {
        expect(feedback[reason], `${level.id} ${reason}`).toMatch(/lệnh|câu hỏi/);
        expect(feedback[reason]).not.toMatch(/khối/);
      }
    }
  });

  it('a new command is introduced with "Lệnh mới! " and its tooltip word for word', () => {
    const tooltip = (type: string): string => {
      const spec = getGameKind('robotlab')?.blocks.find((block) => block.type === type);
      return String(spec?.json.tooltip);
    };
    const enter = (id: string, point: string): string | undefined =>
      levelById(id).hints.find((hint) => hint.point === point)?.say;
    expect(enter('w06-l01', 'toolbox:robot_forward')).toBe(
      `Lệnh mới! ${tooltip('robot_forward')}.`,
    );
    expect(enter('w06-l05', 'block:robot_grab')).toBe(`Lệnh mới! ${tooltip('robot_grab')}.`);
    expect(enter('w06-l06', 'toolbox:robot_release')).toBe(
      `Lệnh mới! ${tooltip('robot_release')}.`,
    );
    // The turns put the label first, so the child links the sentence to the command.
    for (const [type, label] of [
      ['robot_turn_left', 'Rẽ trái'],
      ['robot_turn_right', 'Rẽ phải'],
    ] as const) {
      const text = tooltip(type);
      expect(enter('w06-l03', `toolbox:${type}`)).toBe(
        `Lệnh mới! ${label}: ${text.charAt(0).toLowerCase()}${text.slice(1)}.`,
      );
    }
  });

  it('opening lesson: card 1 picks up the tale after World 5', () => {
    const [first] = lessons.get('w06-lesson')?.cards ?? [];
    expect(first?.text).toMatch(/^Về tới làng rồi!/);
  });

  it('opening lesson: tiến 2 stops on the 2nd crossing; Bíp runs every command past the lab', () => {
    expect(demoKeys('w06-lesson')).toEqual(['stop@1,2', 'crash:OFF_LINE@1,0', 'stop@1,2']);
  });

  it('opening lesson: rẽ trái turns on the spot (N → W) after one tiến', () => {
    const turn = demosOf('w06-lesson')[2];
    expect(moves(turn)).toBe(1);
    expect(turn?.events.filter((event) => event.type !== 'highlight').at(-1)).toMatchObject({
      type: 'turn',
      from: 'N',
      to: 'W',
    });
  });

  it.each([
    ['robot_forward', 'w06-lesson-tien'],
    ['robot_grab', 'w06-lesson-gap'],
    ['robot_release', 'w06-lesson-tha'],
    ['robot_at_lab', 'w06-lesson-ve-phong-chua'],
    ['robot_line_ahead', 'w06-lesson-co-line'],
    ['robot_block_color', 'w06-lesson-mau'],
  ])('%s: its lesson sits right before the level where it first appears', (type, lessonId) => {
    const first = [...levels.values()].find(
      (level) =>
        toolboxTypes(level).has(type) ||
        (level.mode === 'parsons' && blockTypesOf(level.initialWorkspace ?? program([])).has(type)),
    );
    expect(lessons.get(lessonId)?.beforeLevel).toBe(first?.id);
  });

  it('tiến: tiến 3 ô and three tiến 1 ô both stop on the 3rd crossing', () => {
    const [one, three] = demosOf('w06-lesson-tien');
    expect([one?.answerKey, three?.answerKey]).toEqual(['stop@1,2', 'stop@1,2']);
    expect([moves(one), moves(three)]).toEqual([3, 3]);
  });

  it('gắp: tiến 4 bumps the block one crossing before it; tiến 3 stops on it and grabs', () => {
    expect(demoKeys('w06-lesson-gap')).toEqual(['crash:HIT_BLOCK@1,3', 'stop@1,2']);
    const [, grab] = demosOf('w06-lesson-gap');
    expect(grab?.events.some((event) => event.type === 'grab')).toBe(true);
  });

  it('thả: on a crossing the block stays; in the lab pollution is retrieved', () => {
    expect(demoKeys('w06-lesson-tha')).toEqual(['stop@1,3', 'win']);
  });

  it('khoanh vùng: standing on the zone fences it; beside it leaves the job open', () => {
    expect(demoKeys('w06-lesson-khoanh-vung')).toEqual(['win', 'stop@1,2']);
    expect(demosOf('w06-lesson-khoanh-vung')[1]?.reasonCode).toBe('MISSIONS_LEFT');
  });

  it('trung hòa: red on the red station wins; on the yellow one WRONG_COLOR', () => {
    expect(demoKeys('w06-lesson-trung-hoa')).toEqual(['win', 'crash:WRONG_COLOR@1,0']);
  });

  it('đồng hồ: time runs out at the 2nd turn in the lab; retrieved 100 + home 40', () => {
    expect(demoKeys('w06-lesson-dong-ho')).toEqual(['score:140']);
    const [demo] = demosOf('w06-lesson-dong-ho');
    expect(demo?.events.filter((event) => event.type !== 'highlight').at(-1)).toMatchObject({
      type: 'timeUp',
      t: 7,
    });
  });

  it('đồng hồ: the seconds and points on the cards are the shared rules', () => {
    const { costs, points } = shared.robotlab;
    expect(costs.grab).toBe(costs.release);
    const texts = lessons.get('w06-lesson-dong-ho')?.cards.map((card) => card.text) ?? [];
    expect(texts).toContain(
      `Tiến 1 ô: ${String(costs.forward)} giây. Rẽ: ${String(costs.turn)} giây. ` +
        `Gắp, thả: ${String(costs.grab)} giây.`,
    );
    expect(texts).toContain(
      `Trung hòa ${String(points.neutralize)}, thu hồi ${String(points.retrieve)}, ` +
        `khoanh vùng ${String(points.contain)}, về ${String(points.return)}.`,
    );
  });

  it('đã về phòng?: walks a long road home, and runs 0 rounds when already in the lab', () => {
    expect(demoKeys('w06-lesson-ve-phong-chua')).toEqual(['win', 'win']);
    expect(moves(demosOf('w06-lesson-ve-phong-chua')[1])).toBe(0);
  });

  it('phía trước có line?: a crossing ahead → tiến; the edge or a house → Bíp stays', () => {
    expect(demoKeys('w06-lesson-co-line')).toEqual(['stop@1,1', 'stop@1,2', 'stop@1,1']);
    expect(moves(demosOf('w06-lesson-co-line')[2])).toBe(0);
  });

  it('khối ở chỗ Bíp màu?: holding red, "đỏ" is true and "vàng" is false', () => {
    expect(demoKeys('w06-lesson-mau')).toEqual(['stop@1,2', 'stop@1,3']);
  });
});

describe('World 6 predict levels: the engine agrees with the right card', () => {
  it.each([
    ['w06-l02', 'stop@1,1'], // the crossing Bíp stands on is not counted
    ['w06-l11', 'score:160'], // time is up at the station; the neutralized block still counts
    ['w06-l18', 'score:160'], // doing every job runs out of time away from the lab
  ])('%s → %s', (id, key) => {
    const level = levelById(id);
    if (level.initialWorkspace === undefined) throw new Error(`${id} has no program`);
    expect(keysOf(id, level.initialWorkspace)).toEqual([key]);
  });
});

describe('World 6 parsons: the wrong arrangements fail as the hints say', () => {
  // l10: "gắp" may swap with the two turns (turning does not move); every win still drops
  // the block inside the loop, which is the idea of the level.
  it.each([
    ['w06-l04', 1],
    ['w06-l05', 1],
    ['w06-l10', 3],
    ['w06-l15', 1],
  ] as const)('%s: %i arrangement(s) of the blocks win', { timeout: 120_000 }, (id, wins) => {
    expect(findParsonsArrangements(resolveLevelConfigs(levelById(id), shared))).toMatchObject({
      wins,
      complete: true,
    });
  });

  it('l04: swapping the two turns drives off the line', () => {
    expect(keysOf('w06-l04', ['f2', 'L', 'f2', 'R', 'f2'])).toEqual(['crash:OFF_LINE@2,2']);
  });

  it('l05: grabbing before stopping on the fence finds nothing', () => {
    expect(keysOf('w06-l05', ['G', 'f2', 'f2'])).toEqual(['crash:NOTHING_TO_GRAB@1,4']);
    expect(keysOf('w06-l05', ['f2', 'f2', 'G'])).toEqual(['crash:NOTHING_TO_GRAB@1,0']);
  });

  it('l10: "thả" outside the loop bumps the 2nd block holding the 1st (own HIT_BLOCK line)', () => {
    const body = ['f1', 'G', 'R', 'R', 'f1'];
    expect(keysOf('w06-l10', [{ r: 2, b: body }, 'T'])).toEqual(['crash:HIT_BLOCK@1,1']);
    expect(keysOf('w06-l10', [{ r: 2, b: [...body, 'T'] }])).toEqual(['win']);
    expect(levelById('w06-l10').feedback?.['HIT_BLOCK']).toBe(
      'Tay đang cầm khối. Thả xong mới tới khối khác.',
    );
  });

  it('l15: swapping the branches turns into a house', () => {
    const ask = (then: Item[], otherwise: Item[]): Item[] => [
      { u: 'LAB', b: [{ if: 'LINE', then, else: otherwise }] },
    ];
    expect(keysOf('w06-l15', ask(['L'], ['f1']))).toEqual(['crash:OFF_LINE@2,1']);
    expect(keysOf('w06-l15', ask(['f1'], ['L']))).toEqual(['win']);
  });
});

describe('World 6 bughunts: each fix does what the curriculum says (§6.1)', () => {
  const fenceTrip = ['f3', 'G', 'R', 'R', 'f2', 'T'];
  it('l08: the fence is placed but Bíp is not home; one more tiến wins', () => {
    expect(keysOf('w06-l08', fenceTrip)).toEqual(['stop@1,1']);
    expect(keysOf('w06-l08', [...fenceTrip, 'f1'])).toEqual(['win']);
    // Carrying the fence into the lab instead is the wrong fix.
    expect(keysOf('w06-l08', ['f3', 'G', 'R', 'R', 'f3', 'T'])).toEqual(['crash:WRONG_PLACE@1,0']);
  });

  it('l13: 160 points away from the lab; going home adds the missing 40', () => {
    const neutralize = ['f3', 'G', 'R', 'R', 'f1', 'T'];
    expect(keysOf('w06-l13', neutralize)).toEqual(['score:160']);
    expect(keysOf('w06-l13', [...neutralize, 'f2'])).toEqual(['score:200']);
  });

  it('l17: the colour question does not match its branch; asking yellow wins both maps', () => {
    const rest = ['f2', 'T', 'R', 'R', 'f2'];
    expect(keysOf('w06-l17', [{ if: 'RED', then: ['R'], else: ['L'] }, ...rest])).toEqual([
      'crash:WRONG_COLOR@1,4',
      'crash:WRONG_COLOR@1,0',
    ]);
    expect(keysOf('w06-l17', [{ if: 'YELLOW', then: ['R'], else: ['L'] }, ...rest])).toEqual([
      'win',
      'win',
    ]);
  });
});

describe('World 6 build levels', () => {
  it('l01: tiến 3 counts the crossing Bíp stands on and stops short', () => {
    expect(keysOf('w06-l01', ['f3'])).toEqual(['stop@1,1']);
  });

  it('l03: "rẽ là đi" stops one crossing short', () => {
    expect(keysOf('w06-l03', ['f2', 'R', 'f1'])).toEqual(['stop@1,1']);
  });

  it('l07: the fence beside the zone does not contain it', () => {
    expect(keysOf('w06-l07', ['f2', 'G', 'f1', 'T'])).toEqual(['stop@1,3']);
  });

  it('l09: the nearer yellow station is the wrong colour', () => {
    expect(keysOf('w06-l09', ['f3', 'G', 'f1', 'T'])).toEqual(['crash:WRONG_COLOR@1,4']);
  });

  it('l14: tiến 6 wins the long road and overshoots the short one', () => {
    expect(keysOf('w06-l14', ['f6'])).toEqual(['win', 'crash:OFF_LINE@1,0']);
    expect(keysOf('w06-l14', [{ u: 'LAB', b: ['f1'] }])).toEqual(['win', 'win']);
  });

  it('l16: a fixed route wins one colour only; asking the colour wins both', () => {
    const rest = ['f2', 'T', 'R', 'R', 'f2'];
    expect(keysOf('w06-l16', ['L', ...rest])).toEqual(['win', 'crash:WRONG_COLOR@1,0']);
    expect(keysOf('w06-l16', [{ if: 'RED', then: ['L'], else: ['R'] }, ...rest])).toEqual([
      'win',
      'win',
    ]);
  });

  it('no toolbox before the creative level offers đang gắp khối? (W7 introduces it)', () => {
    const offered = [...levels.values()].filter((level) =>
      toolboxTypes(level).has('robot_holding'),
    );
    expect(offered).toEqual([]);
  });

  it.each(['w06-l14', 'w06-l16'])(
    '%s: nothing wins within maxBlocks without a question',
    { timeout: 60_000 },
    (id) => {
      const level = levelById(id);
      const asks = new Set(['cq_if', 'cq_if_else', 'cq_repeat_until', 'robot_at_lab']);
      const plain: Level = {
        ...level,
        toolbox: level.toolbox.filter(
          (entry) =>
            !asks.has(typeof entry === 'string' ? entry : entry.type) &&
            (typeof entry === 'string' ? entry : entry.type) !== 'robot_block_color',
        ),
      };
      if (level.maxBlocks === undefined) throw new Error(`${id} has no maxBlocks`);
      expect(
        findShortestPrograms(resolveLevelConfigs(plain, shared), { maxSize: level.maxBlocks }),
      ).toMatchObject({ minBlocks: null, complete: true });
    },
  );
});

describe('World 6 score levels: only the right jobs reach the target', () => {
  it('l12: neutralize + contain never fit in 20 s, so 200 needs neutralize + return', () => {
    const both = canScore('w06-l12', 0, { ...NONE, contain: 1000, neutralize: 1000 }, 2000);
    expect(both).toMatchObject({ minBlocks: null, complete: true });
    expect(keysOf('w06-l12', ['L', 'f2', 'G', 'R', 'f1', 'T', 'R', 'R', 'f1', 'L', 'f1'])).toEqual([
      'score:45',
    ]);
  });

  it.each([0, 1])(
    'l19 map %i: retrieve + neutralize + contain never fit in 34 s',
    { timeout: 60_000 },
    (map) => {
      const all = canScore(
        'w06-l19',
        map,
        { ...NONE, contain: 1000, neutralize: 1000, retrieve: 1000 },
        3000,
      );
      expect(all).toMatchObject({ minBlocks: null, complete: true });
    },
  );

  it('boss: neutralize + retrieve + contain never fit in 30 s', { timeout: 60_000 }, () => {
    const all = canScore(
      'w06-boss',
      0,
      { ...NONE, contain: 1000, neutralize: 1000, retrieve: 1000 },
      3000,
    );
    expect(all).toMatchObject({ minBlocks: null, complete: true });
  });

  it('boss: neutralizing first is par 12; retrieving first scores 300 but is over the limit', () => {
    const solution = levelById('w06-boss').solution;
    if (solution === undefined) throw new Error('boss has no solution');
    expect(keysOf('w06-boss', solution)).toEqual(['score:300']);
    expect(levelById('w06-boss').par).toBe(12);
    const retrieveFirst = program([
      ...['R', 'R', 'f2', 'G', 'R', 'R', 'f2', 'T'],
      ...['f1', 'G', 'f1', 'T', 'R', 'R', 'f2'],
    ]);
    expect(keysOf('w06-boss', retrieveFirst)).toEqual(['score:300']);
    expect(playReal('w06-boss', retrieveFirst)).toMatchObject({
      result: 'error',
      reasonCode: 'TOO_MANY_BLOCKS',
    });
    expect(levelById('w06-boss').feedback?.['TOO_MANY_BLOCKS']).toMatch(/thứ tự/);
  });

  it('l19: neutralizing first wins both maps but is over the limit of 22', () => {
    const neutralizeFirst = program([
      ...['R', 'R', 'f1', 'G', 'R', 'R', 'f1'],
      {
        if: 'RED',
        then: ['L', 'f2', 'T', 'R', 'R', 'f2', 'L'],
        else: ['R', 'f2', 'T', 'R', 'R', 'f2', 'R'],
      },
      ...['f1', 'G', 'R', 'R', 'f1', 'T'],
    ]);
    expect(keysOf('w06-l19', neutralizeFirst)).toEqual(['score:300', 'score:300']);
    expect(playReal('w06-l19', neutralizeFirst)).toMatchObject({
      result: 'error',
      reasonCode: 'TOO_MANY_BLOCKS',
    });
    expect(levelById('w06-l19').feedback?.['TOO_MANY_BLOCKS']).toMatch(/thứ tự/);
  });

  it('l19: the hand solution scores 300 on both colour maps', () => {
    const solution = levelById('w06-l19').solution;
    if (solution === undefined) throw new Error('l19 has no solution');
    expect(keysOf('w06-l19', solution)).toEqual(['score:300', 'score:300']);
  });
});
