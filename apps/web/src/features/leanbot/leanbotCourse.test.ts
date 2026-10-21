import type { LeanbotLesson } from '@codequest/content-schema';
import { describe, expect, it } from 'vitest';
import { clampPage, findLesson, pageCount, progressOf, sortLessons } from './leanbotCourse';

const lesson = (number: number, screens: number): LeanbotLesson => ({
  id: `bai-${String(number).padStart(2, '0')}`,
  number,
  title: `Bài ${String(number)}`,
  tagline: 'tagline',
  minutes: 45,
  goals: ['a', 'b', 'c'],
  screens: Array.from({ length: screens }, (_, i) => ({
    part: 'phần',
    title: `màn ${String(i)}`,
    lines: ['một câu'],
  })),
  quiz: [{ q: 'hỏi', options: ['a', 'b'], correct: 0, explain: 'vì thế' }],
});

describe('sortLessons', () => {
  it('puts the lessons in number order whatever order the files load in', () => {
    const out = sortLessons([lesson(3, 1), lesson(0, 1), lesson(1, 1)]);
    expect(out.map((l) => l.number)).toEqual([0, 1, 3]);
  });

  it('does not mutate the array it is given', () => {
    const input = [lesson(2, 1), lesson(0, 1)];
    sortLessons(input);
    expect(input.map((l) => l.number)).toEqual([2, 0]);
  });
});

describe('findLesson', () => {
  it('finds by id and reports nothing for an unknown id', () => {
    const course = [lesson(0, 1), lesson(1, 1)];
    expect(findLesson(course, 'bai-01')?.number).toBe(1);
    expect(findLesson(course, 'bai-99')).toBeUndefined();
  });
});

describe('pageCount', () => {
  it('adds the goals page and the quiz page to the lesson screens', () => {
    expect(pageCount(lesson(0, 19))).toBe(21);
    expect(pageCount(lesson(0, 1))).toBe(3);
  });
});

describe('clampPage', () => {
  const L = lesson(0, 19); // 21 pages: 0…20

  it('keeps a page inside the lesson', () => {
    expect(clampPage(L, 0)).toBe(0);
    expect(clampPage(L, 20)).toBe(20);
  });

  it('pulls a hand-typed URL back inside', () => {
    expect(clampPage(L, 999)).toBe(20);
    expect(clampPage(L, -5)).toBe(0);
  });

  it('survives a page that is not a number', () => {
    expect(clampPage(L, Number.NaN)).toBe(0);
    expect(clampPage(L, Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('truncates a fractional page instead of rounding past the end', () => {
    expect(clampPage(L, 3.9)).toBe(3);
  });
});

describe('progressOf', () => {
  const L = lesson(0, 19);

  it('runs from empty on the first page to full on the quiz', () => {
    expect(progressOf(L, 0)).toBe(0);
    expect(progressOf(L, 20)).toBe(1);
  });

  it('is half way at the middle page', () => {
    expect(progressOf(L, 10)).toBeCloseTo(0.5, 5);
  });

  it('never leaves 0…1, whatever the route says', () => {
    expect(progressOf(L, -3)).toBe(0);
    expect(progressOf(L, 500)).toBe(1);
  });
});
