import type { Level, WorkspaceJson } from '@codequest/content-schema';
import { compileProgram, registerBlockSpecs, runLevel, type RunOutcome } from '@codequest/engine';
import { describe, expect, it, vi } from 'vitest';
import { getGameKind } from '../index';
import {
  runner,
  runnerConfigSchema,
  type RunnerCell,
  type RunnerEvent,
  type RunnerState,
} from './index';
import { createRunnerState } from './state';

/** Builds a workspace whose `cq_start` is followed by `chain` (each item: a serialized block). */
function program(chain: object[]): WorkspaceJson {
  let next: object | undefined;
  for (const block of [...chain].reverse()) {
    next = next === undefined ? block : { ...block, next: { block: next } };
  }
  const start = {
    type: 'cq_start',
    id: 'start',
    deletable: false,
    ...(next !== undefined && { next: { block: next } }),
  };
  return { blocks: { languageVersion: 0, blocks: [start] } };
}

const walk = (id: string): object => ({ type: 'runner_walk', id });
const jump = (id: string): object => ({ type: 'runner_jump', id });
const repeat = (id: string, times: number, body: object): object => ({
  type: 'cq_repeat',
  id,
  fields: { TIMES: times },
  inputs: { DO: { block: body } },
});

/** w01-l03's track: the hole forces a jump between two walks. */
const L03: RunnerCell[] = ['ground', 'ground', 'hole', 'ground', 'flag'];

function level(cells: RunnerCell[], overrides: Partial<Level> = {}): Level {
  return {
    id: 'w01-l03',
    worldId: 'w01-lang-tre',
    stage: 'guided',
    kind: 'runner',
    mode: 'build',
    title: 'Nhảy qua hố',
    objective: 'Tới lá cờ',
    learningGoal: 'Tuần tự',
    toolbox: ['runner_walk', 'runner_jump'],
    hints: [],
    config: { cells, start: 0 },
    ...overrides,
  };
}

function run(cells: RunnerCell[], chain: object[]): RunOutcome<RunnerEvent> {
  return runLevel({ kind: runner, level: level(cells), workspace: program(chain) });
}

/** Game events without the engine's highlight and sense events. */
function actions(outcome: RunOutcome<RunnerEvent>): RunnerEvent[] {
  return outcome.events.filter(
    (event): event is RunnerEvent => event.type !== 'highlight' && event.type !== 'sense',
  );
}

describe('runner config', () => {
  it('accepts a valid track', () => {
    expect(runnerConfigSchema.safeParse({ cells: L03, start: 0 }).success).toBe(true);
    expect(runnerConfigSchema.safeParse({ cells: L03, start: 3 }).success).toBe(true);
  });

  it('accepts every cell kind, bamboo and a goal', () => {
    const config = {
      cells: ['ground', 'ground', 'branch', 'crate', 'hole', 'ground', 'flag'],
      start: 0,
      bamboo: [5, 1, 2],
      goal: { collectAll: true },
    };
    expect(runnerConfigSchema.parse(config)).toEqual(config);
    expect(runnerConfigSchema.safeParse({ ...config, goal: {} }).success).toBe(true);
    expect(runnerConfigSchema.safeParse({ ...config, bamboo: [], goal: {} }).success).toBe(true);
  });

  it('accepts the longest track, exactly 40 cells', () => {
    const cells: RunnerCell[] = [...Array<RunnerCell>(39).fill('ground'), 'flag'];
    expect(runnerConfigSchema.safeParse({ cells, start: 0 }).success).toBe(true);
  });

  it('points bamboo issues at the offending entry', () => {
    const parsed = runnerConfigSchema.safeParse({ cells: L03, start: 0, bamboo: [1, 2] });
    expect(parsed.error?.issues.map((issue) => issue.path)).toEqual([['bamboo', 1]]);
  });

  it.each([
    ['no flag', { cells: ['ground', 'ground', 'ground'], start: 0 }],
    ['flag not last', { cells: ['ground', 'flag', 'ground'], start: 0 }],
    ['two flags', { cells: ['ground', 'flag', 'flag'], start: 0 }],
    ['start on a hole', { cells: L03, start: 2 }],
    ['start off the track', { cells: L03, start: 9 }],
    ['too short', { cells: ['ground', 'flag'], start: 0 }],
    ['too long', { cells: [...Array<RunnerCell>(40).fill('ground'), 'flag'], start: 0 }],
    ['unknown cell', { cells: ['ground', 'lava', 'flag'], start: 0 }],
    ['unknown key', { cells: L03, start: 0, coins: [1] }],
    ['start on a branch', { cells: ['branch', 'ground', 'flag'], start: 0 }],
    ['bamboo on a hole', { cells: L03, start: 0, bamboo: [2] }],
    ['bamboo on a crate', { cells: ['ground', 'crate', 'flag'], start: 0, bamboo: [1] }],
    ['bamboo on the flag', { cells: L03, start: 0, bamboo: [4] }],
    ['bamboo off the track', { cells: L03, start: 0, bamboo: [7] }],
    ['bamboo on start', { cells: L03, start: 0, bamboo: [0] }],
    ['bamboo behind start', { cells: L03, start: 3, bamboo: [1] }],
    ['duplicate bamboo', { cells: L03, start: 0, bamboo: [1, 1] }],
    ['fractional bamboo', { cells: L03, start: 0, bamboo: [1.5] }],
    ['unknown goal key', { cells: L03, start: 0, goal: { collectAny: true } }],
    ['non-boolean collectAll', { cells: L03, start: 0, goal: { collectAll: 'yes' } }],
    ['collectAll without bamboo', { cells: L03, start: 0, goal: { collectAll: true } }],
    [
      'collectAll with empty bamboo',
      { cells: L03, start: 0, bamboo: [], goal: { collectAll: true } },
    ],
    ['negative start', { cells: L03, start: -1 }],
  ])('rejects %s', (_name, config) => {
    expect(runnerConfigSchema.safeParse(config).success).toBe(false);
  });
});

