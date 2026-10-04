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

/** At most 3 maps per level: `config` plus 2 variants (P2-12). */
export const MAX_VARIANTS = 2;

/** Same pattern as feedback.json keys (coding-standards.md §2). */
const REASON_CODE = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

/**
 * Star goal kinds (P2-21, rewards-economy.md §1): extra aims that turn ⭐ into ⭐⭐ but never
 * decide the win. Only what the curriculum uses (curriculum.md §5.4 T19); add a kind here, in
 * each game kind's `checkStarGoal` and in the search when a level needs it.
 * - `collectAll`: every bamboo shoot of the map picked up (unlike `config.goal.collectAll`,
 *   the flag still wins without them).
 */
export const STAR_GOAL_KINDS = ['collectAll'] as const;
export const StarGoalSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('collectAll') }),
]);
export type StarGoal = z.infer<typeof StarGoalSchema>;
export type StarGoalKind = StarGoal['kind'];

/**
 * Picture drawn on the goal cell (P2-11c, curriculum.md §5.0 and §5.4 T17a). Decoration only:
 * it never changes the rules. Without it the stage draws its kind's default (flag, exit).
 */
export const GOAL_SPRITES = [
  'flag',
  'machine',
  'exit',
  'home',
  'footprints',
  'friend',
  'cage',
  'dock',
] as const;
export const GoalSpriteSchema = z.enum(GOAL_SPRITES);
export type GoalSprite = z.infer<typeof GoalSpriteSchema>;

/** Game kinds whose map has one goal cell that `goalSprite` can dress up. */
const GOAL_SPRITE_KINDS: ReadonlySet<string> = new Set(['runner', 'maze']);

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
    /** Story line of the level (P2-11c): ≤ 12 words (rule 5), read aloud as `<id>.mission`. */
    mission: z.string().min(1).optional(),
    /** Runner and maze only (P2-11c). */
    goalSprite: GoalSpriteSchema.optional(),
    toolbox: z.array(ToolboxEntrySchema),
    maxBlocks: positiveInt.optional(),
    maxInstances: z.record(z.string().min(1), z.number().int().nonnegative()).optional(),
    /**
     * Deepest nesting of loop blocks (`cq_repeat`, `cq_repeat_until`) allowed (P2-11, T16b):
     * 1 = no loop inside another loop. `maxInstances` counts per type, so it cannot stop a
     * `cq_repeat_until` inside a `cq_repeat`. Checked by rule 20 and the par search.
     */
    maxLoopDepth: positiveInt.optional(),
    par: positiveInt.optional(),
    parEdits: positiveInt.optional(),
    config: z.unknown(),
    /**
     * Extra maps (P2-12, ADR-0016): 1–2 more configs of the same kind. One program must win on
     * `config` and on every variant. Only modes `build` and `bughunt`.
     */
    variants: z.array(z.unknown()).min(1).max(MAX_VARIANTS).optional(),
    /**
     * Star goals (P2-21): with them ⭐⭐ = win + every goal, ⭐⭐⭐ = also ≤ par blocks (bughunt:
     * ≤ parEdits) and no tier-2/3 hint. A goal must hold on every map. Only modes build and
     * bughunt; each kind at most once.
     */
    starGoals: z.array(StarGoalSchema).min(1).max(STAR_GOAL_KINDS.length).optional(),
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
    if (level.variants !== undefined && level.mode !== 'build' && level.mode !== 'bughunt') {
      ctx.addIssue({
        code: 'custom',
        path: ['variants'],
        message: '"variants" only fits modes build and bughunt',
      });
    }
    if (level.starGoals !== undefined) {
      if (level.mode !== 'build' && level.mode !== 'bughunt') {
        ctx.addIssue({
          code: 'custom',
          path: ['starGoals'],
          message: '"starGoals" only fits modes build and bughunt',
        });
      }
      const kinds = new Set<string>();
      level.starGoals.forEach((goal, index) => {
        if (kinds.has(goal.kind)) {
          ctx.addIssue({
            code: 'custom',
            path: ['starGoals', index, 'kind'],
            message: `duplicate star goal "${goal.kind}"`,
          });
        }
        kinds.add(goal.kind);
      });
    }
    if (level.goalSprite !== undefined && !GOAL_SPRITE_KINDS.has(level.kind)) {
      ctx.addIssue({
        code: 'custom',
        path: ['goalSprite'],
        message: '"goalSprite" only fits kinds runner and maze',
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
