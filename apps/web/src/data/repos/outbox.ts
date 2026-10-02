import { db, type OutboxRow, type SyncedRows, type SyncedTable } from '../db';

// Queue of local writes to push to Supabase in phase 2 (data-sync-auth.md §4). Nothing flushes
// it yet. Repositories call `enqueue` inside the same Dexie transaction as the data write, so
// a row and its outbox line are committed or rolled back together.

/** Must run inside a transaction that includes `outbox`. */
export async function enqueue<T extends SyncedTable>(
  table: T,
  payload: SyncedRows[T],
  now: Date,
): Promise<void> {
  await db.outbox.add({ table, payload, createdAt: now.toISOString(), tries: 0 });
}

/** Oldest first. */
export function listOutbox(limit = 100): Promise<OutboxRow[]> {
  return db.outbox.orderBy('seq').limit(limit).toArray();
}

export function countOutbox(): Promise<number> {
  return db.outbox.count();
}
