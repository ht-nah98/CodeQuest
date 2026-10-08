// Pixi-free pixel art of the world themes (P2-23, stage-rendering.md §7): the runner's ground
// tiles (18×18, the Kenney grid, so layout and feet stay where they are) and the maze's floor and
// wall tiles (12×12, as maze/pixelArt.ts), one character per texel, '.' transparent. Colours are
// letters of each theme's palette (sceneThemes.ts), all tokens or shades of tokens.
// Làng Tre has no entry: it keeps the Kenney ground and the maze's own bamboo tiles.

/**
 * Top ground tile of a runner cell: 2 outline rows (feet stand below them, `GRASS_OUTLINE_TEXELS`),
 * the walking surface, then what lies under it. Letters: `k` outline, the rest per theme.
 */
export interface GroundPatterns {
  top: readonly string[];
  fill: readonly string[];
}

/** Rừng Lặp Lại: thick moss on dark forest soil, roots and a fallen leaf. */
const FOREST_GROUND: GroundPatterns = {
  top: [
    'kkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkk',
    'mmmmmmmmmmmmmmmmmm',
    'MmMMMMmMMMMMMmMMMm',
    'MMMMMMMMMMMMMMMMMM',
    'MMMlMMMMMMMMMMMMMM',
    'MMMMMMMMMMMMlMMMMM',
    'dMMMMddMMMMMMddMMd',
    'ddMMddddMMMMddddMd',
    'dddddddddddddddddd',
    'ssssssssssssssssss',
    'sssssssssssSssssss',
    'ssssssssssssssssss',
    'ssssssdSssssssssss',
    'ssssssSdssspssssss',
    'sssssssssssppsssss',
    'sssssSssssssssssss',
    'ssssssssssssssssss',
  ],
  fill: [
    'ssssssssssssssssss',
    'sssssssssssssSssss',
    'sSssssssssssssssss',
    'ssssssssssssssssss',
    'sssssdssssssssssss',
    'ssssssdsssssssssps',
    'sspsssdsssssssssss',
    'ssppssdddsssssssss',
    'sssssssssdssssssss',
    'ssssssssssssssssss',
    'ssssssssssssSsssss',
    'ssssSsssssssssssss',
    'ssssssssssssspssss',
    'ssssssssssssppssss',
    'ssssssssssssssssss',
    'sssSssssssssssssss',
    'ssssssssssSsssssss',
    'ssssssssssssssssss',
  ],
};

/** Xưởng: a plank floor (light boards, nails) on darker beams. */
const WORKSHOP_GROUND: GroundPatterns = {
  top: [
    'kkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkk',
    'tttttttttttttttttt',
    'wwwwwwwwwwwwwwwwww',
    'wwWWWwwwwwwwwwWWww',
    'wwwwwwwwwWWWwwwwww',
    'wnwwwwwwwwwwwwwwnw',
    'wwwwwwwwwwwwwwwwww',
    'jjjjjjjjjjjjjjjjjj',
    'bbbbbbbbjbbbbbbbbb',
    'bBBbbbbbjbbbbbBBbb',
    'bbbbbbbbjbbbbbbbbb',
    'bbbbbBBbjbbbbbbbbb',
    'bbbbbbbbjbbbbbbbbb',
    'jjjjjjjjjjjjjjjjjj',
    'bbbbbbbbbbbbbjbbbb',
    'bbBBbbbbbbbbbjbbbb',
    'bbbbbbbbbbbbbjbbbb',
  ],
  fill: [
    'bbbbbbbbbbbbbjbbbb',
    'bbbbbbbBBbbbbjbbbb',
    'bbbbbbbbbbbbbjbbbb',
    'jjjjjjjjjjjjjjjjjj',
    'bbbbjbbbbbbbbbbbbb',
    'bBBbjbbbbbbbbBBbbb',
    'bbbbjbbbbbbbbbbbbb',
    'bbbbjbbbbbbBBbbbbb',
    'bbbbjbbbbbbbbbbbbb',
    'jjjjjjjjjjjjjjjjjj',
    'bbbbbbbbbbjbbbbbbb',
    'bbbbbBBbbbjbbbbbbb',
    'bbbbbbbbbbjbbbBBbb',
    'bbbbbbbbbbjbbbbbbb',
    'bbbbbbbbbbjbbbbbbb',
    'jjjjjjjjjjjjjjjjjj',
    'bbbbbbbbbbbbbjbbbb',
    'bbBBbbbbbbbbbjbbbb',
  ],
};

