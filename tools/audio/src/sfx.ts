import { note as n, type Recipe } from './synth';

// Sound effects (art-direction.md §6): light chiptune, short (≤ 1 s), friendly. A "boing" for
// bumping into things, never a harsh buzzer. Names match apps/web/src/audio/sfxCatalog.ts.

export const SFX_RECIPES = {
  // UI button press: a soft, very short blip.
  click: {
    tones: [
      { wave: 'triangle', at: 0, dur: 0.035, freq: 1250, gain: 0.8 },
      { wave: 'pulse25', at: 0, dur: 0.012, freq: 2500, gain: 0.15 },
    ],
    lowpass: 6000,
    peak: 0.45,
  },
  // A block snaps into place: two tiny rising ticks ("tách").
  snap: {
    tones: [
      { wave: 'square', at: 0, dur: 0.03, freq: n('A5'), gain: 0.5 },
      { wave: 'square', at: 0.035, dur: 0.045, freq: n('E6'), gain: 0.5 },
    ],
    lowpass: 5000,
    peak: 0.5,
  },
  // A block dropped on the workspace (or in the bin): a soft falling thud.
  drop: {
    tones: [{ wave: 'triangle', at: 0, dur: 0.09, freq: 420, to: 180, gain: 0.9 }],
    lowpass: 3000,
    peak: 0.55,
  },
  // ▶ Run: a quick rising arpeggio, "let's go".
  run: {
    tones: [
      { wave: 'pulse25', at: 0, dur: 0.06, freq: n('C5'), gain: 0.5 },
      { wave: 'pulse25', at: 0.06, dur: 0.06, freq: n('E5'), gain: 0.5 },
      { wave: 'pulse25', at: 0.12, dur: 0.06, freq: n('G5'), gain: 0.5 },
      { wave: 'pulse25', at: 0.18, dur: 0.14, freq: n('C6'), gain: 0.5 },
    ],
    lowpass: 5000,
    peak: 0.55,
  },
  // One step of Măng: a soft footstep tick (plays often, so it is quiet).
  step: {
    tones: [
      { wave: 'triangle', at: 0, dur: 0.045, freq: 230, to: 160, gain: 0.8 },
      { wave: 'noise', at: 0, dur: 0.02, freq: 6000, gain: 0.12 },
    ],
    lowpass: 2500,
    peak: 0.4,
  },
  // Jump: the classic rising slide.
  jump: {
    tones: [{ wave: 'square', at: 0, dur: 0.16, freq: 320, to: 880, gain: 0.5, decay: 'linear' }],
    lowpass: 4000,
    peak: 0.5,
  },
  // Falling into a hole: a wobbly slide down, funny rather than scary.
  fall: {
    tones: [
      {
        wave: 'triangle',
        at: 0,
        dur: 0.5,
        freq: 760,
        to: 140,
        gain: 0.9,
        decay: 'linear',
        vibrato: { depth: 0.04, rate: 14 },
      },
    ],
    lowpass: 3500,
    peak: 0.55,
  },
  // Bumping into a wall / branch: a cartoon "boing".
  bump: {
    tones: [
      {
        wave: 'triangle',
        at: 0,
        dur: 0.32,
        freq: 150,
        to: 230,
        gain: 0.9,
        vibrato: { depth: 0.18, rate: 16 },
      },
      { wave: 'noise', at: 0, dur: 0.03, freq: 2500, gain: 0.25 },
    ],
    lowpass: 2500,
    peak: 0.6,
  },
  // Kicking a crate: a short wooden knock.
  kick: {
    tones: [
      { wave: 'square', at: 0, dur: 0.06, freq: 160, to: 90, gain: 0.6 },
      { wave: 'noise', at: 0, dur: 0.07, freq: 3000, gain: 0.35 },
    ],
    lowpass: 2200,
    peak: 0.6,
  },
  // Picking up a bamboo shoot: a bright two-note pickup.
  collect: {
    tones: [
      { wave: 'pulse25', at: 0, dur: 0.05, freq: n('G5'), gain: 0.5 },
      { wave: 'pulse25', at: 0.05, dur: 0.16, freq: n('D6'), gain: 0.5 },
    ],
    lowpass: 6000,
    peak: 0.5,
  },
  // Coins land in the wallet.
  coin: {
    tones: [
      { wave: 'square', at: 0, dur: 0.07, freq: n('B5'), gain: 0.45 },
      { wave: 'square', at: 0.07, dur: 0.28, freq: n('E6'), gain: 0.45 },
    ],
    lowpass: 6000,
    peak: 0.5,
  },
  // One star: a "ding" (the results screen raises the pitch star by star).
  star: {
    tones: [
      { wave: 'triangle', at: 0, dur: 0.45, freq: n('G6'), gain: 0.7 },
      { wave: 'pulse12', at: 0, dur: 0.25, freq: n('G5'), gain: 0.15 },
      { wave: 'sine', at: 0, dur: 0.45, freq: n('D7'), gain: 0.15 },
    ],
    lowpass: 7000,
    peak: 0.5,
  },
  // Măng reaches the flag: a short happy jingle.
  win: {
    tones: [
      { wave: 'pulse25', at: 0, dur: 0.09, freq: n('C5'), gain: 0.5 },
      { wave: 'pulse25', at: 0.09, dur: 0.09, freq: n('E5'), gain: 0.5 },
      { wave: 'pulse25', at: 0.18, dur: 0.09, freq: n('G5'), gain: 0.5 },
      { wave: 'pulse25', at: 0.27, dur: 0.3, freq: n('C6'), gain: 0.5 },
      { wave: 'triangle', at: 0.27, dur: 0.3, freq: n('C4'), gain: 0.5 },
    ],
    lowpass: 5000,
    peak: 0.6,
  },
  // Results screen: a longer fanfare (still under 1 s).
  fanfare: {
    tones: [
      { wave: 'square', at: 0, dur: 0.1, freq: n('G4'), gain: 0.4 },
      { wave: 'square', at: 0.1, dur: 0.1, freq: n('C5'), gain: 0.4 },
      { wave: 'square', at: 0.2, dur: 0.1, freq: n('E5'), gain: 0.4 },
      { wave: 'square', at: 0.3, dur: 0.18, freq: n('G5'), gain: 0.4 },
      { wave: 'square', at: 0.5, dur: 0.1, freq: n('E5'), gain: 0.4 },
      { wave: 'square', at: 0.6, dur: 0.35, freq: n('G5'), gain: 0.4, decay: 'linear' },
      { wave: 'triangle', at: 0, dur: 0.3, freq: n('C3'), gain: 0.6, decay: 'hold' },
      { wave: 'triangle', at: 0.3, dur: 0.2, freq: n('G3'), gain: 0.6, decay: 'hold' },
      { wave: 'triangle', at: 0.5, dur: 0.45, freq: n('C4'), gain: 0.6, decay: 'linear' },
    ],
    lowpass: 4500,
    peak: 0.6,
  },
  // Not quite right: two gentle falling notes ("ồ-ồ"), never a buzzer.
  wrong: {
    tones: [
      { wave: 'triangle', at: 0, dur: 0.14, freq: n('E4'), gain: 0.8 },
      { wave: 'triangle', at: 0.15, dur: 0.22, freq: n('C4'), gain: 0.8 },
    ],
    lowpass: 3000,
    peak: 0.5,
  },
  // Something new opens (level, world): a sparkling sweep up.
  unlock: {
    tones: [
      { wave: 'pulse25', at: 0, dur: 0.05, freq: n('C5'), gain: 0.4 },
      { wave: 'pulse25', at: 0.05, dur: 0.05, freq: n('G5'), gain: 0.4 },
      { wave: 'pulse25', at: 0.1, dur: 0.05, freq: n('C6'), gain: 0.4 },
      { wave: 'pulse25', at: 0.15, dur: 0.25, freq: n('E6'), gain: 0.4 },
      { wave: 'triangle', at: 0.15, dur: 0.4, freq: n('G6'), gain: 0.3 },
    ],
    lowpass: 6500,
    peak: 0.5,
  },
  // Lesson card turns: a soft "swish".
  'page-turn': {
    tones: [
      {
        wave: 'noise',
        at: 0,
        dur: 0.13,
        freq: 9000,
        to: 3000,
        gain: 0.5,
        attack: 0.03,
        decay: 'linear',
      },
    ],
    lowpass: 3500,
    peak: 0.35,
  },
} satisfies Record<string, Recipe>;

export type SfxName = keyof typeof SFX_RECIPES;
