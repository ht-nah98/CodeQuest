/** Turtle reason codes (ADR-0024 §4). */
export const TURTLE_REASONS = ['EXTRA_LINE', 'MISSING_LINES', 'OFF_PAPER'] as const;
export type TurtleReason = (typeof TURTLE_REASONS)[number];
