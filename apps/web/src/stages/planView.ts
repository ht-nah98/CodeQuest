// Geometry of the "Xem cả đường" view (P2-22, stage-rendering.md §4): a big static picture of
// the level in a window the child pans by dragging, the wheel or the arrow keys, and clicks to
// mark cells. Pure functions (no React, no DOM), unit tested in planView.test.ts.

export interface Size {
  width: number;
  height: number;
}

/** A pan is the content point (px) shown at the window's top-left corner. */
export interface Point {
  x: number;
  y: number;
}

/** The furthest pan on each axis; 0 on an axis where the content fits the window. */
export function maxPan(content: Size, view: Size): Point {
  return {
    x: Math.max(0, content.width - view.width),
    y: Math.max(0, content.height - view.height),
  };
}

/** `pan` kept inside the content, so no empty band ever shows past the first or last cell. */
export function clampPan(pan: Point, content: Size, view: Size): Point {
  const max = maxPan(content, view);
  return {
    x: Math.round(Math.min(max.x, Math.max(0, pan.x))),
    y: Math.round(Math.min(max.y, Math.max(0, pan.y))),
  };
}

/**
 * The pan after a mouse wheel turn. A track only scrolls sideways, so the plain wheel (deltaY)
 * moves it left/right; on content that also overflows downwards the plain wheel moves up/down
 * and Shift + wheel (or a sideways wheel, deltaX) moves left/right.
 */
export function wheelPan(
  pan: Point,
  wheel: { dx: number; dy: number; shift: boolean },
  content: Size,
  view: Size,
): Point {
  const vertical = maxPan(content, view).y > 0 && !wheel.shift;
  const sideways = vertical ? wheel.dx : wheel.dx + wheel.dy;
  return clampPan({ x: pan.x + sideways, y: pan.y + (vertical ? wheel.dy : 0) }, content, view);
}

/**
 * The pan after a key (arrows move one `step`, Home / End jump to the start / the end of the
 * row), or `null` for a key the view does not use.
 */
export function keyPan(
  pan: Point,
  key: string,
  step: Size,
  content: Size,
  view: Size,
): Point | null {
  const max = maxPan(content, view);
  const next: Record<string, Point> = {
    ArrowLeft: { x: pan.x - step.width, y: pan.y },
    ArrowRight: { x: pan.x + step.width, y: pan.y },
    ArrowUp: { x: pan.x, y: pan.y - step.height },
    ArrowDown: { x: pan.x, y: pan.y + step.height },
    Home: { x: 0, y: pan.y },
    End: { x: max.x, y: pan.y },
  };
  const target = next[key];
  return target === undefined ? null : clampPan(target, content, view);
}

/** The pan that puts the centre of `area` (content px) in the middle of the window, clamped. */
export function panToCentre(
  area: { x: number; y: number; width: number; height: number },
  content: Size,
  view: Size,
): Point {
  return clampPan(
    {
      x: area.x + area.width / 2 - view.width / 2,
      y: area.y + area.height / 2 - view.height / 2,
    },
    content,
    view,
  );
}

/** A grid of `cols` × `rows` cells of `cell` px starting at `origin` (content px). */
export interface CellGrid {
  cols: number;
  rows: number;
  cell: Size;
  origin?: Point;
}

/** The cell under content point `point`, or `null` outside the grid. */
export function cellAt(point: Point, grid: CellGrid): { row: number; col: number } | null {
  const x = point.x - (grid.origin?.x ?? 0);
  const y = point.y - (grid.origin?.y ?? 0);
  if (x < 0 || y < 0) return null;
  const col = Math.floor(x / grid.cell.width);
  const row = Math.floor(y / grid.cell.height);
  return col < grid.cols && row < grid.rows ? { row, col } : null;
}

/** A pointer that moved less than this (px) between press and release is a click, not a drag. */
export const CLICK_SLOP = 5;

/** Whether a press that moved by (dx, dy) before release is a click. */
export function isClick(dx: number, dy: number): boolean {
  return Math.hypot(dx, dy) < CLICK_SLOP;
}

/** `marks` with `key` added, or removed when it was there (the child's planning marks). */
export function toggleMark(marks: readonly string[], key: string): string[] {
  return marks.includes(key) ? marks.filter((mark) => mark !== key) : [...marks, key];
}
