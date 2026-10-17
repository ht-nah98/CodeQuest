import type { ReasonCode, RunResult } from '@codequest/content-schema';
import type { SorterConfig } from './config';
import { flagOf, type SorterState } from './state';

/** Whether the books go up from left to right (equal neighbours allowed). */
export function isSorted(books: readonly number[]): boolean {
  return books.every((book, index) => index === 0 || (books[index - 1] ?? book) <= book);
}

/**
 * Called when the program ends without a stop; the shelf never wins mid-program (like robotlab,
 * ADR-0021). Checked in order: sorted (NOT_SORTED), find (NOT_FOUND), end (NOT_AT_END).
 */
export function evaluateSorter(
  state: SorterState,
  config: SorterConfig,
): { success: true } | { success: false; reasonCode: ReasonCode } {
  const { goal } = config;
  if (goal.sorted === true && !isSorted(state.books)) {
    return { success: false, reasonCode: 'NOT_SORTED' };
  }
  if (goal.find !== undefined && state.books[state.p - 1] !== goal.find) {
    return { success: false, reasonCode: 'NOT_FOUND' };
  }
  if (goal.end === true && state.p !== flagOf(state)) {
    return { success: false, reasonCode: 'NOT_AT_END' };
  }
  return { success: true };
}

/** `shelf:<books>@<p>` (ADR-0025 §5), e.g. `shelf:2,4,1,3,5@5`. */
export function shelfKey(books: readonly number[], p: number): string {
  return `shelf:${books.join(',')}@${String(p)}`;
}

/**
 * Answer key for mode predict (ADR-0025 §5): a program that ends (won or not) gives
 * `shelf:<books>@<p>`; a crash gives `crash:<REASON>@<p>` with the hand's place. Timeouts and
 * errors fall back to the result name.
 */
export function sorterPredictAnswer(
  state: SorterState,
  outcome: { result: RunResult; reasonCode: ReasonCode | null },
): string {
  switch (outcome.result) {
    case 'success':
    case 'incomplete':
      return shelfKey(state.books, state.p);
    case 'crash':
      return `crash:${outcome.reasonCode ?? 'UNKNOWN'}@${String(state.p)}`;
    default:
      return outcome.result;
  }
}
