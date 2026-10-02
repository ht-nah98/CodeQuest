import { describe, expect, it } from 'vitest';
import type { RunSummary } from '@codequest/content-schema';
import {
  applyRun,
  balance,
  computeCreativeSaveRewards,
  computeLessonRewards,
  computeLevelRewards,
  MAX_LEVEL_COINS,
  recordSession,
} from './index';
import { entry, makeLevel, run, session, vnNoon } from './testFixtures';
import type { HintTier, LedgerEntry, LevelProgress, LevelSession } from './types';

const level = makeLevel({ par: 4 });
const now = vnNoon('2026-03-10');
const todayDaily = entry('daily:2026-03-10', { reason: 'daily', delta: 10 });
const sum = (entries: LedgerEntry[]) => entries.reduce((total, e) => total + e.delta, 0);
const ids = (entries: LedgerEntry[]) => entries.map((e) => e.id);

function win(
  input: {
    runs?: RunSummary[];
    winning?: RunSummary;
    hints?: HintTier[];
    progress?: LevelProgress;
    ledger?: LedgerEntry[];
    at?: Date;
  } = {},
) {
  const winning = input.winning ?? run('success');
  const s: LevelSession = session([...(input.runs ?? []), winning], input.hints ?? []);
  return computeLevelRewards({
    level,
    session: s,
    winning,
    progress: input.progress,
    ledger: input.ledger ?? [],
    now: input.at ?? now,
    profileId: 'p1',
  });
}

const firstTime = (reason: 'level-clear' | 'star-2' | 'star-3', delta: number) =>
  entry(`${reason}:w01-l03`, { reason, delta, refId: 'w01-l03' });
/** Ledger consistent with `threeStars`: first-time lines already paid, daily bonus taken. */
const cleared = [
  todayDaily,
  firstTime('level-clear', 10),
  firstTime('star-2', 5),
  firstTime('star-3', 5),
];

const threeStars: LevelProgress = {
  levelId: level.id,
  bestStars: 3,
  bestBlocks: 4,
  completedAt: '2026-03-01T05:00:00.000Z',
  firstTryWin: false,
  attempts: 2,
};

