import { STORY_PROPS } from '@codequest/content-schema';
import { describe, expect, it } from 'vitest';
import { goalPixels } from '../../stages/goalArt';
import { STORY_PROP_ART } from './storyArt';

describe('STORY_PROP_ART', () => {
  it.each(STORY_PROPS)('draws prop %s as a square of known colours', (prop) => {
    const art = STORY_PROP_ART[prop];
    expect(art.rows.every((row) => row.length === art.rows.length)).toBe(true);
    // Throws on an unknown colour letter or a ragged row.
    expect(goalPixels(art).width).toBe(art.rows.length);
  });

  it('has art for every story prop, W10 bookshelf and diploma included (P5-08)', () => {
    expect(Object.keys(STORY_PROP_ART).sort()).toEqual([...STORY_PROPS].sort());
    for (const prop of ['bookshelf', 'diploma'] as const) {
      const rows = STORY_PROP_ART[prop].rows;
      expect(rows).toHaveLength(12);
      expect(new Set(rows.map((row) => row.length))).toEqual(new Set([12]));
    }
  });
});
