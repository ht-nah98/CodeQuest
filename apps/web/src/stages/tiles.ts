import { AnimatedSprite, BufferImageSource, Sprite, Texture } from 'pixi.js';
import type { TileName, TileTextures } from './assets';
import { type GoalArt, goalPixels } from './goalArt';

/** One grid-aligned tile at an integer scale, top-left at (x, y). */
export function tileSprite(
  tiles: TileTextures,
  name: TileName,
  scale: number,
  x: number,
  y: number,
): Sprite {
  const tile = new Sprite(tiles[name]);
  tile.scale.set(scale);
  tile.position.set(x, y);
  return tile;
}

/**
 * The waving goal flag (2 frames), standing on its pole. `x` is the left edge of the pole tile,
 * `groundTop` the top of the ground row the pole stands on. The owner calls `flag.update(ticker)`
 * from its own clock (`autoUpdate: false`, stage-rendering.md §3).
 */
export function createFlag(
  tiles: TileTextures,
  scale: number,
  x: number,
  groundTop: number,
): { pole: Sprite; flag: AnimatedSprite } {
  const size = tiles.flag_pole.height * scale;
  const pole = tileSprite(tiles, 'flag_pole', scale, x, groundTop - size);
  const flag = new AnimatedSprite({
    textures: [tiles.flag_1, tiles.flag_2],
    animationSpeed: 4 / 60,
    autoUpdate: false,
  });
  flag.scale.set(scale);
  flag.position.set(x, groundTop - 2 * size);
  flag.play();
  return { pole, flag };
}

/** Goal pictures as textures, made once per picture (they are small and shared by every stage). */
const goalTextures = new Map<GoalArt, Texture>();

/** The texture of a goal picture (`goalSprite`, stages/goalArt.ts), `nearest` for crisp texels. */
export function goalTexture(art: GoalArt): Texture {
  let texture = goalTextures.get(art);
  if (texture === undefined) {
    const { width, height, data } = goalPixels(art);
    const source = new BufferImageSource({ resource: data, width, height, scaleMode: 'nearest' });
    texture = new Texture({ source });
    goalTextures.set(art, texture);
  }
  return texture;
}
