// Pixi-free geometry of the maze stage, so it can be unit tested (stage-rendering.md §2).
import type { MazeCell, MazeDir } from '@codequest/games';
import { PANDA_FRAME_SIZE } from '../panda';

/** Maze tiles are drawn on a 12×12 texel grid (pixelArt.ts), shown at an integer scale. */
export const MAZE_TILE_TEXELS = 12;
/** A ring of wall drawn around the map, so bumping off the edge hits something visible. */
export const BORDER_CELLS = 1;
const MIN_TILE_SCALE = 1;
const MAX_TILE_SCALE = 6;
/** Free px kept around the bordered grid (room for Măng's head on the top row). */
const MARGIN_PX = 8;
/** Măng's visible body height, in cells: a little taller than her cell, like a figure on a board. */
const PANDA_CELLS = 1.4;
/**
 * …but never smaller than this many px, so she stays readable on a 12×12 map (stage-rendering.md
 * §2, art-direction.md §7 maze exception); she may then overflow her cell.
 */
export const PANDA_MIN_PX = 64;
/** Visible body / untrimmed frame height (≈ 236 of 280 px for the idle frames). */
const PANDA_BODY_SHARE = 0.84;
/** Feet stand this far below the cell centre, in cells, so the body sits inside the cell. */
const FEET_OFFSET = 0.3;

/** Bamboo counter panel: 12-texel icons at an integer scale, in rows at the top-left. */
export const HUD_MARGIN = 10;
export const HUD_PAD = 6;
export const HUD_GAP = 2;
/** Space kept between the counter panel and the board, in px. */
const HUD_BOARD_GAP = 6;

export interface HudLayout {
  /** Icon scale (1 or 2); 0 when the map has no bamboo (no panel, no band). */
  scale: number;
  iconPx: number;
  perRow: number;
  rows: number;
  panelWidth: number;
  panelHeight: number;
  /** Height reserved at the top of the stage, so the panel never covers the board. */
  band: number;
}

/** Lays out the bamboo counter for `count` shoots on a stage `width` px wide. */
export function hudLayout(count: number, width: number): HudLayout {
  if (count <= 0) {
    return { scale: 0, iconPx: 0, perRow: 0, rows: 0, panelWidth: 0, panelHeight: 0, band: 0 };
  }
  const room = width - 2 * HUD_MARGIN - 2 * HUD_PAD + HUD_GAP;
  const scale = count * (2 * MAZE_TILE_TEXELS + HUD_GAP) <= room ? 2 : 1;
  const iconPx = scale * MAZE_TILE_TEXELS;
  const perRow = Math.max(1, Math.min(count, Math.floor(room / (iconPx + HUD_GAP))));
  const rows = Math.ceil(count / perRow);
  const panelWidth = perRow * (iconPx + HUD_GAP) - HUD_GAP + 2 * HUD_PAD;
  const panelHeight = rows * (iconPx + HUD_GAP) - HUD_GAP + 2 * HUD_PAD;
  return {
    scale,
    iconPx,
    perRow,
    rows,
    panelWidth,
    panelHeight,
    band: HUD_MARGIN + panelHeight + HUD_BOARD_GAP - MARGIN_PX,
  };
}

