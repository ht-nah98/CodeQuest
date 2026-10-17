import { z } from 'zod';

/** Books on a shelf (ADR-0025 §1). */
export const SORTER_MIN_BOOKS = 2;
export const SORTER_MAX_BOOKS = 7;
/** The number on a book's spine; the stage draws taller books for bigger numbers. */
export const SORTER_MIN_NUMBER = 1;
export const SORTER_MAX_NUMBER = 9;
/** `maxQuestions` bounds. */
export const SORTER_MAX_QUESTIONS = 60;

/** Comparisons of `sách này [= ▾] [7]?`. */
export const SORTER_OPS = ['EQ', 'GT', 'LT'] as const;
export type SorterOp = (typeof SORTER_OPS)[number];

const bookNumber = z.number().int().min(SORTER_MIN_NUMBER).max(SORTER_MAX_NUMBER);

/**
 * `level.config` of a sorter level ("Kệ sách", ADR-0025 §2, product/game-kinds.md §3.6).
 * Authoring rules that need the whole level (a sorted goal on a shelf already in order, a book to
 * find missing from a map, the question budget against the solution) are content:check rule 27.
 */
export const sorterConfigSchema = z
  .strictObject({
    /** Book numbers from left to right. */
    books: z.array(bookNumber).min(SORTER_MIN_BOOKS).max(SORTER_MAX_BOOKS),
    /** What a run must reach when the program ends; at least one, never `find` with `end`. */
    goal: z.strictObject({
      sorted: z.literal(true).optional(),
      find: bookNumber.optional(),
      end: z.literal(true).optional(),
    }),
    /** Book questions allowed (`sách này …?`, `lớn hơn bên phải?`); none = no limit. */
    maxQuestions: z.number().int().min(1).max(SORTER_MAX_QUESTIONS).optional(),
  })
  .superRefine((config, ctx) => {
    const { goal } = config;
    if (goal.sorted === undefined && goal.find === undefined && goal.end === undefined) {
      ctx.addIssue({ code: 'custom', path: ['goal'], message: 'goal needs sorted, find or end' });
    }
    if (goal.find !== undefined && goal.end !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['goal'],
        message: 'goal cannot have both find (stop at a book) and end (stop at the flag)',
      });
    }
  });
export type SorterConfig = z.infer<typeof sorterConfigSchema>;
