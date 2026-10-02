import { describe, expect, it } from 'vitest';
import { MAZE_DIRS } from '@codequest/games';
import {
  arrowDistance,
  cellCenter,
  cellKey,
  cellsOf,
  computeMazeLayout,
  dirAngle,
  facingSign,
  HUD_MARGIN,
  hudLayout,
  MAZE_TILE_TEXELS,
  PANDA_MIN_PX,
  remainingBamboo,
  stepCell,
  turnDelta,
} from './layout';
import { PALETTE, PATTERNS, patternPixels } from './pixelArt';

describe('computeMazeLayout', () => {
  it('fits a 5×5 map and its wall ring into the play column at 1280×720', () => {
    const layout = computeMazeLayout(5, 5, 516, 360);
    expect(layout.tileScale).toBe(4);
    expect(layout.cellPx).toBe(4 * MAZE_TILE_TEXELS);
    // The ring of 7×7 cells is centred and inside the stage.
    const left = layout.originX - layout.cellPx;
    const top = layout.originY - layout.cellPx;
    expect(left).toBeGreaterThanOrEqual(0);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(left + 7 * layout.cellPx).toBeLessThanOrEqual(516);
    expect(top + 7 * layout.cellPx).toBeLessThanOrEqual(360);
    expect(Math.abs(left - (516 - (left + 7 * layout.cellPx)))).toBeLessThanOrEqual(1);
  });

  it('keeps integer tile scales from 1 up to 6', () => {
    expect(computeMazeLayout(12, 12, 516, 360).tileScale).toBe(2);
    expect(computeMazeLayout(12, 12, 100, 100).tileScale).toBe(1);
    expect(computeMazeLayout(3, 3, 3000, 3000).tileScale).toBe(6);
    for (const [w, h] of [
      [516, 360],
      [553, 408],
      [800, 500],
    ] as const) {
      expect(Number.isInteger(computeMazeLayout(8, 6, w, h).tileScale)).toBe(true);
    }
  });

  it('is limited by the short side of the stage', () => {
    // A wide map in a tall stage is limited by the width.
    const wide = computeMazeLayout(3, 12, 400, 900);
    expect(14 * wide.cellPx).toBeLessThanOrEqual(400);
    const tall = computeMazeLayout(12, 3, 900, 400);
    expect(14 * tall.cellPx).toBeLessThanOrEqual(400);
  });

  it('makes Măng a little taller than her cell, feet below the centre', () => {
    const layout = computeMazeLayout(5, 5, 516, 360);
    expect(layout.pandaScale * 280 * 0.84).toBeCloseTo(1.4 * layout.cellPx);
    expect(layout.feetOffset).toBeGreaterThan(0);
    expect(layout.feetOffset).toBeLessThan(layout.cellPx / 2);
  });

  it('never makes Măng smaller than PANDA_MIN_PX, even on a 12×12 map', () => {
    const layout = computeMazeLayout(12, 12, 516, 360);
    expect(layout.pandaScale * 280 * 0.84).toBeCloseTo(PANDA_MIN_PX);
  });

  it('keeps the bamboo counter band clear of the board', () => {
    for (const [rows, cols, count] of [
      [12, 12, 5],
      [3, 3, 2],
      [12, 12, 40],
    ] as const) {
      const hud = hudLayout(count, 516);
      const layout = computeMazeLayout(rows, cols, 516, 360, hud.band);
      const boardTop = layout.originY - layout.cellPx; // top of the wall ring
      expect(boardTop).toBeGreaterThanOrEqual(HUD_MARGIN + hud.panelHeight + 3);
      expect(boardTop + (rows + 2) * layout.cellPx).toBeLessThanOrEqual(360);
    }
  });

  it('gives cell centres in px, ring cells included', () => {
    const layout = computeMazeLayout(5, 5, 516, 360);
    expect(cellCenter(layout, 0, 0)).toEqual({
      x: layout.originX + layout.cellPx / 2,
      y: layout.originY + layout.cellPx / 2,
    });
    expect(cellCenter(layout, -1, 2).y).toBe(layout.originY - layout.cellPx / 2);
    expect(cellCenter(layout, 1.5, 0).y).toBe(layout.originY + 2 * layout.cellPx);
  });
});

describe('hudLayout', () => {
  it('has no band without bamboo', () => {
    expect(hudLayout(0, 516).band).toBe(0);
  });

  it('uses ×2 icons when they fit, then ×1, then wraps without overflowing', () => {
    expect(hudLayout(3, 516).scale).toBe(2);
    expect(hudLayout(25, 516).scale).toBe(1);
    const many = hudLayout(60, 516);
    expect(many.rows).toBeGreaterThan(1);
    expect(HUD_MARGIN + many.panelWidth).toBeLessThanOrEqual(516 - HUD_MARGIN);
    expect(many.perRow * many.rows).toBeGreaterThanOrEqual(60);
  });
});

