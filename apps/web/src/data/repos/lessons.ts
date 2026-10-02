import { db, type LedgerRow, type LessonRow } from '../db';
import { addLedgerEntries } from './ledger';
import { enqueue } from './outbox';

// Lessons the child has finished. Only the first completion is kept.

/**
 * Marks the lesson done (no-op if it already is) and stores its coin entries
 * (`computeLessonRewards`) in the same transaction.
 */
export function markLessonDone(
  profileId: string,
  lessonId: string,
  entries: readonly LedgerRow[] = [],
  now: Date = new Date(),
): Promise<void> {
  return db.transaction('rw', db.lessons, db.ledger, db.outbox, async () => {
    if (!(await db.lessons.get([profileId, lessonId]))) {
      const row: LessonRow = { profileId, lessonId, completedAt: now.toISOString() };
      await db.lessons.add(row);
      await enqueue('lessons', row, now);
    }
    await addLedgerEntries(entries, now);
  });
}

export function listLessonsDone(profileId: string): Promise<LessonRow[]> {
  return db.lessons.where('profileId').equals(profileId).toArray();
}
