// P3-01a: robotlab headless core, the rules of product/game-kinds.md §3.3 and the hand-worked
// examples of curriculum.md §6.1.
import type { Level, WorkspaceJson } from '@codequest/content-schema';
import {
  compileProgram,
  registerBlockSpecs,
  runLevel,
  type RunOutcome,
  type SimContext,
} from '@codequest/engine';
import { describe, expect, it, vi } from 'vitest';
import { getGameKind } from '../index';
import {
  resolveRobotlabRules,
  robotlab,
  robotlabLevelConfigSchema,
  robotlabResolvedSchema,
  robotlabRulesSchema,
  type RobotLabConfig,
  type RobotLabEvent,
  type RobotLabLevelConfig,
  type RobotLabState,
} from './index';
import { createRobotLabApi } from './sim';
import { createRobotLabState } from './state';

// ---------------------------------------------------------------------------------------------
// Fixtures

// Loaded through Vite (no node:fs: headless packages are typed without Node globals).
const sharedModule = await vi.importActual<{ default: unknown }>(
  '../../../../content/shared/robotlab.json',
);
const shared = robotlabRulesSchema.parse(sharedModule.default);

/** The one test helper that merges the shared rules (`content/shared/robotlab.json`). */
function resolvedFixture(config: unknown): RobotLabConfig {
  return resolveRobotlabRules(robotlabLevelConfigSchema.parse(config), shared);
}

/** A board in the curriculum's notation, rows split by `/`. */
const board = (text: string): string[] => text.split('/');

function level(config: unknown, overrides: Partial<Level> = {}): Level {
  return {
    id: 'w06-l01',
    worldId: 'w06-thanh-pho-robot',
    stage: 'practice',
    kind: 'robotlab',
    mode: 'build',
    title: 'Robot',
    objective: 'Thử',
    learningGoal: 'Robot',
    toolbox: [],
    hints: [],
    config,
    ...overrides,
  };
}

function chainOf(blocks: readonly object[]): object | undefined {
  let next: object | undefined;
  for (const block of [...blocks].reverse()) {
    next = next === undefined ? block : { ...block, next: { block: next } };
  }
  return next;
}

function program(chain: readonly object[]): WorkspaceJson {
  const next = chainOf(chain);
  const start = {
    type: 'cq_start',
    id: 'start',
    ...(next !== undefined && { next: { block: next } }),
  };
  return { blocks: { languageVersion: 0, blocks: [start] } };
}

let nextId = 0;
const uid = (prefix: string): string => `${prefix}${String(nextId++)}`;
const forward = (n: number, id = uid('f')): object => ({
  type: 'robot_forward',
  id,
  fields: { N: n },
});
const left = (id = uid('l')): object => ({ type: 'robot_turn_left', id });
const right = (id = uid('r')): object => ({ type: 'robot_turn_right', id });
const grab = (id = uid('g')): object => ({ type: 'robot_grab', id });
const release = (id = uid('d')): object => ({ type: 'robot_release', id });
const lineAhead = (id = uid('s')): object => ({ type: 'robot_line_ahead', id });
const atLab = (id = uid('s')): object => ({ type: 'robot_at_lab', id });
const holding = (id = uid('s')): object => ({ type: 'robot_holding', id });
const colorIs = (color: string, id = uid('s')): object => ({
  type: 'robot_block_color',
  id,
  fields: { COLOR: color },
});
function control(type: string, cond: object, body: object[], otherwise?: object[]): object {
  const doChain = chainOf(body);
  const elseChain = otherwise === undefined ? undefined : chainOf(otherwise);
  return {
    type,
    id: uid('c'),
    inputs: {
      COND: { block: cond },
      ...(doChain !== undefined && { DO: { block: doChain } }),
      ...(elseChain !== undefined && { ELSE: { block: elseChain } }),
    },
  };
}
const ifElse = (cond: object, body: object[], otherwise: object[]): object =>
  control('cq_if_else', cond, body, otherwise);
const until = (cond: object, body: object[]): object => control('cq_repeat_until', cond, body);
const repeat = (times: number, body: object[]): object => ({
  type: 'cq_repeat',
  id: uid('loop'),
  fields: { TIMES: times },
  inputs: { DO: { block: chainOf(body) } },
});

/**
 * A program in the curriculum's short notation: `f3` = "tiến 3 ô", `L` / `R` = rẽ trái / phải,
 * `G` = gắp, `D` = thả. Blocks get ids `p0`, `p1`… in order.
 */
function prog(text: string): object[] {
  return text
    .split(/\s+/)
    .filter((token) => token !== '')
    .map((token, index) => {
      const id = `p${String(index)}`;
      if (token.startsWith('f')) return forward(Number(token.slice(1)), id);
      const make = { L: left, R: right, G: grab, D: release }[token];
      if (make === undefined) throw new Error(`unknown token ${token}`);
      return make(id);
    });
}

type Outcome = RunOutcome<RobotLabEvent>;

function run(config: unknown, chain: readonly object[], overrides: Partial<Level> = {}): Outcome {
  return runLevel({
    kind: robotlab,
    level: level(resolvedFixture(config), overrides),
    workspace: program(chain),
  });
}

/** Game events without the engine's highlight and sense events. */
function actions(outcome: Outcome): RobotLabEvent[] {
  return outcome.events.filter(
    (event): event is RobotLabEvent => event.type !== 'highlight' && event.type !== 'sense',
  );
}

const types = (outcome: Outcome): string[] => actions(outcome).map((event) => event.type);

/** Predict key of a run, computed by running in mode predict. */
function predict(config: unknown, chain: readonly object[]): string | undefined {
  return runLevel({
    kind: robotlab,
    level: level(resolvedFixture(config), {
      mode: 'predict',
      initialWorkspace: program(chain),
    }),
    workspace: program([]),
  }).answerKey;
}

/** `ctx.stop` stand-in for driving the API directly. */
class Stopped extends Error {
  constructor(
    readonly result: string,
    readonly reasonCode: string | null,
  ) {
    super(`${result}:${String(reasonCode)}`);
  }
}

/** The API on a fresh state, without the interpreter, to look at the state after each call. */
function direct(config: unknown) {
  const state = createRobotLabState(resolvedFixture(config));
  const events: Array<{ type: string; blockId: string | null }> = [];
  function stop(result: 'success'): never;
  function stop(result: 'crash' | 'incomplete', reasonCode: string): never;
  function stop(result: string, reasonCode?: string): never {
    throw new Stopped(result, reasonCode ?? null);
  }
  const ctx: SimContext<RobotLabState, RobotLabEvent> = {
    state,
    emit: (event, blockId) => {
      events.push({ ...event, blockId });
    },
    sense: (value, blockId) => {
      events.push({ type: 'sense', blockId });
      return value;
    },
    stop,
    rng: () => 0,
    level: level(config),
  };
  const api = createRobotLabApi(ctx);
  const call = (name: string, ...args: Array<string | number>): Stopped | null => {
    const fn = api[name];
    if (fn === undefined) throw new Error(`no api ${name}`);
    try {
      fn(...args, 'b');
      return null;
    } catch (error) {
      if (error instanceof Stopped) return error;
      throw error;
    }
  };
  return { state, events, call };
}

/** A copy of the parts of the state an action may change. */
const snapshot = (state: RobotLabState) => ({
  pos: state.pos,
  dir: state.dir,
  elapsed: state.elapsed,
  blocks: structuredClone(state.blocks),
});

/** Corridor west to east: lab at 1,0. */
const CORRIDOR = board('#####/L..../#####');
const goHome = { type: 'missions', mustReturn: true } as const;

