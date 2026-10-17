import { describe, expect, it } from 'vitest';
import { COMMON_BLOCKS, type BlockSpec } from '@codequest/engine';
import { BLOCK_COLOR_BY_CATEGORY, BLOCK_STYLE_BY_CATEGORY, codequestTheme } from './theme';
import { buildToolbox, FLYOUT_LABEL_CLASS, knownBlockSpecs } from './toolbox';

const move = (type: string): BlockSpec => ({
  type,
  category: 'move',
  apiNames: [],
  json: { message0: type, previousStatement: null, nextStatement: null },
  generator: () => '',
});
const SPECS = [...COMMON_BLOCKS, move('t_walk'), move('t_jump')];

const label = (text: string) => ({
  kind: 'label',
  text,
  id: undefined,
  'web-class': FLYOUT_LABEL_CLASS,
});

describe('buildToolbox', () => {
  it('groups blocks by category in first-seen order, with a label per group', () => {
    const toolbox = buildToolbox(
      {
        mode: 'build',
        toolbox: ['t_walk', { type: 'cq_repeat', fields: { TIMES: 3 } }, 't_jump', 'controls_if'],
      },
      SPECS,
    );
    expect(toolbox).toEqual({
      kind: 'flyoutToolbox',
      contents: [
        label('DI CHUYỂN'),
        { kind: 'block', type: 't_walk' },
        { kind: 'block', type: 't_jump' },
        label('LẶP'),
        { kind: 'block', type: 'cq_repeat', fields: { TIMES: 3 } },
        label('ĐIỀU KIỆN'),
        { kind: 'block', type: 'controls_if' },
      ],
    });
  });

  it('leaves blocks of unknown category without a label', () => {
    const toolbox = buildToolbox({ mode: 'build', toolbox: ['mystery', 't_walk'] }, SPECS);
    expect(toolbox.contents).toEqual([
      { kind: 'block', type: 'mystery' },
      label('DI CHUYỂN'),
      { kind: 'block', type: 't_walk' },
    ]);
  });

  it('puts the box blocks (ADR-0022) in their own "HỘP" group, pinned fields kept', () => {
    const toolbox = buildToolbox({
      mode: 'build',
      toolbox: [
        'maze_forward',
        { type: 'cq_var_add', fields: { VAR: 'bamboo', NUM: 1 } },
        { type: 'cq_repeat_var', fields: { VAR: 'bamboo' } },
      ],
    });
    expect(toolbox.contents).toEqual([
      label('DI CHUYỂN'),
      { kind: 'block', type: 'maze_forward' },
      label('HỘP'),
      { kind: 'block', type: 'cq_var_add', fields: { VAR: 'bamboo', NUM: 1 } },
      { kind: 'block', type: 'cq_repeat_var', fields: { VAR: 'bamboo' } },
    ]);
    expect(knownBlockSpecs().map((spec) => spec.type)).toEqual(
      expect.arrayContaining(['cq_var_set', 'cq_var_add', 'cq_var_compare', 'cq_repeat_var']),
    );
    expect(BLOCK_STYLE_BY_CATEGORY.variable).toBe('variable_blocks');
  });

  it('gives parsons levels an empty flyout, never no toolbox', () => {
    expect(buildToolbox({ mode: 'parsons', toolbox: ['t_walk'] }, SPECS)).toEqual({
      kind: 'flyoutToolbox',
      contents: [],
    });
  });
});