/** Ngã Ba: a dusty mountain path with dry tufts over layered rock. */
const MOUNTAIN_GROUND: GroundPatterns = {
  top: [
    'kkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkk',
    'dddddddddddddddddd',
    'dyddddddddddddyddd',
    'gyygggGggggggyygGg',
    'gggggggggGgggggggg',
    'ggGgggggggggggGggg',
    'rgggrrggggrrgggggr',
    'rrggrrrrggrrrrggrr',
    'rrrrrrrrrrrrrrrrrr',
    'ssssssssssssssssss',
    'rrrrrrrrrrrrrrrrrr',
    'rrRrrrrrrrrrrrrrrr',
    'rrrrrrrrRRrrrrrrrr',
    'RRRRrrrrrrrrrrRRRR',
    'ssssssssRRssssssss',
    'rrrrrrrrrrrrrrrrrr',
    'rrrrrRrrrrrrrrrrrr',
  ],
  fill: [
    'rrrrrrrrrrrrrrrrrr',
    'rrrrRrrrrrrrrrrrrr',
    'ssssssssssssssssss',
    'rrrrrrrrrrrRRrrrrr',
    'rrrrrrrrrrrrrrrrrr',
    'RRrrrrrrrrrrrrrRRR',
    'rRRRrrrrrrrrRRRRrr',
    'ssssssssssssssssss',
    'rrrrrrrrrrrrrrrrrr',
    'rrrrrrRrrrrrrrrrrr',
    'rrrrrrrrrrrrrRrrrr',
    'RRrrrrrrrrrrrrrrrR',
    'ssssssssssssssssss',
    'rrrrrrrrrrrrrrrrrr',
    'rrrrrrrrRRrrrrrrrr',
    'rrrRrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrrrr',
    'ssssssssssssssssss',
  ],
};

/** Sông: fresh riverbank grass over damp clay with pebbles and a shell. */
const RIVER_GROUND: GroundPatterns = {
  top: [
    'kkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkk',
    'mmmmmmmmmmmmmmmmmm',
    'mmMmmmmmmMmmmmmmMm',
    'MMMMMMMMMMMMMMMMMM',
    'MMMMMMMMMMMMMMMMMM',
    'MMMMMMMMMMMMMMMMMM',
    'DMMMMDDMMMMDDMMMMD',
    'DDMMDDDDMMDDDDMMDD',
    'DDDDDDDDDDDDDDDDDD',
    'cccccccccccccccccc',
    'cccccccccccCcccccc',
    'cccccccccccccccccc',
    'cccccccppccccccccc',
    'ccccccppppcccchccc',
    'cccCcccccccccccccc',
    'cccccccccccccccccc',
    'cccccccccccccCcccc',
  ],
  fill: [
    'cccccccccccccccccc',
    'cccccccccccccCcccc',
    'cCcccccccccccccccc',
    'cccccccccccccccccc',
    'ccccccccpccccccccc',
    'cccccccpppcccccccc',
    'cccccccccccccccCcc',
    'cccccccccccccccccc',
    'ccchcccccccccccccc',
    'cccccccccccccccccc',
    'cccccccccccCcccccc',
    'cccccccccccccccccc',
    'cCcccccccccccccccc',
    'cccccccccccccpcccc',
    'ccccccccccccpppccc',
    'cccccccccccccccccc',
    'ccccCccccccccccccc',
    'cccccccccccccccccc',
  ],
};

