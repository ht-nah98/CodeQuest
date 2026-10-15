// World 3 "Xưởng Sửa Lỗi" (curriculum.md §5.1): the debugging levels only teach if each fix
// reveals the next bug where the curriculum says, and the opening lesson's demos fail as told.
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
import { countWords } from '@codequest/validator';
import { describe, expect, it } from 'vitest';
import { mazeJunctions } from './difficulty';

const W03 = new URL('../../../content/worlds/w03-xuong-sua-loi/', import.meta.url);
const read = (path: string): unknown => JSON.parse(readFileSync(new URL(path, W03), 'utf8'));

const world = WorldSchema.parse(read('world.json'));
const lesson = LessonSchema.parse(read(`lessons/${world.lessonIds[0] ?? ''}.json`));
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
  c: 'runner_crouch',
  k: 'runner_kick',
  f: 'maze_forward',
  L: 'maze_turn_left',
  R: 'maze_turn_right',
};
type Item = string | { r: number; b: Item[] };

/** A program like ['w', { r: 3, b: ['w', 'j'] }] as a workspace under the start block. */
function program(items: Item[]): WorkspaceJson {
  let n = 0;
  const chain = (list: Item[]): Record<string, unknown> | undefined => {
    let head: Record<string, unknown> | undefined;
    for (const item of [...list].reverse()) {
      n += 1;
      const block: Record<string, unknown> =
        typeof item === 'string'
          ? { type: TYPES[item], id: `b${String(n)}` }
          : { type: 'cq_repeat', id: `b${String(n)}`, fields: { TIMES: item.r } };
      if (typeof item !== 'string') {
        const body = chain(item.b);
        if (body !== undefined) block['inputs'] = { DO: { block: body } };
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

/** Where a run ends, as a predict answer key ("win", "crash:HIT_WALL@3,2", "missed@17"…). */
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

const keyOf = (id: string, items: Item[]): string | undefined => {
  const level = levelById(id);
  return outcomeKey(level.kind, level.config, program(items));
};

describe('World 3 opening lesson', () => {
  it('has at most 6 cards of at most 12 words each', () => {
    expect(lesson.cards.length).toBeLessThanOrEqual(6);
    const texts = lesson.cards.flatMap((card: LessonCard) => [
      card.text,
      ...(card.type === 'quiz' ? [card.explain, ...card.options] : []),
    ]);
    expect(texts.filter((text) => countWords(text) > 12)).toEqual([]);
  });

  it('demos: the fixed l01 program wins; a missing walk drops Măng in the hole', () => {
    const demos = lesson.cards.filter(
      (card): card is Extract<LessonCard, { type: 'demo' }> => card.type === 'demo',
    );
    const keys = demos.map((card) => outcomeKey(card.kind, card.config, card.workspace));
    expect(keys).toEqual(['win', 'crash:FELL_IN_HOLE@3']);
  });
});

describe('World 3 levels: each fix reveals the next bug (curriculum.md §5.1)', () => {
  it('l03: the jump that is lit when Măng falls is fine; the missing walk is before it', () => {
    expect(keyOf('w03-l03', ['c', 'w', 'w', 'j', 'k', 'w', 'w', 'w'])).toBe('crash:FELL_IN_HOLE@5');
    expect(keyOf('w03-l03', ['c', 'w', 'w', 'w', 'j', 'k', 'w', 'w', 'w'])).toBe('win');
  });

  it('l08: the extra forward goes down 2 a step; rounds 1–2 pass, round 3 hits the wall', () => {
    expect(keyOf('w03-l08', [{ r: 2, b: ['f', 'R', 'f', 'f', 'L'] }])).toBe('stop@5,3');
    expect(keyOf('w03-l08', [{ r: 3, b: ['f', 'R', 'f', 'f', 'L'] }])).toBe('crash:HIT_WALL@5,3');
    expect(keyOf('w03-l08', [{ r: 3, b: ['f', 'R', 'f', 'L'] }])).toBe('win');
  });

  it('l11: the first chunk stops at cell 9; the 5-block jump win skips the shoot', () => {
    expect(keyOf('w03-l11', [{ r: 3, b: ['w', 'j'] }])).toBe('stop@9');
    const cheap = program([
      { r: 3, b: ['w', 'j'] },
      { r: 4, b: ['j'] },
    ]);
    const level = levelById('w03-l11');
    const kind = getGameKind(level.kind);
    if (kind === undefined) throw new Error('no runner');
    const outcome = runLevel({ kind, level, workspace: cheap });
    expect(outcome.result).toBe('success');
    expect(outcome.goals).toEqual([false]);
  });

  it('l12: loop count first, then a missing forward at the end (not a turn, unlike l13)', () => {
    const run = (times: number, tail: string[]): string | undefined =>
      keyOf('w03-l12', [{ r: times, b: ['f'] }, 'R', { r: 4, b: ['f'] }, 'L', ...tail]);
    expect(run(2, ['f'])).toBe('crash:HIT_WALL@1,3');
    expect(run(3, ['f'])).toBe('stop@5,5');
    expect(run(3, ['f', 'f'])).toBe('win');
  });

  it('l13: loop count first, then the wrong turn', () => {
    const run = (times: number, turn: string): string | undefined =>
      keyOf('w03-l13', [{ r: times, b: ['f'] }, 'R', { r: 4, b: ['f'] }, turn, { r: 2, b: ['f'] }]);
    expect(run(3, 'L')).toBe('crash:HIT_WALL@3,1');
    // The wrong turn walks into the dead end above the corner.
    expect(run(4, 'L')).toBe('crash:HIT_WALL@1,5');
    expect(run(4, 'R')).toBe('win');
  });

  it('l05: without the loose left turn Măng drives into the dead end; joined it wins', () => {
    expect(keyOf('w03-l05', ['f', 'f', 'f', 'f', 'f'])).toBe('crash:HIT_WALL@4,4');
    expect(keyOf('w03-l05', ['f', 'f', 'L', 'f', 'f', 'f'])).toBe('win');
  });

  it('l06: turning right while facing down enters the dead end; turning left wins', () => {
    expect(keyOf('w03-l06', [{ r: 3, b: ['f'] }, 'R', { r: 4, b: ['f'] }])).toBe(
      'crash:HIT_WALL@4,1',
    );
    expect(keyOf('w03-l06', [{ r: 3, b: ['f'] }, 'L', { r: 4, b: ['f'] }])).toBe('win');
  });

  it('l10: the turn comes two blocks early, into the dead end; swapping blocks 2 and 4 wins', () => {
    const swapped = ['f', 'L', 'f', 'f', 'f', 'f', 'R', 'f', 'f'];
    expect(keyOf('w03-l10', swapped)).toBe('crash:HIT_WALL@2,2');
    expect(keyOf('w03-l10', ['f', 'f', 'f', 'L', 'f', 'f', 'R', 'f', 'f'])).toBe('win');
  });

  it('boss: four bugs, each fix shows the next one', () => {
    const steps: Item[][] = [
      [{ r: 2, b: ['w', 'j'] }, 'w', 'w', { r: 3, b: ['w'] }, 'j', 'w', 'w'],
      [{ r: 3, b: ['w', 'j'] }, 'w', 'w', { r: 3, b: ['w'] }, 'j', 'w', 'w'],
      [{ r: 3, b: ['w', 'j'] }, 'k', 'w', 'w', { r: 3, b: ['w'] }, 'j', 'w', 'w'],
      [{ r: 3, b: ['w', 'j'] }, 'k', 'w', 'w', { r: 3, b: ['c'] }, 'j', 'w', 'w'],
      [{ r: 3, b: ['w', 'j'] }, 'k', 'w', 'w', { r: 3, b: ['c'] }, 'w', 'w', 'w'],
    ];
    expect(steps.map((items) => keyOf('w03-boss', items))).toEqual([
      'crash:FELL_IN_HOLE@8',
      'crash:HIT_CRATE@10',
      'crash:HIT_BRANCH@12',
      'missed@17',
      'win',
    ]);
  });
});

describe('World 3 mazes (difficulty pass, M1)', () => {
  it('every graded maze bughunt has a junction and a dead end the bug walks into', () => {
    const flat = [...levels.values()].filter(
      (level) => level.kind === 'maze' && level.mode === 'bughunt' && level.stage !== 'guided',
    );
    expect(flat.map((level) => level.id)).toEqual([
      'w03-l05',
      'w03-l06',
      'w03-l08',
      'w03-l10',
      'w03-l12',
      'w03-l13',
    ]);
    for (const level of flat) {
      const { junctions, deadEnds } = mazeJunctions((level.config as { map: string[] }).map);
      expect({ id: level.id, junction: junctions >= 1, deadEnd: deadEnds >= 1 }).toEqual({
        id: level.id,
        junction: true,
        deadEnd: true,
      });
    }
  });
});
