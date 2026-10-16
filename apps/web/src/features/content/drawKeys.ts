import type { Level } from '@codequest/content-schema';
import { turtleDrawKey } from '@codequest/games';

/**
 * A turtle predict level with every card's key written out (ADR-0024 §5): a card authored as a
 * `drawProgram` gets the `key` of running that program on the level (`turtleDrawKey`, the same
 * function content:check rule 26 uses), so the play screen, the cards and the run all compare
 * plain keys. Other levels come back unchanged. Throws when a program gives no key (content:check
 * rejects such a level).
 */
export function withDrawKeys(level: Level): Level {
  if (level.kind !== 'turtle' || level.predict === undefined) return level;
  const options = level.predict.options.map((option) =>
    option.drawProgram === undefined
      ? option
      : { key: turtleDrawKey(level, option.drawProgram), label: option.label },
  );
  return { ...level, predict: { ...level.predict, options } };
}
