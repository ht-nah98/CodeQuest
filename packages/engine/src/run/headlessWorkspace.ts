import { Events, Options, Workspace, serialization, type Block } from 'blockly';
import type { LevelVariable, WorkspaceJson } from '@codequest/content-schema';
import { registerBlockSpecs } from '../blocks/registerBlockSpecs';
import { setWorkspaceVariables } from '../blocks/variableField';
import { normalizeIds } from './normalizeIds';

/**
 * Loads workspace JSON into a fresh headless Blockly workspace and passes it to `use`,
 * disposing it afterwards. Events are disabled so loading schedules no timers. Missing block
 * ids are filled in by `normalizeIds` so Blockly never draws random ones. `variables` are the
 * level's boxes (ADR-0022), named by the `field_cq_var` dropdowns; without them the fields
 * show a placeholder but still keep their ids.
 */
export function withHeadlessWorkspace<T>(
  json: WorkspaceJson,
  use: (ws: Workspace) => T,
  variables?: readonly LevelVariable[],
): T {
  registerBlockSpecs([]);
  // Blockly requires an Options instance; a plain object fails on `connectionChecker`.
  const ws = new Workspace(new Options({}));
  setWorkspaceVariables(ws, variables);
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

/** Top-level function definitions ("để làm…"); they belong to the program, not orphans. */
export function isProcedureDefinition(block: Block): boolean {
  return block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn';
}
