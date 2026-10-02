import { balance } from '@codequest/rewards';
import { db, type LedgerRow } from '../db';
import { enqueue } from './outbox';

// Append-only coin ledger (rewards-engine.md §1). Entries come from @codequest/rewards; this
// module only stores them. The key [profileId+id] makes every write idempotent.

/**
 * Adds the entries whose id is new for their profile and returns those (a duplicate is silently
 * skipped). Joins the caller's transaction when one is open on `ledger` + `outbox`.
 */
export function addLedgerEntries(
  entries: readonly LedgerRow[],
  now: Date = new Date(),
): Promise<LedgerRow[]> {
  return db.transaction('rw', db.ledger, db.outbox, async () => {
    const existing = await db.ledger.bulkGet(entries.map((e) => [e.profileId, e.id]));
    const seen = new Set<string>();
    const fresh = entries.filter((entry, i) => {
      const key = `${entry.profileId}\u0000${entry.id}`;
      if (existing[i] !== undefined || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    await db.ledger.bulkAdd(fresh);
    for (const entry of fresh) await enqueue('ledger', entry, now);
    return fresh;
  });
}

export function listLedger(profileId: string): Promise<LedgerRow[]> {
  return db.ledger.where('profileId').equals(profileId).toArray();
}

export async function getBalance(profileId: string): Promise<number> {
  return balance(await listLedger(profileId));
}

export type SpendResult = { ok: true; entry: LedgerRow | null } | { ok: false; missing: number };

/**
 * Atomic purchase: re-reads the balance inside the rw transaction and adds `entry` (a negative
 * delta; the price is `-entry.delta`) only when the balance covers it, so two quick taps cannot
 * spend the same coins twice. An entry already in the ledger (same id) is a no-op: `entry: null`.
 */
export function spend(entry: LedgerRow, now: Date = new Date()): Promise<SpendResult> {
  if (entry.delta >= 0) return Promise.reject(new Error('spend: delta must be negative'));
  return db.transaction('rw', db.ledger, db.outbox, async (): Promise<SpendResult> => {
    if (await db.ledger.get([entry.profileId, entry.id])) return { ok: true, entry: null };
    const missing = -entry.delta - balance(await listLedger(entry.profileId));
    if (missing > 0) return { ok: false, missing };
    await addLedgerEntries([entry], now);
    return { ok: true, entry };
  });
}
