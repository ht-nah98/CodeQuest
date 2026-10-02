import { Assets, type Spritesheet, type Texture, type UnresolvedAsset } from 'pixi.js';
import { PANDA_ANIMATIONS, type PandaAnimation } from './panda';

/** Temporary Kenney "Pixel Platformer" tiles (assets/CREDITS.md), drawn on an 18 px grid. */
export const TILE_SIZE = 18;
export const TILE_NAMES = [
  'ground_left',
  'ground',
  'ground_right',
  'dirt_left',
  'dirt',
  'dirt_right',
  'flag_1',
  'flag_2',
  'flag_pole',
  'crate',
] as const;
export type TileName = (typeof TILE_NAMES)[number];
export type TileTextures = Record<TileName, Texture>;
export type PandaTextures = Record<PandaAnimation, Texture[]>;

/**
 * Loads Măng's spritesheet once; `PIXI.Assets` caches it for the whole session.
 * The AI-drawn frames are not on an integer grid, so they are shown downscaled with
 * linear filtering (art-direction.md §7).
 */
export async function loadPandaSheet(): Promise<PandaTextures> {
  const sheet = await Assets.load<Spritesheet>({
    alias: 'sprites/panda',
    src: '/sprites/panda.json',
    data: { textureOptions: { scaleMode: 'linear' } },
  });
  const animations = {} as PandaTextures;
  for (const name of PANDA_ANIMATIONS) {
    const frames = sheet.animations[name];
    if (!frames?.length) throw new Error(`Panda animation missing: ${name}`);
    animations[name] = frames;
  }
  return animations;
}

/** Loads the runner tiles; grid-aligned pixel art, so nearest-neighbour at integer scales. */
export async function loadTiles(): Promise<TileTextures> {
  const requests: UnresolvedAsset[] = TILE_NAMES.map((name) => ({
    alias: `tiles/${name}`,
    src: `/tiles/${name}.png`,
    data: { scaleMode: 'nearest' },
  }));
  const loaded = await Assets.load<Texture>(requests);
  const tiles = {} as TileTextures;
  for (const name of TILE_NAMES) {
    const texture = loaded[`tiles/${name}`];
    if (!texture) throw new Error(`Tile texture missing: ${name}`);
    tiles[name] = texture;
  }
  return tiles;
}
