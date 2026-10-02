import { useEffect, useState } from 'react';
import {
  LessonSchema,
  LevelSchema,
  type Lesson,
  type Level,
  type World,
} from '@codequest/content-schema';
import { isUnlocked, type LevelProgress, type UnlockContext } from '@codequest/rewards';
import { lessonFiles, levelFiles, loadWorld, worldFiles } from './files';
import { isModeSupported } from './modes';
import { SANDBOX_WORLD_ID } from './sandbox';

// The whole curriculum for the map and world pages (play loads one level: loadPlayContent).
// Content is small (≤ 200 levels), so it is read once per page load and cached.

export interface Catalog {
  /** Map order; the dev sandbox world (dev builds only) comes last. */
  worlds: World[];
  worldById: Map<string, World>;
  levels: Map<string, Level>;
  lessons: Map<string, Lesson>;
}

const worldIdOf = (path: string): string => path.replace(/^.*\/worlds\/([^/]+)\/.*$/, '$1');

async function readCatalog(): Promise<Catalog> {
  const worldIds = [
    ...Object.keys(worldFiles).map(worldIdOf),
    ...(import.meta.env.DEV ? [SANDBOX_WORLD_ID] : []),
  ];
  const [worlds, levels, lessons] = await Promise.all([
    Promise.all(worldIds.map((id) => loadWorld(id))),
    Promise.all(Object.values(levelFiles).map(async (load) => LevelSchema.parse(await load()))),
    Promise.all(Object.values(lessonFiles).map(async (load) => LessonSchema.parse(await load()))),
  ]);
  const levelById = new Map(levels.map((l) => [l.id, l]));
  // The dev sandbox only lists levels the play screen can run (modes.ts), so its chain of
  // levels never waits on one that cannot be finished yet.
  const shown = worlds.map((w) =>
    w.id === SANDBOX_WORLD_ID
      ? {
          ...w,
          levelIds: w.levelIds.filter((id) => {
            const level = levelById.get(id);
            return level !== undefined && isModeSupported(level.mode);
          }),
        }
      : w,
  );
  const sorted = [...shown].sort((a, b) => {
    const rank = (w: World) => (w.id === SANDBOX_WORLD_ID ? Number.MAX_SAFE_INTEGER : w.order);
    return rank(a) - rank(b);
  });
  return {
    worlds: sorted,
    worldById: new Map(sorted.map((w) => [w.id, w])),
    levels: new Map(levels.map((l) => [l.id, l])),
    lessons: new Map(lessons.map((l) => [l.id, l])),
  };
}

let cached: Promise<Catalog> | null = null;

/** The catalog, loaded once. A failed load is not cached, so a reload of the page retries. */
export function loadCatalog(): Promise<Catalog> {
  cached ??= readCatalog().catch((error: unknown) => {
    cached = null;
    throw error;
  });
  return cached;
}

export type CatalogState =
  { status: 'loading' } | { status: 'ready'; catalog: Catalog } | { status: 'error' };

export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({ status: 'loading' });
  useEffect(() => {
    let live = true;
    loadCatalog().then(
      (catalog) => {
        if (live) setState({ status: 'ready', catalog });
      },
      () => {
        if (live) setState({ status: 'error' });
      },
    );
    return () => {
      live = false;
    };
  }, []);
  return state;
}

// ---- Views of the catalog for one child (pure; tested in catalog.test.ts) ----

export interface ChildState {
  progress: Map<string, LevelProgress>;
  lessonsDone: Set<string>;
  /** World or level ids opened without earning them: dev sandbox, author `?unlock=all`. */
  overrides: Set<string>;
}

export function unlockContext(catalog: Catalog, child: ChildState): UnlockContext {
  return {
    worlds: catalog.worldById,
    levels: catalog.levels,
    progress: child.progress,
    lessonsDone: child.lessonsDone,
    bonusOwned: new Set(),
    overrides: child.overrides,
  };
}

/** Every world and level id: what author mode `?unlock=all` opens. */
export function allIds(catalog: Catalog): string[] {
  return [...catalog.worldById.keys(), ...catalog.levels.keys()];
}

/** The live (not retired) levels of a world in map order. */
export function worldLevels(catalog: Catalog, world: World): Level[] {
  return world.levelIds
    .map((id) => catalog.levels.get(id))
    .filter((level): level is Level => level !== undefined && level.retired !== true);
}

/** `soon`: its mode is not playable yet (modes.ts), shown locked with a "chưa làm" tag. */
export type LevelStatus = 'locked' | 'open' | 'done' | 'soon';

