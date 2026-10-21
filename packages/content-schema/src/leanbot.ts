import { z } from 'zod';

// The Leanbot track (ADR-0028): a second course inside the same app, translated from
// Pythaverse's "Synapse City Primary". It is read, watched and tried on a real robot, so its
// pages are screens of their own rather than levels: no Blockly, no simulation, no par.
//
// One screen holds one idea. The shapes below are the only ones a screen may use, which is
// what keeps an author from pasting a wall of text into a page meant for a nine-year-old.

/** Coloured chips, used in pairs for the two things a child keeps confusing. */
export const LEANBOT_TONES = ['go', 'oops', 'coin', 'sky'] as const;
export const LeanbotToneSchema = z.enum(LEANBOT_TONES);
export type LeanbotTone = z.infer<typeof LeanbotToneSchema>;

export const LeanbotChipSchema = z.strictObject({
  label: z.string().min(1).max(40),
  body: z.string().min(1).max(60),
  tone: LeanbotToneSchema,
});

export const LeanbotTableSchema = z.strictObject({
  head: z.array(z.string().min(1)).min(2).max(3),
  rows: z.array(z.array(z.string()).min(2).max(3)).min(1).max(10),
});

/** A numbered procedure. Longer than eight steps is a sign the screen holds two ideas. */
export const LeanbotStepListSchema = z
  .array(z.tuple([z.string().min(1).max(3), z.string().min(1).max(90)]))
  .min(2)
  .max(8);

/**
 * One screen. Every field is optional except the heading, so a screen can be a picture, a
 * table, a procedure or a warning - but the text fields are short by construction.
 */
export const LeanbotScreenSchema = z
  .strictObject({
    /** Eyebrow above the heading; screens sharing a part read as one section. */
    part: z.string().min(1).max(30),
    title: z.string().min(1).max(60),
    /** At most three sentences. Anything longer belongs on its own screen. */
    lines: z.array(z.string().min(1).max(120)).max(3).optional(),
    /** Path under `/leanbot/img/`, e.g. "leanbot-phan-cung-1.png". */
    image: z.string().min(1).optional(),
    /** Required with `image`: what the picture shows, for a child using a screen reader. */
    alt: z.string().min(1).optional(),
    chips: z.array(LeanbotChipSchema).min(2).max(3).optional(),
    table: LeanbotTableSchema.optional(),
    steps: LeanbotStepListSchema.optional(),
    list: z.array(z.string().min(1).max(140)).min(2).max(5).optional(),
    code: z.string().min(1).max(200).optional(),
    link: z.strictObject({ label: z.string().min(1), href: z.url() }).optional(),
    /** Red box: a trap that looks like a broken robot. */
    warn: z.string().min(1).max(200).optional(),
    /** Yellow box: a trick worth keeping. */
    tip: z.string().min(1).max(200).optional(),
    /** Grey box: something true but not urgent. */
    note: z.string().min(1).max(200).optional(),
    /** Tick box the child presses after doing it on the real robot. */
    check: z.string().min(1).max(60).optional(),
  })
  .refine((s) => s.image === undefined || s.alt !== undefined, {
    path: ['alt'],
    message: 'an image needs an "alt" description',
  })
  .refine(
    (s) =>
      s.lines !== undefined ||
      s.image !== undefined ||
      s.chips !== undefined ||
      s.table !== undefined ||
      s.steps !== undefined ||
      s.list !== undefined ||
      s.code !== undefined,
    { message: 'a screen needs something to show besides its heading' },
  );
export type LeanbotScreen = z.infer<typeof LeanbotScreenSchema>;

export const LeanbotQuestionSchema = z
  .strictObject({
    q: z.string().min(1).max(140),
    options: z.array(z.string().min(1).max(60)).min(2).max(4),
    correct: z.number().int().nonnegative(),
    /** Shown after answering, right or wrong. */
    explain: z.string().min(1).max(200),
  })
  .refine((q) => q.correct < q.options.length, {
    path: ['correct'],
    message: '"correct" must index one of the options',
  });
export type LeanbotQuestion = z.infer<typeof LeanbotQuestionSchema>;

export const LeanbotLessonSchema = z.strictObject({
  /** File name without .json, also the route segment: "bai-00". */
  id: z.string().regex(/^bai-\d{2}$/),
  /** Order in the list; the number the child sees. */
  number: z.number().int().nonnegative(),
  title: z.string().min(1).max(60),
  /** One line under the title in the list. */
  tagline: z.string().min(1).max(80),
  minutes: z.number().int().positive().max(120),
  /** What the child can do afterwards, as the coach will tick it off. */
  goals: z.array(z.string().min(1).max(80)).min(3).max(8),
  screens: z.array(LeanbotScreenSchema).min(1).max(40),
  quiz: z.array(LeanbotQuestionSchema).min(3).max(10),
  /** Where this came from in the English course, for the coach. */
  source: z.string().min(1).optional(),
});
export type LeanbotLesson = z.infer<typeof LeanbotLessonSchema>;
