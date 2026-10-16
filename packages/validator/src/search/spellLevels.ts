// Spell test levels (P4-01 spike, ADR-0023 "Kết quả spike"): sketches of W8 l03, l06, l08, l11
// with the spike's maps, built from their programs so tests and the spike agree.
import { LevelSchema, type Level } from '@codequest/content-schema';
import { resolveLevelConfigs } from '@codequest/games';
import { programToWorkspace, type Definitions, type Program, type Statement } from './program';

const F: Statement = { block: 'maze_forward' };
const L: Statement = { block: 'maze_turn_left' };
const R: Statement = { block: 'maze_turn_right' };
const cast = (id: string): Statement => ({ call: id });

type Dir = 'N' | 'E' | 'S' | 'W';
type Cell = [number, number];
const DIRS: readonly Dir[] = ['N', 'E', 'S', 'W'];
const STEP: Readonly<Record<Dir, Cell>> = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };

/** Cells visited by F / L / R moves from `start` facing `dir`. */
export function trace(start: Cell, dir: Dir, moves: string): Cell[] {
  const cells: Cell[] = [start];
  let [r, c] = start;
  let d = DIRS.indexOf(dir);
  for (const move of moves) {
    if (move === 'L') d = (d + 3) % 4;
    else if (move === 'R') d = (d + 1) % 4;
    else {
      const [dr, dc] = STEP[DIRS[d] ?? 'N'];
      r += dr;
      c += dc;
      cells.push([r, c]);
    }
  }
  return cells;
}

/** A maze map: path cells (first S, last G) plus open dead-end cells. */
export function mazeMap(rows: number, cols: number, path: Cell[], extra: Cell[] = []): string[] {
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => '#'));
  const put = ([r, c]: Cell, tile: string): void => {
    const row = grid[r];
    if (row !== undefined) row[c] = tile;
  };
  for (const cell of [...path, ...extra]) put(cell, '.');
  const first = path[0];
  const last = path[path.length - 1];
  if (first !== undefined) put(first, 'S');
  if (last !== undefined) put(last, 'G');
  return grid.map((row) => row.join(''));
}

const ROBOT_RULES = {
  timeLimit: 120,
  costs: { forward: 2, turn: 1, grab: 2, release: 2 },
  points: { contain: 45, neutralize: 160, retrieve: 100, return: 40 },
};

export function level(
  fields: Record<string, unknown>,
  main: Program,
  defs: Definitions,
  toolbox: readonly string[],
): Level {
  const parsed = LevelSchema.parse({
    worldId: '_sandbox',
    stage: 'practice',
    mode: 'build',
    title: 'Phép',
    objective: 'Tới đích',
    learningGoal: 'Dạy phép',
    hints: [],
    toolbox: [...toolbox, 'cq_proc_def', 'cq_proc_call'],
    solution: programToWorkspace(
      main,
      defs,
      new Set(
        ((fields['procedures'] ?? []) as Array<{ id: string; param?: unknown }>)
          .filter((procedure) => procedure.param !== undefined)
          .map((procedure) => procedure.id),
      ),
    ),
    ...fields,
  });
  return resolveLevelConfigs(parsed, { robotlab: ROBOT_RULES });
}

const MAZE = ['maze_forward', 'maze_turn_left', 'maze_turn_right'];

/** l03: body `bậc thang` = F, L, F, R; main `P, F, P, L, P`; `maxBlocks` 10. */
export const stairLevel = level(
  {
    id: 'spell-l03',
    kind: 'maze',
    procedures: [{ id: 'stair', name: 'bậc thang' }],
    maxBlocks: 10,
    par: 10,
    config: {
      map: mazeMap(8, 8, trace([6, 1], 'E', 'FLFRFFLFRLFLFR'), [
        [6, 3],
        [7, 3],
        [5, 5],
        [5, 6],
        [2, 4],
        [4, 1],
      ]),
      startDir: 'E',
    },
  },
  [cast('stair'), F, cast('stair'), L, cast('stair')],
  { stair: [F, L, F, R] },
  MAZE,
);

/** l08: `repeat 2 {A}, L, A`, A = F, L, F, F, R; `maxLoopDepth` 1, `maxBlocks` 10. */
export function climbLevel(maxInstances?: Record<string, number>): Level {
  return level(
    {
      id: 'spell-l08',
      kind: 'maze',
      procedures: [{ id: 'climb', name: 'leo dốc' }],
      maxLoopDepth: 1,
      maxBlocks: 10,
      par: 10,
      ...(maxInstances !== undefined && { maxInstances }),
      config: {
        map: mazeMap(9, 8, trace([7, 1], 'E', 'FLFFRFLFFRLFLFFR'), [
          [7, 3],
          [7, 4],
          [4, 4],
          [1, 3],
          [6, 1],
        ]),
        startDir: 'E',
      },
    },
    [{ repeat: 2, body: [cast('climb')] }, L, cast('climb')],
    { climb: [F, L, F, F, R] },
    [...MAZE, 'cq_repeat'],
  );
}

const spiral = (start: Cell, a: number, b: number, c: number): Cell[] =>
  trace(start, 'E', `${'F'.repeat(a)}L${'F'.repeat(b)}L${'F'.repeat(c)}`);