describe('runner rules', () => {
  it('wins with walk, jump, walk on w01-l03', () => {
    const outcome = run(L03, [walk('w1'), jump('j1'), walk('w2')]);
    expect(outcome.result).toBe('success');
    expect(outcome.reasonCode).toBeNull();
    expect(outcome.stats.blocksUsed).toBe(3);
    expect(actions(outcome)).toEqual([
      { type: 'walk', from: 0, to: 1, blockId: 'w1' },
      { type: 'jump', from: 1, to: 3, blockId: 'j1' },
      { type: 'walk', from: 3, to: 4, blockId: 'w2' },
      { type: 'win', at: 4, blockId: 'w2' },
    ]);
  });

  it('highlights each block before its action', () => {
    const outcome = run(L03, [walk('w1'), jump('j1'), walk('w2')]);
    expect(outcome.events.map((event) => `${event.type}:${String(event.blockId)}`)).toEqual([
      'highlight:start',
      'highlight:w1',
      'walk:w1',
      'highlight:j1',
      'jump:j1',
      'highlight:w2',
      'walk:w2',
      'win:w2',
    ]);
  });

  it('stops with FELL_IN_HOLE when walking into a hole', () => {
    const outcome = run(L03, [walk('w1'), walk('w2'), walk('w3')]);
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'FELL_IN_HOLE' });
    expect(actions(outcome)).toEqual([
      { type: 'walk', from: 0, to: 1, blockId: 'w1' },
      { type: 'walk', from: 1, to: 2, blockId: 'w2' },
      { type: 'fall', at: 2, blockId: 'w2' },
    ]);
  });

  it('stops with FELL_IN_HOLE when landing a jump in a hole', () => {
    const outcome = run(L03, [jump('j1')]);
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'FELL_IN_HOLE' });
    expect(actions(outcome)).toEqual([
      { type: 'jump', from: 0, to: 2, blockId: 'j1' },
      { type: 'fall', at: 2, blockId: 'j1' },
    ]);
  });

  it('stops with OFF_TRACK when a jump lands past the end', () => {
    const outcome = run(L03, [walk('w1'), jump('j1'), jump('j2')]);
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'OFF_TRACK' });
    expect(actions(outcome).slice(-1)).toEqual([{ type: 'offTrack', from: 3, blockId: 'j2' }]);
  });

  it('jumps over the flag (OFF_TRACK) instead of stopping on it', () => {
    const outcome = run(['ground', 'ground', 'flag'], [walk('w1'), jump('j1')]);
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'OFF_TRACK' });
    expect(actions(outcome)).toEqual([
      { type: 'walk', from: 0, to: 1, blockId: 'w1' },
      { type: 'offTrack', from: 1, blockId: 'j1' },
    ]);
  });

  it('wins when a jump lands on the flag', () => {
    const outcome = run(['ground', 'hole', 'flag'], [jump('j1')]);
    expect(outcome.result).toBe('success');
    expect(actions(outcome)).toEqual([
      { type: 'jump', from: 0, to: 2, blockId: 'j1' },
      { type: 'win', at: 2, blockId: 'j1' },
    ]);
  });

  it('ends with NOT_AT_GOAL when the program stops before the flag', () => {
    const outcome = run(L03, [walk('w1')]);
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_AT_GOAL' });
    expect(actions(outcome)).toEqual([{ type: 'walk', from: 0, to: 1, blockId: 'w1' }]);
  });

  it('stops running the program once Măng reaches the flag', () => {
    const outcome = run(['ground', 'ground', 'flag'], [walk('w1'), walk('w2'), walk('w3')]);
    expect(outcome.result).toBe('success');
    expect(actions(outcome).map((event) => event.blockId)).toEqual(['w1', 'w2', 'w2']);
  });

  it('starts from config.start', () => {
    const outcome = runLevel({
      kind: runner,
      level: level(L03, { config: { cells: L03, start: 3 } }),
      workspace: program([walk('w1')]),
    });
    expect(outcome.result).toBe('success');
    expect(actions(outcome)[0]).toEqual({ type: 'walk', from: 3, to: 4, blockId: 'w1' });
  });

  it('runs blocks inside cq_repeat', () => {
    const outcome = run(
      ['ground', 'ground', 'ground', 'ground', 'flag'],
      [repeat('r', 4, walk('w'))],
    );
    expect(outcome.result).toBe('success');
    expect(outcome.stats.blocksUsed).toBe(2);
    expect(actions(outcome).filter((event) => event.type === 'walk')).toHaveLength(4);
  });

  it('is deterministic', () => {
    const chain = [walk('w1'), jump('j1'), walk('w2')];
    expect(run(L03, chain)).toEqual(run(L03, chain));
    const crash = [walk('w1'), walk('w2')];
    expect(JSON.stringify(run(L03, crash))).toBe(JSON.stringify(run(L03, crash)));
  });

  it('keeps every event JSON-serializable', () => {
    const outcome = run(L03, [walk('w1'), jump('j1'), walk('w2')]);
    expect(JSON.parse(JSON.stringify(outcome.events))).toEqual(outcome.events);
  });

  it('evaluates a state standing on the flag as success', () => {
    const config = runnerConfigSchema.parse({ cells: L03, start: 0 });
    const state = createRunnerState(config);
    expect(runner.evaluate(state, config)).toEqual({ success: false, reasonCode: 'NOT_AT_GOAL' });
    state.pos = 4;
    expect(runner.evaluate(state, config)).toEqual({ success: true });
  });
});

