import type { BlockSpec } from '@codequest/engine';
import { Order } from 'blockly/javascript';
import { SORTER_MAX_NUMBER, SORTER_MIN_NUMBER } from './config';

const statement = { previousStatement: null, nextStatement: null, style: 'sorter_blocks' } as const;
const question = { output: 'Boolean', style: 'sorter_blocks' } as const;

/**
 * Shelf blocks (curriculum.md §6.5, ADR-0025 §3), group "KỆ SÁCH": labels and tooltips word for
 * word; each tooltip starts with the block label and names no character. Only fields, no inputs
 * (no capacity guard needed). Each generator calls exactly one API, the block id last.
 */
export const sorterBlocks: readonly BlockSpec[] = [
  {
    type: 'sorter_right',
    category: 'sorter',
    apiNames: ['right'],
    json: { message0: 'sang phải', tooltip: 'Sang phải: tay sang sách kế bên phải', ...statement },
    generator: (block, gen) => `right(${gen.quote_(block.id)});\n`,
  },
  {
    type: 'sorter_to_start',
    category: 'sorter',
    apiNames: ['toStart'],
    json: { message0: 'về đầu kệ', tooltip: 'Về đầu kệ: tay về sách thứ nhất', ...statement },
    generator: (block, gen) => `toStart(${gen.quote_(block.id)});\n`,
  },
  {
    type: 'sorter_swap',
    category: 'sorter',
    apiNames: ['swap'],
    json: {
      message0: 'đổi chỗ',
      tooltip: 'Đổi chỗ: sách này đổi với sách bên phải',
      ...statement,
    },
    generator: (block, gen) => `swap(${gen.quote_(block.id)});\n`,
  },
  {
    type: 'sorter_book_is',
    category: 'sorter',
    apiNames: ['bookIs'],
    json: {
      message0: 'sách này %1 %2?',
      args0: [
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['=', 'EQ'],
            ['>', 'GT'],
            ['<', 'LT'],
          ],
        },
        {
          type: 'field_number',
          name: 'NUM',
          value: 7,
          min: SORTER_MIN_NUMBER,
          max: SORTER_MAX_NUMBER,
          precision: 1,
        },
      ],
      tooltip: 'Sách này = 7? Đúng thì ✔, sai thì ✘',
      ...question,
    },
    generator: (block, gen) => [
      `bookIs(${gen.quote_(String(block.getFieldValue('OP')))}, ${String(Number(block.getFieldValue('NUM')))}, ${gen.quote_(block.id)})`,
      Order.FUNCTION_CALL,
    ],
  },
  {
    type: 'sorter_bigger',
    category: 'sorter',
    apiNames: ['bigger'],
    json: {
      message0: 'sách này lớn hơn bên phải?',
      tooltip: 'Sách này lớn hơn bên phải? Lớn hơn thì ✔',
      ...question,
    },
    generator: (block, gen) => [`bigger(${gen.quote_(block.id)})`, Order.FUNCTION_CALL],
  },
  {
    type: 'sorter_at_end',
    category: 'sorter',
    apiNames: ['atEnd'],
    json: { message0: 'hết kệ?', tooltip: 'Hết kệ? Tay ở cờ cuối kệ thì ✔', ...question },
    generator: (block, gen) => [`atEnd(${gen.quote_(block.id)})`, Order.FUNCTION_CALL],
  },
];
