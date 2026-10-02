import { describe, expect, it } from 'vitest';
import { shade } from './colors';

describe('shade', () => {
  it('darkens by multiplying and lightens towards white', () => {
    expect(shade('#808080', 0.5)).toBe('#404040');
    expect(shade('#808080', 1)).toBe('#808080');
    expect(shade('#000000', 1.5)).toBe('#808080');
    expect(shade('#123456', 2)).toBe('#ffffff');
    expect(shade('#123456', 0)).toBe('#000000');
  });
});
