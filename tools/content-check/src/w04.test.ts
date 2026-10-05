// World 4 "Ngã Ba Quyết Định" (curriculum.md §5.2): one program, many roads. These tests pin what
// the levels teach: the lesson demos end where the cards say, a question is needed to win the
// build levels, each bughunt fix shows the next step, and the star goal of l16 is a real trade-off.
import { readFileSync } from 'node:fs';
import {
  LessonSchema,
  LevelSchema,
  WorldSchema,
  type LessonCard,
  type Level,
  type WorkspaceJson,
} from '@codequest/content-schema';
import { runLevel } from '@codequest/engine';
import { getGameKind } from '@codequest/games';
import { countWords, findShortestPrograms } from '@codequest/validator';
import { describe, expect, it } from 'vitest';

const W04 = new URL('../../../content/worlds/w04-nga-ba-quyet-dinh/', import.meta.url);
const read = (path: string): unknown => JSON.parse(readFileSync(new URL(path, W04), 'utf8'));

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
/** A runner question (`HOLE`, `CLEAR`, `CRATE`) or a maze one (`AHEAD`, `LEFT`, `RIGHT`). */
type Ask = 'HOLE' | 'CLEAR' | 'CRATE' | 'AHEAD' | 'LEFT' | 'RIGHT';
type Item = string | { r: number; b: Item[] } | { if: Ask; then: Item[]; else?: Item[] };

const sensor = (ask: Ask, id: string): Record<string, unknown> =>
  ask === 'AHEAD' || ask === 'LEFT' || ask === 'RIGHT'
    ? { type: 'maze_is_path', id, fields: { DIR: ask } }
    : { type: 'runner_is_ahead', id, fields: { KIND: ask } };

