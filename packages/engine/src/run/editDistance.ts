import type { WorkspaceJson } from '@codequest/content-schema';
import { CQ_START } from '../blocks/common';
import { PROC_DEF_TYPES } from '../blocks/procedures';

export type JsonRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** JSON with object keys sorted, so equal values always serialize the same. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (isRecord(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return value === undefined ? 'null' : JSON.stringify(value);
}

/** The real block of a connection, or its shadow when nothing is plugged in. */
export function connectedBlock(connection: unknown): JsonRecord | null {
  if (!isRecord(connection)) return null;
  const block = connection['block'] ?? connection['shadow'];
  return isRecord(block) ? block : null;
}

/**
 * Pre-order tokens `"<depth>|<input>|<type>|<fields>|<mutation>"` of a statement chain
 * (runtime-engine.md §9). Ids and positions are ignored on purpose.
 */
function pushTokens(first: JsonRecord | null, depth: number, input: string, out: string[]): void {
  for (let block = first; block !== null; block = connectedBlock(block['next'])) {
    const fields = isRecord(block['fields']) ? block['fields'] : {};
    const mutation = block['extraState'] ?? null;
    out.push(
      `${String(depth)}|${input}|${String(block['type'])}|${stableStringify(fields)}|${stableStringify(mutation)}`,
    );
    const inputs = isRecord(block['inputs']) ? block['inputs'] : {};
    for (const name of Object.keys(inputs).sort()) {
      pushTokens(connectedBlock(inputs[name]), depth + 1, name, out);
    }
  }
}

/** Input name of the `dạy phép` stacks in tokens: never equal to a block of the main stack. */
export const SPELL_STACK = '#spell';

/**
 * The `dạy phép` blocks of a workspace (ADR-0023 §3) in a fixed order: `procedureOrder` (the
 * level's `procedures` ids) first, then by spell id, then as written.
 */
export function spellStacks(
  workspace: WorkspaceJson,
  procedureOrder: readonly string[] = [],
): JsonRecord[] {
  const spellOf = (block: JsonRecord): string => {
    const fields = isRecord(block['fields']) ? block['fields'] : {};
    const id = fields['PROC'];
    return typeof id === 'string' ? id : '';
  };
  const rank = (id: string): number => {
    const index = procedureOrder.indexOf(id);
    return index === -1 ? procedureOrder.length : index;
  };
  return workspace.blocks.blocks
    .filter((block) => PROC_DEF_TYPES.includes(block.type))
    .map((block, index) => ({ block, index }))
    .sort((a, b) => {
      const byRank = rank(spellOf(a.block)) - rank(spellOf(b.block));
      if (byRank !== 0) return byRank;
      const [x, y] = [spellOf(a.block), spellOf(b.block)];
      return x < y ? -1 : x > y ? 1 : a.index - b.index;
    })
    .map(({ block }) => block);
}

function programTokens(workspace: WorkspaceJson, procedureOrder?: readonly string[]): string[] {
  const start = workspace.blocks.blocks.find((block) => block.type === CQ_START);
  const tokens: string[] = [];
  if (start !== undefined) pushTokens(connectedBlock(start['next']), 0, '', tokens);
  // Spells after the main stack, each `dạy phép` block then its body (ADR-0023 §3).
  for (const spell of spellStacks(workspace, procedureOrder)) {
    pushTokens(spell, 0, SPELL_STACK, tokens);
  }
  return tokens;
}

function levenshtein(a: readonly string[], b: readonly string[]): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const substitution = (previous[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1);
      current.push(Math.min((previous[j] ?? 0) + 1, (current[j - 1] ?? 0) + 1, substitution));
    }
    previous = current;
  }
  return previous[b.length] ?? 0;
}

/**
 * Number of block edits (insert, delete, change = 1 each) between two programs, comparing
 * only blocks under `cq_start` and the `dạy phép` stacks (ADR-0023 §3: after the main stack, in
 * `procedureOrder`, the level's `procedures` ids). Used to grade `bughunt` levels.
 */
export function editDistance(
  from: WorkspaceJson,
  to: WorkspaceJson,
  procedureOrder?: readonly string[],
): number {
  return levenshtein(programTokens(from, procedureOrder), programTokens(to, procedureOrder));
}
