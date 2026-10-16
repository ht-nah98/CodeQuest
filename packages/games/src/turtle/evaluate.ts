import type { ReasonCode, RunResult } from '@codequest/content-schema';
import { targetSegments, type TurtleConfig } from './config';
import { pointKey } from './lattice';
import type { TurtleState } from './state';

/**
 * Called when the program ends without a stop (ADR-0024 §4): with a target, every target
 * segment drawn wins, else MISSING_LINES. Stray lines already stopped the run, so a finished
 * drawing is always a subset of the target. Without a target (predict, creative) any drawing
 * that ends on the paper counts as a success.
 */
export function evaluateTurtle(
  state: TurtleState,
  config: TurtleConfig,
): { success: true } | { success: false; reasonCode: ReasonCode } {
  const target = targetSegments(config);
  if (target === null) return { success: true };
  for (const key of target) {
    if (!state.drawn.has(key)) return { success: false, reasonCode: 'MISSING_LINES' };
  }
  return { success: true };
}

/** `draw:` and the sorted segment keys of a drawing, `;`-separated (`draw:` alone: no line). */
export function drawingKey(drawn: Iterable<string>): string {
  return `draw:${[...drawn].sort().join(';')}`;
}

/**
 * Answer key for mode predict (ADR-0024 §5): a program that ends (won or not) gives
 * `draw:<segments>`; a crash gives `crash:<REASON>@a,b,c,d` with the point Măng stood on.
 * Timeouts and errors fall back to the result name.
 */
export function turtlePredictAnswer(
  state: TurtleState,
  outcome: { result: RunResult; reasonCode: ReasonCode | null },
): string {
  switch (outcome.result) {
    case 'success':
    case 'incomplete':
      return drawingKey(state.drawn);
    case 'crash':
      return `crash:${outcome.reasonCode ?? 'UNKNOWN'}@${pointKey(state.crashAt ?? state.pos)}`;
    default:
      return outcome.result;
  }
}
