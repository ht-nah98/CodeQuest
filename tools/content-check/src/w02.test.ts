// World 2 "Rừng Lặp Lại" after the difficulty pass (roadmap/difficulty-pass.md batch B): the
// counting levels punish an extra round, the new mazes have junctions and dead ends, and the
// U-turn lesson shows both ways to turn round.
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
import { describe, expect, it } from 'vitest';
import { mazeJunctions } from './difficulty';

const DIR = new URL('../../../content/worlds/w02-rung-lap-lai/', import.meta.url);
const read = (path: string): unknown => JSON.parse(readFileSync(new URL(path, DIR), 'utf8'));
const WORLD_ID = 'w02-rung-lap-lai';

const world = WorldSchema.parse(read('world.json'));
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
    worldId: WORLD_ID,
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

const lessonById = (id: string) => LessonSchema.parse(read(`lessons/${id}.json`));

describe('World 2 difficulty pass (batch B)', () => {
  it('l05: one round too many or too few falls in a hole', () => {
    expect(keyOf('w02-l05', [{ r: 4, b: ['w', 'j'] }, 'j'])).toBe('win');
    expect(keyOf('w02-l05', [{ r: 5, b: ['w', 'j'] }, 'j'])).toBe('crash:FELL_IN_HOLE@13');
    expect(keyOf('w02-l05', [{ r: 3, b: ['w', 'j'] }, 'j'])).toBe('crash:FELL_IN_HOLE@11');
  });

  it('l06: one round short stops in a dead end, one too many hits the wall', () => {
    expect(keyOf('w02-l06', ['R', { r: 4, b: ['f'] }, 'L', 'f'])).toBe('win');
    expect(keyOf('w02-l06', ['R', { r: 3, b: ['f'] }, 'L', 'f'])).toBe('stop@1,4');
    expect(keyOf('w02-l06', ['R', { r: 5, b: ['f'] }, 'L', 'f'])).toBe('crash:HIT_WALL@2,5');
  });

  it('l11: the right turn outside the zigzag loop sends round 2 into a dead end', () => {
    expect(keyOf('w02-l11', [{ r: 3, b: ['f', 'f', 'L', 'f'] }, 'R', 'f'])).toBe(
      'crash:HIT_WALL@2,3',
    );
    expect(keyOf('w02-l11', [{ r: 3, b: ['f', 'f', 'L', 'f', 'R'] }, 'f'])).toBe('win');
    expect(keyOf('w02-l11', [{ r: 2, b: ['f', 'f', 'L', 'f', 'R'] }, 'f'])).toBe('stop@2,6');
  });

  it('l12: an extra side hits the clump, a missing side stops in a dead end', () => {
    expect(keyOf('w02-l12', [{ r: 3, b: ['R', 'f', 'f'] }, 'f'])).toBe('win');
    expect(keyOf('w02-l12', [{ r: 4, b: ['R', 'f', 'f'] }, 'f'])).toBe('crash:HIT_WALL@3,2');
    expect(keyOf('w02-l12', [{ r: 2, b: ['R', 'f', 'f'] }, 'f'])).toBe('stop@4,4');
  });

  it('l13: pick the shoot, turn round, walk back; turning once is not a U-turn', () => {
    expect(keyOf('w02-l13', ['f', 'R', 'R', { r: 6, b: ['f'] }])).toBe('win');
    expect(keyOf('w02-l13', ['f', 'L', 'L', { r: 6, b: ['f'] }])).toBe('win');
    expect(keyOf('w02-l13', ['f', 'R', { r: 6, b: ['f'] }])).toBe('crash:HIT_WALL@1,7');
    // Only one loop: two loops in a row are l14's idea.
    expect(levelById('w02-l13').maxBlocks).toBe(5);
  });

  it('l16: one tooth per round, in and out', () => {
    const body = ['L', 'f', 'R', 'R', 'f', 'L', 'f', 'f'];
    expect(keyOf('w02-l16', [{ r: 4, b: body }])).toBe('win');
    expect(keyOf('w02-l16', [{ r: 3, b: body }])).toBe('stop@2,8');
  });

  it('l17: corridor loop then clump loop; one cell too many walks into a dead end', () => {
    expect(
      keyOf('w02-l17', [
        { r: 4, b: ['f'] },
        { r: 2, b: ['R', 'f', 'f'] },
      ]),
    ).toBe('win');
    expect(
      keyOf('w02-l17', [
        { r: 5, b: ['f'] },
        { r: 2, b: ['R', 'f', 'f'] },
      ]),
    ).toBe('crash:HIT_WALL@1,6');
  });

  it('every graded maze build/bughunt changed in the pass has a junction and a dead end', () => {
    for (const id of [
      'w02-l06',
      'w02-l11',
      'w02-l12',
      'w02-l13',
      'w02-l16',
      'w02-l17',
      'w02-l19',
    ]) {
      const { junctions, deadEnds } = mazeJunctions(
        (levelById(id).config as { map: string[] }).map,
      );
      expect({ id, junctions: junctions >= 1, deadEnds: deadEnds >= 1 }).toEqual({
        id,
        junctions: true,
        deadEnds: true,
      });
    }
  });

  it('the U-turn lesson shows both turns, each then walks to the goal', () => {
    const lesson = lessonById('w02-lesson-quay-dau');
    expect(lesson.beforeLevel).toBe('w02-l13');
    const keys = lesson.cards
      .filter((card): card is Extract<LessonCard, { type: 'demo' }> => card.type === 'demo')
      .map((card) => outcomeKey(card.kind, card.config, card.workspace));
    expect(keys).toEqual(['win', 'win']);
    expect(lesson.cards[0]?.text).toBe('Rẽ 2 lần là quay đầu: Măng nhìn ngược lại, chưa đi.');
  });
});
