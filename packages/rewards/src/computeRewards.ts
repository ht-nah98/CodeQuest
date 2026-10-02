import type { Level, RunSummary } from '@codequest/content-schema';
import { COINS, REPLAY_DAILY_CAP, STREAK_MILESTONE_DAYS } from './config';
import { computeStars } from './computeStars';
import { makeEntry, uniqueEntries } from './ledger';
import { localDay } from './localDay';
import { emptyProgress, mergeProgress } from './progress';
import { assertSameLevel, isCountedRun, runsBefore, unrecordedRuns } from './session';
import { streak } from './streak';
import type { LedgerEntry, LevelProgress, LevelSession, StarCount } from './types';

/**
 * Collects new ledger lines, skipping ids already in the ledger or already collected,
 * so recording the same event twice yields the same set of lines.
 */
class EntryBatch {
  readonly entries: LedgerEntry[] = [];
  private readonly ids: Set<string>;

  constructor(
    ledger: readonly LedgerEntry[],
    private readonly profileId: string,
    private readonly now: Date,
  ) {
    this.ids = new Set(ledger.map((entry) => entry.id));
  }

  has(id: string): boolean {
    return this.ids.has(id);
  }

  add(id: string, reason: LedgerEntry['reason'], delta: number, refId: string | null): void {
    if (this.ids.has(id)) return;
    this.ids.add(id);
    this.entries.push(makeEntry(this.profileId, id, reason, delta, refId, this.now));
  }
}

/** `daily` on the first learning activity of the local day, plus `streak-7` at 7, 14, 21… */
function addDailyBonus(batch: EntryBatch, ledger: readonly LedgerEntry[], now: Date): void {
  const today = localDay(now);
  if (batch.has(`daily:${today}`)) return;
  batch.add(`daily:${today}`, 'daily', COINS.daily, null);
  const { current } = streak([...ledger, ...batch.entries], now);
  if (current > 0 && current % STREAK_MILESTONE_DAYS === 0) {
    batch.add(`streak-7:${today}`, 'streak-7', COINS.streakMilestone, null);
  }
}

export interface LevelRewards {
  stars: StarCount;
  newProgress: LevelProgress;
  entries: LedgerEntry[];
  /** Always empty until badges ship (phase 4). */
  newBadges: string[];
}

/**
 * Rewards for one winning run: stars, the merged progress and the new ledger lines
 * (first clear, ⭐⭐, ⭐⭐⭐, first try, replay, daily, streak). Pass `progress` and `ledger`
 * as they were right before this run; `applyRun` threads them for you. Creative levels are
 * handed to `computeCreativeSaveRewards`. Throws if `session` belongs to another level.
 */
export function computeLevelRewards(input: {
  level: Level;
  session: LevelSession;
  winning: RunSummary;
  progress: LevelProgress | undefined;
  ledger: readonly LedgerEntry[];
  now: Date;
  profileId: string;
}): LevelRewards {
  const { level, session, winning, ledger, now, profileId } = input;
  assertSameLevel(level, session);
  if (level.mode === 'creative') {
    return { stars: 0, ...computeCreativeSaveRewards(input), newBadges: [] };
  }
  const before = input.progress ?? emptyProgress(level.id);
  const batch = new EntryBatch(ledger, profileId, now);
  const earlier = runsBefore(session, winning);

  const stars = computeStars(level, session, winning, before);
  if (winning.result !== 'success') {
    return { stars, newProgress: before, entries: [], newBadges: [] };
  }

  const firstTry =
    before.attempts === 0 &&
    before.completedAt === null &&
    !batch.has(`level-clear:${level.id}`) &&
    !earlier.some(isCountedRun);
  const thisWin: LevelProgress = {
    levelId: level.id,
    bestStars: stars,
    bestBlocks: winning.blocksUsed,
    completedAt: now.toISOString(),
    firstTryWin: firstTry,
    attempts: before.attempts + unrecordedRuns(earlier) + 1,
  };

  batch.add(`level-clear:${level.id}`, 'level-clear', COINS.levelClear, level.id);
  if (stars >= 2) batch.add(`star-2:${level.id}`, 'star-2', COINS.star2, level.id);
  if (stars >= 3) batch.add(`star-3:${level.id}`, 'star-3', COINS.star3, level.id);
  if (firstTry) batch.add(`first-try:${level.id}`, 'first-try', COINS.firstTry, level.id);
  if (before.bestStars === 3) {
    const today = localDay(now);
    const replaysToday = uniqueEntries(ledger).filter(
      (entry) => entry.reason === 'replay' && entry.localDay === today,
    ).length;
    if (replaysToday < REPLAY_DAILY_CAP) {
      batch.add(`replay:${winning.runId}`, 'replay', COINS.replay, level.id);
    }
  }
  addDailyBonus(batch, ledger, now);

  return {
    stars,
    newProgress: mergeProgress(before, thisWin),
    entries: batch.entries,
    newBadges: [],
  };
}

