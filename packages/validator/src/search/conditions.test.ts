// The par search with conditions (P2-11b, ADR-0018): cq_if, cq_if_else and cq_repeat_until
// with sensors, maxInstances and maxLoopDepth, on the W4–W5 maps of curriculum.md §5.2–§5.3.
// The "VC" numbers there came from a draft simulator; these tests pin what the real engine says.
import type { Level } from '@codequest/content-schema';
import { getGameKind } from '@codequest/games';
import { describe, expect, it } from 'vitest';
import { findFixes } from './fixes';
import { formatProgram, programToWorkspace, type Condition, type Program } from './program';
import { findShortestPrograms } from './shortest';
import { FastSim, LOSS, WIN } from './sim';

type Cell = 'ground' | 'hole' | 'branch' | 'crate' | 'flag';

/** Runner cells from curriculum.md notation: `.` ground, `O` hole, `C` crate, `F` flag. */
function track(text: string, extra: object = {}): object {
  const cells = Array.from(text, (char): Cell =>
    char === 'O' ? 'hole' : char === 'C' ? 'crate' : char === 'F' ? 'flag' : 'ground',
  );
  return { cells, start: 0, ...extra };
}

/** A maze map from curriculum.md notation (rows split by `/`). */
function mazeMap(rows: string, startDir = 'E', extra: object = {}): object {
  return { map: rows.split('/'), startDir, ...extra };
}

function level(kind: 'runner' | 'maze', maps: object[], extra: Partial<Level>): Level {
  const [config, ...variants] = maps;
  return {
    id: 'w04-l99',
    worldId: 'w04-nga-ba',
    stage: 'practice',
    kind,
    mode: 'build',
    title: 'Thử',
    objective: 'Thử',
    learningGoal: 'Điều kiện',
    toolbox: [],
    hints: [],
    config,
    ...(variants.length > 0 && { variants }),
    ...extra,
  };
}

const RUNNER_IF = [
  'runner_walk',
  'runner_jump',
  'cq_repeat',
  'cq_if',
  'cq_if_else',
  'runner_is_ahead',
];
const MAZE_IF = [
  'maze_forward',
  'maze_turn_left',
  'maze_turn_right',
  'cq_repeat',
  'cq_if',
  'cq_if_else',
  'maze_is_path',
];
/** W4: no nested loops, one `lặp` (curriculum.md §5.2, §5.5 R2). */
const W4_LIMITS = { maxInstances: { cq_repeat: 1 }, maxLoopDepth: 1 };

const asks = (program: Program): boolean => /is_ahead|is_path|at_goal/.test(formatProgram(program));

describe('FastSim with conditions', () => {
  const runner = getGameKind('runner');
  if (runner === undefined) throw new Error('runner missing');
  const hole: Condition = { block: 'runner_is_ahead', fields: { KIND: 'HOLE' } };
  const crate: Condition = { block: 'runner_is_ahead', fields: { KIND: 'CRATE' } };
  const lvl = level('runner', [track('.C..O.F')], {
    toolbox: ['runner_walk', 'runner_jump', 'runner_kick', 'cq_repeat_until', 'runner_is_ahead'],
  });

  it('answers sensors from the state and takes one branch per map', () => {
    const sim = new FastSim(runner, lvl);
    const code = sim.compile([
      { if: crate, then: [{ block: 'runner_kick' }], else: [{ block: 'runner_jump' }] },
    ]);
    expect(code).not.toBeNull();
    // Măng on 0, crate on 1: ✔ → kick, and stays on 0.
    expect(sim.trueMask(sim.initial, sim.condIndex(crate))).toBe(1);
    expect(sim.trueMask(sim.initial, sim.condIndex(hole))).toBe(0);
    expect(sim.run(sim.initial, code ?? [])).toBeGreaterThanOrEqual(0);
  });

  it('W5 l19: a repeat-until that comes back to a state never stops (LOSS, like TIMEOUT)', () => {
    const sim = new FastSim(runner, lvl);
    const code = sim.compile([
      { until: hole, body: [{ block: 'runner_kick' }] },
      { block: 'runner_jump' },
    ]);
    expect(sim.run(sim.initial, code ?? [])).toBe(LOSS);
  });

  it('loses on an empty condition slot (EMPTY_CONDITION)', () => {
    const sim = new FastSim(runner, lvl);
    const code = sim.compile([{ until: null, body: [{ block: 'runner_walk' }] }]);
    expect(sim.run(sim.initial, code ?? [])).toBe(LOSS);
  });
});