describe('directions', () => {
  it('steps one cell, N up and E right, also off the map', () => {
    expect(stepCell([1, 1], 'N')).toEqual([0, 1]);
    expect(stepCell([1, 1], 'E')).toEqual([1, 2]);
    expect(stepCell([1, 1], 'S')).toEqual([2, 1]);
    expect(stepCell([1, 1], 'W')).toEqual([1, 0]);
    // Bump off the edge: the wall is outside the map (game-kind-sdk.md §1.2).
    expect(stepCell([3, 4], 'E')).toEqual([3, 5]);
    expect(stepCell([0, 0], 'N')).toEqual([-1, 0]);
  });

  it('points the arrow on screen axes (y grows downwards)', () => {
    for (const dir of MAZE_DIRS) {
      const [dr, dc] = stepCell([0, 0], dir);
      expect(Math.round(Math.cos(dirAngle(dir)))).toBe(dc);
      expect(Math.round(Math.sin(dirAngle(dir)))).toBe(dr);
    }
  });

  it('turns by a quarter: right is clockwise (+), left counter-clockwise (−)', () => {
    const right = { N: 'E', E: 'S', S: 'W', W: 'N' } as const;
    const left = { N: 'W', W: 'S', S: 'E', E: 'N' } as const;
    for (const dir of MAZE_DIRS) {
      expect(turnDelta(dir, right[dir])).toBeCloseTo(Math.PI / 2);
      expect(turnDelta(dir, left[dir])).toBeCloseTo(-Math.PI / 2);
    }
  });

  it('flips Măng for W, faces right for E, keeps her side for N and S', () => {
    expect(facingSign('E', -1)).toBe(1);
    expect(facingSign('W', 1)).toBe(-1);
    expect(facingSign('N', -1)).toBe(-1);
    expect(facingSign('S', 1)).toBe(1);
  });

  it('puts the arrow past her head when she faces N', () => {
    expect(arrowDistance('N')).toBeGreaterThan(1);
    for (const dir of ['E', 'S', 'W'] as const) {
      expect(arrowDistance(dir)).toBeGreaterThan(0.5);
      expect(arrowDistance(dir)).toBeLessThan(1);
    }
  });
});

describe('bamboo bookkeeping', () => {
  const map = ['#####', '#Sb.#', '#.#b#', '#b.G#', '#####'];

  it('finds tiles in reading order', () => {
    expect(cellsOf(map, 'b')).toEqual([
      [1, 2],
      [2, 3],
      [3, 1],
    ]);
    expect(cellsOf(map, 'S')).toEqual([[1, 1]]);
  });

  it('remaining = map b cells minus collected', () => {
    expect(remainingBamboo(map, new Set())).toHaveLength(3);
    expect(remainingBamboo(map, new Set([cellKey([2, 3])]))).toEqual([
      [1, 2],
      [3, 1],
    ]);
    expect(remainingBamboo(map, new Set(['1,2', '2,3', '3,1']))).toEqual([]);
  });
});

describe('pixel art', () => {
  it('draws the board tiles on the 12-texel grid', () => {
    for (const name of ['floor', 'wall', 'bamboo', 'goalPad', 'flag1', 'flag2'] as const) {
      const image = patternPixels(PATTERNS[name]);
      expect([image.width, image.height]).toEqual([MAZE_TILE_TEXELS, MAZE_TILE_TEXELS]);
    }
  });

  it('uses only palette colours and opaque or empty texels', () => {
    for (const pattern of Object.values(PATTERNS)) {
      const { data } = patternPixels(pattern);
      for (let i = 3; i < data.length; i += 4) expect([0, 255]).toContain(data[i]);
    }
    expect(Object.values(PALETTE).every((hex) => /^#[0-9a-f]{6}$/.test(hex))).toBe(true);
  });

  it('keeps the arrow symmetric about its middle row', () => {
    const rows = PATTERNS.arrow;
    for (let i = 0; i < rows.length; i++) {
      const mirror = rows[rows.length - 1 - i] ?? '';
      expect(rows[i]?.replace(/w/g, 'm')).toBe(mirror.replace(/w/g, 'm'));
    }
  });

  it('rejects ragged rows and unknown colours', () => {
    expect(() => patternPixels(['kk', 'k'])).toThrow(/wide/);
    expect(() => patternPixels(['kZ'])).toThrow(/unknown/);
    const { data } = patternPixels(['k.']);
    expect([...data]).toEqual([0x1e, 0x1b, 0x2e, 255, 0, 0, 0, 0]);
  });
});
