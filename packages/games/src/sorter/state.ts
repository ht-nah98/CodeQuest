import type { SorterConfig } from './config';

/**
 * Mutable state of one shelf run (ADR-0025 §6): plain data, so the par search can merge equal
 * states. `p` is 1…n for a book, n + 1 for the flag at the end of the shelf.
 */
export interface SorterState {
  /** Book numbers, left to right. Replaced on a swap, so events keep their own copy. */
  books: number[];
  /** Where the hand is: 1…n + 1. */
  p: number;
  /** Book questions still allowed; only on levels with `maxQuestions` (else merging is free). */
  questionsLeft?: number;
}

export function createSorterState(config: SorterConfig): SorterState {
  return {
    books: [...config.books],
    p: 1,
    ...(config.maxQuestions !== undefined && { questionsLeft: config.maxQuestions }),
  };
}

/** The flag's place: one past the last book. */
export const flagOf = (state: SorterState): number => state.books.length + 1;
