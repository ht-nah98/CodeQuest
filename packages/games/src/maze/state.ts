import type { GoalItemKind } from '../goalItems';
import type { MazeConfig, MazeDir, MazeTile } from './config';

/** A cell as `[row, column]`, row 0 at the top. Plain JSON, so events can carry it. */
export type MazeCell = readonly [number, number];

/** A mission item still on the map (P2-11c). */
export interface MazeItem {
  readonly kind: GoalItemKind;
  readonly at: MazeCell;
}

/** Mutable state of one maze run. */
export interface MazeState {
  readonly map: readonly string[];
  /** Cell Măng stands on. Replaced, never mutated, so emitted events keep their own copy. */
  pos: MazeCell;
  dir: MazeDir;
  /** `"r,c"` keys of the bamboo cells Măng has picked up. */
  readonly collected: Set<string>;
  readonly bambooTotal: number;
  readonly collectAll: boolean;
  /** `config.goal.items` not picked up yet, in config order: `G` only wins once empty. */
  items: MazeItem[];
  /** Cell where Măng bumped into a wall, for `predictAnswer`; null while nothing crashed. */
  crashAt: MazeCell | null;
}

export const cellKey = ([r, c]: MazeCell): string => `${String(r)},${String(c)}`;

/** Tile at `[r, c]`, or undefined outside the map. */
export function tileAt(map: readonly string[], [r, c]: MazeCell): MazeTile | undefined {
  return map[r]?.[c] as MazeTile | undefined;
}

export function createMazeState(config: MazeConfig): MazeState {
  let start: MazeCell = [0, 0];
  let bambooTotal = 0;
  config.map.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] === 'S') start = [r, c];
      if (row[c] === 'b') bambooTotal++;
    }
  });
  return {
    map: config.map,
    pos: start,
    dir: config.startDir,
    collected: new Set(),
    bambooTotal,
    collectAll: config.goal?.collectAll === true,
    items: (config.goal?.items ?? []).map(({ kind, at }) => ({ kind, at: [at[0], at[1]] })),
    crashAt: null,
  };
}
