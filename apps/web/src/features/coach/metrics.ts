import type { Level, World } from '@codequest/content-schema';
import {
  balance,
  COINS,
  FAILED_RESULTS,
  localDay,
  mergeProgress,
  REPLAY_DAILY_CAP,
  streak,
  type LedgerReason,
} from '@codequest/rewards';
import type { AttemptRow, LedgerRow, LessonRow, ProgressRow } from '../../data/db';

// Coach corner metrics (phase-2.md P2-05): pure functions over raw rows (`progress`,
// `attempts`, `ledger`, `lessons`), shared by every data source (this laptop, backup files,
// Supabase from P2-16). Thresholds come from rewards-economy.md §6. No React, no Dexie.

/** Where a child's rows were read from. */
export type ChildSource = { kind: 'local' } | { kind: 'file'; name: string };

/** One child as the coach corner sees it: nickname, avatar and learning rows only (rule 8). */
export interface ChildData {
  profileId: string;
  nickname: string;
  avatarId: string;
  sources: ChildSource[];
  progress: ProgressRow[];
  attempts: AttemptRow[];
  ledger: LedgerRow[];
  lessons: LessonRow[];
}

/** The part of the content catalog the metrics read. */
export interface Curriculum {
  /** Map order. */
  worlds: readonly World[];
  levels: ReadonlyMap<string, Level>;
}

/** A session longer than this counts as this long (the tab was left open). */
export const MAX_SESSION_MS = 30 * 60_000;
/** A child is "away" after this many days without learning. */
export const INACTIVE_DAYS = 3;
/** rewards-economy.md §6. */
export const TIER3_SHARE_HARD = 0.4;
export const FIRST_TRY_EASY = 0.95;
export const EASY_WIN_MS = 20_000;
export const BALANCE_HIGH = 400;
export const BALANCE_LOW = 20;

const MS_PER_DAY = 86_400_000;

// ---------- Merging sources ----------

const sameKey = <T>(rows: readonly T[], key: (row: T) => string): T[] => {
  const seen = new Map<string, T>();
  for (const row of rows) if (!seen.has(key(row))) seen.set(key(row), row);
  return [...seen.values()];
};

/**
 * One entry per profile id, in first-seen order: the same child found on this laptop and in a
 * file (or in two files) is shown once, with the same convergent rules as restore and sync
 * (progress through mergeProgress, append-only rows unioned by key, the first copy wins).
 * Nothing is written anywhere; the first source's nickname and avatar are kept.
 */
export function mergeChildren(children: readonly ChildData[]): ChildData[] {
  const byId = new Map<string, ChildData>();
  for (const child of children) {
    const known = byId.get(child.profileId);
    if (!known) {
      byId.set(child.profileId, { ...child, sources: [...child.sources] });
      continue;
    }
    const progress = new Map(known.progress.map((row) => [row.levelId, row]));
    for (const row of child.progress) {
      const stored = progress.get(row.levelId);
      progress.set(
        row.levelId,
        stored
          ? {
              ...mergeProgress(stored, row),
              profileId: stored.profileId,
              updatedAt: stored.updatedAt > row.updatedAt ? stored.updatedAt : row.updatedAt,
            }
          : row,
      );
    }
    byId.set(child.profileId, {
      ...known,
      sources: [...known.sources, ...child.sources],
      progress: [...progress.values()],
      attempts: sameKey([...known.attempts, ...child.attempts], (r) => r.id),
      ledger: sameKey([...known.ledger, ...child.ledger], (r) => r.id),
      lessons: sameKey([...known.lessons, ...child.lessons], (r) => r.lessonId),
    });
  }
  return [...byId.values()];
}

// ---------- One child ----------

/** Live (not retired) levels of a world in map order; bonus levels are not counted. */
export function countedLevels(world: World, curriculum: Curriculum): Level[] {
  return world.levelIds
    .map((id) => curriculum.levels.get(id))
    .filter(
      (level): level is Level =>
        level !== undefined && level.retired !== true && level.stage !== 'bonus',
    );
}

