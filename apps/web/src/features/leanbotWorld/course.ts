import { useEffect, useState } from 'react';
import { LeanbotWorldLessonSchema, type LeanbotWorldLesson } from '@codequest/content-schema';

// Thế giới Leanbot lessons (ADR-0030): JSON in content/leanbot-world/, read once per page load
// through the '@content' alias and validated with zod, like the Leanbot course.

const lessonFiles = import.meta.glob<unknown>('@content/leanbot-world/*.json', {
  import: 'default',
});

export async function loadLeanbotWorld(): Promise<LeanbotWorldLesson[]> {
  const lessons = await Promise.all(
    Object.values(lessonFiles).map(async (load) => LeanbotWorldLessonSchema.parse(await load())),
  );
  return lessons.sort((a, b) => a.number - b.number);
}

export interface WorldState {
  lessons: LeanbotWorldLesson[] | null;
  failed: boolean;
}

export function useLeanbotWorld(): WorldState {
  const [state, setState] = useState<WorldState>({ lessons: null, failed: false });
  useEffect(() => {
    let alive = true;
    loadLeanbotWorld()
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

/** Page 0 is "Học xong con làm được…", then one page per screen, then "Xong bài". */
export function pageCount(lesson: LeanbotWorldLesson): number {
  return lesson.screens.length + 2;
}

export function clampPage(lesson: LeanbotWorldLesson, page: number): number {
  if (!Number.isFinite(page)) return 0;
  return Math.max(0, Math.min(Math.trunc(page), pageCount(lesson) - 1));
}

// Progress is a mark per screen in this browser, like the Leanbot course's ticks (ADR-0028):
// the lessons are marked done, there are no stars or coins (coach, 23/10/2026).
const PREFIX = 'cq.lbworld.done.';

export function doneKey(lessonId: string, screenId: string): string {
  return `${PREFIX}${lessonId}.${screenId}`;
}

export function isDone(lessonId: string, screenId: string): boolean {
  try {
    return localStorage.getItem(doneKey(lessonId, screenId)) === '1';
  } catch {
    return false;
  }
}

export function markDone(lessonId: string, screenId: string): void {
  try {
    localStorage.setItem(doneKey(lessonId, screenId), '1');
  } catch {
    // Storage can be blocked; the screen still counts for this visit.
  }
}

export function doneCount(lesson: LeanbotWorldLesson): number {
  return lesson.screens.filter((s) => isDone(lesson.id, s.id)).length;
}
