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
});