/** Thành Phố Robot: a kerb and paving slabs over light asphalt with grit. */
const CITY_GROUND: GroundPatterns = {
  top: [
    'kkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkk',
    'cccccccccccccccccc',
    'cCccccccccccccCccc',
    'ppppppppjppppppppj',
    'ppppppppjppppppppj',
    'pPppppppjppppPpppj',
    'ppppppppjppppppppj',
    'jjjjjjjjjjjjjjjjjj',
    'aaaaaaaaaaaaaaaaaa',
    'aaaaAaaaaaaaaaaaaa',
    'aaaaaaaaaaaaAaaaaa',
    'aaaaaaaaaaaaaaaaaa',
    'aAaaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaaaa',
    'aaaaaaaaaaAaaaaaaa',
    'aaaaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaAaa',
  ],
  fill: [
    'aaaaaaaaaaaaaaaaaa',
    'aaaAaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaAaaaaaa',
    'aaaaaaaaaaaaaaaaaa',
    'aaaaaaaAaaaaaaaaaa',
    'aaaaaaaaaaaaaaaaAa',
    'aaaaaaaaaaaaaaaaaa',
    'aAaaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaaaa',
    'aaaaaaaaaAaaaaaaaa',
    'aaaaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaAaaa',
    'aaaaAaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaAaaaaaa',
    'aaaaaaaaaaaaaaaaaa',
    'aaAaaaaaaaaaaaaaaa',
  ],
};

/** Ground patterns of the themes that draw their own ground (Làng Tre keeps Kenney's). */
export const GROUND_PATTERNS = {
  'rung-lap-lai': FOREST_GROUND,
  xuong: WORKSHOP_GROUND,
  'nga-ba': MOUNTAIN_GROUND,
  song: RIVER_GROUND,
  'thanh-pho-robot': CITY_GROUND,
} as const satisfies Record<string, GroundPatterns>;

/** The six runner ground pieces, named like the Kenney tiles they stand in for. */
export const GROUND_PIECES = [
  'ground',
  'ground_left',
  'ground_right',
  'dirt',
  'dirt_left',
  'dirt_right',
] as const;
export type GroundPiece = (typeof GROUND_PIECES)[number];

/**
 * One ground piece of a theme: the edge pieces (next to a hole, at the cliff after the flag) get
 * a 2-texel outline on that side, and a top piece a transparent outer corner, like Kenney's.
 */
export function groundPiece(patterns: GroundPatterns, piece: GroundPiece): string[] {
  const top = piece.startsWith('ground');
  const rows = [...(top ? patterns.top : patterns.fill)];
  const side = piece.endsWith('_left') ? 'left' : piece.endsWith('_right') ? 'right' : null;
  if (side === null) return rows;
  return rows.map((row, y) => {
    const width = row.length;
    const chars = Array.from(row);
    const cols = side === 'left' ? [0, 1] : [width - 2, width - 1];
    for (const x of cols) chars[x] = 'k';
    if (top && y === 0) chars[side === 'left' ? 0 : width - 1] = '.';
    return chars.join('');
  });
}

/** Maze floor and wall tiles of a theme (12×12; right column and bottom row are grout). */
export interface MazePatterns {
  floor: readonly string[];
  wall: readonly string[];
}

/** Rừng Lặp Lại: a mossy path with leaves between walls of dark bamboo. */
const FOREST_MAZE: MazePatterns = {
  floor: [
    'qqqqqqqqqqqr',
    'qqqqqqqqqqqr',
    'qqlqqqqqqqqr',
    'qlqqqqqqqqqr',
    'qqqqqqqrqqqr',
    'qqqqqqqqqqqr',
    'qqqqqqqqqlqr',
    'qrqqqqqqlqqr',
    'qqqqqqqqqqqr',
    'qqqqqqqqqqqr',
    'qqqqrqqqqqqr',
    'rrrrrrrrrrrr',
  ],
  wall: [
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
  ],
};

/** Xưởng: light floorboards with nails between dark plank walls held by iron bands. */
const WORKSHOP_MAZE: MazePatterns = {
  floor: [
    'pppppppppppr',
    'ppPPpppppppr',
    'pnpppppppnpr',
    'ooooooooooor',
    'ppppppoppppr',
    'pppPPPoppppr',
    'ppppppoppPpr',
    'ooooooooooor',
    'pppoppppppPr',
    'pPpoppppppnr',
    'pppoppppPppr',
    'rrrrrrrrrrrr',
  ],
  wall: [
    'WwhwWwhwWwhw',
    'WwhwWwhwWwhw',
    'WwhwWwhwWwhw',
    'WwhwWwhwWwhw',
    'WwhwWwhwWwhw',
    'iiiiiiiiiiii',
    'iIiiiiiiIiii',
    'WwhwWwhwWwhw',
    'WwhwWwhwWwhw',
    'WwhwWwhwWwhw',
    'WwhwWwhwWwhw',
    'WwhwWwhwWwhw',
  ],
};