describe('runner predictAnswer', () => {
  function answer(chain: object[]): string | undefined {
    return runLevel({
      kind: runner,
      level: level(L03, {
        mode: 'predict',
        initialWorkspace: program(chain),
        predict: {
          options: [
            { key: 'win', label: 'Tới cờ' },
            { key: 'stop@1', label: 'Dừng' },
            { key: 'crash:FELL_IN_HOLE@2', label: 'Rơi hố' },
          ],
        },
      }),
      workspace: program([]),
    }).answerKey;
  }

  it.each([
    ['win', [walk('w1'), jump('j1'), walk('w2')]],
    ['stop@1', [walk('w1')]],
    ['stop@3', [walk('w1'), jump('j1')]],
    ['crash:FELL_IN_HOLE@2', [walk('w1'), walk('w2')]],
    ['crash:FELL_IN_HOLE@2', [jump('j1')]],
    ['crash:OFF_TRACK@3', [walk('w1'), jump('j1'), jump('j2')]],
  ])('answers %s', (key, chain) => {
    expect(answer(chain)).toBe(key);
  });

  it('falls back to the result name for timeouts and errors', () => {
    const state = createRunnerState(runnerConfigSchema.parse({ cells: L03, start: 0 }));
    expect(runner.predictAnswer(state, { result: 'timeout', reasonCode: 'TIMEOUT' })).toBe(
      'timeout',
    );
    expect(runner.predictAnswer(state, { result: 'error', reasonCode: 'INTERNAL_ERROR' })).toBe(
      'error',
    );
    expect(runner.predictAnswer(state, { result: 'crash', reasonCode: null })).toBe(
      'crash:UNKNOWN@0',
    );
  });
});

