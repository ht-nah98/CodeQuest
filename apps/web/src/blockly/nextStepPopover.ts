import { type BlockSvg, DropDownDiv, Events, utils, WidgetDiv, type WorkspaceSvg } from 'blockly';
import type { NextStep, StepAnchor } from '@codequest/engine';
import { vi } from '../i18n/vi';
import './nextStepPopover.css';
import { mountReadOnlyWorkspace, type ReadOnlyWorkspace } from './readOnlyWorkspace';

const t = vi.hints.nextStep;

export interface NextStepPopover {
  readonly element: HTMLElement;
  /** Removes the popover and every outline it added; idempotent. */
  close(): void;
}

export interface NextStepPopoverOptions {
  /** Called once when the popover closes, whatever closed it. */
  onClose?: () => void;
}

/** Gap between the anchor point and the popover, in px. */
const GAP = 16;
const EDGE = 8;

/** What Măng says for a step (≤ 12 words, ui-copy-guide.md). */
export function nextStepMessage(step: NextStep | null): string {
  if (step === null) return t.done;
  switch (step.kind) {
    case 'add':
      return t.add;
    case 'move':
      return step.withTail ? t.moveWithTail : t.move;
    case 'edit':
      return t.edit;
    case 'replace':
      return step.midStack ? t.replaceMid : t.replace;
    case 'remove':
      return step.loose ? t.removeLoose : step.midStack ? t.removeMid : t.remove;
    case 'reset':
      return t.reset;
  }
}

/** Where the popover goes, in workspace coordinates: beside `right`, else beside `left`. */
interface AnchorSpot {
  left: number;
  right: number;
  y: number;
}

/**
 * The left and right edges of the whole stack holding `block` (so the popover never covers the
 * program), at height `y`: the popover's arrow then points along that row to the spot.
 */
function besideStack(block: BlockSvg, y: number): AnchorSpot {
  const { left, right } = block.getRootBlock().getBoundingRectangle();
  return { left, right, y };
}

function connectionPoint(workspace: WorkspaceSvg, anchor: StepAnchor): AnchorSpot | null {
  const block = workspace.getBlockById(anchor.blockId);
  if (!block) return null;
  const connection =
    anchor.input === null ? block.nextConnection : block.getInput(anchor.input)?.connection;
  return besideStack(block, connection ? connection.y : block.getRelativeToSurfaceXY().y);
}

function blockPoint(workspace: WorkspaceSvg, id: string): AnchorSpot | null {
  const block = workspace.getBlockById(id);
  return block ? besideStack(block, block.getBoundingRectangle().top + 16) : null;
}

/** Workspace coordinates of the spot the child should look at. */
function anchorPoint(workspace: WorkspaceSvg, step: NextStep | null): AnchorSpot | null {
  if (step === null || step.kind === 'reset') {
    const top = workspace.getTopBlocks(true)[0];
    if (!top) return null;
    const { x, y } = top.getRelativeToSurfaceXY();
    return { left: x, right: x, y };
  }
  if (step.kind === 'edit' || step.kind === 'remove') return blockPoint(workspace, step.blockId);
  return connectionPoint(workspace, step.anchor);
}

/** Blocks outlined while the popover is open, with the class each one got. */
function outlines(workspace: WorkspaceSvg, step: NextStep | null): Array<[BlockSvg, string]> {
  const marks: Array<[BlockSvg, string]> = [];
  const mark = (id: string, className: string) => {
    const block = workspace.getBlockById(id);
    if (block) marks.push([block, className]);
  };
  const markFlyout = (type: unknown) => {
    for (const block of workspace.getFlyout()?.getWorkspace().getTopBlocks(false) ?? []) {
      if (block.type === type) marks.push([block, 'cq-step-flyout']);
    }
  };
  switch (step?.kind) {
    case 'add':
      mark(step.anchor.blockId, 'cq-step-anchor');
      markFlyout(step.block['type']);
      break;
    case 'move':
      mark(step.anchor.blockId, 'cq-step-anchor');
      mark(step.blockId, 'cq-step-source');
      break;
    case 'edit':
      mark(step.blockId, 'cq-step-source');
      break;
    case 'replace':
      mark(step.blockId, 'cq-step-wrong');
      markFlyout(step.block['type']);
      break;
    case 'remove':
      mark(step.blockId, 'cq-step-wrong');
      break;
    default:
      break;
  }
  return marks;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  return element;
}

