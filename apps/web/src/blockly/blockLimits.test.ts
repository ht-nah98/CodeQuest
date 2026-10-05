import { Events, Options, serialization, Workspace } from 'blockly';
import { describe, expect, it } from 'vitest';
import type { WorkspaceJson } from '@codequest/content-schema';
import { loopDepth } from '@codequest/engine';
import { registerAllBlocks } from '@codequest/games';
import { blockLimitBreach, guardBlockLimits } from './blockLimits';

type Block = { type: string } & Record<string, unknown>;

const loop = (inner?: Block): Block => ({
  type: 'cq_repeat',
  fields: { TIMES: 2 },
  ...(inner && { inputs: { DO: { block: inner } } }),
});
const until = (inner?: Block): Block => ({
  type: 'cq_repeat_until',
  ...(inner && { inputs: { DO: { block: inner } } }),
});
const walk: Block = { type: 'runner_walk' };

function program(...stacks: Block[]): WorkspaceJson {
  const [main, ...loose] = stacks;
  return {
    blocks: {
      languageVersion: 0,
      blocks: [{ type: 'cq_start', ...(main && { next: { block: main } }) }, ...loose],
    },
  };
}

describe('blockLimitBreach (P2-11, T16b)', () => {
  it('no limits: never a breach', () => {
    expect(blockLimitBreach(program(loop(loop(loop(walk)))), {})).toBeNull();
  });

  it('maxLoopDepth 1: one loop is fine, a loop in a loop is not (any loop kinds)', () => {
    expect(blockLimitBreach(program(loop(walk)), { maxLoopDepth: 1 })).toBeNull();
    expect(blockLimitBreach(program(loop(loop(walk))), { maxLoopDepth: 1 })).toBe('loopDepth');
    expect(blockLimitBreach(program(until(loop(walk))), { maxLoopDepth: 1 })).toBe('loopDepth');
    expect(blockLimitBreach(program(loop(loop(walk))), { maxLoopDepth: 2 })).toBeNull();
  });

  it('loose stacks count too, like Blockly and content:check', () => {
    expect(blockLimitBreach(program(walk, loop(loop())), { maxLoopDepth: 1 })).toBe('loopDepth');
  });

  it('maxInstances: more blocks of a limited type than allowed', () => {
    const limits = { maxInstances: { cq_repeat: 1 } };
    expect(blockLimitBreach(program(loop(walk)), limits)).toBeNull();
    expect(blockLimitBreach(program(loop(walk), loop()), limits)).toBe('instances');
    expect(blockLimitBreach(program(walk, walk), limits)).toBeNull();
  });
});

describe('guardBlockLimits (headless Blockly)', () => {
  registerAllBlocks();

  /** Lets Blockly fire its queued events and the guard's deferred check run. */
  const settle = () => new Promise((resolve) => setTimeout(resolve, 30));

  function workspaceWith(json: WorkspaceJson): Workspace {
    const workspace = new Workspace(new Options({}));
    serialization.workspaces.load(json, workspace, { recordUndo: false });
    return workspace;
  }

  /** A child's drop: a new loop into the DO slot of `parentId`, as one event group. */
  function dropLoopInto(workspace: Workspace, parentId: string): string {
    Events.setGroup(true);
    const block = workspace.newBlock('cq_repeat');
    const slot = workspace.getBlockById(parentId)?.getInput('DO')?.connection;
    if (!slot || !block.previousConnection) throw new Error('no connection');
    slot.connect(block.previousConnection);
    Events.setGroup(false);
    return block.id;
  }

  const outer = (inner?: Block): WorkspaceJson => program({ ...loop(inner ?? walk), id: 'outer' });

  it('undoes a drop that puts a loop in a loop, and "Làm tiếp" cannot redo it', async () => {
    const workspace = workspaceWith(outer());
    const blocked: string[] = [];
    const stop = guardBlockLimits(workspace, { maxLoopDepth: 1 }, (breach) => blocked.push(breach));
    const id = dropLoopInto(workspace, 'outer');
    await settle();
    expect(blocked).toEqual(['loopDepth']);
    expect(workspace.getBlockById(id)).toBeNull();
    expect(loopDepthOf(workspace)).toBe(1);
    expect(workspace.getRedoStack()).toHaveLength(0);
    workspace.undo(true); // "Làm tiếp"
    await settle();
    expect(loopDepthOf(workspace)).toBe(1);
    expect(workspace.getBlocksByType('runner_walk', false)).toHaveLength(1);
    stop();
    workspace.dispose();
  });

  it('a drag from the toolbox into an occupied slot: no undo mid-drag, the displaced block survives', async () => {
    const workspace = workspaceWith(outer());
    let dragging = false;
    Object.assign(workspace, { isDragging: () => dragging });
    const blocked: string[] = [];
    const stop = guardBlockLimits(workspace, { maxLoopDepth: 1 }, (breach) => blocked.push(breach));
    // Drag start: the new loop is created (recorded) and its events fire while still dragging.
    Events.setGroup('drag-1');
    dragging = true;
    const block = workspace.newBlock('cq_repeat');
    await settle();
    expect(workspace.getBlockById(block.id)).not.toBeNull();
    expect(blocked).toEqual([]);
    // Drop, same group: into the DO slot that holds the walk block.
    const slot = workspace.getBlockById('outer')?.getInput('DO')?.connection;
    if (!slot || !block.previousConnection) throw new Error('no connection');
    slot.connect(block.previousConnection);
    dragging = false;
    Events.setGroup(false);
    await settle();
    expect(blocked).toEqual(['loopDepth']);
    expect(workspace.getBlockById(block.id)).toBeNull();
    expect(workspace.getBlocksByType('runner_walk', false)).toHaveLength(1);
    expect(workspace.getBlockById('outer')?.getInputTargetBlock('DO')?.type).toBe('runner_walk');
    expect(loopDepthOf(workspace)).toBe(1);
    stop();
    workspace.dispose();
  });

  it('a workspace that already broke the limit is never undone, only told', async () => {
    const workspace = workspaceWith(outer(loop(walk)));
    const blocked: string[] = [];
    const stop = guardBlockLimits(workspace, { maxLoopDepth: 1 }, (breach) => blocked.push(breach));
    Events.setGroup(true);
    workspace.newBlock('runner_jump');
    Events.setGroup(false);
    await settle();
    expect(blocked).toEqual(['loopDepth']);
    expect(workspace.getBlocksByType('runner_jump', false)).toHaveLength(1);
    stop();
    workspace.dispose();
  });

  it('a change within the limits is left alone', async () => {
    const workspace = workspaceWith(outer());
    const blocked: string[] = [];
    const stop = guardBlockLimits(workspace, { maxLoopDepth: 2 }, (breach) => blocked.push(breach));
    dropLoopInto(workspace, 'outer');
    await settle();
    expect(blocked).toEqual([]);
    expect(loopDepthOf(workspace)).toBe(2);
    stop();
    workspace.dispose();
  });
});

function loopDepthOf(workspace: Workspace): number {
  return loopDepth(serialization.workspaces.save(workspace) as WorkspaceJson);
}
