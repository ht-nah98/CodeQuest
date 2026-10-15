// Pixi-free geometry of the turtle stage (ADR-0024 §9), so it can be unit tested. The only place
// where lattice points (exact Z[√3], `@codequest/games`) become floating-point pixels.
import {
  onPaper,
  parseSegmentKey,
  toXY,
  type TurtleConfig,
  type TurtlePoint,
} from '@codequest/games';
import { PANDA_FRAME_SIZE } from '../panda';

/** Free px around the paper. */
const MARGIN_PX = 16;
/** Height kept at the top of the stage for the "Còn 5 nét" chip. */
export const HUD_BAND_PX = 44;
/** Paper drawn around the outer dots, in unit steps, so edge dots and lines are not cut. */
export const PAPER_PAD = 0.5;
/** Largest unit step in px: a 2 × 2 picture should not fill a whole wide stage. */
const MAX_UNIT_PX = 96;
const MIN_UNIT_PX = 8;
/** Măng's visible height in unit steps, never below `PANDA_MIN_PX`. */
const PANDA_UNITS = 1.15;
const PANDA_MIN_PX = 56;
/** Visible body / untrimmed frame height (as in the maze, ≈ 236 of 280 px). */
const PANDA_BODY_SHARE = 0.84;

export interface TurtleLayout {
  /** Px per unit step. */
  unitPx: number;
  /** Pixel of paper point (0, 0), the bottom-left dot. */
  originX: number;
  originY: number;
  /** The paper sheet in px (dots plus `PAPER_PAD`). */
  paper: { x: number; y: number; width: number; height: number };
  /** Scale of Măng's frames. */
  pandaScale: number;
  /** Height reserved for the HUD (0 without target). */
  hudBand: number;
}

/** Lays the paper of `size` out in a `width` × `height` stage, centred below the HUD band. */
export function computeTurtleLayout(
  size: { readonly w: number; readonly h: number },
  width: number,
  height: number,
  hud: boolean,
): TurtleLayout {
  const hudBand = hud ? HUD_BAND_PX : 0;
  const roomW = Math.max(1, width - 2 * MARGIN_PX);
  const roomH = Math.max(1, height - hudBand - 2 * MARGIN_PX);
  const unitPx = Math.max(
    MIN_UNIT_PX,
    Math.min(MAX_UNIT_PX, roomW / (size.w + 2 * PAPER_PAD), roomH / (size.h + 2 * PAPER_PAD)),
  );
  const paperW = (size.w + 2 * PAPER_PAD) * unitPx;
  const paperH = (size.h + 2 * PAPER_PAD) * unitPx;
  const left = (width - paperW) / 2;
  const top = hudBand + (height - hudBand - paperH) / 2;
  const pandaPx = Math.max(PANDA_MIN_PX, unitPx * PANDA_UNITS);
  return {
    unitPx,
    originX: left + PAPER_PAD * unitPx,
    originY: top + paperH - PAPER_PAD * unitPx,
    paper: { x: left, y: top, width: paperW, height: paperH },
    pandaScale: pandaPx / (PANDA_FRAME_SIZE * PANDA_BODY_SHARE),
    hudBand,
  };
}

/** Pixel of a lattice point (paper y goes up, screen y goes down). */
export function toPixel(layout: TurtleLayout, point: TurtlePoint): { x: number; y: number } {
  const { x, y } = toXY(point);
  return { x: layout.originX + x * layout.unitPx, y: layout.originY - y * layout.unitPx };
}

/** Screen angle (radians, clockwise from the right, as PixiJS rotates) of a heading 0…11. */
export function headingAngle(heading: number): number {
  return (-heading * Math.PI) / 6;
}

/** Măng looks right (+1) or left (−1) for a heading; straight up / down keep `previous`. */
export function facingOf(heading: number, previous: number): number {
  const h = ((heading % 12) + 12) % 12;
  if (h === 3 || h === 9) return previous;
  return h < 3 || h > 9 ? 1 : -1;
}

/**
 * Dots of the paper: every whole point (`square`) or a triangle lattice of unit steps whose rows
 * are √3/2 apart, odd rows shifted by 1/2 (`tri`). All are lattice points on the paper.
 */
export function gridDots(config: Pick<TurtleConfig, 'size' | 'grid'>): TurtlePoint[] {
  const { w, h } = config.size;
  const dots: TurtlePoint[] = [];
  if (config.grid === 'square') {
    for (let y = 0; y <= h; y++) for (let x = 0; x <= w; x++) dots.push([2 * x, 0, 2 * y, 0]);
    return dots;
  }
  // Row k at y = k·√3/2: `[a, 0, 0, k]` with a = 2i + (k odd).
  for (let k = 0; ; k++) {
    const row: TurtlePoint[] = [];
    for (let a = k % 2; a <= 2 * w; a += 2) {
      const point: TurtlePoint = [a, 0, 0, k];
      if (onPaper(point, config.size)) row.push(point);
    }
    if (!onPaper([k % 2, 0, 0, k], config.size)) break;
    dots.push(...row);
  }
  return dots;
}

/** Pieces of a dashed line from `from` to `to` (px): `dash` drawn, `gap` left out, from the start. */
export function dashes(
  from: { x: number; y: number },
  to: { x: number; y: number },
  dash: number,
  gap: number,
): Array<[{ x: number; y: number }, { x: number; y: number }]> {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (length === 0 || dash <= 0) return [];
  const ux = (to.x - from.x) / length;
  const uy = (to.y - from.y) / length;
  const pieces: Array<[{ x: number; y: number }, { x: number; y: number }]> = [];
  // Centre the pattern so both ends of a unit segment look the same.
  const period = dash + gap;
  const count = Math.max(1, Math.round((length + gap) / period));
  const used = count * dash + (count - 1) * gap;
  const scale = length / used;
  let at = 0;
  for (let i = 0; i < count; i++) {
    const start = at;
    const end = at + dash * scale;
    pieces.push([
      { x: from.x + ux * start, y: from.y + uy * start },
      { x: from.x + ux * end, y: from.y + uy * end },
    ]);
    at = end + gap * scale;
  }
  return pieces;
}

/** Target segments not drawn yet. */
export function linesLeft(target: ReadonlySet<string>, drawn: ReadonlySet<string>): number {
  let left = 0;
  for (const key of target) if (!drawn.has(key)) left++;
  return left;
}

/** Both ends of a segment key in px. */
export function segmentPixels(
  layout: TurtleLayout,
  key: string,
): [{ x: number; y: number }, { x: number; y: number }] {
  const [p, q] = parseSegmentKey(key);
  return [toPixel(layout, p), toPixel(layout, q)];
}
