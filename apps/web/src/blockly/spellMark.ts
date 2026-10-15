import { BlockSvg, type WorkspaceSvg } from 'blockly';
import { PROC_DEF_TYPES } from '@codequest/engine';

/** CSS class of the `dạy phép` block whose spell runs now (blockly.css). */
export const SPELL_ACTIVE_CLASS = 'cq-spell-active';

/**
 * Lights the `dạy phép` block of spell `id` while its body runs in the replay (ADR-0023 §6): a
 * glowing outline on the hat block; the highlight of the running block still goes into the body.
 * `data-spell-active` on the block is for e2e. Returns the cleanup, or `null` when the workspace
 * has no `dạy phép` block of that spell.
 */
export function markSpell(workspace: WorkspaceSvg, id: string): (() => void) | null {
  const block = workspace
    .getTopBlocks(false)
    .find(
      (top) => PROC_DEF_TYPES.includes(top.type) && (top.getFieldValue('PROC') as unknown) === id,
    );
  if (!(block instanceof BlockSvg)) return null;
  block.addClass(SPELL_ACTIVE_CLASS);
  const root = block.getSvgRoot();
  root.dataset.spellActive = 'true';
  return () => {
    delete root.dataset.spellActive;
    if (!block.isDeadOrDying()) block.removeClass(SPELL_ACTIVE_CLASS);
  };
}