// ---------------------------------------------------------------------------------------------

describe('robotlab registration and blocks', () => {
  it('is registered as robotlab without star goals', () => {
    expect(getGameKind('robotlab')).toBe(robotlab);
    expect('checkStarGoal' in robotlab).toBe(false);
  });

  it('declares every reason code of the spec', () => {
    expect([...robotlab.reasonCodes]).toEqual([
      'OFF_LINE',
      'HIT_BLOCK',
      'NOTHING_TO_GRAB',
      'HANDS_FULL',
      'HANDS_EMPTY',
      'CELL_TAKEN',
      'WRONG_PLACE',
      'WRONG_COLOR',
      'OUT_OF_TIME',
      'MISSIONS_LEFT',
      'NOT_HOME',
      'LOW_SCORE',
    ]);
  });

  it('has a Vietnamese feedback line for every reason code', async () => {
    const feedback = await vi.importActual<Record<string, unknown>>(
      '../../../../content/shared/feedback.json',
    );
    expect(robotlab.reasonCodes.filter((code) => typeof feedback[code] !== 'string')).toEqual([]);
  });

  it('uses the exact labels and tooltips of the spec', () => {
    const table = robotlab.blocks.map((spec) => [
      spec.type,
      spec.category,
      spec.json.message0,
      spec.json.tooltip,
    ]);
    expect(table).toEqual([
      ['robot_forward', 'move', 'tiến %1 ô', 'Tiến 3 ô: dừng ở ngã tư thứ 3'],
      ['robot_turn_left', 'move', 'rẽ trái', 'Quay sang trái tại chỗ, chưa đi'],
      ['robot_turn_right', 'move', 'rẽ phải', 'Quay sang phải tại chỗ, chưa đi'],
      ['robot_grab', 'move', 'gắp', 'Gắp khối ở chỗ Bíp đứng'],
      ['robot_release', 'move', 'thả', 'Thả khối xuống chỗ Bíp đứng'],
      [
        'robot_line_ahead',
        'sensor',
        'phía trước có line?',
        '✔ khi phía trước Bíp có line, ✘ khi không',
      ],
      [
        'robot_block_color',
        'sensor',
        'khối ở chỗ Bíp màu %1?',
        '✔ khi khối ở chỗ Bíp có màu con chọn, ✘ khi không',
      ],
      [
        'robot_at_lab',
        'sensor',
        'đã về phòng thí nghiệm?',
        '✔ khi Bíp đứng ở phòng thí nghiệm, ✘ khi chưa',
      ],
      ['robot_holding', 'sensor', 'đang gắp khối?', '✔ khi tay gắp đang giữ khối, ✘ khi tay trống'],
    ]);
    const forwardField = robotlab.blocks[0]?.json.args0?.[0];
    expect(forwardField).toMatchObject({
      type: 'field_number',
      value: 1,
      min: 1,
      max: 9,
      precision: 1,
    });
    const colours = robotlab.blocks.find((spec) => spec.type === 'robot_block_color')?.json
      .args0?.[0];
    expect(colours).toMatchObject({
      options: [
        ['đỏ', 'RED'],
        ['vàng', 'YELLOW'],
        ['xanh lá', 'GREEN'],
      ],
    });
  });

  it('generates one API call per block with the block id last', () => {
    registerBlockSpecs(robotlab.blocks);
    const code = compileProgram(
      program([
        forward(3, "it's"),
        left('l'),
        right('r'),
        grab('g'),
        release('d'),
        until(atLab('a'), [ifElse(colorIs('YELLOW', 'c'), [], [])]),
        until(lineAhead('x'), []),
        until(holding('h'), []),
      ]),
    );
    expect(code).toContain(`forward(3, 'it\\'s');`);
    expect(code).toContain(`turn('LEFT', 'l');`);
    expect(code).toContain(`turn('RIGHT', 'r');`);
    expect(code).toContain(`grab('g');`);
    expect(code).toContain(`release('d');`);
    expect(code).toContain(`atLab('a')`);
    expect(code).toContain(`blockColor('YELLOW', 'c')`);
    expect(code).toContain(`lineAhead('x')`);
    expect(code).toContain(`holding('h')`);
  });

  it('refuses a crossing count outside 1–9 in the API (Blockly clamps the field anyway)', () => {
    const lab = direct({ map: CORRIDOR, startDir: 'E', goal: goHome });
    for (const bad of [0, 10, 1.5]) expect(() => lab.call('forward', bad)).toThrow('crossings');
    expect(() => lab.call('blockColor', 'BLUE')).toThrow('unknown colour');
    expect(() => lab.call('turn', 'BACK')).toThrow('unknown side');
  });
});

