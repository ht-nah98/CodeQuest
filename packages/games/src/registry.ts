import type { GameKindId } from '@codequest/content-schema';
import type { AnyGameKindDefinition } from '@codequest/engine';
import { maze } from './maze';
import { runner } from './runner';

/**
 * Every implemented game kind, by id. Partial until all kinds exist; look kinds up with
 * `getGameKind` instead of indexing.
 */
export const gameKinds: Readonly<Partial<Record<GameKindId, AnyGameKindDefinition>>> = {
  runner,
  maze,
};

/** The game kind for `level.kind`, or undefined if it is not implemented yet. */
export function getGameKind(id: GameKindId): AnyGameKindDefinition | undefined {
  return gameKinds[id];
}
