import type { ReasonCode, RunResult, StarGoal, StarGoalKind } from '@codequest/content-schema';
import { cellKey, tileAt, type MazeState } from './state';

/**
 * Called when the program ends without a stop. Reaching G with the goal met stops the run at
 * once, so here Măng is either elsewhere (NOT_AT_GOAL) or on G with bamboo left (MISSED_ITEMS).
 */
export function evaluateMaze(
  state: MazeState,
): { success: true } | { success: false; reasonCode: ReasonCode } {
  if (tileAt(state.map, state.pos) !== 'G') return { success: false, reasonCode: 'NOT_AT_GOAL' };
  if (state.collectAll && state.collected.size < state.bambooTotal) {
    return { success: false, reasonCode: 'MISSED_ITEMS' };
  }
  return { success: true };
}

/**
 * Answer key for mode predict (product/game-kinds.md §3.2): `win`, `stop@r,c`, `missed@r,c` or
 * `crash:<REASON>@r,c`, where `r,c` is the cell Măng stands on (for HIT_WALL: the cell she
 * bumped from). Timeouts and errors fall back to the result name.
 */
export function mazePredictAnswer(
  state: MazeState,
  outcome: { result: RunResult; reasonCode: ReasonCode | null },
): string {
  switch (outcome.result) {
    case 'success':
      return 'win';
    case 'incomplete':
      return `${outcome.reasonCode === 'MISSED_ITEMS' ? 'missed' : 'stop'}@${cellKey(state.pos)}`;
    case 'crash':
      return `crash:${outcome.reasonCode ?? 'UNKNOWN'}@${cellKey(state.crashAt ?? state.pos)}`;
    default:
      return outcome.result;
  }
}

/** How each star goal kind is judged on a final state (P2-21, ADR-0017). */
const STAR_GOALS: Readonly<Record<StarGoalKind, (state: MazeState) => boolean>> = {
  // Every bamboo shoot picked up; a map without bamboo meets it.
  collectAll: (state) => state.collected.size === state.bambooTotal,
};

/** Star goals (P2-21) on the final state of one map. */
export function mazeStarGoal(goal: StarGoal, state: MazeState): boolean {
  return STAR_GOALS[goal.kind](state);
}
