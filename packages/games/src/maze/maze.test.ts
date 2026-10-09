import type { Level, WorkspaceJson } from '@codequest/content-schema';
import {
  compileProgram,
  registerBlockSpecs,
  runLevel,
  type RunOutcome,
  type SimContext,
} from '@codequest/engine';
import { describe, expect, it } from 'vitest';
import { getGameKind } from '../index';
import { maze, mazeConfigSchema, type MazeConfig, type MazeEvent, type MazeState } from './index';
import { createMazeApi } from './sim';
import { createMazeState } from './state';

/** Chains serialized blocks through `next`. */
function chainOf(chain: object[]): object | undefined {
  let next: object | undefined;
  for (const block of [...chain].reverse()) {
    next = next === undefined ? block : { ...block, next: { block: next } };
  }
  return next;
}

/** Builds a workspace whose `cq_start` is followed by `chain`. */
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

const forward = (id: string): object => ({ type: 'maze_forward', id });
const left = (id: string): object => ({ type: 'maze_turn_left', id });
const right = (id: string): object => ({ type: 'maze_turn_right', id });
const isPath = (id: string, dir: 'AHEAD' | 'LEFT' | 'RIGHT'): object => ({
  type: 'maze_is_path',
  id,
  fields: { DIR: dir },
});
const atGoal = (id: string): object => ({ type: 'maze_at_goal', id });
const repeat = (id: string, times: number, body: object[]): object => ({
  type: 'cq_repeat',
  id,
  fields: { TIMES: times },
  inputs: { DO: { block: chainOf(body) } },
});
const until = (id: string, condition: object, body: object[]): object => ({
  type: 'controls_whileUntil',
  id,
  fields: { MODE: 'UNTIL' },
  inputs: { BOOL: { block: condition }, DO: { block: chainOf(body) } },
});
const ifElse = (id: string, condition: object, then: object[], otherwise: object[]): object => ({
  type: 'controls_if',
  id,
  extraState: { hasElse: true },
  inputs: {
    IF0: { block: condition },
    DO0: { block: chainOf(then) },
    ELSE: { block: chainOf(otherwise) },
  },
});

/** An L-shaped corridor: east twice, then south twice to G. */
const L_MAP = ['#####', '#S..#', '###.#', '###G#', '#####'];
/** The corridor runs on past G, so walking "to the end" is not the goal. */
const PAST_GOAL = ['#####', 'S.G..', '#####'];
/** Bamboo behind G: with collectAll, G is an ordinary cell until the bamboo is picked up. */
const BEHIND_GOAL = ['#####', '#SGb#', '#####'];

function level(config: MazeConfig, overrides: Partial<Level> = {}): Level {
  return {
    id: 'w03-l01',
    worldId: 'w03-me-cung',
    stage: 'guided',
    kind: 'maze',
    mode: 'build',
    title: 'Mê cung',
    objective: 'Tới đích',
    learningGoal: 'Rẽ',
    toolbox: ['maze_forward', 'maze_turn_left', 'maze_turn_right'],
    hints: [],
    config,
    ...overrides,
  };
}

function run(config: MazeConfig, chain: object[]): RunOutcome<MazeEvent> {
  return runLevel({ kind: maze, level: level(config), workspace: program(chain) });
}

/** Game events without the engine's highlight and sense events. */
function actions(outcome: RunOutcome<MazeEvent>): MazeEvent[] {
  return outcome.events.filter(
    (event): event is MazeEvent => event.type !== 'highlight' && event.type !== 'sense',
  );
}

const L_SOLUTION = [forward('f1'), forward('f2'), right('r1'), forward('f3'), forward('f4')];

