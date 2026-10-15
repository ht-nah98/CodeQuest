import { describe, expect, it } from 'vitest';
import { gridPoint, onPaper } from '@codequest/games';
import {
  computeTurtleLayout,
  dashes,
  facingOf,
  gridDots,
  headingAngle,
  HUD_BAND_PX,
  linesLeft,
  PAPER_PAD,
  segmentPixels,
  toPixel,
} from './layout';

describe('turtle stage layout', () => {
  it('fits the paper with its pad inside the stage, under the HUD band', () => {
    const layout = computeTurtleLayout({ w: 8, h: 6 }, 800, 600, true);
    const { paper, unitPx } = layout;
    expect(paper.x).toBeGreaterThanOrEqual(0);
    expect(paper.y).toBeGreaterThanOrEqual(HUD_BAND_PX);
    expect(paper.x + paper.width).toBeLessThanOrEqual(800);
    expect(paper.y + paper.height).toBeLessThanOrEqual(600);
    expect(paper.width).toBeCloseTo((8 + 2 * PAPER_PAD) * unitPx);
    expect(layout.hudBand).toBe(HUD_BAND_PX);
    expect(computeTurtleLayout({ w: 8, h: 6 }, 800, 600, false).hudBand).toBe(0);
  });

  it('caps the unit step on a tiny paper', () => {
    expect(computeTurtleLayout({ w: 1, h: 1 }, 1200, 900, false).unitPx).toBe(96);
  });

  it('puts paper (0, 0) at the bottom-left and y up', () => {
    const layout = computeTurtleLayout({ w: 4, h: 4 }, 600, 600, false);
    const origin = toPixel(layout, gridPoint(0, 0));
    expect(origin).toEqual({ x: layout.originX, y: layout.originY });
    const up = toPixel(layout, gridPoint(0, 1));
    expect(up.x).toBeCloseTo(origin.x);
    expect(up.y).toBeCloseTo(origin.y - layout.unitPx);
    // One step at 60°: half a unit right, √3/2 up.
    const tilted = toPixel(layout, [1, 0, 0, 1]);
    expect(tilted.x - origin.x).toBeCloseTo(layout.unitPx / 2);
    expect(origin.y - tilted.y).toBeCloseTo((layout.unitPx * Math.sqrt(3)) / 2);
  });

  it('turns headings into screen angles and facing sides', () => {
    expect(headingAngle(0)).toBe(-0);
    expect(headingAngle(3)).toBeCloseTo(-Math.PI / 2);
    expect(facingOf(0, -1)).toBe(1);
    expect(facingOf(6, 1)).toBe(-1);
    expect(facingOf(11, -1)).toBe(1);
    expect(facingOf(3, -1)).toBe(-1);
    expect(facingOf(-3, 1)).toBe(1);
  });

  it('dots a square grid and a triangle grid on the paper', () => {
    expect(gridDots({ size: { w: 2, h: 1 }, grid: 'square' })).toHaveLength(6);
    // Rows at y = 0, √3/2 (≈ 0.87) for h = 1; the odd row is shifted by 1/2.
    const tri = gridDots({ size: { w: 2, h: 1 }, grid: 'tri' });
    expect(tri).toEqual([
      [0, 0, 0, 0],
      [2, 0, 0, 0],
      [4, 0, 0, 0],
      [1, 0, 0, 1],
      [3, 0, 0, 1],
    ]);
  });

  it('keeps every triangle dot on the paper, right edge included', () => {
    for (const w of [1, 2, 5, 12]) {
      for (const h of [1, 3, 12]) {
        const size = { w, h };
        const dots = gridDots({ size, grid: 'tri' });
        expect(dots.every((point) => onPaper(point, size))).toBe(true);
        // Even rows reach x = w; odd rows stop half a step short.
        expect(dots).toContainEqual([2 * w, 0, 0, 0]);
        expect(dots).not.toContainEqual([2 * w + 1, 0, 0, 1]);
      }
    }
  });

  it('cuts a dashed line into evenly spaced pieces that start and end on the line', () => {
    const pieces = dashes({ x: 0, y: 0 }, { x: 100, y: 0 }, 16, 12);
    expect(pieces.length).toBe(4);
    expect(pieces[0]?.[0]).toEqual({ x: 0, y: 0 });
    expect(pieces.at(-1)?.[1].x).toBeCloseTo(100);
    expect(dashes({ x: 0, y: 0 }, { x: 0, y: 0 }, 16, 12)).toEqual([]);
  });

  it('counts the target lines still to draw and draws a key at its ends', () => {
    const target = new Set(['a', 'b', 'c']);
    expect(linesLeft(target, new Set(['b', 'x']))).toBe(2);
    const layout = computeTurtleLayout({ w: 2, h: 2 }, 300, 300, false);
    const [p, q] = segmentPixels(layout, '0,0,0,0|2,0,0,0');
    expect(q.x - p.x).toBeCloseTo(layout.unitPx);
  });
});
