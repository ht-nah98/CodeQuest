import type { Level, WorkspaceJson } from '@codequest/content-schema';
import { describe, expect, it } from 'vitest';
import { findParsonsArrangements } from './parsons';

const CELL: Record<string, string> = { '.': 'ground', O: 'hole', F: 'flag' };
const road = (cells: string): object => ({
  cells: Array.from(cells, (c) => CELL[c]),
  start: 0,
});

/** A runner parsons level whose solution is `blocks` (already nested) under the start block. */
function parsons(cells: string, chain: object): Level {
  const solution = {
    blocks: {
      languageVersion: 0,
      blocks: [{ type: 'cq_start', id: 'start', next: { block: chain } }],
    },
  } as WorkspaceJson;
  return {
    id: 'w01-l01',
    worldId: 'w01-lang-tre',
    stage: 'practice',
    kind: 'runner',
    mode: 'parsons',
    title: 'Thử',
    objective: 'Thử',
    learningGoal: 'Thử',
    toolbox: [],
    config: road(cells),
    initialWorkspace: solution,
    solution,
    hints: [],
  };
}

/** Plain blocks one under the other. */
const seq = (...types: string[]): object => {
  let next: object | undefined;
  for (const [index, type] of [...types.entries()].reverse()) {
    next = { type, id: `b${String(index)}`, ...(next && { next: { block: next } }) };
  }
  return next ?? {};
};

describe('findParsonsArrangements', () => {
  it('runs every distinct order of plain blocks once; only one wins', () => {
    // jump, walk, walk on ".O..F": only jumping first clears the hole.
    const level = parsons('.O..F', seq('runner_jump', 'runner_walk', 'runner_walk'));
    expect(findParsonsArrangements(level)).toMatchObject({ runs: 3, wins: 1, complete: true });
  });

  it('fills condition slots, never leaves a body empty, and counts each winning way', () => {
    // until a hole is ahead {walk}, jump, walk on "..O.F".
    const chain = {
      type: 'cq_repeat_until',
      id: 'until',
      inputs: {
        COND: { block: { type: 'runner_is_ahead', id: 'ask', fields: { KIND: 'HOLE' } } },
        DO: { block: { type: 'runner_walk', id: 'w1' } },
      },
      next: {
        block: { type: 'runner_jump', id: 'j', next: { block: { type: 'runner_walk', id: 'w2' } } },
      },
    };
    // On a short road other arrangements win too (like the draft map of W5 l02).
    const short = findParsonsArrangements(parsons('..O.F', chain));
    expect(short).toMatchObject({ runs: 18, wins: 3, complete: true });
    expect(short.examples).toContain(
      'cq_repeat_until runner_is_ahead(HOLE) [runner_walk], runner_jump, runner_walk',
    );
    // A longer bank before the hole leaves only the intended one.
    expect(findParsonsArrangements(parsons('....O.F', chain))).toMatchObject({
      wins: 1,
      examples: ['cq_repeat_until runner_is_ahead(HOLE) [runner_walk], runner_jump, runner_walk'],
    });
  });

  it('treats identical blocks as one: three walks have a single arrangement', () => {
    const level = parsons('...F', seq('runner_walk', 'runner_walk', 'runner_walk'));
    expect(findParsonsArrangements(level)).toMatchObject({ runs: 1, wins: 1 });
  });

  it('counts a win only when every block ran (UNUSED_BLOCKS)', () => {
    // On "..F" jump reaches the flag at once: "jump, walk" never runs the walk, and
    // "walk, jump" jumps past the flag, so nothing wins.
    const level = parsons('..F', seq('runner_walk', 'runner_jump'));
    expect(findParsonsArrangements(level)).toMatchObject({ runs: 2, wins: 0 });
  });

  it('stops at maxRuns and says the search is not complete', () => {
    const level = parsons('.O..F', seq('runner_jump', 'runner_walk', 'runner_walk'));
    expect(findParsonsArrangements(level, { maxRuns: 2 })).toMatchObject({
      runs: 2,
      complete: false,
    });
  });
});