describe('computeLevelRewards: one level', () => {
  it('gives at most 25 coins: 10 + 5 + 5 + 5 for ⭐⭐⭐ on the first run ever', () => {
    const result = win({ ledger: [todayDaily] });
    expect(result.stars).toBe(3);
    expect(ids(result.entries)).toEqual([
      'level-clear:w01-l03',
      'star-2:w01-l03',
      'star-3:w01-l03',
      'first-try:w01-l03',
    ]);
    expect(sum(result.entries)).toBe(MAX_LEVEL_COINS);
    expect(result.newBadges).toEqual([]);
  });

  it('gives 35 coins with the daily bonus on the first level of the day', () => {
    const result = win();
    expect(sum(result.entries)).toBe(35);
    expect(result.entries.at(-1)).toMatchObject({
      id: 'daily:2026-03-10',
      reason: 'daily',
      delta: 10,
      refId: null,
      localDay: '2026-03-10',
    });
  });

  it('never exceeds 25 level coins over any sequence of sessions on one level', () => {
    const scenarios: Array<{ runs: RunSummary[]; blocks: number; hints: HintTier[] }> = [];
    for (const fails of [0, 1, 3]) {
      for (const blocks of [2, 4, 9]) {
        for (const hints of [[], [1], [2], [3], [1, 2, 3]] as HintTier[][]) {
          scenarios.push({
            runs: Array.from({ length: fails }, () => run('crash')),
            blocks,
            hints,
          });
        }
      }
    }
    // Play every scenario in a row on the same level, carrying progress and ledger forward.
    let progress: LevelProgress | undefined;
    let ledger: LedgerEntry[] = [todayDaily];
    for (const scenario of scenarios) {
      const result = win({
        runs: scenario.runs,
        winning: run('success', { blocksUsed: scenario.blocks }),
        hints: scenario.hints,
        ledger,
        ...(progress ? { progress } : {}),
      });
      ledger = [...ledger, ...result.entries];
      progress = result.newProgress;
    }
    const levelCoins = ledger.filter((e) => e.reason !== 'daily' && e.reason !== 'replay');
    expect(sum(levelCoins)).toBe(MAX_LEVEL_COINS);
  });

  it('does not change the ledger when the same win is recorded twice (same runId)', () => {
    const winning = run('success');
    const first = win({ winning });
    const ledger = first.entries;
    const again = win({ winning, ledger });
    expect(again.entries).toEqual([]);
    expect(balance([...ledger, ...again.entries])).toBe(balance(ledger));
  });

  it('does not double the replay coin when a replay win is recorded twice', () => {
    const winning = run('success');
    const first = win({ winning, progress: threeStars, ledger: cleared });
    expect(ids(first.entries)).toEqual([`replay:${winning.runId}`]);
    const ledger = [...cleared, ...first.entries];
    expect(win({ winning, progress: threeStars, ledger }).entries).toEqual([]);
  });

  it('only adds missing first-time lines when stars improve', () => {
    const first = win({ winning: run('success', { blocksUsed: 9 }) });
    expect(first.stars).toBe(1);
    expect(ids(first.entries)).toContain('level-clear:w01-l03');
    const second = win({
      winning: run('success', { blocksUsed: 3 }),
      progress: first.newProgress,
      ledger: first.entries,
    });
    expect(ids(second.entries)).toEqual(['star-2:w01-l03', 'star-3:w01-l03']);
    expect(second.newProgress.bestStars).toBe(3);
    expect(second.newProgress.bestBlocks).toBe(3);
  });

  it('never lowers best stars or the first completion time', () => {
    const result = win({
      winning: run('success', { blocksUsed: 9 }),
      progress: threeStars,
      ledger: cleared,
    });
    expect(result.stars).toBe(1);
    expect(result.newProgress).toMatchObject({
      bestStars: 3,
      bestBlocks: 4,
      completedAt: threeStars.completedAt,
    });
  });

  it('applies the hint star cap to the coins too', () => {
    const result = win({ hints: [3], ledger: [todayDaily] });
    expect(result.stars).toBe(1);
    expect(ids(result.entries)).toEqual(['level-clear:w01-l03', 'first-try:w01-l03']);
  });

  it('returns nothing for a run that did not succeed', () => {
    const failed = run('timeout');
    const result = computeLevelRewards({
      level,
      session: session([failed]),
      winning: failed,
      progress: undefined,
      ledger: [],
      now,
      profileId: 'p1',
    });
    expect(result.stars).toBe(0);
    expect(result.entries).toEqual([]);
    expect(result.newProgress.completedAt).toBeNull();
  });
});

describe('computeLevelRewards: first try', () => {
  it('is not granted after a failed run in the same session', () => {
    const result = win({ runs: [run('incomplete')], ledger: [todayDaily] });
    expect(ids(result.entries)).not.toContain('first-try:w01-l03');
    expect(result.newProgress.firstTryWin).toBe(false);
    expect(result.newProgress.attempts).toBe(2);
  });

  it('is not granted when the ledger already has the first clear (progress lost)', () => {
    const result = win({ ledger: [todayDaily, firstTime('level-clear', 10)] });
    expect(ids(result.entries)).toEqual(['star-2:w01-l03', 'star-3:w01-l03']);
    expect(result.newProgress.firstTryWin).toBe(false);
  });

  it('is still granted after error runs (they never ran)', () => {
    const result = win({ runs: [run('error'), run('error')], ledger: [todayDaily] });
    expect(ids(result.entries)).toContain('first-try:w01-l03');
    expect(result.newProgress).toMatchObject({ firstTryWin: true, attempts: 1 });
  });

  it('is not granted after an earlier session without a win (recordSession)', () => {
    const lost = session([run('crash'), run('error'), run('incomplete')]);
    const progress = recordSession(undefined, lost);
    expect(progress).toMatchObject({ attempts: 2, completedAt: null, bestStars: 0 });
    const result = win({ progress, ledger: [todayDaily] });
    expect(ids(result.entries)).not.toContain('first-try:w01-l03');
    expect(result.newProgress.attempts).toBe(3);
  });

  it('counts attempts once when a session has several wins', () => {
    const w1 = run('success');
    const w2 = run('success');
    const runs = [run('crash'), w1, run('crash'), run('error'), w2, run('timeout')];
    const s1 = session(runs.slice(0, 2));
    const first = computeLevelRewards({
      level,
      session: s1,
      winning: w1,
      progress: undefined,
      ledger: [],
      now,
      profileId: 'p1',
    });
    expect(first.newProgress.attempts).toBe(2);
    const second = computeLevelRewards({
      level,
      session: session(runs.slice(0, 5)),
      winning: w2,
      progress: first.newProgress,
      ledger: first.entries,
      now,
      profileId: 'p1',
    });
    expect(second.newProgress.attempts).toBe(4);
    expect(recordSession(second.newProgress, session(runs)).attempts).toBe(5);
  });
});

