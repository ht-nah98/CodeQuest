// Pixi-free geometry and replay model of the robot lab stage (stage-rendering.md §2), unit tested
// in layout.test.ts: how the board fits the stage under its HUD, the line segments between
// crossings, and the board state, clock and score as the replay's events arrive.
import {
  type RobotBlock,
  type RobotCell,
  type RobotDir,
  type RobotLabConfig,
  type RobotLabEvent,
  STATION_OF,
} from '@codequest/games';

/** Board cells are drawn on a 16-texel grid. */
export const ROBOT_CELL_TEXELS = 16;
/** Free px kept around the board mat. */
const MARGIN_PX = 8;
/** The mat reaches this far (in cells) beyond the outer crossings, so edge lines show. */
export const MAT_CELLS = 0.5;
/** Smallest and largest cell, in px (a 9×9 board still has crossings a child can count). */
const MIN_CELL_PX = 20;
const MAX_CELL_PX = 96;
/** Bíp's body (diameter) and a block, in cells; Bíp's body sits a little behind the crossing. */
export const ROBOT_BODY_CELLS = 0.7;
export const BLOCK_CELLS = 0.38;
/** How far behind the crossing Bíp's body centre sits, in cells (the gripper reaches the crossing). */
export const BODY_BACK_CELLS = 0.12;

/** HUD chips (clock, jobs, points) along the top, in rows when they do not fit one. */
export const HUD_MARGIN = 6;
export const HUD_GAP = 4;
export const HUD_CHIP_HEIGHT = 36;
/** Strip at the bottom for the "Sa bàn tập, gần giống đề thi" tag. */
export const LABEL_STRIP = 26;

export interface ChipPlace {
  x: number;
  y: number;
}

export interface HudLayout {
  chips: ChipPlace[];
  /** Height reserved at the top for the chips (the board starts below). */
  band: number;
}

/**
 * Places HUD chips of the given widths left to right from the top-left corner, wrapping to a
 * new row when a chip would pass the right edge (a chip wider than the stage gets a row alone).
 */
export function layoutHud(widths: readonly number[], stageWidth: number): HudLayout {
  const chips: ChipPlace[] = [];
  let x = HUD_MARGIN;
  let y = HUD_MARGIN;
  for (const width of widths) {
    if (x > HUD_MARGIN && x + width > stageWidth - HUD_MARGIN) {
      x = HUD_MARGIN;
      y += HUD_CHIP_HEIGHT + HUD_GAP;
    }
    chips.push({ x, y });
    x += width + HUD_GAP;
  }
  const band = widths.length === 0 ? 0 : y + HUD_CHIP_HEIGHT + HUD_GAP;
  return { chips, band };
}

export interface RobotLayout {
  width: number;
  height: number;
  rows: number;
  cols: number;
  /** Cell size in px (whole px; a multiple of 16 when there is room, for crisp texels). */
  cellPx: number;
  /** Integer zoom of the 16-texel art inside a cell, at least 1. */
  texel: number;
  /** Top-left corner of cell [0, 0]. */
  originX: number;
  originY: number;
  /** Integer zooms of Bíp (16-texel art) and of a block (12-texel art). */
  robotScale: number;
  blockScale: number;
  /** Height kept at the top for the HUD and at the bottom for the tag. */
  topBand: number;
  bottomBand: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Fits a `rows` × `cols` board (plus half a cell of mat around it) into a `width` × `height`
 * stage between a `topBand` (HUD) and the bottom tag strip, centred. The cell is a multiple of
 * 16 px when at least 32 px fit (crisp texels); smaller boards on small stages use whole px.
 */
export function computeRobotLayout(
  rows: number,
  cols: number,
  width: number,
  height: number,
  topBand = 0,
  bottomBand = LABEL_STRIP,
): RobotLayout {
  const spanRows = rows + 2 * MAT_CELLS;
  const spanCols = cols + 2 * MAT_CELLS;
  const usableHeight = Math.max(1, height - topBand - bottomBand);
  const fit = Math.min(
    (width - 2 * MARGIN_PX) / spanCols,
    (usableHeight - 2 * MARGIN_PX) / spanRows,
  );
  const snapped =
    fit >= 2 * ROBOT_CELL_TEXELS
      ? Math.floor(fit / ROBOT_CELL_TEXELS) * ROBOT_CELL_TEXELS
      : Math.floor(fit);
  const cellPx = clamp(snapped, MIN_CELL_PX, MAX_CELL_PX);
  const texel = Math.max(1, Math.floor(cellPx / ROBOT_CELL_TEXELS));
  const originX = Math.round((width - cols * cellPx) / 2);
  const originY = topBand + Math.round((usableHeight - rows * cellPx) / 2);
  return {
    width,
    height,
    rows,
    cols,
    cellPx,
    texel,
    originX,
    originY,
    robotScale: Math.max(1, Math.round((cellPx * ROBOT_BODY_CELLS) / 16)),
    blockScale: Math.max(1, Math.round((cellPx * BLOCK_CELLS) / 12)),
    topBand,
    bottomBand,
  };
}

/** Bíp's parts along its heading, in px from the crossing (negative = ahead), art facing N. */
export interface RobotGeometry {
  /** Centre of the 16-texel body. */
  bodyY: number;
  /** Bottom edge of the gripper art (it overlaps the body's front by 2 texels). */
  clawBaseY: number;
  /** Centre of a held block, between the prongs. */
  heldY: number;
}

/** Where Bíp's body, gripper and held block sit for a cell size and art zoom. */
export function robotGeometry(cellPx: number, robotScale: number): RobotGeometry {
  const bodyY = Math.round(BODY_BACK_CELLS * cellPx);
  const front = bodyY - 8 * robotScale;
  const clawBaseY = front + 2 * robotScale;
  return { bodyY, clawBaseY, heldY: clawBaseY - 4 * robotScale };
}

/** Centre of crossing (row, col) in px; fractional cells allowed while Bíp drives. */
export function cellCenter(
  layout: RobotLayout,
  row: number,
  col: number,
): { x: number; y: number } {
  return {
    x: layout.originX + (col + 0.5) * layout.cellPx,
    y: layout.originY + (row + 0.5) * layout.cellPx,
  };
}

/** One step in each direction as [row, col]; N is up (row 0 is the top row). */
export const DIR_STEP: Readonly<Record<RobotDir, readonly [number, number]>> = {
  N: [-1, 0],
  E: [0, 1],
  S: [1, 0],
  W: [0, -1],
};

/** The crossing one step from `cell` in `dir` (may be off the board). */
export function stepCell([r, c]: RobotCell, dir: RobotDir): [number, number] {
  const [dr, dc] = DIR_STEP[dir];
  return [r + dr, c + dc];
}

/**
 * Rotation of Bíp's art (drawn facing N) for a heading, in radians clockwise: N 0, E π/2,
 * S π, W −π/2.
 */
export function headingRotation(dir: RobotDir): number {
  return { N: 0, E: Math.PI / 2, S: Math.PI, W: -Math.PI / 2 }[dir];
}

/** Signed rotation of a 90° turn from `from` to `to` (+π/2 clockwise = rẽ phải). */
export function turnDelta(from: RobotDir, to: RobotDir): number {
  let delta = headingRotation(to) - headingRotation(from);
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta <= -Math.PI) delta += 2 * Math.PI;
  return delta;
}

