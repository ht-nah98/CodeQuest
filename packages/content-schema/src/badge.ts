import { z } from 'zod';
import { LevelStageSchema } from './level';
import { LevelModeSchema } from './runtime';

export const BADGE_EVENTS = ['first-run', 'persistent', 'robot-mission'] as const;
export type BadgeEvent = (typeof BADGE_EVENTS)[number];

/** Data-driven badge condition (rewards-engine.md §5). */
export const BadgeRuleSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('count-levels'),
    minStars: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    withAnyBlock: z.array(z.string().min(1)).min(1).optional(),
    mode: LevelModeSchema.optional(),
    stage: z.array(LevelStageSchema).min(1).optional(),
    gte: z.number().int().positive(),
  }),
  z.strictObject({ type: z.literal('predict-first-try'), gte: z.number().int().positive() }),
  z.strictObject({ type: z.literal('world-clear'), worldId: z.string().min(1) }),
  z.strictObject({ type: z.literal('streak'), gte: z.number().int().positive() }),
  z.strictObject({ type: z.literal('event'), name: z.enum(BADGE_EVENTS) }),
]);
export type BadgeRule = z.infer<typeof BadgeRuleSchema>;

/** An achievement shown on the badges screen. */
export const BadgeSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  rule: BadgeRuleSchema,
});
export type Badge = z.infer<typeof BadgeSchema>;

/** `content/shared/badges.json`: every badge, in display order. */
export const BadgesFileSchema = z.array(BadgeSchema);
