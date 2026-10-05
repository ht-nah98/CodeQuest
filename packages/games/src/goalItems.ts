import { z } from 'zod';

/**
 * Mission items (P2-11c, curriculum.md §5.0 and §5.4 T17b, ADR-0019): things Măng must pick up,
 * by standing on their cell, before the goal counts. `key` makes a `rescue` level (key → cage),
 * `friend` an `escort` level (pick up the friend → home). Any order; every item is needed.
 */
export const GOAL_ITEM_KINDS = ['key', 'friend'] as const;
export const GoalItemKindSchema = z.enum(GOAL_ITEM_KINDS);
export type GoalItemKind = z.infer<typeof GoalItemKindSchema>;

/** Reason code when the run ends on the goal while an item of this kind is still missing. */
export const NEED_REASONS = {
  key: 'NEED_KEY',
  friend: 'NEED_FRIEND',
} as const satisfies Readonly<Record<GoalItemKind, string>>;

/**
 * Reason for the first missing item (config order), or null when every item is picked up.
 * A level mixing kinds reports the one listed first.
 */
export function needReason(missing: ReadonlyArray<{ kind: GoalItemKind }>): string | null {
  const first = missing[0];
  return first === undefined ? null : NEED_REASONS[first.kind];
}

/**
 * Incomplete reasons of a run that ends on the goal with something left (bamboo for
 * `collectAll`, or a mission item): the predict key is `missed@<cell>` (curriculum.md T17b).
 */
export const MISSED_REASONS: ReadonlySet<string> = new Set([
  'MISSED_ITEMS',
  ...Object.values(NEED_REASONS),
]);