/**
 * Shows the tier-2 hint next to the main workspace (blockly-integration.md §8): a popover pointing
 * at where to act, with a read-only preview of the block to add / change into, and outlines on
 * the blocks involved. Nothing is inserted into the workspace, so its JSON, capacity and change
 * events stay untouched. `step` null = the program already matches the solution. Follows the
 * workspace when it scrolls or zooms. Closes on a block drop, a press outside the Blockly area,
 * Escape (unless a Blockly dropdown is open) or its close button.
 */
export function showNextStepPopover(
  workspace: WorkspaceSvg,
  step: NextStep | null,
  { onClose }: NextStepPopoverOptions = {},
): NextStepPopover {
  // The `.cq-blockly` wrapper (position: relative) holds the popover, above Blockly's own SVG.
  const injectionDiv = workspace.getInjectionDiv();
  const host = injectionDiv.parentElement ?? injectionDiv;

  const element = el('div', 'cq-step-popover');
  element.setAttribute('role', 'dialog');
  element.setAttribute('aria-label', t.title);
  element.dataset.kind = step?.kind ?? 'done';
  element.dataset.testid = 'next-step-popover';
  const arrow = el('span', 'cq-step-arrow');
  arrow.setAttribute('aria-hidden', 'true');
  const text = el('p', 'cq-step-text');
  text.setAttribute('aria-live', 'polite');
  text.textContent = nextStepMessage(step);
  const closeButton = el('button', 'cq-step-close');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', t.close);
  closeButton.textContent = '×';
  element.append(arrow, text, closeButton);
  host.append(element);

  let preview: ReadOnlyWorkspace | null = null;
  if (step?.kind === 'add' || step?.kind === 'replace' || step?.kind === 'edit') {
    const previewBox = el('div', 'cq-step-preview');
    element.append(previewBox);
    const block = { ...step.block, type: String(step.block['type']), x: 12, y: 12 };
    preview = mountReadOnlyWorkspace(
      previewBox,
      { blocks: { languageVersion: 0, blocks: [block] } },
      { scale: 0.9, scrollable: false },
    );
  }

  const place = () => {
    const spot = anchorPoint(workspace, step);
    if (spot === null) return;
    const box = host.getBoundingClientRect();
    const toHost = (x: number) =>
      utils.svgMath.wsToScreenCoordinates(workspace, new utils.Coordinate(x, spot.y));
    const right = toHost(spot.right);
    const xRight = right.x - box.left;
    // Left of the stack's left edge, so the popover does not cover the program either way.
    const xLeft = toHost(spot.left).x - box.left;
    const y = right.y - box.top;
    const width = element.offsetWidth;
    const fitsRight = xRight + GAP + width <= box.width - EDGE;
    element.dataset.side = fitsRight || xLeft - GAP - width < EDGE ? 'right' : 'left';
    const left = element.dataset.side === 'right' ? xRight + GAP : xLeft - GAP - width;
    // Inside the Blockly panel: not above it, nor below its bottom edge.
    const maxTop = box.height - element.offsetHeight - EDGE;
    element.style.left = `${String(Math.max(EDGE, left))}px`;
    element.style.top = `${String(Math.max(EDGE, Math.min(y - 26, maxTop)))}px`;
  };
  place();
  // The panel resizes with the window (and the hint row below it): stay beside the spot.
  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place);
  resizeObserver?.observe(host);

  const marks = outlines(workspace, step);
  for (const [block, className] of marks) block.addClass(className);

  let open = true;
  const onWorkspaceChange = (event: Events.Abstract) => {
    if (event instanceof Events.BlockDrag && !event.isStart) close();
    else if (event instanceof Events.ViewportChange) place();
  };
  const onPointerDown = (event: PointerEvent) => {
    // Inside Blockly the child is dragging the block in: the drop closes the popover.
    if (event.target instanceof Node && !host.contains(event.target)) close();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    // Escape first closes an open Blockly dropdown or field editor.
    if (event.key === 'Escape' && !WidgetDiv.isVisible() && !DropDownDiv.isVisible()) close();
  };

  function close(): void {
    if (!open) return;
    open = false;
    workspace.removeChangeListener(onWorkspaceChange);
    resizeObserver?.disconnect();
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('keydown', onKeyDown, true);
    for (const [block, className] of marks) {
      if (!block.isDeadOrDying()) block.removeClass(className);
    }
    preview?.dispose();
    element.remove();
    onClose?.();
  }

  workspace.addChangeListener(onWorkspaceChange);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('keydown', onKeyDown, true);
  closeButton.addEventListener('click', close);

  return { element, close };
}
