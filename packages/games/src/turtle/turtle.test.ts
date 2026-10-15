import type { Level, WorkspaceJson } from '@codequest/content-schema';
import { runLevel, type RunOutcome } from '@codequest/engine';
import { describe, expect, it } from 'vitest';
import { getGameKind, turtleDrawKey } from '../index';
import { drawingKey } from './evaluate';
import {
  turtle,
  turtleConfigSchema,
  gridPoint,
  HEADINGS,
  onPaper,
  pointKey,
  segmentKey,
  targetSegments,
  type TurtleConfig,
  type TurtleEvent,
  type TurtlePoint,
} from './index';
import { normalizeHeading, signOf, step } from './lattice';

/** Chains serialized blocks through `next`. */
function chainOf(chain: object[]): object | undefined {
  let next: object | undefined;
  for (const block of [...chain].reverse()) {
    next = next === undefined ? block : { ...block, next: { block: next } };
  }
  return next;
}

function program(chain: object[]): WorkspaceJson {
  const next = chainOf(chain);
  const start = {
    type: 'cq_start',
    id: 'start',
    deletable: false,
    ...(next !== undefined && { next: { block: next } }),
  };
  return { blocks: { languageVersion: 0, blocks: [start] } };
}

let ids = 0;
const nextId = (prefix: string): string => `${prefix}${String(++ids)}`;
const fwd = (n: number): object => ({ type: 'turtle_forward', id: nextId('f'), fields: { N: n } });
const right = (deg: number): object => ({
  type: 'turtle_turn_right',
  id: nextId('r'),
  fields: { DEG: String(deg) },
});
const left = (deg: number): object => ({
  type: 'turtle_turn_left',
  id: nextId('l'),
  fields: { DEG: String(deg) },
});
const up = (): object => ({ type: 'turtle_pen_up', id: nextId('u') });
const down = (): object => ({ type: 'turtle_pen_down', id: nextId('d') });
const repeat = (times: number, body: object[]): object => ({
  type: 'cq_repeat',
  id: nextId('loop'),
  fields: { TIMES: times },
  inputs: { DO: { block: chainOf(body) } },
});

const SQUARE_TARGET: TurtleConfig = {
  size: { w: 4, h: 4 },
  start: { x: 1, y: 1, heading: 0 },
  target: [{ from: [1, 1], heading: 0, path: 'F2 L90 F2 L90 F2 L90 F2' }],
  grid: 'square',
};

function level(config: TurtleConfig, overrides: Partial<Level> = {}): Level {
  return {
    id: 'turtle-test',
    worldId: '_sandbox',
    stage: 'practice',
    kind: 'turtle',
    mode: 'build',
    title: 'Họa sĩ',
    objective: 'Vẽ hình',
    learningGoal: 'Vẽ',
    toolbox: ['turtle_forward', 'turtle_turn_left', 'turtle_turn_right'],
    hints: [],
    config,
    ...overrides,
  };
}

function run(config: TurtleConfig, chain: object[]): RunOutcome<TurtleEvent> {
  return runLevel({ kind: turtle, level: level(config), workspace: program(chain) });
}

function actions(outcome: RunOutcome<TurtleEvent>): TurtleEvent[] {
  return outcome.events.filter(
    (event): event is TurtleEvent => event.type !== 'highlight' && event.type !== 'sense',
  );
}

/** Segment keys drawn by a run, from its `line` events. */
function drawn(outcome: RunOutcome<TurtleEvent>): string[] {
  const keys = new Set<string>();
  for (const event of actions(outcome)) {
    if (event.type === 'line') keys.add(segmentKey(event.from, event.to));
  }
  return [...keys].sort();
}

const OPEN: TurtleConfig = {
  size: { w: 12, h: 12 },
  start: { x: 6, y: 6, heading: 0 },
  grid: 'tri',
};

