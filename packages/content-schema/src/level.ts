import { z } from 'zod';
import { HintRuleSchema } from './hint';
import { GameKindIdSchema, LevelModeSchema } from './runtime';
import { ContentWorkspaceJsonSchema } from './workspace';

/** Role of a level inside its world. A lesson is not a stage. */
export const LEVEL_STAGES = [
  'guided',
  'practice',
  'challenge',
  'boss',
  'creative',
  'bonus',
] as const;
export const LevelStageSchema = z.enum(LEVEL_STAGES);
export type LevelStage = z.infer<typeof LevelStageSchema>;

/**
 * A toolbox entry: a block type, or a block type with default field values.
 * No `inputs` on purpose: blocks dragged from the toolbox never carry shadows
 * (content-model.md §5 rule 12).
 */
export const ToolboxEntrySchema = z.union([
  z.string().min(1),
  z.strictObject({
    type: z.string().min(1),
    fields: z.record(z.string(), z.unknown()).optional(),
  }),
]);
export type ToolboxEntry = z.infer<typeof ToolboxEntrySchema>;

const positiveInt = z.number().int().positive();

/** Same pattern as feedback.json keys (coding-standards.md §2). */
const REASON_CODE = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

const PredictOptionSchema = z.strictObject({
  key: z.string().min(1),
  label: z.string().min(1),
});

/**
 * One level (content-model.md §3). Cross-field requirements that the engine relies on are
 * enforced here; pedagogical rules (word counts, misconception, thinkingHint) belong to
 * content:check rules 5–8.
 */
export const LevelSchema = z
  .strictObject({
    id: z.string().min(1),
    worldId: z.string().min(1),
    stage: LevelStageSchema,
    kind: GameKindIdSchema,
    mode: LevelModeSchema,
    title: z.string().min(1),
    objective: z.string().min(1),
    learningGoal: z.string().min(1),
    misconception: z.string().min(1).optional(),
    toolbox: z.array(ToolboxEntrySchema),
    maxBlocks: positiveInt.optional(),
    maxInstances: z.record(z.string().min(1), z.number().int().nonnegative()).optional(),
    par: positiveInt.optional(),
    parEdits: positiveInt.optional(),
    config: z.unknown(),
    initialWorkspace: ContentWorkspaceJsonSchema.optional(),
    solution: ContentWorkspaceJsonSchema.optional(),
    predict: z
      .strictObject({
        options: z
          .array(PredictOptionSchema)
          .min(3)
          .max(4)
          .refine(
            (options) => new Set(options.map((option) => option.key)).size === options.length,
            {
              message: 'predict option keys must be unique',
            },
          ),
      })
      .optional(),
    hints: z.array(HintRuleSchema),
    thinkingHint: z.string().min(1).optional(),
    feedback: z
      .record(
        z.string().regex(REASON_CODE, 'reasonCode must be SCREAMING_SNAKE_CASE'),
        z.string().min(1),
      )
      .optional(),
    limits: z
      .strictObject({
        // Caps are 10x the engine defaults (100 000 steps, 1 000 actions; runtime-engine.md §4).
        maxSteps: positiveInt.max(1_000_000).optional(),
        maxActions: positiveInt.max(10_000).optional(),
      })
      .optional(),
    retired: z.boolean().optional(),
  })
  .superRefine((level, ctx) => {
    const require = (key: keyof typeof level, why: string): void => {
      if (level[key] === undefined) {
        ctx.addIssue({ code: 'custom', path: [key], message: `"${key}" is required ${why}` });
      }
    };
    if (level.mode === 'build' || level.mode === 'parsons') require('par', `in mode ${level.mode}`);
    if (level.mode === 'parsons' || level.mode === 'predict' || level.mode === 'bughunt') {
      require('initialWorkspace', `in mode ${level.mode}`);
    }
    if (level.mode !== 'predict' && level.mode !== 'creative') {
      require('solution', `in mode ${level.mode}`);
    }
    if (level.mode === 'predict') require('predict', 'in mode predict');
    if (level.mode !== 'predict' && level.predict !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['predict'],
        message: '"predict" only fits mode predict',
      });
    }
    if (level.parEdits !== undefined && level.mode !== 'bughunt') {
      ctx.addIssue({
        code: 'custom',
        path: ['parEdits'],
        message: '"parEdits" only fits mode bughunt',
      });
    }
    const ids = new Set<string>();
    level.hints.forEach((hint, index) => {
      if (ids.has(hint.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['hints', index, 'id'],
          message: `duplicate hint id "${hint.id}"`,
        });
      }
      ids.add(hint.id);
    });
  });
export type Level = z.infer<typeof LevelSchema>;
