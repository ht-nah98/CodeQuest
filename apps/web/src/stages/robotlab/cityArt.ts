// Pixi-free scenery of the robot lab board (P3-08): the districts of "Thành Phố Măng" drawn on
// `#` cells (no line, never entered), one character per texel like robotArt.ts, token colours
// only. Readability first: scenery is quieter than the black line, the crossings, the job spots
// and the blocks (no black-on-white contrast inside a scenery cell, no colours of the stations).
import { boardOfMap, type RobotScenery } from '@codequest/games';
import { BLOCK_COLORS, UI_COLORS } from '../../ui/tokens';
import { mix, shade } from '../colors';
import { BUILDING, BUILDING_PALETTES, ROBOT_PALETTE } from './robotArt';

const C = UI_COLORS;
const B = BLOCK_COLORS;

/** Ground and water colours (also painted under the sprites, so small cells have no gaps). */
export const CITY_GROUND = {
  grass: mix(C.go, C.paper, 0.62),
  grassDark: mix(C.go, C.paper, 0.35),
  water: C.sky,
  wave: mix(C.sky, B.move, 0.32),
  bank: mix(C.coin, C.paper, 0.72),
  plank: mix(B.robot, C.paper, 0.38),
  plankSeam: shade(B.robot, 0.85),
  rail: shade(B.robot, 0.62),
  smoke: mix(C.paper2, C.inkSoft, 0.18),
} as const;

const CITY_PALETTE: Readonly<Record<string, string>> = {
  ...ROBOT_PALETTE,
  G: CITY_GROUND.grass,
  g: CITY_GROUND.grassDark,
  D: mix(C.goDeep, C.go, 0.25),
  B: C.go,
  b: C.goDeep,
  T: mix(C.coin, C.paper, 0.35),
  t: C.coinDeep,
  W: CITY_GROUND.water,
  v: CITY_GROUND.wave,
  f: C.hint,
  o: B.robot,
  O: shade(B.robot, 0.7),
  a: C.brand,
  A: C.brandDeep,
};

/** Village hut ("làng tre"): a straw roof with its ridge, on grass. */
const HUT = [
  'GGGGGGGGGGGGGGGG',
  'GkkkkkkkkkkkkkkG',
  'GkTTTTTTTTTTTTkG',
  'GkTTtTTTTTTtTTkG',
  'GkTTTTTTTTTTTTkG',
  'GkTtTTTTTTTTtTkG',
  'GkTTTTTTTTTTTTkG',
  'GkttttttttttttkG',
  'GkTTTTTTTTTTTTkG',
  'GkTTtTTTTTTtTTkG',
  'GkTTTTTTTTTTTTkG',
  'GkTtTTTTTTTTtTkG',
  'GkTTTTTTTTTTTTkG',
  'GkkkkkkkkkkkkkkG',
  'GGggggggggggggGG',
  'GGGGGGGGGGGGGGGG',
] as const;

/** Bamboo grove: stalk tops (rings with a shine) seen from above. */
const BAMBOO = [
  'GGGGGGGGGGGGGGGG',
  'GGbBBbGGGGGbBBbG',
  'GbBhBBbGGGbBhBBb',
  'GbBBBBbGgGbBBBBb',
  'GGbBBbGGGGGbBBbG',
  'GGGGGGGbBBbGGGGG',
  'GGgGGGbBhBBbGGGG',
  'GGGGGGbBBBBbGgGG',
  'GbBBbGGbBBbGGGGG',
  'bBhBBbGGGGGGbBBb',
  'bBBBBbGGgGGbBhBB',
  'GbBBbGGGGGGbBBBB',
  'GGGGGGbBBbGGbBBb',
  'GgGGGbBhBBbGGGGG',
  'GGGGGbBBBBbGGGgG',
  'GGGGGGbBBbGGGGGG',
] as const;

