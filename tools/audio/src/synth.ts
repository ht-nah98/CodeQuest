// Tiny deterministic chiptune synthesizer: square / pulse / triangle / sine / noise voices with
// attack-decay envelopes and pitch slides, mixed into mono PCM and written as 16-bit WAV.
// No randomness (noise comes from a fixed LFSR), so the same recipe always gives the same bytes.

/** Sample rate of every generated sound. 22.05 kHz is plenty for 8-bit style sounds. */
export const SAMPLE_RATE = 22_050;

export type Wave = 'square' | 'pulse25' | 'pulse12' | 'triangle' | 'sine' | 'noise';

export interface Tone {
  wave: Wave;
  /** Start time in seconds. */
  at: number;
  /** Length in seconds. */
  dur: number;
  /** Start frequency in Hz (for noise: the LFSR clock rate). */
  freq: number;
  /** End frequency for an exponential slide; defaults to `freq`. */
  to?: number;
  /** Peak gain, 0..1. */
  gain?: number;
  /** Attack time in seconds (soft start avoids clicks). */
  attack?: number;
  /** How the level falls after the attack: 'exp' plucks, 'linear' fades, 'hold' sustains. */
  decay?: 'exp' | 'linear' | 'hold';
  /** Vibrato depth (fraction of frequency) and rate in Hz, for the "boing". */
  vibrato?: { depth: number; rate: number };
}

export interface Recipe {
  tones: Tone[];
  /** Total length in seconds; defaults to the end of the last tone plus a short tail. */
  length?: number;
  /** One-pole low-pass cutoff in Hz to round off the harsh square edges. */
  lowpass?: number;
  /** Peak level after normalisation, 0..1 (balances loud and quiet sounds against each other). */
  peak?: number;
}

const RELEASE_S = 0.008;
const TAIL_S = 0.02;

function oscillator(wave: Wave, phase: number, noise: number): number {
  const p = phase - Math.floor(phase);
  switch (wave) {
    case 'square':
      return p < 0.5 ? 1 : -1;
    case 'pulse25':
      return p < 0.25 ? 1 : -1;
    case 'pulse12':
      return p < 0.125 ? 1 : -1;
    case 'triangle':
      return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
    case 'sine':
      return Math.sin(2 * Math.PI * p);
    case 'noise':
      return noise;
  }
}

function envelope(tone: Tone, t: number): number {
  const attack = tone.attack ?? 0.004;
  if (t < attack) return t / attack;
  const rest = Math.max(tone.dur - attack, 1e-6);
  const u = (t - attack) / rest;
  let level: number;
  switch (tone.decay ?? 'exp') {
    case 'exp':
      level = Math.exp(-4 * u);
      break;
    case 'linear':
      level = 1 - u;
      break;
    case 'hold':
      level = 1;
      break;
  }
  // Short release at the very end so no tone stops with a click.
  const left = tone.dur - t;
  return left < RELEASE_S ? (level * Math.max(left, 0)) / RELEASE_S : level;
}

/** Renders one tone into `out` (additive mix). */
function renderTone(tone: Tone, out: Float32Array): void {
  const start = Math.round(tone.at * SAMPLE_RATE);
  const count = Math.round(tone.dur * SAMPLE_RATE);
  const gain = tone.gain ?? 0.5;
  const to = tone.to ?? tone.freq;
  let phase = 0;
  // 15-bit LFSR as on the NES noise channel: deterministic "random" hiss.
  let lfsr = 1;
  let noiseValue = 1;
  let noiseClock = 0;
  for (let i = 0; i < count; i++) {
    const index = start + i;
    if (index >= out.length) break;
    const t = i / SAMPLE_RATE;
    const k = count > 1 ? i / (count - 1) : 0;
    let freq = tone.freq * Math.pow(to / tone.freq, k);
    if (tone.vibrato)
      freq *= 1 + tone.vibrato.depth * Math.sin(2 * Math.PI * tone.vibrato.rate * t);
    phase += freq / SAMPLE_RATE;
    noiseClock += freq / SAMPLE_RATE;
    while (noiseClock >= 1) {
      noiseClock -= 1;
      const bit = (lfsr ^ (lfsr >> 1)) & 1;
      lfsr = (lfsr >> 1) | (bit << 14);
      noiseValue = lfsr & 1 ? 1 : -1;
    }
    const current = out[index] ?? 0;
    out[index] = current + oscillator(tone.wave, phase, noiseValue) * envelope(tone, t) * gain;
  }
}

/** Renders a recipe to mono float samples in -1..1, low-passed and peak-normalised. */
export function render(recipe: Recipe): Float32Array {
  const end = Math.max(...recipe.tones.map((tone) => tone.at + tone.dur)) + TAIL_S;
  const out = new Float32Array(Math.round((recipe.length ?? end) * SAMPLE_RATE));
  for (const tone of recipe.tones) renderTone(tone, out);

  if (recipe.lowpass !== undefined) {
    const rc = 1 / (2 * Math.PI * recipe.lowpass);
    const alpha = 1 / SAMPLE_RATE / (rc + 1 / SAMPLE_RATE);
    let y = 0;
    for (let i = 0; i < out.length; i++) {
      y += alpha * ((out[i] ?? 0) - y);
      out[i] = y;
    }
  }

  let max = 0;
  for (const v of out) max = Math.max(max, Math.abs(v));
  const scale = max > 0 ? (recipe.peak ?? 0.7) / max : 0;
  for (let i = 0; i < out.length; i++) out[i] = (out[i] ?? 0) * scale;
  return out;
}

/** Encodes mono float samples as a 16-bit PCM WAV file. */
export function encodeWav(samples: Float32Array, sampleRate = SAMPLE_RATE): Uint8Array {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  ascii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  ascii(36, 'data');
  view.setUint32(40, dataSize, true);
  samples.forEach((v, i) => {
    const clamped = Math.max(-1, Math.min(1, v));
    view.setInt16(44 + i * 2, Math.round(clamped * 32767), true);
  });
  return new Uint8Array(buffer);
}

const NOTE_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Frequency of a note name such as "C5", "F#4" or "Bb3" (A4 = 440 Hz). */
export function note(name: string): number {
  const match = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!match) throw new Error(`Bad note name: ${name}`);
  const [, letter = 'A', accidental = '', octave = '4'] = match;
  const semitone =
    (NOTE_INDEX[letter] ?? 0) + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0);
  const midi = (Number(octave) + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}