describe('maze config', () => {
  it('accepts valid maps', () => {
    expect(mazeConfigSchema.safeParse({ map: L_MAP, startDir: 'E' }).success).toBe(true);
    expect(
      mazeConfigSchema.safeParse({ map: BEHIND_GOAL, startDir: 'W', goal: { collectAll: true } })
        .success,
    ).toBe(true);
    expect(mazeConfigSchema.safeParse({ map: ['S..', '...', '..G'], startDir: 'N' }).success).toBe(
      true,
    );
    const big = [
      'S' + '.'.repeat(11),
      ...Array<string>(10).fill('.'.repeat(12)),
      '.'.repeat(11) + 'G',
    ];
    expect(mazeConfigSchema.safeParse({ map: big, startDir: 'S', goal: {} }).success).toBe(true);
  });

  it.each([
    ['no start', { map: ['...', '...', '..G'], startDir: 'E' }, 'map', 'exactly one "S"'],
    ['two starts', { map: ['S.S', '...', '..G'], startDir: 'E' }, 'map', 'exactly one "S"'],
    ['no goal', { map: ['S..', '...', '...'], startDir: 'E' }, 'map', 'exactly one "G"'],
    ['two goals', { map: ['S.G', '...', '..G'], startDir: 'E' }, 'map', 'exactly one "G"'],
    ['ragged rows', { map: ['S..', '....', '..G'], startDir: 'E' }, 'map.1', '3 columns'],
    ['unknown tile', { map: ['S..', '.x.', '..G'], startDir: 'E' }, 'map.1', 'unknown tile "x"'],
    ['too few rows', { map: ['S..', '..G'], startDir: 'E' }, 'map', ''],
    ['too few columns', { map: ['S.', '..', '.G'], startDir: 'E' }, 'map.0', '3–12 columns'],
    [
      'too many rows',
      { map: ['S..', ...Array<string>(11).fill('...'), '..G'], startDir: 'E' },
      'map',
      '',
    ],
    [
      'too many columns',
      { map: ['S' + '.'.repeat(12), '.'.repeat(13), '.'.repeat(12) + 'G'], startDir: 'E' },
      'map.0',
      '3–12 columns',
    ],
    ['bad startDir', { map: L_MAP, startDir: 'UP' }, 'startDir', ''],
    ['missing startDir', { map: L_MAP }, 'startDir', ''],
    ['unknown key', { map: L_MAP, startDir: 'E', start: [1, 1] }, '', 'start'],
    ['unknown goal key', { map: L_MAP, startDir: 'E', goal: { reach: true } }, 'goal', 'reach'],
    [
      'collectAll without bamboo',
      { map: L_MAP, startDir: 'E', goal: { collectAll: true } },
      'goal.collectAll',
      'at least one "b"',
    ],
  ])('rejects %s', (_name, config, path, message) => {
    const parsed = mazeConfigSchema.safeParse(config);
    expect(parsed.success).toBe(false);
    const issues = parsed.error?.issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    }));
    expect(issues).toContainEqual({ path, message: expect.stringContaining(message) as string });
  });
});

