import { z } from 'zod';
import { RunResultSchema } from './runtime';

// Grammar: docs/architecture/hint-engine.md §3.

const NumCmpSchema = z.strictObject({
  lt: z.number().optional(),
  lte: z.number().optional(),
  eq: z.number().optional(),
  gte: z.number().optional(),
  gt: z.number().optional(),
});
export type NumCmp = z.infer<typeof NumCmpSchema>;

export const HINT_TRIGGERS = ['enter', 'change', 'run-end', 'idle'] as const;
export type HintTrigger = (typeof HINT_TRIGGERS)[number];

const AtomicConditionSchema = z.strictObject({
  trigger: z.enum(HINT_TRIGGERS).optional(),
  blockCount: NumCmpSchema.optional(),
  topBlockCount: NumCmpSchema.optional(),
  has: z.string().min(1).optional(),
  missing: z.string().min(1).optional(),
  orphans: z.boolean().optional(),
  capacityFull: z.boolean().optional(),
  lastResult: RunResultSchema.optional(),
  lastReason: z.string().min(1).optional(),
  runCount: NumCmpSchema.optional(),
  failStreak: NumCmpSchema.optional(),
  idleSeconds: NumCmpSchema.optional(),
});
/** Keys inside one object are AND-ed together. */
export type AtomicCondition = z.infer<typeof AtomicConditionSchema>;

// Written by hand because the schema is recursive; `| undefined` mirrors zod's optional output.
export type Condition =
  { all: Condition[] } | { any: Condition[] } | { not: Condition } | AtomicCondition;

export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.strictObject({ all: z.array(ConditionSchema).min(1) }),
    z.strictObject({ any: z.array(ConditionSchema).min(1) }),
    z.strictObject({ not: ConditionSchema }),
    AtomicConditionSchema,
  ]),
);

/**
 * Where Măng points: a toolbox block, a workspace block, the run button, the capacity bar, the
 * stage, or the "Từng bước" button (`step`, P2-11 T10).
 */
export const HintTargetSchema = z.union([
  z.templateLiteral(['toolbox:', z.string().min(1)]),
  z.templateLiteral(['block:', z.string().min(1)]),
  z.enum(['run', 'capacity', 'stage', 'step']),
]);
export type HintTarget = z.infer<typeof HintTargetSchema>;

/** One tier-0 hint rule of a level. */
export const HintRuleSchema = z.strictObject({
  id: z.string().min(1),
  when: ConditionSchema,
  say: z.string().min(1),
  point: HintTargetSchema.optional(),
  spotlight: z.boolean().optional(),
  once: z.boolean().optional(),
  priority: z.number().int().optional(),
});
export type HintRule = z.infer<typeof HintRuleSchema>;
