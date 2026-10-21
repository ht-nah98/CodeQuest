import type { LeanbotLesson } from '@codequest/content-schema';

// Lesson 0 is the setup lesson: charging, the two USB ports, making the computer see the robot,
// uploading the test program and trying every part of it. Every later lesson ends with code on a
// real robot, so a child who has not got that far would only be dragging blocks that do nothing.
// The gate is therefore the tick boxes of lesson 0: all of them, then the rest of the course
// opens. The ticks are the child's own notes in this browser (ADR-0028), so this is a reminder
// with teeth, not an exam.

const PREFIX = 'cq.leanbot.check.';

/** Storage key of one tick box; the screen index is the one the route uses. */
export function checkKey(lessonId: string, index: number): string {
  return `${PREFIX}${lessonId}.${String(index)}`;
}

/** Keys of every tick box in a lesson, in screen order. */
export function checkKeysOf(lesson: LeanbotLesson): string[] {
  return lesson.screens.flatMap((screen, i) =>
    screen.check === undefined ? [] : [checkKey(lesson.id, i)],
  );
}

/** Reads one tick. Storage can be blocked or cleared, which reads as "not ticked". */
export function isTicked(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

export function setTicked(key: string, on: boolean): void {
  try {
    if (on) localStorage.setItem(key, '1');
    else localStorage.removeItem(key);
  } catch {
    // Storage can be blocked; the tick still works for this visit.
  }
}

/** The lesson that gates the others: the one numbered 0. */
export function gateLesson(lessons: readonly LeanbotLesson[]): LeanbotLesson | undefined {
  return lessons.find((lesson) => lesson.number === 0);
}

export interface GateState {
  /** How many of the gate lesson's ticks are set, and how many there are. */
  done: number;
  total: number;
  open: boolean;
}

/** Takes the reader so the rule itself stays a pure function and can be tested on Node. */
export function gateState(
  lessons: readonly LeanbotLesson[],
  ticked: (key: string) => boolean = isTicked,
): GateState {
  const gate = gateLesson(lessons);
  if (!gate) return { done: 0, total: 0, open: true };
  const keys = checkKeysOf(gate);
  const done = keys.filter((key) => ticked(key)).length;
  return { done, total: keys.length, open: done === keys.length };
}

/** Lesson 0 is always open; the rest wait for its ticks. */
export function isLessonOpen(lesson: LeanbotLesson, gate: GateState): boolean {
  return lesson.number === 0 || gate.open;
}