describe('robotlab config', () => {
  const valid: RobotLabLevelConfig = {
    map: board('##r##/Z#.##/..L##'),
    startDir: 'N',
    blocks: [
      { kind: 'neutralizer', color: 'RED', at: [1, 2] },
      { kind: 'fence', at: [2, 0] },
    ],
    goal: { type: 'score', target: 200 },
    rules: { timeLimit: 20 },
  };

  it('accepts a valid level and the shared rules file', () => {
    expect(robotlabLevelConfigSchema.safeParse(valid).success).toBe(true);
    expect(robotlabRulesSchema.safeParse(sharedModule.default).success).toBe(true);
    expect(shared).toEqual({
      timeLimit: 120,
      costs: { forward: 2, turn: 1, grab: 2, release: 2 },
      points: { contain: 45, neutralize: 160, retrieve: 100, return: 40 },
    });
  });

  /** Issues as `path: message`. */
  const reject = (patch: Partial<Record<string, unknown>>): string[] => {
    const result = robotlabLevelConfigSchema.safeParse({ ...valid, ...patch });
    return result.success
      ? []
      : result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  };

  it.each([
    [
      'a fence with a colour',
      { blocks: [{ kind: 'fence', color: 'RED', at: [2, 0] }] },
      'blocks.0: Unrecognized key: "color"',
    ],
    [
      'a neutralizer without colour',
      { blocks: [{ kind: 'neutralizer', at: [1, 2] }] },
      'blocks.0.color: Invalid option',
    ],
    [
      'fewer stations than neutralizers of a colour',
      {
        blocks: [
          { kind: 'neutralizer', color: 'RED', at: [1, 2] },
          { kind: 'neutralizer', color: 'RED', at: [2, 1] },
          { kind: 'fence', at: [2, 0] },
        ],
      },
      'blocks: 2 RED neutralizers need at least 2 "r" stations',
    ],
    [
      'a held neutralizer without a station of its colour',
      { startHolding: { kind: 'neutralizer', color: 'GREEN' } },
      'blocks: 1 GREEN neutralizers need at least 1 "g" stations',
    ],
    ['the start on a block', { start: [1, 2] }, 'blocks.0.at: block must not be on the start'],
    ['the start on a house', { start: [0, 0] }, 'start: start must be a crossing on the map'],
    ['the start off the map', { start: [5, 0] }, 'start: start must be a crossing on the map'],
    [
      'a block off a "." crossing',
      { blocks: [{ kind: 'fence', at: [2, 2] }] },
      'blocks.0.at: block must be on a "." crossing',
    ],
    [
      'two blocks on one crossing',
      {
        blocks: [
          { kind: 'fence', at: [2, 0] },
          { kind: 'fence', at: [2, 0] },
        ],
      },
      'blocks.1.at: block positions must be unique',
    ],
    [
      'fewer fences than Z cells',
      { blocks: [{ kind: 'neutralizer', color: 'RED', at: [1, 2] }] },
      'blocks: 1 "Z" cells need at least 1 fences',
    ],
    ['no lab', { map: board('##r##/Z#.##/...##') }, 'map: map must contain exactly one "L"'],
    ['two labs', { map: board('##r##/Z#L##/..L##') }, 'map: map must contain exactly one "L"'],
    ['an unknown tile', { map: board('##r##/Z#x##/..L##') }, 'map.1: unknown tile "x"'],
    ['ragged rows', { map: board('##r##/Z#.#/..L##') }, 'map.1: every row must have 5 columns'],
    ['too few rows', { map: board('##r##/..L##') }, 'map: Too small'],
    [
      'too many columns',
      { map: board('##r#######/Z#.#######/..L#######') },
      'map.0: rows must have 3–9 columns',
    ],
    ['a score target of 0', { goal: { type: 'score', target: 0 } }, 'goal.target: Too small'],
    ['a time limit of 0', { rules: { timeLimit: 0 } }, 'rules.timeLimit: Too small'],
    ['a time limit over 600', { rules: { timeLimit: 601 } }, 'rules.timeLimit: Too big'],
    ['a free turn', { rules: { costs: { turn: 0 } } }, 'rules.costs.turn: Too small'],
    ['a free forward', { rules: { costs: { forward: 0 } } }, 'rules.costs.forward: Too small'],
    ['an unknown rules key', { rules: { speed: 2 } }, 'rules: Unrecognized key: "speed"'],
    [
      'more than 8 blocks',
      {
        map: board('........./L......../#########'),
        blocks: Array.from({ length: 9 }, (_, c) => ({ kind: 'fence', at: [0, c] })),
        goal: goHome,
      },
      'blocks: Too big',
    ],
    [
      'missions without any job and without mustReturn',
      { blocks: [], map: board('#####/L..../#####'), goal: { type: 'missions' } },
      'goal: missions need a job',
    ],
  ])('rejects %s', (_, patch, expected) => {
    expect(reject(patch).some((issue) => issue.startsWith(expected))).toBe(true);
  });

  it('allows spare stations and missions with only mustReturn', () => {
    expect(reject({ map: board('#####/L.ryg/#####'), blocks: [], goal: goHome })).toEqual([]);
  });

  it('merges level rules over the shared rules, key by key, without mutating', () => {
    const config: RobotLabLevelConfig = {
      ...valid,
      rules: { timeLimit: 20, costs: { turn: 3 }, points: { return: 10 } },
    };
    const before = structuredClone(config);
    const resolved = resolveRobotlabRules(config, shared);
    expect(config).toEqual(before);
    expect(resolved.rules).toEqual({
      timeLimit: 20,
      costs: { forward: 2, turn: 3, grab: 2, release: 2 },
      points: { contain: 45, neutralize: 160, retrieve: 100, return: 10 },
    });
    expect(resolveRobotlabRules({ ...valid, rules: undefined }, shared).rules).toEqual(shared);
    // A resolved config is valid for both schemas, so runLevel keeps the merged rules.
    expect(robotlabResolvedSchema.safeParse(resolved).success).toBe(true);
    expect(robotlabLevelConfigSchema.parse(resolved)).toEqual(resolved);
  });

  it('refuses an unmerged config in createState and in runLevel (INTERNAL_ERROR)', () => {
    expect(robotlabResolvedSchema.safeParse(valid).success).toBe(false);
    expect(() => createRobotLabState(valid)).toThrow('robotlab config not resolved');
    expect(() => createRobotLabState({ ...valid, rules: undefined })).toThrow(
      'robotlab config not resolved',
    );
    const outcome = runLevel({
      kind: robotlab,
      level: level(valid),
      workspace: program(prog('f1')),
    });
    expect(outcome).toMatchObject({ result: 'error', reasonCode: 'INTERNAL_ERROR' });
    expect(outcome.debug?.message).toContain('robotlab config not resolved');
  });

  it('builds the state with fixed block indices: startHolding first, then config.blocks', () => {
    const state = createRobotLabState(
      resolvedFixture({
        map: board('#####/L.r.y/#####'),
        startDir: 'E',
        startHolding: { kind: 'neutralizer', color: 'YELLOW' },
        blocks: [{ kind: 'neutralizer', color: 'RED', at: [1, 3] }],
        goal: goHome,
      }),
    );
    expect(state).toMatchObject({ pos: [1, 0], dir: 'E', elapsed: 0, crashAt: null });
    expect(state.blocks).toEqual([
      { kind: 'neutralizer', color: 'YELLOW', where: 'held' },
      { kind: 'neutralizer', color: 'RED', where: { at: [1, 3] } },
    ]);
  });
});

describe('robotlab forward (cell table)', () => {
  it('drives N crossings, one move event per crossing with the clock', () => {
    const outcome = run({ map: CORRIDOR, startDir: 'W', start: [1, 4], goal: goHome }, prog('f4'));
    expect(outcome.result).toBe('success');
    expect(actions(outcome)).toEqual([
      { type: 'move', blockId: 'p0', from: [1, 4], to: [1, 3], dir: 'W', t: 2 },
      { type: 'move', blockId: 'p0', from: [1, 3], to: [1, 2], dir: 'W', t: 4 },
      { type: 'move', blockId: 'p0', from: [1, 2], to: [1, 1], dir: 'W', t: 6 },
      { type: 'move', blockId: 'p0', from: [1, 1], to: [1, 0], dir: 'W', t: 8 },
    ]);
  });

  it('OFF_LINE off the board edge, after the crossings it could drive (lesson card 4)', () => {
    const config = { map: CORRIDOR, startDir: 'W', start: [1, 4], goal: goHome } as const;
    const outcome = run(config, prog('f4 f1'));
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'OFF_LINE' });
    expect(types(outcome)).toEqual(['move', 'move', 'move', 'move', 'bump']);
    expect(actions(outcome).at(-1)).toEqual({
      type: 'bump',
      blockId: 'p1',
      at: [1, 0],
      dir: 'W',
      into: 'offLine',
    });
    expect(predict(config, prog('f4 f1'))).toBe('crash:OFF_LINE@1,0');
  });

  it('OFF_LINE into a house', () => {
    const outcome = run({ map: CORRIDOR, startDir: 'N', start: [1, 2], goal: goHome }, prog('f1'));
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'OFF_LINE' });
    expect(actions(outcome)).toEqual([
      { type: 'bump', blockId: 'p0', at: [1, 2], dir: 'N', into: 'offLine' },
    ]);
  });

  const fenceAt = (c: number) =>
    ({
      map: CORRIDOR,
      startDir: 'W',
      start: [1, 4],
      blocks: [{ kind: 'fence', at: [1, c] }],
      goal: goHome,
    }) as const;

  it('stops on a block when it is the last crossing and the gripper is empty', () => {
    const outcome = run(fenceAt(2), prog('f2'));
    expect(types(outcome)).toEqual(['move', 'move']);
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_HOME' });
  });

  it('HIT_BLOCK when crossings are left after the block (W6 l05: tiến 4)', () => {
    const outcome = run(fenceAt(2), prog('f4'));
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'HIT_BLOCK' });
    expect(actions(outcome)).toEqual([
      { type: 'move', blockId: 'p0', from: [1, 4], to: [1, 3], dir: 'W', t: 2 },
      { type: 'bump', blockId: 'p0', at: [1, 3], dir: 'W', into: 'block' },
    ]);
    expect(predict(fenceAt(2), prog('f4'))).toBe('crash:HIT_BLOCK@1,3');
  });

  it('HIT_BLOCK when driving onto a block with something in the gripper', () => {
    const config = {
      map: CORRIDOR,
      startDir: 'W',
      start: [1, 4],
      blocks: [
        { kind: 'fence', at: [1, 3] },
        { kind: 'fence', at: [1, 1] },
      ],
      goal: goHome,
    } as const;
    const outcome = run(config, prog('f1 G f2'));
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'HIT_BLOCK' });
    expect(predict(config, prog('f1 G f2'))).toBe('crash:HIT_BLOCK@1,2');
  });

  it('HIT_BLOCK when driving through a block it placed itself', () => {
    // Grabbed at 1,3, placed at 1,2, back east to 1,3, then west through 1,2.
    const through = run(fenceAt(3), prog('f1 G f1 D R R f1 R R f2'));
    expect(through).toMatchObject({ result: 'crash', reasonCode: 'HIT_BLOCK' });
    expect(actions(through).at(-1)).toMatchObject({ type: 'bump', at: [1, 3], into: 'block' });
  });

  it('leaves a crossing with a block on it freely', () => {
    const outcome = run(fenceAt(3), prog('f1 f3'));
    expect(outcome.result).toBe('success');
  });
});