/**
 * Saving a `creative` level: +10 on the first save of each level, completion recorded, no
 * stars and no daily bonus (a save is not a win).
 */
export function computeCreativeSaveRewards(input: {
  level: Level;
  progress: LevelProgress | undefined;
  ledger: readonly LedgerEntry[];
  now: Date;
  profileId: string;
}): { newProgress: LevelProgress; entries: LedgerEntry[] } {
  const { level, ledger, now, profileId } = input;
  if (level.mode !== 'creative') {
    throw new Error(`computeCreativeSaveRewards: level ${level.id} is not creative`);
  }
  const before = input.progress ?? emptyProgress(level.id);
  const batch = new EntryBatch(ledger, profileId, now);
  batch.add(`creative:${level.id}`, 'creative', COINS.creativeFirstSave, level.id);
  const saved = { ...emptyProgress(level.id), completedAt: now.toISOString() };
  return { newProgress: mergeProgress(before, saved), entries: batch.entries };
}

/** State one profile carries through a level session (see `applyRun`). */
export interface RunState {
  progress: LevelProgress | undefined;
  ledger: readonly LedgerEntry[];
}

/**
 * Reducer for one finished run: call it after every run, in order, feeding back the state
 * it returns, so a second win in the same session sees the first win's progress and lines.
 * `session` must already contain `run`. `rewards` is null for a run that did not succeed.
 */
export function applyRun(
  state: RunState,
  input: { level: Level; session: LevelSession; run: RunSummary; now: Date; profileId: string },
): { progress: LevelProgress | undefined; ledger: LedgerEntry[]; rewards: LevelRewards | null } {
  const { level, session, run, now, profileId } = input;
  assertSameLevel(level, session);
  if (run.result !== 'success' || level.mode === 'creative') {
    return { progress: state.progress, ledger: [...state.ledger], rewards: null };
  }
  const rewards = computeLevelRewards({
    level,
    session,
    winning: run,
    progress: state.progress,
    ledger: state.ledger,
    now,
    profileId,
  });
  return {
    progress: rewards.newProgress,
    ledger: [...state.ledger, ...rewards.entries],
    rewards,
  };
}

/** Ledger lines for finishing a lesson: `lesson` the first time, plus daily bonus and streak. */
export function computeLessonRewards(input: {
  lessonId: string;
  ledger: readonly LedgerEntry[];
  now: Date;
  profileId: string;
}): LedgerEntry[] {
  const { lessonId, ledger, now, profileId } = input;
  const batch = new EntryBatch(ledger, profileId, now);
  batch.add(`lesson:${lessonId}`, 'lesson', COINS.lesson, lessonId);
  addDailyBonus(batch, ledger, now);
  return batch.entries;
}

/** The one-time welcome coins of a new profile (`starter`). */
export function starterEntry(profileId: string, now: Date): LedgerEntry {
  return makeEntry(profileId, 'starter', 'starter', COINS.starter, null, now);
}
