import { describe, expect, it } from 'vitest';
import { COMMON_BLOCKS, type BlockSpec } from '@codequest/engine';
import { BLOCK_STYLE_BY_CATEGORY } from './theme';
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
