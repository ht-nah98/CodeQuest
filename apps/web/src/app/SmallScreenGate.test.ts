import { describe, expect, it } from 'vitest';
import { isTooSmall } from './SmallScreenGate';

const laptop = { width: 1280, height: 720 };
const browserArea = { width: 1280, height: 600 };

describe('isTooSmall (ADR-0011: minimum 1280×720)', () => {
  it('accepts a 1280×720 laptop whose browser shows only ~1280×600', () => {
    expect(isTooSmall(laptop, browserArea)).toBe(false);
    expect(isTooSmall({ width: 1366, height: 768 }, { width: 1366, height: 650 })).toBe(false);
  });

  it('rejects a screen one pixel below 1280×720', () => {
    expect(isTooSmall({ width: 1279, height: 720 }, browserArea)).toBe(true);
    expect(isTooSmall({ width: 1280, height: 719 }, browserArea)).toBe(true);
  });

  it('accepts a window at exactly 1000×520, rejects one pixel less', () => {
    expect(isTooSmall(laptop, { width: 1000, height: 520 })).toBe(false);
    expect(isTooSmall(laptop, { width: 999, height: 520 })).toBe(true);
    expect(isTooSmall(laptop, { width: 1000, height: 519 })).toBe(true);
  });
});