describe('maze rules', () => {
  const config: MazeConfig = { map: L_MAP, startDir: 'E' };

  it('wins along the L corridor with forward and a right turn', () => {
    const outcome = run(config, L_SOLUTION);
    expect(outcome.result).toBe('success');
    expect(outcome.reasonCode).toBeNull();
    expect(outcome.stats.blocksUsed).toBe(5);
    expect(actions(outcome)).toEqual([
      { type: 'move', from: [1, 1], to: [1, 2], dir: 'E', blockId: 'f1' },
      { type: 'move', from: [1, 2], to: [1, 3], dir: 'E', blockId: 'f2' },
      { type: 'turn', from: 'E', to: 'S', blockId: 'r1' },
      { type: 'move', from: [1, 3], to: [2, 3], dir: 'S', blockId: 'f3' },
      { type: 'move', from: [2, 3], to: [3, 3], dir: 'S', blockId: 'f4' },
      { type: 'win', at: [3, 3], blockId: 'f4' },
    ]);
  });

  it('highlights each block before its action', () => {
    const outcome = run(config, [forward('f1'), right('r1')]);
    expect(outcome.events.map((event) => `${event.type}:${String(event.blockId)}`)).toEqual([
      'highlight:start',
      'highlight:f1',
      'move:f1',
      'highlight:r1',
      'turn:r1',
    ]);
  });

  it('crashes with HIT_WALL when walking into a wall, bump first', () => {
    const outcome = run(config, [forward('f1'), forward('f2'), forward('f3'), forward('f4')]);
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'HIT_WALL' });
    expect(actions(outcome).slice(-2)).toEqual([
      { type: 'move', from: [1, 2], to: [1, 3], dir: 'E', blockId: 'f2' },
      { type: 'bump', at: [1, 3], dir: 'E', blockId: 'f3' },
    ]);
    expect(outcome.events.some((event) => event.blockId === 'f4')).toBe(false);
  });

  it.each([
    ['N', [0, 0]],
    ['W', [0, 0]],
  ] as const)('crashes with HIT_WALL when walking off the map edge (%s)', (dir, at) => {
    const outcome = run({ map: ['S..', '...', '..G'], startDir: dir }, [forward('f1')]);
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'HIT_WALL' });
    expect(actions(outcome)).toEqual([{ type: 'bump', at, dir, blockId: 'f1' }]);
  });

  it('crashes with HIT_WALL off the bottom and right edges too', () => {
    const corner: MazeConfig = { map: ['G..', '...', '..S'], startDir: 'S' };
    expect(run(corner, [forward('f1')]).reasonCode).toBe('HIT_WALL');
    expect(run({ ...corner, startDir: 'E' }, [forward('f1')]).reasonCode).toBe('HIT_WALL');
  });

  it('ends with NOT_AT_GOAL when the program stops elsewhere', () => {
    const outcome = run(config, [forward('f1')]);
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_AT_GOAL' });
    expect(actions(outcome)).toEqual([
      { type: 'move', from: [1, 1], to: [1, 2], dir: 'E', blockId: 'f1' },
    ]);
  });

  it('wins the moment Măng reaches G and runs no further blocks', () => {
    const outcome = run({ map: PAST_GOAL, startDir: 'E' }, [
      forward('f1'),
      forward('f2'),
      forward('f3'),
      forward('f4'),
    ]);
    expect(outcome.result).toBe('success');
    expect(actions(outcome)).toEqual([
      { type: 'move', from: [1, 0], to: [1, 1], dir: 'E', blockId: 'f1' },
      { type: 'move', from: [1, 1], to: [1, 2], dir: 'E', blockId: 'f2' },
      { type: 'win', at: [1, 2], blockId: 'f2' },
    ]);
    expect(outcome.events.some((event) => event.blockId === 'f3')).toBe(false);
  });

  it('walks over S again like any path cell', () => {
    const outcome = run({ map: PAST_GOAL, startDir: 'E' }, [
      forward('f1'),
      left('l1'),
      left('l2'),
      forward('f2'),
    ]);
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_AT_GOAL' });
    expect(actions(outcome).at(-1)).toEqual({
      type: 'move',
      from: [1, 1],
      to: [1, 0],
      dir: 'W',
      blockId: 'f2',
    });
  });

  it('starts on S facing startDir', () => {
    const outcome = run({ map: ['#G#', '#.#', '#S#'], startDir: 'N' }, [
      forward('f1'),
      forward('f2'),
    ]);
    expect(outcome.result).toBe('success');
    expect(actions(outcome)[0]).toEqual({
      type: 'move',
      from: [2, 1],
      to: [1, 1],
      dir: 'N',
      blockId: 'f1',
    });
  });
});

describe('maze turning', () => {
  const config: MazeConfig = { map: ['S..', '...', '..G'], startDir: 'N' };

  it('turns left counter-clockwise and right clockwise, 90° each', () => {
    const turns = (chain: object[]): string[] =>
      actions(run(config, chain)).map((event) =>
        event.type === 'turn' ? `${event.from}>${event.to}` : event.type,
      );
    expect(turns([left('a'), left('b'), left('c'), left('d')])).toEqual([
      'N>W',
      'W>S',
      'S>E',
      'E>N',
    ]);
    expect(turns([right('a'), right('b'), right('c'), right('d')])).toEqual([
      'N>E',
      'E>S',
      'S>W',
      'W>N',
    ]);
  });

  it('moves in the new direction after a turn', () => {
    const outcome = run(config, [right('r1'), forward('f1'), right('r2'), forward('f2')]);
    expect(actions(outcome)).toContainEqual({
      type: 'move',
      from: [0, 1],
      to: [1, 1],
      dir: 'S',
      blockId: 'f2',
    });
  });

  it('turning on the spot never moves or crashes', () => {
    const outcome = run(config, [repeat('r', 6, [left('l')])]);
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_AT_GOAL' });
    expect(actions(outcome).every((event) => event.type === 'turn')).toBe(true);
  });
});

