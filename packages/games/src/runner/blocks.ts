import type { BlockSpec } from '@codequest/engine';
import { Order } from 'blockly/javascript';
import { RUNNER_AHEAD_KINDS, type RunnerAheadKind } from './config';

const statement = { previousStatement: null, nextStatement: null, style: 'move_blocks' } as const;

/** Dropdown labels of `runner_is_ahead`, in RUNNER_AHEAD_KINDS order (product/game-kinds.md §3.1). */
const AHEAD_LABELS: Readonly<Record<RunnerAheadKind, string>> = {
  HOLE: 'hố',
  BRANCH: 'cành',
  CRATE: 'thùng',
  CLEAR: 'ô trống',
};

/**
 * Runner blocks. Labels only, no `field_image`: the block icons (`/icons/*.png`) do not exist
 * yet and a missing image renders as a broken box.
 */
export const runnerBlocks: readonly BlockSpec[] = [
  {
    type: 'runner_walk',
    category: 'move',
    apiNames: ['walk'],
    json: { message0: 'đi', tooltip: 'Măng đi sang ô kế bên', ...statement },
    generator: (block, gen) => `walk(${gen.quote_(block.id)});\n`,
  },
  {
    type: 'runner_jump',
    category: 'move',
    apiNames: ['jump'],
    json: { message0: 'nhảy', tooltip: 'Măng nhảy qua ô trước mặt, đáp ô sau đó', ...statement },
    generator: (block, gen) => `jump(${gen.quote_(block.id)});\n`,
  },
  {
    type: 'runner_crouch',
    category: 'move',
    apiNames: ['crouch'],
    json: {
      message0: 'cúi',
      tooltip: 'Măng cúi người chui qua cành thấp, sang ô kế bên',
      ...statement,
    },
    generator: (block, gen) => `crouch(${gen.quote_(block.id)});\n`,
  },
  {
    type: 'runner_kick',
    category: 'move',
    apiNames: ['kick'],
    json: { message0: 'đá', tooltip: 'Măng đá đổ thùng phía trước, đứng yên', ...statement },
    generator: (block, gen) => `kick(${gen.quote_(block.id)});\n`,
  },
  {
    type: 'runner_is_ahead',
    category: 'sensor',
    apiNames: ['isAhead'],
    json: {
      message0: 'phía trước có %1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'KIND',
          options: RUNNER_AHEAD_KINDS.map((kind) => [AHEAD_LABELS[kind], kind]),
        },
      ],
      output: 'Boolean',
      style: 'sensor_blocks',
      tooltip: 'Đúng khi ô phía trước là thứ con chọn',
    },
    generator: (block, gen) => [
      `isAhead(${gen.quote_(String(block.getFieldValue('KIND')))}, ${gen.quote_(block.id)})`,
      Order.FUNCTION_CALL,
    ],
  },
];
