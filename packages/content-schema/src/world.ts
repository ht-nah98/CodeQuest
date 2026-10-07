import { z } from 'zod';

/**
 * Scenery of a world's stages (P2-23, stage-rendering.md §7): the runner backdrop and ground,
 * the maze's wall and floor tiles, the static pictures and the world's island on the map.
 * Decoration only: hazards, items and goals look the same in every theme.
 */
export const SCENE_THEMES = ['lang-tre', 'rung-lap-lai', 'xuong', 'nga-ba', 'song'] as const;
export const SceneThemeSchema = z.enum(SCENE_THEMES);
export type SceneTheme = z.infer<typeof SceneThemeSchema>;
/** The theme of a world without `theme.scene` (and of the dev sandbox): Làng Tre. */
export const DEFAULT_SCENE_THEME: SceneTheme = 'lang-tre';

/**
 * Characters a story chapter can show next to Măng (P2-24): the profile avatars, so every child
 * meets "their" animal in the tale (curriculum.md §5.0). Măng (the panda) is always drawn.
 */
export const STORY_CAST = [
  'bunny',
  'owl',
  'frog',
  'chick',
  'pig',
  'cat',
  'fox',
  'bear',
  'tiger',
  'penguin',
  'koala',
] as const;
export const StoryCastSchema = z.enum(STORY_CAST);
export type StoryCast = z.infer<typeof StoryCastSchema>;

/** The landmark of a chapter's picture: the goal pictures plus a few scenery props. */
export const STORY_PROPS = [
  'wind',
  'shoots',
  'bamboo',
  'river',
  'machine',
  'exit',
  'home',
  'footprints',
  'cage',
  'cage-open',
  'dock',
  'key',
] as const;
export const StoryPropSchema = z.enum(STORY_PROPS);
export type StoryProp = z.infer<typeof StoryPropSchema>;

/** Chapter ids: kebab-case, unique in their world; part of the voice ids, so never renamed. */
export const STORY_CHAPTER_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * One chapter of the world's tale (P2-24, content-model.md §3): told on the world page, opened
 * by winning `unlockAfter` (a level of the same world; the first chapter has none). Copy limits
 * (title ≤ 5 words, lines ≤ 12 words) and the unlock order are content:check rule 21.
 */
export const StoryChapterSchema = z.strictObject({
  id: z.string().regex(STORY_CHAPTER_ID),
  title: z.string().min(1),
  lines: z.array(z.string().min(1)).min(2).max(4),
  unlockAfter: z.string().min(1).optional(),
  /** The chapter's small pixel picture: Măng, up to 2 characters and a landmark. */
  art: z.strictObject({
    cast: z
      .array(StoryCastSchema)
      .max(2)
      .refine((cast) => new Set(cast).size === cast.length, 'a character appears twice')
      .optional(),
    prop: StoryPropSchema,
  }),
});
export type StoryChapter = z.infer<typeof StoryChapterSchema>;

/** One of the 10 worlds on the map (content-model.md §3). */
export const WorldSchema = z.strictObject({
  id: z.string().min(1),
  order: z.number().int().min(1).max(10),
  title: z.string().min(1),
  emoji: z.string().min(1),
  concept: z.string().min(1),
  story: z.string().min(1),
  /** The world's tale in chapters (P2-24); `story` stays the one-line summary. */
  chapters: z.array(StoryChapterSchema).min(1).optional(),
  theme: z.strictObject({
    tileset: z.string().min(1),
    music: z.string().min(1).optional(),
    palette: z.enum(['day', 'dusk', 'night']).optional(),
    /** Scenery of the world's stages; default `lang-tre` (`sceneThemeOf`). */
    scene: SceneThemeSchema.optional(),
  }),
  lessonIds: z.array(z.string().min(1)),
  levelIds: z.array(z.string().min(1)).min(1),
  /** Share of the world's max stars needed to open the next world; standard value 0.6. */
  unlock: z.strictObject({ minStarRatio: z.number().min(0).max(1) }),
  unplugged: z
    .strictObject({
      title: z.string().min(1),
      steps: z.array(z.string().min(1)).min(1),
    })
    .optional(),
});
export type World = z.infer<typeof WorldSchema>;

/** The scenery theme of a world (`theme.scene`, default Làng Tre); `undefined` → the default. */
export function sceneThemeOf(world: Pick<World, 'theme'> | undefined): SceneTheme {
  return world?.theme.scene ?? DEFAULT_SCENE_THEME;
}
