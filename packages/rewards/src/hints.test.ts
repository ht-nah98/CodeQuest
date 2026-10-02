import { describe, expect, it } from 'vitest';
import { buyHint, failStreak, hintPrice } from './index';
import { entry, makeLevel, run, session, vnNoon } from './testFixtures';

const level = makeLevel();
const now = vnNoon('2026-03-10');
const coins = (n: number) => [entry('starter', { reason: 'starter', delta: n })];
const fails = (n: number) => Array.from({ length: n }, () => run('incomplete'));

describe('failStreak', () => {
  it('counts incomplete, crash and timeout in a row', () => {
    expect(failStreak(session([run('incomplete'), run('crash'), run('timeout')]))).toBe(3);
  });

  it('resets on a win', () => {
    expect(failStreak(session([...fails(5), run('success'), ...fails(1)]))).toBe(1);
  });

  it('skips error runs: they neither count nor reset', () => {
    expect(failStreak(session([...fails(2), run('error'), run('error'), ...fails(1)]))).toBe(3);
  });
});

describe('hintPrice', () => {
  it('uses list prices without fails', () => {
    expect(hintPrice(1, session([]), [])).toBe(5);
    expect(hintPrice(2, session([]), [])).toBe(15);
    expect(hintPrice(3, session([]), [])).toBe(40);
  });

  it('makes tier 1 free after 3 failed runs in a row, not after 2', () => {
    expect(hintPrice(1, session(fails(2)), [])).toBe(5);
    expect(hintPrice(1, session(fails(3)), [])).toBe(0);
  });

  it('does not open free hints by spamming empty programs (error)', () => {
    expect(hintPrice(1, session([run('error'), run('error'), run('error')]), [])).toBe(5);
  });

  it('discounts tier 2 to 5 after 6 failed runs in a row', () => {
    expect(hintPrice(2, session(fails(5)), [])).toBe(15);
    expect(hintPrice(2, session(fails(6)), [])).toBe(5);
    expect(hintPrice(3, session(fails(20)), [])).toBe(40);
  });

  it('keeps tier 1 free forever once bought for this level', () => {
    const ledger = [entry('hint-1:w01-l03', { reason: 'hint-1', delta: -5 })];
    expect(hintPrice(1, session([]), ledger)).toBe(0);
    expect(hintPrice(1, session([], [], 'w01-l04'), ledger)).toBe(5);
  });
});

describe('buyHint', () => {
  const base = { level, now, profileId: 'p1', purchaseId: 'u1' };

  it('writes a tier 1 line with the per-level id', () => {
    const result = buyHint({ ...base, tier: 1, session: session([]), ledger: coins(30) });
    expect(result).toEqual({
      ok: true,
      entry: {
        id: 'hint-1:w01-l03',
        profileId: 'p1',
        delta: -5,
        reason: 'hint-1',
        refId: 'w01-l03',
        at: now.toISOString(),
        localDay: '2026-03-10',
      },
    });
  });

  it('writes tier 2 and 3 lines keyed by purchase id', () => {
    const t2 = buyHint({ ...base, tier: 2, session: session([]), ledger: coins(30) });
    expect(t2.ok && t2.entry?.id).toBe('hint-2:w01-l03:u1');
    expect(t2.ok && t2.entry?.delta).toBe(-15);
    const t3 = buyHint({ ...base, tier: 3, session: session([]), ledger: coins(40) });
    expect(t3.ok && t3.entry?.id).toBe('hint-3:w01-l03:u1');
    expect(t3.ok && t3.entry?.reason).toBe('hint-3');
  });

  it('charges the discounted tier 2 price after 6 fails', () => {
    const result = buyHint({ ...base, tier: 2, session: session(fails(6)), ledger: coins(5) });
    expect(result.ok && result.entry?.delta).toBe(-5);
  });

  it('writes a delta-0 tier 1 line when the safety net opens it, so it stays owned', () => {
    const result = buyHint({ ...base, tier: 1, session: session(fails(3)), ledger: [] });
    expect(result).toMatchObject({
      ok: true,
      entry: { id: 'hint-1:w01-l03', delta: 0, reason: 'hint-1' },
    });
    const owned = result.ok && result.entry ? [result.entry] : [];
    // Next session: no fails, yet tier 1 is still free and nothing new is written.
    expect(hintPrice(1, session([]), owned)).toBe(0);
    expect(buyHint({ ...base, tier: 1, session: session([]), ledger: owned })).toEqual({
      ok: true,
      entry: null,
    });
  });

  it('returns no entry for a tier 2 retry that is already paid or owned', () => {
    const owned = [entry('hint-1:w01-l03', { reason: 'hint-1', delta: -5 })];
    expect(buyHint({ ...base, tier: 1, session: session([]), ledger: owned })).toEqual({
      ok: true,
      entry: null,
    });
  });

  it('counts missing coins from 0 when the merged balance is negative', () => {
    const negative = [entry('hint-3:w01-l03:x', { reason: 'hint-3', delta: -10 })];
    expect(buyHint({ ...base, tier: 1, session: session([]), ledger: negative })).toEqual({
      ok: false,
      missing: 5,
    });
  });

  it('throws when the session belongs to another level', () => {
    expect(() =>
      buyHint({ ...base, tier: 1, session: session([], [], 'w09-l01'), ledger: coins(30) }),
    ).toThrow(/session of w09-l01/);
  });

  it('reports missing coins and never lets the balance go negative', () => {
    expect(buyHint({ ...base, tier: 3, session: session([]), ledger: coins(30) })).toEqual({
      ok: false,
      missing: 10,
    });
    expect(buyHint({ ...base, tier: 1, session: session([]), ledger: [] })).toEqual({
      ok: false,
      missing: 5,
    });
  });

  it('is idempotent for a retried purchase id', () => {
    const paid = entry('hint-2:w01-l03:u1', { reason: 'hint-2', delta: -15 });
    const result = buyHint({ ...base, tier: 2, session: session([]), ledger: [paid] });
    expect(result).toEqual({ ok: true, entry: null });
  });

  it('rejects tiers 2–3 on a predict level', () => {
    const predict = makeLevel({ mode: 'predict', par: undefined });
    expect(() =>
      buyHint({ ...base, level: predict, tier: 2, session: session([]), ledger: coins(30) }),
    ).toThrow(/only has hint tier 1/);
    const t1 = buyHint({
      ...base,
      level: predict,
      tier: 1,
      session: session([]),
      ledger: coins(5),
    });
    expect(t1.ok).toBe(true);
  });
});