const maxIso = (values: Iterable<string | null | undefined>): string | null => {
  let best: string | null = null;
  for (const value of values) if (value && (best === null || value > best)) best = value;
  return best;
};

const sessionMs = (attempt: AttemptRow): number => {
  const ms = Date.parse(attempt.endedAt) - Date.parse(attempt.startedAt);
  return Number.isFinite(ms) ? Math.min(Math.max(ms, 0), MAX_SESSION_MS) : 0;
};

/** Total time in level sessions, each capped at MAX_SESSION_MS. */
export function timePlayedMs(attempts: readonly AttemptRow[]): number {
  return attempts.reduce((sum, a) => sum + sessionMs(a), 0);
}

/** Latest learning activity: a level session, a finished level or lesson, or a coin line. */
export function lastActive(child: ChildData): string | null {
  return maxIso([
    ...child.attempts.map((a) => a.endedAt),
    ...child.progress.map((p) => p.completedAt),
    ...child.lessons.map((l) => l.completedAt),
    ...child.ledger.map((e) => e.at),
  ]);
}

export interface WorldCell {
  worldId: string;
  levelsDone: number;
  levelsTotal: number;
  stars: number;
  maxStars: number;
  /** ISO, latest session or completion on this world's levels. */
  lastActive: string | null;
}

/** One row of the "children × worlds" table. */
export function worldCells(child: ChildData, curriculum: Curriculum): WorldCell[] {
  const progress = new Map(child.progress.map((row) => [row.levelId, row]));
  return curriculum.worlds.map((world) => {
    const levels = countedLevels(world, curriculum);
    const ids = new Set(levels.map((l) => l.id));
    const rows = levels.map((l) => progress.get(l.id));
    return {
      worldId: world.id,
      levelsDone: rows.filter((row) => row?.completedAt != null).length,
      levelsTotal: levels.length,
      stars: rows.reduce((sum, row) => sum + (row?.bestStars ?? 0), 0),
      maxStars: levels.length * 3,
      lastActive: maxIso([
        ...child.attempts.filter((a) => ids.has(a.levelId)).map((a) => a.endedAt),
        ...rows.map((row) => row?.completedAt),
      ]),
    };
  });
}

export interface ChildOverview {
  profileId: string;
  nickname: string;
  levelsDone: number;
  stars: number;
  /** Ledger balance; may be negative (an anomaly). */
  coins: number;
  timeMs: number;
  lastActive: string | null;
  /** Whole days since `lastActive` (Vietnam days); null when never active. */
  daysAway: number | null;
  /** `daysAway` ≥ INACTIVE_DAYS, or never active. */
  away: boolean;
  streak: number;
  bestStreak: number;
}

const dayIndex = (day: string): number => Math.round(Date.parse(`${day}T00:00:00Z`) / MS_PER_DAY);

/** Whole Vietnam calendar days from `iso` to `now`. */
export function daysBetween(iso: string, now: Date): number {
  return Math.max(0, dayIndex(localDay(now)) - dayIndex(localDay(new Date(iso))));
}

export function childOverview(child: ChildData, curriculum: Curriculum, now: Date): ChildOverview {
  const cells = worldCells(child, curriculum);
  const last = lastActive(child);
  const daysAway = last === null ? null : daysBetween(last, now);
  const { current, best } = streak(child.ledger, now);
  return {
    profileId: child.profileId,
    nickname: child.nickname,
    levelsDone: cells.reduce((sum, c) => sum + c.levelsDone, 0),
    stars: cells.reduce((sum, c) => sum + c.stars, 0),
    coins: balance(child.ledger),
    timeMs: timePlayedMs(child.attempts),
    lastActive: last,
    daysAway,
    away: daysAway === null || daysAway >= INACTIVE_DAYS,
    streak: current,
    bestStreak: best,
  };
}

export interface ReasonCount {
  reason: string;
  count: number;
}

