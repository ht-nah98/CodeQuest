import type { AtomicCondition, Condition, NumCmp } from '@codequest/content-schema';
import type { HintContext } from './context';

/** True when `value` passes every bound of `cmp`; an empty `{}` always passes. */
export function compare(value: number, cmp: NumCmp): boolean {
  return (
    (cmp.lt === undefined || value < cmp.lt) &&
    (cmp.lte === undefined || value <= cmp.lte) &&
    (cmp.eq === undefined || value === cmp.eq) &&
    (cmp.gte === undefined || value >= cmp.gte) &&
    (cmp.gt === undefined || value > cmp.gt)
  );
}

type Check = (ctx: HintContext) => boolean;

/** Each key of an atomic condition as a check; the keys of one object are AND-ed. */
function atomicChecks(cond: AtomicCondition): Check[] {
  const checks: Check[] = [];
  const add = <T>(value: T | undefined, check: (value: T, ctx: HintContext) => boolean): void => {
    if (value !== undefined) checks.push((ctx) => check(value, ctx));
  };
  add(cond.trigger, (v, ctx) => ctx.trigger === v);
  add(cond.blockCount, (v, ctx) => compare(ctx.analysis.blocksUsed, v));
  add(cond.topBlockCount, (v, ctx) => compare(ctx.analysis.topBlockCount, v));
  add(cond.has, (v, ctx) => (ctx.analysis.blockTypesUsed[v] ?? 0) > 0);
  add(cond.missing, (v, ctx) => (ctx.analysis.blockTypesUsed[v] ?? 0) === 0);
  add(cond.orphans, (v, ctx) => ctx.analysis.orphanBlockIds.length > 0 === v);
  add(cond.capacityFull, (v, ctx) => ctx.capacityLeft <= 0 === v);
  add(cond.lastResult, (v, ctx) => ctx.lastOutcome?.result === v);
  add(cond.lastReason, (v, ctx) => ctx.lastOutcome?.reasonCode === v);
  add(cond.runCount, (v, ctx) => compare(ctx.runCount, v));
  add(cond.failStreak, (v, ctx) => compare(ctx.failStreak, v));
  add(cond.idleSeconds, (v, ctx) => compare(ctx.idleMs / 1000, v));
  return checks;
}

/**
 * Evaluates a hint condition (hint-engine.md §3): `all` / `any` / `not`, or an atomic object
 * whose keys are AND-ed. `{}` matches everything. Pure.
 */
export function matches(cond: Condition, ctx: HintContext): boolean {
  if ('all' in cond) return cond.all.every((c) => matches(c, ctx));
  if ('any' in cond) return cond.any.some((c) => matches(c, ctx));
  if ('not' in cond) return !matches(cond.not, ctx);
  return atomicChecks(cond).every((check) => check(ctx));
}
