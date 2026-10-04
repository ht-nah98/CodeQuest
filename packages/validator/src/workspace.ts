import type { WorkspaceJson } from '@codequest/content-schema';

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Visits every block of a workspace JSON (orphans, `next`, `inputs`, shadows included). */
function visitBlocks(
  workspace: WorkspaceJson,
  visit: (block: JsonRecord, shadow: boolean) => void,
): void {
  const walk = (block: unknown, shadow: boolean): void => {
    if (!isRecord(block)) return;
    visit(block, shadow);
    const connections = [block['next']];
    if (isRecord(block['inputs'])) connections.push(...Object.values(block['inputs']));
    for (const connection of connections) {
      if (!isRecord(connection)) continue;
      walk(connection['block'], shadow);
      walk(connection['shadow'], true);
    }
  };
  for (const block of workspace.blocks.blocks) walk(block, false);
}

/** Types of every non-shadow block in a workspace JSON, orphans included. */
export function blockTypesOf(workspace: WorkspaceJson): Set<string> {
  const types = new Set<string>();
  visitBlocks(workspace, (block, shadow) => {
    if (!shadow && typeof block['type'] === 'string') types.add(block['type']);
  });
  return types;
}

/**
 * Non-shadow blocks of one type, split by whether their stack starts with `rootType` (the
 * program) or not (loose blocks). Rule 16 uses it to see which block a `block:<type>` hint
 * pointer lands on.
 */
export function countBlocksOfType(
  workspace: WorkspaceJson,
  type: string,
  rootType: string,
): { attached: number; loose: number } {
  const counts = { attached: 0, loose: 0 };
  for (const top of workspace.blocks.blocks) {
    const attached = top.type === rootType;
    visitBlocks({ blocks: { languageVersion: 0, blocks: [top] } }, (block, shadow) => {
      if (!shadow && block['type'] === type) counts[attached ? 'attached' : 'loose'] += 1;
    });
  }
  return counts;
}

/** Number of shadow blocks in a workspace JSON (rule 12). */
export function countShadows(workspace: WorkspaceJson): number {
  let shadows = 0;
  visitBlocks(workspace, (_block, shadow) => {
    if (shadow) shadows++;
  });
  return shadows;
}

/** JSON with object keys sorted, so equal values always serialize the same. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (isRecord(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return value === undefined ? 'null' : JSON.stringify(value);
}

/**
 * Multiset of non-shadow blocks as `type fields extraState` signatures (rule 13): two
 * workspaces with the same signatures differ only in order, nesting and position.
 */
export function blockSignatures(workspace: WorkspaceJson): Map<string, number> {
  const signatures = new Map<string, number>();
  visitBlocks(workspace, (block, shadow) => {
    if (shadow) return;
    const fields = isRecord(block['fields']) ? stableStringify(block['fields']) : '';
    const extra = block['extraState'] === undefined ? '' : stableStringify(block['extraState']);
    const signature = [String(block['type']), fields, extra]
      .filter((part) => part !== '')
      .join(' ');
    signatures.set(signature, (signatures.get(signature) ?? 0) + 1);
  });
  return signatures;
}
