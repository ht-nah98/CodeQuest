import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inject, serialization, type WorkspaceSvg } from 'blockly';
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

  it('rings an element until stopped', () => {
    const element = document.createElement('button');
    const stop = pointAtElement(element);
    expect(element.dataset.hintTarget).toBe('true');
    stop();
    expect(element.dataset.hintTarget).toBeUndefined();
  });
});
