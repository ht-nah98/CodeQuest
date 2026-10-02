// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { reducedMotion } from './motion';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('reducedMotion', () => {
  it('is false on Node (no window, no document)', () => {
    expect(reducedMotion()).toBe(false);
  });

  it('follows the profile switch on <html data-reduced-motion>', () => {
    const dataset: Record<string, string> = { reducedMotion: 'true' };
    vi.stubGlobal('document', { documentElement: { dataset } });
    expect(reducedMotion()).toBe(true);
    dataset['reducedMotion'] = 'false';
    expect(reducedMotion()).toBe(false);
  });

  it('follows the system setting', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    expect(reducedMotion()).toBe(true);
  });
});
