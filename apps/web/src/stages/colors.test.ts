import { describe, expect, it } from 'vitest';
import { contrast, deltaE, luminance, mix, shade } from './colors';

describe('shade', () => {
  it('darkens by multiplying and lightens towards white', () => {
    expect(shade('#808080', 0.5)).toBe('#404040');
    expect(shade('#808080', 1)).toBe('#808080');
    expect(shade('#000000', 1.5)).toBe('#808080');
    expect(shade('#123456', 2)).toBe('#ffffff');
    expect(shade('#123456', 0)).toBe('#000000');
  });
});

describe('mix', () => {
  it('mixes per channel and clamps t', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#102030', '#305070', 0)).toBe('#102030');
    expect(mix('#102030', '#305070', 1)).toBe('#305070');
    expect(mix('#102030', '#305070', 2)).toBe('#305070');
  });
});

describe('luminance and contrast (WCAG 2.x)', () => {
  it('matches the reference values', () => {
    expect(luminance('#000000')).toBe(0);
    expect(luminance('#ffffff')).toBeCloseTo(1, 6);
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 6);
    expect(contrast('#ffffff', '#ffffff')).toBe(1);
    // #767676 on white is the classic 4.54:1.
    expect(contrast('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
    expect(contrast('#ffffff', '#767676')).toBe(contrast('#767676', '#ffffff'));
  });
});

describe('deltaE (CIE76)', () => {
  it('is 0 for a colour with itself and 100 from black to white', () => {
    expect(deltaE('#4faf5a', '#4faf5a')).toBe(0);
    expect(deltaE('#000000', '#ffffff')).toBeCloseTo(100, 1);
    // Pure red against pure green: a large difference (≈ 170).
    expect(deltaE('#ff0000', '#00ff00')).toBeGreaterThan(150);
  });
});
