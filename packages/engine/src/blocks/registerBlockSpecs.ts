import { Blocks, common } from 'blockly';
import { engineGenerator } from './generator';
import { COMMON_BLOCKS } from './common';
import type { BlockSpec } from '../sdk/blockSpec';

const registered = new Map<string, BlockSpec>();
const reservedApiNames = new Set<string>();

function register(spec: BlockSpec): void {
  if (registered.get(spec.type) === spec) return;
  // A different spec object for a known type (e.g. after hot reload) replaces the old one;
  // deleting first avoids Blockly's "overwrites previous definition" warning.
  if (spec.type in Blocks) Reflect.deleteProperty(Blocks, spec.type);
  common.defineBlocks(
    common.createBlockDefinitionsFromJsonArray([{ ...spec.json, type: spec.type }]),
  );
  engineGenerator.forBlock[spec.type] = (block, gen) => spec.generator(block, gen);
  const fresh = spec.apiNames.filter((name) => !reservedApiNames.has(name));
  if (fresh.length > 0) {
    engineGenerator.addReservedWords(fresh.join(','));
    for (const name of fresh) reservedApiNames.add(name);
  }
  registered.set(spec.type, spec);
}

/**
 * Defines Blockly blocks and generators for `specs` (plus `cq_start`/`cq_repeat`).
 * Idempotent: registering the same spec again is a no-op.
 */
export function registerBlockSpecs(specs: readonly BlockSpec[]): void {
  for (const spec of COMMON_BLOCKS) register(spec);
  for (const spec of specs) register(spec);
}
