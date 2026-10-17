import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LevelSchema, type Level } from '@codequest/content-schema';
import { runLevel } from '@codequest/engine';
import { getGameKind } from '@codequest/games';
import { describe, expect, it } from 'vitest';
import {
  checkSorterLevel,
  questionsPerMap,
  SORTER_TRAPS,
  sorterLevelWarnings,
  sorterProgram,
  sorterTrapWarnings,
} from './sorter';

// Rule 27 (P5-02, ADR-0025 §7): sorter levels beyond the config schema, and the S1 / S2 traps.

const SANDBOX = new URL('../../../content/worlds/_sandbox/levels/', import.meta.url);
const sandbox = (id: string): Level =>
  LevelSchema.parse(
    JSON.parse(readFileSync(fileURLToPath(new URL(`${id}.json`, SANDBOX)), 'utf8')),
  );

const errors = (level: Level): string[] =>
  checkSorterLevel('level.json', level).map((issue) => {
    expect(issue.rule).toBe(27);
    return issue.message;
  });

const bubble = sandbox('sorter-bubble');
const find = sandbox('sorter-find');

describe('rule 27 (sorter levels)', () => {
  it.each(['sorter-find', 'sorter-count', 'sorter-bubble'])('accepts the sample %s', (id) => {
    const level = sandbox(id);
    expect(errors(level)).toEqual([]);
    expect(sorterLevelWarnings('level.json', level)).toEqual([]);
    expect(sorterTrapWarnings('level.json', level)).toEqual([]);
  });

  it('ignores other kinds and leaves a bad config to rule 1', () => {
    expect(errors({ ...bubble, kind: 'maze' })).toEqual([]);
    expect(errors({ ...bubble, config: { books: [1], goal: {} } })).toEqual([]);
  });

  it('rejects a shelf to sort that is already sorted, or has a number twice', () => {
    const sorted = { ...bubble, variants: [{ books: [1, 2, 3], goal: { sorted: true } }] };
    expect(errors(sorted).join()).toContain('variants[0]: the shelf is already sorted');
    const twice = { ...bubble, config: { books: [3, 1, 3], goal: { sorted: true } } };
    expect(errors(twice).join()).toContain('config: a shelf to sort has two books');
  });

  it('rejects a book to find that one map does not have', () => {
    const missing = { ...find, variants: [{ books: [2, 5, 1], goal: { find: 7 } }] };
    expect(errors(missing).join()).toContain('variants[0]: book 7 to find is not on the shelf');
  });

  it('rejects an unpinned "sách này …?" in the toolbox', () => {
    const open = { ...find, toolbox: ['sorter_right', 'sorter_book_is', 'cq_repeat_until'] };
    expect(errors(open).join()).toContain('must pin OP and NUM');
  });

  it('checks the question budget against the solution, on every map', () => {
    // 2 passes of 2 questions = 4 questions on every shelf.
    const withBudget = (n: number): Level => ({
      ...bubble,
      config: { ...(bubble.config as object), maxQuestions: n },
      variants: (bubble.variants ?? []).map((map) => ({ ...(map as object), maxQuestions: n })),
    });
    expect(errors(withBudget(3)).join()).toContain('asks 4 questions > maxQuestions 3');
    expect(errors(withBudget(4))).toEqual([]);
    expect(sorterLevelWarnings('level.json', withBudget(4))).toEqual([]);
    expect(sorterLevelWarnings('level.json', withBudget(6))[0]?.message).toContain(
      'loose on every map (6 for 4, 6 for 4, 6 for 4',
    );
  });
});

describe('rule 27 (e): sort then find', () => {
  const sortFind = (books: number[]) => ({ books, goal: { sorted: true, find: 4 } });
  const level = (maps: number[][]): Level => ({
    ...bubble,
    config: sortFind(maps[0] ?? []),
    variants: maps.slice(1).map(sortFind),
  });

  it('wants the book to find at different places once the shelves are sorted', () => {
    // Sorted: [2 4 6 9] (place 2) and [1 2 4 5 8] (place 3): a search is needed.
    expect(
      errors(
        level([
          [4, 9, 2, 6],
          [5, 2, 4, 1, 8],
        ]),
      ),
    ).toEqual([]);
    // Sorted: [2 4 6 9] and [3 4 5 8]: place 2 on both, so "sang phải" once would do.
    expect(
      errors(
        level([
          [4, 9, 2, 6],
          [5, 8, 4, 3],
        ]),
      ).join(),
    ).toContain('same place on two sorted shelves (places 2, 2)');
  });
});

describe('sorter short programs and traps', () => {
  it('refuses unknown text and unbalanced brackets', () => {
    expect(() => sorterProgram('REP2[R')).toThrow(/unbalanced/);
    expect(() => sorterProgram('R]')).toThrow(/unbalanced/);
    expect(() => sorterProgram('R X W')).toThrow(/unknown text "X"/);
    expect(() => sorterProgram('REP2[ IFB[W] R ]')).not.toThrow();
  });

  it('wants an S1 trap to win one shelf', () => {
    // The find trap `REP4[R]` on 3-book shelves walks off every one: no S1 trap there.
    const nothing = sorterTrapWarnings('l.json', { ...bubble, id: 'sorter-find' });
    expect(nothing.map((issue) => issue.message).join()).toContain('wins no map');
  });

  it('writes the short programs as workspaces the engine runs', () => {
    const kind = getGameKind('sorter');
    if (kind === undefined) throw new Error('sorter is not registered');
    const workspace = sorterProgram('REP2[S REP2[IFB[W] R]]');
    const outcome = runLevel({ kind, level: bubble, workspace });
    expect(outcome.result).toBe('success');
    // 2 passes × 2 questions on each of the 3 shelves; "hết kệ?" would not count.
    expect(questionsPerMap(outcome, workspace)).toEqual([4, 4, 4]);
  });

  it('reports a missing trap and a trap that does not lose as declared', () => {
    expect(sorterTrapWarnings('l.json', { ...bubble, id: 'sorter-nothing' })[0]?.message).toContain(
      'declare',
    );
    expect([...SORTER_TRAPS.keys()]).toContain('sorter-bubble');
  });
});
