import type { BadgeEvent, Level, RunSummary } from '@codequest/content-schema';

// Shapes from docs/architecture/rewards-engine.md §2 and §5. Built only on content-schema
// types: rewards must not import the engine.

export type StarCount = 0 | 1 | 2 | 3;
export type HintTier = 1 | 2 | 3;

/** Best result of one child on one level. */
export interface LevelProgress {
  levelId: string;
  bestStars: StarCount;
  bestBlocks: number | null;
  /** ISO timestamp. */
  completedAt: string | null;
  firstTryWin: boolean;
  attempts: number;
}

/** From entering a level until leaving it. */
export interface LevelSession {
  levelId: string;
  runs: RunSummary[];
  hintTiersBought: HintTier[];
}

export type LedgerReason =
  | 'level-clear'
  | 'star-2'
  | 'star-3'
  | 'first-try'
  | 'lesson'
  | 'daily'
  | 'streak-7'
  | 'replay'
  | 'creative'
  | 'group-goal'
  | 'hint-1'
  | 'hint-2'
  | 'hint-3'
  | 'shop'
  | 'bonus-level'
  | 'starter'
  | 'coach-adjust';

/** One append-only coin ledger line; `id` is the idempotency key (rewards-engine.md §4). */
export interface LedgerEntry {
  id: string;
  profileId: string;
  delta: number;
  reason: LedgerReason;
  refId: string | null;
  /** ISO timestamp, device clock. */
  at: string;
  /** 'YYYY-MM-DD' in Asia/Ho_Chi_Minh. */
  localDay: string;
}

/** Inputs of `evaluateBadges`. */
export interface BadgeContext {
  levels: Map<string, Level>;
  progress: Map<string, LevelProgress>;
  /** levelId → blockTypesUsed of the best winning run. */
  solutionsUsed: Map<string, Record<string, number>>;
  predictFirstTry: Set<string>;
  streak: { current: number; best: number };
  events: Set<BadgeEvent>;
  owned: Set<string>;
}