describe('buildToolbox: spells (ADR-0023 §6)', () => {
  const procedures = [
    { id: 'stair', name: 'bậc thang' },
    { id: 'around', name: 'vòng cột' },
  ];
  const level = {
    mode: 'build' as const,
    toolbox: ['maze_forward', 'cq_proc_def', 'cq_proc_call'],
    procedures,
  };

  it('gives one "dạy phép" and one "làm phép" per spell, in a "PHÉP THUẬT" group', () => {
    expect(buildToolbox(level).contents).toEqual([
      label('DI CHUYỂN'),
      { kind: 'block', type: 'maze_forward' },
      label('PHÉP THUẬT'),
      { kind: 'block', type: 'cq_proc_def', fields: { PROC: 'stair' } },
      { kind: 'block', type: 'cq_proc_def', fields: { PROC: 'around' } },
      { kind: 'block', type: 'cq_proc_call', fields: { PROC: 'stair' } },
      { kind: 'block', type: 'cq_proc_call', fields: { PROC: 'around' } },
    ]);
  });

  it('hides the "dạy phép" of a spell already taught on the workspace, never its "làm phép"', () => {
    const types = buildToolbox(level, undefined, new Set(['stair'])).contents.map((item) =>
      'type' in item
        ? `${item.type}:${String((item.fields as { PROC?: string } | undefined)?.PROC)}`
        : 'label',
    );
    expect(types).toEqual([
      'label',
      'maze_forward:undefined',
      'label',
      'cq_proc_def:around',
      'cq_proc_call:stair',
      'cq_proc_call:around',
    ]);
  });

  it('spell blocks with a box ("với hộp") come only for spells with a param, and back', () => {
    const contents = buildToolbox({
      mode: 'build',
      toolbox: ['cq_proc_def', 'cq_proc_def_n', 'cq_proc_call', 'cq_proc_call_n'],
      procedures: [
        { id: 'stair', name: 'bậc thang' },
        { id: 'climb', name: 'leo bậc', param: { id: 'cells', name: 'số ô' } },
      ],
    }).contents;
    expect(contents.slice(1)).toEqual([
      { kind: 'block', type: 'cq_proc_def', fields: { PROC: 'stair' } },
      { kind: 'block', type: 'cq_proc_def_n', fields: { PROC: 'climb' } },
      { kind: 'block', type: 'cq_proc_call', fields: { PROC: 'stair' } },
      { kind: 'block', type: 'cq_proc_call_n', fields: { PROC: 'climb' } },
    ]);
  });

  it('keeps a pinned spell entry as it is', () => {
    const pinned = { type: 'cq_proc_call', fields: { PROC: 'around' } };
    expect(buildToolbox({ ...level, toolbox: [pinned] }).contents).toEqual([
      label('PHÉP THUẬT'),
      { kind: 'block', ...pinned },
    ]);
  });

  it('draws "dạy phép" as a hat block, with its own style', () => {
    expect(knownBlockSpecs().map((spec) => spec.type)).toEqual(
      expect.arrayContaining(['cq_proc_def', 'cq_proc_call']),
    );
    expect(BLOCK_STYLE_BY_CATEGORY.function).toBe('procedure_blocks');
    expect(codequestTheme.blockStyles['procedure_blocks']?.hat).toBe('cap');
  });
});

describe('buildToolbox: bookshelf (ADR-0025)', () => {
  it('puts category "sorter" blocks in a "KỆ SÁCH" group with their own style', () => {
    const shelf: BlockSpec = { ...move('s_right'), category: 'sorter' };
    expect(buildToolbox({ mode: 'build', toolbox: ['s_right'] }, [shelf]).contents).toEqual([
      label('KỆ SÁCH'),
      { kind: 'block', type: 's_right' },
    ]);
    expect(BLOCK_STYLE_BY_CATEGORY.sorter).toBe('sorter_blocks');
    expect(codequestTheme.blockStyles['sorter_blocks']?.colourPrimary).toBe('#b5432c');
    // Its own colour: no other category shares it.
    const colours = Object.values(BLOCK_COLOR_BY_CATEGORY);
    expect(colours.filter((colour) => colour === BLOCK_COLOR_BY_CATEGORY.sorter)).toHaveLength(1);
  });
});

describe('knownBlockSpecs', () => {
  it('gives every block the blockStyle of its category, so colour and toolbox group agree', () => {
    const specs = knownBlockSpecs();
    expect(specs.length).toBeGreaterThan(0);
    for (const spec of specs) {
      expect({ type: spec.type, style: spec.json.style }).toEqual({
        type: spec.type,
        style: BLOCK_STYLE_BY_CATEGORY[spec.category],
      });
    }
  });
});
