import { describe, expect, it } from 'vitest';
import type { Level, StoryChapter, World } from '@codequest/content-schema';
import { chapterStates, freshChapterIds, openingChapterIndex } from './index';
import { emptyProgress } from './progress';
import { makeLevel } from './testFixtures';
import type { LevelProgress } from './types';

// P2-24: chapters of the world's tale open as the child wins levels.

const chapter = (id: string, unlockAfter?: string): StoryChapter => ({
  id,
  title: id,
  lines: ['a', 'b'],
  ...(unlockAfter !== undefined && { unlockAfter }),
  art: { prop: 'wind' },
});

const world: World = {
  id: 'w01',
  order: 1,
  title: 'w01',
  emoji: '🎋',
  concept: 'c',
  story: 's',
  chapters: [
    chapter('intro'),
    chapter('two', 'l02'),
    chapter('three', 'l04'),
    chapter('end', 'boss'),
  ],
  theme: { tileset: 't' },
  lessonIds: ['lesson'],
  levelIds: ['l01', 'l02', 'l03', 'l04', 'boss'],
  unlock: { minStarRatio: 0.6 },
};

const levels = new Map<string, Level>(
  world.levelIds.map((id) => [id, makeLevel({ id, worldId: 'w01' })]),
);

function won(...ids: string[]): Map<string, LevelProgress> {
  return new Map(
    ids.map((id) => [
      id,
      { ...emptyProgress(id), bestStars: 1, completedAt: '2026-10-06T03:00:00Z' },
    ]),
  );
}

const unlocked = (progress: Map<string, LevelProgress>, lv = levels) =>
  chapterStates(world, { levels: lv, progress })
    .filter((s) => s.unlocked)
    .map((s) => s.chapter.id);

describe('chapterStates', () => {
  it('opens only chapter 1 for a new child', () => {
    expect(unlocked(new Map())).toEqual(['intro']);
  });

  it('opens a chapter once its level is won', () => {
    expect(unlocked(won('l01', 'l02'))).toEqual(['intro', 'two']);
    expect(unlocked(won('l01', 'l02', 'l03', 'l04', 'boss'))).toEqual([
      'intro',
      'two',
      'three',
      'end',
    ]);
  });

  it('does not count a level played but not won', () => {
    const progress = new Map([['l02', { ...emptyProgress('l02'), attempts: 4 }]]);
    expect(unlocked(progress)).toEqual(['intro']);
  });

  it('keeps story order: a later level won early does not skip a chapter', () => {
    expect(unlocked(won('l04'))).toEqual(['intro']);
    expect(unlocked(won('l02', 'boss'))).toEqual(['intro', 'two']);
  });

  it('does not block the tale on a retired or missing level', () => {
    const retired = new Map(levels);
    retired.set('l04', makeLevel({ id: 'l04', retired: true }));
    expect(unlocked(won('l02'), retired)).toEqual(['intro', 'two', 'three']);
    const missing = new Map(levels);
    missing.delete('l02');
    expect(unlocked(new Map(), missing)).toEqual(['intro', 'two']);
  });

  it('has no chapters for a world without a tale', () => {
    expect(
      chapterStates({ ...world, chapters: undefined }, { levels, progress: new Map() }),
    ).toEqual([]);
  });
});

describe('freshChapterIds and openingChapterIndex', () => {
  const states = chapterStates(world, { levels, progress: won('l02', 'l04') });

  it('lists open chapters not seen yet, never chapter 1', () => {
    expect(freshChapterIds(states, new Set())).toEqual(['two', 'three']);
    expect(freshChapterIds(states, new Set(['two']))).toEqual(['three']);
    expect(freshChapterIds(states, new Set(['two', 'three']))).toEqual([]);
  });

  it('opens on the first new chapter, else on the last open one', () => {
    expect(openingChapterIndex(states, ['two', 'three'])).toBe(1);
    expect(openingChapterIndex(states, ['three'])).toBe(2);
    expect(openingChapterIndex(states, [])).toBe(2);
    expect(openingChapterIndex([], [])).toBe(0);
  });
});
