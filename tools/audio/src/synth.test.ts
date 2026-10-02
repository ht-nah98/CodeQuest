import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { MUSIC_RECIPES } from './music';
import { SFX_RECIPES } from './sfx';
import { encodeWav, note, render, SAMPLE_RATE } from './synth';

const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

describe('synth', () => {
  it('maps note names to equal-tempered frequencies', () => {
    expect(note('A4')).toBeCloseTo(440, 6);
    expect(note('A5')).toBeCloseTo(880, 6);
    expect(note('C4')).toBeCloseTo(261.626, 2);
    expect(note('F#4')).toBeCloseTo(note('Gb4'), 6);
    expect(() => note('H2')).toThrow();
  });

  it('is deterministic: the same recipe gives the same WAV bytes', () => {
    for (const recipe of [...Object.values(SFX_RECIPES), ...Object.values(MUSIC_RECIPES)]) {
      expect(sha(encodeWav(render(recipe)))).toBe(sha(encodeWav(render(recipe))));
    }
  });

  it('writes a valid 16-bit mono PCM WAV header', () => {
    const wav = encodeWav(new Float32Array([0, 0.5, -0.5, 2]));
    const view = new DataView(wav.buffer);
    const ascii = (at: number) => String.fromCharCode(...wav.slice(at, at + 4));
    expect(ascii(0)).toBe('RIFF');
    expect(ascii(8)).toBe('WAVE');
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(SAMPLE_RATE);
    expect(view.getUint32(40, true)).toBe(8);
    expect(view.getInt16(50, true)).toBe(32767); // 2 is clamped to full scale
  });
});

describe('sound effects', () => {
  it.each(Object.entries(SFX_RECIPES))('%s is short, finite and normalised', (_name, recipe) => {
    const samples = render(recipe);
    // add-asset.md: effects are at most 1 second.
    expect(samples.length / SAMPLE_RATE).toBeLessThanOrEqual(1);
    let peak = 0;
    for (const v of samples) {
      expect(Number.isFinite(v)).toBe(true);
      peak = Math.max(peak, Math.abs(v));
    }
    expect(peak).toBeCloseTo(recipe.peak, 3);
  });

  it('starts and ends near silence (no clicks)', () => {
    for (const recipe of Object.values(SFX_RECIPES)) {
      const samples = render(recipe);
      expect(Math.abs(samples[0] ?? 1)).toBeLessThan(0.05);
      expect(Math.abs(samples[samples.length - 1] ?? 1)).toBeLessThan(0.05);
    }
  });
});

describe('music', () => {
  it('loops are whole bars long', () => {
    expect(MUSIC_RECIPES.village.length).toBeCloseTo((32 * 60) / 90, 6);
    expect(MUSIC_RECIPES.adventure.length).toBeCloseTo((32 * 60) / 112, 6);
  });
});