describe('runner definition', () => {
  it('is registered under its id', () => {
    expect(getGameKind('runner')).toBe(runner);
    expect(runner.reasonCodes).toEqual([
      'FELL_IN_HOLE',
      'HIT_BRANCH',
      'HIT_CRATE',
      'OFF_TRACK',
      'NOT_AT_GOAL',
      'MISSED_ITEMS',
    ]);
    expect(runner.blocks.map((spec) => spec.type)).toEqual([
      'runner_walk',
      'runner_jump',
      'runner_crouch',
      'runner_kick',
      'runner_is_ahead',
      'runner_at_goal',
    ]);
  });

  it('has a Vietnamese feedback line for every reason code', async () => {
    // Loaded through Vite (no node:fs: headless packages are typed without Node globals).
    const feedback = await vi.importActual<Record<string, unknown>>(
      '../../../../content/shared/feedback.json',
    );
    expect(runner.reasonCodes.filter((code) => typeof feedback[code] !== 'string')).toEqual([]);
  });

  it('generates API calls with safely quoted block ids', () => {
    registerBlockSpecs(runner.blocks);
    const code = compileProgram(program([walk("it's"), jump('a\\b')]));
    expect(code).toContain(`walk('it\\'s');`);
    expect(code).toContain(`jump('a\\\\b');`);
  });

  it('runs a block whose id has quotes', () => {
    const outcome = run(L03, [walk("w'1"), jump('j"1'), walk('w\\2')]);
    expect(outcome.result).toBe('success');
    expect(actions(outcome)[0]?.blockId).toBe("w'1");
  });
});

// ---------------------------------------------------------------------------------------------
// Phase 1: branch / crate cells, crouch / kick / isAhead, bamboo and goal.collectAll.

const crouch = (id: string): object => ({ type: 'runner_crouch', id });
const kick = (id: string): object => ({ type: 'runner_kick', id });
const ahead = (id: string, kind: string): object => ({
  type: 'runner_is_ahead',
  id,
  fields: { KIND: kind },
});
/** `nếu <cond> thì <then> [không thì <otherwise>]` with Blockly's built-in controls_if. */
const ifElse = (id: string, cond: object, then: object, otherwise?: object): object => ({
  type: 'controls_if',
  id,
  ...(otherwise !== undefined && { extraState: { hasElse: true } }),
  inputs: {
    IF0: { block: cond },
    DO0: { block: then },
    ...(otherwise !== undefined && { ELSE: { block: otherwise } }),
  },
});

interface TrackConfig {
  cells: RunnerCell[];
  start?: number;
  bamboo?: number[];
  goal?: { collectAll?: boolean };
}

function runTrack(track: TrackConfig, chain: object[], mode: Level['mode'] = 'build') {
  const config = { start: 0, ...track };
  return runLevel({
    kind: runner,
    level: level(track.cells, {
      config,
      mode,
      ...(mode === 'predict' && {
        initialWorkspace: program(chain),
        predict: {
          options: [
            { key: 'win', label: 'Tới cờ' },
            { key: 'stop@1', label: 'Dừng' },
          ],
        },
      }),
    }),
    workspace: program(mode === 'predict' ? [] : chain),
  });
}

describe('runner rules: walk (t = p+1)', () => {
  it('moves onto ground and wins on the flag', () => {
    const outcome = runTrack({ cells: ['ground', 'ground', 'flag'] }, [walk('w1'), walk('w2')]);
    expect(outcome.result).toBe('success');
    expect(actions(outcome).at(-1)).toEqual({ type: 'win', at: 2, blockId: 'w2' });
  });

  it('crashes HIT_BRANCH into a branch and stays put', () => {
    const outcome = runTrack({ cells: ['ground', 'ground', 'branch', 'flag'] }, [
      walk('w1'),
      walk('w2'),
    ]);
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'HIT_BRANCH' });
    expect(actions(outcome)).toEqual([
      { type: 'walk', from: 0, to: 1, blockId: 'w1' },
      { type: 'bump', from: 1, at: 2, obstacle: 'branch', move: 'walk', blockId: 'w2' },
    ]);
  });

  it('crashes HIT_CRATE into a crate', () => {
    const outcome = runTrack({ cells: ['ground', 'crate', 'flag'] }, [walk('w1')]);
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'HIT_CRATE' });
    expect(actions(outcome)).toEqual([
      { type: 'bump', from: 0, at: 1, obstacle: 'crate', move: 'walk', blockId: 'w1' },
    ]);
  });
});

describe('runner rules: crouch (t = p+1)', () => {
  it('passes under a branch and wins on the flag', () => {
    const outcome = runTrack({ cells: ['ground', 'branch', 'flag'] }, [crouch('c1'), crouch('c2')]);
    expect(outcome.result).toBe('success');
    expect(actions(outcome)).toEqual([
      { type: 'crouch', from: 0, to: 1, blockId: 'c1' },
      { type: 'crouch', from: 1, to: 2, blockId: 'c2' },
      { type: 'win', at: 2, blockId: 'c2' },
    ]);
  });

  it('moves onto ground like a walk', () => {
    const outcome = runTrack({ cells: ['ground', 'ground', 'flag'] }, [crouch('c1')]);
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_AT_GOAL' });
    expect(actions(outcome)).toEqual([{ type: 'crouch', from: 0, to: 1, blockId: 'c1' }]);
  });

  it('crashes FELL_IN_HOLE into a hole', () => {
    const outcome = runTrack({ cells: ['ground', 'hole', 'flag'] }, [crouch('c1')]);
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'FELL_IN_HOLE' });
    expect(actions(outcome)).toEqual([
      { type: 'crouch', from: 0, to: 1, blockId: 'c1' },
      { type: 'fall', at: 1, blockId: 'c1' },
    ]);
  });

  it('crashes HIT_CRATE into a crate', () => {
    const outcome = runTrack({ cells: ['ground', 'crate', 'flag'] }, [crouch('c1')]);
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'HIT_CRATE' });
    expect(actions(outcome)).toEqual([
      { type: 'bump', from: 0, at: 1, obstacle: 'crate', move: 'crouch', blockId: 'c1' },
    ]);
  });
});