describe('computeLevelRewards: replay', () => {
  it('gives +1 for winning again a level that already had ⭐⭐⭐', () => {
    const winning = run('success');
    const result = win({ winning, progress: threeStars, ledger: cleared });
    expect(result.entries).toEqual([
      expect.objectContaining({ id: `replay:${winning.runId}`, delta: 1, reason: 'replay' }),
    ]);
  });

  it('gives nothing for replaying a level below ⭐⭐⭐ without improving', () => {
    const progress = { ...threeStars, bestStars: 1 as const };
    const ledger = [todayDaily, firstTime('level-clear', 10)];
    const result = win({ winning: run('success', { blocksUsed: 9 }), progress, ledger });
    expect(result.entries).toEqual([]);
  });

  it('stops writing replay lines after 5 in the same local day', () => {
    let ledger: LedgerEntry[] = cleared;
    for (let i = 0; i < 7; i++) {
      ledger = [...ledger, ...win({ progress: threeStars, ledger }).entries];
    }
    expect(ledger.filter((e) => e.reason === 'replay')).toHaveLength(5);
    const tomorrow = win({ progress: threeStars, ledger, at: vnNoon('2026-03-11') });
    expect(tomorrow.entries.map((e) => e.reason)).toEqual(['replay', 'daily']);
  });

  it('keeps the 5/day cap right after merging two devices that replayed offline', () => {
    // Both devices start from the same synced ledger with 3 replays today.
    let shared: LedgerEntry[] = cleared;
    for (let i = 0; i < 3; i++) {
      shared = [...shared, ...win({ progress: threeStars, ledger: shared }).entries];
    }
    let deviceA = shared;
    let deviceB = shared;
    for (let i = 0; i < 2; i++) {
      deviceA = [...deviceA, ...win({ progress: threeStars, ledger: deviceA }).entries];
      deviceB = [...deviceB, ...win({ progress: threeStars, ledger: deviceB }).entries];
    }
    expect(balance(deviceA)).toBe(35);
    // Merge = union by id: 3 shared + 2 + 2 different replay runs.
    const merged = [...deviceA, ...deviceB];
    const replayIds = new Set(merged.filter((e) => e.reason === 'replay').map((e) => e.id));
    expect(replayIds.size).toBe(7);
    expect(balance(merged)).toBe(35);
    expect(balance([...deviceB, ...deviceA])).toBe(35);
  });

  it('writes two replay lines for two different replays on two devices', () => {
    const a = win({ progress: threeStars, ledger: cleared }).entries;
    const b = win({ progress: threeStars, ledger: cleared }).entries;
    const merged = [...cleared, ...a, ...b];
    expect(merged.filter((e) => e.reason === 'replay')).toHaveLength(2);
    expect(balance(merged)).toBe(32);
  });
});

