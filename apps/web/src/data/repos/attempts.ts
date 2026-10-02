import { db, type AttemptRow } from '../db';
import { enqueue } from './outbox';

// One row per level session (enter → leave), for the coach corner metrics (rewards-economy.md §6).
// Attempts are insert-once on the server (data-sync-auth.md §3), so a row is written exactly once,
// when the session ends, with its final runs; the open session lives in the play screen's store.

export function newAttemptId(): string {
  return crypto.randomUUID();
}

/**
 * Writes the finished attempt and queues it for sync. Returns false (and writes nothing) when an
 * attempt with this id is already stored: attempts are write-once.
 */
export function saveAttempt(attempt: AttemptRow, now: Date = new Date()): Promise<boolean> {
  return db.transaction('rw', db.attempts, db.outbox, async () => {
    if (await db.attempts.get(attempt.id)) return false;
    await db.attempts.add(attempt);
    await enqueue('attempts', attempt, now);
    return true;
  });
}

export function listAttempts(profileId: string, levelId?: string): Promise<AttemptRow[]> {
  const rows =
    levelId === undefined
      ? db.attempts.where('profileId').equals(profileId)
      : db.attempts.where('[profileId+levelId]').equals([profileId, levelId]);
  return rows.sortBy('startedAt');
}
