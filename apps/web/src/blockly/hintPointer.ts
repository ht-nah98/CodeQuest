import { BlockSvg, Events, type WorkspaceSvg } from 'blockly';
import { CQ_START } from '@codequest/engine';
import type { HintTarget } from '@codequest/content-schema';
import './hintPointer.css';

/**
 * The block a tier-0 hint points at (hint-engine.md §3 `Target`), or null when the target is not
 * a block or is not on screen:
 * - `toolbox:<type>`: that block in the flyout (none in mode parsons: the toolbox is hidden);
 * - `block:<type>`: the first block of that type in the workspace (top to bottom): one in the
 *   program first, or a loose one first when `preferLoose` (a hint about blocks not joined to
 *   "khi bắt đầu");
 * - no target and `preferLoose`: the first loose block.
 */
export function hintTargetBlock(
  workspace: WorkspaceSvg,
  target: HintTarget | null,
  { parsons = false, preferLoose = false }: { parsons?: boolean; preferLoose?: boolean } = {},
): BlockSvg | null {
  const isLoose = (block: BlockSvg) => block.getRootBlock().type !== CQ_START;
  if (target === null) {
    if (!preferLoose) return null;
    return workspace.getTopBlocks(true).find((block) => block.type !== CQ_START) ?? null;
  }
  if (target.startsWith('toolbox:')) {
    if (parsons) return null;
    const type = target.slice('toolbox:'.length);
    const flyout = workspace.getFlyout()?.getWorkspace().getTopBlocks(true) ?? [];
    return flyout.find((block) => block.type === type) ?? null;
  }
  if (target.startsWith('block:')) {
    const blocks = workspace
      .getBlocksByType(target.slice('block:'.length), true)
      .filter((block): block is BlockSvg => block instanceof BlockSvg);
    const wanted = blocks.find((block) => isLoose(block) === preferLoose);
    return wanted ?? blocks[0] ?? null;
  }
  return null;
}

/**
 * Points at a block (in the workspace or its flyout) with a bouncing arrow on its left and a
 * coin outline, until the returned cleanup runs. Follows scrolling and zooming.
 */
export function pointAtBlock(workspace: WorkspaceSvg, block: BlockSvg): () => void {
  const injectionDiv = workspace.getInjectionDiv();
  const host = injectionDiv.parentElement ?? injectionDiv;
  const arrow = document.createElement('div');
  arrow.className = 'cq-tip-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.dataset.testid = 'hint-arrow';
  arrow.dataset.blockId = block.id;
  arrow.dataset.blockType = block.type;
  host.append(arrow);
  block.addClass('cq-tip-target');

  const place = () => {
    const rect = block.getSvgRoot().getBoundingClientRect();
    const box = host.getBoundingClientRect();
    arrow.style.left = `${String(Math.max(0, rect.left - box.left - 34))}px`;
    arrow.style.top = `${String(Math.max(0, rect.top - box.top + 4))}px`;
  };
  place();
  const onChange = (event: Events.Abstract) => {
    if (event instanceof Events.ViewportChange || !event.isUiEvent) place();
  };
  workspace.addChangeListener(onChange);
  return () => {
    workspace.removeChangeListener(onChange);
    if (!block.isDeadOrDying()) block.removeClass('cq-tip-target');
    arrow.remove();
  };
}

/** Points at a screen element (run button, capacity bar, stage) with a pulsing ring. */
export function pointAtElement(element: HTMLElement): () => void {
  element.dataset.hintTarget = 'true';
  return () => {
    delete element.dataset.hintTarget;
  };
}
