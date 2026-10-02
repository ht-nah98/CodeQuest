// Pixi-free facts about Măng's spritesheet, shared by stage code and tests.

/** Animation keys in `public/sprites/panda.json` (stage-rendering.md §3). */
export const PANDA_ANIMATIONS = [
  'idle',
  'talk',
  'happy',
  'walk',
  'run',
  'crouch',
  'jump',
  'kick',
  'cheer',
] as const;
export type PandaAnimation = (typeof PANDA_ANIMATIONS)[number];

/** Frames per second (stage-rendering.md §3); unlisted animations hold one frame. */
export const PANDA_FPS: Partial<Record<PandaAnimation, number>> = { idle: 2, walk: 9, run: 12 };

/** Untrimmed frame box of the panda frames (tools/sprites/clean.py output), in texture px. */
export const PANDA_FRAME_SIZE = 280;
