import { afterEach, beforeEach, describe, expect, it, vi as vitest } from 'vitest';
import { type BlockSvg, Events, inject, serialization, type WorkspaceSvg } from 'blockly';
import { hintTargetBlock, pointAtBlock, pointAtElement } from './hintPointer';
import { setupBlockly } from './setup';
import { buildToolbox } from './toolbox';

let host: HTMLDivElement;
let workspace: WorkspaceSvg;

beforeEach(() => {
  setupBlockly();
  host = document.createElement('div');
  host.className = 'cq-blockly';
  document.body.append(host);
  workspace = inject(host, {
    renderer: 'zelos',
    toolbox: buildToolbox({ mode: 'build', toolbox: ['runner_walk', 'runner_jump'] }),
  });
  serialization.workspaces.load(
    {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'cq_start',
            id: 'start',
            x: 0,
            y: 0,
            next: { block: { type: 'runner_walk', id: 'in' } },
          },
          { type: 'runner_walk', id: 'loose', x: 300, y: 0 },
        ],
      },
    },
    workspace,
  );
});

afterEach(() => {
  workspace.dispose();
  host.remove();
});

describe('hintTargetBlock (hint-engine.md §3 Target)', () => {
  it('finds a toolbox block in the flyout, but not in parsons', () => {
    const block = hintTargetBlock(workspace, 'toolbox:runner_jump');
    expect(block?.type).toBe('runner_jump');
    expect(block?.workspace).not.toBe(workspace);
    expect(hintTargetBlock(workspace, 'toolbox:runner_jump', { parsons: true })).toBeNull();
  });

  it('picks the first block of a type, a loose one first for an orphans hint', () => {
    expect(hintTargetBlock(workspace, 'block:runner_walk')?.id).toBe('in');
    expect(hintTargetBlock(workspace, 'block:runner_walk', { preferLoose: true })?.id).toBe(
      'loose',
    );
    expect(hintTargetBlock(workspace, null, { preferLoose: true })?.id).toBe('loose');
    expect(hintTargetBlock(workspace, null)).toBeNull();
    expect(hintTargetBlock(workspace, 'stage')).toBeNull();
  });
});

describe('pointers', () => {
  it('adds and removes the arrow and outline on a block', () => {
    const block = workspace.getBlockById('loose');
    if (!block) throw new Error('fixture');
    const stop = pointAtBlock(workspace, block);
    const arrow = host.querySelector<HTMLElement>('[data-testid="hint-arrow"]');
    expect(arrow?.dataset.blockId).toBe('loose');
    expect(block.getSvgRoot().classList.contains('cq-tip-target')).toBe(true);
    stop();
    expect(host.querySelector('[data-testid="hint-arrow"]')).toBeNull();
    expect(block.getSvgRoot().classList.contains('cq-tip-target')).toBe(false);
  });

  const arrowEl = () => host.querySelector<HTMLElement>('[data-testid="hint-arrow"]');
  /** Puts the block's screen box at `left`/`top` (jsdom has no layout). */
  const placeBlock = (block: BlockSvg, left: number, top: number) => {
    block.getSvgRoot().getBoundingClientRect = () =>
      ({ left, top, right: left + 80, bottom: top + 40, width: 80, height: 40 }) as DOMRect;
  };

  it('removes the arrow once the block is deleted', async () => {
    const block = workspace.getBlockById('loose');
    if (!block) throw new Error('fixture');
    const stop = pointAtBlock(workspace, block);
    expect(arrowEl()).not.toBeNull();
    block.dispose();
    // Blockly fires the delete event a moment later.
    await vitest.waitFor(() => {
      expect(arrowEl()).toBeNull();
    });
    stop(); // still safe
  });

  it('follows a flyout block when the flyout scrolls', () => {
    const block = hintTargetBlock(workspace, 'toolbox:runner_jump');
    if (!block) throw new Error('fixture');
    placeBlock(block, 100, 50);
    const stop = pointAtBlock(workspace, block);
    expect(arrowEl()?.style.top).toBe('54px');
    placeBlock(block, 100, 150);
    block.workspace.fireChangeListener(new Events.ViewportChange(0, 0, 1, block.workspace.id, 1));
    expect(arrowEl()?.style.top).toBe('154px');
    stop();
  });

  it('points from the right when there is no room on the left', () => {
    const block = workspace.getBlockById('loose');
    if (!block) throw new Error('fixture');
    placeBlock(block, 100, 0);
    const stop = pointAtBlock(workspace, block);
    expect(arrowEl()?.dataset.side).toBe('left');
    expect(arrowEl()?.style.left).toBe('66px');
    stop();
    placeBlock(block, 10, 0);
    const stopRight = pointAtBlock(workspace, block);
    expect(arrowEl()?.dataset.side).toBe('right');
    expect(arrowEl()?.style.left).toBe('98px');
    stopRight();
  });

  it('rings an element until stopped', () => {
    const element = document.createElement('button');
    const stop = pointAtElement(element);
    expect(element.dataset.hintTarget).toBe('true');
    stop();
    expect(element.dataset.hintTarget).toBeUndefined();
  });
});
