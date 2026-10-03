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

describe('action block tooltips', () => {
  // Coach feedback 03/10/2026: every action tooltip says exactly how Măng moves (glossary.md).
  it('state the movement of each action block', () => {
    const tooltips = Object.fromEntries(
      Object.values(gameKinds)
        .flatMap((kind) => kind.blocks)
        .filter((spec) => spec.category === 'move')
        .map((spec) => [spec.type, spec.json.tooltip]),
    );
    expect(tooltips).toEqual({
      runner_walk: 'Đi 1 ô về phía trước',
      runner_jump: 'Bay qua 1 ô, đáp xuống ô thứ 2',
      runner_crouch: 'Cúi xuống và đi 1 ô, chui qua cành thấp',
      runner_kick: 'Đá ô phía trước, Măng đứng yên',
      maze_forward: 'Tiến 1 ô theo hướng Măng đang nhìn',
      maze_turn_left: 'Quay sang trái tại chỗ, chưa đi',
      maze_turn_right: 'Quay sang phải tại chỗ, chưa đi',
    });
  });
});