// A few seconds each alone; allow for a busy machine (the whole suite runs in parallel).
const SLOW = { timeout: 60_000 };

describe('findShortestPrograms with conditions (W4–W5)', SLOW, () => {
  it('W4 l02: min 5 on the map pair, and every smallest program asks', () => {
    const result = findShortestPrograms(
      level('runner', [track('..O.O...O.F'), track('.O...O.O..F')], {
        toolbox: RUNNER_IF,
        maxBlocks: 5,
        par: 5,
        ...W4_LIMITS,
      }),
      { maxExamples: 100 },
    );
    expect(result).toMatchObject({ minBlocks: 5, complete: true, mismatches: [], unsupported: [] });
    expect(result.count).toBe(28);
    expect(result.examples.every(asks)).toBe(true);
  });

  it('W4 l02 without maxInstances: two loops would not be shorter either', () => {
    const result = findShortestPrograms(
      level('runner', [track('..O.O...O.F'), track('.O...O.O..F')], {
        toolbox: RUNNER_IF,
        maxBlocks: 5,
        par: 5,
      }),
    );
    expect(result).toMatchObject({ minBlocks: 5, complete: true, mismatches: [] });
  });

  it('W5 l01: "until a hole is ahead, walk", then jump, is the only 4-block winner', () => {
    const result = findShortestPrograms(
      level('runner', [track('..OF'), track('.......OF')], {
        toolbox: ['runner_walk', 'runner_jump', 'cq_repeat_until', 'runner_is_ahead'],
        maxBlocks: 4,
        par: 4,
        maxLoopDepth: 1,
      }),
    );
    expect(result).toMatchObject({ minBlocks: 4, count: 1, complete: true, mismatches: [] });
    expect(result.examples.map(formatProgram)).toEqual(['until is_ahead(KIND=HOLE) [walk], jump']);
  });

  it('W5 l04: "until at goal, forward" is the only 3-block winner', () => {
    const result = findShortestPrograms(
      level(
        'maze',
        [mazeMap('########/#S....G#/########'), mazeMap('########/#S..G..#/########')],
        {
          toolbox: [
            'maze_forward',
            'maze_turn_left',
            'maze_turn_right',
            'cq_repeat_until',
            'maze_at_goal',
          ],
          maxBlocks: 3,
          par: 3,
          maxLoopDepth: 1,
        },
      ),
    );
    expect(result).toMatchObject({ minBlocks: 3, count: 1, complete: true, mismatches: [] });
    expect(result.examples.map(formatProgram)).toEqual(['until at_goal [forward]']);
  });

  it('W5 l06: waiting on "ô trống" is the only 4-block winner', () => {
    const result = findShortestPrograms(
      level('runner', [track('.O.O.O.F'), track('.O.O.O.O.O.F')], {
        toolbox: ['runner_walk', 'runner_jump', 'cq_repeat_until', 'runner_is_ahead'],
        maxBlocks: 5,
        par: 4,
        maxLoopDepth: 1,
      }),
    );
    expect(result).toMatchObject({ minBlocks: 4, count: 1, complete: true, mismatches: [] });
    expect(result.examples.map(formatProgram)).toEqual(['until is_ahead(KIND=CLEAR) [jump], walk']);
  });

  it('W5 l09: nothing ≤ 6 wins; exactly one 7-block program with maxLoopDepth 1', () => {
    const result = findShortestPrograms(
      level(
        'maze',
        [
          mazeMap('#######/#S....#/####.##/####.##/####G##/#######'),
          mazeMap('##########/#S.......#/######.###/######.###/######.###/######G###/##########'),
        ],
        {
          toolbox: [
            'maze_forward',
            'maze_turn_left',
            'maze_turn_right',
            'cq_repeat_until',
            'maze_is_path',
            'maze_at_goal',
          ],
          maxBlocks: 8,
          par: 7,
          maxLoopDepth: 1,
        },
      ),
    );
    expect(result).toMatchObject({ minBlocks: 7, count: 1, complete: true, mismatches: [] });
    expect(result.examples.map(formatProgram)).toEqual([
      'until is_path(DIR=RIGHT) [forward], turn_right, until at_goal [forward]',
    ]);
  });

  it('W4 l16: plain win 5 (75 ways, none picks the shoot), par 8 under the star goal', () => {
    const l16 = level(
      'maze',
      [
        mazeMap('#########/#S....###/#####.b##/#####.###/##G...###/#########'),
        mazeMap('#######/#....G#/#.#####/#.#####/#S#####/#######', 'N'),
      ],
      { toolbox: MAZE_IF, maxBlocks: 9, par: 8, ...W4_LIMITS, starGoals: [{ kind: 'collectAll' }] },
    );
    const plain = findShortestPrograms(l16, { ignoreStarGoals: true });
    expect(plain).toMatchObject({ minBlocks: 5, count: 75, complete: true, mismatches: [] });
    const goals = findShortestPrograms(l16);
    expect(goals).toMatchObject({ minBlocks: 8, complete: true, mismatches: [] });
    expect(goals.examples.every(asks)).toBe(true);
  });

  it('W5 l14: plain win 6 (6 ways), 7 with the shoot (2 "wiggle" ways)', () => {
    const l14 = level(
      'maze',
      [
        mazeMap(
          '##########/#S.......#/########.#/#....G##.#/#.######.#/#.######.#/#.##b###.#/#........#/##########',
        ),
        mazeMap('##########/#S......##/#######.##/#######.##/#G......##/##########'),
      ],
      {
        toolbox: [
          'maze_forward',
          'maze_turn_left',
          'maze_turn_right',
          'cq_repeat',
          'cq_repeat_until',
          'cq_if_else',
          'maze_is_path',
          'maze_at_goal',
        ],
        maxBlocks: 9,
        par: 7,
        maxInstances: { cq_repeat: 1, cq_repeat_until: 1 },
        maxLoopDepth: 1,
        starGoals: [{ kind: 'collectAll' }],
      },
    );
    expect(findShortestPrograms(l14, { ignoreStarGoals: true })).toMatchObject({
      minBlocks: 6,
      count: 6,
      complete: true,
      mismatches: [],
    });
    const goals = findShortestPrograms(l14);
    expect(goals).toMatchObject({ minBlocks: 7, count: 2, complete: true, mismatches: [] });
    expect(goals.examples.map(formatProgram)).toContain(
      'until at_goal [if is_path(DIR=AHEAD) [forward, turn_right] else [turn_left]]',
    );
  });

  it('W5 l17: min 7, four "wiggle" programs, the two-question way (9) is not the minimum', () => {
    const result = findShortestPrograms(
      level(
        'maze',
        [
          mazeMap('##########/#S..#....#/###.#.##.#/#...#.#..#/#.###.#.##/#.....#.G#/##########'),
          mazeMap('##########/#S.......#/#######.##/#G..#...##/###.#.####/###...####/##########'),
        ],
        {
          toolbox: [
            'maze_forward',
            'maze_turn_left',
            'maze_turn_right',
            'cq_repeat',
            'cq_repeat_until',
            'cq_if',
            'cq_if_else',
            'maze_is_path',
            'maze_at_goal',
          ],
          maxBlocks: 9,
          par: 7,
          maxInstances: { cq_repeat: 1, cq_repeat_until: 1 },
          maxLoopDepth: 1,
        },
      ),
    );
    expect(result).toMatchObject({ minBlocks: 7, count: 4, complete: true, mismatches: [] });
  });

  it('W5 boss: nothing ≤ 5 wins on the 3 river maps; 6 programs of 6 blocks', () => {
    const result = findShortestPrograms(
      level(
        'runner',
        [
          track('...O..O.O...F'),
          track('..O.O.O.O.O..O.F'),
          track('....O...O.O.O.....O..O.O.O...O...O.O..F'),
        ],
        {
          toolbox: [
            'runner_walk',
            'runner_jump',
            'cq_repeat_until',
            'cq_if_else',
            'runner_is_ahead',
            'runner_at_goal',
          ],
          maxBlocks: 6,
          par: 6,
          maxInstances: { cq_repeat_until: 1 },
          maxLoopDepth: 1,
        },
      ),
      { maxExamples: 10 },
    );
    expect(result).toMatchObject({ minBlocks: 6, count: 6, complete: true, mismatches: [] });
    expect(result.examples.map(formatProgram)).toContain(
      'until at_goal [if is_ahead(KIND=HOLE) [jump] else [walk]]',
    );
  });

  it('honours maxLoopDepth: a nested loop that would be shorter is not counted', () => {
    // 12 cells of walk: repeat 3 [repeat 4 [walk]] is 3 blocks, one loop needs repeat 12 [walk].
    const toolbox = ['runner_walk', 'cq_repeat'];
    const base = level('runner', [track('............F')], { toolbox, par: 4 });
    expect(findShortestPrograms(base, { repeatTimes: [3, 4] }).minBlocks).toBe(3);
    expect(
      findShortestPrograms({ ...base, maxLoopDepth: 1 }, { repeatTimes: [3, 4] }).minBlocks,
    ).toBe(4);
  });

  it('honours maxInstances across the program and inside bodies', () => {
    // As above: the nested loop needs two cq_repeat, so one is not enough for 3 blocks.
    const toolbox = ['runner_walk', 'cq_repeat'];
    const base = level('runner', [track('............F')], { toolbox, par: 4 });
    const one = findShortestPrograms(
      { ...base, maxInstances: { cq_repeat: 1 } },
      { repeatTimes: [3, 4] },
    );
    expect(one).toMatchObject({ minBlocks: 4, complete: true, mismatches: [] });
    expect(one.examples.map(formatProgram)).toEqual(['repeat 4 [walk, walk, walk]']);
    // A limit on an action block: two jumps only fit as one jump inside a loop.
    const jumps = level('runner', [track('.O.O.F')], {
      toolbox: ['runner_walk', 'runner_jump', 'cq_repeat'],
      par: 3,
    });
    expect(findShortestPrograms(jumps).count).toBe(2);
    const limited = findShortestPrograms({ ...jumps, maxInstances: { runner_jump: 1 } });
    expect(limited).toMatchObject({ minBlocks: 3, count: 1, mismatches: [] });
    expect(limited.examples.map(formatProgram)).toEqual(['repeat 2 [jump], walk']);
  });
});