describe('runner rules: jump (over p+1, lands on t = p+2)', () => {
  it.each<[string, RunnerCell]>([
    ['ground', 'ground'],
    ['a hole', 'hole'],
  ])('flies over %s', (_name, over) => {
    const outcome = runTrack({ cells: ['ground', over, 'ground', 'flag'] }, [
      jump('j1'),
      walk('w1'),
    ]);
    expect(outcome.result).toBe('success');
    expect(actions(outcome)[0]).toEqual({ type: 'jump', from: 0, to: 2, blockId: 'j1' });
  });

  it('crashes HIT_BRANCH on a branch mid-air, before looking at the landing cell', () => {
    const outcome = runTrack({ cells: ['ground', 'branch', 'hole', 'flag'] }, [jump('j1')]);
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'HIT_BRANCH' });
    expect(actions(outcome)).toEqual([
      { type: 'bump', from: 0, at: 1, obstacle: 'branch', move: 'jump', blockId: 'j1' },
    ]);
  });

  it('crashes HIT_CRATE on a crate mid-air', () => {
    const outcome = runTrack({ cells: ['ground', 'crate', 'ground', 'flag'] }, [jump('j1')]);
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'HIT_CRATE' });
    expect(actions(outcome)).toEqual([
      { type: 'bump', from: 0, at: 1, obstacle: 'crate', move: 'jump', blockId: 'j1' },
    ]);
  });

  it('crashes HIT_BRANCH when landing on a branch', () => {
    const outcome = runTrack({ cells: ['ground', 'hole', 'branch', 'flag'] }, [jump('j1')]);
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'HIT_BRANCH' });
    expect(actions(outcome)).toEqual([
      { type: 'bump', from: 0, at: 2, obstacle: 'branch', move: 'jump', blockId: 'j1' },
    ]);
  });

  it('crashes HIT_CRATE when landing on a crate', () => {
    const outcome = runTrack({ cells: ['ground', 'ground', 'crate', 'flag'] }, [jump('j1')]);
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'HIT_CRATE' });
    expect(actions(outcome)).toEqual([
      { type: 'bump', from: 0, at: 2, obstacle: 'crate', move: 'jump', blockId: 'j1' },
    ]);
  });
});

describe('runner rules: kick (cell p+1, Măng stays)', () => {
  it('knocks a crate down, turning it into ground', () => {
    const outcome = runTrack({ cells: ['ground', 'crate', 'flag'] }, [
      kick('k1'),
      walk('w1'),
      walk('w2'),
    ]);
    expect(outcome.result).toBe('success');
    expect(actions(outcome)).toEqual([
      { type: 'kick', at: 1, hit: true, blockId: 'k1' },
      { type: 'walk', from: 0, to: 1, blockId: 'w1' },
      { type: 'walk', from: 1, to: 2, blockId: 'w2' },
      { type: 'win', at: 2, blockId: 'w2' },
    ]);
  });

  it('lets Măng jump over a kicked crate', () => {
    const outcome = runTrack({ cells: ['ground', 'crate', 'flag'] }, [kick('k1'), jump('j1')]);
    expect(outcome.result).toBe('success');
    expect(actions(outcome).slice(1)).toEqual([
      { type: 'jump', from: 0, to: 2, blockId: 'j1' },
      { type: 'win', at: 2, blockId: 'j1' },
    ]);
  });

  it.each<[RunnerCell]>([['ground'], ['hole'], ['branch'], ['flag']])(
    'does nothing to %s and never loses',
    (cell) => {
      // The flag is always last, so kicking it means standing right before it.
      const track: TrackConfig =
        cell === 'flag'
          ? { cells: ['ground', 'ground', 'flag'], start: 1 }
          : { cells: ['ground', cell, 'flag'] };
      const outcome = runTrack(track, [kick('k1'), kick('k2')]);
      expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_AT_GOAL' });
      const at = (track.start ?? 0) + 1;
      expect(actions(outcome)).toEqual([
        { type: 'kick', at, hit: false, blockId: 'k1' },
        { type: 'kick', at, hit: false, blockId: 'k2' },
      ]);
    },
  );

  it('hits a crate only once', () => {
    const outcome = runTrack({ cells: ['ground', 'crate', 'flag'] }, [kick('k1'), kick('k2')]);
    expect(actions(outcome).map((event) => event.type === 'kick' && event.hit)).toEqual([
      true,
      false,
    ]);
  });

  it('does not pick up bamboo or reach the flag by itself', () => {
    const outcome = runTrack({ cells: ['ground', 'ground', 'flag'], start: 1, bamboo: [] }, [
      kick('k1'),
    ]);
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_AT_GOAL' });
  });
});