/** Whether `cell` is a crossing (on the board and not a building). */
export function isCrossing(map: readonly string[], [r, c]: RobotCell): boolean {
  const tile = map[r]?.[c];
  return tile !== undefined && tile !== '#';
}

/** Cells holding a tile, in reading order. */
export function cellsOf(map: readonly string[], tile: string): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  map.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) if (row[c] === tile) cells.push([r, c]);
  });
  return cells;
}

/**
 * The black line: one segment between every two neighbouring crossings (right and down
 * neighbours, so each segment once). Buildings (`#`) have no line.
 */
export function lineSegments(map: readonly string[]): Array<[RobotCell, RobotCell]> {
  const segments: Array<[RobotCell, RobotCell]> = [];
  map.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (!isCrossing(map, [r, c])) continue;
      if (isCrossing(map, [r, c + 1]))
        segments.push([
          [r, c],
          [r, c + 1],
        ]);
      if (isCrossing(map, [r + 1, c]))
        segments.push([
          [r, c],
          [r + 1, c],
        ]);
    }
  });
  return segments;
}

export const cellKey = ([r, c]: RobotCell): string => `${String(r)},${String(c)}`;
const sameCell = (a: RobotCell, b: RobotCell): boolean => a[0] === b[0] && a[1] === b[1];

// ---- Replay model -------------------------------------------------------------------------------

/** Where a block is during the replay, like the engine's state (`blocks[i].where`). */
export type BoardBlockWhere = { at: RobotCell } | 'held' | 'done';
export type BoardBlock = RobotBlock & { where: BoardBlockWhere };

/** What the stage shows after the events acted out so far (pure; the stage draws from it). */
export interface BoardState {
  pos: RobotCell;
  dir: RobotDir;
  /** Seconds used (the `t` of the last action event). */
  t: number;
  /** Fixed indices: `startHolding` first (if any), then `config.blocks`, as in the engine. */
  blocks: BoardBlock[];
  /**
   * The failed action that ended the run, if any: `why` is the bump's `into` ('offLine',
   * 'block') or the gripFail reason (NOTHING_TO_GRAB, WRONG_COLOR…).
   */
  crash: { at: RobotCell; why: string } | null;
  timeUp: boolean;
}

/** The board at the start of a run. */
export function initialBoard(config: RobotLabConfig): BoardState {
  const blocks: BoardBlock[] = [];
  if (config.startHolding !== undefined) blocks.push({ ...config.startHolding, where: 'held' });
  for (const { at, ...block } of config.blocks ?? []) {
    blocks.push({ ...block, where: { at: [at[0], at[1]] } });
  }
  return {
    pos: config.start ?? cellsOf(config.map, 'L')[0] ?? [0, 0],
    dir: config.startDir,
    t: 0,
    blocks,
    crash: null,
    timeUp: false,
  };
}

