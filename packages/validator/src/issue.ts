import type { GameKindId } from '@codequest/content-schema';
import type { AnyGameKindDefinition } from '@codequest/engine';
import type { z } from 'zod';

/** One broken rule of content-model.md §5, without the file it was found in. */
export interface RuleIssue {
  /** Rule number, 1–19. */
  rule: number;
  message: string;
}

/** Finds the game kind of a level; injectable so tests do not depend on real kinds. */
export type GameKindLookup = (id: GameKindId) => AnyGameKindDefinition | undefined;

/**
 * Rule 1 messages for a failed zod parse: `<field.path>: <zod message>`, with an optional
 * `prefix` in front of the field path (e.g. `config`).
 */
export function formatSchemaIssues(error: z.ZodError, prefix = ''): RuleIssue[] {
  return error.issues.map((issue) => {
    const where = [prefix, ...issue.path.map(String)].filter((part) => part !== '').join('.');
    return { rule: 1, message: `${where === '' ? '' : `${where}: `}${issue.message}` };
  });
}

export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
