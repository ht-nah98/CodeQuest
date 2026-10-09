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
    json: { message0: 'tiến', tooltip: 'Tiến 1 ô theo hướng Măng đang nhìn', ...statement },
    generator: (block, gen) => `forward(${gen.quote_(block.id)});\n`,
  },
  {
    type: 'maze_turn_left',
    category: 'move',
    apiNames: ['turn'],
    json: { message0: 'rẽ trái', tooltip: 'Quay sang trái tại chỗ, chưa đi', ...statement },
    generator: (block, gen) => `turn('LEFT', ${gen.quote_(block.id)});\n`,
  },
  {
    type: 'maze_turn_right',
    category: 'move',
    apiNames: ['turn'],
    json: { message0: 'rẽ phải', tooltip: 'Quay sang phải tại chỗ, chưa đi', ...statement },
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
      tooltip: '✔ khi phía đó của Măng có đường đi, ✘ khi là tường',
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
    json: {
      message0: 'đã tới đích?',
      tooltip: '✔ khi Măng đã đứng ở đích, ✘ khi chưa tới. Tới đích là thắng ngay',
      ...sensor,
    },
    generator: (block, gen) => [`atGoal(${gen.quote_(block.id)})`, Order.FUNCTION_CALL],
  },
  {
    // W7 counting (ADR-0022): asks about the cell Măng would step onto next.
    type: 'maze_bamboo_ahead',
    category: 'sensor',
    apiNames: ['bambooAhead'],
    json: {
      message0: 'phía trước có măng?',
      tooltip: '✔ khi ô ngay trước Măng có măng chưa nhặt, ✘ khi không có',
      ...sensor,
    },
    generator: (block, gen) => [`bambooAhead(${gen.quote_(block.id)})`, Order.FUNCTION_CALL],
  },
];