/** Park tree: a round canopy with a highlight and its shadow. */
const TREE = [
  'GGGGGGGGGGGGGGGG',
  'GGGGGkkkkkkGGGGG',
  'GGGkkBBBBBBkkGGG',
  'GGkBBhhBBBBBBkGG',
  'GkBBhhBBBBBBBBkG',
  'GkBBBBBBBbBBBBkG',
  'kBBBBBBBBBBbBBBk',
  'kBBBbBBBBBBBBBBk',
  'kBBBBBBBBBbBBBBk',
  'kBBBBBBbBBBBBBbk',
  'GkBBBBBBBBBBBbkG',
  'GkbBBBBbBBBBbbkG',
  'GGkbbBBBBBbbbkGG',
  'GGGkkbbbbbbkkDGG',
  'GGGGDkkkkkkDDGGG',
  'GGGGGGDDDDDGGGGG',
] as const;

/** Park pond with lily pads. */
const POND = [
  'GGGGGGGGGGGGGGGG',
  'GGGGkkkkkkkkGGGG',
  'GGkkWWWWWWWWkkGG',
  'GkWWWvvWWWWWWWkG',
  'GkWWWWWWWWBBWWkG',
  'kWWWWWWWWBBbBWWk',
  'kWvvWWWWWWBBWWWk',
  'kWWWWWWWWWWWWWWk',
  'kWWWWWWWvvWWWWWk',
  'kWWWBBWWWWWWWWWk',
  'GkWBBbWWWWWWvvkG',
  'GkWWBWWWWWWWWWkG',
  'GGkkWWWWWWWWkkGG',
  'GGGGkkkkkkkkGGGG',
  'GGGGGGGGGGGGGGGG',
  'GgGGGGGGGGGGGGgG',
] as const;

/** Park flower bed with a wooden bench. */
const FLOWERS = [
  'GGGGGGGGGGGGGGGG',
  'GfGGGhGGGfGGGhGG',
  'fhfGhyhGfhfGhyhG',
  'GfGGGhGGGfGGGhGG',
  'GGGGGGGGGGGGGGGG',
  'GkkkkkkkkkkkkkGG',
  'GkoooooooooookGG',
  'GkOOOOOOOOOOOkGG',
  'GkkkkkkkkkkkkkGG',
  'GGGGGGGGGGGGGGGG',
  'GGhGGGfGGGhGGGfG',
  'GhyhGfhfGhyhGfhf',
  'GGhGGGfGGGhGGGfG',
  'GGGGGGGGGGGGGGGG',
  'GfGGGhGGGfGGGgGG',
  'GGGGGGGGGGGGGGGG',
] as const;

/** Market stall ("phố chợ"): a striped awning (`X` red or yellow) over crates of fruit. */
const MARKET = [
  'kkkkkkkkkkkkkkkk',
  'kXXwwXXwwXXwwXXk',
  'kXXwwXXwwXXwwXXk',
  'kXXwwXXwwXXwwXXk',
  'kXXwwXXwwXXwwXXk',
  'kXXwwXXwwXXwwXXk',
  'kXXwwXXwwXXwwXXk',
  'kXXwwXXwwXXwwXXk',
  'kXXwwXXwwXXwwXXk',
  'kXkwkXkwkXkwkXkk',
  '.k.k.k.k.k.k.k..',
  'kkkkkkkkkkkkkkkk',
  'kooookoooookoook',
  'kohfokoyhyokofhk',
  'koooookoooookook',
  'kkkkkkkkkkkkkkkk',
] as const;

/** Factory roof: saw-tooth bands with skylights. */
const FACTORY = [
  'kkkkkkkkkkkkkkkk',
  'knnnnnnnnnnnnnnk',
  'kqqqqqqqqqqqqqqk',
  'kddddddddddddddk',
  'kssssssssssssssk',
  'knnnnnnnnnnnnnnk',
  'kqqqqqqqqqqqqqqk',
  'kddddddddddddddk',
  'kssssssssssssssk',
  'knnnnnnnnnnnnnnk',
  'kqqqqqqqqqqqqqqk',
  'kddddddddddddddk',
  'kssssssssssssssk',
  'knnnnnnnnnnnnnnk',
  'kAAAAAAAAAAAAAAk',
  'kkkkkkkkkkkkkkkk',
] as const;

