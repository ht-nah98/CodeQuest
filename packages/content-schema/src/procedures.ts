import { z } from 'zod';
import { VARIABLE_ID, VARIABLE_MAX_LIMIT, type LevelVariable } from './variables';

/** Pattern of a spell ("phép") id, e.g. `stair` (ADR-0023 §1). Same as a box id. */
export const PROCEDURE_ID = VARIABLE_ID;
/** Spells a level (or a lesson demo) may declare (ADR-0023 §1). */
export const MAX_PROCEDURES = 3;

/**
 * The box of a spell ("hộp của phép", ADR-0023 §2): set to the number of `làm phép … với n`
 * on entry and back to 0 on exit. Only readable inside the spell's body.
 */
export const ProcedureParamSchema = z.strictObject({
  id: z.string().regex(VARIABLE_ID, 'param id must match ^[a-z][a-z0-9_]*$'),
  /** The box's name the child sees, e.g. "số bậc" (≤ 3 words). */
  name: z.string().min(1),
  max: z.number().int().min(1).max(VARIABLE_MAX_LIMIT).optional(),
});
export type ProcedureParam = z.infer<typeof ProcedureParamSchema>;

/**
 * One spell ("phép thuật", ADR-0023 §1): the level names it, the child only fills its body
 * (`dạy phép`) and calls it (`làm phép`). `name` ≤ 3 words (content:check rule 25 (f)).
 */
export const LevelProcedureSchema = z.strictObject({
  id: z.string().regex(PROCEDURE_ID, 'procedure id must match ^[a-z][a-z0-9_]*$'),
  name: z.string().min(1),
  param: ProcedureParamSchema.optional(),
});
export type LevelProcedure = z.infer<typeof LevelProcedureSchema>;

export const LevelProceduresSchema = z.array(LevelProcedureSchema).min(1).max(MAX_PROCEDURES);

/** The box of a spell as an engine variable (start 0 on every map, ADR-0023 §2). */
export function procedureBox(param: ProcedureParam): LevelVariable {
  return param.max === undefined
    ? { id: param.id, name: param.name }
    : { id: param.id, name: param.name, max: param.max };
}

/** Boxes of every spell that has a `param`, in `procedures` order. */
export function procedureBoxes(procedures: readonly LevelProcedure[] | undefined): LevelVariable[] {
  return (procedures ?? []).flatMap((procedure) =>
    procedure.param === undefined ? [] : [procedureBox(procedure.param)],
  );
}

type IssueSink = (path: Array<string | number>, message: string) => void;

/**
 * Cross-field checks of `procedures`: unique spell ids, and no id (spell or spell box) equal to
 * a level box or to another spell's box (ADR-0023 §2, rule 25 (h)).
 */
export function checkProcedures(
  procedures: readonly LevelProcedure[] | undefined,
  variables: readonly LevelVariable[] | undefined,
  report: IssueSink,
): void {
  const boxIds = new Set((variables ?? []).map((variable) => variable.id));
  const procIds = new Set<string>();
  (procedures ?? []).forEach((procedure, index) => {
    if (procIds.has(procedure.id)) {
      report(['procedures', index, 'id'], `duplicate procedure "${procedure.id}"`);
    }
    if (boxIds.has(procedure.id)) {
      report(['procedures', index, 'id'], `procedure id "${procedure.id}" is also a box id`);
    }
    procIds.add(procedure.id);
  });
  (procedures ?? []).forEach((procedure, index) => {
    const param = procedure.param;
    if (param === undefined) return;
    if (boxIds.has(param.id) || procIds.has(param.id)) {
      report(
        ['procedures', index, 'param', 'id'],
        `param id "${param.id}" is already a box or procedure id`,
      );
    }
    boxIds.add(param.id);
  });
}
