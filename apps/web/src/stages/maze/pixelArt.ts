// Pixi-free pixel art of the maze stage: one character per texel, '.' is transparent.
// Drawn for the project in token colours (ui/tokens.ts) on a 12-texel grid, shown at integer scales.
import { BLOCK_COLORS, UI_COLORS } from '../../ui/tokens';
import { shade } from '../colors';

/** Colours of the maze art: tokens, plus two shades derived from them (path grout, leaf green). */
export const PALETTE: Readonly<Record<string, string>> = {
  k: UI_COLORS.ink,
  n: UI_COLORS.inkSoft,
  w: UI_COLORS.white,
  p: UI_COLORS.paper,
  q: UI_COLORS.paper2,
  /** Grout and pebbles of the path: paper2 a step darker. */
  r: shade(UI_COLORS.paper2, 0.93),
  g: UI_COLORS.go,
  G: UI_COLORS.goDeep,
  /** Light bamboo green for highlights. */
  l: shade(UI_COLORS.go, 1.35),
  y: UI_COLORS.coin,
  Y: UI_COLORS.coinDeep,
  s: UI_COLORS.coinShine,
  o: UI_COLORS.oops,
  /** Same blue as the movement blocks, so the facing arrow matches "tiến / rẽ". */
  m: BLOCK_COLORS.move,
};

/** Sandy path; right and bottom edges are grout, so cells are easy to count. */
const FLOOR = [
  'qqqqqqqqqqqr',
  'qqqqqqqqqqqr',
  'qqrqqqqqqqqr',
  'qqqqqqqqqqqr',
  'qqqqqqqrqqqr',
  'qqqqqqqqqqqr',
  'qqqqqqqqqqqr',
  'qrqqqqqqqqqr',
  'qqqqqqqqrqqr',
  'qqqqqqqqqqqr',
  'qqqqrqqqqqqr',
  'rrrrrrrrrrrr',
];

/** Three bamboo stalks with staggered nodes; neighbouring wall cells join into a grove. */
const WALL = [
  'GglgGGGGGglg',
  'GglgGlllGglg',
  'GGGGGglgGglg',
  'GlllGglgGglg',
  'GglgGglgGGGG',
  'GglgGglgGlll',
  'GglgGGGGGglg',
  'GglgGlllGglg',
  'GGGGGglgGglg',
  'GlllGglgGglg',
  'GglgGglgGGGG',
  'GglgGglgGlll',
];

/** A bamboo shoot (măng), the collectible. */
const BAMBOO = [
  '............',
  '.....kk.....',
  '.....kgk....',
  '....kglk....',
  '....kggk....',
  '...kYyyYk...',
  '...kyYsyk...',
  '..kYyyYyyk..',
  '..kyYyyYyk..',
  '..kYyyYyyk..',
  '...kkkkkk...',
  '............',
];

/** Gold frame around the goal cell (the path shows through). */
const GOAL_PAD = [
  'YYYYYYYYYYYY',
  'YyyyyyyyyyyY',
  'Yy........yY',
  'Yy........yY',
  'Yy........yY',
  'Yy........yY',
  'Yy........yY',
  'Yy........yY',
  'Yy........yY',
  'Yy........yY',
  'YyyyyyyyyyyY',
  'YYYYYYYYYYYY',
];

/** The goal flag, two frames of waving. */
const FLAG_1 = [
  '..kn........',
  '..knkkkkk...',
  '..knooooook.',
  '..knowooook.',
  '..knooooook.',
  '..knooooook.',
  '..knkkkkkk..',
  '..kn........',
  '..kn........',
  '..kn........',
  '.kkkk.......',
  'kkkkkk......',
];
const FLAG_2 = [
  '..kn........',
  '..knkkkkk...',
  '..knoooookk.',
  '..knowoooook',
  '..knoooooook',
  '..knooookk..',
  '..knkkkk....',
  '..kn........',
  '..kn........',
  '..kn........',
  '.kkkk.......',
  'kkkkkk......',
];

/** Facing arrow, pointing east; the stage rotates it. Blue like the movement blocks. */
const ARROW = [
  '.....kk....',
  '.....kmk...',
  'kkkkkkmmk..',
  'kwwwwwwmmk.',
  'kmmmmmmmmmk',
  'kmmmmmmmmk.',
  'kkkkkkmmk..',
  '.....kmk...',
  '.....kk....',
];

/** A little sparkle: dizzy stars, collect and win bursts. */
const SPARKLE = ['...k...', '..kyk..', '.kysyk.', 'kysssyk', '.kysyk.', '..kyk..', '...k...'];

export const PATTERNS = {
  floor: FLOOR,
  wall: WALL,
  bamboo: BAMBOO,
  goalPad: GOAL_PAD,
  flag1: FLAG_1,
  flag2: FLAG_2,
  arrow: ARROW,
  sparkle: SPARKLE,
} as const satisfies Record<string, readonly string[]>;
export type PatternName = keyof typeof PATTERNS;

export interface PixelImage {
  width: number;
  height: number;
  /** RGBA, row by row; transparent texels are (0, 0, 0, 0). */
  data: Uint8Array;
}

/**
 * Turns a pattern into RGBA texels (colours from `palette`, the maze's by default); throws on
 * ragged rows or unknown characters.
 */
export function patternPixels(
  pattern: readonly string[],
  palette: Readonly<Record<string, string>> = PALETTE,
): PixelImage {
  const height = pattern.length;
  const width = pattern[0]?.length ?? 0;
  const data = new Uint8Array(width * height * 4);
  pattern.forEach((row, y) => {
    if (row.length !== width)
      throw new Error(`pattern row ${String(y)} is not ${String(width)} wide`);
    for (let x = 0; x < width; x++) {
      const char = row.charAt(x);
      if (char === '.') continue;
      const hex = palette[char];
      if (hex === undefined) throw new Error(`unknown pattern colour "${char}"`);
      const value = Number.parseInt(hex.slice(1), 16);
      const i = (y * width + x) * 4;
      data[i] = (value >> 16) & 0xff;
      data[i + 1] = (value >> 8) & 0xff;
      data[i + 2] = value & 0xff;
      data[i + 3] = 0xff;
    }
  });
  return { width, height, data };
}
