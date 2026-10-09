import type { Workspace } from 'blockly';
import type { LevelVariable, WorkspaceJson } from '@codequest/content-schema';
import { CQ_START } from '../blocks/common';
import { engineGenerator } from '../blocks/generator';
import { isProcedureDefinition, withHeadlessWorkspace } from './headlessWorkspace';

export function compileLoaded(ws: Workspace, startBlockId: string): string {
  const start = ws.getBlockById(startBlockId);
  if (start === null) throw new Error(`no block with id ${startBlockId}`);
  // Order verified on Blockly 13.3.0: init() creates nameDB_, finish() adds declarations.
  engineGenerator.init(ws);
  // Function definition generators store their code for finish() and return nothing.
  for (const definition of ws.getTopBlocks(false).filter(isProcedureDefinition)) {
    engineGenerator.blockToCode(definition);
  }
  const code = engineGenerator.blockToCode(start);
  return engineGenerator.finish(Array.isArray(code) ? code[0] : code);
}

/**
 * Generates JavaScript for the program under `cq_start` plus top-level function definitions
 * (orphan blocks are skipped).
 * Every statement is preceded by `__hl(<quoted block id>);`. Returns '' without `cq_start`.
 * `variables`: the level's boxes (ADR-0022), for the box dropdowns.
 */
export function compileProgram(
  workspace: WorkspaceJson,
  variables?: readonly LevelVariable[],
): string {
  return withHeadlessWorkspace(
    workspace,
    (ws) => {
      const start = ws.getTopBlocks(false).find((block) => block.type === CQ_START);
      return start === undefined ? '' : compileLoaded(ws, start.id);
    },
    variables,
  );
}