/** Ngã Ba: a dusty path with pebbles between grey mountain boulders. */
const MOUNTAIN_MAZE: MazePatterns = {
  floor: [
    'qqqqqqqqqqqr',
    'qqqqqqqqnqqr',
    'qqnqqqqqqqqr',
    'qqqqqqqqqqqr',
    'qqqqqqqrqqqr',
    'qqqqqqqqqqqr',
    'qnqqqqqqqqqr',
    'qqqqqqqqqnqr',
    'qqqqqqqqqqqr',
    'qqqqnqqqqqqr',
    'qqqqqqqqqqqr',
    'rrrrrrrrrrrr',
  ],
  wall: [
    'RRsssRRRssRR',
    'RsSSssRsSSsR',
    'RsSsssRssssR',
    'RsssssRsssRR',
    'RRsssRRRRRRR',
    'RRRRRRsssssR',
    'RssRRsSSsssR',
    'RsSsRsSssssR',
    'RsssRssssssR',
    'RRsRRsssssRR',
    'RRRRRRssRRRR',
    'RRRRRRRRRRRR',
  ],
};

/** Sông: a sandy bank, and the river itself as the wall (Măng cannot walk on water). */
const RIVER_MAZE: MazePatterns = {
  floor: [
    'qqqqqqqqqqqr',
    'qqqqqqqqqqqr',
    'qqhqqqqqqqqr',
    'qqqqqqqqqqqr',
    'qqqqqqqnqqqr',
    'qqqqqqqqqqqr',
    'qqqqqqqqqqqr',
    'qnqqqqqqqqqr',
    'qqqqqqqqhqqr',
    'qqqqqqqqqqqr',
    'qqqqnqqqqqqr',
    'rrrrrrrrrrrr',
  ],
  wall: [
    'uuuuuuuuuuuu',
    'uuwwuuuuuuuu',
    'uUUuuuuuwwuu',
    'uuuuuuuuUUuu',
    'uuuuuuuuuuuu',
    'uuuuuwwuuuuu',
    'uuuuUUuuuuuu',
    'uwwuuuuuuuuu',
    'UUuuuuuuuwwu',
    'uuuuuuuuUUuu',
    'uuuuuuuuuuuu',
    'uuuuuuuuuuuu',
  ],
};

/** Thành Phố Robot: paving slabs between walls of city blocks with lit windows. */
const CITY_MAZE: MazePatterns = {
  floor: [
    'qqqqqqqqqqqr',
    'qqqqqqqqnqqr',
    'qqqqqqqqqqqr',
    'qqnqqqqqqqqr',
    'qqqqqqqqqqqr',
    'qqqqqqqqqqqr',
    'qqqqqqqnqqqr',
    'qnqqqqqqqqqr',
    'qqqqqqqqqqqr',
    'qqqqqnqqqqqr',
    'qqqqqqqqqqqr',
    'rrrrrrrrrrrr',
  ],
  wall: [
    'WWWWWWWWWWWW',
    'WwwwwwwwwwwW',
    'WwggwwggwwwW',
    'WwggwwggwwwW',
    'WwwwwwwwwwwW',
    'WwwwggwwggwW',
    'WwwwggwwggwW',
    'WwwwwwwwwwwW',
    'WwggwwggwwwW',
    'WwggwwggwwwW',
    'WwwwwwwwwwwW',
    'WWWWWWWWWWWW',
  ],
};

/** Maze tiles of the themes that draw their own (Làng Tre keeps maze/pixelArt.ts). */
export const MAZE_PATTERNS = {
  'rung-lap-lai': FOREST_MAZE,
  xuong: WORKSHOP_MAZE,
  'nga-ba': MOUNTAIN_MAZE,
  song: RIVER_MAZE,
  'thanh-pho-robot': CITY_MAZE,
} as const satisfies Record<string, MazePatterns>;
