import type { WorkspaceJson } from '@codequest/content-schema';

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Calls `visit` on every serialized block (top, next, input blocks and shadows) with its path. */
function walk(
  block: unknown,
  path: string,
  visit: (block: JsonRecord, path: string) => void,
): void {
  if (!isRecord(block)) return;
  visit(block, path);
  const next = block['next'];
  if (isRecord(next)) {
    walk(next['block'], `${path}.n`, visit);
    walk(next['shadow'], `${path}.n.s`, visit);
  }
  const inputs = block['inputs'];
  if (isRecord(inputs)) {
    for (const name of Object.keys(inputs)) {
      const input = inputs[name];
      if (!isRecord(input)) continue;
      walk(input['block'], `${path}.${name}`, visit);
      walk(input['shadow'], `${path}.${name}.s`, visit);
    }
  }
}

/**
 * Returns a copy of `workspace` where every block without an `id` gets one derived from its
 * position (`b0`, `b0.n`, `b0.DO`, `b0.TIMES.s`…). Blockly would otherwise draw a random id,
 * breaking determinism and block highlighting. Blocks that have an id keep it.
 */
export function normalizeIds(workspace: WorkspaceJson): WorkspaceJson {
  const copy = structuredClone(workspace);
  const used = new Set<string>();
  const missing: Array<{ block: JsonRecord; path: string }> = [];
  copy.blocks.blocks.forEach((top, index) => {
    walk(top, `b${String(index)}`, (block, path) => {
      const id = block['id'];
      if (typeof id === 'string' && id !== '') used.add(id);
      else missing.push({ block, path });
    });
  });
  for (const { block, path } of missing) {
    let id = path;
    for (let n = 2; used.has(id); n++) id = `${path}_${String(n)}`;
    used.add(id);
    block['id'] = id;
  }
  return copy;
}