const isFailed = (result: string): boolean =>
  (FAILED_RESULTS as readonly string[]).includes(result);

/** Failure reasons of failed runs, most frequent first (ties by code). */
export function failureReasons(attempts: readonly AttemptRow[]): ReasonCount[] {
  const counts = new Map<string, number>();
  for (const attempt of attempts) {
    for (const run of attempt.runs) {
      if (!isFailed(run.result)) continue;
      const reason = run.reasonCode ?? run.result.toUpperCase();
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
    }
  }
  return [...counts]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
}

export interface LevelDetail {
  levelId: string;
  stars: number;
  done: boolean;
  firstTryWin: boolean;
  /** Level sessions (enter → leave). */
  sessions: number;
  runs: number;
  failedRuns: number;
  /** Sessions in which each hint tier was bought. */
  hints: { 1: number; 2: number; 3: number };
  timeMs: number;
  reasons: ReasonCount[];
}

/** Per-level detail of one child, for every counted level of `world`. */
export function levelDetails(
  child: ChildData,
  world: World,
  curriculum: Curriculum,
): LevelDetail[] {
  const progress = new Map(child.progress.map((row) => [row.levelId, row]));
  return countedLevels(world, curriculum).map((level) => {
    const attempts = child.attempts.filter((a) => a.levelId === level.id);
    const row = progress.get(level.id);
    const runs = attempts.flatMap((a) => a.runs);
    const hintSessions = (tier: 1 | 2 | 3) =>
      attempts.filter((a) => a.hintTiersBought.includes(tier)).length;
    return {
      levelId: level.id,
      stars: row?.bestStars ?? 0,
      done: row?.completedAt != null,
      firstTryWin: row?.firstTryWin ?? false,
      sessions: attempts.length,
      runs: runs.length,
      failedRuns: runs.filter((r) => isFailed(r.result)).length,
      hints: { 1: hintSessions(1), 2: hintSessions(2), 3: hintSessions(3) },
      timeMs: timePlayedMs(attempts),
      reasons: failureReasons(attempts),
    };
  });
}

/** Monday of the Vietnam week of `day` ('YYYY-MM-DD'). */
export function weekStart(day: string): string {
  const index = dayIndex(day);
  // 1970-01-01 was a Thursday: (index + 3) % 7 is 0 on Mondays.
  const monday = index - ((index + 3) % 7);
  return new Date(monday * MS_PER_DAY).toISOString().slice(0, 10);
}

export interface WeekMinutes {
  /** Monday, 'YYYY-MM-DD'. */
  week: string;
  minutes: number;
}

/** Minutes in level sessions per week (by session start), oldest first, ending with this week. */
export function weeklyMinutes(
  attempts: readonly AttemptRow[],
  now: Date,
  weeks = 4,
): WeekMinutes[] {
  const thisWeek = dayIndex(weekStart(localDay(now)));
  const list = Array.from({ length: weeks }, (_, i) => ({
    week: new Date((thisWeek - 7 * (weeks - 1 - i)) * MS_PER_DAY).toISOString().slice(0, 10),
    ms: 0,
  }));
  for (const attempt of attempts) {
    const week = weekStart(localDay(new Date(attempt.startedAt)));
    const slot = list.find((w) => w.week === week);
    if (slot) slot.ms += sessionMs(attempt);
  }
  return list.map(({ week, ms }) => ({ week, minutes: Math.round(ms / 60_000) }));
}

// ---------- The group ----------

export interface ConceptStat {
  worldId: string;
  concept: string;
  runs: number;
  failedRuns: number;
  /** failedRuns / runs; 0 without runs. */
  failRate: number;
  reasons: ReasonCount[];
}

