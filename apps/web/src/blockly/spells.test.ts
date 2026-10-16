import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Events, inject, serialization, type WorkspaceSvg } from 'blockly';
import { type NextStep, nextStep, setWorkspaceProcedures } from '@codequest/engine';
import type { WorkspaceJson } from '@codequest/content-schema';
import { taughtSpells } from './BlocklyWorkspace';
import { nextStepMessage, showNextStepPopover } from './nextStepPopover';
import { setupBlockly } from './setup';
import { markSpell, SPELL_ACTIVE_CLASS } from './spellMark';
import { buildToolbox } from './toolbox';

// Spells on a rendered workspace (ADR-0023 §6, P4-06).

const procedures = [{ id: 'stair', name: 'bậc thang' }];
const def = {
  type: 'cq_proc_def',
  id: 'def',
  x: 300,
  y: 40,
  fields: { PROC: 'stair' },
  inputs: { BODY: { block: { type: 'maze_forward', id: 'body1' } } },
};
const start = {
  type: 'cq_start',
  id: 'start',
  next: { block: { type: 'cq_proc_call', id: 'call', fields: { PROC: 'stair' } } },
};
const json = (blocks: unknown[]): WorkspaceJson =>
  ({ blocks: { languageVersion: 0, blocks } }) as WorkspaceJson;

let host: HTMLDivElement;
let workspace: WorkspaceSvg;

beforeEach(() => {
  setupBlockly();
  host = document.createElement('div');
  host.className = 'cq-blockly';
  document.body.append(host);
  workspace = inject(host, {
    renderer: 'zelos',
    toolbox: buildToolbox({
      mode: 'build',
      toolbox: ['maze_forward', 'cq_proc_def', 'cq_proc_call'],
      procedures,
    }),
  });
  setWorkspaceProcedures(workspace, procedures);
  workspace.addChangeListener(Events.disableOrphans);
});

afterEach(() => {
  workspace.dispose();
  host.remove();
});

/** Lets Blockly fire its queued events (the change listeners run after a timeout). */
const settle = async () => {
  for (let turn = 0; turn < 5; turn++) await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('spells on the workspace', () => {
  it('a "dạy phép" block is a program root: never greyed out like a loose block', async () => {
    serialization.workspaces.load(json([start, def]), workspace);
    await settle();
    expect(workspace.getBlockById('def')?.isEnabled()).toBe(true);
    expect(workspace.getBlockById('body1')?.isEnabled()).toBe(true);
    // A loose "làm phép" still is.
    const loose = workspace.newBlock('cq_proc_call');
    loose.initSvg();
    loose.render();
    Events.fire(new (Events.get(Events.BLOCK_CREATE))(loose));
    await settle();
    expect(loose.isEnabled()).toBe(false);
  });

  it('spell fields show the level’s spell name', () => {
    serialization.workspaces.load(json([start, def]), workspace);
    expect(workspace.getBlockById('call')?.getField('PROC')?.getText()).toBe('bậc thang');
  });

  it('taughtSpells lists the spells with a "dạy phép" block', () => {
    serialization.workspaces.load(json([start]), workspace);
    expect([...taughtSpells(workspace)]).toEqual([]);
    serialization.workspaces.load(json([start, def]), workspace);
    expect([...taughtSpells(workspace)]).toEqual(['stair']);
  });

  it('markSpell lights the "dạy phép" block of the spell, and the cleanup turns it off', () => {
    serialization.workspaces.load(json([start, def]), workspace);
    const root = workspace.getBlockById('def')?.getSvgRoot();
    const clear = markSpell(workspace, 'stair');
    expect(root?.classList.contains(SPELL_ACTIVE_CLASS)).toBe(true);
    expect(root?.dataset.spellActive).toBe('true');
    clear?.();
    expect(root?.classList.contains(SPELL_ACTIVE_CLASS)).toBe(false);
    expect(markSpell(workspace, 'other')).toBeNull();
  });

  it('the next step "add a dạy phép block" points beside the program, with its own copy', () => {
    serialization.workspaces.load(json([start]), workspace);
    const step = nextStep(
      json([start, def]),
      serialization.workspaces.save(workspace) as WorkspaceJson,
      {
        procedureOrder: ['stair'],
      },
    );
    expect(step).toMatchObject({ kind: 'add', anchor: { blockId: '' } });
    expect(nextStepMessage(step)).toBe('Kéo khối này ra vùng ghép khối nhé!');
    const popover = showNextStepPopover(workspace, step);
    expect(popover.element.textContent).toContain('Kéo khối này ra vùng ghép khối nhé!');
    expect(popover.element.querySelector('.cq-step-preview .blocklyPath')).toBeTruthy();
    popover.close();
  });
});

describe('next step with two spells', () => {
  it('lights only the flyout "làm phép" of the spell to add', () => {
    workspace.dispose();
    host.remove();
    host = document.createElement('div');
    host.className = 'cq-blockly';
    document.body.append(host);
    const two = [...procedures, { id: 'around', name: 'vòng cột' }];
    workspace = inject(host, {
      renderer: 'zelos',
      toolbox: buildToolbox({ mode: 'build', toolbox: ['cq_proc_call'], procedures: two }),
    });
    setWorkspaceProcedures(workspace, two);
    serialization.workspaces.load(json([{ type: 'cq_start', id: 'start' }]), workspace);
    const step: NextStep = {
      kind: 'add',
      block: { type: 'cq_proc_call', id: 'next', fields: { PROC: 'around' } },
      anchor: { blockId: 'start', input: null },
    };
    const popover = showNextStepPopover(workspace, step);
    const lit = (workspace.getFlyout()?.getWorkspace().getTopBlocks(false) ?? [])
      .filter((block) => block.getSvgRoot().classList.contains('cq-step-flyout'))
      .map((block) => block.getFieldValue('PROC') as unknown);
    expect(lit).toEqual(['around']);
    popover.close();
  });

  it('a move to no block (a new top stack) has its own copy and no crash', () => {
    serialization.workspaces.load(json([start, def]), workspace);
    const step: NextStep = {
      kind: 'move',
      blockId: 'call',
      anchor: { blockId: '', input: null },
      withTail: false,
    };
    expect(nextStepMessage(step)).toBe('Kéo khối sáng ra chỗ trống nhé!');
    const popover = showNextStepPopover(workspace, step);
    expect(popover.element.textContent).toContain('Kéo khối sáng ra chỗ trống nhé!');
    popover.close();
  });
});
