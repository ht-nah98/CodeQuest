import type { utils } from 'blockly';
import { LB_BLOCKS, type LbGroup } from '@codequest/games';
import { vi } from '../../i18n/vi';

// Toolbox of the Xưởng Phiên Dịch (Màn 0): every Leanbot block, grouped like Pythaverse's
// editor so a child finds a block in the same place on both sides.

/** Leanbot IDE, where the code is uploaded (content/leanbot/duong-dan.json, checked in a test). */
export const LEANBOT_IDE_URL = 'https://ide.pythaverse.space/#/code';

const GROUPS: readonly { group: LbGroup; style: string }[] = [
  { group: 'mission', style: 'event_category' },
  { group: 'motion', style: 'move_category' },
  { group: 'gripper', style: 'robot_category' },
  { group: 'led', style: 'pen_category' },
  { group: 'sensor', style: 'sensor_category' },
  { group: 'irline', style: 'sensor_category' },
  { group: 'logic', style: 'logic_category' },
  { group: 'loop', style: 'loop_category' },
  { group: 'math', style: 'variable_category' },
];

const n = (value: number) => ({ block: { type: 'lb_number', fields: { N: value } } });

/** Blocks with value inputs come with something plugged in, like Pythaverse's toolbox. */
const PRESETS: Readonly<Record<string, utils.toolbox.BlockInfo>> = {
  lb_compare: {
    kind: 'block',
    type: 'lb_compare',
    fields: { OP: 'LT' },
    inputs: { A: { block: { type: 'lb_ping' } }, B: n(25) },
  },
  lb_arith: { kind: 'block', type: 'lb_arith', inputs: { A: n(1), B: n(2) } },
};

export interface WorkshopToolbox {
  kind: 'categoryToolbox';
  contents: {
    kind: 'category';
    name: string;
    categorystyle: string;
    contents: utils.toolbox.BlockInfo[];
  }[];
}

export function workshopToolbox(): WorkshopToolbox {
  return {
    kind: 'categoryToolbox',
    contents: GROUPS.map(({ group, style }) => ({
      kind: 'category',
      name: vi.workshop.categories[group],
      categorystyle: style,
      contents: LB_BLOCKS.filter((def) => def.group === group).map(
        (def) => PRESETS[def.type] ?? { kind: 'block', type: def.type },
      ),
    })),
  };
}
