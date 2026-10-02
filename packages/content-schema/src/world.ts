import { z } from 'zod';

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
