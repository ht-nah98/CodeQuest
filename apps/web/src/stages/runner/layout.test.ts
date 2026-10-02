import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../assets';
import { cameraX, cellCenterX, computeRunnerLayout } from './layout';

describe('computeRunnerLayout', () => {
  it('fits a 5-cell track into the play column at 1280×720 without scrolling', () => {
    const layout = computeRunnerLayout(5, 520, 325);
    expect(layout.scrolls).toBe(false);
    expect(Number.isInteger(layout.tileScale)).toBe(true);
    expect(layout.tilePx).toBe(TILE_SIZE * layout.tileScale);
    expect(layout.originX).toBeGreaterThanOrEqual(0);
    expect(layout.originX + 5 * layout.cellPx).toBeLessThanOrEqual(520);
    expect(layout.originX % layout.tilePx).toBe(0);
    expect(layout.feetY).toBe(layout.groundTop + 2 * layout.tileScale);
    expect(cameraX(layout, cellCenterX(layout, 4))).toBe(0);
  });

  it('uses bigger tiles on a wide stage, capped at ×4', () => {
    expect(computeRunnerLayout(5, 800, 500).tileScale).toBe(3);
    expect(computeRunnerLayout(3, 2000, 1000).tileScale).toBe(4);
  });

  it('keeps Măng between 96 and 150 px tall', () => {
    const body = (h: number) => computeRunnerLayout(5, 600, h).pandaScale * 280 * 0.84;
    expect(body(200)).toBeCloseTo(96);
    expect(body(375)).toBeCloseTo(127.5);
    expect(body(1000)).toBeCloseTo(150);
  });

  it('scrolls a long track and clamps the camera to the world', () => {
    const layout = computeRunnerLayout(40, 520, 325);
    expect(layout.scrolls).toBe(true);
    expect(layout.worldWidth).toBe(42 * layout.cellPx);
    expect(cameraX(layout, cellCenterX(layout, 0))).toBe(0);
    expect(cameraX(layout, cellCenterX(layout, 39))).toBe(layout.worldWidth - 520);
    const mid = cameraX(layout, cellCenterX(layout, 20));
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(layout.worldWidth - 520);
  });
});
