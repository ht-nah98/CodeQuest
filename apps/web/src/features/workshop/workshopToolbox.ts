import { registerFieldColour } from '@blockly/field-colour';
import {
  LB_TOOLBOX,
  type LbCategory,
  registerLeanbotBlocks,
  toolboxEntryType,
  toolboxXml,
} from '@codequest/games';
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

/** Up to this many blocks a lesson toolbox stays open as one list; more go into groups. */
const OPEN_TOOLBOX_MAX = 4;

/** Pythaverse's categories holding only `types`, empty ones left out. */
function onlyTypes(c: LbCategory, types: readonly string[]): WorkshopCategory | null {
  const blocks = (c.blocks ?? []).filter((xml) => types.includes(typeOf(xml)));
  const children = (c.children ?? [])
    .map((child) => onlyTypes(child, types))
    .filter((child): child is WorkshopCategory => child !== null);
  if (blocks.length === 0 && children.length === 0) return null;
  return {
    kind: 'category',
    name: c.name,
    colour: c.colour,
    contents: [...blocks.map((xml) => ({ kind: 'block' as const, blockxml: xml })), ...children],
  };
}

function blockTypesOf(c: WorkshopCategory): string[] {
  return c.contents.flatMap((item) =>
    item.kind === 'block' ? [typeOf(item.blockxml)] : blockTypesOf(item),
  );
}

const typeOf = (xml: string) => /type=['"]([^'"]+)['"]/.exec(xml)?.[1] ?? '';

/**
 * The toolbox of a lesson screen. A few blocks: one open list, the blocks met for the first
 * time on top under "Khối mới". More: Pythaverse's groups holding only these blocks, with a
 * "Khối mới" group first, so the open list never covers the workspace.
 */
export function lessonToolbox(
  types: readonly string[],
  newTypes: readonly string[] = [],
): FlyoutToolbox | WorkshopToolbox {
  const block = (entry: string) => ({ kind: 'block' as const, blockxml: toolboxXml(entry) });
  const old = types.filter((type) => !newTypes.includes(type));
  if (types.length > OPEN_TOOLBOX_MAX) {
    // Entries written as XML stay as written: they go with the "Khác" group, not Pythaverse's.
    const plain = types.filter((entry) => !entry.startsWith('<'));
    const groups = LB_TOOLBOX.map((c) => onlyTypes(c, plain)).filter(
      (c): c is WorkshopCategory => c !== null,
    );
    const fresh: WorkshopCategory[] =
      newTypes.length > 0
        ? [
            {
              kind: 'category',
              name: vi.leanbotWorld.newBlocks,
              colour: '#fbc73f',
              contents: newTypes.map(block),
            },
          ]
        : [];
    // Blocks only the dynamic categories list (typed variables, functions) go in one more group.
    const listed = new Set(groups.flatMap(blockTypesOf));
    const rest = types.filter(
      (entry) => !listed.has(toolboxEntryType(entry)) && !newTypes.includes(entry),
    );
    const other: WorkshopCategory[] =
      rest.length > 0
        ? [
            {
              kind: 'category',
              name: vi.leanbotWorld.otherBlocks,
              colour: '#a55b80',
              contents: rest.map(block),
            },
          ]
        : [];
    return { kind: 'categoryToolbox', contents: [...fresh, ...groups, ...other] };
  }
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

let blocksReady = false;

export function setupWorkshopBlocks(): void {
  if (blocksReady) return;
  blocksReady = true;
  registerFieldColour();
  registerLeanbotBlocks();
}
