import type { BlockSpec } from '@codequest/engine';
import { Order } from 'blockly/javascript';
import { ROBOT_FORWARD_MAX, ROBOT_FORWARD_MIN } from './config';

const statement = { previousStatement: null, nextStatement: null, style: 'move_blocks' } as const;
const sensor = { output: 'Boolean', style: 'sensor_blocks' } as const;

/**
 * Robot lab blocks (product/game-kinds.md §3.3): labels and tooltips word for word. Each
 * generator calls exactly one API, the block id last.
 */
export const robotlabBlocks: readonly BlockSpec[] = [
  {
    type: 'robot_forward',
    category: 'move',
    apiNames: ['forward'],
    json: {
      message0: 'tiến %1 ô',
      args0: [
        {
          type: 'field_number',
          name: 'N',
          value: 1,
          min: ROBOT_FORWARD_MIN,
          max: ROBOT_FORWARD_MAX,
          precision: 1,
        },
      ],
      tooltip: 'Tiến 3 ô: dừng ở ngã tư thứ 3',
      ...statement,
    },
    generator: (block, gen) =>
      `forward(${String(Number(block.getFieldValue('N')))}, ${gen.quote_(block.id)});\n`,
  },
  {
    type: 'robot_turn_left',
    category: 'move',
    apiNames: ['turn'],
    json: { message0: 'rẽ trái', tooltip: 'Quay sang trái tại chỗ, chưa đi', ...statement },
    generator: (block, gen) => `turn('LEFT', ${gen.quote_(block.id)});\n`,
  },
  {
    type: 'robot_turn_right',
    category: 'move',
    apiNames: ['turn'],
    json: { message0: 'rẽ phải', tooltip: 'Quay sang phải tại chỗ, chưa đi', ...statement },
    generator: (block, gen) => `turn('RIGHT', ${gen.quote_(block.id)});\n`,
  },
  {
    type: 'robot_grab',
    category: 'move',
    apiNames: ['grab'],
    json: { message0: 'gắp', tooltip: 'Gắp khối ở chỗ Bíp đứng', ...statement },
    generator: (block, gen) => `grab(${gen.quote_(block.id)});\n`,
  },
  {
    type: 'robot_release',
    category: 'move',
    apiNames: ['release'],
    json: { message0: 'thả', tooltip: 'Thả khối xuống chỗ Bíp đứng', ...statement },
    generator: (block, gen) => `release(${gen.quote_(block.id)});\n`,
  },
  {
    type: 'robot_line_ahead',
    category: 'sensor',
    apiNames: ['lineAhead'],
    json: {
      message0: 'phía trước có line?',
      tooltip: '✔ khi phía trước Bíp có line, ✘ khi không',
      ...sensor,
    },
    generator: (block, gen) => [`lineAhead(${gen.quote_(block.id)})`, Order.FUNCTION_CALL],
  },
  {
    type: 'robot_block_color',
    category: 'sensor',
    apiNames: ['blockColor'],
    json: {
      message0: 'khối ở chỗ Bíp màu %1?',
      args0: [
        {
          type: 'field_dropdown',
          name: 'COLOR',
          options: [
            ['đỏ', 'RED'],
            ['vàng', 'YELLOW'],
            ['xanh lá', 'GREEN'],
          ],
        },
      ],
      tooltip: '✔ khi khối ở chỗ Bíp có màu con chọn, ✘ khi không',
      ...sensor,
    },
    generator: (block, gen) => [
      `blockColor(${gen.quote_(String(block.getFieldValue('COLOR')))}, ${gen.quote_(block.id)})`,
      Order.FUNCTION_CALL,
    ],
  },
  {
    type: 'robot_at_lab',
    category: 'sensor',
    apiNames: ['atLab'],
    json: {
      message0: 'đã về phòng thí nghiệm?',
      tooltip: '✔ khi Bíp đứng ở phòng thí nghiệm, ✘ khi chưa',
      ...sensor,
    },
    generator: (block, gen) => [`atLab(${gen.quote_(block.id)})`, Order.FUNCTION_CALL],
  },
  {
    type: 'robot_holding',
    category: 'sensor',
    apiNames: ['holding'],
    json: {
      message0: 'đang gắp khối?',
      tooltip: '✔ khi tay gắp đang giữ khối, ✘ khi tay trống',
      ...sensor,
    },
    generator: (block, gen) => [`holding(${gen.quote_(block.id)})`, Order.FUNCTION_CALL],
  },
];
