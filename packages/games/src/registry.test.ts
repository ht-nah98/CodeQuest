import { Blocks } from 'blockly';
import { describe, expect, it } from 'vitest';
import { GAME_KIND_IDS } from '@codequest/content-schema';
import { CQ_REPEAT, CQ_START } from '@codequest/engine';
import { gameKinds, getGameKind, registerAllBlocks } from './index';

describe('gameKinds registry', () => {
  it('keys every registered kind by its own id', () => {
    for (const [id, kind] of Object.entries(gameKinds)) expect(kind.id).toBe(id);
  });

  it('returns undefined for kinds that are not implemented yet', () => {
    for (const id of GAME_KIND_IDS) {
      if (!(id in gameKinds)) expect(getGameKind(id)).toBeUndefined();
    }
  });
});

describe('registerAllBlocks', () => {
  it('registers the common blocks and can be called twice', () => {
    registerAllBlocks();
    registerAllBlocks();
    expect(Blocks).toHaveProperty(CQ_START);
    expect(Blocks).toHaveProperty(CQ_REPEAT);
    for (const kind of Object.values(gameKinds)) {
      for (const spec of kind.blocks) expect(Blocks).toHaveProperty(spec.type);
    }
  });
});
