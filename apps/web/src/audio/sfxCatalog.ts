// Sound files under apps/web/public/audio/ (made by `npm run audio:gen`, tools/audio/).

/**
 * Sound effects and their level in the mix (0..1). The names match tools/audio/src/sfx.ts;
 * a test checks that each one has a file.
 */
export const SFX = {
  click: 0.5,
  snap: 0.7,
  drop: 0.6,
  run: 0.7,
  step: 0.45,
  jump: 0.6,
  fall: 0.8,
  bump: 0.8,
  kick: 0.7,
  collect: 0.7,
  coin: 0.7,
  star: 0.8,
  win: 0.8,
  fanfare: 0.8,
  wrong: 0.7,
  unlock: 0.8,
  'page-turn': 0.6,
} as const satisfies Record<string, number>;

export type SfxName = keyof typeof SFX;

export const SFX_NAMES = Object.keys(SFX) as SfxName[];

/** Background loops: `village` for map / world / lesson, `adventure` for the play screen. */
export const MUSIC_TRACKS = ['village', 'adventure'] as const;

export type MusicTrack = (typeof MUSIC_TRACKS)[number];

const base = import.meta.env.BASE_URL;

export const sfxUrl = (name: SfxName): string => `${base}audio/sfx/${name}.mp3`;
export const musicUrl = (track: MusicTrack): string => `${base}audio/music/${track}.mp3`;
