import { Events, Options, Workspace, serialization, type Block } from 'blockly';
import type { LevelProcedure, LevelVariable, WorkspaceJson } from '@codequest/content-schema';
import { setWorkspaceProcedures } from '../blocks/procedureField';
import { PROC_DEF_TYPES } from '../blocks/procedures';
import { registerBlockSpecs } from '../blocks/registerBlockSpecs';
import { setWorkspaceVariables } from '../blocks/variableField';
import { normalizeIds } from './normalizeIds';

/**
 * Loads workspace JSON into a fresh headless Blockly workspace and passes it to `use`,
 * disposing it afterwards. Events are disabled so loading schedules no timers. Missing block
 * ids are filled in by `normalizeIds` so Blockly never draws random ones. `variables` are the
 * level's boxes (ADR-0022), named by the `field_cq_var` dropdowns; without them the fields
 * show a placeholder but still keep their ids. `procedures` (ADR-0023) name the spell dropdowns
 * the same way.
 */
export function withHeadlessWorkspace<T>(
  json: WorkspaceJson,
  use: (ws: Workspace) => T,
  variables?: readonly LevelVariable[],
  procedures?: readonly LevelProcedure[],
): T {
  registerBlockSpecs([]);
  // Blockly requires an Options instance; a plain object fails on `connectionChecker`.
  const ws = new Workspace(new Options({}));
  setWorkspaceVariables(ws, variables);
  setWorkspaceProcedures(ws, procedures);
  Events.disable();
  try {
    serialization.workspaces.load(normalizeIds(json), ws, { recordUndo: false });
    return use(ws);
  } finally {
    Events.enable();
    ws.dispose();
  }
}

/** Blocks hanging from `start` in program order, without `start` itself and shadow blocks. */
export function programBlocks(start: Block): Block[] {
  return start.getDescendants(true).filter((block) => block !== start && !block.isShadow());
}

/**
 * Top-level function definitions: the spells' `dạy phép` blocks (ADR-0023) and Blockly's own
 * `procedures_def*`. They are program roots next to `cq_start`, not orphans.
 */
export function isProcedureDefinition(block: Block): boolean {
  return (
    isSpellDefinition(block) ||
    block.type === 'procedures_defnoreturn' ||
    block.type === 'procedures_defreturn'
  );
}

/** A `dạy phép` block (`cq_proc_def*`, ADR-0023). */
export function isSpellDefinition(block: Block): boolean {
  return PROC_DEF_TYPES.includes(block.type);
}