/** The board after one more event (events of other kinds, e.g. highlights, change nothing). */
export function applyEvent(state: BoardState, event: RobotLabEvent): BoardState {
  switch (event.type) {
    case 'move':
      return { ...state, pos: event.to, dir: event.dir, t: event.t };
    case 'turn':
      return { ...state, dir: event.to, t: event.t };
    case 'grab':
    case 'release': {
      const where: BoardBlockWhere =
        event.type === 'grab' ? 'held' : event.result === 'retrieved' ? 'done' : { at: event.at };
      const blocks = state.blocks.map((block, index) =>
        index === event.index ? { ...block, where } : block,
      );
      return { ...state, blocks, t: event.t };
    }
    case 'bump':
      return { ...state, dir: event.dir, crash: { at: event.at, why: event.into } };
    case 'gripFail':
      return { ...state, crash: { at: event.at, why: event.reason } };
    case 'timeUp':
      return { ...state, t: event.t, timeUp: true };
  }
}

/** The block lying on `cell`, or -1. */
export function blockIndexAt(state: BoardState, cell: RobotCell): number {
  return state.blocks.findIndex(
    ({ where }) => typeof where === 'object' && sameCell(where.at, cell),
  );
}

/** The block in the gripper, or -1. */
export function heldIndex(state: BoardState): number {
  return state.blocks.findIndex(({ where }) => where === 'held');
}

/** One job type of the score panel. */
export interface JobTally {
  done: number;
  total: number;
  /** Points earned for it with the level's rules. */
  points: number;
  /** Points if every one is done (`total` × its points): what the job is worth. */
  max: number;
}

export interface BoardScore {
  /** Fenced `Z` cells (khoanh vùng). */
  contain: JobTally;
  /** Neutralisers on a station of their colour (trung hòa). */
  neutralize: JobTally;
  /** Pollution blocks brought into the lab (thu hồi). */
  retrieve: JobTally;
  /** Ending in the lab ("về phòng thí nghiệm"). */
  home: JobTally;
  total: number;
}

/**
 * Jobs done and points so far, read from where the blocks are, exactly like the engine's
 * `robotlabScore` (game-kinds.md §3.3): the stage never asks the engine, it replays events.
 */
export function boardScore(state: BoardState, config: RobotLabConfig): BoardScore {
  const { map, rules } = config;
  const fenced = new Set<string>();
  let neutralized = 0;
  let retrieved = 0;
  for (const block of state.blocks) {
    if (block.kind === 'pollution') {
      if (block.where === 'done') retrieved++;
      continue;
    }
    if (typeof block.where !== 'object') continue;
    const tile = map[block.where.at[0]]?.[block.where.at[1]];
    if (block.kind === 'fence' && tile === 'Z') fenced.add(cellKey(block.where.at));
    if (block.kind === 'neutralizer' && tile === STATION_OF[block.color]) neutralized++;
  }
  const home = map[state.pos[0]]?.[state.pos[1]] === 'L' ? 1 : 0;
  const tally = (done: number, total: number, each: number): JobTally => ({
    done,
    total,
    points: done * each,
    max: total * each,
  });
  const contain = tally(fenced.size, cellsOf(map, 'Z').length, rules.points.contain);
  const neutralize = tally(
    neutralized,
    state.blocks.filter((block) => block.kind === 'neutralizer').length,
    rules.points.neutralize,
  );
  const retrieve = tally(
    retrieved,
    state.blocks.filter((block) => block.kind === 'pollution').length,
    rules.points.retrieve,
  );
  const homeTally = tally(home, 1, rules.points.return);
  return {
    contain,
    neutralize,
    retrieve,
    home: homeTally,
    total: contain.points + neutralize.points + retrieve.points + homeTally.points,
  };
}

/** Seconds left on the clock (never below 0). */
export function secondsLeft(config: RobotLabConfig, t: number): number {
  return Math.max(0, config.rules.timeLimit - t);
}

/** The `t` an action event carries (bump and gripFail carry none: the clock stands still). */
export function eventTime(event: RobotLabEvent): number | null {
  return 't' in event ? event.t : null;
}

/** Job types the score panel lists for a board: only those the level has, in a fixed order. */
export type JobKind = 'contain' | 'neutralize' | 'retrieve' | 'home';

export function jobKinds(config: RobotLabConfig): JobKind[] {
  const blocks = [...(config.startHolding ? [config.startHolding] : []), ...(config.blocks ?? [])];
  const kinds: JobKind[] = [];
  if (cellsOf(config.map, 'Z').length > 0) kinds.push('contain');
  if (blocks.some((block) => block.kind === 'neutralizer')) kinds.push('neutralize');
  if (blocks.some((block) => block.kind === 'pollution')) kinds.push('retrieve');
  // Ending in the lab counts on score levels (40 points) and on missions with mustReturn.
  if (config.goal.type === 'score' || config.goal.mustReturn === true) kinds.push('home');
  return kinds;
}
