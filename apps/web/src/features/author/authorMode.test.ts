import { beforeEach, describe, expect, it } from 'vitest';
import { authorFlags } from './authorMode';

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
