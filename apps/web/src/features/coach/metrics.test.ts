import { describe, expect, it } from 'vitest';
import type { Level, RunSummary, World } from '@codequest/content-schema';
import type { AttemptRow, LedgerRow, ProgressRow } from '../../data/db';
import {
  averageBalance,
  type ChildData,
  childOverview,
  coinIssues,
  csvField,
  type Curriculum,
  daysBetween,
  failureReasons,
  levelDetails,
  levelStats,
  mergeChildren,
  summaryCsv,
  timePlayedMs,
  weakConcepts,
  weekStart,
  weeklyMinutes,
  worldCells,
} from './metrics';

// Sample data with answers worked out by hand (comments give the arithmetic).

const NOW = new Date('2026-10-06T05:00:00.000Z'); // Tuesday noon in Vietnam

const world = (id: string, order: number, concept: string, levelIds: string[]): World => ({
  id,
  order,
  title: id,
  emoji: '-',
  concept,
  story: 's',
  theme: { tileset: '/tiles/ground.png' },
  lessonIds: [],
  levelIds,
  unlock: { minStarRatio: 0.6 },
});

const level = (id: string, worldId: string, stage: Level['stage'], retired = false): Level => ({
  id,
  worldId,
  stage,
  kind: 'runner',
  mode: 'build',
  title: id,
  objective: 'o',
  learningGoal: 'g',
  toolbox: [],
  config: {},
  hints: [],
  ...(retired && { retired: true }),
});

const W01 = world('w01', 1, 'tuần tự', ['a1', 'a2', 'a3', 'a4', 'a5']);
const W02 = world('w02', 2, 'lặp', ['b1', 'b2']);
const CURRICULUM: Curriculum = {
  worlds: [W01, W02],
  levels: new Map(
    [
      level('a1', 'w01', 'guided'),
      level('a2', 'w01', 'practice'),
      level('a3', 'w01', 'boss'),
      level('a4', 'w01', 'bonus'), // not counted
      level('a5', 'w01', 'practice', true), // retired: not counted
      level('b1', 'w02', 'guided'),
      level('b2', 'w02', 'practice'),
    ].map((l) => [l.id, l]),
  ),
};

let runId = 0;
const run = (result: RunSummary['result'], reasonCode: string | null = null): RunSummary => ({
  runId: `r${String(++runId)}`,
  result,
  reasonCode,
  blocksUsed: 3,
});

const minutes = (iso: string, n: number) => new Date(Date.parse(iso) + n * 60_000).toISOString();

const attempt = (
  id: string,
  profileId: string,
  levelId: string,
  startedAt: string,
  lengthMin: number,
  runs: RunSummary[],
  hintTiersBought: AttemptRow['hintTiersBought'] = [],
): AttemptRow => ({
  id,
  profileId,
  levelId,
  startedAt,
  endedAt: minutes(startedAt, lengthMin),
  runs,
  hintTiersBought,
  won: runs.some((r) => r.result === 'success'),
});

const progress = (
  profileId: string,
  levelId: string,
  bestStars: ProgressRow['bestStars'],
  completedAt: string | null,
  firstTryWin = false,
): ProgressRow => ({
  profileId,
  levelId,
  bestStars,
  bestBlocks: completedAt ? 3 : null,
  completedAt,
  firstTryWin,
  attempts: 1,
  updatedAt: completedAt ?? '2026-09-28T02:00:00.000Z',
});

const coin = (
  profileId: string,
  id: string,
  reason: LedgerRow['reason'],
  delta: number,
  at = '2026-10-05T02:00:00.000Z',
  day = '2026-10-05',
): LedgerRow => ({ id, profileId, delta, reason, refId: null, at, localDay: day });

