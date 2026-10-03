import { CONTENT_BLOCK_ID, type WorkspaceJson } from '@codequest/content-schema';
import { normalizeIds } from '@codequest/engine';

// Author mode's "Sao chép workspace JSON": a program ready to paste into content/ as a
// `solution` or `initialWorkspace`. Blockly's random ids (with characters content rules forbid)
// become stable, path-based ids (engine `normalizeIds`: b0, b0.n, b0.DO…), and only top-level
// blocks keep their x/y.

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export interface AuthorJsonOptions {
  /**
   * Keep ids that are already content-safe (`CONTENT_BLOCK_ID`) and unique, so a level opened
   * in the level editor keeps the ids its hints and highlights use. Default false.
   */
  keepContentIds?: boolean;
}

/** Drops unsafe ids, `x`/`y` below the top level and disabled marks, in place. */
function strip(block: unknown, top: boolean, keep: Set<string> | null): void {
  if (!isRecord(block)) return;
  const id = block['id'];
  const safe =
    keep !== null && typeof id === 'string' && CONTENT_BLOCK_ID.test(id) && !keep.has(id);
  if (safe) keep.add(id);
  else delete block['id'];
  delete block['enabled'];
  delete block['disabledReasons'];
  if (!top) {
    delete block['x'];
    delete block['y'];
  }
  const next = block['next'];
  if (isRecord(next)) {
    strip(next['block'], false, keep);
    strip(next['shadow'], false, keep);
  }
  const inputs = block['inputs'];
  if (isRecord(inputs)) {
    for (const input of Object.values(inputs)) {
      if (!isRecord(input)) continue;
      strip(input['block'], false, keep);
      strip(input['shadow'], false, keep);
    }
  }
}

export function authorWorkspaceJson(
  workspace: WorkspaceJson,
  options: AuthorJsonOptions = {},
): WorkspaceJson {
  const copy = structuredClone(workspace);
  const keep = options.keepContentIds === true ? new Set<string>() : null;
  for (const block of copy.blocks.blocks) strip(block, true, keep);
  return normalizeIds(copy);
}
