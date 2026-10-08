import { resolveRobotlabRules, robotlabLevelConfigSchema, type RobotLabRules } from './robotlab';

/** Rules shared by every level of a kind (`content/shared/<kind>.json`), as loaded. */
export interface SharedLevelRules {
  /** `content/shared/robotlab.json`, parsed with `robotlabRulesSchema`. */
  robotlab?: RobotLabRules | undefined;
}

/** The level fields this resolve step reads and replaces. */
interface LevelMaps {
  kind: string;
  config: unknown;
  variants?: unknown[] | undefined;
}

/** Kinds whose configs only run after the shared rules are merged in. */
export function needsSharedRules(kind: string): kind is 'robotlab' {
  return kind === 'robotlab';
}

/**
 * The resolve step every place that runs or draws a level goes through (content:check, the
 * validator, `npm run par`, the web content loader): `config` and every map in `variants` with
 * the kind's shared rules merged in (`resolveRobotlabRules` for robotlab). Pure; other kinds
 * come back unchanged. A config that fails the kind's level schema, or a robotlab level without
 * `shared.robotlab`, is left as written, so rule 1 reports it and a run fails loudly
 * (`INTERNAL_ERROR: robotlab config not resolved`) instead of running with wrong rules.
 */
export function resolveLevelConfigs<T extends LevelMaps>(level: T, shared: SharedLevelRules): T {
  const rules = shared.robotlab;
  if (level.kind !== 'robotlab' || rules === undefined) return level;
  const resolve = (config: unknown): unknown => {
    const parsed = robotlabLevelConfigSchema.safeParse(config);
    return parsed.success ? resolveRobotlabRules(parsed.data, rules) : config;
  };
  const resolved: T = { ...level, config: resolve(level.config) };
  if (level.variants !== undefined) resolved.variants = level.variants.map(resolve);
  return resolved;
}