export interface MazeLayout {
  width: number;
  height: number;
  rows: number;
  cols: number;
  /** Integer scale of the 12-texel tiles. */
  tileScale: number;
  cellPx: number;
  /** Top-left corner of map cell [0, 0]. */
  originX: number;
  originY: number;
  pandaScale: number;
  /** Feet below the cell centre, in px. */
  feetOffset: number;
  /** Height kept free at the top for the bamboo counter (0 without bamboo). */
  topBand: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Fits a `rows` × `cols` map plus its wall ring into a `width` × `height` stage, centred in the
 * area below a `topBand` px band (the bamboo counter, `hudLayout().band`).
 */
export function computeMazeLayout(
  rows: number,
  cols: number,
  width: number,
  height: number,
  topBand = 0,
): MazeLayout {
  const gridRows = rows + 2 * BORDER_CELLS;
  const gridCols = cols + 2 * BORDER_CELLS;
  const usableHeight = height - topBand;
  const fit = Math.min(
    (width - 2 * MARGIN_PX) / gridCols,
    (usableHeight - 2 * MARGIN_PX) / gridRows,
  );
  const tileScale = clamp(Math.floor(fit / MAZE_TILE_TEXELS), MIN_TILE_SCALE, MAX_TILE_SCALE);
  const cellPx = tileScale * MAZE_TILE_TEXELS;
  const originX = Math.round((width - gridCols * cellPx) / 2) + BORDER_CELLS * cellPx;
  const originY =
    topBand + Math.round((usableHeight - gridRows * cellPx) / 2) + BORDER_CELLS * cellPx;
  const pandaPx = Math.max(PANDA_MIN_PX, PANDA_CELLS * cellPx);
  return {
    width,
    height,
    rows,
    cols,
    tileScale,
    cellPx,
    originX,
    originY,
    pandaScale: pandaPx / (PANDA_FRAME_SIZE * PANDA_BODY_SHARE),
    feetOffset: Math.round(FEET_OFFSET * cellPx),
    topBand,
  };
}

/** Centre of cell (row, col) in px; fractional cells allowed during a move, ring cells too. */
export function cellCenter(layout: MazeLayout, row: number, col: number): { x: number; y: number } {
  return {
    x: layout.originX + (col + 0.5) * layout.cellPx,
    y: layout.originY + (row + 0.5) * layout.cellPx,
  };
}

/** One step in each direction, as [row, col]; N is up (row 0 is the top row). */
export const DIR_STEP: Readonly<Record<MazeDir, MazeCell>> = {
  N: [-1, 0],
  E: [0, 1],
  S: [1, 0],
  W: [0, -1],
};

/** The cell one step from `cell` in `dir` (may be outside the map). */
export function stepCell([r, c]: MazeCell, dir: MazeDir): MazeCell {
  const [dr, dc] = DIR_STEP[dir];
  return [r + dr, c + dc];
}

/** Screen angle of a direction in radians (x right, y down): E = 0, S = π/2, W = π, N = −π/2. */
export function dirAngle(dir: MazeDir): number {
  return { E: 0, S: Math.PI / 2, W: Math.PI, N: -Math.PI / 2 }[dir];
}

/** Signed rotation of a 90° turn from `from` to `to` (+π/2 clockwise = turn right). */
export function turnDelta(from: MazeDir, to: MazeDir): number {
  let delta = dirAngle(to) - dirAngle(from);
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta <= -Math.PI) delta += 2 * Math.PI;
  return delta;
}

/**
 * Măng only has side-view frames: she faces right (+1) for E, left (−1) for W, and keeps her
 * last side for N and S (the floor arrow shows those). `previous` is that last side.
 */
export function facingSign(dir: MazeDir, previous: 1 | -1): 1 | -1 {
  if (dir === 'E') return 1;
  if (dir === 'W') return -1;
  return previous;
}

/** How far the facing arrow sits from Măng's cell centre, in cells: past her head when facing N. */
export function arrowDistance(dir: MazeDir): number {
  return dir === 'N' ? 1.2 : 0.82;
}

/** Cells holding a tile, in reading order. */
export function cellsOf(map: readonly string[], tile: string): MazeCell[] {
  const cells: MazeCell[] = [];
  map.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) if (row[c] === tile) cells.push([r, c]);
  });
  return cells;
}

export const cellKey = ([r, c]: MazeCell): string => `${String(r)},${String(c)}`;

/** Bamboo still on the field: the map's `b` cells minus the ones collected (game-kind-sdk.md §1.2). */
export function remainingBamboo(
  map: readonly string[],
  collected: ReadonlySet<string>,
): MazeCell[] {
  return cellsOf(map, 'b').filter((cell) => !collected.has(cellKey(cell)));
}
