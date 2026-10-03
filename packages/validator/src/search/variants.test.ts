// Multi-map levels (P2-12, ADR-0016): the search only accepts programs that win every map.
import type { Level } from '@codequest/content-schema';
import { getGameKind } from '@codequest/games';
import { describe, expect, it } from 'vitest';
import { findFixes } from './fixes';
import { formatProgram, programToWorkspace } from './program';
import { findShortestPrograms } from './shortest';
import { SearchAborted } from './budget';
import { FastSim } from './sim';

type Cell = 'ground' | 'hole' | 'branch' | 'crate' | 'flag';

function track(text: string): { cells: Cell[]; start: number } {
  const cells = Array.from(text, (char): Cell =>
    char === 'O' ? 'hole' : char === 'B' ? 'branch' : char === 'F' ? 'flag' : 'ground',
  );
  return { cells, start: 0 };
}

const walk = { block: 'runner_walk' };
const jump = { block: 'runner_jump' };

function runnerLevel(maps: string[], extra: Partial<Level> = {}): Level {
  const [first = '..F', ...rest] = maps;
  return {
    id: 'w04-l99',
    worldId: '_sandbox',
    stage: 'practice',
    kind: 'runner',
    mode: 'build',
    title: 'Hai bản đồ',
    objective: 'Một chương trình, hai bản đồ',
    learningGoal: 'Chương trình tổng quát',
    toolbox: ['runner_walk', 'runner_jump', 'cq_repeat'],
    par: 5,
    config: track(first),
    ...(rest.length > 0 && { variants: rest.map(track) }),
    solution: programToWorkspace([walk]),
    hints: [],
    ...extra,
  };
}

function runner() {
  const kind = getGameKind('runner');
  if (kind === undefined) throw new Error('runner missing');
  return kind;
}

describe('FastSim on a level with variants', () => {
  it('wins only with a program that wins every map', () => {
    const sim = new FastSim(runner(), runnerLevel(['..O.F', '....F']));
    const code = (program: Array<typeof walk>) => sim.compile(program) ?? [];
    // walk, jump, walk wins both; jump, jump wins map 2 only (lands in the hole of map 1).
    expect(sim.wins(code([walk, jump, walk]), 3)).toBe(true);
    expect(sim.wins(code([jump, jump]), 2)).toBe(false);
  });

  it('stops like a spent budget past the cap on tuple states', () => {
    const sim = new FastSim(runner(), runnerLevel(['....F', '..O.F']), [], 1);
    const code = sim.compile([walk, walk]) ?? [];
    expect(() => sim.run(sim.initial, code)).toThrow(SearchAborted);
  });

  it('keeps a map won early (flag reached mid-program) while the others run on', () => {
    const sim = new FastSim(runner(), runnerLevel(['..F', '....F']));
    const code = sim.compile([jump, jump]) ?? [];
    expect(sim.wins(code, 2)).toBe(true);
  });
});

describe('findShortestPrograms on a level with variants', () => {
  it('finds the shortest program that wins every map, confirmed by runLevel', () => {
    // Map 1 alone: jump, jump (2 blocks). Map 2 forces a walk first.
    const alone = findShortestPrograms(runnerLevel(['....F']));
    expect(alone.minBlocks).toBe(2);
    const both = findShortestPrograms(runnerLevel(['....F', '..O.F']));
    expect(both).toMatchObject({ minBlocks: 3, complete: true, mismatches: [] });
    // Every example starts with a walk (a first jump lands in the hole of map 2).
    expect(both.examples.length).toBeGreaterThan(0);
    for (const example of both.examples) expect(formatProgram(example)).not.toMatch(/^jump/);
  });

  it('finds nothing when the maps need different paths', () => {
    // Map 1 needs a jump first (hole at 1), map 2 a walk first (hole at 2).
    const result = findShortestPrograms(runnerLevel(['.O..F', '..O.F']));
    expect(result).toMatchObject({ minBlocks: null, complete: true, count: 0 });
  });

  it('is deterministic', () => {
    const level = runnerLevel(['....F', '..O.F', '...O.F']);
    expect(findShortestPrograms(level)).toEqual(findShortestPrograms(level));
  });
});

describe('findFixes on a level with variants', () => {
  it('only counts fixes that win every map', () => {
    const level = runnerLevel(['....F', '..O.F'], {
      mode: 'bughunt',
      parEdits: 2,
      // jump, jump wins map 1 but falls into the hole of map 2.
      initialWorkspace: programToWorkspace([jump, jump]),
      solution: programToWorkspace([walk, jump, walk]),
    });
    const result = findFixes(level);
    expect(result).toMatchObject({ complete: true, mismatches: [] });
    expect(result.minEdits).toBe(2);
    for (const example of result.examples) expect(formatProgram(example)).not.toMatch(/^jump/);
  });
});
