import { beforeEach, describe, expect, it } from 'vitest';
import type { Catalog } from '../content/catalog';
import { authorFlags, unlockOverrideIds } from './authorMode';

describe('authorFlags (dev build)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('reads ?author=1 and ?unlock=all', () => {
    expect(authorFlags('?author=1&unlock=all')).toEqual({ author: true, unlockAll: true });
    expect(authorFlags('')).toEqual({ author: true, unlockAll: true }); // remembered for the tab
  });

  it('turns off with ?author=0 / ?unlock=0', () => {
    authorFlags('?author=1&unlock=all');
    expect(authorFlags('?author=0&unlock=0')).toEqual({ author: false, unlockAll: false });
    expect(authorFlags('')).toEqual({ author: false, unlockAll: false });
  });

  it('is off by default', () => {
    expect(authorFlags('?foo=1')).toEqual({ author: false, unlockAll: false });
  });
});

describe('unlockOverrideIds', () => {
  const catalog = {
    worldById: new Map([
      ['w01', {}],
      ['w02', {}],
      ['_sandbox', {}],
    ]),
    levels: new Map([
      ['w01-l01', {}],
      ['w02-l09', {}],
    ]),
  } as unknown as Catalog;
  const base = { dev: true, unlockAll: false, coach: false };

  it('opens every world and level for the coach profile, sandbox included', () => {
    expect(unlockOverrideIds(catalog, { ...base, coach: true })).toEqual(
      new Set(['w01', 'w02', '_sandbox', 'w01-l01', 'w02-l09']),
    );
  });

  it('opens only the sandbox for a child profile', () => {
    expect(unlockOverrideIds(catalog, base)).toEqual(new Set(['_sandbox']));
  });

  it('opens nothing in production builds, even for the coach', () => {
    expect(unlockOverrideIds(catalog, { dev: false, unlockAll: true, coach: true }).size).toBe(0);
  });
});
