import { describe, expect, it } from 'vitest';
import { findFixes } from './fixes';
import { formatProgram } from './program';
import { findShortestPrograms } from './shortest';
import { loadLevel } from './testLevels';

/**
 * `par` of every build level of W1–W2 as written in curriculum.md §3–4, where it was checked
 * by hand-written brute force. The search must reproduce each one exactly.
 */
const BUILD_PARS: ReadonlyArray<[string, number]> = [
  ['w01-l02', 3],
  ['w01-l03', 3],
  ['w01-l05', 5],
  ['w01-l07', 4],
  ['w01-l10', 5],
  ['w01-l12', 4],
  ['w01-l13', 10],
  ['w01-boss', 9],
  ['w02-l01', 2],
  ['w02-l03', 2],
  ['w02-l05', 3],
  ['w02-l06', 4],
  ['w02-l08', 5],
  ['w02-l12', 4],
  ['w02-l13', 4],
  ['w02-l14', 5],
  ['w02-l16', 5],
  ['w02-l17', 7],
  ['w02-l19', 6],
  ['w02-boss', 6],
];

describe('findShortestPrograms', () => {
  it.each(BUILD_PARS)('%s: nothing shorter than par %i wins', async (id, par) => {
    const level = await loadLevel(id);
    expect(level.par).toBe(par);
    const result = findShortestPrograms(level);
    expect(result.complete).toBe(true);
    expect(result.minBlocks).toBe(par);
    expect(result.count).toBeGreaterThan(0);
    expect(result.examples.length).toBeGreaterThan(0);
    expect(result.mismatches).toEqual([]);
    expect(result.unsupported).toEqual([]);
  });

  it('counts every shortest program and is deterministic', async () => {
    const level = await loadLevel('w02-l16');
    const first = findShortestPrograms(level);
    expect(first.count).toBe(3);
    // One example per merged search state: the three differ only inside the loop.
    expect(first.examples.map(formatProgram)).toEqual(['repeat 4 [walk, crouch, jump], jump']);
    expect(findShortestPrograms(level)).toEqual(first);
  });

  it('finds a smaller program when par is too high', async () => {
    const level = { ...(await loadLevel('w01-l05')), par: 7 };
    const result = findShortestPrograms(level);
    expect(result.minBlocks).toBe(5);
    expect(result.maxSize).toBe(7);
  });

  it('tries nested loops, and no loop at all with maxDepth 0', async () => {
    const level = await loadLevel('w02-l06');
    expect(findShortestPrograms(level).examples.map(formatProgram)).toContain(
      'repeat 2 [jump, repeat 5 [crouch]]',
    );
    const flat = findShortestPrograms(level, { maxDepth: 0 });
    expect(flat).toMatchObject({ complete: true, minBlocks: null, searchedSize: 4 });
  });

  it('stops on the work budget or shouldStop and says so', async () => {
    const level = await loadLevel('w02-l17');
    const budget = findShortestPrograms(level, { maxWork: 1000 });
    expect(budget.complete).toBe(false);
    expect(budget.searchedSize).toBeLessThan(7);
    const stopped = findShortestPrograms(level, { shouldStop: () => true });
    expect(stopped.complete).toBe(false);
  });

  it('never searches beyond maxBlocks', async () => {
    const level = await loadLevel('w02-l14');
    expect(findShortestPrograms(level, { maxSize: 20 }).maxSize).toBe(6);
  });

  it('rejects modes without a program', async () => {
    const level = await loadLevel('w01-l04');
    expect(() => findShortestPrograms(level)).toThrow('mode predict has no program to search');
  });
});

describe('findFixes', () => {
  it('w01-l09: one missing jump, a single fix', async () => {
    const result = findFixes(await loadLevel('w01-l09'));
    expect(result).toMatchObject({ minEdits: 1, count: 1, complete: true, mismatches: [] });
  });

  it('w01-l14: two edits, the parEdits of the level', async () => {
    const result = findFixes(await loadLevel('w01-l14'));
    expect(result).toMatchObject({ minEdits: 2, complete: true, mismatches: [] });
  });

  it('w02-l07: one edit, ignoring fixes that only add an empty loop', async () => {
    const result = findFixes(await loadLevel('w02-l07'));
    expect(result).toMatchObject({ minEdits: 1, count: 1, complete: true });
    expect(result.examples.map(formatProgram)).toEqual(['repeat 3 [crouch, jump], jump']);
  });

  it('w02-l11: reports a fix with fewer edits than parEdits', async () => {
    const level = await loadLevel('w02-l11');
    expect(level.parEdits).toBe(2);
    const result = findFixes(level);
    expect(result.minEdits).toBe(1);
    expect(result.examples.map(formatProgram)).toContain('kick, repeat 3 [kick, walk], jump');
  });

  it('keeps or deletes blocks that are not in the toolbox, never adds them', async () => {
    const level = { ...(await loadLevel('w01-l09')), toolbox: ['runner_walk', 'runner_jump'] };
    const result = findFixes(level);
    expect(result).toMatchObject({ minEdits: 1, count: 1, complete: true, mismatches: [] });
    expect(formatProgram(result.examples[0] ?? [])).toBe('walk, jump, crouch, walk, jump, walk');
  });

  it('stops on the work budget', async () => {
    const result = findFixes(await loadLevel('w01-l14'), { maxWork: 100 });
    expect(result).toMatchObject({ minEdits: null, complete: false, searchedEdits: 0 });
  });

  it('only searches bughunt levels', async () => {
    const level = await loadLevel('w01-l02');
    expect(() => findFixes(level)).toThrow('only bughunt levels');
  });
});
