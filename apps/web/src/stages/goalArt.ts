// Pixel art of the goal cell (`level.goalSprite`, P2-11c, curriculum.md §5.0 and §5.4 T17a):
// one picture per sprite, drawn on the goal cell of the runner and maze stages (PixiJS) and of
// the static SVG pictures (track strip, "Xem cả đường", predict answer cards). Pixi-free.
// `flag` is the kinds' own flag (Kenney tiles on the runner, pixelArt.ts on the maze), so it has
// no entry here. Placeholders drawn in token colours until the artist's sprites arrive
// (docs/playbooks/add-asset.md, "Hình đích"); `friend` reuses the bunny avatar (Thỏ Bông).
import type { GoalSprite } from '@codequest/content-schema';
import { avatarArt } from '../ui/Avatar';
import { BLOCK_COLORS, UI_COLORS } from '../ui/tokens';
import { shade } from './colors';
import { PALETTE, type PixelImage, patternPixels } from './maze/pixelArt';

/** A goal picture: square rows of texels ('.' transparent) and the colour of each letter. */
export interface GoalArt {
  rows: readonly string[];
  palette: Readonly<Record<string, string>>;
}

/** Goal sprites with art of their own (every one but the kind's flag). */
export type GoalArtName = Exclude<GoalSprite, 'flag'>;

/** The maze palette plus wood browns, water and pink. */
const GOAL_PALETTE: Readonly<Record<string, string>> = {
  ...PALETTE,
  b: BLOCK_COLORS.robot,
  B: shade(BLOCK_COLORS.robot, 0.7),
  h: UI_COLORS.hint,
  u: UI_COLORS.sky,
};

/** Bác Cú's machine: a wooden box with a big gear, a chimney and a green lamp. */
const MACHINE = [
  '.kkk....kkk.',
  '.knk....kgk.',
  '.knk....kkk.',
  'kkkkkkkkkkk.',
  'kbbbbybbbbk.',
  'kbbyyyyybbk.',
  'kbbyyYyybbk.',
  'kbyyYkYyybk.',
  'kbbyyYyybbk.',
  'kbbyyyyybbk.',
  'kbbbbybbbbk.',
  'kkkkkkkkkkk.',
];

/** The way out of the storeroom: a lit doorway with a green arrow. */
const EXIT = [
  '...kkkkkk...',
  '..kbbbbbbk..',
  '.kbkkkkkkbk.',
  '.kbksssskbk.',
  '.kbkssgskbk.',
  '.kbkggggkbk.',
  '.kbkssgskbk.',
  '.kbksssskbk.',
  '.kbksssskbk.',
  '.kbksssskbk.',
  '.kbksssskbk.',
  'kkkkkkkkkkkk',
];

/** A little house with a red roof, a window and a door. */
const HOME = [
  '.....kk.....',
  '....kook....',
  '...kooook...',
  '..kooooook..',
  '.kooooooook.',
  'kkkkkkkkkkkk',
  '.kppppppppk.',
  '.kpuuppbbpk.',
  '.kpuuppbbpk.',
  '.kpppppbbpk.',
  '.kpppppbbpk.',
  'kkkkkkkkkkkk',
];

/** Two paw prints (Thỏ Bông's trail in Thế giới 4). */
const FOOTPRINTS = [
  '............',
  '......B.B.B.',
  '............',
  '.......BBB..',
  '......BBBBB.',
  '.......BBB..',
  '.B.B.B......',
  '............',
  '..BBB.......',
  '.BBBBB......',
  '..BBB.......',
  '............',
];

/** A closed cage with a padlock. */
const CAGE = [
  '.....kk.....',
  '....k..k....',
  '.kkkkkkkkkk.',
  '.kBBBBBBBBk.',
  '.kkkkkkkkkk.',
  '.kn.n.n.n.k.',
  '.kn.n.n.n.k.',
  '.kn.yyyy.nk.',
  '.kn.yYYy.nk.',
  '.kn.n.n.n.k.',
  '.kBBBBBBBBk.',
  '.kkkkkkkkkk.',
];

/** A wooden landing stage over the river. */
const DOCK = [
  '.kkk....kkk.',
  '.kbk....kbk.',
  '.kbk....kbk.',
  'kkkkkkkkkkkk',
  'kbbBbbBbbBbk',
  'kbbBbbBbbBbk',
  'kkkkkkkkkkkk',
  '.kBk....kBk.',
  'ukBkuuuukBku',
  'uummuuuummuu',
  'uuuuuuuuuuuu',
  'uuuummuuuuuu',
];

/** Token colour of an avatar fill class (`fill-paper-2` → paper2, `fill-block-var` → var). */
function fillHex(fill: string): string {
  const name = fill.replace(/^fill-/, '');
  const camel = name.replace(/-(\w)/g, (_, ch: string) => ch.toUpperCase());
  if (name.startsWith('block-')) {
    const block = camel.slice('block'.length).toLowerCase();
    return BLOCK_COLORS[block as keyof typeof BLOCK_COLORS];
  }
  return UI_COLORS[camel as keyof typeof UI_COLORS];
}

/** Thỏ Bông: the bunny avatar (16×16), so the friend looks like her profile picture. */
function friendArt(): GoalArt {
  const { map, fills } = avatarArt('bunny');
  return {
    rows: map,
    palette: Object.fromEntries(Object.entries(fills).map(([ch, fill]) => [ch, fillHex(fill)])),
  };
}

export const GOAL_ART: Readonly<Record<GoalArtName, GoalArt>> = {
  machine: { rows: MACHINE, palette: GOAL_PALETTE },
  exit: { rows: EXIT, palette: GOAL_PALETTE },
  home: { rows: HOME, palette: GOAL_PALETTE },
  footprints: { rows: FOOTPRINTS, palette: GOAL_PALETTE },
  friend: friendArt(),
  cage: { rows: CAGE, palette: GOAL_PALETTE },
  dock: { rows: DOCK, palette: GOAL_PALETTE },
};

/** The art drawn instead of the flag, or `null` for the default flag (no sprite, or `flag`). */
export function goalArt(sprite: GoalSprite | undefined): GoalArt | null {
  return sprite === undefined || sprite === 'flag' ? null : GOAL_ART[sprite];
}

/** RGBA texels of a goal picture (a PIXI texture source). */
export function goalPixels(art: GoalArt): PixelImage {
  return patternPixels(art.rows, art.palette);
}

/** One horizontal run of same-coloured texels: an SVG picture is one rect per run. */
export interface GoalRun {
  x: number;
  y: number;
  w: number;
  color: string;
}

/** The runs of a goal picture, row by row (transparent texels skipped). */
export function goalRuns(art: GoalArt): GoalRun[] {
  const runs: GoalRun[] = [];
  art.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row.charAt(x);
      let end = x + 1;
      while (end < row.length && row.charAt(end) === ch) end += 1;
      const color = art.palette[ch];
      if (ch !== '.' && color !== undefined) runs.push({ x, y, w: end - x, color });
      x = end;
    }
  });
  return runs;
}

/**
 * The integer zoom of a goal picture inside a cell `cellPx` wide (crisp texels), at least 1:
 * 12-texel art fills a maze cell exactly; the 16-texel friend sits a little smaller.
 */
export function goalScale(art: GoalArt, cellPx: number): number {
  return Math.max(1, Math.floor(cellPx / art.rows.length));
}
