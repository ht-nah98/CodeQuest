import {
  robotlabResolvedSchema,
  type RobotBlock,
  type RobotDir,
  type RobotLabConfig,
  type RobotLabGoal,
  type RobotLabLevelConfig,
  type RobotLabRules,
  type RobotTile,
} from './config';

/** A crossing as `[row, column]`, row 0 at the top. Plain JSON, so events can carry it. */
export type RobotCell = readonly [number, number];

/** Where a block is: on the board, in the gripper (at most one), or retrieved into the lab. */
export type RobotBlockWhere = { readonly at: RobotCell } | 'held' | 'done';

/** One block of the run, at a fixed index: `startHolding` first (if any), then `config.blocks`. */
export type RobotBlockState = RobotBlock & { where: RobotBlockWhere };

/** Mutable state of one robotlab run. Finished jobs are derived from `blocks[].where`. */
export interface RobotLabState {
  readonly map: readonly string[];
  readonly rules: RobotLabRules;
  readonly goal: RobotLabGoal;
  /** Crossing the robot stands on. Replaced, never mutated, so events keep their own copy. */
  pos: RobotCell;
  dir: RobotDir;
  /** Seconds used so far (virtual clock). */
  elapsed: number;
  /** Crossing the robot stood on when an action failed, for `predictAnswer`; else null. */
  crashAt: RobotCell | null;
  /** Indices fixed by the config; an entry's `where` is replaced, never mutated. */
  readonly blocks: RobotBlockState[];
}

export const cellKey = ([r, c]: RobotCell): string => `${String(r)},${String(c)}`;

export const sameCell = (a: RobotCell, b: RobotCell): boolean => a[0] === b[0] && a[1] === b[1];

/** Tile at `[r, c]`, or undefined outside the map. */
export function tileAt(map: readonly string[], [r, c]: RobotCell): RobotTile | undefined {
  return map[r]?.[c] as RobotTile | undefined;
}

/** The block lying on `cell`, or -1. */
export function blockIndexAt(state: RobotLabState, cell: RobotCell): number {
  return state.blocks.findIndex(
    ({ where }) => typeof where === 'object' && sameCell(where.at, cell),
  );
}

/** The block in the gripper, or -1. */
export function heldIndex(state: RobotLabState): number {
  return state.blocks.findIndex(({ where }) => where === 'held');
}

/** The copy of a block that events carry: kind and colour, no position. */
export function blockOf(block: RobotBlockState): RobotBlock {
  return block.kind === 'fence' ? { kind: 'fence' } : { kind: block.kind, color: block.color };
}

function findLab(map: readonly string[]): RobotCell {
  for (const [r, row] of map.entries()) {
    const c = row.indexOf('L');
    if (c !== -1) return [r, c];
  }
  return [0, 0];
}

/**
 * Initial state from a **resolved** config (`resolveRobotlabRules`). A config whose shared
 * rules were never merged throws, so `runLevel` reports INTERNAL_ERROR instead of running
 * with wrong rules.
 */
export function createRobotLabState(config: RobotLabConfig | RobotLabLevelConfig): RobotLabState {
  const parsed = robotlabResolvedSchema.safeParse(config);
  if (!parsed.success) throw new Error(`robotlab config not resolved: ${parsed.error.message}`);
  const resolved = parsed.data;
  const blocks: RobotBlockState[] = [];
  if (resolved.startHolding !== undefined) {
    blocks.push({ ...resolved.startHolding, where: 'held' });
  }
  for (const { at, ...block } of resolved.blocks ?? []) {
    blocks.push({ ...block, where: { at: [at[0], at[1]] } });
  }
  return {
    map: resolved.map,
    rules: resolved.rules,
    goal: resolved.goal,
    pos: resolved.start ?? findLab(resolved.map),
    dir: resolved.startDir,
    elapsed: 0,
    crashAt: null,
    blocks,
  };
}
