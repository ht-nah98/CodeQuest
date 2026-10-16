import type { WorkspaceJson } from '@codequest/content-schema';
import { LOOP_BLOCK_TYPES } from '../blocks/common';
import { NO_PROCEDURE } from '../blocks/procedureField';
import { PROC_CALL_TYPES, PROC_DEF_TYPES } from '../blocks/procedures';
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

/** The spell id a serialized `cq_proc_*` block names. */
function spellOf(block: JsonRecord): string {
  const fields = isRecord(block['fields']) ? block['fields'] : {};
  const id = fields['PROC'];
  return typeof id === 'string' && id !== '' ? id : NO_PROCEDURE;
}

/** Deepest loop nesting written inside one block's inputs and the stack below it (itself too). */
function literalDepth(top: JsonRecord): number {
  let deepest = 0;
  visit({ blocks: { languageVersion: 0, blocks: [top as { type: string }] } }, (block, around) => {
    if (LOOPS.has(String(block['type']))) deepest = Math.max(deepest, around + 1);
  });
  return deepest;
}

/**
 * Deepest **effective** nesting of loop blocks (`cq_repeat`, `cq_repeat_until`, `cq_repeat_var`
 * and Blockly's loops) in a workspace JSON, loose stacks included: 0 without loops, 1 when no loop
 * sits inside another. A `làm phép` counts as the loops around it plus the deepest nesting inside
 * its spell's body (ADR-0023 §3), so calling a spell that loops from inside a loop is depth 2.
 * Without spells it is the plain nesting, as before. `level.maxLoopDepth` caps it (P2-11,
 * curriculum.md §5.4 T16b); pure JSON, no Blockly, so the validator, the par search and the web
 * drop guard share it.
 */
export function loopDepth(workspace: WorkspaceJson): number {
  const bodyDepth = new Map<string, number>();
  for (const top of workspace.blocks.blocks) {
    if (!PROC_DEF_TYPES.includes(top.type)) continue;
    const id = spellOf(top);
    bodyDepth.set(id, Math.max(bodyDepth.get(id) ?? 0, literalDepth(top)));
  }
  let deepest = 0;
  visit(workspace, (block, loopsAround) => {
    const type = String(block['type']);
    if (LOOPS.has(type)) deepest = Math.max(deepest, loopsAround + 1);
    if (PROC_CALL_TYPES.includes(type)) {
      deepest = Math.max(deepest, loopsAround + (bodyDepth.get(spellOf(block)) ?? 0));
    }
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
