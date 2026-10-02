import { afterEach, beforeEach, describe, expect, it, vi as vitest } from 'vitest';
import {
  Events,
  getMainWorkspace,
  inject,
  serialization,
  utils,
  WidgetDiv,
  type WorkspaceSvg,
} from 'blockly';
import { type NextStep, nextStep } from '@codequest/engine';
import type { WorkspaceJson } from '@codequest/content-schema';
import { startContentHighlight } from './contentHighlight';
import { nextStepMessage, showNextStepPopover } from './nextStepPopover';
import { fitsBubble } from '../ui/bubbleCopy';
import { setupBlockly } from './setup';
import { buildToolbox } from './toolbox';

const solution: WorkspaceJson = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: 'cq_start',
        id: 'start',
        next: {
          block: {
            type: 'runner_jump',
            id: 'j',
            next: { block: { type: 'runner_walk', id: 'w' } },
          },
        },
      },
    ],
  },
};

let host: HTMLDivElement;
let workspace: WorkspaceSvg;

function load(blocks: unknown[]): void {
  serialization.workspaces.load({ blocks: { languageVersion: 0, blocks } }, workspace);
}
const current = (): WorkspaceJson => serialization.workspaces.save(workspace) as WorkspaceJson;

beforeEach(() => {
  setupBlockly();
  host = document.createElement('div');
  host.className = 'cq-blockly';
  document.body.append(host);
  // Like BlocklyWorkspace: Blockly injects straight into the `.cq-blockly` div.
  workspace = inject(host, {
    renderer: 'zelos',
    toolbox: buildToolbox({ mode: 'build', toolbox: ['runner_walk', 'runner_jump'] }),
  });
});

afterEach(() => {
  workspace.dispose();
  host.remove();
});

