import { Names, type Block } from 'blockly';
import { Order, type JavascriptGenerator } from 'blockly/javascript';
import { VARIABLE_MAX_LIMIT } from '@codequest/content-schema';
import type { BlockSpec } from '../sdk/blockSpec';
import { VAR_ADD_FN, VAR_CMP_FN, VAR_GET_FN, VAR_OPS, VAR_SET_FN } from '../run/variables';
import { FIELD_CQ_VAR, NO_VARIABLE } from './variableField';

/** "đặt [hộp] thành [0]" (ADR-0022 §2). */
export const CQ_VAR_SET = 'cq_var_set';
/** "tăng [hộp] thêm [1]". */
export const CQ_VAR_ADD = 'cq_var_add';
/** "[hộp] [= / < / >] [3] ?": a question (Boolean output) about a box. */
export const CQ_VAR_COMPARE = 'cq_var_compare';
/** "lặp [hộp] lần": runs its body as many times as the box held when the loop began. */
export const CQ_REPEAT_VAR = 'cq_repeat_var';

/** Biggest step of `tăng`. */
export const CQ_VAR_ADD_MAX = 9;

const varField = { type: FIELD_CQ_VAR, name: 'VAR' } as const;
const statement = { previousStatement: null, nextStatement: null } as const;
const style = 'variable_blocks';

/** The box id of a block's `VAR` field, quoted. */
function varOf(block: Block, gen: JavascriptGenerator): string {
  const value = block.getFieldValue('VAR') as unknown;
  return gen.quote_(typeof value === 'string' && value !== '' ? value : NO_VARIABLE);
}

/** The whole number of a block's `NUM` field (0 when unreadable). */
function numberOf(block: Block): string {
  return String(Math.max(0, Math.floor(Number(block.getFieldValue('NUM')) || 0)));
}

/**
 * The engine's variable blocks (ADR-0022 §2), shared by every game kind: only fields, no value
 * inputs or shadows, so no capacity guard is needed. Their sandbox functions are installed by
 * `runLevel`, not by a kind's `createApi`.
 */
export const VARIABLE_BLOCKS: readonly BlockSpec[] = [
  {
    type: CQ_VAR_SET,
    category: 'variable',
    apiNames: [VAR_SET_FN],
    json: {
      message0: 'đặt %1 thành %2',
      args0: [
        varField,
        {
          type: 'field_number',
          name: 'NUM',
          value: 0,
          min: 0,
          max: VARIABLE_MAX_LIMIT,
          precision: 1,
        },
      ],
      ...statement,
      style,
      tooltip: 'Lệnh này cho số vào hộp. Số cũ mất',
    },
    generator: (block, gen) =>
      `${VAR_SET_FN}(${varOf(block, gen)}, ${numberOf(block)}, ${gen.quote_(block.id)});\n`,
  },
  {
    type: CQ_VAR_ADD,
    category: 'variable',
    apiNames: [VAR_ADD_FN],
    json: {
      message0: 'tăng %1 thêm %2',
      args0: [
        varField,
        { type: 'field_number', name: 'NUM', value: 1, min: 1, max: CQ_VAR_ADD_MAX, precision: 1 },
      ],
      ...statement,
      style,
      tooltip: 'Lệnh này cộng thêm vào số trong hộp',
    },
    generator: (block, gen) =>
      `${VAR_ADD_FN}(${varOf(block, gen)}, ${numberOf(block)}, ${gen.quote_(block.id)});\n`,
  },
  {
    type: CQ_VAR_COMPARE,
    category: 'variable',
    apiNames: [VAR_CMP_FN],
    json: {
      message0: '%1 %2 %3 ?',
      args0: [
        varField,
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['=', 'EQ'],
            ['<', 'LT'],
            ['>', 'GT'],
          ],
        },
        {
          type: 'field_number',
          name: 'NUM',
          value: 0,
          min: 0,
          max: VARIABLE_MAX_LIMIT,
          precision: 1,
        },
      ],
      output: 'Boolean',
      style,
      tooltip: 'Câu hỏi: ✔ khi số trong hộp đúng như vậy, ✘ khi không',
    },
    generator: (block, gen) => {
      const op = String(block.getFieldValue('OP'));
      const safeOp = (VAR_OPS as readonly string[]).includes(op) ? op : 'EQ';
      return [
        `${VAR_CMP_FN}(${varOf(block, gen)}, ${gen.quote_(safeOp)}, ${numberOf(block)}, ${gen.quote_(block.id)})`,
        Order.FUNCTION_CALL,
      ];
    },
  },
  {
    type: CQ_REPEAT_VAR,
    category: 'variable',
    apiNames: [VAR_GET_FN],
    json: {
      message0: 'lặp %1 lần %2 %3',
      args0: [varField, { type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }],
      ...statement,
      style,
      tooltip: 'Làm các lệnh bên trong, số lần bằng số trong hộp lúc bắt đầu lặp',
    },
    generator: (block, gen) => {
      const branch = gen.addLoopTrap(gen.statementToCode(block, 'DO'), block);
      if (gen.nameDB_ === undefined) throw new Error('generator.init(workspace) was not called');
      // Read once, when the loop begins (like Scratch): changing the box inside keeps the count.
      const times = gen.nameDB_.getDistinctName('times', Names.NameType.VARIABLE);
      const counter = gen.nameDB_.getDistinctName('count', Names.NameType.VARIABLE);
      return (
        `var ${times} = ${VAR_GET_FN}(${varOf(block, gen)}, ${gen.quote_(block.id)});\n` +
        `for (var ${counter} = 0; ${counter} < ${times}; ${counter}++) {\n${branch}}\n`
      );
    },
  },
];
