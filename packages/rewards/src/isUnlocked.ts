import type { Level, LevelStage, World } from '@codequest/content-schema';
import { WORLD_UNLOCK } from './config';
import type { LevelProgress } from './types';

export interface UnlockContext {
  worlds: Map<string, World>;
  levels: Map<string, Level>;
  progress: Map<string, LevelProgress>;
  lessonsDone: Set<string>;
  /** Bonus level ids bought in the shop. */
  bonusOwned: Set<string>;
  /** World or level ids the coach opened by hand. */
  overrides: Set<string>;
}

export type UnlockTarget = { worldId: string } | { levelId: string };

const COUNTED_STAGES: readonly LevelStage[] = WORLD_UNLOCK.countedStages;

/** Live (not retired) levels of a world, in map order. */
function worldLevels(world: World, ctx: UnlockContext): Level[] {
  return world.levelIds
    .map((id) => ctx.levels.get(id))
    .filter((level): level is Level => level !== undefined && level.retired !== true);
}

function isDone(levelId: string, ctx: UnlockContext): boolean {
  const completedAt = ctx.progress.get(levelId)?.completedAt;
  return completedAt !== undefined && completedAt !== null;
}

/** Every live boss of the world beaten; a world without a live boss is never cleared. */
function bossBeaten(levels: readonly Level[], ctx: UnlockContext): boolean {
  const bosses = levels.filter((l) => l.stage === 'boss');
  return bosses.length > 0 && bosses.every((l) => isDone(l.id, ctx));
}

/** Boss beaten and enough stars on guided + practice + boss (rewards-economy.md §3). */
function worldCleared(world: World, ctx: UnlockContext): boolean {
  const levels = worldLevels(world, ctx);
  if (!bossBeaten(levels, ctx)) return false;
  const counted = levels.filter((l) => COUNTED_STAGES.includes(l.stage));
  const stars = counted.reduce((sum, l) => sum + (ctx.progress.get(l.id)?.bestStars ?? 0), 0);
  // Round away float noise (0.6 * 3 * 3 = 5.3999…) before taking the whole-star threshold.
  const needed = Math.ceil(Number((world.unlock.minStarRatio * counted.length * 3).toFixed(6)));
  return stars >= needed;
}

function isWorldUnlocked(worldId: string, ctx: UnlockContext): boolean {
  if (ctx.overrides.has(worldId)) return true;
  const world = ctx.worlds.get(worldId);
  if (world === undefined) return false;
  if (world.order === 1) return true;
  const previous = [...ctx.worlds.values()].find((w) => w.order === world.order - 1);
  return previous !== undefined && worldCleared(previous, ctx);
}

function isLevelUnlocked(levelId: string, ctx: UnlockContext): boolean {
  const level = ctx.levels.get(levelId);
  // Retired wins over a coach override: the level is gone from the map.
  if (level === undefined || level.retired === true) return false;
  if (ctx.overrides.has(levelId)) return true;
  const world = ctx.worlds.get(level.worldId);
  if (world === undefined || !isWorldUnlocked(world.id, ctx)) return false;
  const levels = worldLevels(world, ctx);
  const allDone = (stages: readonly LevelStage[]): boolean =>
    levels.filter((l) => stages.includes(l.stage)).every((l) => isDone(l.id, ctx));

  switch (level.stage) {
    case 'creative':
      return true;
    case 'guided':
    case 'practice': {
      // The chain skips optional stages: a challenge never blocks the next practice level.
      const chain = levels.filter((l) => l.stage === 'guided' || l.stage === 'practice');
      const index = chain.findIndex((l) => l.id === level.id);
      const previous = chain[index - 1];
      if (previous !== undefined) return isDone(previous.id, ctx);
      const firstLesson = world.lessonIds[0];
      return firstLesson === undefined || ctx.lessonsDone.has(firstLesson);
    }
    case 'challenge':
      return allDone(['practice']);
    case 'boss':
      return allDone(['guided', 'practice']);
    case 'bonus':
      return ctx.bonusOwned.has(level.id) && bossBeaten(levels, ctx);
  }
}

/**
 * Whether a world or level is open for the child (rewards-economy.md §3). Coach overrides
 * open the target itself; retired or unknown ids are locked, even when overridden.
 */
export function isUnlocked(target: UnlockTarget, ctx: UnlockContext): boolean {
  return 'worldId' in target
    ? isWorldUnlocked(target.worldId, ctx)
    : isLevelUnlocked(target.levelId, ctx);
}
