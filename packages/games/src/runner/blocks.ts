import type { BlockSpec } from '@codequest/engine';

const statement = { previousStatement: null, nextStatement: null, style: 'move_blocks' } as const;

/**
 * Runner blocks implemented so far. Labels only, no `field_image`: the block icons
 * (`/icons/*.png`) do not exist yet and a missing image renders as a broken box.
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
    json: { message0: 'nhảy', tooltip: 'Măng nhảy qua 1 ô', ...statement },
    generator: (block, gen) => `jump(${gen.quote_(block.id)});\n`,
  },
];