describe('maze bamboo and collectAll', () => {
  const collectAll: MazeConfig = { map: BEHIND_GOAL, startDir: 'E', goal: { collectAll: true } };

  it('passes over G while bamboo is left, then wins on returning with it', () => {
    const outcome = run(collectAll, [
      forward('f1'),
      forward('f2'),
      left('l1'),
      left('l2'),
      forward('f3'),
    ]);
    expect(outcome.result).toBe('success');
    expect(actions(outcome)).toEqual([
      { type: 'move', from: [1, 1], to: [1, 2], dir: 'E', blockId: 'f1' },
      { type: 'move', from: [1, 2], to: [1, 3], dir: 'E', blockId: 'f2' },
      { type: 'collect', at: [1, 3], blockId: 'f2' },
      { type: 'turn', from: 'E', to: 'N', blockId: 'l1' },
      { type: 'turn', from: 'N', to: 'W', blockId: 'l2' },
      { type: 'move', from: [1, 3], to: [1, 2], dir: 'W', blockId: 'f3' },
      { type: 'win', at: [1, 2], blockId: 'f3' },
    ]);
  });

  it('ends with MISSED_ITEMS when the program stops on G with bamboo left', () => {
    const outcome = run(collectAll, [forward('f1')]);
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'MISSED_ITEMS' });
    expect(actions(outcome)).toEqual([
      { type: 'move', from: [1, 1], to: [1, 2], dir: 'E', blockId: 'f1' },
    ]);
  });

  it('ends with NOT_AT_GOAL (not MISSED_ITEMS) off G even with bamboo left', () => {
    const outcome = run(collectAll, [forward('f1'), forward('f2')]);
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_AT_GOAL' });
  });

  it('collects each bamboo once, even when walking over it again', () => {
    const map = ['#####', '#Sb.#', '###G#'];
    const outcome = run({ map, startDir: 'E', goal: { collectAll: true } }, [
      forward('f1'),
      forward('f2'),
      left('l1'),
      left('l2'),
      forward('f3'),
    ]);
    expect(actions(outcome).filter((event) => event.type === 'collect')).toEqual([
      { type: 'collect', at: [1, 2], blockId: 'f1' },
    ]);
  });

  describe('with two bamboo shoots, one on each side of G', () => {
    const two: MazeConfig = {
      map: ['#######', '#SbGb.#', '#######'],
      startDir: 'E',
      goal: { collectAll: true },
    };
    const types = (outcome: RunOutcome<MazeEvent>): string[] =>
      actions(outcome).map((event) => event.type);

    it('does not win on G with only one collected, and walks on past it', () => {
      const outcome = run(two, [forward('f1'), forward('f2'), forward('f3'), forward('f4')]);
      expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_AT_GOAL' });
      expect(types(outcome)).toEqual(['move', 'collect', 'move', 'move', 'collect', 'move']);
    });

    it('ends with MISSED_ITEMS on G with one of two collected', () => {
      const outcome = run(two, [forward('f1'), forward('f2')]);
      expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'MISSED_ITEMS' });
      expect(types(outcome)).toEqual(['move', 'collect', 'move']);
    });

    it('wins on returning to G once both are collected', () => {
      const outcome = run(two, [
        forward('f1'),
        forward('f2'),
        forward('f3'),
        right('r1'),
        right('r2'),
        forward('f4'),
        forward('f5'),
      ]);
      expect(outcome.result).toBe('success');
      expect(actions(outcome).slice(-2)).toEqual([
        { type: 'move', from: [1, 4], to: [1, 3], dir: 'W', blockId: 'f4' },
        { type: 'win', at: [1, 3], blockId: 'f4' },
      ]);
      expect(outcome.events.some((event) => event.blockId === 'f5')).toBe(false);
    });
  });

  it('without collectAll, bamboo is still collected but G wins at once', () => {
    const outcome = run({ map: ['#####', '#bSG#', '#####'], startDir: 'W' }, [
      forward('f1'),
      left('l1'),
      left('l2'),
      forward('f2'),
      forward('f3'),
    ]);
    expect(outcome.result).toBe('success');
    expect(actions(outcome).map((event) => event.type)).toEqual([
      'move',
      'collect',
      'turn',
      'turn',
      'move',
      'move',
      'win',
    ]);
    const skipped = run({ map: BEHIND_GOAL, startDir: 'E' }, [forward('f1'), forward('f2')]);
    expect(skipped.result).toBe('success');
    expect(actions(skipped).map((event) => event.type)).toEqual(['move', 'win']);
  });
});