// Na: 3 sessions (2 + 10 + 45→30 min), w01 a1 ★3 first try, a2 ★2, w02 b1 played, not won.
const NA: ChildData = {
  profileId: 'na',
  nickname: 'Na',
  avatarId: 'panda',
  sources: [{ kind: 'local' }],
  progress: [
    progress('na', 'a1', 3, '2026-10-05T02:02:00.000Z', true),
    progress('na', 'a2', 2, '2026-10-05T03:10:00.000Z'),
    progress('na', 'b1', 0, null),
  ],
  attempts: [
    attempt('s1', 'na', 'a1', '2026-10-05T02:00:00.000Z', 2, [run('success')]),
    attempt(
      's2',
      'na',
      'a2',
      '2026-10-05T03:00:00.000Z',
      10,
      [
        run('incomplete', 'FELL_IN_HOLE'),
        run('incomplete', 'FELL_IN_HOLE'),
        run('crash', 'HIT_WALL'),
        run('success'),
      ],
      [1, 2],
    ),
    attempt(
      's3',
      'na',
      'b1',
      '2026-09-28T02:00:00.000Z',
      45,
      [run('timeout'), run('incomplete', 'FELL_IN_HOLE'), run('error', 'SYNTAX')],
      [3],
    ),
  ],
  // 30 + 10+5+5+5 + 10+5 − 5 − 15 − 40 + 10 + 10 = 30
  ledger: [
    coin('na', 'starter', 'starter', 30, '2026-09-28T01:00:00.000Z', '2026-09-28'),
    coin('na', 'level-clear:a1', 'level-clear', 10),
    coin('na', 'star-2:a1', 'star-2', 5),
    coin('na', 'star-3:a1', 'star-3', 5),
    coin('na', 'first-try:a1', 'first-try', 5),
    coin('na', 'level-clear:a2', 'level-clear', 10),
    coin('na', 'star-2:a2', 'star-2', 5),
    coin('na', 'hint-1:a2', 'hint-1', -5),
    coin('na', 'hint-2:a2', 'hint-2', -15),
    coin('na', 'hint-3:b1', 'hint-3', -40, '2026-09-28T02:10:00.000Z', '2026-09-28'),
    coin('na', 'daily:2026-10-05', 'daily', 10),
    coin('na', 'daily:2026-10-04', 'daily', 10, '2026-10-04T02:00:00.000Z', '2026-10-04'),
  ],
  lessons: [{ profileId: 'na', lessonId: 'w01-lesson', completedAt: '2026-10-04T02:00:00.000Z' }],
};

// Bo: one 1-minute session on a1 with a tier-3 hint, last seen 5 days ago.
const BO: ChildData = {
  profileId: 'bo',
  nickname: 'Bo',
  avatarId: 'cat',
  sources: [{ kind: 'file', name: 'bo.json' }],
  progress: [progress('bo', 'a1', 1, '2026-10-01T02:01:00.000Z')],
  attempts: [
    attempt(
      's4',
      'bo',
      'a1',
      '2026-10-01T02:00:00.000Z',
      1,
      [run('incomplete', 'FELL_IN_HOLE'), run('success')],
      [3],
    ),
  ],
  ledger: [coin('bo', 'starter', 'starter', 30, '2026-10-01T01:00:00.000Z', '2026-10-01')],
  lessons: [],
};

