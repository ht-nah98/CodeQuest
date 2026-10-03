// The par search under star goals (phase-2.md P2-21): on a level with `starGoals` only wins
// that meet every goal on every map count; `ignoreStarGoals` gives the plain-win minimum.
import type { Level } from '@codequest/content-schema';
import { describe, expect, it } from 'vitest';
import { findFixes } from './fixes';
import { programToWorkspace } from './program';
import { findShortestPrograms } from './shortest';

type Cell = 'ground' | 'hole' | 'flag';

/** Runner cells from curriculum.md notation: `.` ground, `O` hole, `F` flag. */
function track(text: string): Cell[] {
  return Array.from(text, (char) => (char === '.' ? 'ground' : char === 'O' ? 'hole' : 'flag'));
}

function runnerLevel(overrides: Partial<Level>): Level {
  return {
    id: 'w03-l11',
    worldId: 'w03-xuong-sua-loi',
    stage: 'practice',
    kind: 'runner',
    mode: 'build',
    title: 'Máy mới',
    objective: 'Tới máy',
    learningGoal: 'Ghép từng đoạn',
    toolbox: ['runner_walk', 'runner_jump', 'runner_crouch', 'runner_kick', 'cq_repeat'],
    hints: [],
    config: {},
    ...overrides,
  };
}

/** W3 l11 as designed in curriculum.md §5.1 (bamboo on cell 16, no nested loops). */
const L11_CELLS = track('..O..O..O.O.O.O....F');
const l11 = runnerLevel({
  maxBlocks: 9,
  par: 7,
  config: { cells: L11_CELLS, start: 0, bamboo: [16] },
  starGoals: [{ kind: 'collectAll' }],
});
const noNesting = { maxDepth: 1 };

describe('findShortestPrograms with starGoals', () => {
  it('reproduces the W3 l11 trade-off: 5 blocks win, 7 blocks also pick up the shoot', () => {
    const plain = findShortestPrograms(l11, { ...noNesting, ignoreStarGoals: true });
    expect(plain).toMatchObject({ minBlocks: 5, count: 32, complete: true, mismatches: [] });

    const goals = findShortestPrograms(l11, noNesting);
    expect(goals).toMatchObject({ minBlocks: 7, complete: true, mismatches: [] });
    expect(goals.count).toBeGreaterThan(0);
  });

  it('is the plain search on a level without starGoals', () => {
    const level = { ...l11 };
    delete level.starGoals;
    const plain = findShortestPrograms(level, noNesting);
    const ignored = findShortestPrograms(l11, { ...noNesting, ignoreStarGoals: true });
    expect(plain).toEqual(ignored);
  });

  it('needs the goals on every map: a map without bamboo meets them as it is', () => {
    const twoMaps = { ...l11, variants: [{ cells: L11_CELLS, start: 0 }] };
    expect(findShortestPrograms(twoMaps, noNesting).minBlocks).toBe(7);
    // Map 2 forces a jump first, so no program stands on map 1's shoot: wins, but no par.
    const clash = runnerLevel({
      toolbox: ['runner_walk', 'runner_jump'],
      par: 3,
      config: { cells: track('...F'), start: 0, bamboo: [1] },
      variants: [{ cells: track('.O.F'), start: 0 }],
      starGoals: [{ kind: 'collectAll' }],
    });
    expect(findShortestPrograms(clash, { maxDepth: 0, ignoreStarGoals: true }).minBlocks).toBe(2);
    expect(findShortestPrograms(clash, { maxDepth: 0 })).toMatchObject({
      minBlocks: null,
      complete: true,
    });
  });
});

describe('findFixes with starGoals', () => {
  // Track 0..5, flag on 5, shoots on 1 and 2. `jump, jump` stops on 4.
  const bughunt = runnerLevel({
    mode: 'bughunt',
    toolbox: ['runner_walk', 'runner_jump'],
    parEdits: 3,
    config: { cells: track('.....F'), start: 0, bamboo: [1, 2] },
    initialWorkspace: programToWorkspace([{ block: 'runner_jump' }, { block: 'runner_jump' }]),
    starGoals: [{ kind: 'collectAll' }],
  });

  it('counts only fixes that meet every goal; ignoreStarGoals gives the plain fix', () => {
    const plain = findFixes(bughunt, { maxDepth: 0, ignoreStarGoals: true });
    expect(plain).toMatchObject({ minEdits: 1, complete: true, mismatches: [] });
    const goals = findFixes(bughunt, { maxDepth: 0 });
    expect(goals).toMatchObject({ minEdits: 3, complete: true, mismatches: [] });
  });
});
