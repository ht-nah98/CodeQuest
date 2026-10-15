import 'blockly/blocks';
import { Events, Options, serialization, Workspace } from 'blockly';
import { describe, expect, it } from 'vitest';
import type { WorkspaceJson } from '@codequest/content-schema';
import { analyzeWorkspace } from '@codequest/engine';
import { registerAllBlocks } from '@codequest/games';
import { capacityUsed, guardCapacity } from './capacity';

registerAllBlocks();

/** Drains Blockly's queued events and the guard's deferred check (see blockLimits.test.ts). */
const settle = async () => {
  for (let turn = 0; turn < 20; turn++) await new Promise((resolve) => setTimeout(resolve, 0));
};

/** `cq_start` → `controls_repeat_ext` (TIMES is a math_number shadow) { maze_forward }. */
const SHADOW_LOOP: WorkspaceJson = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: 'cq_start',
        id: 'start',
        next: {
          block: {
            type: 'controls_repeat_ext',
            id: 'loop',
            inputs: {
              TIMES: { shadow: { type: 'math_number', fields: { NUM: 3 } } },
              DO: { block: { type: 'maze_forward' } },
            },
          },
        },
      },
      { type: 'maze_turn_left', x: 200, y: 0 },
    ],
  },
};

function workspaceWith(json: WorkspaceJson): Workspace {
  const workspace = new Workspace(new Options({}));
  serialization.workspaces.load(json, workspace, { recordUndo: false });
  return workspace;
}

/** A child's new block, as one event group (a toolbox drop or a duplicate). */
function addBlock(workspace: Workspace, type: string): string {
  Events.setGroup(true);
  const id = workspace.newBlock(type).id;
  Events.setGroup(false);
  return id;
}

describe('capacityUsed (P4-07)', () => {
  it('counts like the engine: no cq_start, no shadow, loose blocks included', () => {
    const workspace = workspaceWith(SHADOW_LOOP);
    // Blockly's own count would be 5 (start, loop, shadow, forward, turn).
    expect(workspace.getAllBlocks(false)).toHaveLength(5);
    expect(capacityUsed(workspace)).toBe(3);
    const analysis = analyzeWorkspace(SHADOW_LOOP);
    expect(capacityUsed(workspace)).toBe(analysis.blocksUsed + analysis.orphanBlockIds.length);
    workspace.dispose();
  });
});

describe('guardCapacity (headless Blockly)', () => {
  it('a shadow does not use a place: room left at maxBlocks 4', async () => {
    const workspace = workspaceWith(SHADOW_LOOP);
    let full = 0;
    const stop = guardCapacity(workspace, 4, () => full++);
    const id = addBlock(workspace, 'maze_forward');
    await settle();
    expect(full).toBe(0);
    expect(workspace.getBlockById(id)).not.toBeNull();
    stop();
    workspace.dispose();
  });

  it('undoes a new block over maxBlocks, and "Làm tiếp" cannot redo it', async () => {
    const workspace = workspaceWith(SHADOW_LOOP);
    let full = 0;
    const stop = guardCapacity(workspace, 3, () => full++);
    const id = addBlock(workspace, 'maze_forward');
    await settle();
    expect(full).toBe(1);
    expect(workspace.getBlockById(id)).toBeNull();
    expect(capacityUsed(workspace)).toBe(3);
    expect(workspace.getRedoStack()).toHaveLength(0);
    stop();
    workspace.dispose();
  });

  it('a block with a shadow takes 1 place, its shadow none', async () => {
    const workspace = workspaceWith(SHADOW_LOOP);
    const stop = guardCapacity(workspace, 4, () => {});
    Events.setGroup(true);
    const loop = workspace.newBlock('controls_repeat_ext');
    const shadow = workspace.newBlock('math_number');
    shadow.setShadow(true);
    const times = loop.getInput('TIMES')?.connection;
    if (!times || !shadow.outputConnection) throw new Error('no connection');
    times.connect(shadow.outputConnection);
    Events.setGroup(false);
    await settle();
    expect(workspace.getBlockById(loop.id)).not.toBeNull();
    expect(capacityUsed(workspace)).toBe(4);
    stop();
    workspace.dispose();
  });

  it('an old workspace already over maxBlocks is only told, never undone', async () => {
    const workspace = workspaceWith(SHADOW_LOOP);
    let full = 0;
    const stop = guardCapacity(workspace, 2, () => full++);
    const id = addBlock(workspace, 'maze_forward');
    await settle();
    expect(full).toBe(1);
    expect(workspace.getBlockById(id)).not.toBeNull();
    stop();
    workspace.dispose();
  });

  it('no maxBlocks: no guard', async () => {
    const workspace = workspaceWith(SHADOW_LOOP);
    let full = 0;
    const stop = guardCapacity(workspace, undefined, () => full++);
    addBlock(workspace, 'maze_forward');
    await settle();
    expect(full).toBe(0);
    stop();
    workspace.dispose();
  });
});
