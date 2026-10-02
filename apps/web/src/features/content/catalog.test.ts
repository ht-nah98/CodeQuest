import { describe, expect, it } from 'vitest';
import type { Level, World } from '@codequest/content-schema';
import type { LevelProgress } from '@codequest/rewards';
import {
  type Catalog,
  currentWorldId,
  levelViews,
  loadCatalog,
  nextLevelId,
  canOpenLesson,
  canOpenLevel,
  firstPlayableLevelId,
  pendingLessonId,
  worldViews,
} from './catalog';
import { SANDBOX_WORLD_ID } from './sandbox';

/** A mode the schema might gain before the play screen supports it (every real one is, P1-06). */
const FUTURE_MODE = 'future' as string as Level['mode'];

const world = (id: string, order: number, levelIds: string[], lessonIds: string[] = []): World => ({
  id,
  order,
  title: id,
  emoji: '-',
  concept: 'c',
  story: 's',
  theme: { tileset: '/tiles/ground.png' },
  lessonIds,
  levelIds,
  unlock: { minStarRatio: 0.6 },
});

const level = (id: string, worldId: string, stage: Level['stage'] = 'guided'): Level => ({
  id,
  worldId,
  stage,
  kind: 'runner',
  mode: 'build',
  title: id,
  objective: 'o',
  learningGoal: 'g',
  toolbox: [],
  config: {},
  hints: [],
});

const done = (levelId: string, bestStars: 0 | 1 | 2 | 3 = 3): LevelProgress => ({
  levelId,
  bestStars,
  bestBlocks: 2,
  completedAt: '2026-10-01T00:00:00Z',
  firstTryWin: false,
  attempts: 1,
});

function catalogOf(worlds: World[], levels: Level[]): Catalog {
  return {
    worlds,
    worldById: new Map(worlds.map((w) => [w.id, w])),
    levels: new Map(levels.map((l) => [l.id, l])),
    lessons: new Map(),
  };
}

const w1 = world('w01-a', 1, ['w01-l01', 'w01-l02', 'w01-boss'], ['w01-lesson']);
const w2 = world('w02-b', 2, ['w02-l01']);
const catalog = catalogOf(
  [w1, w2],
  [
    level('w01-l01', 'w01-a'),
    level('w01-l02', 'w01-a', 'practice'),
    level('w01-boss', 'w01-a', 'boss'),
    level('w02-l01', 'w02-b'),
  ],
);
const child = (progress: LevelProgress[] = [], lessons: string[] = []) => ({
  progress: new Map(progress.map((p) => [p.levelId, p])),
  lessonsDone: new Set(lessons),
  overrides: new Set<string>(),
});

