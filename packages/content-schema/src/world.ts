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

/** One of the 10 worlds on the map (content-model.md §3). */
export const WorldSchema = z.strictObject({
  id: z.string().min(1),
  order: z.number().int().min(1).max(10),
  title: z.string().min(1),
  emoji: z.string().min(1),
  concept: z.string().min(1),
  story: z.string().min(1),
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
