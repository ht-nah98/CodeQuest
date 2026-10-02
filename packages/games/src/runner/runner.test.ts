import type { Level, WorkspaceJson } from '@codequest/content-schema';
import { compileProgram, registerBlockSpecs, runLevel, type RunOutcome } from '@codequest/engine';
import { describe, expect, it } from 'vitest';
import { getGameKind } from '../index';
import { runner, runnerConfigSchema, type RunnerCell, type RunnerEvent } from './index';
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

/** Game events without the engine's highlight events. */
function actions(outcome: RunOutcome<RunnerEvent>): RunnerEvent[] {
  return outcome.events.filter((event): event is RunnerEvent => event.type !== 'highlight');
}

describe('runner config', () => {
  it('accepts a valid track', () => {
    expect(runnerConfigSchema.safeParse({ cells: L03, start: 0 }).success).toBe(true);
    expect(runnerConfigSchema.safeParse({ cells: L03, start: 3 }).success).toBe(true);
  });

  it.each([
    ['no flag', { cells: ['ground', 'ground', 'ground'], start: 0 }],
    ['flag not last', { cells: ['ground', 'flag', 'ground'], start: 0 }],
    ['two flags', { cells: ['ground', 'flag', 'flag'], start: 0 }],
    ['start on a hole', { cells: L03, start: 2 }],
    ['start off the track', { cells: L03, start: 9 }],
    ['too short', { cells: ['ground', 'flag'], start: 0 }],
    ['too long', { cells: [...Array<RunnerCell>(40).fill('ground'), 'flag'], start: 0 }],
    ['cell not implemented yet', { cells: ['ground', 'branch', 'flag'], start: 0 }],
    ['unknown key', { cells: L03, start: 0, bamboo: [1] }],
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
    expect(runner.reasonCodes).toEqual(['FELL_IN_HOLE', 'OFF_TRACK', 'NOT_AT_GOAL']);
    expect(runner.blocks.map((spec) => spec.type)).toEqual(['runner_walk', 'runner_jump']);
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
