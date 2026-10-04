import { analyzeWorkspace, registerBlockSpecs } from '@codequest/engine';
import { getGameKind } from '@codequest/games';
import { describe, expect, it } from 'vitest';
import {
  formatProgram,
  programBlockTypes,
  programFromWorkspace,
  programLoopDepth,
  programSize,
  programToWorkspace,
  type Program,
} from './program';
import { FastSim, stateKey } from './sim';
import { loadLevel } from './testLevels';

const program: Program = [
  { block: 'runner_walk' },
  { repeat: 3, body: [{ block: 'runner_jump' }, { repeat: 2, body: [{ block: 'runner_walk' }] }] },
  { block: 'runner_kick' },
];

describe('programs', () => {
  it('round-trips through workspace JSON and counts blocks like analyzeWorkspace', () => {
    const workspace = programToWorkspace(program);
    expect(programFromWorkspace(workspace)).toEqual(program);
    expect(programSize(program)).toBe(6);
    const runner = getGameKind('runner');
    if (runner === undefined) throw new Error('runner missing');
    registerBlockSpecs(runner.blocks);
    expect(analyzeWorkspace(workspace).blocksUsed).toBe(6);
  });

  it('formats without the kind prefix', () => {
    expect(formatProgram(program)).toBe('walk, repeat 3 [jump, repeat 2 [walk]], kick');
    expect(formatProgram([{ block: 'maze_turn_left', fields: { X: 1 } }])).toBe('turn_left(X=1)');
  });

  it('round-trips conditions and counts them like analyzeWorkspace (P2-11)', () => {
    const hole = { block: 'runner_is_ahead', fields: { KIND: 'HOLE' } };
    const conditional: Program = [
      {
        until: { block: 'runner_at_goal' },
        body: [{ if: hole, then: [{ block: 'runner_jump' }], else: [{ block: 'runner_walk' }] }],
      },
      { if: hole, then: [{ repeat: 2, body: [{ block: 'runner_walk' }] }] },
      { if: null, then: [], else: [] },
    ];
    const workspace = programToWorkspace(conditional);
    expect(programFromWorkspace(workspace)).toEqual(conditional);
    expect(programSize(conditional)).toBe(11);
    const runner = getGameKind('runner');
    if (runner === undefined) throw new Error('runner missing');
    registerBlockSpecs(runner.blocks);
    expect(analyzeWorkspace(workspace).blocksUsed).toBe(11);
    expect(formatProgram(conditional)).toBe(
      'until at_goal [if is_ahead(KIND=HOLE) [jump] else [walk]], ' +
        'if is_ahead(KIND=HOLE) [repeat 2 [walk]], if ? [] else []',
    );
    expect(programLoopDepth(conditional)).toBe(1);
    expect(programLoopDepth([{ until: null, body: conditional }])).toBe(2);
    expect(Object.fromEntries(programBlockTypes(conditional))).toEqual({
      cq_repeat_until: 1,
      runner_at_goal: 1,
      cq_if_else: 2,
      runner_is_ahead: 2,
      runner_jump: 1,
      runner_walk: 2,
      cq_if: 1,
      cq_repeat: 1,
    });
  });

  it('reads an empty program and rejects value inputs', () => {
    expect(programFromWorkspace(programToWorkspace([]))).toEqual([]);
    expect(
      programFromWorkspace({
        blocks: {
          languageVersion: 0,
          blocks: [
            {
              type: 'cq_start',
              next: { block: { type: 'cq_if', inputs: { IF: { block: { type: 'x' } } } } },
            },
          ],
        },
      }),
    ).toBeNull();
    expect(programFromWorkspace({ blocks: { languageVersion: 0, blocks: [] } })).toBeNull();
  });
});

describe('FastSim', () => {
  it('keys states independently of key order and Set order', () => {
    expect(stateKey({ b: 1, a: new Set([2, 1]) })).toBe(stateKey({ a: new Set([1, 2]), b: 1 }));
    expect(stateKey(new Map([['x', [1]]]))).toBe('M["x":[1]]');
  });

  it('replays the real runner rules', async () => {
    const level = await loadLevel('w01-l03');
    const runner = getGameKind('runner');
    if (runner === undefined) throw new Error('runner missing');
    const sim = new FastSim(runner, level);
    expect(sim.atoms.map((atom) => atom.statement.block)).toEqual(['runner_walk', 'runner_jump']);
    const code = (list: Program) => sim.compile(list) ?? [];
    expect(
      sim.wins(
        code([{ block: 'runner_walk' }, { block: 'runner_jump' }, { block: 'runner_walk' }]),
        3,
      ),
    ).toBe(true);
    expect(sim.wins(code([{ block: 'runner_walk' }, { block: 'runner_walk' }]), 2)).toBe(false);
    expect(sim.wins([], 0)).toBe(false);
    expect(sim.compile([{ block: 'runner_kick' }])).toBeNull();
  });

  it('records sensor blocks of the toolbox as conditions, one per dropdown value', async () => {
    const level = { ...(await loadLevel('w01-l03')), toolbox: ['runner_walk', 'runner_is_ahead'] };
    const runner = getGameKind('runner');
    if (runner === undefined) throw new Error('runner missing');
    const sim = new FastSim(runner, level);
    expect(sim.unsupported).toEqual([]);
    expect(sim.conds.map((cond) => cond.condition.fields?.['KIND'])).toEqual([
      'HOLE',
      'BRANCH',
      'CRATE',
      'CLEAR',
    ]);
    expect(sim.conds.map((cond) => cond.call.name)).toEqual([
      'isAhead',
      'isAhead',
      'isAhead',
      'isAhead',
    ]);
  });
});
