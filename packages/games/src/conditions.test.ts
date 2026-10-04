// P2-11a: `cq_if`, `cq_if_else`, `cq_repeat_until` with the runner and maze sensors, `sense`
// events, TIMEOUT for loops that never stop and EMPTY_CONDITION, on curriculum.md §5.2–§5.3 maps.
import type { Level, WorkspaceJson } from '@codequest/content-schema';
import { compileProgram, registerBlockSpecs, runLevel, type RunOutcome } from '@codequest/engine';
import { describe, expect, it } from 'vitest';
import { getGameKind } from './index';
import type { RunnerCell } from './runner';

function kindOf(id: 'runner' | 'maze') {
  const kind = getGameKind(id);
  if (kind === undefined) throw new Error(`${id} is registered`);
  return kind;
}
const runner = kindOf('runner');
const maze = kindOf('maze');

function program(chain: object[]): WorkspaceJson {
  let next: object | undefined;
  for (const block of [...chain].reverse()) {
    next = next === undefined ? block : { ...block, next: { block: next } };
  }
  const start = {
    type: 'cq_start',
    id: 'start',
    ...(next !== undefined && { next: { block: next } }),
  };
  return { blocks: { languageVersion: 0, blocks: [start] } };
}

/** Statement chain for an input: the first block with the rest hanging from its `next`. */
function chainOf(blocks: object[]): object | undefined {
  let next: object | undefined;
  for (const block of [...blocks].reverse()) {
    next = next === undefined ? block : { ...block, next: { block: next } };
  }
  return next;
}

const block = (type: string) => (id: string) => ({ type, id });
const walk = block('runner_walk');
const jump = block('runner_jump');
const kick = block('runner_kick');
const forward = block('maze_forward');
const left = block('maze_turn_left');
const right = block('maze_turn_right');
const atGoal = block('maze_at_goal');
const arrived = block('runner_at_goal');
const ahead = (id: string, kind: string): object => ({
  type: 'runner_is_ahead',
  id,
  fields: { KIND: kind },
});
const isPath = (id: string, dir: string): object => ({
  type: 'maze_is_path',
  id,
  fields: { DIR: dir },
});

function control(
  type: string,
  id: string,
  cond: object | null,
  body: object[],
  otherwise?: object[],
): object {
  const doChain = chainOf(body);
  const elseChain = otherwise === undefined ? undefined : chainOf(otherwise);
  return {
    type,
    id,
    inputs: {
      ...(cond !== null && { COND: { block: cond } }),
      ...(doChain !== undefined && { DO: { block: doChain } }),
      ...(elseChain !== undefined && { ELSE: { block: elseChain } }),
    },
  };
}
const ifThen = (id: string, cond: object | null, body: object[]) =>
  control('cq_if', id, cond, body);
const ifElse = (id: string, cond: object, body: object[], otherwise: object[]) =>
  control('cq_if_else', id, cond, body, otherwise);
const until = (id: string, cond: object | null, body: object[]) =>
  control('cq_repeat_until', id, cond, body);
const repeat = (id: string, times: number, body: object[]): object => ({
  type: 'cq_repeat',
  id,
  fields: { TIMES: times },
  inputs: { DO: { block: chainOf(body) } },
});

const cellOf: Record<string, RunnerCell> = {
  '.': 'ground',
  O: 'hole',
  C: 'crate',
  B: 'branch',
  F: 'flag',
};
/** A runner track from the curriculum's notation (`.O..F`). */
const track = (text: string) => ({
  cells: Array.from(text, (c) => cellOf[c] ?? 'ground'),
  start: 0,
});

function level(kind: 'runner' | 'maze', config: unknown, overrides: Partial<Level> = {}): Level {
  return {
    id: 'w04-l01',
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
    ...overrides,
  };
}

function run(
  kind: 'runner' | 'maze',
  config: unknown,
  chain: object[],
  overrides: Partial<Level> = {},
): RunOutcome {
  return runLevel({
    kind: kind === 'runner' ? runner : maze,
    level: level(kind, config, overrides),
    workspace: program(chain),
  });
}

/** Events as `type:blockId[:value]`, highlights included. */
const trace = (outcome: RunOutcome): string[] =>
  outcome.events.map((event) =>
    [event.type, event.blockId ?? '', ...('value' in event ? [String(event.value)] : [])].join(':'),
  );

const senses = (outcome: RunOutcome): string[] =>
  trace(outcome).filter((entry) => entry.startsWith('sense:'));

