import type { Block, Workspace } from 'blockly';
import { NO_PROCEDURE } from '../blocks/procedureField';
import { PROC_BODY_INPUT, PROC_CALL_TYPES, procedureOf } from '../blocks/procedures';
import { isProcedureDefinition, isSpellDefinition, programBlocks } from './headlessWorkspace';

/** Static spell errors of ADR-0023 §3, found before anything runs. */
export type SpellIssue = 'SPELL_IN_SPELL' | 'TWO_SPELLS' | 'NO_SPELL' | 'EMPTY_SPELL';

function isCall(block: Block): boolean {
  return PROC_CALL_TYPES.includes(block.type);
}

/**
 * The first static spell error of a loaded workspace, in this order: a `làm phép` inside a
 * spell's body or inside a Blockly `procedures_def*` body (no nested calls in v1; a call from
 * Blockly's own functions would also bypass the checks below), two `dạy phép` of one spell, a `làm phép` of the program
 * whose spell has no `dạy phép`, a `làm phép` whose spell's body is empty. Null when none; a
 * spell that is taught but never called is fine (its blocks just never run).
 */
export function spellIssue(ws: Workspace, start: Block | null): SpellIssue | null {
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
  return empty ? 'EMPTY_SPELL' : null;
}

/** Each `dạy phép` block of a loaded workspace with the spell it teaches. */
export function spellDefinitions(ws: Workspace): Array<{ blockId: string; id: string }> {
  return ws
    .getTopBlocks(false)
    .filter(isSpellDefinition)
    .map((definition) => ({ blockId: definition.id, id: procedureOf(definition) }));
}
