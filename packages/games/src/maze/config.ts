import { z } from 'zod';

/** Map characters: wall, path, start, goal, path with a bamboo shoot. */
export const MAZE_TILES = ['#', '.', 'S', 'G', 'b'] as const;
export type MazeTile = (typeof MAZE_TILES)[number];

/** Compass directions, clockwise from north; row 0 is the top row, so N is "up". */
export const MAZE_DIRS = ['N', 'E', 'S', 'W'] as const;
export type MazeDir = (typeof MAZE_DIRS)[number];

/** Sensor directions, relative to where Măng faces; also the `maze_is_path` dropdown values. */
export const MAZE_SENSE_DIRS = ['AHEAD', 'LEFT', 'RIGHT'] as const;
export type MazeSenseDir = (typeof MAZE_SENSE_DIRS)[number];

/** Bounds on both the row count and the column count. */
export const MAZE_MIN_SIZE = 3;
export const MAZE_MAX_SIZE = 12;

const UNKNOWN_TILE = /[^#.SGb]/;

function count(map: readonly string[], tile: MazeTile): number {
  return map.reduce((sum, row) => sum + row.split(tile).length - 1, 0);
}

/** `level.config` of a maze level (product/game-kinds.md §3.2). */
export const mazeConfigSchema = z
  .strictObject({
    /** Rows top to bottom, all the same width; cells are addressed `[row, column]` from 0. */
    map: z.array(z.string()).min(MAZE_MIN_SIZE).max(MAZE_MAX_SIZE),
    /** Direction Măng faces on `S`. */
    startDir: z.enum(MAZE_DIRS),
    goal: z.strictObject({ collectAll: z.boolean().optional() }).optional(),
  })
  .superRefine((config, ctx) => {
    const { map } = config;
    const width = map[0]?.length ?? 0;
    if (width < MAZE_MIN_SIZE || width > MAZE_MAX_SIZE) {
      ctx.addIssue({
        code: 'custom',
        path: ['map', 0],
        message: `rows must have ${String(MAZE_MIN_SIZE)}–${String(MAZE_MAX_SIZE)} columns`,
      });
    }
    map.forEach((row, index) => {
      if (row.length !== width) {
        ctx.addIssue({
          code: 'custom',
          path: ['map', index],
          message: `every row must have ${String(width)} columns like row 0`,
        });
      }
      const bad = UNKNOWN_TILE.exec(row)?.[0];
      if (bad !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['map', index],
          message: `unknown tile "${bad}"; use ${MAZE_TILES.join(' ')}`,
        });
      }
    });
    for (const tile of ['S', 'G'] as const) {
      if (count(map, tile) !== 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['map'],
          message: `map must contain exactly one "${tile}"`,
        });
      }
    }
    if (config.goal?.collectAll === true && count(map, 'b') === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['goal', 'collectAll'],
        message: 'collectAll needs at least one "b" on the map',
      });
    }
  });
export type MazeConfig = z.infer<typeof mazeConfigSchema>;
