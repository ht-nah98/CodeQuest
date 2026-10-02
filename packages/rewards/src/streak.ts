import { dayNumber, localDay } from './localDay';
import type { LedgerEntry } from './types';

/**
 * Learning-day streak from the `daily` ledger lines (one per day with a win or a lesson).
 * Assumes ONE profile's ledger. `current` still counts when today has no activity yet but
 * yesterday had; `daily` lines dated after `now` (device clock skew) are ignored.
 */
export function streak(
  ledger: readonly LedgerEntry[],
  now: Date,
): { current: number; best: number } {
  const today = dayNumber(localDay(now));
  const days = new Set<number>();
  for (const entry of ledger) {
    if (entry.reason !== 'daily') continue;
    const day = dayNumber(entry.localDay);
    if (day <= today) days.add(day);
  }

  let best = 0;
  for (const day of days) {
    if (days.has(day - 1)) continue; // only start counting at the first day of a run
    let length = 1;
    while (days.has(day + length)) length++;
    best = Math.max(best, length);
  }

  let end = days.has(today) ? today : today - 1;
  let current = 0;
  while (days.has(end)) {
    current++;
    end--;
  }
  return { current, best };
}
