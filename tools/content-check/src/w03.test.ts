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
function outcomeKey(kindId: Level['kind'], config: unknown, workspace: WorkspaceJson): string | undefined {
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

  it('l08: rounds 1–2 of the walk loop are fine, round 3 falls; jumping wins', () => {
    expect(keyOf('w03-l08', [{ r: 2, b: ['w'] }])).toBe('stop@2');
    expect(keyOf('w03-l08', [{ r: 3, b: ['w'] }, 'c', 'w', 'w'])).toBe('crash:FELL_IN_HOLE@3');
    expect(keyOf('w03-l08', [{ r: 3, b: ['j'] }, 'c', 'w', 'w'])).toBe('win');
  });

  it('l11: the first chunk stops at cell 9; the 5-block jump win skips the shoot', () => {
    expect(keyOf('w03-l11', [{ r: 3, b: ['w', 'j'] }])).toBe('stop@9');
    const cheap = program([{ r: 3, b: ['w', 'j'] }, { r: 4, b: ['j'] }]);
    const level = levelById('w03-l11');
    const kind = getGameKind(level.kind);
    if (kind === undefined) throw new Error('no runner');
    const outcome = runLevel({ kind, level, workspace: cheap });
    expect(outcome.result).toBe('success');
    expect(outcome.goals).toEqual([false]);
  });

  it('l12: two bugs, one after the other', () => {
    expect(keyOf('w03-l12', [{ r: 2, b: ['w', 'j'] }, 'w', 'w', 'w'])).toBe('crash:FELL_IN_HOLE@8');
    expect(keyOf('w03-l12', [{ r: 3, b: ['w', 'j'] }, 'w', 'w', 'w'])).toBe('crash:HIT_BRANCH@10');
    expect(keyOf('w03-l12', [{ r: 3, b: ['w', 'j'] }, 'c', 'w', 'w'])).toBe('win');
  });

  it('l13: loop count first, then the wrong turn', () => {
    const run = (times: number, turn: string): string | undefined =>
      keyOf('w03-l13', [{ r: times, b: ['f'] }, 'R', { r: 4, b: ['f'] }, turn, { r: 2, b: ['f'] }]);
    expect(run(3, 'L')).toBe('crash:HIT_WALL@2,1');
    expect(run(4, 'L')).toBe('crash:HIT_WALL@1,5');
    expect(run(4, 'R')).toBe('win');
  });

  it('l05: without the loose kick Măng hits the crate; joined after the first walk it wins', () => {
    expect(keyOf('w03-l05', ['w', 'w', 'w', 'j', 'w'])).toBe('crash:HIT_CRATE@2');
    expect(keyOf('w03-l05', ['w', 'k', 'w', 'w', 'j', 'w'])).toBe('win');
  });

  it('l06: turning right while facing down hits the wall; turning left wins', () => {
    expect(keyOf('w03-l06', [{ r: 3, b: ['f'] }, 'R', { r: 4, b: ['f'] }])).toBe('crash:HIT_WALL@4,2');
    expect(keyOf('w03-l06', [{ r: 3, b: ['f'] }, 'L', { r: 4, b: ['f'] }])).toBe('win');
  });

  it('l10: the turn comes one block early; swapping blocks 2 and 3 wins', () => {
    expect(keyOf('w03-l10', ['f', 'L', 'f', 'f', 'f', 'R', 'f', 'f'])).toBe('crash:HIT_WALL@3,2');
    expect(keyOf('w03-l10', ['f', 'f', 'L', 'f', 'f', 'R', 'f', 'f'])).toBe('win');
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
