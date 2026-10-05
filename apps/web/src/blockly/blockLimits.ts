import { Events, serialization, type Workspace, WorkspaceSvg } from 'blockly';
import type { Level, WorkspaceJson } from '@codequest/content-schema';
import { blockTypeCounts, loopDepth } from '@codequest/engine';

/** The per-level block limits Blockly cannot enforce at drop time by itself. */
export type BlockLimits = Pick<Level, 'maxLoopDepth' | 'maxInstances'>;

/** Which limit a workspace breaks: loops nested too deep, or too many blocks of one type. */
export type BlockLimitBreach = 'loopDepth' | 'instances';

/**
 * Whether a workspace breaks the level's `maxLoopDepth` (P2-11, curriculum.md §5.4 T16b) or
 * `maxInstances`, counted like `content:check` rule 20 (engine `loopDepth` / `blockTypeCounts`,
 * loose stacks included). Pure: unit tested without Blockly.
 */
export function blockLimitBreach(
  workspace: WorkspaceJson,
  { maxLoopDepth, maxInstances }: BlockLimits,
): BlockLimitBreach | null {
  if (maxLoopDepth !== undefined && loopDepth(workspace) > maxLoopDepth) return 'loopDepth';
  if (maxInstances !== undefined) {
    for (const [type, count] of blockTypeCounts(workspace)) {
      const max = maxInstances[type];
      if (max !== undefined && count > max) return 'instances';
    }
  }
  return null;
}

/** Re-check delay while a drag is still in progress (ms). */
const DRAG_RECHECK_MS = 50;

/**
 * Drop-time guard for the limits Blockly lacks (blockly-integration.md §5): `maxLoopDepth` has
 * no Blockly option, and `maxInstances` only greys out the flyout (a duplicate or paste can
 * still go over). After a child's move or new block (never a program load), once the event
 * group has fired and no drag is in progress, a change that makes the workspace break a limit
 * is undone as a whole (Blockly's own undo of that group: a block dragged from the toolbox goes
 * back to it, a moved block goes back where it was, a duplicate disappears) and its redo entry
 * is dropped, so "Làm tiếp" cannot bring it back. A workspace that already broke a limit before
 * the change (an old draft) is never undone: `onBlocked` only says why. Returns the removal.
 */
export function guardBlockLimits(
  workspace: Workspace,
  limits: BlockLimits,
  onBlocked: (breach: BlockLimitBreach) => void,
): () => void {
  if (limits.maxLoopDepth === undefined && limits.maxInstances === undefined) return () => {};
  const breachNow = () =>
    blockLimitBreach(serialization.workspaces.save(workspace) as WorkspaceJson, limits);
  let wasBreaching = breachNow() !== null;
  let pending: ReturnType<typeof setTimeout> | undefined;
  // Checked once the whole event group has fired: a drop into an occupied slot also moves the
  // block that was there (a later event of the same group), and undoing half a group would
  // lose that block.
  const check = () => {
    pending = undefined;
    if (workspace instanceof WorkspaceSvg && workspace.isDragging()) {
      pending = setTimeout(check, DRAG_RECHECK_MS);
      return;
    }
    const breach = breachNow();
    if (breach !== null && !wasBreaching) {
      workspace.undo(false);
      // The refused change must not come back with "Làm tiếp".
      const redo = workspace.getRedoStack();
      const group = redo.at(-1)?.group;
      while (redo.length > 0 && redo.at(-1)?.group === group) redo.pop();
      wasBreaching = breachNow() !== null;
    } else {
      wasBreaching = breach !== null;
    }
    if (breach !== null) onBlocked(breach);
  };
  const listener = (event: Events.Abstract) => {
    if (event.isUiEvent || !event.recordUndo) return;
    if (!(event instanceof Events.BlockMove) && !(event instanceof Events.BlockCreate)) return;
    if (pending === undefined) pending = setTimeout(check, 0);
  };
  workspace.addChangeListener(listener);
  return () => {
    clearTimeout(pending);
    workspace.removeChangeListener(listener);
  };
}
