import type { ReasonCode, RunResult } from '@codequest/content-schema';
import type { RunnerConfig } from './config';
import type { RunnerState } from './state';

/** Called when the program ends without a stop: Măng never reached the flag. */
export function evaluateRunner(
  state: RunnerState,
  config: RunnerConfig,
): { success: true } | { success: false; reasonCode: ReasonCode } {
  // Reaching the flag stops the run at once, so the flag branch is a safety net, not the win path.
  if (config.cells[state.pos] !== 'flag') return { success: false, reasonCode: 'NOT_AT_GOAL' };
  return state.collectAll && state.bamboo.length > 0
    ? { success: false, reasonCode: 'MISSED_ITEMS' }
    : { success: true };
}

/**
 * Answer key for mode predict (product/game-kinds.md §3.1): `win`, `stop@<cell>` (program ended
 * there), `missed@<flag cell>` or `crash:<REASON>@<cell>`. The crash cell is the hole or obstacle
 * hit; for OFF_TRACK it is where Măng jumped from, since the landing cell does not exist.
 * Timeouts and errors fall back to the result name.
 */
export function runnerPredictAnswer(
  state: RunnerState,
  outcome: { result: RunResult; reasonCode: ReasonCode | null },
): string {
  switch (outcome.result) {
    case 'success':
      return 'win';
    case 'incomplete':
      return `${outcome.reasonCode === 'MISSED_ITEMS' ? 'missed' : 'stop'}@${String(state.pos)}`;
    case 'crash':
      return `crash:${outcome.reasonCode ?? 'UNKNOWN'}@${String(state.crashAt ?? state.pos)}`;
    default:
      return outcome.result;
  }
}
