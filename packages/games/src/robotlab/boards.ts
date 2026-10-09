import type { RobotCell } from './state';
import type { RobotColor, RobotDir } from './config';

/**
 * Scenery of a board cell (cosmetic only, never a rule; game-kinds.md §3.3 "Sa bàn Thành Phố
 * Măng"). On a `#` cell it picks the picture; on a crossing only `b` (a bridge) draws anything.
 * `.` plain (a city roof, chosen by position) · `v` bamboo-village hut · `t` bamboo grove ·
 * `p` park (trees, pond, flower bed) · `w` river water · `b` bridge (a crossing over the river) ·
 * `m` market stall with an awning · `c` city house · `f` factory (the east cell has the chimney).
 */
export const ROBOT_SCENERY = ['.', 'v', 't', 'p', 'w', 'b', 'm', 'c', 'f'] as const;
export type RobotScenery = (typeof ROBOT_SCENERY)[number];

/** What one "đề" puts on a board: how many fences, which neutralisers, how many pollution. */
export interface RobotBoardKit {
  readonly fences: number;
  /** One neutraliser per entry, of that colour (the board has a station for each). */
  readonly neutralizers: readonly RobotColor[];
  readonly pollution: number;
}

/**
 * A fixed city board for "Đề mới" (P3-08): the map with its job spots (`L`, `Z`, stations), the
 * scenery of every cell, where Bíp faces at the start, crossings kept free of blocks and the kit
 * of blocks the generator places (`exam.ts`). Our own design, not a copy of a contest mat.
 */
export interface RobotBoard {
  readonly id: string;
  readonly map: readonly string[];
  /** Same size as `map`, one `RobotScenery` letter per cell. */
  readonly scenery: readonly string[];
  readonly startDir: RobotDir;
  /** Crossings never given a block (the bridges: a block there would close the river). */
  readonly keepClear: readonly RobotCell[];
  readonly kit: RobotBoardKit;
}

/**
 * "Thành Phố Măng" (curriculum.md §6.1, P3-08): 9 × 7 crossings. West of the river: the bamboo
 * village (yellow station at the dead end), the park with the line looping round it, the lab on
 * the park's east side. Two bridges cross the river. East: the market street with the green
 * station at its end, a short alley, the factory with its polluted zone and the red station.
 */
export const THANH_PHO_MANG: RobotBoard = {
  id: 'thanh-pho-mang',
  map: ['y##.#...g', '......##.', '.##.#....', '.##L#.##.', '....#..ZZ', '#.#...##r', '....#....'],
  scenery: [
    '.vt.w....',
    '....b.mm.',
    '.pp.w....',
    '.pp.w.cc.',
    '....w....',
    'v.t.b.ff.',
    '....w....',
  ],
  startDir: 'N',
  keepClear: [
    [1, 4],
    [5, 4],
  ],
  kit: { fences: 2, neutralizers: ['RED', 'YELLOW', 'GREEN'], pollution: 3 },
};

/** Every board the generator knows. */
export const ROBOT_BOARDS: readonly RobotBoard[] = [THANH_PHO_MANG];

/** The board whose map is exactly `map`, if any (the stage reads its scenery this way). */
export function boardOfMap(map: readonly string[]): RobotBoard | undefined {
  return ROBOT_BOARDS.find(
    (board) => board.map.length === map.length && board.map.every((row, i) => row === map[i]),
  );
}
