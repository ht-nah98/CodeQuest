import { z } from 'zod';

/** Pattern of a variable ("hộp") id, e.g. `bamboo` (ADR-0022 §1). */
export const VARIABLE_ID = /^[a-z][a-z0-9_]*$/;
/** Highest `max` a level may give a variable: `CQ_REPEAT_MAX_TIMES`, so `lặp [hộp] lần` ≤ 20. */
export const VARIABLE_MAX_LIMIT = 20;
/** `max` of a variable that does not set one. */
export const DEFAULT_VARIABLE_MAX = 9;
/** Variables a level (or a lesson demo) may declare. */
export const MAX_VARIABLES = 2;

/**
 * One engine variable ("hộp", ADR-0022): a whole number `0…max`; going over `max` loses
 * (`BOX_FULL`). `start` holds one number per map (`config`, then each variant), default all 0.
 */
export const LevelVariableSchema = z.strictObject({
  id: z.string().regex(VARIABLE_ID, 'variable id must match ^[a-z][a-z0-9_]*$'),
  /** The box's name the child sees, e.g. "số măng" (≤ 3 words, content:check rule 23 (h)). */
  name: z.string().min(1),
  start: z.array(z.number().int().nonnegative()).min(1).optional(),
  max: z.number().int().min(1).max(VARIABLE_MAX_LIMIT).optional(),
});
export type LevelVariable = z.infer<typeof LevelVariableSchema>;

export const LevelVariablesSchema = z.array(LevelVariableSchema).min(1).max(MAX_VARIABLES);

/** "Đếm đúng" (ADR-0022): a run on map i wins only when `vars[var] === equals[i]` too. */
export const CountGoalSchema = z.strictObject({
  var: z.string().regex(VARIABLE_ID, 'variable id must match ^[a-z][a-z0-9_]*$'),
  equals: z.array(z.number().int().nonnegative()).min(1),
});
export type CountGoal = z.infer<typeof CountGoalSchema>;

/** `max` of a declared variable. */
export function variableMax(variable: LevelVariable): number {
  return variable.max ?? DEFAULT_VARIABLE_MAX;
}

/** Value of `variable` at the start of map `mapIndex` (0 = `config`). */
export function variableStart(variable: LevelVariable, mapIndex: number): number {
  return variable.start?.[mapIndex] ?? 0;
}

type IssueSink = (path: Array<string | number>, message: string) => void;

/**
 * Cross-field checks of `variables` (and `countGoal`) against the number of maps: unique ids,
 * one `start` per map, every number within `0…max`, `countGoal.var` declared. Shared by the
 * level schema and the lesson demo card.
 */
export function checkVariables(
  variables: readonly LevelVariable[] | undefined,
  countGoal: CountGoal | undefined,
  mapCount: number,
  report: IssueSink,
): void {
  const ids = new Set<string>();
  (variables ?? []).forEach((variable, index) => {
    if (ids.has(variable.id))
      report(['variables', index, 'id'], `duplicate variable "${variable.id}"`);
    ids.add(variable.id);
    const max = variableMax(variable);
    if (variable.start === undefined) return;
    if (variable.start.length !== mapCount) {
      report(
        ['variables', index, 'start'],
        `"start" needs one number per map (${String(mapCount)}), has ${String(variable.start.length)}`,
      );
    }
    variable.start.forEach((value, map) => {
      if (value > max) {
        report(['variables', index, 'start', map], `start ${String(value)} > max ${String(max)}`);
      }
    });
  });
  if (countGoal === undefined) return;
  const target = (variables ?? []).find((variable) => variable.id === countGoal.var);
  if (target === undefined) {
    report(['countGoal', 'var'], `countGoal.var "${countGoal.var}" is not a declared variable`);
    return;
  }
  if (countGoal.equals.length !== mapCount) {
    report(
      ['countGoal', 'equals'],
      `"equals" needs one number per map (${String(mapCount)}), has ${String(countGoal.equals.length)}`,
    );
  }
  const max = variableMax(target);
  countGoal.equals.forEach((value, map) => {
    if (value > max) {
      report(['countGoal', 'equals', map], `equals ${String(value)} > max ${String(max)}`);
    }
  });
}