export interface LevelView {
  level: Level;
  status: LevelStatus;
  stars: 0 | 1 | 2 | 3;
}

export function levelViews(catalog: Catalog, world: World, child: ChildState): LevelView[] {
  const ctx = unlockContext(catalog, child);
  return worldLevels(catalog, world).map((level) => {
    const progress = child.progress.get(level.id);
    const done = progress?.completedAt != null;
    const open = done || isUnlocked({ levelId: level.id }, ctx);
    const status: LevelStatus = !isModeSupported(level.mode)
      ? 'soon'
      : done
        ? 'done'
        : open
          ? 'open'
          : 'locked';
    return { level, status, stars: progress?.bestStars ?? 0 };
  });
}

export type WorldStatus = 'locked' | 'open' | 'done';

export interface WorldView {
  world: World;
  status: WorldStatus;
  stars: number;
  /** guided + practice + boss levels × 3 (the stars that count to open the next world). */
  maxStars: number;
  levelsDone: number;
  levelCount: number;
}

const COUNTED = new Set(['guided', 'practice', 'boss']);

export function worldViews(catalog: Catalog, child: ChildState): WorldView[] {
  const ctx = unlockContext(catalog, child);
  return catalog.worlds.map((world) => {
    const levels = worldLevels(catalog, world);
    const counted = levels.filter((l) => COUNTED.has(l.stage));
    const stars = counted.reduce((sum, l) => sum + (child.progress.get(l.id)?.bestStars ?? 0), 0);
    const levelsDone = levels.filter((l) => child.progress.get(l.id)?.completedAt != null).length;
    const open = isUnlocked({ worldId: world.id }, ctx);
    const boss = levels.filter((l) => l.stage === 'boss');
    const bossDone =
      boss.length > 0 && boss.every((l) => child.progress.get(l.id)?.completedAt != null);
    return {
      world,
      status: !open ? 'locked' : bossDone ? 'done' : 'open',
      stars,
      maxStars: counted.length * 3,
      levelsDone,
      levelCount: levels.length,
    };
  });
}

/** Where Măng stands on the map: the last open world that is not done yet (else the last open). */
export function currentWorldId(views: readonly WorldView[]): string | null {
  const real = views.filter((v) => v.world.id !== SANDBOX_WORLD_ID);
  const open = real.filter((v) => v.status !== 'locked');
  return (open.find((v) => v.status === 'open') ?? open.at(-1))?.world.id ?? null;
}

/**
 * "Màn tiếp": the level after `levelId` in its world's map order, skipping levels whose mode is
 * not playable yet; null unless the child can open it (open or done).
 */
export function nextLevelId(catalog: Catalog, levelId: string, child: ChildState): string | null {
  const level = catalog.levels.get(levelId);
  const world = level && catalog.worldById.get(level.worldId);
  if (!world) return null;
  const views = levelViews(catalog, world, child);
  const index = views.findIndex((v) => v.level.id === levelId);
  const next = views.slice(index + 1).find((v) => v.status !== 'soon');
  return next && (next.status === 'open' || next.status === 'done') ? next.level.id : null;
}

/** "Vào chơi" after a lesson: the first open level of the world, else the first done one. */
export function firstPlayableLevelId(
  catalog: Catalog,
  world: World,
  child: ChildState,
): string | null {
  const views = levelViews(catalog, world, child);
  return (
    (views.find((v) => v.status === 'open') ?? views.find((v) => v.status === 'done'))?.level.id ??
    null
  );
}

/** Whether the child may open this level by URL: unlocked or already done, playable mode. */
export function canOpenLevel(catalog: Catalog, levelId: string, child: ChildState): boolean {
  const level = catalog.levels.get(levelId);
  const world = level && catalog.worldById.get(level.worldId);
  if (!world) return false;
  const view = levelViews(catalog, world, child).find((v) => v.level.id === levelId);
  return view?.status === 'open' || view?.status === 'done';
}

/** Lessons are always open (rewards-economy.md §3), inside a world the child can enter. */
export function canOpenLesson(catalog: Catalog, lessonId: string, child: ChildState): boolean {
  const lesson = catalog.lessons.get(lessonId);
  return lesson !== undefined && isUnlocked({ worldId: lesson.worldId }, unlockContext(catalog, child));
}

/** First lesson the child has not finished yet, or null when all are done. */
export function pendingLessonId(world: World, lessonsDone: ReadonlySet<string>): string | null {
  return world.lessonIds.find((id) => !lessonsDone.has(id)) ?? null;
}
