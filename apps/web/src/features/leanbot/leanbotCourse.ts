import { useEffect, useState } from 'react';
import {
  LeanbotLessonSchema,
  LeanbotLinksPageSchema,
  type LeanbotLesson,
  type LeanbotLinksPage,
} from '@codequest/content-schema';

// The Leanbot course (ADR-0028). Like the CodeQuest catalog, the lessons are JSON in
// content/, read once per page load through the '@content' alias and validated with zod.

// Lessons only: the folder also holds `duong-dan.json`, the links page, which is not a lesson.
const lessonFiles = import.meta.glob<unknown>('@content/leanbot/bai-*.json', { import: 'default' });
const linksFile = import.meta.glob<unknown>('@content/leanbot/duong-dan.json', {
  import: 'default',
});

/** Pictures live in public/leanbot/img; a lesson stores only the file name. */
export const LEANBOT_IMG = '/leanbot/img/';

/** Reading order: by lesson number, so a new file drops into place by its number alone. */
export function sortLessons(lessons: readonly LeanbotLesson[]): LeanbotLesson[] {
  return [...lessons].sort((a, b) => a.number - b.number);
}

export function findLesson(
  lessons: readonly LeanbotLesson[],
  id: string,
): LeanbotLesson | undefined {
  return lessons.find((l) => l.id === id);
}

/**
 * Screens of a lesson, plus the two the player adds: the goals up front and the quiz at the
 * end. Returned as a count because the route carries the index.
 */
export function pageCount(lesson: LeanbotLesson): number {
  return lesson.screens.length + 2;
}

/** Clamps a route's page number so a hand-typed URL cannot land outside the lesson. */
export function clampPage(lesson: LeanbotLesson, page: number): number {
  if (!Number.isFinite(page)) return 0;
  return Math.max(0, Math.min(Math.trunc(page), pageCount(lesson) - 1));
}

/** How far through the lesson the bar should be, 0…1. */
export function progressOf(lesson: LeanbotLesson, page: number): number {
  return clampPage(lesson, page) / (pageCount(lesson) - 1);
}

export async function loadLeanbotCourse(): Promise<LeanbotLesson[]> {
  const lessons = await Promise.all(
    Object.values(lessonFiles).map(async (load) => LeanbotLessonSchema.parse(await load())),
  );
  return sortLessons(lessons);
}

export interface CourseState {
  lessons: LeanbotLesson[] | null;
  failed: boolean;
}

/** Reads the course once per mount; the files are bundled, so this only ever fails on a bug. */
export function useLeanbotCourse(): CourseState {
  const [state, setState] = useState<CourseState>({ lessons: null, failed: false });

  useEffect(() => {
    let alive = true;
    loadLeanbotCourse()
      .then((lessons) => {
        if (alive) setState({ lessons, failed: false });
      })
      .catch(() => {
        if (alive) setState({ lessons: null, failed: true });
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

/** The course's page of links (`content/leanbot/duong-dan.json`), validated like a lesson. */
export async function loadLeanbotLinks(): Promise<LeanbotLinksPage> {
  const load = Object.values(linksFile)[0];
  if (load === undefined) throw new Error('content/leanbot/duong-dan.json is missing');
  return LeanbotLinksPageSchema.parse(await load());
}

export interface LinksState {
  page: LeanbotLinksPage | null;
  failed: boolean;
}

export function useLeanbotLinks(): LinksState {
  const [state, setState] = useState<LinksState>({ page: null, failed: false });

  useEffect(() => {
    let alive = true;
    loadLeanbotLinks()
      .then((page) => {
        if (alive) setState({ page, failed: false });
      })
      .catch(() => {
        if (alive) setState({ page: null, failed: true });
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
