import type { Level, PredictOption } from '@codequest/content-schema';
import { runLevel, type AnyGameKindDefinition } from '@codequest/engine';

/**
 * The outcome key of one predict card (ADR-0024 §5): `key` when written by hand, else the
 * `answerKey` of running its `drawProgram` on the level (undefined when the run gives none).
 * Every reader of a card's key uses this, never `option.key` alone.
 */
export function predictOptionKey(
  kind: AnyGameKindDefinition,
  level: Level,
  option: PredictOption,
): string | undefined {
  if (option.key !== undefined) return option.key;
  if (option.drawProgram === undefined) return undefined;
  // Mode predict runs `initialWorkspace`, so the card's program takes its place.
  // `maxBlocks` caps the child's program, not an answer card's (as in the search's recording).
  const card: Level = { ...level, mode: 'predict', initialWorkspace: option.drawProgram };
  delete card.maxBlocks;
  return runLevel({ kind, level: card, workspace: option.drawProgram }).answerKey;
}