/** Mission items (P2-11c, ADR-0019): `config.goal.items` on one map. */
const items = (...list: Array<{ kind: 'key' | 'friend'; at: number | [number, number] }>) => ({
  goal: { items: list },
});
const key = (at: number | [number, number]) => ({ kind: 'key' as const, at });

describe('findShortestPrograms with mission items (P2-11c, curriculum.md §5.2–§5.3)', SLOW, () => {
  it('W4 l17 (rescue, 3 maps): min 5 (24 ways), every smallest program asks', () => {
    const maps = [
      track('.O..O.O...O.O.F', items(key(3), key(8))),
      track('.O.O..O...O.F', items(key(4), key(7))),
      track('...O.O.O.F', items(key(1))),
    ];
    const l17 = level('runner', maps, { toolbox: RUNNER_IF, maxBlocks: 5, par: 5, ...W4_LIMITS });
    const result = findShortestPrograms(l17, { maxExamples: 100 });
    expect(result).toMatchObject({ minBlocks: 5, count: 24, complete: true, mismatches: [] });
    expect(result.examples.every(asks)).toBe(true);
    expect(result.examples.map(formatProgram)).toContain(
      'repeat 12 [if is_ahead(KIND=HOLE) [jump] else [walk]]',
    );
    // "Nhảy cóc" flies over the key on map 3 (and off the track's end): it loses.
    const runner = getGameKind('runner');
    if (runner === undefined) throw new Error('runner missing');
    const sim = new FastSim(runner, l17);
    const hop = sim.compile([{ repeat: 12, body: [{ block: 'runner_jump' }] }]);
    expect(sim.run(sim.initial, hop ?? [])).toBe(LOSS);
  });

  it('W4 boss (rescue, 3 mazes): nothing ≤ 7 wins with the key; par 8; right-first loses', () => {
    const mazes: Array<[string, [number, number]]> = [
      ['#########/#S..#####/###.#####/###...###/###.#####/#G..#####/#########', [3, 5]],
      ['########/#....G##/#.######/#.######/#...####/###.####/#S..####/########', [4, 2]],
      ['#########/#S.######/##.....##/######.##/##G....##/#########', [2, 4]],
    ];
    const limits = { toolbox: MAZE_IF, maxBlocks: 9, par: 8, ...W4_LIMITS };
    const boss = level(
      'maze',
      mazes.map(([rows, at]) => mazeMap(rows, 'E', items(key(at)))),
      limits,
    );
    const result = findShortestPrograms(boss, { maxExamples: 100 });
    expect(result).toMatchObject({ minBlocks: 8, count: 68, complete: true, mismatches: [] });
    expect(result.examples.every(asks)).toBe(true);
    expect(result.examples.map(formatProgram)).toContain(
      'repeat 20 [if is_path(DIR=LEFT) [turn_left], if is_path(DIR=AHEAD) [forward] else [turn_right]]',
    );
    // Without the key the same maps have 429 eight-block wins, e.g. asking right first.
    const keyless = level(
      'maze',
      mazes.map(([rows]) => mazeMap(rows)),
      limits,
    );
    expect(findShortestPrograms(keyless)).toMatchObject({ minBlocks: 8, count: 429 });
    const maze = getGameKind('maze');
    if (maze === undefined) throw new Error('maze missing');
    const path = (dir: string): Condition => ({ block: 'maze_is_path', fields: { DIR: dir } });
    const rightFirst: Program = [
      {
        repeat: 20,
        body: [
          { if: path('RIGHT'), then: [{ block: 'maze_turn_right' }] },
          {
            if: path('AHEAD'),
            then: [{ block: 'maze_forward' }],
            else: [{ block: 'maze_turn_left' }],
          },
        ],
      },
    ];
    const withKey = new FastSim(maze, boss);
    expect(withKey.run(withKey.initial, withKey.compile(rightFirst) ?? [])).not.toBe(WIN);
    const noKey = new FastSim(maze, keyless);
    expect(noKey.run(noKey.initial, noKey.compile(rightFirst) ?? [])).toBe(WIN);
  });

  it('W5 boss (escort, 3 river maps): Gà con on the path changes nothing, 6 programs of 6', () => {
    const friend = (at: number) => items({ kind: 'friend', at });
    const result = findShortestPrograms(
      level(
        'runner',
        [
          track('...O..O.O...F', friend(4)),
          track('..O.O.O.O.O..O.F', friend(7)),
          track('....O...O.O.O.....O..O.O.O...O...O.O..F', friend(22)),
        ],
        {
          toolbox: [
            'runner_walk',
            'runner_jump',
            'cq_repeat_until',
            'cq_if_else',
            'runner_is_ahead',
            'runner_at_goal',
          ],
          maxBlocks: 6,
          par: 6,
          maxInstances: { cq_repeat_until: 1 },
          maxLoopDepth: 1,
        },
      ),
      { maxExamples: 10 },
    );
    expect(result).toMatchObject({ minBlocks: 6, count: 6, complete: true, mismatches: [] });
    expect(result.examples.map(formatProgram)).toContain(
      'until at_goal [if is_ahead(KIND=HOLE) [jump] else [walk]]',
    );
  });
});

