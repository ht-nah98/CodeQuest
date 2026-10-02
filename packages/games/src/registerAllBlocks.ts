import { registerBlockSpecs } from '@codequest/engine';
import { gameKinds } from './registry';

/**
 * Defines the Blockly blocks of every game kind, plus the engine's common blocks. The web app
 * calls this once at startup; `runLevel` registers what it needs by itself. Idempotent.
 */
export function registerAllBlocks(): void {
  registerBlockSpecs(Object.values(gameKinds).flatMap((kind) => kind.blocks));
}
