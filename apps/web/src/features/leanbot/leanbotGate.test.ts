import type { LeanbotLesson } from '@codequest/content-schema';
import { describe, expect, it } from 'vitest';
import { checkKey, checkKeysOf, gateLesson, gateState, isLessonOpen } from './leanbotGate';

function lesson(id: string, number: number, checks: (string | undefined)[]): LeanbotLesson {
  return {
    id,
    number,
    title: id,
    tagline: id,
    minutes: 10,
    goals: ['a', 'b', 'c'],
    screens: checks.map((check) => ({
      part: 'p',
      title: 't',
      lines: ['l'],
      ...(check === undefined ? {} : { check }),
    })),
    quiz: [{ q: 'q', options: ['a', 'b'], correct: 0, explain: 'e' }],
  };
}

const gate = lesson('bai-00', 0, ['tick one', undefined, 'tick two']);
const later = lesson('bai-01', 1, [undefined, 'its own tick']);
const course = [gate, later];

describe('checkKeysOf', () => {
  it('keys only the screens that have a tick, by screen index', () => {
    expect(checkKeysOf(gate)).toEqual([checkKey('bai-00', 0), checkKey('bai-00', 2)]);
  });

  it('keys a tick by its checkId, so it stays with its screen when screens are inserted', () => {
    const plain = { part: 'p', title: 't', lines: ['l'] };
    const moved: LeanbotLesson = {
      ...gate,
      // the tick that was on screen 2 now sits on screen 3, a new screen pushed it down
      screens: [
        { ...plain, check: 'tick one' },
        plain,
        plain,
        { ...plain, check: 'tick two', checkId: '2' },
      ],
    };
    expect(checkKeysOf(moved)).toEqual([checkKey('bai-00', 0), checkKey('bai-00', '2')]);
  });

  it('is empty for a lesson without ticks', () => {
    expect(checkKeysOf(lesson('bai-09', 9, [undefined]))).toEqual([]);
  });
});

describe('gateState', () => {
  it('counts the gate lesson ticks and stays shut while one is missing', () => {
    const ticked = new Set([checkKey('bai-00', 0)]);
    const state = gateState(course, (key) => ticked.has(key));
    expect(state).toEqual({ done: 1, total: 2, open: false });
  });

  it('opens once every tick of lesson 0 is set', () => {
    const state = gateState(course, () => true);
    expect(state).toEqual({ done: 2, total: 2, open: true });
  });

  it('ignores ticks that belong to other lessons', () => {
    const ticked = new Set([checkKey('bai-01', 1)]);
    expect(gateState(course, (key) => ticked.has(key)).open).toBe(false);
  });

  it('opens when the course has no lesson 0 at all, so a missing file cannot lock the course', () => {
    expect(gateState([later], () => false)).toEqual({ done: 0, total: 0, open: true });
  });
});

describe('isLessonOpen', () => {
  it('always lets lesson 0 itself through', () => {
    expect(
      isLessonOpen(
        gate,
        gateState(course, () => false),
      ),
    ).toBe(true);
  });

  it('holds back every later lesson until the gate opens', () => {
    expect(
      isLessonOpen(
        later,
        gateState(course, () => false),
      ),
    ).toBe(false);
    expect(
      isLessonOpen(
        later,
        gateState(course, () => true),
      ),
    ).toBe(true);
  });

  it('opens every lesson to the coach, with no tick set', () => {
    expect(
      isLessonOpen(
        later,
        gateState(course, () => false),
        true,
      ),
    ).toBe(true);
  });
});

describe('gateLesson', () => {
  it('finds the lesson numbered 0 wherever it sits in the list', () => {
    expect(gateLesson([later, gate])?.id).toBe('bai-00');
  });
});
