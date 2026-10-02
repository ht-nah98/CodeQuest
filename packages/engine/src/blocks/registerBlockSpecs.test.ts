import { Blocks } from 'blockly';
import { describe, expect, it, vi } from 'vitest';
import {
  COMMON_BLOCKS,
  compileProgram,
  CQ_REPEAT,
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

  it('always registers cq_start and cq_repeat', () => {
    registerBlockSpecs([]);
    expect(COMMON_BLOCKS.map((spec) => spec.type)).toEqual([CQ_START, CQ_REPEAT]);
    expect(Blocks).toHaveProperty(CQ_START);
    expect(Blocks).toHaveProperty(CQ_REPEAT);
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