describe('turtle lattice', () => {
  it('walks back to the start after one step in each of the 12 headings', () => {
    let point: TurtlePoint = gridPoint(3, 3);
    for (let heading = 0; heading < HEADINGS; heading++) point = step(point, heading);
    expect(point).toEqual(gridPoint(3, 3));
  });

  it('undoes every step with the opposite heading', () => {
    for (let heading = 0; heading < HEADINGS; heading++) {
      expect(step(step(gridPoint(0, 0), heading), heading + 6)).toEqual(gridPoint(0, 0));
    }
  });

  it('normalizes headings and compares p + q√3 exactly', () => {
    expect(normalizeHeading(-1)).toBe(11);
    expect(normalizeHeading(13)).toBe(1);
    expect(signOf(2, -1)).toBe(1); // 2 > √3
    expect(signOf(1, -1)).toBe(-1); // 1 < √3
    expect(signOf(-2, 1)).toBe(-1);
    expect(signOf(0, 0)).toBe(0);
    expect(signOf(-3, 0)).toBe(-1);
  });

  it('keeps the paper edges on the paper', () => {
    const size = { w: 2, h: 2 };
    expect(onPaper(gridPoint(0, 0), size)).toBe(true);
    expect(onPaper(gridPoint(2, 2), size)).toBe(true);
    expect(onPaper(gridPoint(3, 0), size)).toBe(false);
    // x = √3/2 ≈ 0.87, y = 1/2: inside; x = 2 + √3/2: outside.
    expect(onPaper([0, 1, 1, 0], size)).toBe(true);
    expect(onPaper([4, 1, 1, 0], size)).toBe(false);
    expect(onPaper([0, -1, 1, 0], size)).toBe(false);
  });

  it('keys a segment the same way in both directions', () => {
    const p = gridPoint(1, 1);
    const q = step(p, 2);
    expect(segmentKey(p, q)).toBe(segmentKey(q, p));
    expect(pointKey(q)).toBe('3,0,2,1');
  });
});

describe('turtle closed shapes', () => {
  it.each([
    ['triangle', 3, 120],
    ['square', 4, 90],
    ['hexagon', 6, 60],
    ['12-gon', 12, 30],
  ])('a %s ends exactly where it started', (_name, sides, deg) => {
    const outcome = run(OPEN, [repeat(sides, [fwd(1), left(deg)])]);
    expect(outcome.result).toBe('success');
    const lines = actions(outcome).filter((event) => event.type === 'line');
    expect(lines).toHaveLength(sides);
    expect(lines.at(-1)?.to).toEqual(gridPoint(6, 6));
    expect(drawn(outcome)).toHaveLength(sides);
  });
});

describe('turtle config', () => {
  it('accepts a target and expands it to unit segments', () => {
    const config = turtleConfigSchema.parse(SQUARE_TARGET);
    expect(targetSegments(config)?.size).toBe(8);
    expect(targetSegments(turtleConfigSchema.parse(OPEN))).toBeNull();
  });

  it('lifts the pen inside a path', () => {
    const config = turtleConfigSchema.parse({
      ...OPEN,
      target: [{ from: [0, 0], heading: 0, path: 'F1 U F1 D F1' }],
    });
    expect(targetSegments(config)?.size).toBe(2);
  });

  it.each([
    ['an unknown token', { from: [0, 0], heading: 0, path: 'F2 X3' }, 'unknown path token'],
    ['a 45° turn', { from: [0, 0], heading: 0, path: 'F1 R45 F1' }, 'multiple of 30'],
    ['a path leaving the paper', { from: [0, 0], heading: 0, path: 'F5' }, 'leaves the paper'],
    ['a path starting off the paper', { from: [9, 0], heading: 0, path: 'F1' }, 'start on'],
    ['a heading off the lattice', { from: [0, 0], heading: 45, path: 'F1' }, 'multiple of 30'],
    ['a path that draws nothing', { from: [0, 0], heading: 0, path: 'U F1' }, 'draws nothing'],
  ])('rejects %s', (_name, path, message) => {
    const result = turtleConfigSchema.safeParse({ ...SQUARE_TARGET, target: [path] });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain(message);
  });

  it('rejects a start off the paper, unknown angles and too big paper', () => {
    for (const config of [
      { ...SQUARE_TARGET, start: { x: 5, y: 0, heading: 0 } },
      { ...SQUARE_TARGET, angles: [45] },
      { ...SQUARE_TARGET, angles: [90, 90] },
      { ...SQUARE_TARGET, size: { w: 13, h: 4 } },
      { ...SQUARE_TARGET, grid: 'hex' },
    ]) {
      expect(turtleConfigSchema.safeParse(config).success).toBe(false);
    }
  });
});

