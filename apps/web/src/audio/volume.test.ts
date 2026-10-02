import { describe, expect, it } from 'vitest';
import { CHANNEL_MIX, channelGain, DUCK_FACTOR, sliderToGain, type MixState } from './volume';

const state = (patch: Partial<MixState> = {}): MixState => ({
  volumes: { music: 1, sfx: 1, voice: 1 },
  muted: false,
  ducked: false,
  ...patch,
});

describe('sliderToGain', () => {
  it('is squared and clamped to 0..1', () => {
    expect(sliderToGain(0)).toBe(0);
    expect(sliderToGain(0.5)).toBe(0.25);
    expect(sliderToGain(1)).toBe(1);
    expect(sliderToGain(1.5)).toBe(1);
    expect(sliderToGain(-1)).toBe(0);
    expect(sliderToGain(Number.NaN)).toBe(0);
  });
});

describe('channelGain', () => {
  it('scales by the slider, the channel mix and the item level', () => {
    expect(channelGain('voice', state())).toBe(CHANNEL_MIX.voice);
    expect(
      channelGain('sfx', state({ volumes: { music: 1, sfx: 0.5, voice: 1 } }), 0.8),
    ).toBeCloseTo(0.25 * CHANNEL_MIX.sfx * 0.8);
  });

  it('turns each channel off on its own', () => {
    const volumes = { music: 0, sfx: 1, voice: 1 };
    expect(channelGain('music', state({ volumes }))).toBe(0);
    expect(channelGain('sfx', state({ volumes }))).toBeGreaterThan(0);
    expect(channelGain('voice', state({ volumes }))).toBeGreaterThan(0);
  });

  it('ducks only the music while a voice plays', () => {
    expect(channelGain('music', state({ ducked: true }))).toBeCloseTo(
      CHANNEL_MIX.music * DUCK_FACTOR,
    );
    expect(channelGain('sfx', state({ ducked: true }))).toBe(CHANNEL_MIX.sfx);
  });

  it('is silent when muted', () => {
    expect(channelGain('voice', state({ muted: true }))).toBe(0);
  });
});
