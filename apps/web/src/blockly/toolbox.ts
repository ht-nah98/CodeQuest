import type { utils } from 'blockly';
import type { Level, ToolboxEntry } from '@codequest/content-schema';
import {
  COMMON_BLOCKS,
  type BlockCategory,
  type BlockSpec,
  PROC_CALL_TYPES,
  PROC_DEF_TYPES,
  PROCEDURE_BLOCKS,
  VARIABLE_BLOCKS,
} from '@codequest/engine';
import { gameKinds } from '@codequest/games';
import { vi } from '../i18n/vi';

/** CSS class of the small group labels in the flyout (styled in blockly.css). */
export const FLYOUT_LABEL_CLASS = 'cq-flyout-label';

/**
 * Every BlockSpec the app knows: the engine's common, box (ADR-0022) and spell (ADR-0023) blocks
 * plus every game kind's blocks.
 */
export function knownBlockSpecs(): BlockSpec[] {
  return [
    ...COMMON_BLOCKS,
    ...VARIABLE_BLOCKS,
    ...PROCEDURE_BLOCKS,
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

/** Spell blocks with a box (`…_n`, ADR-0023 §2) name only spells with a `param`, and back. */
const takesParam = (type: string): boolean => type.endsWith('_n');

/**
 * Spell blocks of the toolbox, one per spell (ADR-0023 §6): an entry that names no spell
 * (`PROC` not pinned) becomes one entry per fitting spell of the level, in `procedures` order.
 * A `dạy phép` entry of a spell already taught on the workspace (`taught`) is left out: each
 * spell has one `dạy phép` block. Other entries pass through.
 */
function expandSpellEntries(
  entries: readonly ToolboxEntry[],
  procedures: Level['procedures'],
  taught: ReadonlySet<string>,
): ToolboxEntry[] {
  return entries.flatMap((entry): ToolboxEntry[] => {
    const type = typeof entry === 'string' ? entry : entry.type;
    const isDef = PROC_DEF_TYPES.includes(type);
    if (!isDef && !PROC_CALL_TYPES.includes(type)) return [entry];
    const pinned = typeof entry === 'string' ? undefined : entry.fields?.['PROC'];
    const fields = typeof entry === 'string' ? {} : (entry.fields ?? {});
    const ids =
      typeof pinned === 'string'
        ? [pinned]
        : (procedures ?? [])
            .filter((procedure) => (procedure.param !== undefined) === takesParam(type))
            .map((procedure) => procedure.id);
    return ids
      .filter((id) => !(isDef && taught.has(id)))
      .map((id) => ({ type, fields: { ...fields, PROC: id } }));
  });
}

/**
 * Builds the flyout toolbox of a level (blockly-integration.md §6): blocks in `level.toolbox`
 * order, grouped by BlockSpec category with a small label before each group. Always a flyout,
 * never categories; mode `parsons` gets an empty flyout (hidden by CSS) so Blockly still has one.
 * Spell blocks come one per spell; `taught` (spell ids with a `dạy phép` on the workspace)
 * hides their `dạy phép` entry.
 */
export function buildToolbox(
  level: Pick<Level, 'mode' | 'toolbox'> & Partial<Pick<Level, 'procedures'>>,
  specs: readonly BlockSpec[] = knownBlockSpecs(),
  taught: ReadonlySet<string> = new Set(),
): utils.toolbox.ToolboxInfo {
  if (level.mode === 'parsons') return { kind: 'flyoutToolbox', contents: [] };

  const byType = new Map(specs.map((spec) => [spec.type, spec]));
  // Map keeps insertion order, so groups appear in the order of their first block.
  const groups = new Map<BlockCategory | null, utils.toolbox.BlockInfo[]>();
  for (const entry of expandSpellEntries(level.toolbox, level.procedures, taught)) {
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
