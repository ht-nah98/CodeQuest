import { mergeProgress, type LevelProgress } from '@codequest/rewards';
import { db, type LedgerRow, type ProgressRow } from '../db';
import { addLedgerEntries } from './ledger';
import { enqueue } from './outbox';

// Best result per (profile, level). Writes go through mergeProgress, so progress only improves
// and saving the same result twice changes nothing (data-sync-auth.md §1).

export function getProgress(profileId: string, levelId: string): Promise<ProgressRow | undefined> {
  return db.progress.get([profileId, levelId]);
}

export function listProgress(profileId: string): Promise<ProgressRow[]> {
  return db.progress.where('profileId').equals(profileId).toArray();
}

/** levelId → progress, the shape `isUnlocked` and `evaluateBadges` take. */
export function toProgressMap(rows: readonly ProgressRow[]): Map<string, LevelProgress> {
  return new Map(rows.map((row) => [row.levelId, row]));
}

function sameProgress(a: LevelProgress, b: LevelProgress): boolean {
  return (
    a.bestStars === b.bestStars &&
    a.bestBlocks === b.bestBlocks &&
    a.completedAt === b.completedAt &&
    a.firstTryWin === b.firstTryWin &&
    a.attempts === b.attempts
  );
}

/**
 * Merges `progress` into the stored row and returns the result. No write (and no outbox line)
 * when nothing improves. Joins the caller's transaction when one is open.
 */
export function saveProgress(
  profileId: string,
  progress: LevelProgress,
  now: Date = new Date(),
): Promise<ProgressRow> {
  return db.transaction('rw', db.progress, db.outbox, async () => {
    const stored = await db.progress.get([profileId, progress.levelId]);
    const merged = stored ? mergeProgress(stored, progress) : progress;
    if (stored && sameProgress(stored, merged)) return stored;
    const row: ProgressRow = {
      levelId: merged.levelId,
      bestStars: merged.bestStars,
      bestBlocks: merged.bestBlocks,
      completedAt: merged.completedAt,
      firstTryWin: merged.firstTryWin,
      attempts: merged.attempts,
      profileId,
      updatedAt: now.toISOString(),
    };
    await db.progress.put(row);
    await enqueue('progress', row, now);
    return row;
  });
}

export interface LevelResult {
  profileId: string;
  /** `newProgress` from computeLevelRewards. */
  progress: LevelProgress;
  /** `entries` from computeLevelRewards. */
  entries: readonly LedgerRow[];
}

/**
 * Stores one winning run atomically: progress and coins both land, or neither. The attempt
 * (level session) is not part of it: a session can go on after a win, so it is written once,
 * with `saveAttempt`, when the child leaves the level.
 */
export function saveLevelResult(result: LevelResult, now: Date = new Date()): Promise<void> {
  return db.transaction('rw', db.progress, db.ledger, db.outbox, async () => {
    await saveProgress(result.profileId, result.progress, now);
    await addLedgerEntries(result.entries, now);
  });
}
