import { describe, expect, it } from 'vitest';
import rawManifest from './voiceManifest.json';
import { createVoiceLookup, parseVoiceManifest } from './voiceManifest';

describe('voice manifest', () => {
  it('looks up lines and builds their URL', () => {
    const lookup = createVoiceLookup(
      parseVoiceManifest({
        version: 1,
        provider: 'x',
        lines: { 'feedback.FELL_IN_HOLE': { hash: 'h' } },
      }),
    );
    expect(lookup.has('feedback.FELL_IN_HOLE')).toBe(true);
    expect(lookup.url('feedback.FELL_IN_HOLE')).toBe('/audio/voice/feedback.FELL_IN_HOLE.mp3');
    expect(lookup.has('feedback.HIT_WALL')).toBe(false);
    expect(lookup.url('feedback.HIT_WALL')).toBeNull();
  });

  it('treats a broken manifest as "no voice"', () => {
    expect(parseVoiceManifest({ lines: 3 }).lines).toEqual({});
    expect(createVoiceLookup(parseVoiceManifest(null)).size).toBe(0);
  });

  it('the bundled manifest is valid', () => {
    expect(parseVoiceManifest(rawManifest)).toEqual(rawManifest);
  });
});
