import { COACH_PROFILE_ID, db, type OutboxRow, type SyncedRows, type SyncedTable } from '../db';

// Queue of local writes to push to Supabase in phase 2 (data-sync-auth.md §4). Nothing flushes
// it yet. Repositories call `enqueue` inside the same Dexie transaction as the data write, so
// a row and its outbox line are committed or rolled back together.

/**
 * Must run inside a transaction that includes `outbox`. The coach review profile is never
 * queued: it is not a student and must not reach the server (data-sync-auth.md §5).
 */
export async function enqueue<T extends SyncedTable>(
  table: T,
  payload: SyncedRows[T],
  now: Date,
): Promise<void> {
  if (payload.profileId === COACH_PROFILE_ID) return;
  await db.outbox.add({ table, payload, createdAt: now.toISOString(), tries: 0 });
}

/** Oldest first. */
export function listOutbox(limit = 100): Promise<OutboxRow[]> {
  return db.outbox.orderBy('seq').limit(limit).toArray();
}

export function countOutbox(): Promise<number> {
  return db.outbox.count();
}
