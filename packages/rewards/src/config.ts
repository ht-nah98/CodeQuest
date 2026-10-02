import type { LevelStage, RunResult } from '@codequest/content-schema';

// Every number here must match docs/product/rewards-economy.md (the source of truth).

/** Days are counted in Vietnam time (rewards-economy.md, header note). */
export const TIME_ZONE = 'Asia/Ho_Chi_Minh';

/** Coins granted per event (rewards-economy.md §2 "Nguồn xu"). */
export const COINS = {
  starter: 30,
  levelClear: 10,
  star2: 5,
  star3: 5,
  firstTry: 5,
  lesson: 5,
  daily: 10,
  streakMilestone: 50,
  replay: 1,
  creativeFirstSave: 10,
  groupGoal: 20,
} as const;

/** Most coins one level can give, daily bonus excluded: 10 + 5 + 5 + 5. */
export const MAX_LEVEL_COINS = 25;

/** A streak milestone is reached every this many consecutive days (7, 14, 21…). */
export const STREAK_MILESTONE_DAYS = 7;

/** At most this many `replay` coins count per local day. */
export const REPLAY_DAILY_CAP = 5;

/** Hint prices by tier (rewards-economy.md §2 "Tiêu xu"). */
export const HINT_PRICES = { 1: 5, 2: 15, 3: 40 } as const;

/** Anti-frustration safety net within one level session. */
export const SAFETY_NET = {
  /** Consecutive failed runs after which tier 1 becomes free. */
  freeTier1AfterFails: 3,
  /** Consecutive failed runs after which tier 2 is discounted. */
  discountTier2AfterFails: 6,
  discountedTier2Price: 5,
} as const;

/** Results that count as a failed run; `error` does not (rewards-economy.md, definitions). */
export const FAILED_RESULTS: readonly RunResult[] = ['incomplete', 'crash', 'timeout'];

/** Star caps when a hint tier was bought in the current level session. */
export const STAR_CAP_AFTER_HINT = { 2: 2, 3: 1 } as const;

/** Mode predict: stars by attempt number (1st, 2nd, 3rd and later). */
export const PREDICT_STARS_BY_ATTEMPT = [3, 2, 1] as const;

/** Mode bughunt: default `parEdits` for the ⭐⭐ condition. */
export const DEFAULT_PAR_EDITS = 1;

/** Price to open a bonus level, after the boss is beaten. */
export const BONUS_LEVEL_PRICE = 30;

/** Shop price ranges by item kind (bonus levels use BONUS_LEVEL_PRICE). */
export const SHOP_PRICE_RANGES = {
  skin: { min: 50, max: 200 },
  pen: { min: 30, max: 100 },
  fx: { min: 30, max: 100 },
  music: { min: 30, max: 100 },
} as const;

/** Next world opens after the boss and this share of max stars on the counted stages. */
export const WORLD_UNLOCK = {
  minStarRatio: 0.6,
  countedStages: ['guided', 'practice', 'boss'] satisfies LevelStage[],
} as const;
