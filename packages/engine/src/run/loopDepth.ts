import type { WorkspaceJson } from '@codequest/content-schema';
import { LOOP_BLOCK_TYPES } from '../blocks/common';
import { isRecord, type JsonRecord } from './editDistance';

const LOOPS: ReadonlySet<string> = new Set(LOOP_BLOCK_TYPES);

/**
 * Calls `visit` for every non-shadow block of a workspace JSON (loose stacks included) with the
 * number of loop blocks it sits inside, itself not counted.
 */
function visit(
  workspace: WorkspaceJson,
  use: (block: JsonRecord, loopsAround: number) => void,
): void {
  const walk = (block: unknown, loopsAround: number): void => {
    if (!isRecord(block)) return;
    use(block, loopsAround);
    const inner = loopsAround + (LOOPS.has(String(block['type'])) ? 1 : 0);
    if (isRecord(block['inputs'])) {
      for (const input of Object.values(block['inputs'])) {
        if (isRecord(input)) walk(input['block'], inner);
      }
    }
    if (isRecord(block['next'])) walk(block['next']['block'], loopsAround);
  };
  for (const top of workspace.blocks.blocks) walk(top, 0);
}

/**
 * Deepest nesting of loop blocks (`cq_repeat`, `cq_repeat_until` and Blockly's loops) in a
 * workspace JSON, loose stacks included: 0 without loops, 1 when no loop sits inside another.
 * `level.maxLoopDepth` caps it (P2-11, curriculum.md §5.4 T16b); pure JSON, no Blockly, so the
 * validator, the par search and the web drop guard share it.
 */
export function loopDepth(workspace: WorkspaceJson): number {
  let deepest = 0;
  visit(workspace, (block, loopsAround) => {
    if (LOOPS.has(String(block['type']))) deepest = Math.max(deepest, loopsAround + 1);
  });
  return deepest;
}

/**
 * Non-shadow blocks per type in a workspace JSON, loose stacks included: what Blockly's
 * `maxInstances` counts (`level.maxInstances`).
 */
export function blockTypeCounts(workspace: WorkspaceJson): Map<string, number> {
  const counts = new Map<string, number>();
  visit(workspace, (block) => {
    const type = String(block['type']);
    counts.set(type, (counts.get(type) ?? 0) + 1);
  });
  return counts;
}
