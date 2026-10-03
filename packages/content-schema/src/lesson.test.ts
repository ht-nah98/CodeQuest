import { describe, expect, it } from 'vitest';
import { LessonSchema } from './lesson';

describe('LessonSchema.beforeLevel (block lessons)', () => {
  const lesson = {
    id: 'w01-lesson-nhay',
    worldId: 'w01-lang-tre',
    title: 'Khối nhảy',
    cards: [{ type: 'say', pose: 'point', text: 'Khối mới: nhảy!' }],
  };

  it('is optional: an opening lesson has none', () => {
    expect(LessonSchema.safeParse(lesson).success).toBe(true);
  });

  it('accepts a level id to show the lesson before', () => {
    const parsed = LessonSchema.parse({ ...lesson, beforeLevel: 'w01-l03' });
    expect(parsed.beforeLevel).toBe('w01-l03');
  });

  it('rejects an empty or non-string level id', () => {
    expect(LessonSchema.safeParse({ ...lesson, beforeLevel: '' }).success).toBe(false);
    expect(LessonSchema.safeParse({ ...lesson, beforeLevel: 3 }).success).toBe(false);
  });
});
