import { z } from 'zod';
import { LeanbotImageSchema, LeanbotScreenSchema } from './leanbot';

// Thế giới Leanbot lessons (ADR-0030, docs/product/the-gioi-leanbot-bai-giang.md): step-by-step
// lessons on Pythaverse's Leanbot blocks, from the first block to the AIROC run. A lesson is a
// list of screens; a screen either reads (a card, or a real-robot step with the code to upload)
// or asks the child to build a program, which is checked by comparing its Arduino code with the
// code of the screen's solution.

/** Stable id of a screen: progress is stored by it, so it must not change once published. */
const ScreenId = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(30);

/** A program as Blockly XML, the format Pythaverse's editor saves. */
const ProgramXml = z.string().min(1).startsWith('<xml');

/**
 * How a build screen is set: `build` from an empty workspace, `fix` a wrong program, `fill` the
 * numbers of a program, `code` blocks that print the code shown (the code is the task).
 */
export const LBW_BUILD_MODES = ['build', 'fix', 'fill', 'code'] as const;
export const LbwBuildModeSchema = z.enum(LBW_BUILD_MODES);
export type LbwBuildMode = z.infer<typeof LbwBuildModeSchema>;

/** Said when the child's code contains `match` and is not right yet. */
export const LbwHintSchema = z.strictObject({
  match: z.string().min(1).max(80),
  say: z.string().min(1).max(80),
});
export type LbwHint = z.infer<typeof LbwHintSchema>;

export const LbwReadScreenSchema = z.strictObject({
  kind: z.literal('read'),
  id: ScreenId,
  screen: LeanbotScreenSchema,
  /** A real-robot step: the program whose code the child copies to Leanbot IDE. */
  program: ProgramXml.optional(),
});
export type LbwReadScreen = z.infer<typeof LbwReadScreenSchema>;

export const LbwBuildScreenSchema = z
  .strictObject({
    kind: z.literal('build'),
    id: ScreenId,
    mode: LbwBuildModeSchema,
    /** The task, one short sentence (a bubble: ≤ 12 words). */
    task: z.string().min(1).max(70),
    /** At most two more sentences under the task. */
    help: z.array(z.string().min(1).max(120)).max(2).optional(),
    image: LeanbotImageSchema.optional(),
    /** Block types in the toolbox, in this order. Only these: blocks open one lesson at a time. */
    toolbox: z.array(z.string().min(1)).min(1).max(30),
    /** Blocks met for the first time here: listed first, under "Khối mới". */
    newBlocks: z.array(z.string().min(1)).max(4).optional(),
    /** Starting program; empty workspace when left out. */
    start: ProgramXml.optional(),
    solution: ProgramXml,
    /** Other programs that are right too (another unit, another order). */
    accept: z.array(ProgramXml).max(4).optional(),
    hints: z.array(LbwHintSchema).max(6).optional(),
    /** Said when it is right. */
    done: z.string().min(1).max(80).optional(),
  })
  .refine((s) => (s.newBlocks ?? []).every((type) => s.toolbox.includes(type)), {
    path: ['newBlocks'],
    message: 'every new block must be in the toolbox',
  })
  .refine((s) => s.mode === 'build' || s.mode === 'code' || s.start !== undefined, {
    path: ['start'],
    message: '"fix" and "fill" screens start from a program',
  });
export type LbwBuildScreen = z.infer<typeof LbwBuildScreenSchema>;

export const LbwScreenSchema = z.discriminatedUnion('kind', [
  LbwReadScreenSchema,
  LbwBuildScreenSchema,
]);
export type LbwScreen = z.infer<typeof LbwScreenSchema>;

export const LeanbotWorldLessonSchema = z.strictObject({
  /** File name without .json, also the route segment: "l0-xuong-khoi". */
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(40),
  /** Order in the list. */
  number: z.number().int().nonnegative(),
  /** Chặng 0–5 of the plan. */
  stage: z.number().int().min(0).max(5),
  title: z.string().min(1).max(60),
  /** "Học xong con làm được…": what the last screen achieves. */
  canDo: z.string().min(1).max(80),
  image: LeanbotImageSchema.optional(),
  /** What the child can do afterwards, in small steps. */
  goals: z.array(z.string().min(1).max(80)).min(2).max(6),
  screens: z
    .array(LbwScreenSchema)
    .min(1)
    .max(20)
    .refine((screens) => new Set(screens.map((s) => s.id)).size === screens.length, {
      message: 'two screens share one id',
    }),
  /** The lesson of the Leanbot course (`/leanbot/<id>`) that reads more about it. */
  course: z
    .string()
    .regex(/^bai-\d{2}$/)
    .optional(),
});
export type LeanbotWorldLesson = z.infer<typeof LeanbotWorldLessonSchema>;
