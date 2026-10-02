import type { Workspace } from 'blockly';
import type { WorkspaceJson } from '@codequest/content-schema';
import { CQ_START } from '../blocks/common';
import { isProcedureDefinition, programBlocks, withHeadlessWorkspace } from './headlessWorkspace';

/** Static facts about a workspace (runtime-engine.md §2). */
export interface WorkspaceAnalysis {
  /** The `cq_start` block ("khi bắt đầu"), or null if missing. */
  startBlockId: string | null;
  /**
   * Blocks connected (directly or not) to `cq_start`, in program order, then the blocks of
   * top-level function definitions.
   */
  programBlockIds: string[];
  /** Blocks not connected to `cq_start`; they never run. */
  orphanBlockIds: string[];
  /** Blocks in the program, without `cq_start` and shadow blocks; used for maxBlocks and par. */
  blocksUsed: number;
  blockTypesUsed: Record<string, number>;
  topBlockCount: number;
}

export function analyzeLoaded(ws: Workspace): WorkspaceAnalysis {
  const topBlocks = ws.getTopBlocks(false);
  // A second `cq_start` (impossible in the UI) is treated as an orphan.
  const start = topBlocks.find((block) => block.type === CQ_START) ?? null;
  const definitions = topBlocks.filter(isProcedureDefinition);
  const program = [
    ...(start === null ? [] : programBlocks(start)),
    ...definitions.flatMap((definition) =>
      definition.getDescendants(true).filter((block) => !block.isShadow()),
    ),
  ];
  const blockTypesUsed: Record<string, number> = {};
  for (const block of program) blockTypesUsed[block.type] = (blockTypesUsed[block.type] ?? 0) + 1;
  const orphanBlockIds = topBlocks
    .filter((block) => block !== start && !isProcedureDefinition(block))
    .flatMap((top) => top.getDescendants(true).filter((block) => !block.isShadow()))
    .map((block) => block.id);
  return {
    startBlockId: start?.id ?? null,
    programBlockIds: program.map((block) => block.id),
    orphanBlockIds,
    blocksUsed: program.length,
    blockTypesUsed,
    topBlockCount: topBlocks.length,
  };
}

/**
 * Counts program blocks, orphan blocks and block types of a Blockly workspace JSON.
 * Throws if the JSON uses a block type that is not registered.
 */
export function analyzeWorkspace(workspace: WorkspaceJson): WorkspaceAnalysis {
  return withHeadlessWorkspace(workspace, analyzeLoaded);
}
