import { z } from 'zod';

/** A top-level block in Blockly's JSON serialization; nested content is left to Blockly. */
const SerializedBlockSchema = z.looseObject({
  type: z.string().min(1),
  id: z.string().min(1).optional(),
});

/**
 * Blockly workspace serialization JSON (`Blockly.serialization.workspaces.save`).
 * Loose on purpose so unknown Blockly keys survive a parse round-trip, and ids are optional
 * because Blockly's own generated ids use characters outside the content alphabet.
 */
export const WorkspaceJsonSchema = z.looseObject({
  blocks: z.looseObject({
    languageVersion: z.literal(0),
    blocks: z.array(SerializedBlockSchema),
  }),
  variables: z.array(z.unknown()).optional(),
});
export type WorkspaceJson = z.infer<typeof WorkspaceJsonSchema>;

/**
 * Alphabet of block ids written in `content/`. Ids end up in generated code and in highlight
 * events, so authored ones stay boring: no quotes, backslashes, spaces or line breaks.
 */
export const CONTENT_BLOCK_ID = /^[A-Za-z0-9_\-.:]+$/;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Visits a serialized block and everything plugged into it (next, inputs, shadows). */
function visitBlocks(
  block: unknown,
  path: PropertyKey[],
  visit: (block: JsonRecord, path: PropertyKey[]) => void,
): void {
  if (!isRecord(block)) return;
  visit(block, path);
  const connections: Array<[PropertyKey[], unknown]> = [[[...path, 'next'], block['next']]];
  if (isRecord(block['inputs'])) {
    for (const [name, input] of Object.entries(block['inputs'])) {
      connections.push([[...path, 'inputs', name], input]);
    }
  }
  for (const [where, connection] of connections) {
    if (!isRecord(connection)) continue;
    visitBlocks(connection['block'], [...where, 'block'], visit);
    visitBlocks(connection['shadow'], [...where, 'shadow'], visit);
  }
}

/**
 * Workspace JSON as authored in `content/` (solution, initialWorkspace, lesson demos): like
 * `WorkspaceJsonSchema`, but every block, nested ones and shadows included, needs a unique id
 * from `CONTENT_BLOCK_ID`. Without one Blockly draws a random id, so highlights and predict
 * keys could not be reproduced. The output type stays `WorkspaceJson`.
 */
export const ContentWorkspaceJsonSchema = WorkspaceJsonSchema.superRefine((workspace, ctx) => {
  const seen = new Set<string>();
  workspace.blocks.blocks.forEach((top, index) => {
    visitBlocks(top, ['blocks', 'blocks', index], (block, path) => {
      const id = block['id'];
      if (typeof id !== 'string' || !CONTENT_BLOCK_ID.test(id)) {
        ctx.addIssue({
          code: 'custom',
          path: [...path, 'id'],
          message: `every block needs an id matching ${CONTENT_BLOCK_ID.source}`,
        });
        return;
      }
      if (seen.has(id)) {
        ctx.addIssue({
          code: 'custom',
          path: [...path, 'id'],
          message: `duplicate block id "${id}"`,
        });
      }
      seen.add(id);
    });
  });
});
