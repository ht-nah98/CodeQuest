// World 5 "Sông Chờ Đợi" (curriculum.md §5.3): wait until something is true. These tests pin what
// the levels teach: the lesson demos end where the cards say (including the dizzy TIMEOUT demo),
// the predict levels' answers, each bughunt fix shows the next step, a question is needed to win
// the build levels, the star goal of l14 is a real trade-off, and the boss escort picks up Gà con.
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
import { getGameKind } from '@codequest/games';
import { countWords, findParsonsArrangements, findShortestPrograms } from '@codequest/validator';
import { describe, expect, it } from 'vitest';
import { mazeJunctions } from './difficulty';

const W05 = new URL('../../../content/worlds/w05-song-cho-doi/', import.meta.url);
const read = (path: string): unknown => JSON.parse(readFileSync(new URL(path, W05), 'utf8'));

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

const TYPES: Readonly<Record<string, string>> = {
  w: 'runner_walk',
  j: 'runner_jump',
  k: 'runner_kick',
  f: 'maze_forward',
  L: 'maze_turn_left',
  R: 'maze_turn_right',
};
/** Runner `phía trước có …`, maze `có đường …`, or `đã tới đích?` (`MGOAL`) / `đã tới nơi?` (`RGOAL`). */
type Ask = 'HOLE' | 'CLEAR' | 'CRATE' | 'BRANCH' | 'AHEAD' | 'LEFT' | 'RIGHT' | 'MGOAL' | 'RGOAL';
type Item =
  | string
  | { r: number; b: Item[] }
  | { u: Ask; b: Item[] }
  | { if: Ask; then: Item[]; else?: Item[] };

const sensor = (ask: Ask, id: string): Record<string, unknown> => {
  if (ask === 'MGOAL') return { type: 'maze_at_goal', id };
  if (ask === 'RGOAL') return { type: 'runner_at_goal', id };
  if (ask === 'AHEAD' || ask === 'LEFT' || ask === 'RIGHT')
    return { type: 'maze_is_path', id, fields: { DIR: ask } };
  return { type: 'runner_is_ahead', id, fields: { KIND: ask } };
};

