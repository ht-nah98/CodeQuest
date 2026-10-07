import { afterEach, describe, expect, it, vi } from 'vitest';
import { markChaptersSeen, seenChapters } from './storySeen';

describe('storySeen', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('remembers seen chapters per profile and world', () => {
    expect(seenChapters('p1', 'w01')).toEqual(new Set());
    markChaptersSeen('p1', 'w01', ['two']);
    markChaptersSeen('p1', 'w01', ['two', 'three']);
    markChaptersSeen('p1', 'w02', ['x']);
    expect(seenChapters('p1', 'w01')).toEqual(new Set(['two', 'three']));
    expect(seenChapters('p1', 'w02')).toEqual(new Set(['x']));
    expect(seenChapters('p2', 'w01')).toEqual(new Set());
  });

  it('treats broken or unavailable storage as nothing seen', () => {
    localStorage.setItem('cq.storySeen.p1', '{oops');
    expect(seenChapters('p1', 'w01')).toEqual(new Set());
    localStorage.setItem('cq.storySeen.p1', JSON.stringify({ w01: 'two' }));
    expect(seenChapters('p1', 'w01')).toEqual(new Set());
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => {
      markChaptersSeen('p1', 'w01', ['two']);
    }).not.toThrow();
  });
});
