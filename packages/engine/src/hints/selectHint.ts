import type { HintRule, HintTarget } from '@codequest/content-schema';
import type { HintContext } from './context';
import { type GlobalHintRule, globalRules, type HintLevel } from './globalRules';
import { matches } from './matches';

/** The tier-0 hint to show: a rule of the level or a global rule (hint-engine.md §5). */
export type HintSelection =
  | { source: 'level'; rule: HintRule; target: HintTarget | null }
  | { source: 'global'; rule: GlobalHintRule; target: HintTarget | null };

/** Level rules first, then global rules, each in declaration order. */
function candidates(level: HintLevel, ctx: HintContext): HintSelection[] {
  return [
    ...level.hints.map((rule): HintSelection => ({
      source: 'level',
      rule,
      target: rule.point ?? null,
    })),
    ...globalRules(level, ctx).map((rule): HintSelection => ({
      source: 'global',
      rule,
      target: rule.point ?? null,
    })),
  ];
}

/**
 * Picks the tier-0 hint for `ctx.trigger`: level rules + global rules, minus `once` rules
 * (the default) already shown, keeping those whose `when` matches. Highest `priority` wins;
 * on a tie a level rule beats a global one, then declaration order. Null when none matches.
 */
export function selectHint(level: HintLevel, ctx: HintContext): HintSelection | null {
  let best: HintSelection | null = null;
  for (const candidate of candidates(level, ctx)) {
    const { rule } = candidate;
    if (rule.once !== false && ctx.shownHintIds.has(rule.id)) continue;
    if (!matches(rule.when, ctx)) continue;
    // Candidates are already in tie-break order, so only a strictly higher priority wins.
    if (best === null || (rule.priority ?? 0) > (best.rule.priority ?? 0)) best = candidate;
  }
  return best;
}
