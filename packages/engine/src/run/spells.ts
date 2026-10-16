import type { Block, Workspace } from 'blockly';
import {
  procedureBoxes,
  type Level,
  type LevelProcedure,
  type LevelVariable,
} from '@codequest/content-schema';
import { NO_PROCEDURE } from '../blocks/procedureField';
import { CQ_PROC_DEF_N, PROC_BODY_INPUT, PROC_CALL_TYPES, procedureOf } from '../blocks/procedures';
import { VARIABLE_BLOCKS } from '../blocks/variables';
import { isProcedureDefinition, isSpellDefinition, programBlocks } from './headlessWorkspace';

/** Static spell errors of ADR-0023 §2–§3, found before anything runs. */
export type SpellIssue =
  'SPELL_IN_SPELL' | 'TWO_SPELLS' | 'NO_SPELL' | 'EMPTY_SPELL' | 'BOX_OUTSIDE_SPELL';

/** Every box of a level: its own (`variables`), then each spell's (`procedures[].param`). */
export function levelBoxes(level: Pick<Level, 'variables' | 'procedures'>): LevelVariable[] {
  return [...(level.variables ?? []), ...procedureBoxes(level.procedures)];
}

const BOX_BLOCK_TYPES: ReadonlySet<string> = new Set(VARIABLE_BLOCKS.map((spec) => spec.type));

function isCall(block: Block): boolean {
  return PROC_CALL_TYPES.includes(block.type);
}

/**
 * The first static spell error of a loaded workspace, in this order: a `làm phép` inside a
 * spell's body or inside a Blockly `procedures_def*` body (no nested calls in v1; a call from
 * Blockly's own functions would also bypass the checks below), two `dạy phép` of one spell, a `làm phép` of the program
 * whose spell has no `dạy phép`, a `làm phép` whose spell's body is empty, a spell's box used
 * outside its own spell's body (`BOX_OUTSIDE_SPELL`). Null when none; a
 * spell that is taught but never called is fine (its blocks just never run).
 */
export function spellIssue(
  ws: Workspace,
  start: Block | null,
  procedures?: readonly LevelProcedure[],
): SpellIssue | null {
  const functions = ws.getTopBlocks(false).filter(isProcedureDefinition);
  const definitions = functions.filter(isSpellDefinition);
  const nested = functions.some((definition) =>
    definition.getDescendants(false).some((block) => block !== definition && isCall(block)),
  );
  if (nested) return 'SPELL_IN_SPELL';
  const taught = new Map<string, Block>();
  for (const definition of definitions) {
    const id = procedureOf(definition);
    if (taught.has(id)) return 'TWO_SPELLS';
    if (id !== NO_PROCEDURE) taught.set(id, definition);
  }
  const calls = start === null ? [] : programBlocks(start).filter(isCall);
  if (calls.some((call) => !taught.has(procedureOf(call)))) return 'NO_SPELL';
  const empty = calls.some(
    (call) => taught.get(procedureOf(call))?.getInputTargetBlock(PROC_BODY_INPUT) === null,
  );
  if (empty) return 'EMPTY_SPELL';
  return boxOutsideSpell(ws, start, procedures) ? 'BOX_OUTSIDE_SPELL' : null;
}

/**
 * A box block of the program (main stack or a spell body) names a spell's box (ADR-0023 §2)
 * outside the body of `dạy phép … với hộp` of that very spell.
 */
function boxOutsideSpell(
  ws: Workspace,
  start: Block | null,
  procedures: readonly LevelProcedure[] | undefined,
): boolean {
  const owners = new Map<string, string>();
  for (const procedure of procedures ?? []) {
    if (procedure.param !== undefined) owners.set(procedure.param.id, procedure.id);
  }
  if (owners.size === 0) return false;
  const roots = [
    ...(start === null ? [] : [start]),
    ...ws.getTopBlocks(false).filter(isProcedureDefinition),
  ];
  return roots.some((root) =>
    root.getDescendants(false).some((block) => {
      if (!BOX_BLOCK_TYPES.has(block.type)) return false;
      const owner = owners.get(String(block.getFieldValue('VAR')));
      if (owner === undefined) return false;
      return root.type !== CQ_PROC_DEF_N || procedureOf(root) !== owner;
    }),
  );
}

/** Each `dạy phép` block of a loaded workspace with the spell it teaches. */
export function spellDefinitions(ws: Workspace): Array<{ blockId: string; id: string }> {
  return ws
    .getTopBlocks(false)
    .filter(isSpellDefinition)
    .map((definition) => ({ blockId: definition.id, id: procedureOf(definition) }));
}