describe('robotlab turn, grab and release (cell table)', () => {
  it('turns on the spot for 1 s', () => {
    const outcome = run({ map: CORRIDOR, startDir: 'N', goal: goHome }, prog('R L L'));
    expect(actions(outcome)).toEqual([
      { type: 'turn', blockId: 'p0', from: 'N', to: 'E', t: 1 },
      { type: 'turn', blockId: 'p1', from: 'E', to: 'N', t: 2 },
      { type: 'turn', blockId: 'p2', from: 'N', to: 'W', t: 3 },
    ]);
    expect(outcome.result).toBe('success');
  });

  const pollutionAt13 = {
    map: CORRIDOR,
    startDir: 'E',
    blocks: [{ kind: 'pollution', color: 'RED', at: [1, 3] }],
    goal: { type: 'missions' },
  } as const;

  it('grabs the block on its own crossing', () => {
    const outcome = run(pollutionAt13, prog('f3 G'));
    expect(actions(outcome).at(-1)).toEqual({
      type: 'grab',
      blockId: 'p1',
      at: [1, 3],
      block: { kind: 'pollution', color: 'RED' },
      index: 0,
      t: 8,
    });
  });

  it('NOTHING_TO_GRAB on an empty crossing (W6 l05: tiến 1, gắp)', () => {
    const config = {
      map: CORRIDOR,
      startDir: 'W',
      start: [1, 4],
      blocks: [{ kind: 'fence', at: [1, 2] }],
      goal: goHome,
    } as const;
    const outcome = run(config, prog('f1 G'));
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'NOTHING_TO_GRAB' });
    expect(actions(outcome).at(-1)).toEqual({
      type: 'gripFail',
      blockId: 'p1',
      at: [1, 3],
      reason: 'NOTHING_TO_GRAB',
    });
    expect(predict(config, prog('f1 G'))).toBe('crash:NOTHING_TO_GRAB@1,3');
  });

  it('HANDS_FULL when grabbing with a block in the gripper', () => {
    // Holding a block, the robot cannot stop on another block, so this is an empty crossing.
    const empty = run(
      { map: CORRIDOR, startDir: 'E', startHolding: { kind: 'fence' }, goal: goHome },
      prog('f1 G'),
    );
    expect(empty).toMatchObject({ result: 'crash', reasonCode: 'HANDS_FULL' });
    expect(actions(empty).at(-1)).toMatchObject({ type: 'gripFail', reason: 'HANDS_FULL' });
  });

  it('HANDS_EMPTY when releasing with nothing in the gripper', () => {
    const outcome = run({ map: CORRIDOR, startDir: 'E', goal: goHome }, prog('D'));
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'HANDS_EMPTY' });
    expect(actions(outcome)).toEqual([
      { type: 'gripFail', blockId: 'p0', at: [1, 0], reason: 'HANDS_EMPTY' },
    ]);
  });

  it('CELL_TAKEN when releasing on a crossing that already has a block', () => {
    // Unreachable through the schema (the start never has a block), so set the state directly.
    const lab = direct({
      map: CORRIDOR,
      startDir: 'E',
      startHolding: { kind: 'fence' },
      blocks: [{ kind: 'fence', at: [1, 2] }],
      goal: goHome,
    });
    lab.state.pos = [1, 2];
    const before = snapshot(lab.state);
    expect(lab.call('release')).toMatchObject({ result: 'crash', reasonCode: 'CELL_TAKEN' });
    expect(lab.events).toEqual([
      { type: 'gripFail', blockId: 'b', at: [1, 2], reason: 'CELL_TAKEN' },
    ]);
    expect(snapshot(lab.state)).toEqual(before);
    expect(lab.state.crashAt).toEqual([1, 2]);
  });

  /**
   * "Thả ở đâu": the robot starts holding `held` on column `c` of `.L.Zryg` and releases.
   * Spare fences on row 0 keep the schema happy.
   */
  const RELEASE_MAP = board('.......  /.L.Zryg/#######'.replace(/ /g, ''));
  const TILE_COLUMN = { '.': 0, L: 1, Z: 3, r: 4, y: 5, g: 6 } as const;
  type Held = NonNullable<RobotLabLevelConfig['startHolding']>;
  function releaseOn(tile: keyof typeof TILE_COLUMN, held: Held): Outcome {
    return run(
      {
        map: RELEASE_MAP,
        startDir: 'E',
        start: [1, TILE_COLUMN[tile]],
        startHolding: held,
        blocks: [{ kind: 'fence', at: [0, 0] }],
        goal: { type: 'missions' },
      },
      prog('D'),
    );
  }
  const fence: Held = { kind: 'fence' };
  const red: Held = { kind: 'neutralizer', color: 'RED' };
  const pollution: Held = { kind: 'pollution', color: 'YELLOW' };

  it.each([
    ['.', fence, 'placed'],
    ['.', red, 'placed'],
    ['.', pollution, 'placed'],
    ['L', pollution, 'retrieved'],
    ['Z', fence, 'contained'],
    ['r', red, 'neutralized'],
    ['y', { kind: 'neutralizer', color: 'YELLOW' }, 'neutralized'],
    ['g', { kind: 'neutralizer', color: 'GREEN' }, 'neutralized'],
  ] as const)('releases on %s: %o → %s', (tile, held, result) => {
    const outcome = releaseOn(tile, held);
    expect(outcome.result).not.toBe('crash');
    expect(actions(outcome)).toEqual([
      {
        type: 'release',
        blockId: 'p0',
        at: [1, TILE_COLUMN[tile]],
        block: held,
        index: 0,
        result,
        t: 2,
      },
    ]);
  });

  it.each([
    ['L', fence, 'WRONG_PLACE'],
    ['L', red, 'WRONG_PLACE'],
    ['Z', red, 'WRONG_PLACE'],
    ['Z', pollution, 'WRONG_PLACE'],
    ['r', fence, 'WRONG_PLACE'],
    ['r', pollution, 'WRONG_PLACE'],
    ['y', red, 'WRONG_COLOR'],
    ['g', red, 'WRONG_COLOR'],
  ] as const)('refuses to release on %s: %o → %s', (tile, held, reason) => {
    const outcome = releaseOn(tile, held);
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: reason });
    expect(actions(outcome)).toEqual([
      { type: 'gripFail', blockId: 'p0', at: [1, TILE_COLUMN[tile]], reason },
    ]);
  });

  it.each([
    ['Z', red],
    ['y', red],
    ['r', fence],
  ] as const)('CELL_TAKEN on %s comes before the release table (%o)', (tile, held) => {
    // A block lying on a Z or a station is unreachable through the schema: set it directly.
    const lab = direct({
      map: RELEASE_MAP,
      startDir: 'E',
      start: [1, TILE_COLUMN[tile]],
      startHolding: held,
      blocks: [{ kind: 'fence', at: [0, 0] }],
      goal: { type: 'missions' },
    });
    const lying = lab.state.blocks[1];
    if (lying === undefined) throw new Error('no block 1');
    lab.state.blocks[1] = { ...lying, where: { at: [1, TILE_COLUMN[tile]] } };
    expect(lab.call('release')).toMatchObject({ result: 'crash', reasonCode: 'CELL_TAKEN' });
    expect(lab.events).toEqual([
      { type: 'gripFail', blockId: 'b', at: [1, TILE_COLUMN[tile]], reason: 'CELL_TAKEN' },
    ]);
  });

  it('a retrieved block vanishes: the lab never holds a block', () => {
    const lab = direct({
      map: CORRIDOR,
      startDir: 'E',
      startHolding: { kind: 'pollution', color: 'RED' },
      goal: { type: 'missions' },
    });
    expect(lab.call('release')).toBeNull();
    expect(lab.state.blocks).toEqual([{ kind: 'pollution', color: 'RED', where: 'done' }]);
    expect(lab.call('grab')).toMatchObject({ reasonCode: 'NOTHING_TO_GRAB' });
  });

  it('grabbing a placed block again makes its job unfinished', () => {
    const config = {
      map: board('###Z#/L..../#####'),
      startDir: 'E',
      blocks: [{ kind: 'fence', at: [1, 2] }],
      goal: { type: 'missions' },
    } as const;
    expect(run(config, prog('f2 G f1 L f1 D')).result).toBe('success');
    const regrab = run(config, prog('f2 G f1 L f1 D G'));
    expect(regrab).toMatchObject({ result: 'incomplete', reasonCode: 'MISSIONS_LEFT' });
    expect(actions(regrab).at(-1)).toMatchObject({ type: 'grab', at: [0, 3], index: 0 });
  });
});

