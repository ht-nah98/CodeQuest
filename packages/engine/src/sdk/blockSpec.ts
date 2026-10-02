import type { Block } from 'blockly';
import type { JavascriptGenerator } from 'blockly/javascript';

/** Toolbox group and colour family of a block (blockly-integration.md §3). */
export type BlockCategory =
  'move' | 'loop' | 'logic' | 'sensor' | 'robot' | 'variable' | 'function' | 'pen' | 'event';

/** Blockly JSON block definition without `type` (BlockSpec carries it). */
export interface BlocklyBlockJson {
  message0: string;
  args0?: ReadonlyArray<Readonly<Record<string, unknown>>>;
  previousStatement?: string | readonly string[] | null;
  nextStatement?: string | readonly string[] | null;
  output?: string | readonly string[] | null;
  style?: string;
  tooltip?: string;
  inputsInline?: boolean;
  [key: string]: unknown;
}

/** One block: Blockly definition + JavaScript generator, shared by Node and the browser. */
export interface BlockSpec {
  /** `<kind>_<verb>`, or `cq_<name>` for common blocks. */
  type: string;
  category: BlockCategory;
  json: BlocklyBlockJson;
  /** Must quote block ids with `gen.quote_(block.id)`, never by hand. */
  generator: (block: Block, gen: JavascriptGenerator) => string | [string, number];
  /** Sandbox functions the generator calls; reserved so child variables cannot shadow them. */
  apiNames: readonly string[];
}
