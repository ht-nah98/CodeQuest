import { AnimatedSprite, type Ticker } from 'pixi.js';
import type { PandaTextures } from './assets';
import { PANDA_FPS, type PandaAnimation } from './panda';

/** 280 px frame -> 140 px box, Măng ≈ 118 px tall (art-direction.md §7: show at 96–160 px). */
export const PANDA_SCALE = 0.5;

/**
 * Măng as one AnimatedSprite. The frame anchor is the feet line of the current
 * animation (tools/sprites/pack.py), so `sprite.position` is where Măng stands.
 *
 * The sprite does not use `Ticker.shared` (`autoUpdate: false`): the owner calls
 * `update(ticker)` from its own clock, so pausing, stepping or changing speed of
 * that one clock controls every animation on the stage.
 */
export interface Panda {
  readonly sprite: AnimatedSprite;
  readonly animation: PandaAnimation;
  play(animation: PandaAnimation): void;
  update(ticker: Ticker): void;
}

export function createPanda(textures: PandaTextures, scale = PANDA_SCALE): Panda {
  const sprite = new AnimatedSprite({
    textures: textures.idle,
    autoUpdate: false,
    updateAnchor: true,
  });
  sprite.scale.set(scale);
  let animation: PandaAnimation = 'idle';

  const play = (next: PandaAnimation): void => {
    animation = next;
    sprite.textures = textures[next];
    sprite.animationSpeed = (PANDA_FPS[next] ?? 0) / 60; // ticker deltaTime is in 60 fps frames
    sprite.gotoAndPlay(0);
  };
  play('idle');

  return {
    sprite,
    get animation() {
      return animation;
    },
    play,
    update: (ticker) => {
      sprite.update(ticker);
    },
  };
}
