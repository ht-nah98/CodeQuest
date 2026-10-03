import { z } from 'zod';
import { GameKindIdSchema } from './runtime';
import { ContentWorkspaceJsonSchema } from './workspace';

export const MASCOT_POSES = ['idle', 'talk', 'happy', 'cheer', 'think', 'point', 'oops'] as const;
export const MascotPoseSchema = z.enum(MASCOT_POSES);
export type MascotPose = z.infer<typeof MascotPoseSchema>;

/** One page of a lesson: Măng talking, a runnable demo, or a quiz. */
export const LessonCardSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('say'),
    pose: MascotPoseSchema,
    text: z.string().min(1),
    image: z.string().min(1).optional(),
  }),
  z.strictObject({
    type: z.literal('demo'),
    text: z.string().min(1),
    kind: GameKindIdSchema,
    config: z.unknown(),
    workspace: ContentWorkspaceJsonSchema,
    autoplay: z.boolean().optional(),
  }),
  z
    .strictObject({
      type: z.literal('quiz'),
      text: z.string().min(1),
      options: z.array(z.string().min(1)).min(2).max(4),
      correct: z.number().int().nonnegative(),
      explain: z.string().min(1),
    })
    .refine((card) => card.correct < card.options.length, {
      path: ['correct'],
      message: '"correct" must index one of the options',
    }),
]);
export type LessonCard = z.infer<typeof LessonCardSchema>;

/** A lesson: a short sequence of cards that explains a concept (content-model.md §3). */
export const LessonSchema = z.strictObject({
  id: z.string().min(1),
  worldId: z.string().min(1),
  title: z.string().min(1),
  /**
   * A block lesson ("Khối mới"): shown on the world path right before this level, where its
   * block first appears. Omitted for the world's opening lesson (content-model.md §3).
   */
  beforeLevel: z.string().min(1).optional(),
  cards: z.array(LessonCardSchema).min(1),
});
export type Lesson = z.infer<typeof LessonSchema>;
