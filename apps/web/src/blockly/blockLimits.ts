import { Events, serialization, type Workspace } from 'blockly';
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

/**
 * Drop-time guard for the limits Blockly lacks (blockly-integration.md §5): `maxLoopDepth` has
 * no Blockly option, and `maxInstances` only greys out the flyout (a duplicate or paste can
 * still go over). After a child's move or new block (never a program load), once the event
 * batch has fired and no drag is in progress, a change that makes the workspace break a limit
 * is undone as a whole (Blockly's own undo of that group: a block dragged from the toolbox goes
 * back to it, a moved block goes back where it was, a duplicate disappears) and its redo entry
 * is dropped, so "Làm tiếp" cannot bring it back. A workspace that already broke a limit before
 * the change (an old draft) is never undone: `onBlocked` only says why. Returns the removal.
 *
 * No polling while a drag runs: a drag from the toolbox records its BlockCreate when it starts,
 * and the drop's BlockMove events of the same group reach the undo stack only later (Blockly
 * fires its queue after a frame). Undoing in between would undo the creation alone and delete
 * the new block together with the block it displaced. So a check during a drag just returns;
 * the drop's own recorded BlockMove schedules the next check, after its whole batch has fired.
 * And the guard only undoes when the last undo entry belongs to the group it last saw.
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
  /** Event group of the last recorded move / create the guard saw. */
  let lastGroup: string | null = null;
  // `isDragging` exists on rendered workspaces only (headless tests may stub it).
  const dragging = () =>
    (workspace as Workspace & { isDragging?: () => boolean }).isDragging?.() === true;
  const check = () => {
    pending = undefined;
    if (dragging()) return;
    const breach = breachNow();
    if (breach !== null && !wasBreaching) {
      // Undo only a change we saw end: the last undo entry must be of the group we last saw.
      if (workspace.getUndoStack().at(-1)?.group !== lastGroup) return;
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
    lastGroup = event.group;
    if (pending === undefined) pending = setTimeout(check, 0);
  };
  workspace.addChangeListener(listener);
  return () => {
    clearTimeout(pending);
    workspace.removeChangeListener(listener);
  };
}