describe('showNextStepPopover (blockly-integration.md §8)', () => {
  it('previews the missing block without touching the workspace, and outlines the anchor', () => {
    load([{ type: 'cq_start', id: 'start', next: { block: { type: 'runner_jump', id: 'a' } } }]);
    const before = JSON.stringify(current());
    const step = nextStep(solution, current());
    expect(step).toMatchObject({ kind: 'add', anchor: { blockId: 'a', input: null } });

    const popover = showNextStepPopover(workspace, step);
    expect(popover.element.parentElement).toBe(host);
    expect(popover.element.getAttribute('role')).toBe('dialog');
    expect(popover.element.textContent).toContain('Ghép khối này vào chỗ sáng nhé!');
    const preview = popover.element.querySelector('.cq-step-preview');
    expect(preview?.querySelector('.blocklyPath')).toBeTruthy();
    expect(workspace.getBlockById('a')?.getSvgRoot().classList.contains('cq-step-anchor')).toBe(
      true,
    );
    const flyoutWalks = workspace
      .getFlyout()
      ?.getWorkspace()
      .getTopBlocks(false)
      .filter((block) => block.type === 'runner_walk');
    expect(flyoutWalks?.every((b) => b.getSvgRoot().classList.contains('cq-step-flyout'))).toBe(
      true,
    );
    // The main workspace is unchanged: no block inserted, same JSON.
    expect(JSON.stringify(current())).toBe(before);
    popover.close();
  });

  it('marks the wrong block for replace and remove, with the right copy', () => {
    load([
      {
        type: 'cq_start',
        id: 'start',
        next: {
          block: {
            type: 'runner_walk',
            id: 'x',
            next: { block: { type: 'runner_walk', id: 'y' } },
          },
        },
      },
    ]);
    const step = nextStep(solution, current());
    expect(step).toMatchObject({ kind: 'replace', blockId: 'x', midStack: true });
    const replace = showNextStepPopover(workspace, step);
    expect(replace.element.textContent).toContain('Xóa khối sáng, rồi ghép khối này vào chỗ đó.');
    expect(replace.element.querySelector('.cq-step-preview .blocklyPath')).toBeTruthy();
    expect(workspace.getBlockById('x')?.getSvgRoot().classList.contains('cq-step-wrong')).toBe(
      true,
    );
    replace.close();
    expect(workspace.getBlockById('x')?.getSvgRoot().classList.contains('cq-step-wrong')).toBe(
      false,
    );

    const removeMid: NextStep = { kind: 'remove', blockId: 'x', midStack: true, loose: false };
    const popover = showNextStepPopover(workspace, removeMid);
    expect(popover.element.textContent).toContain('Chuột phải vào khối sáng, chọn Xóa khối nhé!');
    expect(popover.element.querySelector('.cq-step-preview')).toBeNull();
    popover.close();
  });

  it('outlines the block to move and where it goes', () => {
    load([
      {
        type: 'cq_start',
        id: 'start',
        next: {
          block: {
            type: 'runner_walk',
            id: 'w',
            next: { block: { type: 'runner_jump', id: 'j' } },
          },
        },
      },
    ]);
    const step = nextStep(solution, current());
    expect(step).toMatchObject({ kind: 'move', blockId: 'j', anchor: { blockId: 'start' } });
    const popover = showNextStepPopover(workspace, step);
    expect(popover.element.textContent).toContain('Kéo khối sáng tới chỗ có mũi tên nhé!');
    expect(workspace.getBlockById('j')?.getSvgRoot().classList.contains('cq-step-source')).toBe(
      true,
    );
    expect(workspace.getBlockById('start')?.getSvgRoot().classList.contains('cq-step-anchor')).toBe(
      true,
    );
    popover.close();
  });

  it('previews the right fields for an edit', () => {
    load([{ type: 'cq_start', id: 'start' }]);
    const edit: NextStep = {
      kind: 'edit',
      blockId: 'start',
      block: { type: 'runner_jump', id: 'cq-next-step' },
    };
    const popover = showNextStepPopover(workspace, edit);
    expect(popover.element.textContent).toContain('Sửa khối sáng cho giống khối này nhé!');
    expect(popover.element.querySelector('.cq-step-preview .blocklyPath')).toBeTruthy();
    popover.close();
  });

  it('has a line for every step kind', () => {
    const anchor = { blockId: 'a', input: null };
    const block = { type: 'runner_walk' };
    const lines = [
      nextStepMessage({ kind: 'add', block, anchor }),
      nextStepMessage({ kind: 'move', blockId: 'a', anchor, withTail: true }),
      nextStepMessage({ kind: 'replace', block, anchor, blockId: 'a', midStack: false }),
      nextStepMessage({ kind: 'remove', blockId: 'a', midStack: false, loose: false }),
      nextStepMessage({ kind: 'remove', blockId: 'a', midStack: false, loose: true }),
      nextStepMessage({ kind: 'reset' }),
    ];
    expect(lines).toEqual([
      'Ghép khối này vào chỗ sáng nhé!',
      'Kéo khối sáng, cả các khối dưới nó, tới mũi tên nhé!',
      'Đổi khối sáng thành khối này nhé!',
      'Bỏ khối sáng ra nhé!',
      'Bỏ khối rời sáng ra cho có chỗ nhé!',
      'Thiếu khối rồi. Bấm Làm lại để lấy lại nhé!',
    ]);
    for (const line of lines) expect(fitsBubble(line)).toBe(true);
  });

  it('says the program already matches when there is no next step', () => {
    load(solution.blocks.blocks);
    const popover = showNextStepPopover(workspace, nextStep(solution, current()));
    expect(popover.element.textContent).toContain('Giống lời giải rồi. Bấm Chạy nhé!');
    popover.close();
  });

  it('closes on Escape, a press outside, the close button, or a block drop; once', () => {
    load([{ type: 'cq_start', id: 'start' }]);
    const step = nextStep(solution, current());
    const closers: Array<(popover: ReturnType<typeof showNextStepPopover>) => void> = [
      () => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })),
      () => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })),
      (p) => p.element.querySelector<HTMLButtonElement>('.cq-step-close')?.click(),
    ];
    for (const closeIt of closers) {
      const onClose = vitest.fn();
      const popover = showNextStepPopover(workspace, step, { onClose });
      closeIt(popover);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(popover.element.isConnected).toBe(false);
      expect(
        workspace.getBlockById('start')?.getSvgRoot().classList.contains('cq-step-anchor'),
      ).toBe(false);
      popover.close();
      expect(onClose).toHaveBeenCalledTimes(1);
    }

    const onClose = vitest.fn();
    const popover = showNextStepPopover(workspace, step, { onClose });
    // A press inside the Blockly area (dragging the block in) keeps it open.
    host.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();
    // Dropping a block closes it.
    const block = workspace.newBlock('runner_jump');
    block.initSvg();
    block.render();
    workspace.fireChangeListener(new Events.BlockDrag(block, false, []));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(popover.element.isConnected).toBe(false);
  });
});