/** A program like [{ r: 12, b: [{ if: 'HOLE', then: ['j'], else: ['w'] }] }] under the start block. */
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
      } else if ('r' in item) {
        block = { type: 'cq_repeat', id, fields: { TIMES: item.r } };
        const body = chain(item.b);
        if (body !== undefined) block['inputs'] = { DO: { block: body } };
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

/** Where a run ends, as a predict answer key ("win", "crash:HIT_WALL@3,2", "missed@14"…). */
function outcomeKey(
  kindId: Level['kind'],
  config: unknown,
  workspace: WorkspaceJson,
): string | undefined {
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
  return runLevel({ kind, level, workspace }).answerKey;
}

/** The outcome key of a program on every map of a level (config first, then variants). */
const keysOf = (id: string, items: Item[]): (string | undefined)[] => {
  const level = levelById(id);
  return [level.config, ...(level.variants ?? [])].map((config) =>
    outcomeKey(level.kind, config, program(items)),
  );
};

const demosOf = (lessonId: string): (string | undefined)[] => {
  const lesson = lessons.get(lessonId);
  if (lesson === undefined) throw new Error(`no lesson ${lessonId}`);
  return lesson.cards
    .filter((card): card is Extract<LessonCard, { type: 'demo' }> => card.type === 'demo')
    .map((card) => outcomeKey(card.kind, card.config, card.workspace));
};

const IFE = (r: number, ask: Ask, then: Item[], otherwise: Item[]): Item[] => [
  { r, b: [{ if: ask, then, else: otherwise }] },
];
/** Left first, then ahead or turn (curriculum.md §5.2 l13, l14, l16, l18, boss). */
const twoQuestions = (r: number, elseTurn = 'R', first: Ask = 'LEFT'): Item[] => [
  {
    r,
    b: [
      { if: first, then: [first === 'LEFT' ? 'L' : 'R'] },
      { if: 'AHEAD', then: ['f'], else: [elseTurn] },
    ],
  },
];

describe('World 4 lessons', () => {
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

  it('opening lesson: the same if-else program wins on two different roads', () => {
    expect(demosOf('w04-lesson')).toEqual(['win', 'win']);
  });

  it('nếu: ✔ jumps over the hole, ✘ skips the jump and stays put', () => {
    expect(demosOf('w04-lesson-neu')).toEqual(['stop@2', 'stop@0']);
  });

  it('nếu … nếu không: ✔ runs the top branch (jump), ✘ the bottom one (walk)', () => {
    expect(demosOf('w04-lesson-neu-khong')).toEqual(['stop@2', 'stop@1']);
  });

  it('có đường: ✔ ahead moves 1 cell; facing down, Măng’s left is screen right', () => {
    expect(demosOf('w04-lesson-co-duong')).toEqual(['stop@1,2', 'stop@1,2']);
  });

  it('chìa khóa: standing on the key picks it up, jumping over it does not', () => {
    expect(demosOf('w04-lesson-chia-khoa')).toEqual(['win', 'missed@3']);
  });
});

describe('World 4 parsons: the wrong arrangements fail as the hints say', () => {
  it('l01: jump outside the if jumps every round; walk inside stands still', () => {
    expect(keysOf('w04-l01', [{ r: 6, b: [{ if: 'HOLE', then: ['j'] }, 'w'] }])).toEqual(['win']);
    expect(keysOf('w04-l01', [{ r: 6, b: [{ if: 'HOLE', then: ['w'] }, 'j'] }])).toEqual([
      'crash:FELL_IN_HOLE@1',
    ]);
    expect(keysOf('w04-l01', [{ r: 6, b: [{ if: 'HOLE', then: ['j', 'w'] }] }])).toEqual([
      'stop@3',
    ]);
  });

  it('l01: winning with a given block still loose does not count (G22, LOOSE_BLOCKS)', () => {
    const level = levelById('w04-l01');
    const kind = getGameKind(level.kind);
    if (kind === undefined || level.solution === undefined) throw new Error('no l01');
    const [start] = level.solution.blocks.blocks;
    const loose = { type: 'runner_walk', id: 'extra', x: 300, y: 40 };
    const workspace: WorkspaceJson = {
      blocks: { languageVersion: 0, blocks: [start, loose] as typeof level.solution.blocks.blocks },
    };
    expect(runLevel({ kind, level, workspace: level.solution }).result).toBe('success');
    expect(runLevel({ kind, level, workspace })).toMatchObject({
      result: 'incomplete',
      reasonCode: 'LOOSE_BLOCKS',
    });
  });

  it('l09: asking about the hole before the crate walks into the crate', () => {
    const crate: Item = { if: 'CRATE', then: ['k'] };
    const hole: Item = { if: 'HOLE', then: ['j'], else: ['w'] };
    expect(keysOf('w04-l09', [{ r: 12, b: [crate, hole] }])).toEqual(['win']);
    expect(keysOf('w04-l09', [{ r: 12, b: [hole, crate] }])).toEqual(['crash:HIT_CRATE@1']);
  });

  it('l14: the two-question program wins; without the left question Măng ends at a dead end', () => {
    expect(keysOf('w04-l14', twoQuestions(20))).toEqual(['win']);
    expect(keysOf('w04-l14', IFE(20, 'AHEAD', ['f'], ['R']))).not.toEqual(['win']);
  });
});

describe('World 4 bughunts: each fix does what the curriculum says (§5.2)', () => {
  it('l05: swapped branches fall in the first hole; asking "ô trống" wins', () => {
    expect(keysOf('w04-l05', IFE(8, 'HOLE', ['w'], ['j']))).toEqual(['crash:FELL_IN_HOLE@2']);
    expect(keysOf('w04-l05', IFE(8, 'CLEAR', ['w'], ['j']))).toEqual(['win']);
  });

  it('l11: asking the left side runs into the wall; asking the right side wins', () => {
    const run = (ask: Ask): (string | undefined)[] =>
      keysOf('w04-l11', [{ r: 12, b: [{ if: ask, then: ['R'] }, 'f'] }]);
    expect(run('LEFT')).toEqual(['crash:HIT_WALL@1,4']);
    expect(run('RIGHT')).toEqual(['win']);
  });

  it('l15: the memorised first jump wins map 1 and falls on map 2; deleting it wins both', () => {
    expect(keysOf('w04-l15', ['j', ...IFE(12, 'HOLE', ['j'], ['w'])])).toEqual([
      'win',
      'crash:FELL_IN_HOLE@2',
    ]);
    expect(keysOf('w04-l15', IFE(12, 'HOLE', ['j'], ['w']))).toEqual(['win', 'win']);
  });

  it('l18: turning left in the else branch paces back and forth; turning right wins', () => {
    expect(keysOf('w04-l18', twoQuestions(20, 'L'))).toEqual(['stop@1,1', 'stop@1,1']);
    expect(keysOf('w04-l18', twoQuestions(20, 'R'))).toEqual(['win', 'win']);
  });

  it('l19: two bugs; fixing only one still loses, fixing both wins', () => {
    expect(keysOf('w04-l19', IFE(5, 'HOLE', ['w'], ['j']))).toEqual([
      'crash:FELL_IN_HOLE@2',
      'crash:FELL_IN_HOLE@1',
    ]);
    // Only the question fixed: map 2 runs out of rounds.
    expect(keysOf('w04-l19', IFE(5, 'CLEAR', ['w'], ['j']))).toEqual(['win', 'stop@8']);
    // Only the count fixed: still walks into the holes.
    expect(keysOf('w04-l19', IFE(12, 'HOLE', ['w'], ['j']))).toEqual([
      'crash:FELL_IN_HOLE@2',
      'crash:FELL_IN_HOLE@1',
    ]);
    expect(keysOf('w04-l19', IFE(12, 'CLEAR', ['w'], ['j']))).toEqual(['win', 'win']);
  });
});

describe('World 4 build levels', () => {
  it('l06: the toolbox repeat of 3 stops early; a big enough count wins both maps', () => {
    expect(keysOf('w04-l06', IFE(3, 'HOLE', ['j'], ['w']))).toEqual(['stop@5', 'stop@4']);
    expect(keysOf('w04-l06', IFE(12, 'HOLE', ['j'], ['w']))).toEqual(['win', 'win']);
  });

  it('l17: jumping all the way flies over the keys or into a hole on all 3 maps', () => {
    expect(keysOf('w04-l17', [{ r: 12, b: ['j'] }]).every((key) => key !== 'win')).toBe(true);
    expect(keysOf('w04-l17', IFE(12, 'HOLE', ['j'], ['w']))).toEqual(['win', 'win', 'win']);
  });

  it('boss: asking right first wins mazes 2–3 but misses the key in maze 1', () => {
    expect(keysOf('w04-boss', twoQuestions(20))).toEqual(['win', 'win', 'win']);
    const rightFirst = keysOf('w04-boss', twoQuestions(20, 'L', 'RIGHT'));
    expect(rightFirst.slice(1)).toEqual(['win', 'win']);
    expect(rightFirst[0]).not.toBe('win');
  });

  it('creative: the two-question program reaches the exit asking either side first', () => {
    const creative = levelById('w04-creative');
    for (const first of ['LEFT', 'RIGHT'] as const) {
      const turn = first === 'LEFT' ? 'R' : 'L';
      expect(outcomeKey('maze', creative.config, program(twoQuestions(20, turn, first)))).toBe(
        'win',
      );
    }
  });

  // R1 (curriculum.md §5.5): without a question no program fits in maxBlocks.
  it.each(['w04-l02', 'w04-l04', 'w04-l06', 'w04-l08', 'w04-l12', 'w04-l17', 'w04-boss'])(
    '%s: nothing wins within maxBlocks without a question',
    { timeout: 60_000 },
    (id) => {
      const level = levelById(id);
      const maxSize = level.maxBlocks;
      if (maxSize === undefined) throw new Error(`${id} has no maxBlocks`);
      const asks = new Set(['cq_if', 'cq_if_else', 'runner_is_ahead', 'maze_is_path']);
      const noQuestions: Level = {
        ...level,
        toolbox: level.toolbox.filter(
          (entry) => !asks.has(typeof entry === 'string' ? entry : entry.type),
        ),
      };
      const result = findShortestPrograms(noQuestions, { maxSize });
      expect(result).toMatchObject({ minBlocks: null, complete: true, mismatches: [] });
    },
  );

  it(
    'l16: the star goal is a real trade-off (5 blocks win, 8 pick the shoot)',
    { timeout: 60_000 },
    () => {
      const level = levelById('w04-l16');
      expect(findShortestPrograms(level)).toMatchObject({ minBlocks: 8, complete: true });
      expect(findShortestPrograms(level, { ignoreStarGoals: true })).toMatchObject({
        minBlocks: 5,
        complete: true,
      });
    },
  );
});
