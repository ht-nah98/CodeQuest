/**
 * Rule 28 (maze step limit, ADR-0026): on every map with `stepLimit`, the solution walks at most
 * that many `tiến`. Counted on a run without the limit, so the message says how many it needs
 * (rule 9 would only say the solution loses OUT_OF_STEPS).
 */
import type { Level } from '@codequest/content-schema';
import { runLevel } from '@codequest/engine';
import { getGameKind } from '@codequest/games';
import type { Issue } from './rules';

export const STEP_LIMIT_RULE = 28;

/** `stepLimit` of a maze map config, if any. */
function stepLimitOf(config: unknown): number | undefined {
  if (typeof config !== 'object' || config === null) return undefined;
  const limit = (config as { stepLimit?: unknown }).stepLimit;
  return typeof limit === 'number' ? limit : undefined;
}

function withoutLimit(config: unknown): unknown {
  if (typeof config !== 'object' || config === null) return config;
  const copy = { ...(config as Record<string, unknown>) };
  delete copy['stepLimit'];
  return copy;
}

/** Rule 28 issues of one schema-valid level (none for other kinds or maps without a limit). */
export function stepLimitIssues(path: string, level: Level): Issue[] {
  if (level.kind !== 'maze' || level.solution === undefined) return [];
  const maps = [level.config, ...(level.variants ?? [])];
  const limits = maps.map(stepLimitOf);
  if (limits.every((limit) => limit === undefined)) return [];
  const kind = getGameKind('maze');
  if (kind === undefined) return [];
  const free: Level = {
    ...level,
    config: withoutLimit(level.config),
    ...(level.variants !== undefined && { variants: level.variants.map(withoutLimit) }),
  };
  const outcome = runLevel({ kind, level: free, workspace: level.solution });
  const runs = outcome.maps ?? [outcome];
  const issues: Issue[] = [];
  runs.forEach((run, index) => {
    const limit = limits[index];
    if (limit === undefined) return;
    const steps = run.events.filter((event) => event.type === 'move').length;
    if (steps > limit) {
      issues.push({
        path,
        rule: STEP_LIMIT_RULE,
        message: `solution walks ${String(steps)} steps > stepLimit ${String(limit)} on map ${String(index + 1)}`,
      });
    }
  });
  return issues;
}