describe('daily bonus and streak', () => {
  const dailyOn = (day: string) =>
    entry(`daily:${day}`, { reason: 'daily', delta: 10, localDay: day });
  const daysBefore = (n: number, last: string) =>
    Array.from({ length: n }, (_, i) => {
      const d = new Date(`${last}T00:00:00.000Z`);
      d.setUTCDate(d.getUTCDate() - i);
      return dailyOn(d.toISOString().slice(0, 10));
    });

  it('gives the daily bonus once per local day', () => {
    const first = win();
    expect(ids(first.entries)).toContain('daily:2026-03-10');
    const other = makeLevel({ id: 'w01-l04' });
    const second = computeLevelRewards({
      level: other,
      session: session([run('success')], [], 'w01-l04'),
      winning: run('success'),
      progress: undefined,
      ledger: first.entries,
      now: new Date('2026-03-10T16:59:00.000Z'),
      profileId: 'p1',
    });
    expect(ids(second.entries)).not.toContain('daily:2026-03-10');
  });

  it('starts a new day at 00:00 Vietnam time', () => {
    const first = win({ at: new Date('2026-03-10T16:59:00.000Z') });
    expect(ids(first.entries)).toContain('daily:2026-03-10');
    const late = win({ ledger: first.entries, at: new Date('2026-03-10T17:01:00.000Z') });
    expect(ids(late.entries)).toContain('daily:2026-03-11');
  });

  it('gives the 7-day milestone on the 7th consecutive day', () => {
    const ledger = daysBefore(6, '2026-03-09');
    const result = win({ ledger });
    expect(ids(result.entries).slice(-2)).toEqual(['daily:2026-03-10', 'streak-7:2026-03-10']);
    expect(result.entries.at(-1)?.delta).toBe(50);
  });

  it('gives the milestone only once per milestone', () => {
    const ledger = daysBefore(6, '2026-03-09');
    const first = win({ ledger });
    const sameDay = computeLessonRewards({
      lessonId: 'w01-lesson1',
      ledger: [...ledger, ...first.entries],
      now,
      profileId: 'p1',
    });
    expect(ids(sameDay)).toEqual(['lesson:w01-lesson1']);
    const day8 = win({ ledger: [...ledger, ...first.entries], at: vnNoon('2026-03-11') });
    expect(ids(day8.entries)).not.toContain('streak-7:2026-03-11');
  });

  it('gives the milestone again at 14 days', () => {
    const result = win({ ledger: daysBefore(13, '2026-03-09') });
    expect(ids(result.entries)).toContain('streak-7:2026-03-10');
  });

  it('gives no milestone when a skipped day broke the streak', () => {
    const ledger = daysBefore(6, '2026-03-08'); // 2026-03-09 skipped
    expect(ids(win({ ledger }).entries)).not.toContain('streak-7:2026-03-10');
  });

  it('gives the daily bonus for a replay win', () => {
    const result = win({ progress: threeStars, ledger: cleared.slice(1) });
    expect(result.entries.map((e) => e.reason)).toEqual(['replay', 'daily']);
  });
});

describe('computeLevelRewards: creative', () => {
  const creative = makeLevel({ id: 'w01-c1', mode: 'creative', stage: 'creative', par: undefined });

  it('gives +10 on the first save only, no stars and no daily bonus', () => {
    const saved = run('success');
    const first = computeLevelRewards({
      level: creative,
      session: session([saved], [], 'w01-c1'),
      winning: saved,
      progress: undefined,
      ledger: [],
      now,
      profileId: 'p1',
    });
    expect(first.stars).toBe(0);
    expect(first.entries).toEqual([
      expect.objectContaining({ id: 'creative:w01-c1', delta: 10, reason: 'creative' }),
    ]);
    expect(first.newProgress).toMatchObject({ bestStars: 0, completedAt: now.toISOString() });
    const again = computeLevelRewards({
      level: creative,
      session: session([saved], [], 'w01-c1'),
      winning: saved,
      progress: first.newProgress,
      ledger: first.entries,
      now: vnNoon('2026-03-12'),
      profileId: 'p1',
    });
    expect(again.entries).toEqual([]);
    expect(again.newProgress.completedAt).toBe(now.toISOString());
  });
});

