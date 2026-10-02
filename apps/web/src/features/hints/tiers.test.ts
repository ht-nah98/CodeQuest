import { describe, expect, it } from 'vitest';
import type { LedgerEntry } from '@codequest/rewards';
import { availableTiers, tierViews } from './tiers';
import { hintTestLevel, sessionWithFails } from './testLevel';

const line = (id: string, delta: number): LedgerEntry => ({
  id,
  profileId: 'p1',
  delta,
  reason: delta < 0 ? 'hint-2' : 'starter',
  refId: null,
  at: '2026-10-02T02:00:00.000Z',
  localDay: '2026-10-02',
});
const coins = (n: number) => [line('starter', n)];
const level = hintTestLevel();
const states = (views: ReturnType<typeof tierViews>) =>
  views.map((v) => [v.tier, v.state, v.price, v.missing]);

describe('availableTiers', () => {
  it('offers 3 tiers in build, only tier 1 in predict, none in creative', () => {
    expect(availableTiers(level)).toEqual([1, 2, 3]);
    expect(availableTiers(hintTestLevel({ mode: 'predict' }))).toEqual([1]);
    expect(availableTiers({ ...level, mode: 'creative', thinkingHint: undefined })).toEqual([]);
  });

  it('needs a thinking hint for tier 1 and a solution for tiers 2-3', () => {
    expect(availableTiers({ ...level, thinkingHint: undefined })).toEqual([2, 3]);
    expect(availableTiers({ ...level, solution: undefined })).toEqual([1]);
  });
});

describe('tierViews (rewards-economy.md §2)', () => {
  it('prices the tiers 5 / 15 / 40', () => {
    expect(states(tierViews(level, sessionWithFails(level.id, 0), coins(100)))).toEqual([
      [1, 'buy', 5, 0],
      [2, 'buy', 15, 0],
      [3, 'buy', 40, 0],
    ]);
  });

  it('locks what the child cannot afford and says how much is missing', () => {
    expect(states(tierViews(level, sessionWithFails(level.id, 0), coins(10)))).toEqual([
      [1, 'buy', 5, 0],
      [2, 'locked', 15, 5],
      [3, 'locked', 40, 30],
    ]);
  });

  it('counts a negative balance as 0 coins', () => {
    const views = tierViews(level, sessionWithFails(level.id, 0), coins(-3));
    expect(views[0]).toMatchObject({ state: 'locked', missing: 5 });
  });

  it('makes tier 1 free after 3 failed runs in a row, even with 0 coins', () => {
    expect(tierViews(level, sessionWithFails(level.id, 2), coins(0))[0]).toMatchObject({
      state: 'locked',
    });
    expect(tierViews(level, sessionWithFails(level.id, 3), coins(0))[0]).toEqual({
      tier: 1,
      state: 'free',
      price: 0,
      missing: 0,
    });
  });

  it('discounts tier 2 to 5 after 6 failed runs in a row', () => {
    expect(tierViews(level, sessionWithFails(level.id, 6), coins(5))[1]).toMatchObject({
      state: 'buy',
      price: 5,
    });
  });

  it('shows tier 1 as owned once bought, and tier 3 once bought in this session', () => {
    const ledger = [...coins(0), line(`hint-1:${level.id}`, -5)];
    const session = sessionWithFails(level.id, 0, { hintTiersBought: [3] });
    expect(states(tierViews(level, session, ledger))).toEqual([
      [1, 'owned', 0, 0],
      [2, 'locked', 15, 15],
      [3, 'owned', 0, 0],
    ]);
  });
});