describe('control blocks: code', () => {
  it('compiles if, if-else and repeat-until around a sensor call', () => {
    registerBlockSpecs(runner.blocks);
    const code = compileProgram(
      program([
        ifElse('i', ahead('a', 'HOLE'), [jump('j')], [walk('w')]),
        until('u', arrived('g'), [ifThen('t', ahead('b', 'CRATE'), [kick('k')])]),
      ]),
    );
    expect(code).toContain("if (isAhead('HOLE', 'a')) {");
    expect(code).toContain('} else {');
    expect(code).toContain("while (!atGoal('g')) {");
    expect(code).toContain("if (isAhead('CRATE', 'b')) {");
  });
});

describe('runner with conditions (W4–W5)', () => {
  it('W4 l03: an if outside a loop asks once; the sensor lights ✘ exactly once', () => {
    const outcome = run('runner', track('..O.F'), [
      ifThen('i', ahead('a', 'HOLE'), [jump('j')]),
      walk('w1'),
      walk('w2'),
      walk('w3'),
    ]);
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'FELL_IN_HOLE' });
    expect(senses(outcome)).toEqual(['sense:a:false']);
  });

  it('logs the sense right after the highlight of the statement that asked', () => {
    const outcome = run('runner', track('.O.F'), [
      ifElse('i', ahead('a', 'HOLE'), [jump('j')], [walk('w')]),
      walk('w2'),
    ]);
    expect(outcome.result).toBe('success');
    expect(trace(outcome)).toEqual([
      'highlight:start',
      'highlight:i',
      'sense:a:true',
      'highlight:j',
      'jump:j',
      'highlight:w2',
      'walk:w2',
      'win:w2',
    ]);
    // A sense counts as an action (maxActions, T14).
    expect(outcome.stats.actions).toBe(4);
  });

  it('W4 l02: one if-else program wins both maps; the W4 l01 program falls on map 1', () => {
    const solution = [repeat('r', 10, [ifElse('i', ahead('a', 'HOLE'), [jump('j')], [walk('w')])])];
    const variants = { variants: [track('.O...O.O..F')] };
    expect(run('runner', track('..O.O...O.F'), solution, variants)).toMatchObject({
      result: 'success',
    });
    const l01 = [repeat('r', 10, [ifThen('i', ahead('a', 'HOLE'), [jump('j')]), walk('w')])];
    expect(run('runner', track('..O.O...O.F'), l01, variants)).toMatchObject({
      result: 'crash',
      reasonCode: 'FELL_IN_HOLE',
      mapIndex: 0,
    });
  });

  it('W5 l01: "until a hole is ahead, walk", then jump, on two lengths', () => {
    const solution = [until('u', ahead('a', 'HOLE'), [walk('w')]), jump('j')];
    for (const text of ['..OF', '.......OF']) {
      expect(run('runner', track(text), solution).result).toBe('success');
    }
  });

  it('W5 l03: the condition is asked before the first pass, so the loop can run 0 times', () => {
    const outcome = run('runner', track('.O..F'), [
      until('u', ahead('a', 'HOLE'), [walk('w')]),
      jump('j'),
      walk('w2'),
      walk('w3'),
    ]);
    expect(outcome.result).toBe('success');
    expect(senses(outcome)).toEqual(['sense:a:true']);
    expect(trace(outcome)).not.toContain('walk:w');
  });

  it('W5 l10: "until arrived" never answers ✔ while running; the win ends the run', () => {
    const outcome = run('runner', track('..O.O..O.F'), [
      until('u', arrived('g'), [ifElse('i', ahead('a', 'HOLE'), [jump('j')], [walk('w')])]),
    ]);
    expect(outcome.result).toBe('success');
    const answers = senses(outcome).filter((entry) => entry.startsWith('sense:g:'));
    expect(answers.length).toBeGreaterThan(0);
    expect(answers.every((entry) => entry === 'sense:g:false')).toBe(true);
  });

  it('W5 l19: kicking "until a hole is ahead" never stops: TIMEOUT, the same log every run', () => {
    const chain = [until('u', ahead('a', 'HOLE'), [kick('k')]), jump('j')];
    const first = run('runner', track('.C..O.F'), chain);
    const second = run('runner', track('.C..O.F'), chain);
    expect(first).toMatchObject({ result: 'timeout', reasonCode: 'TIMEOUT' });
    expect(second).toEqual(first);
    // kick + sense per pass: the action limit (1 000) ends it long before the step limit.
    expect(first.stats.actions).toBe(1000);
  });

  it('answers "timeout" as the predict key of a loop that never stops (T9)', () => {
    const outcome = runLevel({
      kind: runner,
      level: level('runner', track('.C..O.F'), {
        mode: 'predict',
        initialWorkspace: program([until('u', ahead('a', 'HOLE'), [kick('k')]), jump('j')]),
        predict: {
          options: [
            { key: 'timeout', label: 'Đá mãi không dừng' },
            { key: 'win', label: 'Tới lá cờ' },
            { key: 'crash:HIT_CRATE@1', label: 'Đụng thùng' },
          ],
        },
      }),
      workspace: program([]),
    });
    expect(outcome.answerKey).toBe('timeout');
  });

  it('refuses to run a question slot left empty (EMPTY_CONDITION)', () => {
    for (const chain of [
      [ifThen('i', null, [walk('w')])],
      [
        repeat('r', 3, [
          ifElse('i', ahead('a', 'HOLE'), [jump('j')], [until('u', null, [walk('w')])]),
        ]),
      ],
    ]) {
      expect(run('runner', track('...F'), chain)).toMatchObject({
        result: 'error',
        reasonCode: 'EMPTY_CONDITION',
        events: [],
      });
    }
    // An empty slot in a loose block never runs, so it does not matter.
    const loose: WorkspaceJson = program([walk('w1'), walk('w2'), walk('w3')]);
    loose.blocks.blocks.push(ifThen('i', null, [walk('w')]) as { type: string });
    expect(
      runLevel({ kind: runner, level: level('runner', track('...F')), workspace: loose }).result,
    ).toBe('success');
  });
});

