import { z } from 'zod';
import { gridPoint, HEADING_DEGREES, onPaper, segmentKey, step, type TurtlePoint } from './lattice';

/** Paper sides in unit steps (curriculum.md §6.4: paper ≤ 12 × 12). */
export const TURTLE_MIN_SIZE = 1;
export const TURTLE_MAX_SIZE = 12;

/** `tiến [n] bước`: n is 1…9 (one search value per step count). */
export const TURTLE_FORWARD_MIN = 1;
export const TURTLE_FORWARD_MAX = 9;

/** Every angle the static `DEG` dropdown offers (ADR-0024 §1). */
export const TURTLE_ANGLES = [30, 60, 90, 120, 150, 180] as const;
export type TurtleAngle = (typeof TURTLE_ANGLES)[number];

/** Angles a level may pin when `config.angles` is left out. */
export const TURTLE_DEFAULT_ANGLES: readonly TurtleAngle[] = [60, 90, 120];

/** Dot pattern the stage draws on the paper; no effect on the rules. */
export const TURTLE_GRIDS = ['square', 'tri'] as const;

/** Longest `F<n>` of a target path. */
const MAX_PATH_STEPS = 24;

const PATH_TOKEN = /^(?:F(\d+)|([RL])(\d+)|U|D)$/;

const degrees = z
  .number()
  .int()
  .min(0)
  .max(330)
  .refine((value) => value % HEADING_DEGREES === 0, 'must be a multiple of 30');

const paperCoord = z.number().int().min(0).max(TURTLE_MAX_SIZE);

/**
 * One piece of the target picture, written as a turtle path from a whole paper point: tokens
 * `F<n>` (n unit steps), `R<deg>` / `L<deg>` (turn, a multiple of 30), `U` / `D` (pen up /
 * down; the path starts with the pen down). Example: `"F2 R90 F2 R90 F2 R90 F2"`.
 */
export const turtlePathSchema = z.strictObject({
  from: z.tuple([paperCoord, paperCoord]),
  /** Degrees counter-clockwise from east: 0 = right, 90 = up. */
  heading: degrees,
  path: z.string().min(1),
});
export type TurtlePath = z.infer<typeof turtlePathSchema>;

/** Unit segments of a target path, or the first problem with it. */
export function expandPath(
  path: TurtlePath,
  size: { readonly w: number; readonly h: number },
): { segments: string[] } | { error: string } {
  let point: TurtlePoint = gridPoint(path.from[0], path.from[1]);
  let heading = path.heading / HEADING_DEGREES;
  let down = true;
  const segments: string[] = [];
  for (const token of path.path.trim().split(/\s+/)) {
    const match = PATH_TOKEN.exec(token);
    if (match === null)
      return { error: `unknown path token "${token}"; use F<n> R<deg> L<deg> U D` };
    const [, forward, side, angle] = match;
    if (forward !== undefined) {
      const steps = Number(forward);
      if (steps < 1 || steps > MAX_PATH_STEPS) {
        return { error: `"${token}": steps must be 1–${String(MAX_PATH_STEPS)}` };
      }
      for (let index = 0; index < steps; index++) {
        const next = step(point, heading);
        // Pen up too: the turtle itself would crash OFF_PAPER there.
        if (!onPaper(next, size)) return { error: `"${token}" leaves the paper` };
        if (down) segments.push(segmentKey(point, next));
        point = next;
      }
    } else if (side !== undefined && angle !== undefined) {
      const turn = Number(angle);
      if (turn < 1 || turn > 360 || turn % HEADING_DEGREES !== 0) {
        return { error: `"${token}": the angle must be a multiple of 30 in 30–360` };
      }
      heading += (side === 'L' ? 1 : -1) * (turn / HEADING_DEGREES);
    } else {
      down = token === 'D';
    }
  }
  return { segments };
}

/**
 * `level.config` of a turtle level (ADR-0024 §7, product/game-kinds.md §3.4). Content:check
 * rule 26 checks what needs the toolbox and the programs (start on the target, pinned angles).
 */
export const turtleConfigSchema = z
  .strictObject({
    /** Paper size in unit steps. */
    size: z.strictObject({
      w: z.number().int().min(TURTLE_MIN_SIZE).max(TURTLE_MAX_SIZE),
      h: z.number().int().min(TURTLE_MIN_SIZE).max(TURTLE_MAX_SIZE),
    }),
    /** Where Măng starts: a whole paper point, heading in degrees (0 = right, 90 = up). */
    start: z.strictObject({ x: paperCoord, y: paperCoord, heading: degrees }),
    /** The picture to draw ("hình mẫu"), as paths; none for predict or creative levels. */
    target: z.array(turtlePathSchema).min(1).max(12).optional(),
    /** Angles the level may pin in `turtle_turn_*` (default `TURTLE_DEFAULT_ANGLES`). */
    angles: z
      .array(z.union(TURTLE_ANGLES.map((angle) => z.literal(angle))))
      .min(1)
      .refine((angles) => new Set(angles).size === angles.length, 'angles must be unique')
      .optional(),
    /** Pen down at the start (default true). */
    penDown: z.boolean().optional(),
    grid: z.enum(TURTLE_GRIDS),
  })
  .superRefine((config, ctx) => {
    if (config.start.x > config.size.w || config.start.y > config.size.h) {
      ctx.addIssue({ code: 'custom', path: ['start'], message: 'start must be on the paper' });
    }
    for (const [index, path] of (config.target ?? []).entries()) {
      if (path.from[0] > config.size.w || path.from[1] > config.size.h) {
        ctx.addIssue({
          code: 'custom',
          path: ['target', index, 'from'],
          message: 'path must start on the paper',
        });
        continue;
      }
      const expanded = expandPath(path, config.size);
      if ('error' in expanded) {
        ctx.addIssue({ code: 'custom', path: ['target', index, 'path'], message: expanded.error });
      } else if (expanded.segments.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['target', index, 'path'],
          message: 'path draws nothing',
        });
      }
    }
  });
export type TurtleConfig = z.infer<typeof turtleConfigSchema>;

/** Target segments by `level.config` object (raw or parsed), so the API need not re-parse. */
const targetCache = new WeakMap<object, ReadonlySet<string> | null>();

/**
 * The target of a turtle `level.config` (as content holds it), cached per config object: the
 * sandbox API reads it from `ctx.level.config` on every step instead of keeping it in the state,
 * so the par search's state keys stay small (ADR-0024 §8). Null without target or when the
 * config does not parse (runLevel has rejected such a level already).
 */
export function targetOfLevelConfig(raw: unknown): ReadonlySet<string> | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const cached = targetCache.get(raw);
  if (cached !== undefined) return cached;
  const parsed = turtleConfigSchema.safeParse(raw);
  const target = parsed.success ? targetSegments(parsed.data) : null;
  targetCache.set(raw, target);
  return target;
}

/** The target picture as a set of unit segment keys, or null without `target`. */
export function targetSegments(config: TurtleConfig): Set<string> | null {
  if (config.target === undefined) return null;
  const segments = new Set<string>();
  for (const path of config.target) {
    const expanded = expandPath(path, config.size);
    if ('segments' in expanded) for (const key of expanded.segments) segments.add(key);
  }
  return segments;
}

/** The angles a level may use (`config.angles` or the default). */
export function turtleAngles(config: TurtleConfig): readonly number[] {
  return config.angles ?? TURTLE_DEFAULT_ANGLES;
}
