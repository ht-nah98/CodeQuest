import type { Level, StoryChapter, World } from '@codequest/content-schema';
import type { LevelProgress } from './types';

// The world's tale in chapters (P2-24, screens-and-flows.md §6 "Truyện của thế giới"): which
// chapters are open, which ones the child has not read yet, which page the book opens on.

export interface ChapterState {
  chapter: StoryChapter;
  /** 0-based position in `world.chapters`. */
  index: number;
  unlocked: boolean;
}

export interface ChapterContext {
  levels: ReadonlyMap<string, Level>;
  progress: ReadonlyMap<string, LevelProgress>;
}

/**
 * Every chapter of the world with its lock state. Chapter 1 is always open; chapter n opens
 * once chapter n − 1 is open and `unlockAfter` is won (`completedAt` set). An unlock level that
 * is gone or retired no longer blocks the tale. Coach overrides open levels, not chapters: the
 * story follows what the child actually won.
 */
export function chapterStates(world: World, ctx: ChapterContext): ChapterState[] {
  let open = true;
  return (world.chapters ?? []).map((chapter, index) => {
    const after = chapter.unlockAfter;
    if (index > 0 && after !== undefined) {
      const level = ctx.levels.get(after);
      const gone = level === undefined || level.retired === true;
      const completedAt = ctx.progress.get(after)?.completedAt;
      open = open && (gone || (completedAt !== undefined && completedAt !== null));
    }
    return { chapter, index, unlocked: open };
  });
}

/**
 * Open chapters the child has not seen on the world page yet ("Chương mới!"), in story order.
 * Chapter 1 is the world's opening and never counts as new.
 */
export function freshChapterIds(
  states: readonly ChapterState[],
  seen: ReadonlySet<string>,
): string[] {
  return states
    .filter((s) => s.unlocked && s.index > 0 && !seen.has(s.chapter.id))
    .map((s) => s.chapter.id);
}

/** The page the book opens on: the first new chapter, else the last open one (0 if none). */
export function openingChapterIndex(
  states: readonly ChapterState[],
  fresh: readonly string[],
): number {
  const first = states.find((s) => fresh.includes(s.chapter.id));
  if (first !== undefined) return first.index;
  return states.filter((s) => s.unlocked).at(-1)?.index ?? 0;
}