describe('catalog views', () => {
  it('the first level waits for the first lesson', () => {
    expect(levelViews(catalog, w1, child()).map((v) => v.status)).toEqual([
      'locked',
      'locked',
      'locked',
    ]);
    expect(pendingLessonId(w1, new Set())).toBe('w01-lesson');
    expect(levelViews(catalog, w1, child([], ['w01-lesson']))[0]?.status).toBe('open');
    expect(pendingLessonId(w1, new Set(['w01-lesson']))).toBeNull();
  });

  it('levels open one after the other and keep their stars', () => {
    const views = levelViews(catalog, w1, child([done('w01-l01', 2)], ['w01-lesson']));
    expect(views.map((v) => [v.status, v.stars])).toEqual([
      ['done', 2],
      ['open', 0],
      ['locked', 0],
    ]);
  });

  it('a world is done after its boss, which opens the next one', () => {
    const all = child([done('w01-l01'), done('w01-l02'), done('w01-boss')], ['w01-lesson']);
    const views = worldViews(catalog, all);
    expect(views.map((v) => v.status)).toEqual(['done', 'open']);
    expect(views[0]).toMatchObject({ stars: 9, maxStars: 9, levelsDone: 3, levelCount: 3 });
    expect(currentWorldId(views)).toBe('w02-b');
    expect(currentWorldId(worldViews(catalog, child()))).toBe('w01-a');
  });

  it('a level whose mode is not playable yet is "soon", never open', () => {
    const predict = { ...level('w01-l02', 'w01-a', 'practice'), mode: FUTURE_MODE };
    const withPredict = catalogOf(
      [w1, w2],
      [...catalog.levels.values()].map((l) => (l.id === predict.id ? predict : l)),
    );
    const views = levelViews(withPredict, w1, child([done('w01-l01')], ['w01-lesson']));
    expect(views[1]?.status).toBe('soon');
  });

  it('next level in map order', () => {
    const started = child([done('w01-l01')], ['w01-lesson']);
    expect(nextLevelId(catalog, 'w01-l01', started)).toBe('w01-l02');
    // The boss waits for every guided + practice level: not offered yet.
    expect(nextLevelId(catalog, 'w01-l02', started)).toBeNull();
    expect(nextLevelId(catalog, 'w01-boss', started)).toBeNull();
    expect(nextLevelId(catalog, 'nope', started)).toBeNull();
  });

  it('skips levels whose mode is not playable yet; URL guards', () => {
    const predict = { ...level('w01-l02', 'w01-a', 'practice'), mode: FUTURE_MODE };
    const withPredict = catalogOf(
      [w1, w2],
      [...catalog.levels.values()].map((l) => (l.id === predict.id ? predict : l)),
    );
    const started = child([done('w01-l01')], ['w01-lesson']);
    // w01-l02 is "soon": Màn tiếp looks past it, to the boss (still locked here).
    expect(nextLevelId(withPredict, 'w01-l01', started)).toBeNull();
    expect(canOpenLevel(withPredict, 'w01-l02', started)).toBe(false);
    expect(canOpenLevel(catalog, 'w01-l01', child())).toBe(false);
    expect(canOpenLevel(catalog, 'w01-l01', child([], ['w01-lesson']))).toBe(true);
    // Done counts as open, whatever the chain says.
    expect(canOpenLevel(catalog, 'w02-l01', child([done('w02-l01')]))).toBe(true);
    expect(firstPlayableLevelId(catalog, w1, child([], ['w01-lesson']))).toBe('w01-l01');
    expect(firstPlayableLevelId(catalog, w1, child())).toBeNull();
  });

  it('lessons open by URL only inside a world the child has reached', () => {
    const withLessons: Catalog = {
      ...catalog,
      lessons: new Map([
        ['w01-lesson', { id: 'w01-lesson', worldId: 'w01-a', title: 't', cards: [] }],
        ['w02-lesson', { id: 'w02-lesson', worldId: 'w02-b', title: 't', cards: [] }],
      ]),
    };
    expect(canOpenLesson(withLessons, 'w01-lesson', child())).toBe(true);
    expect(canOpenLesson(withLessons, 'w02-lesson', child())).toBe(false);
    expect(canOpenLesson(withLessons, 'nope', child())).toBe(false);
  });
});

describe('loadCatalog', () => {
  it('loads world 1 and, in dev, the sandbox world last', async () => {
    const loaded = await loadCatalog();
    expect(loaded.worlds[0]?.id).toBe('w01-lang-tre');
    expect(loaded.worlds.at(-1)?.id).toBe(SANDBOX_WORLD_ID);
    const sandbox = loaded.worldById.get(SANDBOX_WORLD_ID);
    expect(sandbox?.lessonIds).toContain('lesson-sample');
    expect(sandbox?.levelIds).toEqual(expect.arrayContaining(['flow-01', 'flow-02']));
    expect(loaded.levels.get('w01-l03')?.worldId).toBe('w01-lang-tre');
    expect(loaded.lessons.get('lesson-sample')?.cards.length).toBeGreaterThan(0);
    // Every mode is playable since P1-06: the sandbox lists one sample level of each.
    expect(sandbox?.levelIds).toEqual(
      expect.arrayContaining(['maze-predict', 'maze-bughunt', 'runner-parsons', 'maze-creative']),
    );
  });
});
