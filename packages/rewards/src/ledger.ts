import { REPLAY_DAILY_CAP } from './config';
import { localDay } from './localDay';
import type { LedgerEntry, LedgerReason } from './types';

/** Builds one ledger line stamped with `now` (ISO time + Vietnam local day). */
export function makeEntry(
  profileId: string,
  id: string,
  reason: LedgerReason,
  delta: number,
  refId: string | null,
  now: Date,
): LedgerEntry {
  return { id, profileId, delta, reason, refId, at: now.toISOString(), localDay: localDay(now) };
}

/** First entry of each `id`: the ledger is a set keyed by id (rewards-engine.md §1). */
export function uniqueEntries(ledger: readonly LedgerEntry[]): LedgerEntry[] {
  const seen = new Set<string>();
  return ledger.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

/**
 * Coin balance: sum of unique entries, counting only the first REPLAY_DAILY_CAP `replay`
 * lines (by id) of each local day, so devices that wrote offline agree after a merge.
 * Assumes the ledger of ONE profile; may be negative after merging offline spends.
 */
export function balance(ledger: readonly LedgerEntry[]): number {
  const replaysByDay = new Map<string, LedgerEntry[]>();
  let total = 0;
  for (const entry of uniqueEntries(ledger)) {
    if (entry.reason === 'replay') {
      const day = replaysByDay.get(entry.localDay) ?? [];
      day.push(entry);
      replaysByDay.set(entry.localDay, day);
    } else {
      total += entry.delta;
    }
  }
  for (const replays of replaysByDay.values()) {
    replays.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    for (const entry of replays.slice(0, REPLAY_DAILY_CAP)) total += entry.delta;
  }
  return total;
}

/** True when the balance of one profile's ledger covers `price`. */
export function canAfford(ledger: readonly LedgerEntry[], price: number): boolean {
  return balance(ledger) >= price;
}
