import { unrecordedRuns } from './session';
import type { LevelProgress, LevelSession, StarCount } from './types';

function minNullable(a: number | null, b: number | null): number | null {
  if (a === null) return b;
  if (b === null) return a;
  return Math.min(a, b);
}

/** Unparsable timestamps count as "not completed" so the merge order stays total. */
function validIso(value: string | null): string | null {
  return value !== null && !Number.isNaN(Date.parse(value)) ? value : null;
}

function earliestIso(rawA: string | null, rawB: string | null): string | null {
  const a = validIso(rawA);
  const b = validIso(rawB);
  if (a === null) return b;
  if (b === null) return a;
  const diff = Date.parse(a) - Date.parse(b);
  // Same instant written differently: pick by string so the merge stays commutative.
  if (diff === 0) return a <= b ? a : b;
  return diff < 0 ? a : b;
}

/**
 * Merges two records of the same level (local vs server, data-sync-auth.md §3): max stars,
 * min blocks, earliest completion, OR of first-try, max attempts. Commutative, associative,
 * idempotent. Invalid ISO times count as null. Throws when the level ids differ (a caller bug).
 */
export function mergeProgress(a: LevelProgress, b: LevelProgress): LevelProgress {
  if (a.levelId !== b.levelId) {
    throw new Error(`mergeProgress: level ids differ (${a.levelId} vs ${b.levelId})`);
  }
  return {
    levelId: a.levelId,
    bestStars: Math.max(a.bestStars, b.bestStars) as StarCount,
    bestBlocks: minNullable(a.bestBlocks, b.bestBlocks),
    completedAt: earliestIso(a.completedAt, b.completedAt),
    firstTryWin: a.firstTryWin || b.firstTryWin,
    attempts: Math.max(a.attempts, b.attempts),
  };
}

/** Progress of a level nobody has played yet. */
export function emptyProgress(levelId: string): LevelProgress {
  return {
    levelId,
    bestStars: 0,
    bestBlocks: null,
    completedAt: null,
    firstTryWin: false,
    attempts: 0,
  };
}

/**
 * Progress after leaving a level session, adding the runs made since its last win to
 * `attempts`. Call it on every exit (won or not) so that "first try" stays correct.
 */
export function recordSession(
  progress: LevelProgress | undefined,
  session: LevelSession,
): LevelProgress {
  if (progress !== undefined && progress.levelId !== session.levelId) {
    throw new Error(
      `recordSession: progress of ${progress.levelId} with session of ${session.levelId}`,
    );
  }
  const base = progress ?? emptyProgress(session.levelId);
  return { ...base, attempts: base.attempts + unrecordedRuns(session.runs) };
}