describe('runner rules: bamboo and goal.collectAll', () => {
  const cells: RunnerCell[] = ['ground', 'ground', 'branch', 'ground', 'ground', 'flag'];
  const all = [walk('w1'), crouch('c1'), walk('w2'), walk('w3'), walk('w4')];

  it('picks up bamboo where Măng stops: after walk, crouch and jump', () => {
    const outcome = runTrack({ cells, bamboo: [1, 2, 4], goal: { collectAll: true } }, [
      walk('w1'),
      crouch('c1'),
      jump('j1'),
      walk('w2'),
    ]);
    expect(outcome.result).toBe('success');
    expect(actions(outcome)).toEqual([
      { type: 'walk', from: 0, to: 1, blockId: 'w1' },
      { type: 'collect', at: 1, blockId: 'w1' },
      { type: 'crouch', from: 1, to: 2, blockId: 'c1' },
      { type: 'collect', at: 2, blockId: 'c1' },
      { type: 'jump', from: 2, to: 4, blockId: 'j1' },
      { type: 'collect', at: 4, blockId: 'j1' },
      { type: 'walk', from: 4, to: 5, blockId: 'w2' },
      { type: 'win', at: 5, blockId: 'w2' },
    ]);
  });

  it('does not pick up bamboo it jumps over; collectAll then ends MISSED_ITEMS on the flag', () => {
    const outcome = runTrack({ cells, bamboo: [3, 1], goal: { collectAll: true } }, [
      walk('w1'),
      crouch('c1'),
      jump('j1'),
      walk('w2'),
    ]);
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'MISSED_ITEMS' });
    expect(actions(outcome).slice(-2)).toEqual([
      { type: 'walk', from: 4, to: 5, blockId: 'w2' },
      { type: 'missed', at: 5, left: [3], blockId: 'w2' },
    ]);
  });

  it('wins with missed bamboo when collectAll is off or absent', () => {
    for (const goal of [undefined, {}, { collectAll: false }]) {
      const outcome = runTrack({ cells, bamboo: [3], ...(goal !== undefined && { goal }) }, [
        walk('w1'),
        crouch('c1'),
        jump('j1'),
        walk('w2'),
      ]);
      expect(outcome.result).toBe('success');
    }
  });

  it('wins when every shoot is picked up', () => {
    const outcome = runTrack({ cells, bamboo: [1, 3], goal: { collectAll: true } }, all);
    expect(outcome.result).toBe('success');
    expect(actions(outcome).filter((event) => event.type === 'collect')).toHaveLength(2);
  });

  it('ends NOT_AT_GOAL (not MISSED_ITEMS) when the program stops before the flag', () => {
    const outcome = runTrack({ cells, bamboo: [3], goal: { collectAll: true } }, [walk('w1')]);
    expect(outcome).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_AT_GOAL' });
  });

  it('refuses to run a collectAll level without any bamboo (invalid config)', () => {
    const outcome = runTrack({ cells: ['ground', 'ground', 'flag'], goal: { collectAll: true } }, [
      walk('w1'),
    ]);
    expect(outcome).toMatchObject({ result: 'error', reasonCode: 'INTERNAL_ERROR' });
  });
});

