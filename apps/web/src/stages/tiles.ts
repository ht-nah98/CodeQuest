import { AnimatedSprite, BufferImageSource, Sprite, Texture } from 'pixi.js';
import type { SceneTheme } from '@codequest/content-schema';
import type { TileName, TileTextures } from './assets';
import { type GoalArt, goalPixels } from './goalArt';
import { type PixelImage, patternPixels } from './maze/pixelArt';
import { SCENE_ART } from './sceneThemes';
import { GROUND_PIECES, type GroundPiece, groundPiece } from './sceneTiles';

/** A texture from RGBA texels, `nearest` for crisp texels at integer scales (no renderer needed). */
export function pixelTexture({ width, height, data }: PixelImage): Texture {
  const source = new BufferImageSource({ resource: data, width, height, scaleMode: 'nearest' });
  return new Texture({ source });
}

/** A grid-aligned sprite of `texture` at an integer scale, top-left at (x, y). */
export function textureSprite(texture: Texture, scale: number, x: number, y: number): Sprite {
  const sprite = new Sprite(texture);
  sprite.scale.set(scale);
  sprite.position.set(x, y);
  return sprite;
}

/** One grid-aligned tile at an integer scale, top-left at (x, y). */
export function tileSprite(
  tiles: TileTextures,
  name: TileName,
  scale: number,
  x: number,
  y: number,
): Sprite {
  return textureSprite(tiles[name], scale, x, y);
}

export type GroundTextures = Record<GroundPiece, Texture>;

/** Runner ground textures of each theme, made once per theme and kept for the session. */
const groundTextureCache = new Map<SceneTheme, GroundTextures>();

/**
 * The six runner ground pieces of `theme` (stage-rendering.md §7): its own pixel art
 * (sceneTiles.ts), or the Kenney tiles for Làng Tre. Cached per theme, never destroyed.
 */
export function groundTextures(theme: SceneTheme, tiles: TileTextures): GroundTextures {
  const ground = SCENE_ART[theme].ground;
  if (ground === null) {
    return Object.fromEntries(GROUND_PIECES.map((p) => [p, tiles[p]])) as GroundTextures;
  }
  let textures = groundTextureCache.get(theme);
  if (textures === undefined) {
    const made = {} as GroundTextures;
    for (const piece of GROUND_PIECES) {
      made[piece] = pixelTexture(
        patternPixels(groundPiece(ground.patterns, piece), ground.palette),
      );
    }
    groundTextureCache.set(theme, made);
    textures = made;
  }
  return textures;
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
    texture = pixelTexture(goalPixels(art));
    goalTextures.set(art, texture);
  }
  return texture;
}