describe('maze goal.items (P2-11c rescue / escort)', () => {
  /** Key behind G, like BEHIND_GOAL: Măng passes over G, takes the key, comes back. */
  const KEY_BEHIND: MazeConfig = {
    map: ['#####', '#SG.#', '#####'],
    startDir: 'E',
    goal: { items: [{ kind: 'key', at: [1, 3] }] },
  };
  const back = [forward('f1'), forward('f2'), left('l1'), left('l2'), forward('f3')];

  it('walks through G without the key, picks it up (collect with item), then wins on G', () => {
    const outcome = run(KEY_BEHIND, back);
    expect(outcome.result).toBe('success');
    expect(actions(outcome)).toEqual([
      { type: 'move', from: [1, 1], to: [1, 2], dir: 'E', blockId: 'f1' },
      { type: 'move', from: [1, 2], to: [1, 3], dir: 'E', blockId: 'f2' },
      { type: 'collect', at: [1, 3], item: 'key', blockId: 'f2' },
      { type: 'turn', from: 'E', to: 'N', blockId: 'l1' },
      { type: 'turn', from: 'N', to: 'W', blockId: 'l2' },
      { type: 'move', from: [1, 3], to: [1, 2], dir: 'W', blockId: 'f3' },
      { type: 'win', at: [1, 2], blockId: 'f3' },
    ]);
  });

  it('ends NEED_KEY / NEED_FRIEND only when the program stops on G without the item', () => {
    expect(run(KEY_BEHIND, [forward('f1')])).toMatchObject({
      result: 'incomplete',
      reasonCode: 'NEED_KEY',
    });
    const escort: MazeConfig = {
      ...KEY_BEHIND,
      goal: { items: [{ kind: 'friend', at: [1, 3] }] },
    };
    expect(run(escort, [forward('f1')]).reasonCode).toBe('NEED_FRIEND');
  });

  it('ends NOT_AT_GOAL off G, even with an item still missing', () => {
    const map = ['######', '#SG..#', '######'];
    const outcome = run({ map, startDir: 'E', goal: { items: [{ kind: 'key', at: [1, 4] }] } }, [
      forward('f1'),
      forward('f2'),
    ]);
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_AT_GOAL' });
  });

  it('checks items before collectAll bamboo, and answers missed@ in predict', () => {
    const config: MazeConfig = {
      map: ['######', '#SGb.#', '######'],
      startDir: 'E',
      goal: { collectAll: true, items: [{ kind: 'key', at: [1, 4] }] },
    };
    const outcome = runLevel({
      kind: maze,
      level: level(config, {
        mode: 'predict',
        initialWorkspace: program([forward('f1')]),
        predict: {
          options: [
            { key: 'win', label: 'Tới đích' },
            { key: 'missed@1,2', label: 'Thiếu' },
            { key: 'stop@1,1', label: 'Dừng' },
          ],
        },
      }),
      workspace: program([]),
    });
    expect(outcome).toMatchObject({ reasonCode: 'NEED_KEY', answerKey: 'missed@1,2' });
  });

  it.each<[string, unknown]>([
    ['a wall', [0, 0]],
    ['S', [1, 1]],
    ['G', [1, 2]],
    ['a bamboo cell', [1, 3]],
    ['outside the map', [5, 5]],
  ])('rejects an item on %s', (_, at) => {
    const config = {
      map: ['######', '#SGb.#', '######'],
      startDir: 'E',
      goal: { items: [{ kind: 'key', at }] },
    };
    expect(mazeConfigSchema.safeParse(config).success).toBe(false);
  });

  it('rejects two items on one cell and accepts distinct path cells', () => {
    const map = ['######', '#SG..#', '######'];
    const key = { kind: 'key', at: [1, 3] };
    expect(
      mazeConfigSchema.safeParse({
        map,
        startDir: 'E',
        goal: { items: [key, { kind: 'friend', at: [1, 3] }] },
      }).success,
    ).toBe(false);
    expect(
      mazeConfigSchema.safeParse({
        map,
        startDir: 'E',
        goal: { items: [key, { kind: 'friend', at: [1, 4] }] },
      }).success,
    ).toBe(true);
  });
});

