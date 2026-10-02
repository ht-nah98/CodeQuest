import { z } from 'zod';

/** Cells of the track (product/game-kinds.md §3.1). */
export const RUNNER_CELLS = ['ground', 'hole', 'branch', 'crate', 'flag'] as const;
export type RunnerCell = (typeof RUNNER_CELLS)[number];

/** Cells a bamboo shoot may sit on: the ones Măng can stop on besides the flag. */
const BAMBOO_CELLS: ReadonlySet<RunnerCell> = new Set(['ground', 'branch']);

/** Values of the `runner_is_ahead` dropdown (product/game-kinds.md §3.1). */
export const RUNNER_AHEAD_KINDS = ['HOLE', 'BRANCH', 'CRATE', 'CLEAR'] as const;
export type RunnerAheadKind = (typeof RUNNER_AHEAD_KINDS)[number];

export const RUNNER_MIN_CELLS = 3;
export const RUNNER_MAX_CELLS = 40;

/** `level.config` of a runner level (product/game-kinds.md §3.1). */
export const runnerConfigSchema = z
  .strictObject({
    /** One lane, indexed from 0; exactly one `flag`, and it is the last cell. */
    cells: z.array(z.enum(RUNNER_CELLS)).min(RUNNER_MIN_CELLS).max(RUNNER_MAX_CELLS),
    /** Index of the `ground` cell Măng starts on. */
    start: z.number().int().nonnegative(),
    /** Cells holding a bamboo shoot, picked up when Măng stops there. */
    bamboo: z.array(z.number().int().nonnegative()).optional(),
    goal: z
      .strictObject({
        /** Reaching the flag only wins once every bamboo shoot is picked up. Default false. */
        collectAll: z.boolean().optional(),
      })
      .optional(),
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
    if (config.goal?.collectAll === true && (config.bamboo ?? []).length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['goal', 'collectAll'],
        message: 'collectAll needs at least one bamboo position',
      });
    }
    const seen = new Set<number>();
    for (const [index, at] of (config.bamboo ?? []).entries()) {
      const cell = config.cells[at];
      let problem: string | undefined;
      if (cell === undefined || !BAMBOO_CELLS.has(cell)) {
        problem = 'bamboo must be on a "ground" or "branch" cell';
      } else if (at <= config.start) {
        // Măng only moves right and never "stops" on her start cell, so it could never be picked up.
        problem = 'bamboo must be ahead of start';
      } else if (seen.has(at)) {
        problem = 'bamboo positions must be unique';
      }
      seen.add(at);
      if (problem !== undefined)
        ctx.addIssue({ code: 'custom', path: ['bamboo', index], message: problem });
    }
  });
export type RunnerConfig = z.infer<typeof runnerConfigSchema>;
