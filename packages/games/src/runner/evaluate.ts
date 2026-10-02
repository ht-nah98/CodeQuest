import type { ReasonCode, RunResult } from '@codequest/content-schema';
import type { RunnerConfig } from './config';
import type { RunnerState } from './state';

/** Called when the program ends without a stop: Măng never reached the flag. */
export function evaluateRunner(
  state: RunnerState,
  config: RunnerConfig,
): { success: true } | { success: false; reasonCode: ReasonCode } {
  // Reaching the flag stops the run at once, so this is a safety net rather than the win path.
  return config.cells[state.pos] === 'flag'
    ? { success: true }
    : { success: false, reasonCode: 'NOT_AT_GOAL' };
}

/**
 * Answer key for mode predict (product/game-kinds.md §3.1): `win`, `stop@<cell>` or
 * `crash:<REASON>@<cell>`. For OFF_TRACK the cell is where Măng jumped from, since the landing
 * cell does not exist. Timeouts and errors fall back to the result name.
 */
export function runnerPredictAnswer(
  state: RunnerState,
  outcome: { result: RunResult; reasonCode: ReasonCode | null },
): string {
  switch (outcome.result) {
    case 'success':
      return 'win';
    case 'incomplete':
      return `stop@${String(state.pos)}`;
    case 'crash':
      return `crash:${outcome.reasonCode ?? 'UNKNOWN'}@${String(state.crashAt ?? state.pos)}`;
    default:
      return outcome.result;
  }
}