describe('turtle drawing set', () => {
  it('wins the square in any order and direction', () => {
    const ccw = run(SQUARE_TARGET, [repeat(4, [fwd(2), left(90)])]);
    expect(ccw.result).toBe('success');
    // Clockwise from the other corner: turn up first, then right turns.
    const cw = run(SQUARE_TARGET, [left(90), repeat(4, [fwd(2), right(90)])]);
    expect(cw.result).toBe('success');
    expect(drawn(cw)).toEqual(drawn(ccw));
  });

  it('draws forward 2 exactly like forward 1 twice', () => {
    const one = run(OPEN, [fwd(2)]);
    const two = run(OPEN, [fwd(1), fwd(1)]);
    expect(drawn(one)).toEqual(drawn(two));
    expect(one.stats.actions).toBe(two.stats.actions);
  });

  it('does not mind drawing a line twice', () => {
    const outcome = run(SQUARE_TARGET, [
      fwd(2),
      right(180),
      fwd(2),
      right(180),
      repeat(4, [fwd(2), left(90)]),
    ]);
    expect(outcome.result).toBe('success');
  });

  it('does not draw with the pen up, and turning never draws', () => {
    const outcome = run(OPEN, [right(90), up(), fwd(2), down(), fwd(1), left(30)]);
    const types = actions(outcome).map((event) => event.type);
    expect(types).toEqual(['turn', 'pen', 'move', 'move', 'pen', 'line', 'turn']);
    expect(drawn(outcome)).toHaveLength(1);
  });

  it('starts with the pen up when the config says so', () => {
    const outcome = run({ ...OPEN, penDown: false }, [fwd(2)]);
    expect(drawn(outcome)).toHaveLength(0);
  });
});

describe('turtle reasons', () => {
  it('stops at once on a stray line, Măng at its start', () => {
    // Turning the wrong way: the first step down is not in the square.
    const outcome = run(SQUARE_TARGET, [fwd(2), right(90), fwd(2)]);
    expect(outcome.result).toBe('crash');
    expect(outcome.reasonCode).toBe('EXTRA_LINE');
    const last = actions(outcome).at(-1);
    expect(last).toMatchObject({ type: 'extraLine', from: gridPoint(3, 1) });
    expect(actions(outcome).filter((event) => event.type === 'line')).toHaveLength(2);
  });

  it('lets the pen-up turtle walk anywhere on the paper', () => {
    const outcome = run(SQUARE_TARGET, [
      up(),
      right(90),
      fwd(1),
      left(90),
      fwd(3),
      left(90),
      fwd(3),
      left(90),
      fwd(1),
      down(),
      repeat(4, [fwd(2), left(90)]),
    ]);
    expect(outcome.result).toBe('success');
  });

  it('crashes OFF_PAPER before leaving the paper, even with the pen up', () => {
    const outcome = run(SQUARE_TARGET, [up(), right(90), fwd(2)]);
    expect(outcome.result).toBe('crash');
    expect(outcome.reasonCode).toBe('OFF_PAPER');
    expect(actions(outcome).at(-1)).toMatchObject({ type: 'offPaper', from: gridPoint(1, 0) });
  });

  it('ends MISSING_LINES with lines left to draw', () => {
    const outcome = run(SQUARE_TARGET, [repeat(3, [fwd(2), left(90)])]);
    expect(outcome.result).toBe('incomplete');
    expect(outcome.reasonCode).toBe('MISSING_LINES');
  });

  it('wins a level without target whatever is drawn', () => {
    expect(run(OPEN, [fwd(3), left(120), fwd(2)]).result).toBe('success');
  });

  it('lists every reason code', () => {
    expect(turtle.reasonCodes).toEqual(['EXTRA_LINE', 'MISSING_LINES', 'OFF_PAPER']);
    expect(getGameKind('turtle')).toBe(turtle);
  });

  it('is deterministic', () => {
    const chain = [repeat(6, [fwd(1), left(60)]), right(30), fwd(2)];
    expect(run(OPEN, chain)).toEqual(run(OPEN, chain));
  });
});

