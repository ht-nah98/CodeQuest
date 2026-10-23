import { Blocks, common } from 'blockly';
import { LB_BLOCKS } from './blocks';

/** Defines the Leanbot blocks in Blockly. Idempotent, safe on Node and in the browser. */
export function registerLeanbotBlocks(): void {
  const missing = LB_BLOCKS.filter((def) => !(def.type in Blocks));
  if (missing.length === 0) return;
  common.defineBlocks(
    common.createBlockDefinitionsFromJsonArray(
      missing.map((def) => ({ ...def.json, type: def.type })),
    ),
  );
}