describe('robotlab clock and the fixed action order', () => {
  /** Corridor with a 2 s budget left after `elapsed` is set. */
  function clocked(timeLimit: number, extra: Partial<RobotLabLevelConfig> = {}) {
    return direct({
      map: CORRIDOR,
      startDir: 'E',
      blocks: [{ kind: 'fence', at: [1, 1] }],
      goal: goHome,
      rules: { timeLimit },
      ...extra,
    });
  }

  it('an invalid action in the last second is a cell error, not OUT_OF_TIME, and costs nothing', () => {
    const lab = clocked(10);
    lab.state.elapsed = 10;
    lab.state.dir = 'W';
    const before = snapshot(lab.state);
    expect(lab.call('forward', 1)).toMatchObject({ result: 'crash', reasonCode: 'OFF_LINE' });
    expect(lab.events.map((event) => event.type)).toEqual(['bump']);
    expect(snapshot(lab.state)).toEqual(before);
  });

  it('a valid action without enough time: timeUp, OUT_OF_TIME, the state unchanged', () => {
    const lab = clocked(10);
    lab.state.elapsed = 9;
    const before = snapshot(lab.state);
    expect(lab.call('forward', 1)).toMatchObject({
      result: 'incomplete',
      reasonCode: 'OUT_OF_TIME',
    });
    expect(lab.events).toEqual([{ type: 'timeUp', blockId: 'b', at: [1, 0], t: 9 }]);
    expect(snapshot(lab.state)).toEqual(before);
  });

  it('an action that exactly fills the time limit is done', () => {
    const lab = clocked(10);
    lab.state.elapsed = 8;
    expect(lab.call('forward', 1)).toBeNull();
    expect(lab.state.elapsed).toBe(10);
    expect(lab.state.pos).toEqual([1, 1]);
  });

  it('tiến 3 running out of time at the 2nd crossing: exactly 1 move', () => {
    const outcome = run(
      { map: CORRIDOR, startDir: 'E', goal: goHome, rules: { timeLimit: 3 } },
      prog('f3'),
    );
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'OUT_OF_TIME' });
    expect(actions(outcome)).toEqual([
      { type: 'move', blockId: 'p0', from: [1, 0], to: [1, 1], dir: 'E', t: 2 },
      { type: 'timeUp', blockId: 'p0', at: [1, 1], t: 2 },
    ]);
    expect(
      predict({ map: CORRIDOR, startDir: 'E', goal: goHome, rules: { timeLimit: 3 } }, prog('f3')),
    ).toBe('outOfTime@1,1');
  });

  // Every action, valid and invalid, with no time left: the cell check always comes first.
  const cases: Array<[string, Array<string | number>, Partial<RobotLabLevelConfig>, string]> = [
    ['forward', [1], {}, 'OUT_OF_TIME'],
    ['forward', [1], { startDir: 'W' }, 'OFF_LINE'],
    ['turn', ['LEFT'], {}, 'OUT_OF_TIME'],
    // Standing on the fence at 1,1 (moved there in the test: the start may not have a block).
    ['grab', [], {}, 'OUT_OF_TIME'],
    ['grab', [], {}, 'NOTHING_TO_GRAB'],
    ['release', [], { startHolding: { kind: 'fence' }, start: [1, 2] }, 'OUT_OF_TIME'],
    ['release', [], {}, 'HANDS_EMPTY'],
    ['release', [], { startHolding: { kind: 'fence' } }, 'WRONG_PLACE'],
  ];
  it.each(cases)('%s %o with no time left → %s', (name, args, extra, reason) => {
    const lab = clocked(5, extra);
    lab.state.elapsed = 5;
    if (name === 'grab' && reason === 'OUT_OF_TIME') lab.state.pos = [1, 1];
    const before = snapshot(lab.state);
    expect(lab.call(name, ...args)).toMatchObject({ reasonCode: reason });
    expect(snapshot(lab.state)).toEqual(before);
    const expected = { OUT_OF_TIME: 'timeUp', OFF_LINE: 'bump' }[reason] ?? 'gripFail';
    expect(lab.events.map((event) => event.type)).toEqual([expected]);
  });

  it('each action adds its cost exactly once', () => {
    const lab = clocked(100, {
      rules: { timeLimit: 100, costs: { forward: 3, turn: 5, grab: 7, release: 11 } },
    });
    lab.call('forward', 1);
    expect(lab.state.elapsed).toBe(3);
    lab.call('grab');
    expect(lab.state.elapsed).toBe(10);
    lab.call('turn', 'RIGHT');
    expect(lab.state.elapsed).toBe(15);
    lab.call('release');
    expect(lab.state.elapsed).toBe(26);
  });

  it('sensors take no time and change nothing', () => {
    const lab = clocked(5, {
      startHolding: { kind: 'neutralizer', color: 'RED' },
      map: board('#####/L..r./#####'),
    });
    const before = snapshot(lab.state);
    for (const name of ['lineAhead', 'atLab', 'holding']) lab.call(name);
    lab.call('blockColor', 'RED');
    expect(snapshot(lab.state)).toEqual(before);
    expect(lab.events.map((event) => event.type)).toEqual(['sense', 'sense', 'sense', 'sense']);
  });

  it('a loop with actions in its body runs out of time before TIMEOUT', () => {
    const outcome = run({ map: CORRIDOR, startDir: 'E', goal: goHome }, [
      until(holding(), [left()]),
    ]);
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'OUT_OF_TIME' });
    expect(actions(outcome).at(-1)).toMatchObject({ type: 'timeUp', at: [1, 0], t: 120 });
  });

  it('a loop of questions only ends with the engine TIMEOUT', () => {
    const config = { map: CORRIDOR, startDir: 'E', goal: goHome } as const;
    const outcome = run(config, [until(holding(), [])]);
    expect(outcome).toMatchObject({ result: 'timeout', reasonCode: 'TIMEOUT' });
    expect(predict(config, [until(holding(), [])])).toBe('timeout');
  });
});