describe('maze sensors', () => {
  it('follows the corridor with "until at goal: if path ahead forward, else turn"', () => {
    const outcome = run({ map: L_MAP, startDir: 'E' }, [
      until('u', atGoal('g'), [
        ifElse(
          'i',
          isPath('p', 'AHEAD'),
          [forward('f')],
          [ifElse('j', isPath('q', 'RIGHT'), [right('r')], [left('l')])],
        ),
      ]),
    ]);
    expect(outcome.result).toBe('success');
    expect(outcome.stats.blocksUsed).toBe(9);
    expect(actions(outcome).map((event) => event.type)).toEqual([
      'move',
      'move',
      'turn',
      'move',
      'move',
      'win',
    ]);
    expect(actions(outcome)[2]).toEqual({ type: 'turn', from: 'E', to: 'S', blockId: 'r' });
  });

  it('turns left when only the left is open', () => {
    // The L corridor mirrored: at its east end the only way on is to the left (north).
    const map = ['###G#', '###.#', '#S..#', '#####', '#####'];
    const outcome = run({ map, startDir: 'E' }, [
      until('u', atGoal('g'), [
        ifElse(
          'i',
          isPath('p', 'AHEAD'),
          [forward('f')],
          [ifElse('j', isPath('q', 'LEFT'), [left('l')], [right('r')])],
        ),
      ]),
    ]);
    expect(outcome.result).toBe('success');
    expect(actions(outcome)).toContainEqual({ type: 'turn', from: 'E', to: 'N', blockId: 'l' });
  });

  it('lets "until at goal" stop on G when bamboo is left (MISSED_ITEMS)', () => {
    const outcome = run({ map: BEHIND_GOAL, startDir: 'E', goal: { collectAll: true } }, [
      until('u', atGoal('g'), [forward('f')]),
    ]);
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'MISSED_ITEMS' });
    expect(actions(outcome)).toHaveLength(1);
  });

  it('bambooAhead: ✔ only for a shoot not picked up on the cell ahead (ADR-0022)', () => {
    const config = mazeConfigSchema.parse({ map: ['Sb.', '.#b', '..G'], startDir: 'E' });
    const state = createMazeState(config);
    const senses: boolean[] = [];
    const ctx: SimContext<MazeState, MazeEvent> = {
      state,
      emit: () => undefined,
      sense: (value) => {
        senses.push(value);
        return value;
      },
      stop: () => {
        throw new Error('stop');
      },
      rng: () => 0,
      level: level(config),
    };
    const api = createMazeApi(ctx);
    const ahead = (): unknown => api['bambooAhead']?.('q');
    expect(ahead()).toBe(true);
    state.dir = 'S'; // the open cell [1,0], no shoot
    expect(ahead()).toBe(false);
    state.dir = 'N'; // the map edge
    expect(ahead()).toBe(false);
    state.pos = [0, 2];
    state.dir = 'S'; // a shoot on [1,2]…
    expect(ahead()).toBe(true);
    state.collected.add('1,2'); // …already picked up
    expect(ahead()).toBe(false);
    state.pos = [1, 0];
    state.dir = 'E'; // the wall [1,1]
    expect(ahead()).toBe(false);
    expect(senses).toEqual([true, false, false, true, false, false]);
  });

  it('runs "nếu phía trước có măng?" as a question block with a tooltip', () => {
    const spec = maze.blocks.find((block) => block.type === 'maze_bamboo_ahead');
    expect(spec?.json.tooltip).toContain('măng chưa nhặt');
    const bambooAhead = { type: 'maze_bamboo_ahead', id: 'q' };
    const ifAhead = (id: string): object => ({
      type: 'cq_if',
      id,
      inputs: {
        COND: { block: { ...bambooAhead, id: `${id}q` } },
        DO: { block: forward(`${id}f`) },
      },
    });
    const outcome = run({ map: ['####', 'SbbG', '####'], startDir: 'E' }, [
      ifAhead('a'),
      ifAhead('b'),
      ifAhead('c'),
    ]);
    expect(outcome.result).toBe('incomplete');
    expect(
      outcome.events.filter((event) => event.type === 'sense').map((event) => event.value),
    ).toEqual([true, true, false]);
  });

  it('senses relative to the facing direction and the map edge', () => {
    // S at the top-left corner of an open 3×3 map: walls are the map edges only.
    const config = mazeConfigSchema.parse({ map: ['S..', '.#.', '..G'], startDir: 'N' });
    const state = createMazeState(config);
    const ctx: SimContext<MazeState, MazeEvent> = {
      state,
      emit: () => undefined,
      sense: (value) => value,
      stop: () => {
        throw new Error('stop');
      },
      rng: () => 0,
      level: level(config),
    };
    const api = createMazeApi(ctx);
    const sense = (): string =>
      (['AHEAD', 'LEFT', 'RIGHT'] as const)
        .map((dir) => `${dir}=${String(api['isPath']?.(dir, 'p'))}`)
        .join(' ');
    expect(sense()).toBe('AHEAD=false LEFT=false RIGHT=true');
    state.dir = 'E';
    expect(sense()).toBe('AHEAD=true LEFT=false RIGHT=true');
    state.dir = 'S';
    expect(sense()).toBe('AHEAD=true LEFT=true RIGHT=false');
    state.pos = [0, 1]; // facing S onto the wall at [1,1]
    expect(sense()).toBe('AHEAD=false LEFT=true RIGHT=true');
    expect(api['atGoal']?.('g')).toBe(false);
    state.pos = [2, 2];
    expect(api['atGoal']?.('g')).toBe(true);
    expect(() => api['isPath']?.('BACK', 'p')).toThrow('unknown direction');
    expect(() => api['turn']?.('AROUND', 't')).toThrow('unknown side');
  });
});