describe('findFixes with conditions (W4–W5)', SLOW, () => {
  it('W4 l05: asking "ô trống" instead of "hố" is one edit', () => {
    const hole = { block: 'runner_is_ahead', fields: { KIND: 'HOLE' } };
    const initial: Program = [
      {
        repeat: 8,
        body: [{ if: hole, then: [{ block: 'runner_walk' }], else: [{ block: 'runner_jump' }] }],
      },
    ];
    const result = findFixes(
      level('runner', [track('..O..O.F')], {
        mode: 'bughunt',
        toolbox: ['runner_walk', 'runner_jump', 'cq_repeat', 'cq_if_else', 'runner_is_ahead'],
        parEdits: 1,
        initialWorkspace: programToWorkspace(initial),
        ...W4_LIMITS,
      }),
    );
    expect(result).toMatchObject({ minEdits: 1, complete: true, mismatches: [] });
    expect(result.examples.map(formatProgram)).toContain(
      'repeat 8 [if is_ahead(KIND=CLEAR) [walk] else [jump]]',
    );
  });

  it('W4 l19: two bugs (too few passes, swapped question) need 2 edits', () => {
    const hole = { block: 'runner_is_ahead', fields: { KIND: 'HOLE' } };
    const result = findFixes(
      level('runner', [track('..O.O..F'), track('.O...O.O.F')], {
        mode: 'bughunt',
        toolbox: ['runner_walk', 'runner_jump', 'cq_repeat', 'cq_if_else', 'runner_is_ahead'],
        parEdits: 2,
        ...W4_LIMITS,
        initialWorkspace: programToWorkspace([
          {
            repeat: 5,
            body: [
              { if: hole, then: [{ block: 'runner_walk' }], else: [{ block: 'runner_jump' }] },
            ],
          },
        ]),
      }),
      { maxExamples: 20 },
    );
    expect(result).toMatchObject({ minEdits: 2, complete: true, mismatches: [] });
    expect(result.examples.map(formatProgram)).toContain(
      'repeat 12 [if is_ahead(KIND=CLEAR) [walk] else [jump]]',
    );
  });

  it('W5 l13: repeat 20 → repeat-until + "đã tới nơi?" is 2 edits on the 40-cell river', () => {
    const hole = { block: 'runner_is_ahead', fields: { KIND: 'HOLE' } };
    const body: Program = [
      { if: hole, then: [{ block: 'runner_jump' }], else: [{ block: 'runner_walk' }] },
    ];
    const result = findFixes(
      level(
        'runner',
        [track('..O...O.O....O..O.O...O....O.O..O......F'), track('...O.O.....O..O.O...F')],
        {
          mode: 'bughunt',
          toolbox: [
            'runner_walk',
            'runner_jump',
            'cq_repeat',
            'cq_repeat_until',
            'cq_if_else',
            'runner_is_ahead',
            'runner_at_goal',
          ],
          parEdits: 2,
          maxLoopDepth: 1,
          initialWorkspace: programToWorkspace([{ repeat: 20, body }]),
        },
      ),
    );
    expect(result).toMatchObject({ minEdits: 2, complete: true, mismatches: [] });
    expect(result.examples.map(formatProgram)).toContain(
      'until at_goal [if is_ahead(KIND=HOLE) [jump] else [walk]]',
    );
  });

  it('never counts a fix with an empty condition slot, even one the run never reaches', () => {
    // walk, jump, walk wins '..O.F' before the `if` is reached, but runLevel refuses the program.
    const result = findFixes(
      level('runner', [track('..O.F')], {
        mode: 'bughunt',
        toolbox: ['runner_walk', 'runner_jump', 'cq_if', 'runner_is_ahead'],
        parEdits: 2,
        initialWorkspace: programToWorkspace([
          { block: 'runner_walk' },
          { block: 'runner_walk' },
          { block: 'runner_walk' },
          { if: null, then: [{ block: 'runner_walk' }] },
        ]),
      }),
    );
    expect(result).toMatchObject({ minEdits: 2, complete: true, mismatches: [] });
    expect(result.examples.every((example) => !formatProgram(example).includes('if ?'))).toBe(true);
  });

  it('the depth filter on the last edit finds exactly the fixes of the unfiltered search', () => {
    const hole = { block: 'runner_is_ahead', fields: { KIND: 'HOLE' } };
    const cases: Level[] = [
      level('runner', [track('..O.O..F'), track('.O...O.O.F')], {
        mode: 'bughunt',
        toolbox: [
          'runner_walk',
          'runner_jump',
          'cq_repeat',
          'cq_if',
          'cq_if_else',
          'runner_is_ahead',
        ],
        parEdits: 2,
        ...W4_LIMITS,
        initialWorkspace: programToWorkspace([
          {
            repeat: 5,
            body: [
              { if: hole, then: [{ block: 'runner_walk' }], else: [{ block: 'runner_jump' }] },
            ],
          },
        ]),
      }),
      level('maze', [mazeMap('#######/#S..###/###.###/##G.###/#######')], {
        mode: 'bughunt',
        toolbox: [
          'maze_forward',
          'maze_turn_right',
          'cq_repeat_until',
          'cq_if',
          'maze_is_path',
          'maze_at_goal',
        ],
        parEdits: 2,
        initialWorkspace: programToWorkspace([
          { until: { block: 'maze_at_goal' }, body: [{ block: 'maze_turn_right' }] },
          { block: 'maze_forward' },
        ]),
      }),
    ];
    for (const bughunt of cases) {
      const sorted = (programs: Program[]) => programs.map(formatProgram).sort();
      const filtered = findFixes(bughunt, { maxExamples: 1000 });
      const unfiltered = findFixes(bughunt, { maxExamples: 1000, unfilteredEdits: true });
      expect(filtered.complete && unfiltered.complete).toBe(true);
      expect(filtered.minEdits).toBe(unfiltered.minEdits);
      expect(filtered.count).toBe(unfiltered.count);
      expect(sorted(filtered.examples)).toEqual(sorted(unfiltered.examples));
    }
  });

  it('W5 l05: moving "tiến" into the empty loop is one edit', () => {
    const result = findFixes(
      level('maze', [mazeMap('#######/#S...G#/#######')], {
        mode: 'bughunt',
        toolbox: ['maze_forward', 'cq_repeat_until', 'maze_at_goal'],
        parEdits: 1,
        maxLoopDepth: 1,
        initialWorkspace: programToWorkspace([
          { until: { block: 'maze_at_goal' }, body: [] },
          { block: 'maze_forward' },
        ]),
      }),
    );
    expect(result).toMatchObject({ minEdits: 1, complete: true, mismatches: [] });
    // Moving the block in, or copying a new one in and keeping the old one.
    expect(result.examples.map(formatProgram)).toEqual([
      'until at_goal [forward]',
      'until at_goal [forward], forward',
    ]);
  });

  it('W5 l12: a block added to the empty else-branch is one edit', () => {
    const ahead = { block: 'maze_is_path', fields: { DIR: 'AHEAD' } };
    const result = findFixes(
      level('maze', [mazeMap('#######/#S..###/###.###/##G.###/#######')], {
        mode: 'bughunt',
        toolbox: [
          'maze_forward',
          'maze_turn_left',
          'maze_turn_right',
          'cq_repeat_until',
          'cq_if_else',
          'maze_is_path',
          'maze_at_goal',
        ],
        parEdits: 1,
        maxLoopDepth: 1,
        initialWorkspace: programToWorkspace([
          {
            until: { block: 'maze_at_goal' },
            body: [{ if: ahead, then: [{ block: 'maze_forward' }], else: [] }],
          },
        ]),
      }),
    );
    expect(result).toMatchObject({ minEdits: 1, complete: true, mismatches: [] });
    expect(result.examples.map(formatProgram)).toContain(
      'until at_goal [if is_path(DIR=AHEAD) [forward] else [turn_right]]',
    );
  });
});
