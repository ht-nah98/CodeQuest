import { describe, expect, it } from 'vitest';
import { streak } from './index';
import { entry, vnNoon } from './testFixtures';

const daily = (day: string) => entry(`daily:${day}`, { reason: 'daily', delta: 10, localDay: day });
const days = (...list: string[]) => list.map(daily);

describe('streak', () => {
  it('is zero without learning days', () => {
    expect(streak([], vnNoon('2026-03-10'))).toEqual({ current: 0, best: 0 });
  });

  it('counts consecutive learning days ending today', () => {
    const ledger = days('2026-03-08', '2026-03-09', '2026-03-10');
    expect(streak(ledger, vnNoon('2026-03-10'))).toEqual({ current: 3, best: 3 });
  });

  it('stays alive today when the last learning day was yesterday', () => {
    const ledger = days('2026-03-08', '2026-03-09');
    expect(streak(ledger, vnNoon('2026-03-10'))).toEqual({ current: 2, best: 2 });
  });

  it('breaks when one day is skipped', () => {
    const ledger = days('2026-03-07', '2026-03-08', '2026-03-09');
    expect(streak(ledger, vnNoon('2026-03-11')).current).toBe(0);
    const resumed = [...ledger, daily('2026-03-11')];
    expect(streak(resumed, vnNoon('2026-03-11'))).toEqual({ current: 1, best: 3 });
  });

  it('only counts daily lines, once per day, and ignores future days', () => {
    const ledger = [
      daily('2026-03-09'),
      daily('2026-03-09'),
      entry('lesson:a', { reason: 'lesson', localDay: '2026-03-08' }),
      daily('2026-03-12'),
    ];
    expect(streak(ledger, vnNoon('2026-03-10'))).toEqual({ current: 1, best: 1 });
  });

  it('uses Vietnam days for `now`, across a month boundary', () => {
    const ledger = days('2026-02-27', '2026-02-28', '2026-03-01');
    // 2026-02-28T17:30Z is 00:30 on 1 March in Vietnam.
    expect(streak(ledger, new Date('2026-02-28T17:30:00.000Z')).current).toBe(3);
  });
});
