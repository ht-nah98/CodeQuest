import { z } from 'zod';

/** Cells implemented so far; `branch` and `crate` arrive with crouch and kick (Phase 1). */
export const RUNNER_CELLS = ['ground', 'hole', 'flag'] as const;
export type RunnerCell = (typeof RUNNER_CELLS)[number];

export const RUNNER_MIN_CELLS = 3;
export const RUNNER_MAX_CELLS = 40;

/** `level.config` of a runner level (product/game-kinds.md §3.1). */
export const runnerConfigSchema = z
  .strictObject({
    /** One lane, indexed from 0; exactly one `flag`, and it is the last cell. */
    cells: z.array(z.enum(RUNNER_CELLS)).min(RUNNER_MIN_CELLS).max(RUNNER_MAX_CELLS),
    /** Index of the `ground` cell Măng starts on. */
    start: z.number().int().nonnegative(),
  })
  .superRefine((config, ctx) => {
    const flags = config.cells.filter((cell) => cell === 'flag').length;
    if (flags !== 1 || config.cells[config.cells.length - 1] !== 'flag') {
      ctx.addIssue({
        code: 'custom',
        path: ['cells'],
        message: 'cells must contain exactly one "flag", as the last cell',
      });
    }
    if (config.cells[config.start] !== 'ground') {
      ctx.addIssue({
        code: 'custom',
        path: ['start'],
        message: 'start must be the index of a "ground" cell',
      });
    }
  });
export type RunnerConfig = z.infer<typeof runnerConfigSchema>;