describe('runner sensor isAhead', () => {
  const kinds = ['HOLE', 'BRANCH', 'CRATE', 'CLEAR'] as const;
  const truth: Record<RunnerCell, (typeof kinds)[number] | null> = {
    hole: 'HOLE',
    branch: 'BRANCH',
    crate: 'CRATE',
    ground: 'CLEAR',
    flag: 'CLEAR',
  };

  function sense(cells: RunnerCell[], pos: number) {
    // Built by hand: a sensor may look at tracks and positions a valid run never reaches.
    const state: RunnerState = {
      cells: [...cells],
      pos,
      bamboo: [],
      collectAll: false,
      crashAt: null,
    };
    const api = runner.createApi({
      state,
      emit: () => undefined,
      sense: (value) => value,
      stop: () => {
        throw new Error('stop');
      },
      rng: () => 0,
      level: level(cells),
    });
    return api;
  }

  it.each<[RunnerCell]>([['ground'], ['hole'], ['branch'], ['crate'], ['flag']])(
    'reads cell p+1 = %s',
    (cell) => {
      const api = sense(['ground', cell, 'ground', 'flag'], 0);
      for (const kind of kinds) expect(api.isAhead?.(kind, 's')).toBe(truth[cell] === kind);
    },
  );

  it('is false for every value past the end of the track', () => {
    const api = sense(['ground', 'ground', 'flag'], 2);
    for (const kind of kinds) expect(api.isAhead?.(kind, 's')).toBe(false);
  });

  it('rejects an unknown value', () => {
    expect(() => sense(['ground', 'ground', 'flag'], 0).isAhead?.('LAVA', 's')).toThrow('LAVA');
  });

  it('sees a kicked crate as clear', () => {
    const api = sense(['ground', 'crate', 'flag'], 0);
    expect(api.isAhead?.('CRATE', 's')).toBe(true);
    api.kick?.('k');
    expect(api.isAhead?.('CRATE', 's')).toBe(false);
    expect(api.isAhead?.('CLEAR', 's')).toBe(true);
  });

  it('drives a program that handles every obstacle with one loop', () => {
    const cells: RunnerCell[] = [
      'ground',
      'hole',
      'ground',
      'branch',
      'ground',
      'crate',
      'ground',
      'flag',
    ];
    // repeat: if hole ahead → jump, else if branch ahead → crouch, else if crate → kick, else walk
    const body = ifElse(
      'if1',
      ahead('a1', 'HOLE'),
      jump('j'),
      ifElse(
        'if2',
        ahead('a2', 'BRANCH'),
        crouch('c'),
        ifElse('if3', ahead('a3', 'CRATE'), kick('k'), walk('w')),
      ),
    );
    const outcome = runTrack({ cells }, [repeat('r', 10, body)]);
    expect(outcome.result).toBe('success');
    expect(actions(outcome).map((event) => event.type)).toEqual([
      'jump',
      'crouch',
      'walk',
      'kick',
      'walk',
      'walk',
      'walk',
      'win',
    ]);
  });

  it('runs the branch only when the sensor is true, and defaults to the first value (hố)', () => {
    const cells: RunnerCell[] = ['ground', 'ground', 'flag'];
    const clear = runTrack({ cells }, [ifElse('if1', ahead('a1', 'CLEAR'), walk('w'))]);
    expect(actions(clear)).toEqual([{ type: 'walk', from: 0, to: 1, blockId: 'w' }]);
    const unset = runTrack({ cells }, [
      ifElse('if1', { type: 'runner_is_ahead', id: 'a1' }, walk('w')),
    ]);
    expect(unset).toMatchObject({ result: 'incomplete', reasonCode: 'NOT_AT_GOAL' });
    expect(actions(unset)).toEqual([]);
  });
});

describe('runner evaluate and predictAnswer (Phase 1)', () => {
  it('evaluates a flag state with collectAll bamboo left as MISSED_ITEMS', () => {
    const config = runnerConfigSchema.parse({
      cells: ['ground', 'ground', 'flag'],
      start: 0,
      bamboo: [1],
      goal: { collectAll: true },
    });
    const state = createRunnerState(config);
    state.pos = 2;
    expect(runner.evaluate(state, config)).toEqual({ success: false, reasonCode: 'MISSED_ITEMS' });
    state.bamboo = [];
    expect(runner.evaluate(state, config)).toEqual({ success: true });
  });

  const branchy: TrackConfig = {
    cells: ['ground', 'ground', 'branch', 'crate', 'ground', 'flag'],
    bamboo: [1],
    goal: { collectAll: true },
  };

  it.each<[string, TrackConfig, object[]]>([
    ['win', branchy, [walk('w1'), crouch('c1'), kick('k1'), walk('w2'), walk('w3'), walk('w4')]],
    ['stop@2', branchy, [walk('w1'), crouch('c1')]],
    ['stop@0', branchy, [kick('k1')]],
    [
      'missed@5',
      { ...branchy, bamboo: [4, 1] },
      [walk('w1'), crouch('c1'), kick('k1'), walk('w2'), jump('j1')],
    ],
    ['crash:HIT_BRANCH@2', branchy, [walk('w1'), walk('w2')]],
    ['crash:HIT_BRANCH@2', branchy, [jump('j1')]],
    ['crash:HIT_CRATE@3', branchy, [walk('w1'), crouch('c1'), walk('w2')]],
    ['crash:HIT_CRATE@3', branchy, [walk('w1'), crouch('c1'), jump('j1')]],
    ['crash:FELL_IN_HOLE@1', { cells: ['ground', 'hole', 'flag'] }, [crouch('c1')]],
    ['crash:OFF_TRACK@1', { cells: ['ground', 'ground', 'flag'] }, [walk('w1'), jump('j1')]],
  ])('answers %s', (key, track, chain) => {
    expect(runTrack(track, chain, 'predict').answerKey).toBe(key);
  });

  it('is deterministic with every Phase 1 event', () => {
    const chain = [walk('w1'), crouch('c1'), kick('k1'), walk('w2'), jump('j1')];
    const track = { ...branchy, bamboo: [1, 4] };
    const first = runTrack(track, chain);
    expect(runTrack(track, chain)).toEqual(first);
    expect(JSON.parse(JSON.stringify(first.events))).toEqual(first.events);
  });

  it('does not mutate the level config when a crate is kicked or bamboo picked', () => {
    const config = { cells: ['ground', 'crate', 'flag'] as RunnerCell[], start: 0 };
    const snapshot = structuredClone(config);
    runLevel({
      kind: runner,
      level: level(config.cells, { config }),
      workspace: program([kick('k'), walk('w')]),
    });
    expect(config).toEqual(snapshot);
  });
});

