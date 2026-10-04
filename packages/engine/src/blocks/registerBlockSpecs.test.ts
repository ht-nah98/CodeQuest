import { Blocks } from 'blockly';
import { describe, expect, it, vi } from 'vitest';
import {
  COMMON_BLOCKS,
  compileProgram,
  CQ_IF,
  CQ_IF_ELSE,
  CQ_REPEAT,
  CQ_REPEAT_UNTIL,
  CQ_START,
  registerBlockSpecs,
  type BlockSpec,
} from '../index';
import { lineBlocks, program } from '../testing/lineKind.test';

describe('registerBlockSpecs', () => {
  it('is idempotent and does not make Blockly warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    registerBlockSpecs(lineBlocks);
    registerBlockSpecs(lineBlocks);
    registerBlockSpecs([]);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
    expect(Blocks).toHaveProperty('line_step');
  });

  it('always registers the common blocks', () => {
    registerBlockSpecs([]);
    expect(COMMON_BLOCKS.map((spec) => spec.type)).toEqual([
      CQ_START,
      CQ_REPEAT,
      CQ_IF,
      CQ_IF_ELSE,
      CQ_REPEAT_UNTIL,
    ]);
    for (const spec of COMMON_BLOCKS) expect(Blocks).toHaveProperty(spec.type);
  });

  it('describes the control blocks in kid words (block-intro rule, glossary.md)', () => {
    const tooltips = Object.fromEntries(
      COMMON_BLOCKS.map((spec) => [spec.type, spec.json.tooltip]),
    );
    expect(tooltips).toEqual({
      cq_start: 'Chương trình chạy từ đây',
      cq_repeat: 'Làm các khối bên trong nhiều lần',
      cq_if: 'Hỏi mỗi lần chạy tới đây: ✔ thì làm các khối bên trong, ✘ thì bỏ qua',
      cq_if_else: 'Hỏi mỗi lần chạy tới đây: ✔ thì làm nhánh trên, ✘ thì làm nhánh dưới',
      cq_repeat_until:
        'Hỏi trước mỗi vòng: ✘ thì làm thêm một vòng, ✔ thì dừng và chạy khối bên dưới',
    });
  });

  it('replaces the generator when a new spec object reuses a type', () => {
    const v1: BlockSpec = {
      type: 'test_ping',
      category: 'move',
      apiNames: ['ping'],
      json: { message0: 'ping', previousStatement: null, nextStatement: null },
      generator: () => 'ping(1);\n',
    };
    const v2: BlockSpec = { ...v1, generator: () => 'ping(2);\n' };
    const workspace = program([{ type: 'test_ping', id: 'p' }]);
    registerBlockSpecs([v1]);
    expect(compileProgram(workspace)).toContain('ping(1);');
    registerBlockSpecs([v2]);
    expect(compileProgram(workspace)).toContain('ping(2);');
  });
});
