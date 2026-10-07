import type { Level, StoryChapter, World } from '@codequest/content-schema';
import { describe, expect, it } from 'vitest';
import { checkStory } from './story';

// Rule 21 (P2-24): the chapters of a world's tale.

const STAGES: Record<string, Level['stage']> = {
  'w01-l01': 'guided',
  'w01-l02': 'practice',
  'w01-l03': 'challenge',
  'w01-boss': 'boss',
  'w01-creative': 'creative',
};
const levelOf = (id: string): Level | undefined =>
  STAGES[id] === undefined ? undefined : ({ id, stage: STAGES[id] } as Level);

const chapter = (id: string, unlockAfter?: string): StoryChapter => ({
  id,
  title: 'Gió to',
  lines: ['Gió thổi bay măng của làng.', 'Măng đi nhặt lại.'],
  ...(unlockAfter !== undefined && { unlockAfter }),
  art: { prop: 'wind' },
});

const world = (chapters: StoryChapter[]): World => ({
  id: 'w01-lang-tre',
  order: 1,
  title: 'Làng Tre',
  emoji: '🎋',
  concept: 'Tuần tự',
  story: 's',
  chapters,
  theme: { tileset: '/tiles/ground.png' },
  lessonIds: ['w01-lesson'],
  levelIds: Object.keys(STAGES),
  unlock: { minStarRatio: 0.6 },
});

const messages = (chapters: StoryChapter[]) =>
  checkStory('worlds/w01-lang-tre/world.json', world(chapters), levelOf).map((issue) => {
    expect(issue.rule).toBe(21);
    return issue.message;
  });

describe('checkStory (rule 21)', () => {
  it('accepts chapters that open in order after path levels', () => {
    expect(messages([chapter('a'), chapter('b', 'w01-l02'), chapter('c', 'w01-boss')])).toEqual([]);
  });

  it('accepts a world without chapters', () => {
    expect(checkStory('p', { ...world([]), chapters: undefined }, levelOf)).toEqual([]);
  });

  it('wants chapter 1 open and every later chapter behind a level', () => {
    expect(messages([chapter('a', 'w01-l01'), chapter('b')])).toEqual([
      'chapter "a" is the first chapter and must not set unlockAfter',
      'chapter "b" needs unlockAfter (only the first chapter is open from the start)',
    ]);
  });

  it('rejects levels of another world, optional stages and the wrong order', () => {
    expect(
      messages([
        chapter('a'),
        chapter('b', 'w02-l01'),
        chapter('c', 'w01-l03'),
        chapter('d', 'w01-creative'),
        chapter('e', 'w01-l02'),
        chapter('f', 'w01-l02'),
      ]),
    ).toEqual([
      'chapter "b" unlockAfter "w02-l01" is not in the levelIds of w01-lang-tre',
      'chapter "c" unlockAfter "w01-l03" is a challenge level; use a guided, practice or boss level',
      'chapter "d" unlockAfter "w01-creative" is a creative level; use a guided, practice or boss level',
      'chapter "e" unlockAfter "w01-l02" must come after the previous chapter\'s level',
      'chapter "f" unlockAfter "w01-l02" must come after the previous chapter\'s level',
    ]);
  });

  it('rejects a retired unlock level', () => {
    const retired = (id: string): Level | undefined =>
      id === 'w01-l02' ? ({ id, stage: 'practice', retired: true } as Level) : levelOf(id);
    const issues = checkStory('p', world([chapter('a'), chapter('b', 'w01-l02')]), retired);
    expect(issues.map((issue) => issue.message)).toEqual([
      'chapter "b" unlockAfter "w01-l02" is retired',
    ]);
  });

  it('checks unique ids, copy length and missing glyphs', () => {
    expect(
      messages([
        { ...chapter('a'), title: 'Một hai ba bốn năm sáu' },
        {
          ...chapter('a', 'w01-l01'),
          lines: ['Một hai ba bốn năm sáu bảy tám chín mười mười một mười hai.', 'Đúng ✔'],
        },
      ]),
    ).toEqual([
      'chapter "a" title has 6 words; max 5',
      'chapter "a" appears twice',
      'chapter "a" line 1 has 14 words; max 12',
      'chapter "a" uses ✔/✘ marks, which the fonts cannot draw; write the words',
    ]);
  });
});