describe('maze predictAnswer', () => {
  function answer(config: MazeConfig, chain: object[]): string | undefined {
    return runLevel({
      kind: maze,
      level: level(config, {
        mode: 'predict',
        initialWorkspace: program(chain),
        predict: {
          options: [
            { key: 'win', label: 'Tới đích' },
            { key: 'stop@1,2', label: 'Dừng' },
            { key: 'crash:HIT_WALL@1,3', label: 'Đâm tường' },
          ],
        },
      }),
      workspace: program([]),
    }).answerKey;
  }
  const lMap: MazeConfig = { map: L_MAP, startDir: 'E' };
  const behind: MazeConfig = { map: BEHIND_GOAL, startDir: 'E', goal: { collectAll: true } };

  it.each([
    ['win', lMap, L_SOLUTION],
    ['stop@1,2', lMap, [forward('f1')]],
    ['stop@1,1', lMap, [right('r1')]],
    ['crash:HIT_WALL@1,3', lMap, [forward('f1'), forward('f2'), forward('f3')]],
    ['crash:HIT_WALL@1,1', lMap, [left('l1'), forward('f1')]],
    ['missed@1,2', behind, [forward('f1')]],
    ['stop@1,3', behind, [forward('f1'), forward('f2')]],
  ] as const)('answers %s', (key, config, chain) => {
    expect(answer(config, [...chain])).toBe(key);
  });

  it('falls back to the result name for timeouts and errors', () => {
    const state = createMazeState(mazeConfigSchema.parse(lMapConfig()));
    expect(maze.predictAnswer(state, { result: 'timeout', reasonCode: 'TIMEOUT' })).toBe('timeout');
    expect(maze.predictAnswer(state, { result: 'error', reasonCode: 'INTERNAL_ERROR' })).toBe(
      'error',
    );
    expect(maze.predictAnswer(state, { result: 'crash', reasonCode: null })).toBe(
      'crash:UNKNOWN@1,1',
    );
  });

  it('answers timeout for a loop that never ends', () => {
    const key = runLevel({
      kind: maze,
      level: level(lMapConfig(), {
        mode: 'predict',
        initialWorkspace: program([until('u', atGoal('g'), [left('l')])]),
        predict: { options: [{ key: 'win', label: 'Tới đích' }] },
      }),
      workspace: program([]),
    }).answerKey;
    expect(key).toBe('timeout');
  });

  function lMapConfig(): MazeConfig {
    return { map: L_MAP, startDir: 'E' };
  }
});

describe('maze evaluate', () => {
  it('judges where the program left Măng', () => {
    const config = mazeConfigSchema.parse({
      map: BEHIND_GOAL,
      startDir: 'E',
      goal: { collectAll: true },
    });
    const state = createMazeState(config);
    expect(maze.evaluate(state, config)).toEqual({ success: false, reasonCode: 'NOT_AT_GOAL' });
    state.pos = [1, 2];
    expect(maze.evaluate(state, config)).toEqual({ success: false, reasonCode: 'MISSED_ITEMS' });
    state.collected.add('1,3');
    expect(maze.evaluate(state, config)).toEqual({ success: true });
  });
});