/** l11: body F, `until path LEFT {F}`, L on 3 spiral maps; main `A, A, A`; `maxBlocks` 9. */
export const forkLevel = level(
  {
    id: 'spell-l11',
    kind: 'maze',
    procedures: [{ id: 'fork', name: 'tới ngã ba' }],
    maxLoopDepth: 1,
    maxBlocks: 9,
    par: 9,
    config: { map: mazeMap(8, 8, spiral([5, 1], 3, 3, 2)), startDir: 'E' },
    variants: [
      { map: mazeMap(8, 8, spiral([4, 1], 5, 2, 4), [[5, 3]]), startDir: 'E' },
      { map: mazeMap(8, 8, spiral([5, 2], 2, 4, 1), [[6, 2]]), startDir: 'E' },
    ],
  },
  [cast('fork'), cast('fork'), cast('fork')],
  { fork: [F, { until: { block: 'maze_is_path', fields: { DIR: 'LEFT' } }, body: [F] }, L] },
  [...MAZE, 'cq_repeat_until', 'maze_is_path', 'maze_at_goal'],
);

const robot = (block: string, fields?: Record<string, unknown>): Statement =>
  fields === undefined ? { block } : { block, fields };
const forward = (n: number): Statement => robot('robot_forward', { N: n });

/** l06 robotlab: `giao khối` = grab, right, right, forward 1, release at 3 fences; `maxBlocks` 14. */
export function deliverLevel(maxInstances?: Record<string, number>): Level {
  return level(
    {
      id: 'spell-l06',
      kind: 'robotlab',
      procedures: [{ id: 'deliver', name: 'giao khối' }],
      maxBlocks: 14,
      par: 14,
      ...(maxInstances !== undefined && { maxInstances }),
      config: {
        map: ['#######', 'L.Z.###', '##Z.Z.#', '##.####', '#######'],
        startDir: 'E',
        blocks: [
          { kind: 'fence', at: [1, 3] },
          { kind: 'fence', at: [3, 2] },
          { kind: 'fence', at: [2, 5] },
        ],
        goal: { type: 'missions' },
      },
    },
    [
      forward(3),
      cast('deliver'),
      robot('robot_turn_left'),
      forward(2),
      cast('deliver'),
      robot('robot_turn_right'),
      forward(3),
      cast('deliver'),
    ],
    {
      deliver: [
        robot('robot_grab'),
        robot('robot_turn_right'),
        robot('robot_turn_right'),
        forward(1),
        robot('robot_release'),
      ],
    },
    ['robot_forward', 'robot_turn_left', 'robot_turn_right', 'robot_grab', 'robot_release'],
  );
}

/** Two spells: A = F, F, F; B = R, F, L; main `A, B, A, B, A, B` (no loop in the toolbox). */
export const twoSpellLevel = level(
  {
    id: 'spell-two',
    kind: 'maze',
    procedures: [
      { id: 'run', name: 'chạy' },
      { id: 'step', name: 'bước xuống' },
    ],
    maxBlocks: 14,
    par: 14,
    config: {
      map: mazeMap(6, 12, trace([1, 1], 'E', 'FFFRFLFFFRFLFFFRFL')),
      startDir: 'E',
    },
  },
  [cast('run'), cast('step'), cast('run'), cast('step'), cast('run'), cast('step')],
  { run: [F, F, F], step: [R, F, L] },
  MAZE,
);

/** A corridor of 4 with spells `two` = F, F (and an unused `one`). */
export function corridorLevel(fields: Record<string, unknown> = {}): Level {
  return level(
    {
      id: 'spell-corridor',
      kind: 'maze',
      procedures: [
        { id: 'two', name: 'đi hai' },
        { id: 'one', name: 'đi một' },
      ],
      par: 5,
      config: { map: ['#######', '#S...G#', '#######'], startDir: 'E' },
      ...fields,
    },
    [cast('two'), cast('two')],
    { two: [F, F] },
    ['maze_forward'],
  );
}

/**
 * Stairs with a box (ADR-0023 §2): `cầu thang` with box `số bậc` = repeat [steps] {F, L, F, R};
 * main `stairs 1, F, stairs 3`; `maxBlocks` 9.
 */
export const boxStairsLevel = level(
  {
    id: 'spell-box',
    kind: 'maze',
    procedures: [
      { id: 'stairs', name: 'cầu thang', param: { id: 'steps', name: 'số bậc', max: 4 } },
    ],
    maxBlocks: 9,
    par: 9,
    toolbox: [
      ...MAZE,
      { type: 'cq_repeat_var', fields: { VAR: 'steps' } },
      'cq_proc_def_n',
      'cq_proc_call_n',
    ],
    config: {
      map: mazeMap(8, 9, trace([6, 1], 'E', 'FLFRF' + 'FLFRFLFRFLFR'), [[2, 6]]),
      startDir: 'E',
    },
  },
  [{ call: 'stairs', arg: 1 }, F, { call: 'stairs', arg: 3 }],
  { stairs: [{ repeatVar: 'steps', body: [F, L, F, R] }] },
  [],
);
