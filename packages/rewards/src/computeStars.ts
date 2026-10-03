import type { Level, RunSummary } from '@codequest/content-schema';
import { DEFAULT_PAR_EDITS, PREDICT_STARS_BY_ATTEMPT, STAR_CAP_AFTER_HINT } from './config';
import { assertSameLevel, isCountedRun, runsBefore, unrecordedRuns } from './session';
import type { LevelProgress, LevelSession, StarCount } from './types';

function baseStars(
  level: Level,
  session: LevelSession,
  winning: RunSummary,
  progress: LevelProgress | undefined,
): StarCount {
  switch (level.mode) {
    case 'creative':
      return 0;
    case 'predict': {
      // Picks count across sessions, so leaving and re-entering cannot farm ⭐⭐⭐.
      const earlier = runsBefore(session, winning);
      const attempt =
        progress === undefined
          ? earlier.filter(isCountedRun).length
          : progress.attempts + unrecordedRuns(earlier);
      return PREDICT_STARS_BY_ATTEMPT[Math.min(attempt, PREDICT_STARS_BY_ATTEMPT.length - 1)] ?? 1;
    }
    case 'bughunt': {
      // Missing `edits` means the engine could not measure it: do not grant the par star.
      const parEdits = level.parEdits ?? DEFAULT_PAR_EDITS;
      return withStarGoals(
        level,
        winning,
        winning.edits !== undefined && winning.edits <= parEdits,
      );
    }
    case 'build':
    case 'parsons':
      return withStarGoals(
        level,
        winning,
        level.par !== undefined && winning.blocksUsed <= level.par,
      );
  }
}

/**
 * Stars before hint caps from the par condition (`parMet`). Without `starGoals`: ⭐⭐⭐ on par,
 * else ⭐. With them (P2-21): ⭐⭐ needs every goal, ⭐⭐⭐ needs par too.
 */
function withStarGoals(level: Level, winning: RunSummary, parMet: boolean): StarCount {
  if (!hasStarGoals(level)) return parMet ? 3 : 1;
  if (!meetsStarGoals(level, winning)) return 1;
  return parMet ? 3 : 2;
}

/**
 * Whether a run met every star goal of the level (`RunSummary.goals`, one flag per goal); true
 * for a level without goals (or in a mode that ignores them). A run without flags, or with flags that do not match the goals,
 * meets none.
 */
export function meetsStarGoals(level: Level, run: RunSummary): boolean {
  if (!hasStarGoals(level) || level.starGoals === undefined) return true;
  return run.goals?.length === level.starGoals.length && run.goals.every((met) => met);
}

/** Star goals only count in modes build and bughunt, as LevelSchema allows them. */
function hasStarGoals(level: Level): boolean {
  return level.starGoals !== undefined && (level.mode === 'build' || level.mode === 'bughunt');
}

/**
 * Stars (0–3) for a winning run, rewards-economy.md §1: par condition by mode (and star goals
 * when a build or bughunt level has `starGoals`), then the cap from hint tiers bought in this
 * level session. A run that did not succeed scores 0. Pass `progress` (as before this run) so
 * `predict` picks count across sessions.
 */
export function computeStars(
  level: Level,
  session: LevelSession,
  winning: RunSummary,
  progress?: LevelProgress,
): StarCount {
  assertSameLevel(level, session);
  if (winning.result !== 'success') return 0;
  let stars = baseStars(level, session, winning, progress);
  for (const tier of session.hintTiersBought) {
    if (tier === 2 || tier === 3) stars = Math.min(stars, STAR_CAP_AFTER_HINT[tier]) as StarCount;
  }
  return stars;
}
