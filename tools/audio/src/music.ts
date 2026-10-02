import { note, type Recipe, type Tone, type Wave } from './synth';

// Two short background loops (roadmap P1-14: "2 bản nhạc nền"; art-direction.md §6: soft,
// quiet by default). Placeholders until the coach picks music; each is exactly 8 bars so it
// loops on the beat.

/** "E5:1 G5:0.5 r:1" → notes with lengths in beats; `r` is a rest. */
function sequence(
  pattern: string,
  bpm: number,
  wave: Wave,
  gain: number,
  decay: Tone['decay'] = 'exp',
): { tones: Tone[]; beats: number } {
  const beat = 60 / bpm;
  const tones: Tone[] = [];
  let at = 0;
  for (const token of pattern.trim().split(/\s+/)) {
    const [name = 'r', length = '1'] = token.split(':');
    const beats = Number(length);
    if (name !== 'r') {
      tones.push({ wave, at: at * beat, dur: beats * beat * 0.92, freq: note(name), gain, decay });
    }
    at += beats;
  }
  return { tones, beats: at };
}

/** Quiet off-beat hi-hat ticks for `bars` bars of 4/4. */
function hats(bars: number, bpm: number, gain: number): Tone[] {
  const beat = 60 / bpm;
  return Array.from({ length: bars * 4 }, (_, i) => ({
    wave: 'noise' as const,
    at: (i + 0.5) * beat,
    dur: 0.03,
    freq: 8000,
    gain,
  }));
}

function loop(bpm: number, parts: { tones: Tone[]; beats: number }[], extra: Tone[]): Recipe {
  const beats = Math.max(...parts.map((part) => part.beats));
  return {
    tones: [...parts.flatMap((part) => part.tones), ...extra],
    length: (beats * 60) / bpm,
    lowpass: 3200,
    peak: 0.5,
  };
}

const VILLAGE_BPM = 90;
const ADVENTURE_BPM = 112;

export const MUSIC_RECIPES = {
  // Map, world and lesson screens: calm, C major pentatonic.
  village: loop(
    VILLAGE_BPM,
    [
      sequence(
        `E5:1 G5:1 A5:1 G5:1  E5:1 D5:1 C5:2  D5:1 E5:1 G5:1 E5:1  D5:3 r:1
         E5:1 G5:1 A5:1 C6:1  A5:1 G5:1 E5:2  D5:1 E5:1 D5:1 C5:1  C5:3 r:1`,
        VILLAGE_BPM,
        'triangle',
        0.55,
      ),
      sequence(
        `C3:1 G3:1 C3:1 G3:1  A2:1 E3:1 A2:1 E3:1  F2:1 C3:1 F2:1 C3:1  G2:1 D3:1 G2:1 D3:1
         C3:1 G3:1 C3:1 G3:1  A2:1 E3:1 A2:1 E3:1  F2:1 C3:1 G2:1 D3:1  C3:1 G3:1 C3:2`,
        VILLAGE_BPM,
        'pulse25',
        0.18,
      ),
    ],
    hats(8, VILLAGE_BPM, 0.04),
  ),
  // Play screen: a little brighter and quicker, G major.
  adventure: loop(
    ADVENTURE_BPM,
    [
      sequence(
        `G4:0.5 B4:0.5 D5:1 B4:0.5 D5:0.5 G5:1  F#5:1 E5:1 D5:2
         E5:0.5 F#5:0.5 G5:1 E5:0.5 D5:0.5 B4:1  A4:3 r:1
         G4:0.5 B4:0.5 D5:1 B4:0.5 D5:0.5 G5:1  A5:1 G5:1 F#5:1 E5:1
         D5:0.5 E5:0.5 F#5:1 A5:1 F#5:1  G5:3 r:1`,
        ADVENTURE_BPM,
        'pulse25',
        0.3,
      ),
      sequence(
        `G2:1 G3:1 D3:1 G3:1  D3:1 D2:1 A2:1 D3:1  C3:1 C2:1 G2:1 C3:1  D3:1 D2:1 A2:1 D3:1
         G2:1 G3:1 D3:1 G3:1  C3:1 C2:1 G2:1 C3:1  D3:1 D2:1 A2:1 D3:1  G2:1 D3:1 G2:2`,
        ADVENTURE_BPM,
        'triangle',
        0.6,
      ),
    ],
    hats(8, ADVENTURE_BPM, 0.05),
  ),
} satisfies Record<string, Recipe>;

export type MusicName = keyof typeof MUSIC_RECIPES;
