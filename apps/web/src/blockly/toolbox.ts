import type { utils } from 'blockly';
import type { Level, ToolboxEntry } from '@codequest/content-schema';
import {
  COMMON_BLOCKS,
  type BlockCategory,
  type BlockSpec,
  VARIABLE_BLOCKS,
} from '@codequest/engine';
import { gameKinds } from '@codequest/games';
import { vi } from '../i18n/vi';

/** CSS class of the small group labels in the flyout (styled in blockly.css). */
export const FLYOUT_LABEL_CLASS = 'cq-flyout-label';

/**
 * Every BlockSpec the app knows: the engine's common and box blocks (ADR-0022) plus every game
 * kind's blocks.
 */
export function knownBlockSpecs(): BlockSpec[] {
  return [
    ...COMMON_BLOCKS,
    ...VARIABLE_BLOCKS,
    ...Object.values(gameKinds).flatMap((kind) => kind.blocks),
  ];
}

// Built-in Blockly blocks used by the curriculum, grouped like their blockStyle (§3).
const BUILTIN_CATEGORY_PREFIXES: ReadonlyArray<readonly [string, BlockCategory]> = [
  ['controls_whileUntil', 'loop'],
  ['controls_if', 'logic'],
  ['logic_', 'logic'],
  ['math_', 'variable'],
  ['variables_', 'variable'],
  ['procedures_', 'function'],
];

function categoryOf(type: string, specs: ReadonlyMap<string, BlockSpec>): BlockCategory | null {
  const spec = specs.get(type);
  if (spec) return spec.category;
  return BUILTIN_CATEGORY_PREFIXES.find(([prefix]) => type.startsWith(prefix))?.[1] ?? null;
}

function toBlockInfo(entry: ToolboxEntry): utils.toolbox.BlockInfo {
  if (typeof entry === 'string') return { kind: 'block', type: entry };
  return { kind: 'block', type: entry.type, ...(entry.fields && { fields: entry.fields }) };
}

/**
 * Builds the flyout toolbox of a level (blockly-integration.md §6): blocks in `level.toolbox`
 * order, grouped by BlockSpec category with a small label before each group. Always a flyout,
 * never categories; mode `parsons` gets an empty flyout (hidden by CSS) so Blockly still has one.
 */
export function buildToolbox(
  level: Pick<Level, 'mode' | 'toolbox'>,
  specs: readonly BlockSpec[] = knownBlockSpecs(),
): utils.toolbox.ToolboxInfo {
  if (level.mode === 'parsons') return { kind: 'flyoutToolbox', contents: [] };

  const byType = new Map(specs.map((spec) => [spec.type, spec]));
  // Map keeps insertion order, so groups appear in the order of their first block.
  const groups = new Map<BlockCategory | null, utils.toolbox.BlockInfo[]>();
  for (const entry of level.toolbox) {
    const category = categoryOf(typeof entry === 'string' ? entry : entry.type, byType);
    const group = groups.get(category) ?? [];
    group.push(toBlockInfo(entry));
    groups.set(category, group);
  }

  const contents: utils.toolbox.FlyoutItemInfo[] = [];
  for (const [category, blocks] of groups) {
    if (category !== null) {
      const label = {
        kind: 'label',
        text: vi.blockly.toolboxGroups[category],
        id: undefined,
        'web-class': FLYOUT_LABEL_CLASS,
      };
      contents.push(label);
    }
    contents.push(...blocks);
  }
  return { kind: 'flyoutToolbox', contents };
}
