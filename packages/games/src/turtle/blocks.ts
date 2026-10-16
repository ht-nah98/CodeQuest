import type { BlockSpec } from '@codequest/engine';
import { TURTLE_ANGLES, TURTLE_FORWARD_MAX, TURTLE_FORWARD_MIN } from './config';

const move = { previousStatement: null, nextStatement: null, style: 'move_blocks' } as const;
const pen = { previousStatement: null, nextStatement: null, style: 'pen_blocks' } as const;

/** The static `DEG` dropdown: every angle, each level pins the ones it uses (ADR-0024 §1). */
const degField = {
  type: 'field_dropdown',
  name: 'DEG',
  options: TURTLE_ANGLES.map((angle) => [String(angle), String(angle)]),
} as const;

/**
 * Turtle blocks (curriculum.md §6.4, ADR-0024 §6): labels and tooltips word for word; each
 * tooltip starts with the block label so the "Khối mới! " hint can quote it (rule 7). Each
 * generator calls exactly one API, the block id last.
 */
export const turtleBlocks: readonly BlockSpec[] = [
  {
    type: 'turtle_forward',
    category: 'move',
    apiNames: ['forward'],
    json: {
      message0: 'tiến %1 bước',
      args0: [
        {
          type: 'field_number',
          name: 'N',
          value: 3,
          min: TURTLE_FORWARD_MIN,
          max: TURTLE_FORWARD_MAX,
          precision: 1,
        },
      ],
      tooltip: 'Tiến 3 bước: bút hạ thì có nét dài 3',
      ...move,
    },
    generator: (block, gen) =>
      `forward(${String(Number(block.getFieldValue('N')))}, ${gen.quote_(block.id)});\n`,
  },
  {
    type: 'turtle_turn_right',
    category: 'move',
    apiNames: ['turn'],
    json: {
      message0: 'rẽ phải %1 độ',
      args0: [degField],
      tooltip: 'Rẽ phải 90 độ: quay tại chỗ, chưa đi',
      ...move,
    },
    generator: (block, gen) =>
      `turn('RIGHT', ${String(Number(block.getFieldValue('DEG')))}, ${gen.quote_(block.id)});\n`,
  },
  {
    type: 'turtle_turn_left',
    category: 'move',
    apiNames: ['turn'],
    json: {
      message0: 'rẽ trái %1 độ',
      args0: [degField],
      tooltip: 'Rẽ trái 90 độ: quay tại chỗ, chưa đi',
      ...move,
    },
    generator: (block, gen) =>
      `turn('LEFT', ${String(Number(block.getFieldValue('DEG')))}, ${gen.quote_(block.id)});\n`,
  },
  {
    type: 'turtle_pen_up',
    category: 'pen',
    apiNames: ['pen'],
    json: { message0: 'nhấc bút', tooltip: 'Nhấc bút: đi tiếp thì không có nét', ...pen },
    generator: (block, gen) => `pen(false, ${gen.quote_(block.id)});\n`,
  },
  {
    type: 'turtle_pen_down',
    category: 'pen',
    apiNames: ['pen'],
    json: { message0: 'hạ bút', tooltip: 'Hạ bút: đi tiếp thì có nét', ...pen },
    generator: (block, gen) => `pen(true, ${gen.quote_(block.id)});\n`,
  },
];
