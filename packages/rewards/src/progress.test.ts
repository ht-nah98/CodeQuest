import { describe, expect, it } from 'vitest';
import { mergeProgress, recordSession } from './index';
import { emptyProgress } from './progress';
import { run, session } from './testFixtures';
import type { LevelProgress, StarCount } from './types';

/** mulberry32: tiny seeded PRNG, so property tests are reproducible (no Math.random). */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomProgress(next: () => number): LevelProgress {
  const pick = (n: number) => Math.floor(next() * n);
  // Small ranges on purpose: ties are where merge rules usually break.
  const times = [
    '2026-03-01T05:00:00.000Z',
    '2026-03-01T05:00:00.001Z',
    '2026-03-02T00:00:00.000Z',
    '2026-02-28T23:59:59.999Z',
    // Same instant as the first one, written with an offset.
    '2026-03-01T12:00:00+07:00',
    'garbage',
  ];
  return {
    levelId: 'w01-l03',
    bestStars: pick(4) as StarCount,
    bestBlocks: pick(3) === 0 ? null : 1 + pick(6),
    completedAt: pick(3) === 0 ? null : (times[pick(times.length)] ?? null),
    firstTryWin: pick(2) === 0,
    attempts: pick(8),
  };
}

/** What merge keeps of a completion time: invalid ISO strings become null. */
const valid = (iso: string | null) => (iso !== null && !Number.isNaN(Date.parse(iso)) ? iso : null);

const SEEDS = [1, 42, 2026, 0xc0de, 987654321];
const CASES_PER_SEED = 200;

describe('mergeProgress', () => {
  it('applies the server merge rules', () => {
    const a: LevelProgress = {
      levelId: 'x',
      bestStars: 2,
      bestBlocks: 7,
      completedAt: '2026-03-05T00:00:00.000Z',
      firstTryWin: false,
      attempts: 9,
    };
    const b: LevelProgress = {
      levelId: 'x',
      bestStars: 3,
      bestBlocks: 5,
      completedAt: '2026-03-02T00:00:00.000Z',
      firstTryWin: true,
      attempts: 4,
    };
    expect(mergeProgress(a, b)).toEqual({
      levelId: 'x',
      bestStars: 3,
      bestBlocks: 5,
      completedAt: '2026-03-02T00:00:00.000Z',
      firstTryWin: true,
      attempts: 9,
    });
  });

  it('treats null blocks and completion as "none" (like SQL least)', () => {
    const fresh = emptyProgress('x');
    const done = { ...fresh, bestBlocks: 4, completedAt: '2026-03-02T00:00:00.000Z' };
    expect(mergeProgress(fresh, done)).toMatchObject({
      bestBlocks: 4,
      completedAt: '2026-03-02T00:00:00.000Z',
    });
    expect(mergeProgress(fresh, fresh)).toEqual(fresh);
  });

  it('compares instants, not strings, for completion times with offsets', () => {
    const a = { ...emptyProgress('x'), completedAt: '2026-03-02T06:00:00+07:00' };
    const b = { ...emptyProgress('x'), completedAt: '2026-03-01T23:30:00.000Z' };
    expect(mergeProgress(a, b).completedAt).toBe(a.completedAt);
    expect(mergeProgress(b, a).completedAt).toBe(a.completedAt);
  });

  it('breaks ties between equal instants by string, in both orders', () => {
    const a = { ...emptyProgress('x'), completedAt: '2026-03-01T23:00:00.000Z' };
    const b = { ...emptyProgress('x'), completedAt: '2026-03-02T06:00:00+07:00' };
    expect(mergeProgress(a, b).completedAt).toBe(mergeProgress(b, a).completedAt);
  });

  it('treats an invalid completion time as null', () => {
    const bad = { ...emptyProgress('x'), completedAt: 'not-a-date' };
    const good = { ...emptyProgress('x'), completedAt: '2026-03-02T00:00:00.000Z' };
    expect(mergeProgress(bad, good).completedAt).toBe(good.completedAt);
    expect(mergeProgress(good, bad).completedAt).toBe(good.completedAt);
    expect(mergeProgress(bad, bad).completedAt).toBeNull();
  });

  it('throws when merging two different levels', () => {
    expect(() => mergeProgress(emptyProgress('a'), emptyProgress('b'))).toThrow(/level ids differ/);
  });

  describe.each(SEEDS)('properties (seed %i)', (seed) => {
    it('is commutative: merge(a, b) = merge(b, a)', () => {
      const next = mulberry32(seed);
      for (let i = 0; i < CASES_PER_SEED; i++) {
        const a = randomProgress(next);
        const b = randomProgress(next);
        expect(mergeProgress(a, b)).toEqual(mergeProgress(b, a));
      }
    });

    it('is associative: merge(merge(a, b), c) = merge(a, merge(b, c))', () => {
      const next = mulberry32(seed);
      for (let i = 0; i < CASES_PER_SEED; i++) {
        const a = randomProgress(next);
        const b = randomProgress(next);
        const c = randomProgress(next);
        expect(mergeProgress(mergeProgress(a, b), c)).toEqual(
          mergeProgress(a, mergeProgress(b, c)),
        );
      }
    });

    it('is idempotent: merge(a, a) = a (bad time → null), merge(merge(a, b), b) = merge(a, b)', () => {
      const next = mulberry32(seed);
      for (let i = 0; i < CASES_PER_SEED; i++) {
        const a = randomProgress(next);
        const b = randomProgress(next);
        expect(mergeProgress(a, a)).toEqual({ ...a, completedAt: valid(a.completedAt) });
        const ab = mergeProgress(a, b);
        expect(mergeProgress(ab, b)).toEqual(ab);
      }
    });

    it('never loses progress: result is at least as good as each side', () => {
      const next = mulberry32(seed);
      for (let i = 0; i < CASES_PER_SEED; i++) {
        const a = randomProgress(next);
        const b = randomProgress(next);
        const m = mergeProgress(a, b);
        expect(m.bestStars).toBe(Math.max(a.bestStars, b.bestStars));
        expect(m.attempts).toBe(Math.max(a.attempts, b.attempts));
        expect(m.firstTryWin).toBe(a.firstTryWin || b.firstTryWin);
        if (valid(a.completedAt) !== null || valid(b.completedAt) !== null) {
          expect(m.completedAt).not.toBeNull();
        }
      }
    });
  });

  it('generates varied cases (the PRNG is not stuck)', () => {
    const next = mulberry32(7);
    const stars = new Set(Array.from({ length: 50 }, () => randomProgress(next).bestStars));
    expect(stars.size).toBe(4);
  });
});

describe('recordSession', () => {
  it('throws when progress and session are of different levels', () => {
    expect(() => recordSession(emptyProgress('other'), session([]))).toThrow(/recordSession/);
  });

  it('starts an empty record for a level never played', () => {
    expect(recordSession(undefined, session([]))).toEqual(emptyProgress('w01-l03'));
  });

  it('adds only counted runs after the last win', () => {
    const s = session([run('crash'), run('success'), run('error'), run('timeout'), run('crash')]);
    const before = { ...emptyProgress('w01-l03'), attempts: 2, bestStars: 3 as const };
    expect(recordSession(before, s)).toEqual({ ...before, attempts: 4 });
  });
});
