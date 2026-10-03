// Coach feedback 03/10/2026: each action block gets a block lesson ("Khối mới") right before the
// level where it first appears, whose demos show where Măng ends up (curriculum.md §3).
import { readFileSync } from 'node:fs';
import {
  LessonSchema,
  LevelSchema,
  WorldSchema,
  type Lesson,
  type LessonCard,
  type Level,
} from '@codequest/content-schema';
import { runLevel } from '@codequest/engine';
import { getGameKind } from '@codequest/games';
import { countWords, toolboxTypes } from '@codequest/validator';
import { describe, expect, it } from 'vitest';

const W01 = new URL('../../../content/worlds/w01-lang-tre/', import.meta.url);
const read = (path: string): unknown => JSON.parse(readFileSync(new URL(path, W01), 'utf8'));

const world = WorldSchema.parse(read('world.json'));
const lessons = world.lessonIds.map((id) => LessonSchema.parse(read(`lessons/${id}.json`)));
const levels = world.levelIds.map((id) => LevelSchema.parse(read(`levels/${id}.json`)));

type DemoCard = Extract<LessonCard, { type: 'demo' }>;
const demos = (lesson: Lesson): DemoCard[] =>
  lesson.cards.filter((card): card is DemoCard => card.type === 'demo');

/** One event as a short string with its positions, e.g. "jump 0-2", "kick 1 hit", "turn E-S". */
function step(event: Record<string, unknown>): string {
  const at = (value: unknown): string => (Array.isArray(value) ? value.join(',') : String(value));
  switch (event['type']) {
    case 'walk':
    case 'crouch':
    case 'jump':
    case 'move':
    case 'turn':
      return `${event['type']} ${at(event['from'])}-${at(event['to'])}`;
    case 'kick':
      return `kick ${at(event['at'])} ${event['hit'] === true ? 'hit' : 'miss'}`;
    case 'bump':
      return `bump ${at(event['from'])}-${at(event['at'])}`;
    default:
      return String(event['type']);
  }
}

/** Runs a demo card the way LessonDemo does (a tiny predict level): answer key and steps. */
function demoAnswer(card: DemoCard): { key: string | undefined; steps: string[] } {
  const kind = getGameKind(card.kind);
  if (kind === undefined) throw new Error(`no game kind ${card.kind}`);
  const level: Level = {
    id: 'demo',
    worldId: world.id,
    stage: 'guided',
    kind: card.kind,
    mode: 'predict',
    title: 'demo',
    objective: card.text,
    learningGoal: card.text,
    toolbox: [],
    config: card.config,
    initialWorkspace: card.workspace,
    hints: [],
  };
  const outcome = runLevel({ kind, level, workspace: card.workspace });
  const steps = outcome.events
    .filter((event) => event.type !== 'highlight')
    .map((event) => step(event as unknown as Record<string, unknown>));
  return { key: outcome.answerKey, steps };
}

const lessonById = (id: string): Lesson => {
  const lesson = lessons.find((l) => l.id === id);
  if (lesson === undefined) throw new Error(`no lesson ${id}`);
  return lesson;
};

describe('World 1 block lessons', () => {
  it.each([
    ['runner_jump', 'w01-lesson-nhay'],
    ['runner_crouch', 'w01-lesson-cui'],
    ['runner_kick', 'w01-lesson-da'],
    ['maze_forward', 'w01-lesson-re'],
    ['maze_turn_left', 'w01-lesson-re'],
    ['maze_turn_right', 'w01-lesson-re'],
  ])('%s: its block lesson sits before the level where it first appears', (type, lessonId) => {
    const first = levels.find((level) => toolboxTypes(level).has(type));
    expect(lessonById(lessonId).beforeLevel).toBe(first?.id);
  });

  it('keeps every card within 12 words (ui-copy-guide.md)', () => {
    const long = lessons
      .filter((lesson) => lesson.beforeLevel !== undefined)
      .flatMap((lesson) =>
        lesson.cards.flatMap((card) => [
          card.text,
          ...(card.type === 'quiz' ? [card.explain, ...card.options] : []),
        ]),
      )
      .filter((text) => countWords(text) > 12);
    expect(long).toEqual([]);
  });

  it('nhảy: walking moves 1 cell; a jump flies over 1 cell and lands on the 2nd, holes or not', () => {
    const [walk, hole, flat] = demos(lessonById('w01-lesson-nhay')).map(demoAnswer);
    expect(walk?.steps).toEqual(['walk 0-1', 'walk 1-2', 'walk 2-3', 'win']);
    expect(hole?.steps).toEqual(['jump 0-2', 'walk 2-3', 'win']);
    expect(flat?.steps).toEqual(['jump 0-2', 'walk 2-3', 'win']);
  });

  it('cúi: crouching moves 1 cell under the branch; jumping into it bumps and Măng stays', () => {
    const [crouch, jump] = demos(lessonById('w01-lesson-cui')).map(demoAnswer);
    expect(crouch?.steps).toEqual(['crouch 0-1', 'walk 1-2', 'walk 2-3', 'win']);
    expect(jump?.steps.slice(0, 1)).toEqual(['bump 0-1']);
    expect(jump?.key).toBe('crash:HIT_BRANCH@1');
  });

  it('đá: the kick knocks over the crate in front and Măng stays on cell 0', () => {
    const [kickOnly, kickThenWalk] = demos(lessonById('w01-lesson-da')).map(demoAnswer);
    expect(kickOnly?.steps).toEqual(['kick 1 hit']);
    expect(kickOnly?.key).toBe('stop@0');
    expect(kickThenWalk?.steps).toEqual(['kick 1 hit', 'walk 0-1', 'walk 1-2', 'walk 2-3', 'win']);
  });

  it('rẽ: a turn changes direction without moving; tiến moves after it', () => {
    const [forward, turn, both] = demos(lessonById('w01-lesson-re')).map(demoAnswer);
    expect(forward?.steps).toEqual(['move 1,1-1,2', 'move 1,2-1,3']);
    expect(turn?.steps).toEqual(['move 1,1-1,2', 'move 1,2-1,3', 'turn E-S']);
    expect(turn?.key).toBe('stop@1,3');
    expect(both?.steps.slice(2)).toEqual(['turn E-S', 'move 1,3-2,3', 'move 2,3-3,3', 'win']);
  });
});
