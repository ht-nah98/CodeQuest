import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { localDay } from './index';
import { dayNumber } from './localDay';

describe('localDay', () => {
  // vi.stubEnv writes process.env.TZ, which Node applies to Date at once.
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe.each(['UTC', 'America/Los_Angeles', 'Asia/Tokyo'])('with host TZ=%s', (tz) => {
    beforeEach(() => {
      vi.stubEnv('TZ', tz);
    });

    it('keeps 23:59 Vietnam time on the same day', () => {
      // 23:59 in Vietnam (UTC+7) is 16:59 UTC.
      expect(localDay(new Date('2026-03-10T16:59:00.000Z'))).toBe('2026-03-10');
    });

    it('moves to the next day at 00:01 Vietnam time', () => {
      expect(localDay(new Date('2026-03-10T17:01:00.000Z'))).toBe('2026-03-11');
    });

    it('rolls over month and year boundaries', () => {
      expect(localDay(new Date('2026-12-31T17:00:00.000Z'))).toBe('2027-01-01');
      expect(localDay(new Date('2026-02-28T17:00:00.000Z'))).toBe('2026-03-01');
    });
  });

  it('really runs under a different host time zone', () => {
    vi.stubEnv('TZ', 'UTC');
    // Proves the host TZ change took effect: local hour is UTC, yet localDay is Vietnam's.
    const date = new Date('2026-03-10T17:01:00.000Z');
    expect(date.getHours()).toBe(17);
    expect(date.getDate()).toBe(10);
    expect(localDay(date)).toBe('2026-03-11');
  });
});

describe('dayNumber', () => {
  it('counts consecutive days across months, leap days and DST-free UTC', () => {
    expect(dayNumber('1970-01-01')).toBe(0);
    expect(dayNumber('2028-03-01') - dayNumber('2028-02-28')).toBe(2);
    expect(dayNumber('2027-01-01') - dayNumber('2026-12-31')).toBe(1);
  });
});