/** Factory roof with the big brick chimney (its smoke is animated by the stage). */
const CHIMNEY = [
  'kkkkkkkkkkkkkkkk',
  'knnnnnnnnnnnnnnk',
  'kqqqqkkkkkkqqqqk',
  'kdddkooooookdddk',
  'ksskoOkkkkOokssk',
  'knkoOkkkkkkOoknk',
  'kqkoOkkkkkkOokqk',
  'kdkoOkkkkkkOokdk',
  'kskoOkkkkkkOoksk',
  'knnkoOkkkkOoknnk',
  'kqqqkooooookqqqk',
  'kddddkkkkkkddddk',
  'kssssssssssssssk',
  'knnnnnnnnnnnnnnk',
  'kAAAAAAAAAAAAAAk',
  'kkkkkkkkkkkkkkkk',
] as const;

export type SceneryArt =
  | 'hut'
  | 'bamboo'
  | 'tree'
  | 'pond'
  | 'flowers'
  | 'marketRed'
  | 'marketYellow'
  | 'house0'
  | 'house1'
  | 'factory'
  | 'chimney';

/** Pattern and palette of each scenery picture (16×16). */
export function sceneryArt(name: SceneryArt): {
  rows: readonly string[];
  palette: Readonly<Record<string, string>>;
} {
  switch (name) {
    case 'hut':
      return { rows: HUT, palette: CITY_PALETTE };
    case 'bamboo':
      return { rows: BAMBOO, palette: CITY_PALETTE };
    case 'tree':
      return { rows: TREE, palette: CITY_PALETTE };
    case 'pond':
      return { rows: POND, palette: CITY_PALETTE };
    case 'flowers':
      return { rows: FLOWERS, palette: CITY_PALETTE };
    case 'marketRed':
      return { rows: MARKET, palette: { ...CITY_PALETTE, X: C.oops } };
    case 'marketYellow':
      return { rows: MARKET, palette: { ...CITY_PALETTE, X: C.coin } };
    case 'house0':
    case 'house1':
      return {
        rows: BUILDING,
        palette: BUILDING_PALETTES[name === 'house0' ? 0 : 1] ?? ROBOT_PALETTE,
      };
    case 'factory':
      return { rows: FACTORY, palette: CITY_PALETTE };
    case 'chimney':
      return { rows: CHIMNEY, palette: CITY_PALETTE };
  }
}

/** What fills a cell: a picture (with the ground under it), the river, a bridge, or nothing. */
export type CellScenery =
  | { kind: 'art'; art: SceneryArt; ground: 'grass' | 'plain' }
  | { kind: 'water' }
  | { kind: 'bridge'; across: 'EW' | 'NS' }
  | { kind: 'none' };

/**
 * The scenery of every cell. A known board (`boardOfMap`) gives its districts; any other map
 * keeps city roofs on `#` cells, varied by position only (deterministic, never random).
 */
export function cityScenery(map: readonly string[]): CellScenery[][] {
  const board = boardOfMap(map);
  const crossing = (r: number, c: number): boolean => {
    const tile = map[r]?.[c];
    return tile !== undefined && tile !== '#';
  };
  return map.map((row, r) =>
    Array.from(row).map((tile, c): CellScenery => {
      const letter = (board?.scenery[r]?.[c] ?? '.') as RobotScenery;
      if (tile !== '#') {
        if (letter !== 'b') return { kind: 'none' };
        return { kind: 'bridge', across: crossing(r, c - 1) || crossing(r, c + 1) ? 'EW' : 'NS' };
      }
      // Position variants: a district of two cells shows two different pictures.
      const odd = (r + c) % 2 === 1;
      switch (letter) {
        case 'w':
          return { kind: 'water' };
        case 'v':
          return { kind: 'art', art: 'hut', ground: 'grass' };
        case 't':
          return { kind: 'art', art: 'bamboo', ground: 'grass' };
        case 'p':
          return {
            kind: 'art',
            art: (['flowers', 'tree', 'tree', 'pond'] as const)[(r % 2) * 2 + (c % 2)] ?? 'tree',
            ground: 'grass',
          };
        case 'm':
          return { kind: 'art', art: odd ? 'marketYellow' : 'marketRed', ground: 'plain' };
        case 'f':
          return {
            kind: 'art',
            art:
              map[r]?.[c + 1] === '#' && board?.scenery[r]?.[c + 1] === 'f' ? 'factory' : 'chimney',
            ground: 'plain',
          };
        case 'c':
        case '.':
        case 'b':
          return { kind: 'art', art: odd ? 'house1' : 'house0', ground: 'plain' };
      }
    }),
  );
}
