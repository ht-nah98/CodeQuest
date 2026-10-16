import type { Workspace } from 'blockly';
import type { LevelProcedure, LevelVariable, WorkspaceJson } from '@codequest/content-schema';
import { CQ_START } from '../blocks/common';
import { engineGenerator } from '../blocks/generator';
import { PROC_BODY_INPUT, procedureFunctionName, procedureOf } from '../blocks/procedures';
import {
  isProcedureDefinition,
  isSpellDefinition,
  withHeadlessWorkspace,
} from './headlessWorkspace';

export function compileLoaded(ws: Workspace, startBlockId: string): string {
  const start = ws.getBlockById(startBlockId);
  if (start === null) throw new Error(`no block with id ${startBlockId}`);
  // Order verified on Blockly 13.3.0: init() creates nameDB_, finish() adds declarations.
  engineGenerator.init(ws);
  const definitions = ws.getTopBlocks(false).filter(isProcedureDefinition);
  // Blockly's function definition generators store their code for finish() and return nothing.
  for (const definition of definitions.filter((block) => !isSpellDefinition(block))) {
    engineGenerator.blockToCode(definition);
  }
  // A spell's body becomes a sandbox function (ADR-0023 §3). Not through blockToCode, which
  // would put a highlight of the `dạy phép` block itself in front of the program.
  const spells = definitions
    .filter(isSpellDefinition)
    .map((definition) => {
      const body = engineGenerator.statementToCode(definition, PROC_BODY_INPUT);
      return `function ${procedureFunctionName(procedureOf(definition))}() {\n${body}}\n`;
    })
    .join('');
  const code = engineGenerator.blockToCode(start);
  return engineGenerator.finish(spells + (Array.isArray(code) ? code[0] : code));
}

/**
 * Generates JavaScript for the program under `cq_start` plus top-level function definitions
 * (spells: `function __p_<id>() {…}`; orphan blocks are skipped).
 * Every statement is preceded by `__hl(<quoted block id>);`. Returns '' without `cq_start`.
 * `variables` / `procedures`: the level's boxes (ADR-0022) and spells (ADR-0023), for the
 * dropdowns' labels.
 */
export function compileProgram(
  workspace: WorkspaceJson,
  variables?: readonly LevelVariable[],
  procedures?: readonly LevelProcedure[],
): string {
  return withHeadlessWorkspace(
    workspace,
    (ws) => {
      const start = ws.getTopBlocks(false).find((block) => block.type === CQ_START);
      return start === undefined ? '' : compileLoaded(ws, start.id);
    },
    variables,
    procedures,
  );
}
