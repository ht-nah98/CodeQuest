import type { WorkspaceJson } from '@codequest/content-schema';
import { normalizeIds } from '@codequest/engine';

// Author mode's "Sao chép workspace JSON": a program ready to paste into content/ as a
// `solution` or `initialWorkspace`. Blockly's random ids (with characters content rules forbid)
// become stable, path-based ids (engine `normalizeIds`: b0, b0.n, b0.DO…), and only top-level
// blocks keep their x/y.

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Drops `id` everywhere and `x`/`y` below the top level, in place. */
function strip(block: unknown, top: boolean): void {
  if (!isRecord(block)) return;
  delete block['id'];
  if (!top) {
    delete block['x'];
    delete block['y'];
  }
  const next = block['next'];
  if (isRecord(next)) {
    strip(next['block'], false);
    strip(next['shadow'], false);
  }
  const inputs = block['inputs'];
  if (isRecord(inputs)) {
    for (const input of Object.values(inputs)) {
      if (!isRecord(input)) continue;
      strip(input['block'], false);
      strip(input['shadow'], false);
    }
  }
}

export function authorWorkspaceJson(workspace: WorkspaceJson): WorkspaceJson {
  const copy = structuredClone(workspace);
  for (const block of copy.blocks.blocks) strip(block, true);
  return normalizeIds(copy);
}
