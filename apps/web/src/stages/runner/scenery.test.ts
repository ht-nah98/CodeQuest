// @vitest-environment node
import { SCENE_THEMES } from '@codequest/content-schema';
import { describe, expect, it } from 'vitest';
import { computeRunnerLayout } from './layout';
import { drawClouds, drawFar, drawNear, drawSky } from './scenery';

// P4-14: every theme draws all four layers, on a short and on a long track, the same way twice.
const SHORT = computeRunnerLayout(5, 520, 325);
const LONG = computeRunnerLayout(40, 520, 325);

describe.each(SCENE_THEMES)('runner scenery of %s', (theme) => {
  it.each([
    ['sky', drawSky],
    ['clouds', drawClouds],
    ['far', drawFar],
    ['near', drawNear],
  ] as const)('draws the %s layer, deterministically', (_name, draw) => {
    for (const layout of [SHORT, LONG]) {
      const a = draw(layout, theme);
      const b = draw(layout, theme);
      expect(a.bounds.width).toBeGreaterThan(0);
      expect(a.bounds.height).toBeGreaterThan(0);
      expect(b.bounds.width).toBe(a.bounds.width);
      expect(b.bounds.height).toBe(a.bounds.height);
    }
  });
});

// P5-08: the academy (W10) is one of the themes above; its layers draw shapes, the same twice.
describe('runner scenery of hoc-vien (P5-08)', () => {
  it('draws non-empty sky, far and near layers, identical across two calls', () => {
    expect(SCENE_THEMES).toContain('hoc-vien');
    for (const draw of [drawSky, drawFar, drawNear]) {
      for (const layout of [SHORT, LONG]) {
        const a = draw(layout, 'hoc-vien');
        const b = draw(layout, 'hoc-vien');
        expect(a.bounds.width).toBeGreaterThan(0);
        expect(a.bounds.height).toBeGreaterThan(0);
        expect([b.bounds.x, b.bounds.y, b.bounds.width, b.bounds.height]).toEqual([
          a.bounds.x,
          a.bounds.y,
          a.bounds.width,
          a.bounds.height,
        ]);
      }
    }
  });
});
