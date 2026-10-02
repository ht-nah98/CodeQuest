import { Names } from 'blockly';
import type { BlockSpec } from '../sdk/blockSpec';

/** Hat block every program hangs from ("khi bắt đầu"); generates no code itself. */
export const CQ_START = 'cq_start';
/** Loop block with the count as a field, so it costs one block of capacity (ADR-0004). */
export const CQ_REPEAT = 'cq_repeat';

/** Upper bound of the `cq_repeat` count field. */
export const CQ_REPEAT_MAX_TIMES = 20;

/** Blocks owned by the engine because compiling needs them. */
export const COMMON_BLOCKS: readonly BlockSpec[] = [
  {
    type: CQ_START,
    category: 'event',
    apiNames: [],
    json: {
      message0: 'khi bắt đầu',
      nextStatement: null,
      style: 'event_blocks',
      tooltip: 'Chương trình chạy từ đây',
    },
    generator: () => '',
  },
  {
    type: CQ_REPEAT,
    category: 'loop',
    apiNames: [],
    json: {
      message0: 'lặp %1 lần %2 %3',
      args0: [
        {
          type: 'field_number',
          name: 'TIMES',
          value: 3,
          min: 1,
          max: CQ_REPEAT_MAX_TIMES,
          precision: 1,
        },
        { type: 'input_dummy' },
        { type: 'input_statement', name: 'DO' },
      ],
      previousStatement: null,
      nextStatement: null,
      style: 'loop_blocks',
      tooltip: 'Làm các khối bên trong nhiều lần',
    },
    generator: (block, gen) => {
      const times = Math.max(0, Math.floor(Number(block.getFieldValue('TIMES')) || 0));
      const branch = gen.addLoopTrap(gen.statementToCode(block, 'DO'), block);
      if (gen.nameDB_ === undefined) throw new Error('generator.init(workspace) was not called');
      const counter = gen.nameDB_.getDistinctName('count', Names.NameType.VARIABLE);
      return `for (var ${counter} = 0; ${counter} < ${String(times)}; ${counter}++) {\n${branch}}\n`;
    },
  },
];