describe('one child', () => {
  it('counts levels and stars per world, skipping bonus and retired levels', () => {
    expect(worldCells(NA, CURRICULUM)).toEqual([
      {
        worldId: 'w01',
        levelsDone: 2,
        levelsTotal: 3,
        stars: 5,
        maxStars: 9,
        lastActive: '2026-10-05T03:10:00.000Z',
      },
      {
        worldId: 'w02',
        levelsDone: 0,
        levelsTotal: 2,
        stars: 0,
        maxStars: 6,
        lastActive: '2026-09-28T02:45:00.000Z',
      },
    ]);
  });

  it('sums the overview: coins, time (sessions capped at 30 min), streak, last active', () => {
    expect(childOverview(NA, CURRICULUM, NOW)).toEqual({
      profileId: 'na',
      nickname: 'Na',
      levelsDone: 2,
      stars: 5,
      coins: 30,
      timeMs: 42 * 60_000, // 2 + 10 + 30
      lastActive: '2026-10-05T03:10:00.000Z',
      daysAway: 1,
      away: false,
      streak: 2, // 4th and 5th, today not yet
      bestStreak: 2,
    });
    expect(childOverview(BO, CURRICULUM, NOW)).toMatchObject({
      coins: 30,
      timeMs: 60_000,
      daysAway: 5,
      away: true,
      streak: 0,
    });
  });

  it('marks a child who never played as away', () => {
    const fresh: ChildData = { ...BO, attempts: [], progress: [], ledger: [], lessons: [] };
    expect(childOverview(fresh, CURRICULUM, NOW)).toMatchObject({
      lastActive: null,
      daysAway: null,
      away: true,
      coins: 0,
    });
  });

  it('counts days away in Vietnam days', () => {
    // 17:30 UTC on the 5th is 00:30 on the 6th in Vietnam.
    expect(daysBetween('2026-10-05T17:30:00.000Z', NOW)).toBe(0);
    expect(daysBetween('2026-10-05T16:30:00.000Z', NOW)).toBe(1);
  });

  it('caps a session left open and ignores broken times', () => {
    const open = attempt('x', 'na', 'a1', '2026-10-05T02:00:00.000Z', 300, []);
    const broken = { ...open, id: 'y', endedAt: 'not a date' };
    expect(timePlayedMs([open, broken])).toBe(30 * 60_000);
  });

  it('gives per-level detail: sessions, runs, hints, first try, reasons', () => {
    expect(levelDetails(NA, W01, CURRICULUM)).toEqual([
      {
        levelId: 'a1',
        stars: 3,
        done: true,
        firstTryWin: true,
        sessions: 1,
        runs: 1,
        failedRuns: 0,
        hints: { 1: 0, 2: 0, 3: 0 },
        timeMs: 2 * 60_000,
        reasons: [],
      },
      {
        levelId: 'a2',
        stars: 2,
        done: true,
        firstTryWin: false,
        sessions: 1,
        runs: 4,
        failedRuns: 3,
        hints: { 1: 1, 2: 1, 3: 0 },
        timeMs: 10 * 60_000,
        reasons: [
          { reason: 'FELL_IN_HOLE', count: 2 },
          { reason: 'HIT_WALL', count: 1 },
        ],
      },
      {
        levelId: 'a3',
        stars: 0,
        done: false,
        firstTryWin: false,
        sessions: 0,
        runs: 0,
        failedRuns: 0,
        hints: { 1: 0, 2: 0, 3: 0 },
        timeMs: 0,
        reasons: [],
      },
    ]);
  });

  it('names a timeout without a reason code TIMEOUT and skips `error` runs', () => {
    expect(failureReasons(NA.attempts.filter((a) => a.id === 's3'))).toEqual([
      { reason: 'FELL_IN_HOLE', count: 1 },
      { reason: 'TIMEOUT', count: 1 },
    ]);
  });

  it('adds up minutes per Vietnam week (Monday first), this week last', () => {
    expect(weekStart('2026-10-06')).toBe('2026-10-05');
    expect(weekStart('2026-10-05')).toBe('2026-10-05');
    expect(weekStart('2026-10-04')).toBe('2026-09-28');
    expect(weeklyMinutes(NA.attempts, NOW, 3)).toEqual([
      { week: '2026-09-21', minutes: 0 },
      { week: '2026-09-28', minutes: 30 },
      { week: '2026-10-05', minutes: 12 },
    ]);
  });
});

describe('the group', () => {
  it('ranks weak concepts by failed runs per world', () => {
    expect(weakConcepts([NA, BO], CURRICULUM)).toEqual([
      {
        worldId: 'w01',
        concept: 'tuần tự',
        runs: 7, // 1 + 4 + 2
        failedRuns: 4, // 3 + 1
        failRate: 4 / 7,
        reasons: [
          { reason: 'FELL_IN_HOLE', count: 3 },
          { reason: 'HIT_WALL', count: 1 },
        ],
      },
      {
        worldId: 'w02',
        concept: 'lặp',
        runs: 3,
        failedRuns: 2, // `error` is not a failure
        failRate: 2 / 3,
        reasons: [
          { reason: 'FELL_IN_HOLE', count: 1 },
          { reason: 'TIMEOUT', count: 1 },
        ],
      },
    ]);
  });

  it('flags levels by the rewards-economy.md §6 signals, flagged first', () => {
    expect(levelStats([NA, BO], CURRICULUM)).toEqual([
      {
        levelId: 'b1',
        worldId: 'w02',
        children: 1,
        sessions: 1,
        tier3Share: 1,
        firstTryShare: null,
        medianWinMs: null,
        failRate: 2 / 3,
        flags: ['hard'],
      },
      {
        levelId: 'a1',
        worldId: 'w01',
        children: 2,
        sessions: 2,
        tier3Share: 0.5, // > 40 %
        firstTryShare: 0.5,
        medianWinMs: 90_000, // (2 min + 1 min) / 2
        failRate: 1 / 3,
        flags: ['hard'],
      },
      {
        levelId: 'a2',
        worldId: 'w01',
        children: 1,
        sessions: 1,
        tier3Share: 0,
        firstTryShare: 0,
        medianWinMs: 10 * 60_000,
        failRate: 3 / 4,
        flags: [],
      },
    ]);
  });

  it('flags a level everyone wins at once in under 20 s as easy', () => {
    const quick = (id: string): ChildData => ({
      ...BO,
      profileId: id,
      progress: [progress(id, 'b2', 3, '2026-10-05T02:00:10.000Z', true)],
      attempts: [
        {
          ...attempt(`q-${id}`, id, 'b2', '2026-10-05T02:00:00.000Z', 0, [run('success')]),
          endedAt: '2026-10-05T02:00:10.000Z',
        },
      ],
    });
    const [stat] = levelStats([quick('c1'), quick('c2')], CURRICULUM);
    expect(stat).toMatchObject({ levelId: 'b2', firstTryShare: 1, medianWinMs: 10_000 });
    expect(stat?.flags).toEqual(['easy']);
  });

  it('averages balances against 20 and 400 coins', () => {
    expect(averageBalance([NA, BO])).toEqual({ average: 30, signal: null });
    expect(averageBalance([{ ...BO, ledger: [] }])).toEqual({ average: 0, signal: 'low' });
    expect(averageBalance([])).toBeNull();
  });
});

