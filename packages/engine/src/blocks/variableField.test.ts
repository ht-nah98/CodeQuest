// field_cq_var safeguards (ADR-0022 §2): every path that loads a program without its level must
// neither throw nor lose or mislabel the box id.
import { Events, Options, Workspace, serialization, type Block } from 'blockly';
import { LessonCardSchema, type LevelVariable } from '@codequest/content-schema';
import { describe, expect, it } from 'vitest';
import {
  analyzeWorkspace,
  FieldCqVar,
  NO_VARIABLE,
  registerBlockSpecs,
  setWorkspaceVariables,
  withHeadlessWorkspace,
  workspaceVariablesOf,
} from '../index';
import { program } from '../testing/lineKind.test';

const BOXES: LevelVariable[] = [
  { id: 'bamboo', name: 'số măng' },
  { id: 'fish', name: 'số cá' },
];

function freshWorkspace(): Workspace {
  registerBlockSpecs([]);
  return new Workspace(new Options({}));
}

function load(ws: Workspace, json: object): void {
  Events.disable();
  try {
    serialization.workspaces.load(json, ws, { recordUndo: false });
  } finally {
    Events.enable();
  }
}

const add = (id: string, box: string): object => ({
  type: 'cq_var_add',
  id,
  fields: { VAR: box, NUM: 1 },
});

function varText(block: Block | null): string | undefined {
  return block?.getField('VAR')?.getText();
}

describe('field_cq_var', () => {
  it('a field with no block and no workspace has one placeholder option and never throws', () => {
    const field = new FieldCqVar();
    expect(field.getValue()).toBe(NO_VARIABLE);
    expect(field.getOptions(false)).toEqual([['hộp', NO_VARIABLE]]);
    expect(field.getText()).toBe('hộp');
    const named = FieldCqVar.fromJson({ value: 'fish' } as never);
    expect(named.getValue()).toBe('fish');
    expect(named.getOptions(false)).toEqual([['fish', 'fish']]);
  });

  it('creates a block on a workspace without boxes (placeholder, no throw)', () => {
    const ws = freshWorkspace();
    const block = ws.newBlock('cq_var_set');
    expect(block.getFieldValue('VAR')).toBe(NO_VARIABLE);
    expect(varText(block)).toBe('hộp');
    ws.dispose();
  });

  it('loads a VAR that is not declared and reads the same id back', () => {
    const ws = freshWorkspace();
    setWorkspaceVariables(ws, BOXES);
    load(ws, program([add('a', 'apple')]));
    const block = ws.getBlockById('a');
    expect(block?.getFieldValue('VAR')).toBe('apple');
    // Not in the menu: the label is the id itself.
    expect(varText(block)).toBe('apple');
    ws.dispose();
  });

  it('rejects values that are not box ids, keeping the old one', () => {
    const field = new FieldCqVar('bamboo');
    field.setValue('Not An Id');
    expect(field.getValue()).toBe('bamboo');
  });

  it('analyzeWorkspace without a level counts the blocks and keeps fields.VAR', () => {
    const json = program([add('a', 'bamboo'), add('b', 'fish')]);
    expect(analyzeWorkspace(json).blockTypesUsed).toEqual({ cq_var_add: 2 });
    const saved = withHeadlessWorkspace(json, (ws): unknown =>
      ws.getBlockById('b')?.getFieldValue('VAR'),
    );
    expect(saved).toBe('fish');
  });

  it('getText follows the latest declaration of the workspace', () => {
    const ws = freshWorkspace();
    setWorkspaceVariables(ws, BOXES);
    load(ws, program([add('a', 'bamboo')]));
    const block = ws.getBlockById('a');
    expect(varText(block)).toBe('số măng');
    setWorkspaceVariables(ws, [{ id: 'bamboo', name: 'măng nhặt' }]);
    expect(varText(block)).toBe('măng nhặt');
    const field = block?.getField('VAR');
    expect(field instanceof FieldCqVar && field.getOptions(false)).toEqual([
      ['măng nhặt', 'bamboo'],
    ]);
    setWorkspaceVariables(ws, undefined);
    expect(varText(block)).toBe('bamboo');
    ws.dispose();
  });

  it('keeps the selected option (label and ARIA text) in step with the boxes', () => {
    const selected = (field: unknown): unknown =>
      (field as { selectedOption: unknown }).selectedOption;
    const ws = freshWorkspace();
    setWorkspaceVariables(ws, BOXES);
    load(ws, program([add('a', 'bamboo')]));
    const field = ws.getBlockById('a')?.getField('VAR');
    expect(selected(field)).toEqual(['số măng', 'bamboo']);
    // A value missing from the menu: FieldDropdown would keep the old option.
    field?.setValue('apple');
    expect(selected(field)).toEqual(['apple', 'apple']);
    // Renamed boxes, then a new value: the latest name is selected.
    setWorkspaceVariables(ws, [{ id: 'fish', name: 'cá nhặt' }]);
    field?.setValue('fish');
    expect(selected(field)).toEqual(['cá nhặt', 'fish']);
    ws.dispose();
  });

  it('a block in a flyout reads the boxes of the flyout target workspace', () => {
    const main = freshWorkspace();
    setWorkspaceVariables(main, BOXES);
    const flyout = new Workspace(new Options({}));
    flyout.internalIsFlyout = true;
    Object.assign(flyout, { targetWorkspace: main });
    expect(workspaceVariablesOf(flyout)).toBe(BOXES);
    load(flyout, { blocks: { languageVersion: 0, blocks: [add('f', 'fish')] } });
    expect(varText(flyout.getBlockById('f'))).toBe('số cá');
    flyout.dispose();
    main.dispose();
  });

  it('a save/load round trip keeps the box id', () => {
    const ws = freshWorkspace();
    setWorkspaceVariables(ws, BOXES);
    load(ws, program([add('a', 'fish')]));
    const saved = serialization.workspaces.save(ws);
    ws.dispose();
    const again = freshWorkspace();
    load(again, saved);
    expect(again.getBlockById('a')?.getFieldValue('VAR')).toBe('fish');
    again.dispose();
  });

  it('a lesson demo card with variables shows the box name', () => {
    const card = LessonCardSchema.parse({
      type: 'demo',
      text: 'Xem hộp đếm',
      kind: 'maze',
      config: {},
      workspace: program([add('add1', 'bamboo')]),
      variables: [{ id: 'bamboo', name: 'số măng', start: [2] }],
    });
    if (card.type !== 'demo') throw new Error('not a demo card');
    const text = withHeadlessWorkspace(
      card.workspace,
      (ws) => varText(ws.getBlockById('add1')),
      card.variables,
    );
    expect(text).toBe('số măng');
  });
});
