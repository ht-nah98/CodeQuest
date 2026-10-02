import type { BlockSpec } from '@codequest/engine';
import { Order } from 'blockly/javascript';

const statement = { previousStatement: null, nextStatement: null, style: 'move_blocks' } as const;
const sensor = { output: 'Boolean', style: 'sensor_blocks' } as const;

/**
 * Maze blocks (product/game-kinds.md §3.2). Labels only, no `field_image`: the block icons
 * (`/icons/*.png`) do not exist yet and a missing image renders as a broken box.
 */
export const mazeBlocks: readonly BlockSpec[] = [
  {
    type: 'maze_forward',
    category: 'move',
    apiNames: ['forward'],
    json: { message0: 'tiến', tooltip: 'Măng tiến 1 ô theo hướng đang nhìn', ...statement },
    generator: (block, gen) => `forward(${gen.quote_(block.id)});\n`,
  },
  {
    type: 'maze_turn_left',
    category: 'move',
    apiNames: ['turn'],
    json: { message0: 'rẽ trái', tooltip: 'Măng quay sang trái tại chỗ', ...statement },
    generator: (block, gen) => `turn('LEFT', ${gen.quote_(block.id)});\n`,
  },
  {
    type: 'maze_turn_right',
    category: 'move',
    apiNames: ['turn'],
    json: { message0: 'rẽ phải', tooltip: 'Măng quay sang phải tại chỗ', ...statement },
    generator: (block, gen) => `turn('RIGHT', ${gen.quote_(block.id)});\n`,
  },
  {
    type: 'maze_is_path',
    category: 'sensor',
    apiNames: ['isPath'],
    json: {
      message0: 'có đường %1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'DIR',
          options: [
            ['phía trước', 'AHEAD'],
            ['bên trái', 'LEFT'],
            ['bên phải', 'RIGHT'],
          ],
        },
      ],
      tooltip: 'Đúng nếu Măng đi tiếp được hướng đó',
      ...sensor,
    },
    generator: (block, gen) => [
      `isPath(${gen.quote_(String(block.getFieldValue('DIR')))}, ${gen.quote_(block.id)})`,
      Order.FUNCTION_CALL,
    ],
  },
  {
    type: 'maze_at_goal',
    category: 'sensor',
    apiNames: ['atGoal'],
    json: { message0: 'đã tới đích?', tooltip: 'Đúng nếu Măng đang đứng ở đích', ...sensor },
    generator: (block, gen) => [`atGoal(${gen.quote_(block.id)})`, Order.FUNCTION_CALL],
  },
];
