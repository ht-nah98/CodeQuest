import type { Workspace } from 'blockly';
import { CQ_START } from '@codequest/engine';
import { guardWorkspaceChanges } from './blockLimits';

/**
 * Capacity guard (phase-4.md P4-07, blockly-integration.md §5). Blockly's own `maxBlocks`
 * counts `cq_start` and every shadow block (`controls_repeat_ext` takes 2 places), so a level
 * with `maxBlocks` cannot use blocks with shadows. This guard counts like the engine instead,
 * so shadow blocks become possible (W10 `biến + biến`). Not switched on in any level yet: that
 * needs an ADR, and until then content:check still rejects shadows in a level with `maxBlocks`.
 */

/**
 * Blocks the child spent: `analysis.blocksUsed` (program and spell definitions, no `cq_start`,
 * no shadow) plus loose blocks, which Blockly's capacity counts too. Equal to
 * `blocksUsed + orphanBlockIds.length` of `analyzeWorkspace` (capacity.test.ts checks).
 */
export function capacityUsed(workspace: Workspace): number {
  return workspace
    .getAllBlocks(false)
    .filter((block) => !block.isShadow() && block.type !== CQ_START).length;
}

/**
 * Drop-time capacity check: a new block (dragged, duplicated, pasted) that takes the workspace
 * over `maxBlocks` is undone as a whole group, like `guardBlockLimits`; `onFull` fires on every
 * refused or already-over change (for the tier-0 hint `capacityFull`). Returns the removal.
 */
export function guardCapacity(
  workspace: Workspace,
  maxBlocks: number | undefined,
  onFull: () => void,
): () => void {
  if (maxBlocks === undefined) return () => {};
  return guardWorkspaceChanges(
    workspace,
    () => (capacityUsed(workspace) > maxBlocks ? 'full' : null),
    onFull,
  );
}