describe('robotlab sensors', () => {
  /** Sense answers of `chain` on a config, in order. */
  function senses(config: unknown, chain: object[]): boolean[] {
    return run(config, chain).events.flatMap((event) =>
      event.type === 'sense' ? [event.value] : [],
    );
  }

  it('lineAhead: ✔ on a crossing even with a block, ✘ at a house or the map edge', () => {
    const at = (startDir: 'N' | 'E' | 'S' | 'W') => ({
      map: board('#.#/L../###'),
      startDir,
      start: [1, 2],
      blocks: [{ kind: 'fence', at: [1, 1] }],
      goal: goHome,
    });
    const ask = [ifElse(lineAhead(), [], [])];
    expect(senses(at('E'), ask)).toEqual([false]); // map edge
    expect(senses(at('W'), ask)).toEqual([true]); // a block ahead still has line
    expect(senses(at('S'), ask)).toEqual([false]); // house
    expect(senses(at('N'), ask)).toEqual([false]); // house
  });

  it('blockColor reads the held block first, else the block on its crossing; fences are ✘', () => {
    const asks = ['RED', 'YELLOW', 'GREEN'].map((color) => ifElse(colorIs(color), [], []));
    const base = { map: board('#####/L.r.y/#####'), startDir: 'E', goal: goHome } as const;
    expect(senses({ ...base, startHolding: { kind: 'neutralizer', color: 'RED' } }, asks)).toEqual([
      true,
      false,
      false,
    ]);
    expect(
      senses({ ...base, blocks: [{ kind: 'pollution', color: 'YELLOW', at: [1, 1] }] }, [
        forward(1),
        ...asks,
      ]),
    ).toEqual([false, true, false]);
    expect(
      senses({ ...base, startHolding: { kind: 'fence' }, map: board('#####/L.r.y/##Z##') }, asks),
    ).toEqual([false, false, false]);
    // Nothing held, nothing here.
    expect(
      senses({ ...base, blocks: [{ kind: 'pollution', color: 'RED', at: [1, 3] }] }, asks),
    ).toEqual([false, false, false]);
  });

  it('atLab is ✔ at the start in the lab, so "lặp đến khi đã về phòng" runs 0 passes', () => {
    const outcome = run({ map: CORRIDOR, startDir: 'E', goal: goHome }, [
      until(atLab(), [forward(1)]),
    ]);
    expect(outcome.result).toBe('success');
    expect(types(outcome)).toEqual([]);
    expect(outcome.events.filter((event) => event.type === 'sense')).toHaveLength(1);
  });

  it('holding follows the gripper', () => {
    const config = {
      map: CORRIDOR,
      startDir: 'E',
      blocks: [{ kind: 'pollution', color: 'RED', at: [1, 1] }],
      goal: { type: 'missions' },
    } as const;
    const ask = (): object => ifElse(holding(), [], []);
    expect(
      senses(config, [
        ask(),
        forward(1),
        grab(),
        ask(),
        right(),
        right(),
        forward(1),
        release(),
        ask(),
      ]),
    ).toEqual([false, true, false]);
  });
});

describe('robotlab evaluate and predict', () => {
  const twoJobs = {
    map: board('#####/LZ.../#####'),
    startDir: 'E',
    blocks: [{ kind: 'fence', at: [1, 3] }],
    goal: goHome,
  } as const;

  it('missions: MISSIONS_LEFT is checked before NOT_HOME', () => {
    const outcome = run(twoJobs, prog('f2'));
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'MISSIONS_LEFT' });
    expect(predict(twoJobs, prog('f2'))).toBe('stop@1,2');
  });

  it('W6 l08: the job done but not home → NOT_HOME; one more forward wins', () => {
    const original = prog('f3 G R R f2 D');
    expect(run(twoJobs, original)).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_HOME' });
    expect(predict(twoJobs, original)).toBe('stop@1,1');
    expect(run(twoJobs, prog('f3 G R R f2 D f1')).result).toBe('success');
    expect(predict(twoJobs, prog('f3 G R R f2 D f1'))).toBe('win');
    // The other fix: dropping the fence in the lab.
    expect(run(twoJobs, prog('f3 G R R f3 D'))).toMatchObject({
      result: 'crash',
      reasonCode: 'WRONG_PLACE',
    });
  });

  it('without mustReturn the robot may end anywhere', () => {
    expect(run({ ...twoJobs, goal: { type: 'missions' } }, prog('f3 G R R f2 D')).result).toBe(
      'success',
    );
  });

  it('never wins mid-program: in the lab, then driving on → NOT_HOME', () => {
    const config = { map: CORRIDOR, startDir: 'W', start: [1, 4], goal: goHome } as const;
    const outcome = run(config, prog('f4 R R f1'));
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_HOME' });
    expect(predict(config, prog('f4 R R f1'))).toBe('stop@1,1');
  });

  it('a held pollution block in the lab is not retrieved', () => {
    const config = {
      map: CORRIDOR,
      startDir: 'E',
      blocks: [{ kind: 'pollution', color: 'RED', at: [1, 3] }],
      goal: goHome,
    } as const;
    expect(run(config, prog('f3 G R R f3'))).toMatchObject({ reasonCode: 'MISSIONS_LEFT' });
    expect(run(config, prog('f3 G R R f3 D')).result).toBe('success');
  });

  const scoreBoard = (target: number, timeLimit = 120) =>
    ({
      map: board('#####/L...r/#####'),
      startDir: 'E',
      blocks: [{ kind: 'neutralizer', color: 'RED', at: [1, 2] }],
      goal: { type: 'score', target },
      rules: { timeLimit },
    }) as const;

  it('score at the end: success at the target, LOW_SCORE below; no MISSIONS_LEFT / NOT_HOME', () => {
    const chain = prog('f2 G f2 D R R f4');
    expect(run(scoreBoard(200), chain).result).toBe('success');
    expect(predict(scoreBoard(200), chain)).toBe('score:200');
    expect(run(scoreBoard(201), chain)).toMatchObject({
      result: 'incomplete',
      reasonCode: 'LOW_SCORE',
    });
    expect(predict(scoreBoard(201), chain)).toBe('score:200');
    expect(run(scoreBoard(100), prog('f1'))).toMatchObject({ reasonCode: 'LOW_SCORE' });
    expect(predict(scoreBoard(100), prog('f1'))).toBe('score:0');
  });

  it('score at time-up is judged at once: success when the target is met', () => {
    const chain = prog('f2 G f2 D R R f4');
    const met = run(scoreBoard(160, 14), chain);
    expect(met.result).toBe('success');
    expect(actions(met).at(-1)).toEqual({ type: 'timeUp', blockId: 'p6', at: [1, 4], t: 14 });
    expect(run(scoreBoard(200, 14), chain)).toMatchObject({ reasonCode: 'LOW_SCORE' });
  });

  it('score levels crash like any other, with the crash key', () => {
    expect(run(scoreBoard(100), prog('R f1'))).toMatchObject({
      result: 'crash',
      reasonCode: 'OFF_LINE',
    });
    expect(predict(scoreBoard(100), prog('R f1'))).toBe('crash:OFF_LINE@1,0');
    expect(predict(scoreBoard(100), [until(holding(), [])])).toBe('timeout');
  });

  it('runs the same event log twice (deterministic)', () => {
    const config = {
      map: board('##Z##/r.L../##.##'),
      startDir: 'W',
      blocks: [
        { kind: 'neutralizer', color: 'RED', at: [1, 1] },
        { kind: 'pollution', color: 'RED', at: [1, 4] },
        { kind: 'fence', at: [2, 2] },
      ],
      goal: { type: 'score', target: 300 },
      rules: { timeLimit: 30 },
    } as const;
    const chain = prog('f1 G f1 D R R f4 G R R f2 D');
    expect(run(config, chain)).toEqual(run(config, chain));
  });
});

