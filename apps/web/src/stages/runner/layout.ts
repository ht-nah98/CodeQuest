// Pixi-free geometry of the runner stage, so it can be unit tested (stage-rendering.md §2).
import { PANDA_FRAME_SIZE } from '../panda';
import { GRASS_OUTLINE_TEXELS, TILE_SIZE } from '../tileGrid';

/** Each runner cell is this many tiles wide. */
export const CELL_TILES = 2;
const MIN_TILE_SCALE = 2;
const MAX_TILE_SCALE = 4;
/** Share of the stage height above the ground line (sky). */
const GROUND_LINE = 0.66;
/** Măng's height on screen: art-direction.md §7 asks for 96–160 px. */
const PANDA_MIN_PX = 96;
const PANDA_MAX_PX = 150;
const PANDA_HEIGHT_SHARE = 0.34;
/**
 * Măng's on-screen height counts this share of the 280 px frame box (≈ 235 px). The idle frames
 * themselves are 217 / 219 px tall (panda.json), so she stands ≈ 0.92 × that height.
 */
const PANDA_BODY_SHARE = 0.84;

export interface RunnerLayout {
  width: number;
  height: number;
  /** Integer scale of the 18 px Kenney tiles. */
  tileScale: number;
  tilePx: number;
  cellPx: number;
  /** x of the left edge of cell 0, in world coordinates. */
  originX: number;
  /** y of the top of the ground row. */
  groundTop: number;
  /** y where Măng's feet stand (just below the grass outline). */
  feetY: number;
  pandaScale: number;
  /** Width of the scrolling world; equals `width` when the track fits. */
  worldWidth: number;
  /** Whether the camera follows Măng (the track is wider than the stage). */
  scrolls: boolean;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Fits `cellCount` cells plus one cell of margin into a `width` × `height` stage. */
export function computeRunnerLayout(
  cellCount: number,
  width: number,
  height: number,
): RunnerLayout {
  const tileScale = clamp(
    Math.floor(width / ((cellCount + 1) * CELL_TILES * TILE_SIZE)),
    MIN_TILE_SCALE,
    MAX_TILE_SCALE,
  );
  const tilePx = TILE_SIZE * tileScale;
  const cellPx = tilePx * CELL_TILES;
  const trackPx = cellCount * cellPx;
  const scrolls = trackPx + cellPx > width;
  // Centred when it fits; otherwise half a cell of ground before the start and after the flag.
  const originX = scrolls ? cellPx : Math.round((width - trackPx) / 2 / tilePx) * tilePx;
  const worldWidth = scrolls ? trackPx + 2 * cellPx : width;
  const groundTop = Math.round(height * GROUND_LINE);
  const pandaPx = clamp(height * PANDA_HEIGHT_SHARE, PANDA_MIN_PX, PANDA_MAX_PX);
  return {
    width,
    height,
    tileScale,
    tilePx,
    cellPx,
    originX,
    groundTop,
    feetY: groundTop + GRASS_OUTLINE_TEXELS * tileScale,
    pandaScale: pandaPx / (PANDA_FRAME_SIZE * PANDA_BODY_SHARE),
    worldWidth,
    scrolls,
  };
}

/** x of the centre of cell `cell` (fractional cells allowed during a move). */
export function cellCenterX(layout: RunnerLayout, cell: number): number {
  return layout.originX + (cell + 0.5) * layout.cellPx;
}

/** Camera offset that keeps Măng a little left of centre, clamped to the world. */
export function cameraX(layout: RunnerLayout, pandaX: number): number {
  if (!layout.scrolls) return 0;
  return clamp(pandaX - layout.width * 0.4, 0, layout.worldWidth - layout.width);
}

/**
 * Camera offset that puts the left edge of the view at cell `leftCell` (fractional), clamped to
 * the world like `cameraX`: the child drags the full-track strip while Măng is idle (P2-22).
 */
export function peekCameraX(layout: RunnerLayout, leftCell: number): number {
  if (!layout.scrolls) return 0;
  return clamp(layout.originX + leftCell * layout.cellPx, 0, layout.worldWidth - layout.width);
}
