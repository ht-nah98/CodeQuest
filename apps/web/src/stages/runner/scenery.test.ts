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