describe('computeLessonRewards', () => {
  it('gives +5 the first time, plus the daily bonus', () => {
    const entries = computeLessonRewards({
      lessonId: 'w01-lesson1',
      ledger: [],
      now,
      profileId: 'p1',
    });
    expect(entries).toEqual([
      {
        id: 'lesson:w01-lesson1',
        profileId: 'p1',
        delta: 5,
        reason: 'lesson',
        refId: 'w01-lesson1',
        at: now.toISOString(),
        localDay: '2026-03-10',
      },
      expect.objectContaining({ id: 'daily:2026-03-10', delta: 10 }),
    ]);
  });

  it('gives only the daily bonus when the lesson is read again another day', () => {
    const first = computeLessonRewards({ lessonId: 'l1', ledger: [], now, profileId: 'p1' });
    const again = computeLessonRewards({
      lessonId: 'l1',
      ledger: first,
      now: vnNoon('2026-03-11'),
      profileId: 'p1',
    });
    expect(ids(again)).toEqual(['daily:2026-03-11']);
    expect(
      computeLessonRewards({
        lessonId: 'l1',
        ledger: [...first, ...again],
        now: vnNoon('2026-03-11'),
        profileId: 'p1',
      }),
    ).toEqual([]);
  });
});

describe('applyRun', () => {
  const step = (
    state: { progress: LevelProgress | undefined; ledger: LedgerEntry[] },
    runs: RunSummary[],
  ) => {
    const last = runs.at(-1);
    if (last === undefined) throw new Error('no run');
    return applyRun(state, { level, session: session(runs), run: last, now, profileId: 'p1' });
  };

  it('feeds the 1st win newProgress to the 2nd win of the same session', () => {
    const runs = [run('crash'), run('success', { blocksUsed: 9 })];
    let state = { progress: undefined as LevelProgress | undefined, ledger: [] as LedgerEntry[] };
    const r1 = step(state, runs.slice(0, 1));
    expect(r1.rewards).toBeNull();
    expect(r1.progress).toBeUndefined();
    state = step(r1, runs);
    expect(state.progress).toMatchObject({ attempts: 2, bestStars: 1, firstTryWin: false });

    runs.push(run('timeout'), run('error'), run('success', { blocksUsed: 3 }));
    const r3 = step(state, runs);
    expect(r3.rewards?.stars).toBe(3);
    expect(r3.progress).toMatchObject({ attempts: 4, bestStars: 3, bestBlocks: 3 });
    // Only the new stars: the 1st win already paid level-clear and the daily bonus.
    expect(ids(r3.rewards?.entries ?? [])).toEqual(['star-2:w01-l03', 'star-3:w01-l03']);
    expect(balance(r3.ledger)).toBe(10 + 10 + 5 + 5);
    expect(recordSession(r3.progress, session(runs)).attempts).toBe(4);
  });

  it('returns no rewards for creative levels (use computeCreativeSaveRewards)', () => {
    const creative = makeLevel({ id: 'c', mode: 'creative', stage: 'creative', par: undefined });
    const saved = run('success');
    const result = applyRun(
      { progress: undefined, ledger: [] },
      { level: creative, session: session([saved], [], 'c'), run: saved, now, profileId: 'p1' },
    );
    expect(result).toEqual({ progress: undefined, ledger: [], rewards: null });
  });
});

describe('computeCreativeSaveRewards', () => {
  it('rejects a level that is not creative', () => {
    expect(() =>
      computeCreativeSaveRewards({ level, progress: undefined, ledger: [], now, profileId: 'p1' }),
    ).toThrow(/not creative/);
  });

  it('is what computeLevelRewards uses for creative levels', () => {
    const creative = makeLevel({ id: 'c', mode: 'creative', stage: 'creative', par: undefined });
    const direct = computeCreativeSaveRewards({
      level: creative,
      progress: undefined,
      ledger: [],
      now,
      profileId: 'p1',
    });
    expect(ids(direct.entries)).toEqual(['creative:c']);
  });
});