describe('runner blocks (Phase 1)', () => {
  it('generates calls for crouch, kick and the isAhead sensor', () => {
    registerBlockSpecs(runner.blocks);
    const code = compileProgram(
      program([crouch('c1'), kick('k1'), ifElse('if1', ahead('a1', 'BRANCH'), crouch('c2'))]),
    );
    expect(code).toContain(`crouch('c1');`);
    expect(code).toContain(`kick('k1');`);
    expect(code).toContain(`if (isAhead('BRANCH', 'a1')) {`);
  });

  it('offers the four sensor values with Vietnamese labels', () => {
    const sensor = runner.blocks.find((spec) => spec.type === 'runner_is_ahead');
    expect(sensor).toMatchObject({
      category: 'sensor',
      json: { output: 'Boolean', style: 'sensor_blocks' },
    });
    expect(sensor?.json.args0?.[0]).toMatchObject({
      type: 'field_dropdown',
      name: 'KIND',
      options: [
        ['hố', 'HOLE'],
        ['cành', 'BRANCH'],
        ['thùng', 'CRATE'],
        ['ô trống', 'CLEAR'],
      ],
    });
  });

  it('uses the move style for every statement block', () => {
    for (const spec of runner.blocks.filter((block) => block.category === 'move')) {
      expect(spec.json.style).toBe('move_blocks');
    }
  });
});

describe('runner star goals (P2-21)', () => {
  const track: RunnerCell[] = ['ground', 'ground', 'hole', 'ground', 'flag'];
  const goalLevel = (bamboo: number[]): Level =>
    level(track, {
      config: { cells: track, start: 0, bamboo },
      starGoals: [{ kind: 'collectAll' }],
    });
  const outcome = (bamboo: number[], chain: object[]): RunOutcome<RunnerEvent> =>
    runLevel({ kind: runner, level: goalLevel(bamboo), workspace: program(chain) });

  it('meets collectAll when every shoot is picked up, without making it a win condition', () => {
    // walk 1, jump 3 (picks up 3), walk 4 (flag).
    expect(outcome([3], [walk('a'), jump('b'), walk('c')])).toMatchObject({
      result: 'success',
      goals: [true],
    });
  });

  it('misses collectAll when a jump flies over the shoot, but still wins', () => {
    const wide: RunnerCell[] = ['ground', 'ground', 'ground', 'flag'];
    const result = runLevel({
      kind: runner,
      level: level(wide, {
        config: { cells: wide, start: 0, bamboo: [1] },
        starGoals: [{ kind: 'collectAll' }],
      }),
      workspace: program([jump('a'), walk('b')]),
    });
    expect(result).toMatchObject({ result: 'success', goals: [false] });
  });

  it('meets collectAll on a track without bamboo', () => {
    expect(outcome([], [walk('a'), jump('b'), walk('c')]).goals).toEqual([true]);
  });

  it('checkStarGoal reads only the state', () => {
    const state = createRunnerState(
      runnerConfigSchema.parse({ cells: track, start: 0, bamboo: [3] }),
    );
    expect(runner.checkStarGoal?.({ kind: 'collectAll' }, state, { cells: track, start: 0 })).toBe(
      false,
    );
    state.bamboo = [];
    expect(runner.checkStarGoal?.({ kind: 'collectAll' }, state, { cells: track, start: 0 })).toBe(
      true,
    );
  });
});