describe('showNextStepPopover: Blockly interplay', () => {
  it('keeps Escape for an open Blockly widget, follows scrolling and keeps the main workspace', () => {
    load([{ type: 'cq_start', id: 'start' }]);
    const onClose = vitest.fn();
    const popover = showNextStepPopover(workspace, nextStep(solution, current()), { onClose });
    // The preview inject must not steal the "main workspace" role (shortcuts act on it).
    expect(getMainWorkspace()).toBe(workspace);

    const before = popover.element.style.left;
    const hostBox = vitest.spyOn(host, 'getBoundingClientRect');
    hostBox.mockReturnValue(new DOMRect(-100, -50, 800, 600));
    workspace.fireChangeListener(new Events.ViewportChange(0, 0, 1, workspace.id, 1));
    expect(popover.element.style.left).not.toBe(before);
    hostBox.mockRestore();

    WidgetDiv.show({}, false, () => undefined);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).not.toHaveBeenCalled();
    WidgetDiv.hide();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(getMainWorkspace()).toBe(workspace);
  });
});

describe('showNextStepPopover: placement', () => {
  it('falls back to the left of the stack, stays inside the panel and re-places on resize', () => {
    // Workspace = screen coordinates; a 400×300 panel; a 200×100 popover.
    vitest
      .spyOn(utils.svgMath, 'wsToScreenCoordinates')
      .mockImplementation((_ws, xy) => new utils.Coordinate(xy.x, xy.y));
    vitest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200);
    vitest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(100);
    const hostBox = vitest.spyOn(host, 'getBoundingClientRect');
    hostBox.mockReturnValue(new DOMRect(0, 0, 400, 300));
    let onResize: (() => void) | undefined;
    vitest.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          onResize = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    try {
      // A stack far right and low: no room on its right, and its row is below the panel.
      load([
        {
          type: 'cq_start',
          id: 'start',
          x: 260,
          y: 1000,
          next: { block: { type: 'runner_jump', id: 'a' } },
        },
      ]);
      const stack = workspace.getBlockById('start')?.getBoundingRectangle();
      if (!stack) throw new Error('fixture');
      const popover = showNextStepPopover(workspace, nextStep(solution, current()));
      expect(popover.element.dataset.side).toBe('left');
      // Beside the stack's left edge (not its right edge): the program stays visible.
      expect(popover.element.style.left).toBe(`${String(stack.left - 16 - 200)}px`);
      expect(popover.element.style.top).toBe('192px'); // 300 - 100 - 8

      // The panel grows: room on the right now, and the row fits.
      hostBox.mockReturnValue(new DOMRect(0, 0, 1200, 1400));
      onResize?.();
      expect(popover.element.dataset.side).toBe('right');
      expect(popover.element.style.left).toBe(`${String(stack.right + 16)}px`);
      popover.close();
    } finally {
      vitest.restoreAllMocks();
      vitest.unstubAllGlobals();
    }
  });
});

describe('startContentHighlight', () => {
  it('adds the content highlight to the workspace and removes it', () => {
    load([{ type: 'cq_start', id: 'start' }]);
    const stop = startContentHighlight(workspace);
    expect(workspace.getParentSvg().querySelector('.contentAreaHighlight')).toBeTruthy();
    stop();
    expect(workspace.getParentSvg().querySelector('.contentAreaHighlight')).toBeNull();
  });
});