describe('robotlab: curriculum.md §6.1 hand-worked examples', () => {
  it('l01: tiến 4 home', () => {
    expect(
      run({ map: CORRIDOR, startDir: 'W', start: [1, 4], goal: goHome }, prog('f4')).result,
    ).toBe('success');
  });

  it('l02: tiến 4 from 1,5 stops just before the lab', () => {
    const config = {
      map: board('######/L...../######'),
      startDir: 'W',
      start: [1, 5],
      goal: goHome,
    } as const;
    expect(predict(config, prog('f4'))).toBe('stop@1,1');
  });

  it('l03: turning is not driving', () => {
    const config = {
      map: board('#L##/#.##/#...'),
      startDir: 'W',
      start: [2, 3],
      goal: goHome,
    } as const;
    expect(run(config, prog('f2 R f2')).result).toBe('success');
    expect(predict(config, prog('f2 R f1'))).toBe('stop@1,1');
  });

  it('l04: two turns; swapping them → OFF_LINE@2,2', () => {
    const config = {
      map: board('L..##/##.##/##...'),
      startDir: 'W',
      start: [2, 4],
      goal: goHome,
    } as const;
    expect(run(config, prog('f2 R f2 L f2')).result).toBe('success');
    expect(predict(config, prog('f2 L f2 R f2'))).toBe('crash:OFF_LINE@2,2');
  });

  it('l05: stop on the fence, grab, home holding it', () => {
    const config = {
      map: CORRIDOR,
      startDir: 'W',
      start: [1, 4],
      blocks: [{ kind: 'fence', at: [1, 2] }],
      goal: goHome,
    } as const;
    expect(run(config, prog('f2 G f2')).result).toBe('success');
  });

  it('l06: retrieve pollution in the lab; dropping early or forgetting → MISSIONS_LEFT', () => {
    const config = {
      map: CORRIDOR,
      startDir: 'E',
      blocks: [{ kind: 'pollution', color: 'RED', at: [1, 3] }],
      goal: { type: 'missions' },
    } as const;
    expect(run(config, prog('f3 G R R f3 D')).result).toBe('success');
    expect(run(config, prog('f3 G D'))).toMatchObject({ reasonCode: 'MISSIONS_LEFT' });
    expect(run(config, prog('f3 G R R f3'))).toMatchObject({ reasonCode: 'MISSIONS_LEFT' });
  });

  it('l07: fence on the zone; dropping beside it → MISSIONS_LEFT; tiến 3 → HIT_BLOCK@1,1', () => {
    const config = {
      map: board('###Z#/L..../#####'),
      startDir: 'E',
      blocks: [{ kind: 'fence', at: [1, 2] }],
      goal: { type: 'missions' },
    } as const;
    expect(run(config, prog('f2 G f1 L f1 D')).result).toBe('success');
    expect(run(config, prog('f2 G f1 D'))).toMatchObject({ reasonCode: 'MISSIONS_LEFT' });
    expect(predict(config, prog('f3'))).toBe('crash:HIT_BLOCK@1,1');
  });

  it('l09: neutralize red past the empty station; yellow station → WRONG_COLOR@1,4', () => {
    const config = {
      map: board('#####/L.r.y/#####'),
      startDir: 'E',
      blocks: [{ kind: 'neutralizer', color: 'RED', at: [1, 3] }],
      goal: goHome,
    } as const;
    expect(run(config, prog('f3 G R R f1 D f2')).result).toBe('success');
    expect(predict(config, prog('f3 G f1 D'))).toBe('crash:WRONG_COLOR@1,4');
  });

  it('l10: one gripper, two blocks; release outside the loop → HIT_BLOCK@1,1', () => {
    const config = {
      map: board('###/.L./###'),
      startDir: 'E',
      blocks: [
        { kind: 'pollution', color: 'RED', at: [1, 2] },
        { kind: 'pollution', color: 'RED', at: [1, 0] },
      ],
      goal: goHome,
    } as const;
    expect(run(config, [repeat(2, prog('f1 G R R f1 D'))]).result).toBe('success');
    expect(predict(config, [repeat(2, prog('f1 G R R f1')), release()])).toBe(
      'crash:HIT_BLOCK@1,1',
    );
  });

  it('l11: time-up at the station with 160 points', () => {
    const config = {
      map: board('#####/L...r/#####'),
      startDir: 'E',
      blocks: [{ kind: 'neutralizer', color: 'RED', at: [1, 2] }],
      goal: { type: 'score', target: 200 },
      rules: { timeLimit: 14 },
    } as const;
    const chain = prog('f2 G f2 D R R f4');
    const outcome = run(config, chain);
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'LOW_SCORE' });
    expect(actions(outcome).map((event) => ('t' in event ? event.t : null))).toEqual([
      2, 4, 6, 8, 10, 12, 13, 14, 14,
    ]);
    expect(predict(config, chain)).toBe('score:160');
  });

  const l12 = {
    map: board('##r##/Z#.##/..L##'),
    startDir: 'N',
    blocks: [
      { kind: 'neutralizer', color: 'RED', at: [1, 2] },
      { kind: 'fence', at: [2, 0] },
    ],
    goal: { type: 'score', target: 200 },
    rules: { timeLimit: 20 },
  } as const;

  it('l12: neutralize + home = 200 in 14 s; containing + home = 85', () => {
    const outcome = run(l12, prog('f1 G f1 D R R f2'));
    expect(outcome.result).toBe('success');
    expect(actions(outcome).at(-1)).toMatchObject({ t: 14 });
    expect(predict(l12, prog('f1 G f1 D R R f2'))).toBe('score:200');
    // Contain + home instead: 45 + 40 in 21 s (one second too many for this level).
    expect(predict({ ...l12, rules: { timeLimit: 60 } }, prog('L f2 G R f1 D R R f1 L f2'))).toBe(
      'score:85',
    );
  });

  it('l13: forgot to come home: 160 → LOW_SCORE; adding tiến 2 → 200', () => {
    const config = {
      map: board('#####/L.y../#####'),
      startDir: 'E',
      blocks: [{ kind: 'neutralizer', color: 'YELLOW', at: [1, 3] }],
      goal: { type: 'score', target: 200 },
      rules: { timeLimit: 20 },
    } as const;
    expect(run(config, prog('f3 G R R f1 D'))).toMatchObject({ reasonCode: 'LOW_SCORE' });
    const fixed = run(config, prog('f3 G R R f1 D f2'));
    expect(fixed.result).toBe('success');
    expect(actions(fixed).at(-1)).toMatchObject({ t: 18 });
  });

  it('l14: lặp đến khi đã về phòng wins both maps; tiến 6 overshoots map 2', () => {
    const map1 = {
      map: board('#######/L....../#######'),
      startDir: 'W',
      start: [1, 6],
      goal: goHome,
    } as const;
    const map2 = {
      map: board('####/L.../####'),
      startDir: 'W',
      start: [1, 3],
      goal: goHome,
    } as const;
    const loop = [until(atLab(), [forward(1)])];
    const both = run(map1, loop, { variants: [resolvedFixture(map2)] });
    expect(both.result).toBe('success');
    expect(both.maps).toHaveLength(2);
    const six = run(map1, prog('f6'), { variants: [resolvedFixture(map2)] });
    expect(six).toMatchObject({ result: 'crash', reasonCode: 'OFF_LINE', mapIndex: 1 });
  });

  it('l15: line following; swapped branches → OFF_LINE@2,1', () => {
    const config = {
      map: board('L.../###./#...'),
      startDir: 'E',
      start: [2, 1],
      goal: goHome,
    } as const;
    const follow = [until(atLab(), [ifElse(lineAhead(), [forward(1)], [left()])])];
    expect(run(config, follow).result).toBe('success');
    const swapped = [until(atLab(), [ifElse(lineAhead(), [left()], [forward(1)])])];
    expect(predict(config, swapped)).toBe('crash:OFF_LINE@2,1');
  });

  const l16 = (color: 'RED' | 'YELLOW') =>
    ({
      map: board('#####/r.L.y/#####'),
      startDir: 'N',
      startHolding: { kind: 'neutralizer', color },
      goal: goHome,
    }) as const;

  it('l16: one program for both colours; l17 swapped branches → WRONG_COLOR@1,4', () => {
    const solution = [ifElse(colorIs('RED'), [left()], [right()]), ...prog('f2 D R R f2')];
    const both = run(l16('RED'), solution, { variants: [resolvedFixture(l16('YELLOW'))] });
    expect(both.result).toBe('success');
    const swapped = [ifElse(colorIs('RED'), [right()], [left()]), ...prog('f2 D R R f2')];
    const bug = run(l16('RED'), swapped, { variants: [resolvedFixture(l16('YELLOW'))] });
    expect(bug).toMatchObject({ result: 'crash', reasonCode: 'WRONG_COLOR', mapIndex: 0 });
    expect(predict(l16('RED'), swapped)).toBe('crash:WRONG_COLOR@1,4');
  });

  it('l18: doing every job runs out at the fence: score:160', () => {
    const chain = prog('f1 G f1 D R R f2 R f2 G R f1 D R R f1 L f2');
    expect(predict(l12, chain)).toBe('score:160');
    const outcome = run(l12, chain);
    expect(actions(outcome).at(-1)).toEqual({
      type: 'timeUp',
      blockId: 'p9',
      at: [2, 0],
      t: 19,
    });
  });

  it('l19: full round on both colours: 300 in 31 s', () => {
    const l19 = (color: 'RED' | 'YELLOW') =>
      ({
        map: board('##.##/r.L.y/Z....'),
        startDir: 'N',
        blocks: [
          { kind: 'pollution', color: 'RED', at: [0, 2] },
          { kind: 'neutralizer', color, at: [2, 2] },
          { kind: 'fence', at: [2, 4] },
        ],
        goal: { type: 'score', target: 300 },
        rules: { timeLimit: 34 },
      }) as const;
    const chain = [
      ...prog('f1 G R R f1 D f1 G R R f1'),
      ifElse(colorIs('RED'), [left()], [right()]),
      ...prog('f2 D R R f2'),
    ];
    for (const color of ['RED', 'YELLOW'] as const) {
      const outcome = run(l19(color), chain);
      expect(outcome.result).toBe('success');
      expect(actions(outcome).at(-1)).toMatchObject({ t: 31 });
      expect(predict(l19(color), chain)).toBe('score:300');
    }
  });

  it('boss: neutralize + retrieve + home = 300 in 28 s; the other order in 30 s; the trap falls short', () => {
    const boss = {
      map: board('##Z##/r.L../##.##'),
      startDir: 'W',
      blocks: [
        { kind: 'neutralizer', color: 'RED', at: [1, 1] },
        { kind: 'pollution', color: 'RED', at: [1, 4] },
        { kind: 'fence', at: [2, 2] },
      ],
      goal: { type: 'score', target: 300 },
      rules: { timeLimit: 30 },
    } as const;
    const best = run(boss, prog('f1 G f1 D R R f4 G R R f2 D'));
    expect(best.result).toBe('success');
    expect(actions(best).at(-1)).toMatchObject({ t: 28 });
    const reversed = run(boss, prog('R R f2 G R R f2 D f1 G f1 D R R f2'));
    expect(reversed.result).toBe('success');
    expect(actions(reversed).at(-1)).toMatchObject({ t: 30 });
    // "Do every job": neutralize, then contain; time is up in the zone before going home.
    const trap = prog('f1 G f1 D R R f2 R f1 G R R f2 D R R f1');
    expect(predict(boss, trap)).toBe('score:205');
    expect(actions(run(boss, trap)).at(-1)).toMatchObject({ type: 'timeUp', at: [0, 2], t: 29 });
  });
});