describe('maze definition', () => {
  it('is registered under its id', () => {
    expect(getGameKind('maze')).toBe(maze);
    expect(maze.reasonCodes).toEqual([
      'HIT_WALL',
      'NOT_AT_GOAL',
      'MISSED_ITEMS',
      'NEED_KEY',
      'NEED_FRIEND',
    ]);
    expect(maze.blocks.map((spec) => spec.type)).toEqual([
      'maze_forward',
      'maze_turn_left',
      'maze_turn_right',
      'maze_is_path',
      'maze_at_goal',
      'maze_bamboo_ahead',
    ]);
  });

  it('gives every block the style of its category', () => {
    const styles = { move: 'move_blocks', sensor: 'sensor_blocks' } as const;
    for (const spec of maze.blocks) {
      expect(spec.category === 'move' || spec.category === 'sensor').toBe(true);
      expect(spec.json.style).toBe(styles[spec.category as keyof typeof styles]);
      expect(spec.category === 'sensor').toBe(spec.json.output === 'Boolean');
    }
  });

  it('generates API calls with safely quoted block ids', () => {
    registerBlockSpecs(maze.blocks);
    const code = compileProgram(
      program([forward("it's"), left('a\\b'), right('r'), until('u', isPath('p', 'LEFT'), [])]),
    );
    expect(code).toContain(`forward('it\\'s');`);
    expect(code).toContain(`turn('LEFT', 'a\\\\b');`);
    expect(code).toContain(`turn('RIGHT', 'r');`);
    expect(code).toContain(`isPath('LEFT', 'p')`);
    const goal = compileProgram(program([until('u', atGoal('g'), [])]));
    expect(goal).toContain(`atGoal('g')`);
  });

  it('runs blocks whose ids have quotes', () => {
    const outcome = run({ map: L_MAP, startDir: 'E' }, [forward("f'1"), forward('f"2')]);
    expect(actions(outcome).map((event) => event.blockId)).toEqual(["f'1", 'f"2']);
  });

  it('is deterministic', () => {
    const chain = [until('u', atGoal('g'), [forward('f')])];
    const config: MazeConfig = { map: L_MAP, startDir: 'E' };
    expect(run(config, chain)).toEqual(run(config, chain));
    expect(JSON.stringify(run(config, L_SOLUTION))).toBe(JSON.stringify(run(config, L_SOLUTION)));
  });

  it('keeps every event JSON-serializable', () => {
    const outcome = run({ map: BEHIND_GOAL, startDir: 'E', goal: { collectAll: true } }, [
      forward('f1'),
      forward('f2'),
      left('l1'),
      left('l2'),
      forward('f3'),
    ]);
    expect(JSON.parse(JSON.stringify(outcome.events))).toEqual(outcome.events);
  });
});

describe('maze star goals (P2-21)', () => {
  // Two ways to G: straight east (2 forwards) or down through the bamboo and back up.
  const FORK = ['######', '#S.G.#', '#b####', '######'];
  const goalRun = (chain: object[]): RunOutcome<MazeEvent> =>
    runLevel({
      kind: maze,
      level: level({ map: FORK, startDir: 'E' }, { starGoals: [{ kind: 'collectAll' }] }),
      workspace: program(chain),
    });

  it('wins without the bamboo but misses collectAll', () => {
    expect(goalRun([forward('a'), forward('b')])).toMatchObject({
      result: 'success',
      goals: [false],
    });
  });

  it('meets collectAll after the detour', () => {
    const detour = [
      right('a'),
      forward('b'),
      left('c'),
      left('d'),
      forward('e'),
      right('f'),
      forward('g'),
      forward('h'),
    ];
    expect(goalRun(detour)).toMatchObject({ result: 'success', goals: [true] });
  });

  it('meets collectAll on a map without bamboo', () => {
    const outcome = runLevel({
      kind: maze,
      level: level({ map: L_MAP, startDir: 'E' }, { starGoals: [{ kind: 'collectAll' }] }),
      workspace: program([forward('a'), forward('b'), right('c'), forward('d'), forward('e')]),
    });
    expect(outcome).toMatchObject({ result: 'success', goals: [true] });
  });
});