describe('coin issues', () => {
  it('finds nothing in a normal ledger', () => {
    expect(coinIssues(NA.ledger)).toEqual([]);
  });

  it('reports a line above its cap, a spend that adds coins and too many replays', () => {
    const replays = Array.from({ length: 6 }, (_, i) =>
      coin('na', `replay:${String(i)}`, 'replay', 1),
    );
    expect(
      coinIssues([
        coin('na', 'starter', 'starter', 30),
        coin('na', 'level-clear:x', 'level-clear', 50),
        coin('na', 'hint-1:x', 'hint-1', 5),
        ...replays,
      ]),
    ).toEqual([
      { kind: 'over-cap', entryId: 'level-clear:x', reason: 'level-clear', delta: 50 },
      { kind: 'over-cap', entryId: 'hint-1:x', reason: 'hint-1', delta: 5 },
      { kind: 'replay-cap', day: '2026-10-05', count: 6 },
    ]);
  });

  it('reports negative and very high balances', () => {
    expect(coinIssues([coin('na', 'hint-3:x', 'hint-3', -40)])).toEqual([
      { kind: 'negative', balance: -40 },
    ]);
    expect(
      coinIssues([coin('na', 'starter', 'starter', 30), coin('na', 'adj', 'coach-adjust', 400)]),
    ).toEqual([{ kind: 'high', balance: 430 }]);
  });
});

describe('mergeChildren', () => {
  it('shows a child found in two sources once, merging rows without counting twice', () => {
    const copy: ChildData = {
      ...NA,
      nickname: 'Na (cũ)',
      sources: [{ kind: 'file', name: 'na.json' }],
      progress: [progress('na', 'b1', 2, '2026-10-05T04:00:00.000Z')],
      attempts: [
        ...NA.attempts,
        attempt('s9', 'na', 'b1', '2026-10-05T03:50:00.000Z', 10, [run('success')]),
      ],
    };
    const [merged, other] = mergeChildren([NA, BO, copy]);
    expect(other?.profileId).toBe('bo');
    expect(merged?.nickname).toBe('Na');
    expect(merged?.sources).toEqual([{ kind: 'local' }, { kind: 'file', name: 'na.json' }]);
    expect(merged?.attempts.map((a) => a.id)).toEqual(['s1', 's2', 's3', 's9']);
    expect(merged?.ledger).toHaveLength(NA.ledger.length);
    expect(merged?.progress.find((p) => p.levelId === 'b1')).toMatchObject({
      bestStars: 2,
      completedAt: '2026-10-05T04:00:00.000Z',
    });
    expect(merged && childOverview(merged, CURRICULUM, NOW).stars).toBe(7);
  });
});

describe('CSV summary', () => {
  it('writes one line per child and world, with a BOM for Excel', () => {
    expect(summaryCsv([NA], CURRICULUM, NOW)).toBe(
      '\uFEFFBiệt danh,Thế giới,Màn xong,Số màn,Sao,Sao tối đa,Học gần nhất (thế giới),Xu,Chuỗi ngày,Phút học,Học gần nhất,Nguồn\r\n' +
        'Na,w01,2,3,5,9,2026-10-05,30,2,42,2026-10-05,máy này\r\n' +
        'Na,w02,0,2,0,6,2026-09-28,30,2,42,2026-10-05,máy này\r\n',
    );
  });

  it('quotes fields and defuses spreadsheet formulas', () => {
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField('=1+1')).toBe("'=1+1");
    expect(csvField('@x')).toBe("'@x");
    expect(csvField(-5)).toBe('-5');
  });
});