describe('robotlab: review follow-ups (P3-01b)', () => {
  it('score: a re-grabbed neutralizer no longer counts when the time runs out', () => {
    const config = {
      map: board('#####/L.r../#####'),
      startDir: 'E',
      blocks: [{ kind: 'neutralizer', color: 'RED', at: [1, 1] }],
      goal: { type: 'score', target: 160 },
      rules: { timeLimit: 14 },
    } as const;
    // Neutralized at 8 s (160), grabbed again at 10 s (0), four turns to 14 s, then time is up.
    const chain = prog('f1 G f1 D G R R R R R');
    const outcome = run(config, chain);
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'LOW_SCORE' });
    expect(actions(outcome).at(-1)).toMatchObject({ type: 'timeUp', t: 14 });
    expect(predict(config, chain)).toBe('score:0');
  });

  it('missions: every job done, then out of time on a later action is not a win', () => {
    const config = {
      map: CORRIDOR,
      startDir: 'E',
      blocks: [{ kind: 'pollution', color: 'RED', at: [1, 1] }],
      goal: { type: 'missions' },
      rules: { timeLimit: 12 },
    } as const;
    // Retrieved at 10 s; two turns to 12 s; the third turn would end at 13 s.
    const chain = prog('f1 G R R f1 D R R R');
    expect(run(config, chain)).toMatchObject({ result: 'incomplete', reasonCode: 'OUT_OF_TIME' });
    expect(predict(config, chain)).toBe('outOfTime@1,0');
  });

  it('a turn-only loop runs out of time unless the time limit outlasts maxActions', () => {
    const spin = [until(atLab(), [left()])];
    const config = (timeLimit: number) => ({
      map: CORRIDOR,
      startDir: 'W',
      start: [1, 4],
      goal: goHome,
      rules: { timeLimit },
    });
    // 300 turns + 301 questions fit in the engine's 1000 actions: the clock stops Bíp.
    expect(run(config(300), spin)).toMatchObject({
      result: 'incomplete',
      reasonCode: 'OUT_OF_TIME',
    });
    // 600 turns + 601 questions do not: TIMEOUT comes first (content:check rule 1 reports it).
    expect(run(config(600), spin)).toMatchObject({ result: 'timeout', reasonCode: 'TIMEOUT' });
  });
});