/** Failure rate by world (each world teaches one concept), with its top reasons. */
export function weakConcepts(
  children: readonly ChildData[],
  curriculum: Curriculum,
): ConceptStat[] {
  return curriculum.worlds.map((world) => {
    const ids = new Set(world.levelIds);
    const attempts = children.flatMap((c) => c.attempts.filter((a) => ids.has(a.levelId)));
    const runs = attempts.flatMap((a) => a.runs);
    const failedRuns = runs.filter((r) => isFailed(r.result)).length;
    return {
      worldId: world.id,
      concept: world.concept,
      runs: runs.length,
      failedRuns,
      failRate: runs.length === 0 ? 0 : failedRuns / runs.length,
      reasons: failureReasons(attempts),
    };
  });
}

export type LevelFlag = 'hard' | 'easy';

export interface LevelStat {
  levelId: string;
  worldId: string;
  /** Children who opened the level at least once. */
  children: number;
  sessions: number;
  /** Share of sessions with a tier-3 hint bought. */
  tier3Share: number;
  /** Share of children who finished it whose first session was a win; null if nobody finished. */
  firstTryShare: number | null;
  /** Median length of each child's first won session; null without a win. */
  medianWinMs: number | null;
  failRate: number;
  flags: LevelFlag[];
}

const median = (values: readonly number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[mid] ?? 0)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
};

/**
 * Levels played by at least one child, with the balance signals of rewards-economy.md §6:
 * `hard` when > 40 % of sessions bought tier 3; `easy` when > 95 % of finishers won on the first
 * try and the median first win took < 20 s. Flagged levels first, then by fail rate.
 */
export function levelStats(children: readonly ChildData[], curriculum: Curriculum): LevelStat[] {
  const stats: LevelStat[] = [];
  for (const world of curriculum.worlds) {
    for (const level of countedLevels(world, curriculum)) {
      const per = children.map((child) => ({
        attempts: [...child.attempts.filter((a) => a.levelId === level.id)].sort((a, b) =>
          a.startedAt.localeCompare(b.startedAt),
        ),
        progress: child.progress.find((p) => p.levelId === level.id),
      }));
      const sessions = per.flatMap((p) => p.attempts);
      if (sessions.length === 0) continue;
      const finishers = per.filter((p) => p.progress?.completedAt != null);
      const firstWins = per
        .map((p) => p.attempts.find((a) => a.won))
        .filter((a): a is AttemptRow => a !== undefined)
        .map(sessionMs);
      const runs = sessions.flatMap((a) => a.runs);
      const tier3Share =
        sessions.filter((a) => a.hintTiersBought.includes(3)).length / sessions.length;
      const firstTryShare =
        finishers.length === 0
          ? null
          : finishers.filter((p) => p.progress?.firstTryWin === true).length / finishers.length;
      const medianWinMs = median(firstWins);
      const flags: LevelFlag[] = [];
      if (tier3Share > TIER3_SHARE_HARD) flags.push('hard');
      if (
        firstTryShare !== null &&
        firstTryShare > FIRST_TRY_EASY &&
        medianWinMs !== null &&
        medianWinMs < EASY_WIN_MS
      ) {
        flags.push('easy');
      }
      stats.push({
        levelId: level.id,
        worldId: world.id,
        children: per.filter((p) => p.attempts.length > 0).length,
        sessions: sessions.length,
        tier3Share,
        firstTryShare,
        medianWinMs,
        failRate:
          runs.length === 0 ? 0 : runs.filter((r) => isFailed(r.result)).length / runs.length,
        flags,
      });
    }
  }
  return stats.sort((a, b) => b.flags.length - a.flags.length || b.failRate - a.failRate);
}

// ---------- Coins ----------

/** Highest delta each earning reason may carry (mirrors the server's `ledger_guard`). */
const EARN_CAPS: Partial<Record<LedgerReason, number>> = {
  starter: COINS.starter,
  'level-clear': COINS.levelClear,
  'star-2': COINS.star2,
  'star-3': COINS.star3,
  'first-try': COINS.firstTry,
  lesson: COINS.lesson,
  daily: COINS.daily,
  'streak-7': COINS.streakMilestone,
  replay: COINS.replay,
  creative: COINS.creativeFirstSave,
  'group-goal': COINS.groupGoal,
};
const SPEND_REASONS: readonly LedgerReason[] = [
  'hint-1',
  'hint-2',
  'hint-3',
  'shop',
  'bonus-level',
];

