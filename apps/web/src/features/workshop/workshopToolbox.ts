import { registerFieldColour } from '@blockly/field-colour';
import { LB_TOOLBOX, type LbCategory, registerLeanbotBlocks } from '@codequest/games';

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

/** The colour picker of the browser first, then the Leanbot blocks that use it. */
export function setupWorkshopBlocks(): void {
  registerFieldColour();
  registerLeanbotBlocks();
}
