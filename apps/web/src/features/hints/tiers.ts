import type { Level } from '@codequest/content-schema';
import {
  balance,
  hintPrice,
  type HintTier,
  isHintOwned,
  type LedgerEntry,
  type LevelSession,
} from '@codequest/rewards';

export const HINT_TIERS: readonly HintTier[] = [1, 2, 3];

/** The parts of a level the hint box reads. */
export type HintBoxLevel = Pick<Level, 'id' | 'mode' | 'thinkingHint' | 'solution'>;

/**
 * How one tier looks in the hint box:
 * - `owned`: opens again for free (tier 1 bought before, tier 3 bought this session);
 * - `free`: costs 0 now (safety net), buying it makes tier 1 owned for good;
 * - `buy`: affordable at `price`;
 * - `locked`: the child lacks `missing` coins.
 */
export type TierState = 'owned' | 'free' | 'buy' | 'locked';

export interface TierView {
  tier: HintTier;
  state: TierState;
  price: number;
  /** Coins lacking; 0 unless `locked`. */
  missing: number;
}

/**
 * Tiers this level offers (rewards-economy.md §2): tier 1 needs a thinking hint; tiers 2–3 need a
 * solution and never exist in `predict` (nor in `creative`, which has no solution to show).
 */
export function availableTiers(level: HintBoxLevel): HintTier[] {
  return HINT_TIERS.filter((tier) =>
    tier === 1
      ? level.thinkingHint !== undefined
      : level.mode !== 'predict' && level.mode !== 'creative' && level.solution !== undefined,
  );
}

/** Tier 1 bought before (any session) or tier 3 bought in this session: opening again is free. */
export function isTierOwned(
  tier: HintTier,
  levelId: string,
  ledger: readonly LedgerEntry[],
  tiersBought: readonly HintTier[],
): boolean {
  if (tier === 1) return isHintOwned(levelId, ledger);
  return tier === 3 && tiersBought.includes(3);
}

/**
 * The hint box rows. `session` gives the safety net (its runs), `tiersBought` the tiers bought in
 * this session (tier 3 reopens for free). Pure and cheap: compute it on every render.
 */
export function tierViews(
  level: HintBoxLevel,
  session: LevelSession,
  ledger: readonly LedgerEntry[],
  tiersBought: readonly HintTier[] = session.hintTiersBought,
): TierView[] {
  const coins = Math.max(0, balance(ledger));
  return availableTiers(level).map((tier): TierView => {
    if (isTierOwned(tier, level.id, ledger, tiersBought)) {
      return { tier, state: 'owned', price: 0, missing: 0 };
    }
    const price = hintPrice(tier, session, ledger);
    if (price === 0) return { tier, state: 'free', price, missing: 0 };
    if (coins < price) return { tier, state: 'locked', price, missing: price - coins };
    return { tier, state: 'buy', price, missing: 0 };
  });
}
