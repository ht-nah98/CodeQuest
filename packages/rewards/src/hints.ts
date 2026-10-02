import type { Level } from '@codequest/content-schema';
import { HINT_PRICES, SAFETY_NET } from './config';
import { balance, makeEntry } from './ledger';
import { assertSameLevel, failStreak } from './session';
import type { HintTier, LedgerEntry, LevelSession } from './types';

const HINT_REASON = { 1: 'hint-1', 2: 'hint-2', 3: 'hint-3' } as const;

/** Ledger id of a hint purchase (rewards-engine.md §4); tier 1 ignores `purchaseId`. */
export function hintEntryId(tier: HintTier, levelId: string, purchaseId: string): string {
  // Tier 1 is bought once per level and then free forever, so its id has no purchase part.
  return tier === 1 ? `hint-1:${levelId}` : `${HINT_REASON[tier]}:${levelId}:${purchaseId}`;
}

/** Tier 1 of `levelId` was bought (or claimed free) before: it reopens for free. */
export function isHintOwned(levelId: string, ledger: readonly LedgerEntry[]): boolean {
  const id = hintEntryId(1, levelId, '');
  return ledger.some((entry) => entry.id === id);
}

/**
 * Price of a hint tier now, with the safety net: tier 1 is free once bought for this level
 * or after 3 failed runs in a row; tier 2 costs 5 after 6 failed runs in a row.
 */
export function hintPrice(
  tier: HintTier,
  session: LevelSession,
  ledger: readonly LedgerEntry[],
): number {
  const fails = failStreak(session);
  switch (tier) {
    case 1: {
      return isHintOwned(session.levelId, ledger) || fails >= SAFETY_NET.freeTier1AfterFails
        ? 0
        : HINT_PRICES[1];
    }
    case 2:
      return fails >= SAFETY_NET.discountTier2AfterFails
        ? SAFETY_NET.discountedTier2Price
        : HINT_PRICES[2];
    case 3:
      return HINT_PRICES[3];
  }
}

export type BuyHintResult =
  { ok: true; entry: LedgerEntry | null } | { ok: false; missing: number };

/**
 * Buys a hint tier. `entry` is null when nothing must be written (already owned or paid
 * for this `purchaseId`); a safety-net tier 1 gives a delta-0 line so it stays owned.
 * `missing` = coins still lacking. Throws on caller bugs (predict tier 2–3, other level).
 */
export function buyHint(input: {
  tier: HintTier;
  level: Level;
  session: LevelSession;
  ledger: readonly LedgerEntry[];
  now: Date;
  profileId: string;
  /** Unique per click (uuid from the caller); makes tier 2–3 retries idempotent. */
  purchaseId: string;
}): BuyHintResult {
  const { tier, level, session, ledger, now, profileId, purchaseId } = input;
  if (level.mode === 'predict' && tier !== 1) {
    throw new Error(`buyHint: predict level ${level.id} only has hint tier 1`);
  }
  assertSameLevel(level, session);
  const id = hintEntryId(tier, level.id, purchaseId);
  if (ledger.some((entry) => entry.id === id)) return { ok: true, entry: null };
  const price = hintPrice(tier, session, ledger);
  const coins = balance(ledger);
  if (coins < price) return { ok: false, missing: price - Math.max(0, coins) };
  // A free tier 1 (safety net) is still written, delta 0, so it stays owned forever.
  // `0 - price`, not `-price`: the free line must be 0, not -0.
  return { ok: true, entry: makeEntry(profileId, id, HINT_REASON[tier], 0 - price, level.id, now) };
}
