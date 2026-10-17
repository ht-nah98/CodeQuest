/** Shelf reason codes (ADR-0025 §4). */
export const SORTER_REASONS = [
  'OFF_SHELF',
  'NO_BOOK_RIGHT',
  'OUT_OF_QUESTIONS',
  'NOT_SORTED',
  'NOT_FOUND',
  'NOT_AT_END',
] as const;
export type SorterReason = (typeof SORTER_REASONS)[number];
