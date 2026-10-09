import { Names, type Block } from 'blockly';
import { Order, type JavascriptGenerator } from 'blockly/javascript';
import type { BlockSpec } from '../sdk/blockSpec';
import { CQ_REPEAT_VAR } from './variables';

/** Hat block every program hangs from ("khi bắt đầu"); generates no code itself. */
export const CQ_START = 'cq_start';
/** Loop block with the count as a field, so it costs one block of capacity (ADR-0004). */
export const CQ_REPEAT = 'cq_repeat';

/** "nếu … thì": one branch, run when the condition holds (P2-11, curriculum.md §5.4 T1). */
export const CQ_IF = 'cq_if';
/** "nếu … thì … nếu không thì": exactly one of two branches runs (P2-11, T1). */
export const CQ_IF_ELSE = 'cq_if_else';
/** "lặp đến khi": asks before every pass, stops once the condition holds (P2-11, T2). */
export const CQ_REPEAT_UNTIL = 'cq_repeat_until';

/** Value input of `cq_if`, `cq_if_else` and `cq_repeat_until` where a sensor block plugs in. */
export const COND_INPUT = 'COND';
/** Blocks with a `COND` input; running one with nothing plugged in is `EMPTY_CONDITION`. */
export const CONDITION_BLOCK_TYPES: readonly string[] = [CQ_IF, CQ_IF_ELSE, CQ_REPEAT_UNTIL];

/** Upper bound of the `cq_repeat` count field. */
export const CQ_REPEAT_MAX_TIMES = 20;

/**
 * Code of the sensor plugged into `COND`. Never empty at run time: `runLevel` refuses a program
 * with an empty condition (`EMPTY_CONDITION`) before compiling, so `false` only keeps the code
 * valid for other callers of the generator.
 */
function condition(block: Block, gen: JavascriptGenerator, order: Order): string {
  return gen.valueToCode(block, COND_INPUT, order) || 'false';
}

const statement = { previousStatement: null, nextStatement: null } as const;

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
  {
    type: CQ_IF,
    category: 'logic',
    apiNames: [],
    json: {
      message0: 'nếu %1 thì',
      args0: [{ type: 'input_value', name: COND_INPUT, check: 'Boolean' }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      ...statement,
      style: 'logic_blocks',
      tooltip: 'Hỏi mỗi lần chạy tới đây: ✔ thì làm các khối bên trong, ✘ thì bỏ qua',
    },
    generator: (block, gen) =>
      `if (${condition(block, gen, Order.NONE)}) {\n${gen.statementToCode(block, 'DO')}}\n`,
  },
  {
    type: CQ_IF_ELSE,
    category: 'logic',
    apiNames: [],
    json: {
      message0: 'nếu %1 thì',
      args0: [{ type: 'input_value', name: COND_INPUT, check: 'Boolean' }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      message2: 'nếu không thì',
      message3: '%1',
      args3: [{ type: 'input_statement', name: 'ELSE' }],
      ...statement,
      style: 'logic_blocks',
      tooltip: 'Hỏi mỗi lần chạy tới đây: ✔ thì làm nhánh trên, ✘ thì làm nhánh dưới',
    },
    generator: (block, gen) =>
      `if (${condition(block, gen, Order.NONE)}) {\n${gen.statementToCode(block, 'DO')}} else {\n${gen.statementToCode(block, 'ELSE')}}\n`,
  },
  {
    type: CQ_REPEAT_UNTIL,
    category: 'loop',
    apiNames: [],
    json: {
      message0: 'lặp đến khi %1',
      args0: [{ type: 'input_value', name: COND_INPUT, check: 'Boolean' }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      ...statement,
      style: 'loop_blocks',
      tooltip: 'Hỏi trước mỗi vòng: ✘ thì làm thêm một vòng, ✔ thì dừng và chạy khối bên dưới',
    },
    generator: (block, gen) => {
      const branch = gen.addLoopTrap(gen.statementToCode(block, 'DO'), block);
      return `while (!${condition(block, gen, Order.LOGICAL_NOT)}) {\n${branch}}\n`;
    },
  },
];

/** Loop blocks for `maxLoopDepth` (T16b): ours (`cq_repeat_var`, ADR-0022), plus Blockly's. */
export const LOOP_BLOCK_TYPES: readonly string[] = [
  CQ_REPEAT,
  CQ_REPEAT_UNTIL,
  CQ_REPEAT_VAR,
  'controls_repeat',
  'controls_repeat_ext',
  'controls_whileUntil',
  'controls_for',
  'controls_forEach',
];
