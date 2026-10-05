import { BlockSvg, type WorkspaceSvg } from 'blockly';

/** CSS classes of a question block while it shows its answer (blockly.css). */
export const SENSE_YES_CLASS = 'cq-sense-yes';
export const SENSE_NO_CLASS = 'cq-sense-no';

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Radius of the ✔/✘ badge, in workspace units (a 14pt label is ~19 px tall). */
const BADGE_R = 12;

/**
 * Shows a question block's answer while the replay asks it (P2-11, curriculum.md §5.4 T7): a
 * green (✔) or red (✘) outline on the sensor block, a round ✔/✘ badge on its right end and the
 * block that asked (nếu / lặp đến khi) highlighted. The badge is drawn with paths, not a glyph:
 * ✔/✘ are not in Baloo 2 and emoji fonts are not guaranteed. Returns the cleanup, or `null`
 * when the block is not in this workspace. `data-sense="yes|no"` on the block is for e2e.
 */
export function markSense(
  workspace: WorkspaceSvg,
  blockId: string,
  value: boolean,
): (() => void) | null {
  const block = workspace.getBlockById(blockId);
  if (!(block instanceof BlockSvg)) return null;
  const root = block.getSvgRoot();
  const cls = value ? SENSE_YES_CLASS : SENSE_NO_CLASS;
  block.addClass(cls);
  root.dataset.sense = value ? 'yes' : 'no';

  const badge = document.createElementNS(SVG_NS, 'g');
  badge.setAttribute('class', `cq-sense-badge ${cls}`);
  const { width, height } = block.getHeightWidth();
  // On the top right corner of the block (top left in RTL), half outside, so it never hides
  // the block's own label nor the "thì" after it.
  const x = workspace.RTL ? -width + 4 : width - 4;
  badge.setAttribute('transform', `translate(${String(x)} ${String(-height / 4)})`);
  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('r', String(BADGE_R));
  const mark = document.createElementNS(SVG_NS, 'path');
  mark.setAttribute('d', value ? 'M -6 0 L -2 5 L 6 -5' : 'M -5 -5 L 5 5 M 5 -5 L -5 5');
  badge.append(circle, mark);
  root.append(badge);

  // The block that asked lights up too: a loop asks again without a highlight event of its own.
  const asker = block.getParent();
  if (asker) workspace.highlightBlock(asker.id);

  return () => {
    badge.remove();
    delete root.dataset.sense;
    if (!block.isDeadOrDying()) block.removeClass(cls);
  };
}

