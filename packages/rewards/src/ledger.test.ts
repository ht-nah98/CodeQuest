import { describe, expect, it } from 'vitest';
import { balance, canAfford, starterEntry } from './index';
import { entry, vnNoon } from './testFixtures';

const replay = (runId: string, day: string) =>
  entry(`replay:${runId}`, { reason: 'replay', delta: 1, localDay: day });

describe('balance', () => {
  it('sums the lines, spending included', () => {
    const ledger = [
      starterEntry('p1', vnNoon('2026-03-10')),
      entry('level-clear:a', { reason: 'level-clear', delta: 10 }),
      entry('hint-1:a', { reason: 'hint-1', delta: -5 }),
    ];
    expect(balance(ledger)).toBe(35);
    expect(balance([])).toBe(0);
  });

  it('counts a duplicated id once', () => {
    const line = entry('level-clear:a', { reason: 'level-clear', delta: 10 });
    expect(balance([line, line, { ...line }])).toBe(10);
  });

  it('counts at most 5 replay lines per local day, the first 5 by id', () => {
    const day1 = ['r7', 'r1', 'r3', 'r9', 'r2', 'r5'].map((id) => replay(id, '2026-03-10'));
    const day2 = ['x1', 'x2'].map((id) => replay(id, '2026-03-11'));
    expect(balance([...day1, ...day2])).toBe(7);
    // The 6th line by id is dropped whatever its order of arrival or delta.
    const weird = [
      { ...replay('r9', '2026-03-10'), delta: 100 },
      ...['r1', 'r2', 'r3', 'r4', 'r5'].map((id) => replay(id, '2026-03-10')),
    ];
    expect(balance(weird)).toBe(5);
  });
});

describe('canAfford', () => {
  it('compares the balance with the price', () => {
    const ledger = [starterEntry('p1', vnNoon('2026-03-10'))];
    expect(canAfford(ledger, 30)).toBe(true);
    expect(canAfford(ledger, 31)).toBe(false);
  });
});

describe('starterEntry', () => {
  it('grants 30 coins once, with the fixed id', () => {
    const now = vnNoon('2026-03-10');
    expect(starterEntry('p1', now)).toEqual({
      id: 'starter',
      profileId: 'p1',
      delta: 30,
      reason: 'starter',
      refId: null,
      at: now.toISOString(),
      localDay: '2026-03-10',
    });
  });
});
