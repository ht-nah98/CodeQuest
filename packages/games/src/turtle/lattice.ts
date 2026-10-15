/**
 * Exact turtle geometry (ADR-0024 §2): every point is `x = (a + b√3) / 2`, `y = (c + d√3) / 2`
 * with whole `a, b, c, d`, because cos and sin of a multiple of 30° are in {0, ±1/2, ±√3/2, ±1}.
 * No floating point anywhere, so two programs that draw the same picture meet the same keys.
 * Paper coordinates: x to the right, y **up**, origin at the bottom-left corner of the paper;
 * heading 0 = east, counting 30° steps counter-clockwise (3 = north). The stage flips y.
 */

/** A lattice point `[a, b, c, d]`: `x = (a + b√3) / 2`, `y = (c + d√3) / 2`. Plain JSON. */
export type TurtlePoint = readonly [number, number, number, number];

/** Headings are whole multiples of 30°: 0…11. */
export const HEADINGS = 12;

/** Degrees per heading step. */
export const HEADING_DEGREES = 30;

/** Twice the unit step of each heading, as `[a, b, c, d]` (index = heading). */
const UNIT: readonly TurtlePoint[] = [
  [2, 0, 0, 0],
  [0, 1, 1, 0],
  [1, 0, 0, 1],
  [0, 0, 2, 0],
  [-1, 0, 0, 1],
  [0, -1, 1, 0],
  [-2, 0, 0, 0],
  [0, -1, -1, 0],
  [-1, 0, 0, -1],
  [0, 0, -2, 0],
  [1, 0, 0, -1],
  [0, 1, -1, 0],
];

/** The heading in 0…11 for any whole number of 30° steps. */
export function normalizeHeading(heading: number): number {
  return ((heading % HEADINGS) + HEADINGS) % HEADINGS;
}

/** The lattice point of a whole paper point `(x, y)`. */
export function gridPoint(x: number, y: number): TurtlePoint {
  return [2 * x, 0, 2 * y, 0];
}

/** One unit step from `point` towards `heading`. */
export function step(point: TurtlePoint, heading: number): TurtlePoint {
  const unit = UNIT[normalizeHeading(heading)] ?? [0, 0, 0, 0];
  return [point[0] + unit[0], point[1] + unit[1], point[2] + unit[2], point[3] + unit[3]];
}

/** Sign (-1, 0, 1) of `p + q√3`, exactly. */
export function signOf(p: number, q: number): number {
  const sp = Math.sign(p);
  const sq = Math.sign(q);
  if (sp === sq || sq === 0) return sp;
  if (sp === 0) return sq;
  // Opposite signs: the larger of p² and 3q² wins.
  const diff = p * p - 3 * q * q;
  return diff === 0 ? 0 : diff > 0 ? sp : sq;
}

/** Whether `point` lies on the paper `0 ≤ x ≤ w`, `0 ≤ y ≤ h` (edges included). */
export function onPaper(
  point: TurtlePoint,
  size: { readonly w: number; readonly h: number },
): boolean {
  const [a, b, c, d] = point;
  // 0 ≤ (a + b√3) / 2 ≤ w  ⇔  a + b√3 ≥ 0  and  (a − 2w) + b√3 ≤ 0; same for y.
  return (
    signOf(a, b) >= 0 &&
    signOf(a - 2 * size.w, b) <= 0 &&
    signOf(c, d) >= 0 &&
    signOf(c - 2 * size.h, d) <= 0
  );
}

/** Stable text of a point, `a,b,c,d`. */
export function pointKey(point: TurtlePoint): string {
  return point.join(',');
}

/** The point of a `pointKey`. */
export function parsePointKey(key: string): TurtlePoint {
  const [a = 0, b = 0, c = 0, d = 0] = key.split(',').map(Number);
  return [a, b, c, d];
}

/** Stable text of the unit segment between `p` and `q`, whatever the drawing direction. */
export function segmentKey(p: TurtlePoint, q: TurtlePoint): string {
  const [first, second] = [pointKey(p), pointKey(q)].sort();
  return `${first ?? ''}|${second ?? ''}`;
}

/** Both ends of a `segmentKey`. */
export function parseSegmentKey(key: string): [TurtlePoint, TurtlePoint] {
  const [p = '', q = ''] = key.split('|');
  return [parsePointKey(p), parsePointKey(q)];
}

/** Paper coordinates as numbers, for the stage only (never in state or keys). */
export function toXY(point: TurtlePoint): { x: number; y: number } {
  const root3 = Math.sqrt(3);
  return { x: (point[0] + point[1] * root3) / 2, y: (point[2] + point[3] * root3) / 2 };
}