describe('maze with conditions (W4–W5)', () => {
  const corridor = { map: ['#######', '#S...G#', '#######'], startDir: 'E' };

  it('W4 l04: "if path ahead, forward, else turn left" in a loop', () => {
    const config = { map: ['#######', '##G...#', '#####.#', '#S....#', '#######'], startDir: 'E' };
    const outcome = run('maze', config, [
      repeat('r', 12, [ifElse('i', isPath('p', 'AHEAD'), [forward('f')], [left('l')])]),
    ]);
    expect(outcome.result).toBe('success');
  });

  it('W5 l04: "until at goal, forward" wins on both lengths', () => {
    const outcome = run('maze', corridor, [until('u', atGoal('g'), [forward('f')])], {
      variants: [{ map: ['########', '#S..G..#', '########'], startDir: 'E' }],
    });
    expect(outcome.result).toBe('success');
  });

  it('W5 l05: an until loop with an empty body never stops (TIMEOUT)', () => {
    const outcome = run('maze', corridor, [until('u', atGoal('g'), []), forward('f')]);
    expect(outcome).toMatchObject({ result: 'timeout', reasonCode: 'TIMEOUT' });
    // Only senses count: the action limit ends it, so the log stays short.
    expect(outcome.stats.actions).toBe(1000);
    expect(outcome.events.length).toBeLessThan(2100);
  });

  it('W5 l07: turning "until at goal" spins forever, the same way every run', () => {
    const chain = [until('u', atGoal('g'), [right('r')]), forward('f')];
    const first = run('maze', corridor, chain);
    expect(first).toMatchObject({ result: 'timeout', reasonCode: 'TIMEOUT' });
    expect(run('maze', corridor, chain)).toEqual(first);
  });

  it('honours maxSteps for a loop that never stops (the step limit can come first)', () => {
    const outcome = run('maze', corridor, [until('u', atGoal('g'), [])], {
      limits: { maxSteps: 500 },
    });
    expect(outcome).toMatchObject({ result: 'timeout', reasonCode: 'TIMEOUT' });
    expect(outcome.stats.steps).toBe(500);
  });
});

describe('every sensor reports its answer', () => {
  it.each([
    ['runner', track('.O.F'), ahead('s', 'HOLE'), true],
    ['runner', track('.O.F'), arrived('s'), false],
    ['maze', { map: ['#####', '#S.G#', '#####'], startDir: 'E' }, isPath('s', 'AHEAD'), true],
    ['maze', { map: ['#####', '#S.G#', '#####'], startDir: 'E' }, atGoal('s'), false],
  ] as const)('%s %o lights the sensor block with its answer', (kind, config, sensor, value) => {
    const outcome = run(kind, config, [
      ifThen('i', sensor, [kind === 'runner' ? kick('k') : left('l')]),
    ]);
    expect(senses(outcome)).toEqual([`sense:s:${String(value)}`]);
  });
});
