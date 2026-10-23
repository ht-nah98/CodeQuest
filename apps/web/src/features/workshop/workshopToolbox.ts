import { registerFieldColour } from '@blockly/field-colour';
import { LB_TOOLBOX, type LbCategory, registerLeanbotBlocks, toolboxXml } from '@codequest/games';
import { vi } from '../../i18n/vi';

// Toolbox of the Xưởng Phiên Dịch (Màn 0): Pythaverse's Leanbot toolbox, category for category
// (LB_TOOLBOX), so a child finds a block in the same place in both editors.

/** Leanbot IDE, where the code is uploaded (content/leanbot/duong-dan.json, checked in a test). */
export const LEANBOT_IDE_URL = 'https://ide.pythaverse.space/#/code';

export interface WorkshopCategory {
  kind: 'category';
  name: string;
  colour: string;
  custom?: string;
  contents: (WorkshopCategory | { kind: 'block'; blockxml: string })[];
}

export interface WorkshopToolbox {
  kind: 'categoryToolbox';
  contents: WorkshopCategory[];
}

function category(c: LbCategory): WorkshopCategory {
  return {
    kind: 'category',
    name: c.name,
    colour: c.colour,
    ...(c.custom !== undefined && { custom: c.custom }),
    contents: [
      ...(c.blocks ?? []).map((xml) => ({ kind: 'block' as const, blockxml: xml })),
      ...(c.children ?? []).map(category),
    ],
  };
}

export function workshopToolbox(): WorkshopToolbox {
  return { kind: 'categoryToolbox', contents: LB_TOOLBOX.map(category) };
}

/** A toolbox of a few blocks, for a lesson screen: no categories, just the blocks. */
export interface FlyoutToolbox {
  kind: 'flyoutToolbox';
  contents: ({ kind: 'block'; blockxml: string } | { kind: 'label'; text: string })[];
}

/**
 * The toolbox of a lesson screen: the blocks met for the first time on top under "Khối mới",
 * then the ones already learnt. Each comes with Pythaverse's starting values.
 */
export function lessonToolbox(
  types: readonly string[],
  newTypes: readonly string[] = [],
): FlyoutToolbox {
  const block = (type: string) => ({ kind: 'block' as const, blockxml: toolboxXml(type) });
  const old = types.filter((type) => !newTypes.includes(type));
  return {
    kind: 'flyoutToolbox',
    contents: [
      ...(newTypes.length > 0 ? [{ kind: 'label' as const, text: vi.leanbotWorld.newBlocks }] : []),
      ...newTypes.map(block),
      ...(old.length > 0 && newTypes.length > 0
        ? [{ kind: 'label' as const, text: vi.leanbotWorld.oldBlocks }]
        : []),
      ...old.map(block),
    ],
  };
}

/** The colour picker of the browser first, then the Leanbot blocks that use it. */
let blocksReady = false;

export function setupWorkshopBlocks(): void {
  if (blocksReady) return;
  blocksReady = true;
  registerFieldColour();
  registerLeanbotBlocks();
}