describe('turtle predict keys', () => {
  const triangle = program([repeat(3, [fwd(3), right(120)])]);

  function predictKey(config: TurtleConfig, workspace: WorkspaceJson): string | undefined {
    return runLevel({
      kind: turtle,
      level: level(config, { mode: 'predict', initialWorkspace: workspace }),
      workspace,
    }).answerKey;
  }

  it('turtleDrawKey gives the key of a predict run of the same program', () => {
    const key = turtleDrawKey({ config: OPEN }, triangle);
    expect(key).toBe(predictKey(OPEN, triangle));
    expect(key.startsWith('draw:')).toBe(true);
    expect(key.split(';')).toHaveLength(9);
  });

  it('gives the same key for the same picture drawn another way', () => {
    const other = program([right(60), repeat(3, [fwd(3), left(120)])]);
    // Same triangle traced backwards from the same corner.
    expect(turtleDrawKey({ config: OPEN }, other)).toBe(turtleDrawKey({ config: OPEN }, triangle));
    const square = program([repeat(3, [fwd(3), right(90)])]);
    expect(turtleDrawKey({ config: OPEN }, square)).not.toBe(
      turtleDrawKey({ config: OPEN }, triangle),
    );
  });

  it('keys an empty drawing and crashes', () => {
    expect(turtleDrawKey({ config: OPEN }, program([right(90)]))).toBe(drawingKey([]));
    expect(turtleDrawKey({ config: OPEN }, program([fwd(7)]))).toBe('crash:OFF_PAPER@24,0,12,0');
    // With a target, a stray line: the point Măng stopped at, (3, 1).
    const stray = program([fwd(2), right(90), fwd(1)]);
    expect(turtleDrawKey({ config: SQUARE_TARGET }, stray)).toBe('crash:EXTRA_LINE@6,0,2,0');
  });

  it('runs with the level boxes, so the key has their suffix like the real run', () => {
    const variables = [{ id: 'n', name: 'số', start: [2] }];
    const key = turtleDrawKey({ config: OPEN, variables }, triangle);
    expect(key.endsWith('#n=2')).toBe(true);
    expect(key).toBe(
      runLevel({
        kind: turtle,
        level: level(OPEN, { mode: 'predict', initialWorkspace: triangle, variables }),
        workspace: triangle,
      }).answerKey,
    );
  });

  it('runs with the level limits', () => {
    const long = program([repeat(6, [fwd(1), left(60)])]);
    expect(turtleDrawKey({ config: OPEN, limits: { maxActions: 3 } }, long)).not.toBe(
      turtleDrawKey({ config: OPEN }, long),
    );
  });

  it('throws on an invalid config', () => {
    expect(() => turtleDrawKey({ config: { size: { w: 0, h: 0 } } }, triangle)).toThrow(
      /turtleDrawKey/,
    );
  });
});

describe('turtle edge cases (review)', () => {
  it('reports OFF_PAPER, not EXTRA_LINE, for a pen-down step off the paper', () => {
    const corner: TurtleConfig = {
      size: { w: 2, h: 2 },
      start: { x: 0, y: 0, heading: 0 },
      target: [{ from: [0, 0], heading: 0, path: 'F2 L90 F2 L90 F2 L90 F2' }],
      grid: 'square',
    };
    const outcome = run(corner, [right(90), fwd(1)]);
    expect(outcome.reasonCode).toBe('OFF_PAPER');
  });

  it('expands a path whose L and R add up to a 30° heading', () => {
    const config = turtleConfigSchema.parse({
      ...OPEN,
      target: [{ from: [0, 0], heading: 0, path: 'L60 R30 F1' }],
    });
    expect([...(targetSegments(config) ?? [])]).toEqual([segmentKey([0, 0, 0, 0], [0, 1, 1, 0])]);
  });

  it('rejects a target path that walks off the paper with the pen up', () => {
    const result = turtleConfigSchema.safeParse({
      ...SQUARE_TARGET,
      target: [{ from: [0, 0], heading: 0, path: 'U R90 F1 L90 D F1' }],
    });
    expect(result.success).toBe(false);
  });

  it('treats a stroke from off the target lattice as stray, even where it overlaps', () => {
    // Pen up to (2 − √3, 1) by 30° headings, then east: the stroke covers parts of both target
    // segments but is neither of them (ADR-0024 §3).
    const config: TurtleConfig = {
      size: { w: 3, h: 2 },
      start: { x: 0, y: 1, heading: 0 },
      target: [{ from: [0, 1], heading: 0, path: 'F2' }],
      angles: [30, 60, 150, 180],
      grid: 'tri',
    };
    const outcome = run(config, [
      up(),
      fwd(2),
      left(180),
      left(30),
      fwd(1),
      right(60),
      fwd(1),
      down(),
      right(150),
      fwd(1),
    ]);
    expect(outcome.reasonCode).toBe('EXTRA_LINE');
    expect(actions(outcome).at(-1)).toMatchObject({ type: 'extraLine', from: [4, -2, 2, 0] });
  });

  it('keeps the target out of the state', () => {
    expect(
      Object.keys(turtle.createState(turtleConfigSchema.parse(SQUARE_TARGET), () => 0)),
    ).not.toContain('target');
  });
});
