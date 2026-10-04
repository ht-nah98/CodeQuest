import { describe, expect, it } from 'vitest';
import {
  cellAt,
  clampPan,
  isClick,
  keyPan,
  maxPan,
  panToCentre,
  toggleMark,
  wheelPan,
} from './planView';

// A 40-cell track of 54 px cells in a 1100 × 116 window.
const track = { width: 40 * 54, height: 116 };
const frame = { width: 1100, height: 116 };
// A 12 × 12 maze of 48 px cells in a 600 × 480 frame.
const maze = { width: 576, height: 576 };
const mazeView = { width: 600, height: 480 };

describe('clampPan', () => {
  it('keeps the frame inside the content', () => {
    expect(maxPan(track, frame)).toEqual({ x: 1060, y: 0 });
    expect(clampPan({ x: -50, y: 10 }, track, frame)).toEqual({ x: 0, y: 0 });
    expect(clampPan({ x: 5000, y: 0 }, track, frame)).toEqual({ x: 1060, y: 0 });
    expect(clampPan({ x: 300.4, y: 0 }, track, frame)).toEqual({ x: 300, y: 0 });
  });

  it('pins an axis that fits to 0', () => {
    expect(clampPan({ x: 40, y: 200 }, maze, mazeView)).toEqual({ x: 0, y: 96 });
    expect(clampPan({ x: 40, y: 40 }, { width: 200, height: 100 }, mazeView)).toEqual({
      x: 0,
      y: 0,
    });
  });
});

describe('wheelPan', () => {
  it('turns the plain wheel into a sideways pan on a track', () => {
    expect(wheelPan({ x: 0, y: 0 }, { dx: 0, dy: 120, shift: false }, track, frame)).toEqual({
      x: 120,
      y: 0,
    });
    expect(wheelPan({ x: 1000, y: 0 }, { dx: 0, dy: 120, shift: false }, track, frame).x).toBe(
      1060,
    );
  });

  it('pans down on a tall maze, sideways with Shift or a sideways wheel', () => {
    const start = { x: 0, y: 0 };
    const wide = { width: 900, height: 576 };
    expect(wheelPan(start, { dx: 0, dy: 50, shift: false }, wide, mazeView)).toEqual({
      x: 0,
      y: 50,
    });
    expect(wheelPan(start, { dx: 0, dy: 50, shift: true }, wide, mazeView)).toEqual({
      x: 50,
      y: 0,
    });
    expect(wheelPan(start, { dx: 30, dy: 0, shift: false }, wide, mazeView)).toEqual({
      x: 30,
      y: 0,
    });
  });
});

describe('keyPan', () => {
  const step = { width: 54, height: 54 };
  it('moves one cell per arrow, Home / End to the ends, ignores other keys', () => {
    expect(keyPan({ x: 0, y: 0 }, 'ArrowRight', step, track, frame)).toEqual({ x: 54, y: 0 });
    expect(keyPan({ x: 0, y: 0 }, 'ArrowLeft', step, track, frame)).toEqual({ x: 0, y: 0 });
    expect(keyPan({ x: 10, y: 0 }, 'End', step, track, frame)).toEqual({ x: 1060, y: 0 });
    expect(keyPan({ x: 500, y: 0 }, 'Home', step, track, frame)).toEqual({ x: 0, y: 0 });
    expect(keyPan({ x: 0, y: 0 }, 'ArrowDown', step, maze, mazeView)).toEqual({ x: 0, y: 54 });
    expect(keyPan({ x: 0, y: 0 }, 'a', step, track, frame)).toBeNull();
  });
});

describe('panToCentre', () => {
  it('centres a cell, clamped at the ends', () => {
    expect(panToCentre({ x: 20 * 54, y: 0, width: 54, height: 116 }, track, frame)).toEqual({
      x: 557,
      y: 0,
    });
    expect(panToCentre({ x: 0, y: 0, width: 54, height: 116 }, track, frame)).toEqual({
      x: 0,
      y: 0,
    });
  });
});

describe('cellAt', () => {
  it('finds the cell under a content point', () => {
    const grid = { cols: 40, rows: 1, cell: { width: 54, height: 116 } };
    expect(cellAt({ x: 0, y: 0 }, grid)).toEqual({ row: 0, col: 0 });
    expect(cellAt({ x: 53.9, y: 115 }, grid)).toEqual({ row: 0, col: 0 });
    expect(cellAt({ x: 54, y: 50 }, grid)).toEqual({ row: 0, col: 1 });
    expect(cellAt({ x: 39 * 54 + 10, y: 50 }, grid)).toEqual({ row: 0, col: 39 });
  });

  it('is null outside the grid (past the flag, above or left of it)', () => {
    const grid = { cols: 5, rows: 4, cell: { width: 48, height: 48 }, origin: { x: 10, y: 10 } };
    expect(cellAt({ x: 9, y: 20 }, grid)).toBeNull();
    expect(cellAt({ x: 20, y: 9 }, grid)).toBeNull();
    expect(cellAt({ x: 10 + 5 * 48, y: 20 }, grid)).toBeNull();
    expect(cellAt({ x: 10 + 4 * 48, y: 10 + 3 * 48 }, grid)).toEqual({ row: 3, col: 4 });
  });
});

describe('isClick / toggleMark', () => {
  it('tells a click from a drag', () => {
    expect(isClick(2, 3)).toBe(true);
    expect(isClick(6, 0)).toBe(false);
  });

  it('adds and removes a mark', () => {
    expect(toggleMark([], '3')).toEqual(['3']);
    expect(toggleMark(['3', '5'], '3')).toEqual(['5']);
  });
});