export type CoinIssue =
  | { kind: 'negative'; balance: number }
  | { kind: 'high'; balance: number }
  | { kind: 'over-cap'; entryId: string; reason: LedgerReason; delta: number }
  | { kind: 'replay-cap'; day: string; count: number };

/**
 * Unusual coins of one child (replaces the server view `v_ledger_anomalies`): a negative
 * balance, a balance above 400, a line above its reason's cap (or a spend that adds coins), and
 * more than REPLAY_DAILY_CAP replay coins in one day.
 */
export function coinIssues(ledger: readonly LedgerRow[]): CoinIssue[] {
  const issues: CoinIssue[] = [];
  const total = balance(ledger);
  if (total < 0) issues.push({ kind: 'negative', balance: total });
  if (total > BALANCE_HIGH) issues.push({ kind: 'high', balance: total });
  const replays = new Map<string, number>();
  for (const entry of ledger) {
    const cap = EARN_CAPS[entry.reason];
    const over =
      cap !== undefined
        ? entry.delta > cap || entry.delta < 0
        : SPEND_REASONS.includes(entry.reason) && entry.delta > 0;
    if (over) {
      issues.push({
        kind: 'over-cap',
        entryId: entry.id,
        reason: entry.reason,
        delta: entry.delta,
      });
    }
    if (entry.reason === 'replay') {
      replays.set(entry.localDay, (replays.get(entry.localDay) ?? 0) + 1);
    }
  }
  for (const [day, count] of [...replays].sort()) {
    if (count > REPLAY_DAILY_CAP) issues.push({ kind: 'replay-cap', day, count });
  }
  return issues;
}

/** Group average balance against rewards-economy.md §6; null without children. */
export function averageBalance(
  children: readonly ChildData[],
): { average: number; signal: 'high' | 'low' | null } | null {
  if (children.length === 0) return null;
  const average = children.reduce((sum, c) => sum + balance(c.ledger), 0) / children.length;
  return {
    average,
    signal: average > BALANCE_HIGH ? 'high' : average < BALANCE_LOW ? 'low' : null,
  };
}

// ---------- CSV ----------

/** RFC 4180 field; a leading = + - @ is defused so a spreadsheet never runs it as a formula. */
export function csvField(value: string | number): string {
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export const CSV_HEADER = [
  'Biệt danh',
  'Thế giới',
  'Màn xong',
  'Số màn',
  'Sao',
  'Sao tối đa',
  'Học gần nhất (thế giới)',
  'Xu',
  'Chuỗi ngày',
  'Phút học',
  'Học gần nhất',
  'Nguồn',
] as const;

const sourceLabel = (sources: readonly ChildSource[]): string =>
  sources.map((s) => (s.kind === 'local' ? 'máy này' : s.name)).join(' + ');

/**
 * The coach's summary, one line per child × world (UTF-8 with BOM so Excel shows Vietnamese).
 * Dates are Vietnam days; times are whole minutes.
 */
export function summaryCsv(
  children: readonly ChildData[],
  curriculum: Curriculum,
  now: Date,
): string {
  const day = (iso: string | null) => (iso === null ? '' : localDay(new Date(iso)));
  const lines = [CSV_HEADER.map(csvField).join(',')];
  for (const child of children) {
    const overview = childOverview(child, curriculum, now);
    for (const cell of worldCells(child, curriculum)) {
      lines.push(
        [
          child.nickname,
          cell.worldId,
          cell.levelsDone,
          cell.levelsTotal,
          cell.stars,
          cell.maxStars,
          day(cell.lastActive),
          overview.coins,
          overview.streak,
          Math.round(overview.timeMs / 60_000),
          day(overview.lastActive),
          sourceLabel(child.sources),
        ]
          .map(csvField)
          .join(','),
      );
    }
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
