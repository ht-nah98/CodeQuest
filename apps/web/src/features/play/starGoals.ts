import type { Level, StarGoalKind } from '@codequest/content-schema';
import { DEFAULT_PAR_EDITS } from '@codequest/rewards';
import { vi } from '../../i18n/vi';
import type { WinReward } from './session';

// Star goals on the play screen (P2-21, rewards-economy.md §1): what the "Mục tiêu ⭐" card
// promises before playing, and what the results overlay ticks off after a win. Pure, so the
// wording follows the same rule table as `computeStars` (packages/rewards).

const t = vi.play.starGoals;

/** Whether the level grades star goals: `starGoals` on a build or bughunt level (as rewards). */
export function hasStarGoals<T extends Pick<Level, 'mode' | 'starGoals'>>(
  level: T,
): level is T & { starGoals: NonNullable<Level['starGoals']> } {
  return level.starGoals !== undefined && (level.mode === 'build' || level.mode === 'bughunt');
}

/** One line of the card: from ⭐ to ⭐⭐⭐, each adds to the one before. */
export interface StarGoalRow {
  stars: 1 | 2 | 3;
  /** `win`, the goal kinds (⭐⭐), then `par` (⭐⭐⭐). */
  key: 'win' | StarGoalKind | 'par';
  text: string;
}

/**
 * The card of a level with star goals: ⭐ win, ⭐⭐ + every goal, ⭐⭐⭐ + ≤ par blocks (bughunt:
 * ≤ parEdits edits). Empty for a level without goals (the card is not shown). A build level
 * without `par` has no ⭐⭐⭐ line (rewards never grants it).
 */
export function starGoalRows(
  level: Pick<Level, 'mode' | 'starGoals' | 'par' | 'parEdits'>,
): StarGoalRow[] {
  if (!hasStarGoals(level)) return [];
  const rows: StarGoalRow[] = [{ stars: 1, key: 'win', text: t.win }];
  for (const goal of level.starGoals)
    rows.push({ stars: 2, key: goal.kind, text: t.kinds[goal.kind] });
  if (level.mode === 'bughunt') {
    rows.push({ stars: 3, key: 'par', text: t.edits(level.parEdits ?? DEFAULT_PAR_EDITS) });
  } else if (level.par !== undefined) {
    rows.push({ stars: 3, key: 'par', text: t.blocks(level.par) });
  }
  return rows;
}

/** One checked line of the results overlay. */
export interface GoalVerdict {
  key: 'win' | StarGoalKind | 'par' | 'hint';
  text: string;
  /**
   * Ticked or not; `null` = not graded: the ⭐⭐⭐ line when a ⭐⭐ goal was missed (the block count
   * cannot add a star then, so neither ✔ nor ✖ is shown).
   */
  met: boolean | null;
  /** A goal missed on a multi-map level: the maps (from 1) where it was not met. */
  missedOn?: number[];
}

/**
 * The results checklist of a win on a level with star goals: the card's lines, each ticked
 * (✔) or not (✖), plus a ✖ "no big hint" line when a hint took stars away. A goal is met only
 * when it is met on every map (`reward.goals`, ADR-0017); `mapGoals` (each map's own flags,
 * `RunOutcome.maps[i].goals`) says which maps missed it. Empty for a level without goals.
 */
export function goalVerdicts(
  level: Pick<Level, 'mode' | 'starGoals' | 'par' | 'parEdits'>,
  reward: Pick<WinReward, 'goals' | 'overPar' | 'hintCapped'>,
  mapGoals?: ReadonlyArray<readonly boolean[] | undefined>,
): GoalVerdict[] {
  if (!hasStarGoals(level)) return [];
  const goalsMet = level.starGoals.every((_, i) => reward.goals?.[i] === true);
  const verdicts: GoalVerdict[] = [];
  for (const row of starGoalRows(level)) {
    if (row.key === 'win') {
      verdicts.push({ key: 'win', text: row.text, met: true });
    } else if (row.key === 'par') {
      verdicts.push({ key: 'par', text: row.text, met: goalsMet ? !reward.overPar : null });
    } else {
      const index = level.starGoals.findIndex((goal) => goal.kind === row.key);
      const met = reward.goals?.[index] === true;
      const verdict: GoalVerdict = { key: row.key, text: row.text, met };
      if (!met && mapGoals !== undefined && mapGoals.length > 1) {
        const missedOn = mapGoals.flatMap((goals, map) =>
          goals?.[index] === true ? [] : [map + 1],
        );
        if (missedOn.length > 0) verdict.missedOn = missedOn;
      }
      verdicts.push(verdict);
    }
  }
  if (reward.hintCapped) {
    verdicts.push({ key: 'hint', text: vi.results.goals.hint, met: false });
  }
  return verdicts;
}

/** Măng's results line on a level with star goals (a key of `vi.results`), when it differs. */
export type GoalLineKey = 'goals.stars2' | 'goals.stars2Edits' | `goals.stars1.${StarGoalKind}`;

/**
 * Which results line Măng says on a level with star goals (P2-21), when the goal table changes
 * it: ⭐⭐ for the goals but over par asks for fewer blocks (bughunt: edits), ⭐ for a missed goal
 * names it. A hint cap keeps the usual lines (they already say "không cần gợi ý"), as does ⭐⭐⭐.
 * `null` = the usual line.
 */
export function goalLineKey(
  level: Pick<Level, 'mode' | 'starGoals'>,
  reward: Pick<WinReward, 'stars' | 'goals' | 'hintCapped'>,
): GoalLineKey | null {
  if (!hasStarGoals(level) || reward.hintCapped) return null;
  if (reward.stars === 2) return level.mode === 'bughunt' ? 'goals.stars2Edits' : 'goals.stars2';
  if (reward.stars === 1) {
    const missed = firstMissedGoal(level, reward.goals);
    if (missed !== null) return `goals.stars1.${missed}`;
  }
  return null;
}

/** The first star goal a run missed (`goals` flags in `starGoals` order), if any. */
export function firstMissedGoal(
  level: Pick<Level, 'mode' | 'starGoals'>,
  goals: readonly boolean[] | undefined,
): StarGoalKind | null {
  if (!hasStarGoals(level)) return null;
  const index = level.starGoals.findIndex((_, i) => goals?.[i] !== true);
  return index === -1 ? null : (level.starGoals[index]?.kind ?? null);
}
