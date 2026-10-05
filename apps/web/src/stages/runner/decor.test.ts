// @vitest-environment node
import type { Container } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { createDecor } from './decor';
import { computeRunnerLayout } from './layout';

const layout = computeRunnerLayout(20, 516, 360);

/** Every sprite's position and alpha, as plain numbers. */
const snapshot = (view: Container): number[] =>
  view.children.flatMap((child) => [child.x, child.y, child.alpha]);

describe('scene decoration (P2-23)', () => {
  it('only the forest and the river have one', () => {
    expect(createDecor(layout, 'lang-tre')).toBeNull();
    expect(createDecor(layout, undefined)).toBeNull();
    expect(createDecor(layout, 'xuong')).toBeNull();
    expect(createDecor(layout, 'nga-ba')).toBeNull();
    expect(createDecor(layout, 'rung-lap-lai')?.layer).toBe('hills');
    expect(createDecor(layout, 'song')?.layer).toBe('far');
  });

  it.each(['rung-lap-lai', 'song'] as const)(
    '%s moves on the clock, on the texel grid, with a fixed pool of sprites',
    (theme) => {
      const decor = createDecor(layout, theme);
      if (!decor) throw new Error('no decor');
      const count = decor.view.children.length;
      expect(count).toBeGreaterThan(0);
      decor.update(0, false);
      const before = snapshot(decor.view);
      decor.update(1700, false);
      const after = snapshot(decor.view);
      expect(after).not.toEqual(before);
      expect(decor.view.children.length).toBe(count);
      for (const child of decor.view.children) {
        expect(Math.abs(child.x % layout.tileScale)).toBe(0);
        expect(Math.abs(child.y % layout.tileScale)).toBe(0);
      }
    },
  );

  it.each(['rung-lap-lai', 'song'] as const)('%s stands still under reduced motion', (theme) => {
    const decor = createDecor(layout, theme);
    if (!decor) throw new Error('no decor');
    decor.update(0, true);
    const still = snapshot(decor.view);
    decor.update(2300, true);
    expect(snapshot(decor.view)).toEqual(still);
    // Still, but lit: every sprite stays visible.
    expect(Math.min(...decor.view.children.map((c) => c.alpha))).toBeGreaterThan(0.25);
  });
});