/** A program like [{ u: 'RGOAL', b: [{ if: 'HOLE', then: ['j'], else: ['w'] }] }] under the start. */
function program(items: Item[]): WorkspaceJson {
  let n = 0;
  const chain = (list: Item[]): Record<string, unknown> | undefined => {
    let head: Record<string, unknown> | undefined;
    for (const item of [...list].reverse()) {
      n += 1;
      const id = `b${String(n)}`;
      let block: Record<string, unknown>;
      if (typeof item === 'string') {
        block = { type: TYPES[item], id };
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

/** One run of a program on one map, in mode `predict` so the outcome carries an answer key. */
function runOn(kindId: Level['kind'], config: unknown, workspace: WorkspaceJson): RunOutcome {
  const kind = getGameKind(kindId);
  if (kind === undefined) throw new Error(`no game kind ${kindId}`);
  const level: Level = {
    id: 'probe',
    worldId: world.id,
    stage: 'practice',
    kind: kindId,
    mode: 'predict',
    title: 'probe',
    objective: 'probe',
    learningGoal: 'probe',
    toolbox: [],
    config,
    initialWorkspace: workspace,
    hints: [],
  };
  return runLevel({ kind, level, workspace });
}

/** The outcome key of a program on every map of a level (config first, then variants). */
const keysOf = (id: string, items: Item[] | WorkspaceJson): (string | undefined)[] => {
  const level = levelById(id);
  const workspace = Array.isArray(items) ? program(items) : items;
  return [level.config, ...(level.variants ?? [])].map(
    (config) => runOn(level.kind, config, workspace).answerKey,
  );
};

const demosOf = (lessonId: string): RunOutcome[] => {
  const lesson = lessons.get(lessonId);
  if (lesson === undefined) throw new Error(`no lesson ${lessonId}`);
  return lesson.cards
    .filter((card): card is Extract<LessonCard, { type: 'demo' }> => card.type === 'demo')
    .map((card) => runOn(card.kind, card.config, card.workspace));
};
const demoKeys = (lessonId: string): (string | undefined)[] =>
  demosOf(lessonId).map((outcome) => outcome.answerKey);

const holeOrWalk: Item = { if: 'HOLE', then: ['j'], else: ['w'] };
/** "Tiến đến khi có đường bên …, rẽ, tiến đến khi tới đích" (l08, l15, l18). */
const waitThenTurn = (ask: Ask, body: Item[], turn: string): Item[] => [
  { u: ask, b: body },
  turn,
  { u: 'MGOAL', b: ['f'] },
];
/** The answer key of a program on the first map of a level. */
const outcomeOn = (level: Level, items: Item[]): string | undefined =>
  runOn(level.kind, level.config, program(items)).answerKey;

describe('World 5 lessons', () => {
  it('cards are short: at most 6 cards of at most 12 words each', () => {
    for (const lesson of lessons.values()) {
      expect(lesson.cards.length).toBeLessThanOrEqual(6);
      const texts = lesson.cards.flatMap((card: LessonCard) => [
        card.text,
        ...(card.type === 'quiz' ? [card.explain, ...card.options] : []),
      ]);
      expect(texts.filter((text) => countWords(text) > 12)).toEqual([]);
    }
  });

  it('opening lesson: card 1 says Bông was rescued at the end of World 4', () => {
    const [first] = lessons.get('w05-lesson')?.cards ?? [];
    expect(first?.type).toBe('say');
    expect(first?.text).toMatch(/Cứu được Bông/);
  });

  it('opening lesson: one program fits a long and a short bank; turning only never stops', () => {
    expect(demoKeys('w05-lesson')).toEqual(['win', 'win', 'timeout']);
    const [, , dizzy] = demosOf('w05-lesson');
    expect(dizzy).toMatchObject({ result: 'timeout', reasonCode: 'TIMEOUT' });
  });

  it('lặp đến khi: walks up to the edge, and runs 0 rounds when the hole is already ahead', () => {
    expect(demoKeys('w05-lesson-lap-den-khi')).toEqual(['stop@2', 'stop@0']);
  });

  it('đã tới đích? / đã tới nơi?: the same program reaches a near and a far goal', () => {
    expect(demoKeys('w05-lesson-toi-dich')).toEqual(['win', 'win']);
    expect(demoKeys('w05-lesson-toi-noi')).toEqual(['win', 'win']);
  });

  it('quay tìm đường: Măng turns on the spot until the road is ahead, and never moves', () => {
    const demos = demosOf('w05-lesson-xoay');
    expect(demos.map((outcome) => outcome.answerKey)).toEqual(['stop@1,1', 'stop@1,3']);
    const turns = demos.map(
      (outcome) => outcome.events.filter((event) => event.type === 'turn').length,
    );
    expect(turns).toEqual([1, 3]);
    expect(demos.some((outcome) => outcome.events.some((event) => event.type === 'move'))).toBe(
      false,
    );
  });

  it('đón bạn: walking over Gà con picks her up; a road past her does not (NEED_FRIEND)', () => {
    expect(demoKeys('w05-lesson-don-ban')).toEqual(['win', 'missed@1,4']);
    const [, jumped] = demosOf('w05-lesson-don-ban');
    expect(jumped).toMatchObject({ result: 'incomplete', reasonCode: 'NEED_FRIEND' });
  });
});

describe('World 5 predict levels: the engine agrees with the right card', () => {
  it.each([
    ['w05-l03', 'win'], // asked before the first round: 0 rounds
    ['w05-l07', 'timeout'], // turning in place never reaches the dock
    ['w05-l11', 'crash:FELL_IN_HOLE@2'], // asked only between rounds
    ['w05-l19', 'timeout'], // after the kick the if does nothing: Măng stands still (A4)
  ])('%s → %s', (id, key) => {
    const level = levelById(id);
    if (level.initialWorkspace === undefined) throw new Error(`${id} has no program`);
    expect(keysOf(id, level.initialWorkspace)).toEqual([key]);
  });
});

describe('w05-l19 keeps its crate', () => {
  it('cell 2 is a crate, right after the first walk, so the kick in the loop hits something', () => {
    const level = levelById('w05-l19');
    expect((level.config as { cells: string[] }).cells[2]).toBe('crate');
  });

  it('with a walk in the else branch the loop would stop at the hole and win', () => {
    const level = levelById('w05-l19');
    const program: Item[] = [
      'w',
      { u: 'HOLE', b: [{ if: 'CRATE', then: ['k'], else: ['w'] }] },
      'j',
      'w',
    ];
    expect(outcomeOn(level, program)).toBe('win');
  });
});

describe('World 5 parsons: the wrong arrangements fail as the hints say', () => {
  it('l02: with both walks inside the loop, the blocks below run out before the flag', () => {
    expect(keysOf('w05-l02', [{ u: 'HOLE', b: ['w'] }, 'j', 'w', 'w'])).toEqual(['win']);
    expect(keysOf('w05-l02', [{ u: 'HOLE', b: ['w', 'w'] }, 'j', 'w'])).toEqual(['stop@7']);
  });

  // G22: only one way to join every given block wins (and every block must run).
  it.each(['w05-l02', 'w05-l10'])('%s: exactly one arrangement of the blocks wins', (id) => {
    expect(findParsonsArrangements(levelById(id))).toMatchObject({ wins: 1, complete: true });
  });

  it('l10: the if-else inside "until at the flag" wins; jumping every round falls in', () => {
    expect(keysOf('w05-l10', [{ u: 'RGOAL', b: [holeOrWalk] }])).toEqual(['win']);
    expect(keysOf('w05-l10', [{ u: 'RGOAL', b: ['j'] }])).toEqual(['crash:FELL_IN_HOLE@2']);
  });

  it('l16: the two-question program wins; without the left question Măng never stops', () => {
    const left: Item = { if: 'LEFT', then: ['L'] };
    const ahead: Item = { if: 'AHEAD', then: ['f'], else: ['R'] };
    expect(keysOf('w05-l16', [{ u: 'MGOAL', b: [left, ahead] }])).toEqual(['win']);
    expect(keysOf('w05-l16', [{ u: 'MGOAL', b: [ahead] }])).not.toEqual(['win']);
  });
});

describe('World 5 bughunts: each fix does what the curriculum says (§5.3)', () => {
  it('l05: "tiến" under the empty loop never runs (TIMEOUT); moved inside it wins both docks', () => {
    expect(keysOf('w05-l05', [{ u: 'MGOAL', b: [] }, 'f'])).toEqual(['timeout', 'timeout']);
    expect(keysOf('w05-l05', [{ u: 'MGOAL', b: ['f'] }])).toEqual(['win', 'win']);
  });

  it('l08: waiting for a road on the left turns at a dead end or past the turn', () => {
    expect(keysOf('w05-l08', waitThenTurn('LEFT', ['f'], 'R'))).toEqual([
      'crash:HIT_WALL@2,3',
      'crash:HIT_WALL@5,4',
    ]);
    expect(keysOf('w05-l08', waitThenTurn('RIGHT', ['f'], 'R'))).toEqual(['win', 'win']);
  });

  it('l12: the empty else-branch is stuck at the first corner; turning right wins', () => {
    const ask = (otherwise: Item[]): Item[] => [
      { u: 'MGOAL', b: [{ if: 'AHEAD', then: ['f'], else: otherwise }] },
    ];
    expect(keysOf('w05-l12', ask([]))).toEqual(['timeout']);
    expect(keysOf('w05-l12', ask(['R']))).toEqual(['win']);
  });

  it('l13: repeat 20 wins the short road but stops midway in the spiral (more than 20 rounds)', () => {
    const body: Item[] = [{ if: 'AHEAD', then: ['f'], else: ['L'] }];
    expect(keysOf('w05-l13', [{ r: 20, b: body }])).toEqual(['stop@7,9', 'win']);
    expect(keysOf('w05-l13', [{ u: 'MGOAL', b: body }])).toEqual(['win', 'win']);
    // Waiting for a road on the right instead stops at the side branch of map 2.
    expect(keysOf('w05-l13', [{ u: 'RIGHT', b: body }])).toEqual(['win', 'stop@3,5']);
  });

  it('l15: two steps per round win map 1 and overshoot the turn on map 2; one step wins both', () => {
    const ask: Item = { if: 'LEFT', then: ['L'] };
    expect(keysOf('w05-l15', [{ u: 'MGOAL', b: [ask, 'f', 'f'] }])).toEqual([
      'win',
      'crash:HIT_WALL@4,1',
    ]);
    expect(keysOf('w05-l15', [{ u: 'MGOAL', b: [ask, 'f'] }])).toEqual(['win', 'win']);
  });

  it('l18: two bugs; fixing only one still loses, fixing both wins', () => {
    const program = (first: Ask, body: Item[]): Item[] => [
      { u: first, b: ['f'] },
      'R',
      ...waitThenTurn('LEFT', body, 'L'),
    ];
    expect(keysOf('w05-l18', program('LEFT', ['f', 'f']))).toEqual([
      'crash:HIT_WALL@2,5',
      'crash:HIT_WALL@4,6',
    ]);
    // Only the first question fixed: like l15, map 2 overshoots the second turn.
    expect(keysOf('w05-l18', program('RIGHT', ['f', 'f']))).toEqual(['win', 'crash:HIT_WALL@4,1']);
    // Only the extra step removed: Măng still turns at the dead end on the left.
    expect(keysOf('w05-l18', program('LEFT', ['f']))).toEqual([
      'crash:HIT_WALL@2,5',
      'crash:HIT_WALL@4,6',
    ]);
    expect(keysOf('w05-l18', program('RIGHT', ['f']))).toEqual(['win', 'win']);
  });
});

describe('World 5 build levels', () => {
  it('l06: turning until the road is ahead finds both cave doors; one memorised turn does not', () => {
    const findDoor = (turn: string): Item[] => [
      { u: 'AHEAD', b: [turn] },
      { u: 'MGOAL', b: ['f'] },
    ];
    expect(keysOf('w05-l06', findDoor('R'))).toEqual(['win', 'win']);
    expect(keysOf('w05-l06', findDoor('L'))).toEqual(['win', 'win']);
    expect(keysOf('w05-l06', ['R', { u: 'MGOAL', b: ['f'] }])).toEqual([
      'win',
      'crash:HIT_WALL@6,3',
    ]);
  });

  it('l01: jumping all the way falls in on one of the 2 banks', () => {
    expect(keysOf('w05-l01', [{ u: 'BRANCH', b: ['j'] }]).every((key) => key === 'win')).toBe(
      false,
    );
  });

  it('l14, l17: repeat 20 stops midway on the long mazes; repeat until the goal wins', () => {
    const body: Item[] = [{ if: 'AHEAD', then: ['f'], else: ['R'] }];
    const [lake, short] = keysOf('w05-l14', [{ r: 20, b: body }]);
    expect(lake).toMatch(/^stop@/);
    expect(short).toBe('win');
    expect(keysOf('w05-l14', [{ u: 'MGOAL', b: body }])).toEqual(['win', 'win']);
    const twoQuestions: Item[] = [
      { if: 'LEFT', then: ['L'] },
      { if: 'AHEAD', then: ['f'], else: ['R'] },
    ];
    for (const key of keysOf('w05-l17', [{ r: 20, b: twoQuestions }]))
      expect(key).toMatch(/^stop@/);
    expect(keysOf('w05-l17', [{ u: 'MGOAL', b: twoQuestions }])).toEqual(['win', 'win']);
  });

  const straightFirst: Item = {
    if: 'AHEAD',
    then: ['f'],
    else: [{ if: 'LEFT', then: ['L'], else: ['R'] }],
  };

  it('boss: following a wall misses Gà con or walks round the loop for ever', () => {
    const left: Item[] = [
      {
        u: 'MGOAL',
        b: [
          { if: 'LEFT', then: ['L'] },
          { if: 'AHEAD', then: ['f'], else: ['R'] },
        ],
      },
    ];
    const right: Item[] = [
      {
        u: 'MGOAL',
        b: [
          { if: 'RIGHT', then: ['R'] },
          { if: 'AHEAD', then: ['f'], else: ['L'] },
        ],
      },
    ];
    expect(keysOf('w05-boss', left)).toEqual(['win', 'timeout']);
    expect(keysOf('w05-boss', right)).toEqual(['missed@6,6', 'timeout']);
  });

  it('boss: going straight first picks up Gà con on both maps before reaching home', () => {
    const level = levelById('w05-boss');
    const workspace = program([{ u: 'MGOAL', b: [straightFirst] }]);
    for (const config of [level.config, ...(level.variants ?? [])]) {
      const outcome = runOn('maze', config, workspace);
      expect(outcome.answerKey).toBe('win');
      const picked = outcome.events.some((event) => {
        const { type, item } = event as { type: string; item?: string };
        return type === 'collect' && item === 'friend';
      });
      expect(picked).toBe(true);
    }
  });

  // R1 (curriculum.md §5.5): without a question no program fits in maxBlocks.
  it.each(['w05-l01', 'w05-l04', 'w05-l06', 'w05-l09', 'w05-l14', 'w05-l17', 'w05-boss'])(
    '%s: nothing wins within maxBlocks without a question',
    { timeout: 60_000 },
    (id) => {
      const level = levelById(id);
      const maxSize = level.maxBlocks;
      if (maxSize === undefined) throw new Error(`${id} has no maxBlocks`);
      expect(withoutQuestions(level, maxSize)).toMatchObject({
        minBlocks: null,
        complete: true,
        mismatches: [],
      });
    },
  );

  // The bughunt roads also need the question: no question-free program of par blocks wins.
  it.each(['w05-l08', 'w05-l15', 'w05-l18'])(
    '%s: nothing wins within par blocks without a question',
    { timeout: 60_000 },
    (id) => {
      const level = levelById(id);
      if (level.par === undefined) throw new Error(`${id} has no par`);
      expect(withoutQuestions(level, level.par)).toMatchObject({
        minBlocks: null,
        complete: true,
      });
    },
  );

  // M1 (roadmap/difficulty-pass.md §3.2): the new mazes have 2 junctions and a dead end.
  it.each(['w05-l05', 'w05-l06', 'w05-l08', 'w05-l13', 'w05-l15', 'w05-l18'])(
    '%s: some map has 2 junctions and a dead end (M1)',
    (id) => {
      const level = levelById(id);
      const maps = [level.config, ...(level.variants ?? [])].map((config) =>
        mazeJunctions((config as { map: string[] }).map),
      );
      expect(maps.some(({ junctions, deadEnds }) => junctions >= 2 && deadEnds >= 1)).toBe(true);
    },
  );

  it(
    'l14: the star goal is a real trade-off (6 blocks win, 7 pick the shoot)',
    { timeout: 60_000 },
    () => {
      const level = levelById('w05-l14');
      expect(findShortestPrograms(level)).toMatchObject({ minBlocks: 7, complete: true });
      expect(findShortestPrograms(level, { ignoreStarGoals: true })).toMatchObject({
        minBlocks: 6,
        complete: true,
      });
    },
  );
});

/** Shortest search on the level's toolbox without any question (sensor, `nếu`, `lặp đến khi`). */
function withoutQuestions(level: Level, maxSize: number): ReturnType<typeof findShortestPrograms> {
  const asks = new Set([
    'cq_if',
    'cq_if_else',
    'cq_repeat_until',
    'runner_is_ahead',
    'runner_at_goal',
    'maze_is_path',
    'maze_at_goal',
  ]);
  const noQuestions: Level = {
    ...level,
    toolbox: level.toolbox.filter(
      (entry) => !asks.has(typeof entry === 'string' ? entry : entry.type),
    ),
  };
  return findShortestPrograms(noQuestions, { maxSize });
}
