import type { ReasonCode, RunResult } from '@codequest/content-schema';
import { STATION_OF } from './config';
import { cellKey, tileAt, type RobotLabState } from './state';

function atLab(state: RobotLabState): boolean {
  return tileAt(state.map, state.pos) === 'L';
}

/** Finished jobs, read from where the blocks are (no separate flags). */
export function finishedJobs(state: RobotLabState): {
  contained: number;
  neutralized: number;
  retrieved: number;
} {
  const fencedZones = new Set<string>();
  let neutralized = 0;
  let retrieved = 0;
  for (const block of state.blocks) {
    if (block.kind === 'pollution') {
      if (block.where === 'done') retrieved++;
      continue;
    }
    if (typeof block.where !== 'object') continue;
    const tile = tileAt(state.map, block.where.at);
    if (block.kind === 'fence' && tile === 'Z') fencedZones.add(cellKey(block.where.at));
    if (block.kind === 'neutralizer' && tile === STATION_OF[block.color]) neutralized++;
  }
  return { contained: fencedZones.size, neutralized, retrieved };
}

/** Points of the current state (`score` goals): every finished job, plus ending in the lab. */
export function robotlabScore(state: RobotLabState): number {
  const { contained, neutralized, retrieved } = finishedJobs(state);
  const { points } = state.rules;
  return (
    contained * points.contain +
    neutralized * points.neutralize +
    retrieved * points.retrieve +
    (atLab(state) ? points.return : 0)
  );
}

/** Some job is not finished: a `Z` without fence, a neutralizer off its station, pollution out. */
function missionsLeft(state: RobotLabState): boolean {
  const { contained, neutralized, retrieved } = finishedJobs(state);
  const zones = state.map.reduce((sum, row) => sum + row.split('Z').length - 1, 0);
  const neutralizers = state.blocks.filter((block) => block.kind === 'neutralizer').length;
  const pollution = state.blocks.filter((block) => block.kind === 'pollution').length;
  return contained < zones || neutralized < neutralizers || retrieved < pollution;
}

type Verdict = { success: true } | { success: false; reasonCode: ReasonCode };

/** `score` goal verdict, at the end of the program or when the time runs out. */
export function scoreVerdict(state: RobotLabState, target: number): Verdict {
  return robotlabScore(state) >= target
    ? { success: true }
    : { success: false, reasonCode: 'LOW_SCORE' };
}

/**
 * Called when the program ends without a stop; the robot never wins mid-program, so this is
 * the only place a run is judged a success (besides `score` at time-up).
 * `missions`: MISSIONS_LEFT (checked first), then NOT_HOME when `mustReturn`.
 * `score`: LOW_SCORE below the target.
 */
export function evaluateRobotLab(state: RobotLabState): Verdict {
  const { goal } = state;
  if (goal.type === 'score') return scoreVerdict(state, goal.target);
  if (missionsLeft(state)) return { success: false, reasonCode: 'MISSIONS_LEFT' };
  if (goal.mustReturn === true && !atLab(state)) {
    return { success: false, reasonCode: 'NOT_HOME' };
  }
  return { success: true };
}

/**
 * Answer key for mode predict (product/game-kinds.md §3.3). `r,c` is the crossing the robot
 * stands on (for a crash: where it stood when the action failed).
 * `missions`: `win` · `stop@r,c` · `crash:<REASON>@r,c` · `outOfTime@r,c` · `timeout`.
 * `score`: `score:<points>` (end of program or time up, won or not) · `crash:…` · `timeout`.
 * Errors fall back to the result name.
 */
export function robotlabPredictAnswer(
  state: RobotLabState,
  outcome: { result: RunResult; reasonCode: ReasonCode | null },
): string {
  const { result, reasonCode } = outcome;
  if (result === 'crash') {
    return `crash:${reasonCode ?? 'UNKNOWN'}@${cellKey(state.crashAt ?? state.pos)}`;
  }
  if (result !== 'success' && result !== 'incomplete') return result;
  if (state.goal.type === 'score') return `score:${String(robotlabScore(state))}`;
  if (result === 'success') return 'win';
  return `${reasonCode === 'OUT_OF_TIME' ? 'outOfTime' : 'stop'}@${cellKey(state.pos)}`;
}
