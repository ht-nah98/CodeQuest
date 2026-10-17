import type { Level, WorkspaceJson } from '@codequest/content-schema';
import { runLevel, type RunOutcome } from '@codequest/engine';
import { describe, expect, it } from 'vitest';
import { getGameKind } from '../index';
import { sorter, sorterConfigSchema, type SorterConfig, type SorterEvent } from './index';

type Block = Record<string, unknown>;
let ids = 0;
const id = (prefix: string): string => `${prefix}${String(++ids)}`;

function chain(blocks: readonly Block[]): Block | undefined {
  let next: Block | undefined;
  for (const block of [...blocks].reverse()) {
    next = next === undefined ? block : { ...block, next: { block: next } };
  }
  return next;
}

function program(...blocks: Block[]): WorkspaceJson {
  const first = chain(blocks);
  const start = {
    type: 'cq_start',
    id: 'start',
    ...(first !== undefined && { next: { block: first } }),
  };
  return { blocks: { languageVersion: 0, blocks: [start] } };
}

const right = (): Block => ({ type: 'sorter_right', id: id('r') });
const toStart = (): Block => ({ type: 'sorter_to_start', id: id('s') });
const swap = (): Block => ({ type: 'sorter_swap', id: id('w') });
const bigger = (): Block => ({ type: 'sorter_bigger', id: id('b') });
const atEnd = (): Block => ({ type: 'sorter_at_end', id: id('e') });
const bookIs = (op: 'EQ' | 'GT' | 'LT', num: number): Block => ({
  type: 'sorter_book_is',
  id: id('q'),
  fields: { OP: op, NUM: num },
});
const body = (blocks: readonly Block[]) => {
  const first = chain(blocks);
  return first === undefined ? {} : { DO: { block: first } };
};
const repeat = (times: number, ...blocks: Block[]): Block => ({
  type: 'cq_repeat',
  id: id('loop'),
  fields: { TIMES: times },
  inputs: body(blocks),
});
const until = (cond: Block, ...blocks: Block[]): Block => ({
  type: 'cq_repeat_until',
  id: id('until'),
  inputs: { COND: { block: cond }, ...body(blocks) },
});
const add = (box: string): Block => ({
  type: 'cq_var_add',
  id: id('v'),
  fields: { VAR: box, NUM: 1 },
});
const when = (cond: Block, ...blocks: Block[]): Block => ({
  type: 'cq_if',
  id: id('if'),
  inputs: { COND: { block: cond }, ...body(blocks) },
});
/** One pass: `lặp n {nếu lớn hơn {đổi chỗ}, sang phải}`. */
const pass = (n: number): Block => repeat(n, when(bigger(), swap()), right());

function level(config: SorterConfig, overrides: Partial<Level> = {}): Level {
  return {
    id: 'sorter-test',
    worldId: '_sandbox',
    stage: 'practice',
    kind: 'sorter',
    mode: 'build',
    title: 'Kệ sách',
    objective: 'Xếp kệ',
    learningGoal: 'Xếp',
    toolbox: [],
    hints: [],
    config,
    ...overrides,
  };
}

function run(config: SorterConfig, ...blocks: Block[]): RunOutcome<SorterEvent> {
  return runLevel({ kind: sorter, level: level(config), workspace: program(...blocks) });
}

/** The predict key of a program, as a predict level gives it. */
function key(config: SorterConfig, ...blocks: Block[]): string | undefined {
  const workspace = program(...blocks);
  return runLevel({
    kind: sorter,
    level: level(config, { mode: 'predict', initialWorkspace: workspace }),
    workspace,
  }).answerKey;
}

const shelf = (books: number[], goal: SorterConfig['goal'], maxQuestions?: number) =>
  ({ books, goal, ...(maxQuestions !== undefined && { maxQuestions }) }) as SorterConfig;
const questions = (outcome: RunOutcome<SorterEvent>): number =>
  outcome.events.filter((event) => event.type === 'sense').length;

describe('sorter config', () => {
  it('accepts shelves of 2–7 books numbered 1–9 with a goal', () => {
    expect(sorterConfigSchema.safeParse(shelf([3, 1, 2], { sorted: true })).success).toBe(true);
    expect(sorterConfigSchema.safeParse(shelf([3, 1], { find: 1 }, 60)).success).toBe(true);
  });

  it.each([
    ['one book', shelf([3], { sorted: true })],
    ['eight books', shelf([1, 2, 3, 4, 5, 6, 7, 8], { end: true })],
    ['a book 10', shelf([10, 1], { end: true })],
    ['no goal', shelf([2, 1], {})],
    ['find with end', { books: [2, 1], goal: { find: 1, end: true } }],
    ['a budget of 0', shelf([2, 1], { sorted: true }, 0)],
  ])('rejects %s', (_name, config) => {
    expect(sorterConfigSchema.safeParse(config).success).toBe(false);
  });
});

describe('sorter curriculum programs (curriculum.md §6.5)', () => {
  it('l03: the first 5 found after one step is the second 5', () => {
    const config = shelf([5, 2, 5, 3, 1], { find: 5 });
    expect(key(config, right(), until(bookIs('EQ', 5), right()))).toBe('shelf:5,2,5,3,1@3');
  });

  it('l12: a sorted shelf still runs out of questions on the 6th', () => {
    const config = shelf([4, 3, 1, 2], { sorted: true }, 5);
    const outcome = run(config, pass(3), toStart(), pass(3));
    expect(outcome.reasonCode).toBe('OUT_OF_QUESTIONS');
    const swaps = outcome.events.filter((event) => event.type === 'swap');
    expect(swaps.at(-1)).toMatchObject({ books: [1, 2, 3, 4] });
    expect(key(config, pass(3), toStart(), pass(3))).toBe('crash:OUT_OF_QUESTIONS@3');
  });

  it('l09: one pass is not always enough', () => {
    expect(key(shelf([4, 2, 5, 1, 3], { sorted: true }), pass(4))).toBe('shelf:2,4,1,3,5@5');
  });

  it('l11: two passes leave a reversed shelf unsorted', () => {
    const config = shelf([5, 4, 3, 2, 1], { sorted: true });
    const twice = [repeat(2, toStart(), pass(4))];
    expect(key(config, ...twice)).toBe('shelf:3,2,1,4,5@5');
    expect(run(config, ...twice).reasonCode).toBe('NOT_SORTED');
  });

  it('l13: shorter passes use 10 questions; full bubble sort runs out on the 11th', () => {
    const config = shelf([5, 4, 3, 2, 1], { sorted: true }, 10);
    const shorter = run(
      config,
      toStart(),
      pass(4),
      toStart(),
      pass(3),
      toStart(),
      pass(2),
      toStart(),
      pass(1),
    );
    expect(shorter.result).toBe('success');
    expect(questions(shorter)).toBe(10);
    const bubble = run(config, repeat(4, toStart(), pass(4)));
    expect(bubble.reasonCode).toBe('OUT_OF_QUESTIONS');
    expect(questions(bubble)).toBe(10);
  });

  it('boss: an inner loop of 5 walks off a 4-book shelf', () => {
    const config = shelf([4, 9, 2, 6], { sorted: true, find: 4 });
    const outcome = run(config, repeat(5, toStart(), pass(5)));
    expect(outcome.reasonCode).toBe('OFF_SHELF');
    expect(outcome.events.at(-1)).toMatchObject({ type: 'offShelf', at: 5 });
  });

  it('boss: sort with "until the end", then find 4, on shelves of different lengths', () => {
    const sortThenFind = [
      repeat(5, toStart(), until(atEnd(), when(bigger(), swap()), right())),
      toStart(),
      until(bookIs('EQ', 4), right()),
    ];
    for (const books of [
      [4, 9, 2, 6],
      [5, 2, 4, 1, 8],
      [6, 4, 1, 5, 3, 2],
    ]) {
      expect(run(shelf(books, { sorted: true, find: 4 }), ...sortThenFind).result).toBe('success');
    }
  });
});

describe('sorter blocks', () => {
  it('have the labels and tooltips of curriculum.md §6.5, word for word', () => {
    expect(
      sorter.blocks.map((block) => [block.type, block.json.message0, block.json.tooltip]),
    ).toEqual([
      ['sorter_right', 'sang phải', 'Sang phải: tay sang sách kế bên phải'],
      ['sorter_to_start', 'về đầu kệ', 'Về đầu kệ: tay về sách thứ nhất'],
      ['sorter_swap', 'đổi chỗ', 'Đổi chỗ: sách này đổi với sách bên phải'],
      ['sorter_book_is', 'sách này %1 %2?', 'Sách này = 7? Đúng thì ✔, sai thì ✘'],
      ['sorter_bigger', 'sách này lớn hơn bên phải?', 'Sách này lớn hơn bên phải? Lớn hơn thì ✔'],
      ['sorter_at_end', 'hết kệ?', 'Hết kệ? Tay ở cờ cuối kệ thì ✔'],
    ]);
    expect(sorter.blocks.every((block) => block.category === 'sorter')).toBe(true);
  });
});

describe('sorter rules', () => {
  it('walks right to the flag, and off the shelf from there', () => {
    const config = shelf([2, 1], { end: true });
    expect(run(config, right(), right()).result).toBe('success');
    const off = run(config, right(), right(), right());
    expect(off.reasonCode).toBe('OFF_SHELF');
    expect(off.events.at(-1)).toMatchObject({ type: 'offShelf', at: 3 });
  });

  it('swaps a book with its right neighbour and keeps the hand still', () => {
    const outcome = run(shelf([2, 1, 3], { sorted: true }), swap());
    expect(outcome.result).toBe('success');
    expect(outcome.events.at(-1)).toMatchObject({ type: 'swap', at: 1, books: [1, 2, 3] });
  });

  it('has no book to swap with at the last book and at the flag', () => {
    const config = shelf([1, 3, 2], { sorted: true });
    expect(run(config, right(), right(), swap()).reasonCode).toBe('NO_BOOK_RIGHT');
    expect(run(config, right(), right(), right(), swap()).reasonCode).toBe('NO_BOOK_RIGHT');
  });

  it('answers ✘ about books that are not there, and about the last book', () => {
    const config = shelf([3, 1], { end: true });
    // At the flag: no book, so every comparison is ✘.
    const atFlag = run(config, right(), right(), when(bookIs('LT', 9), swap()));
    expect(atFlag.result).toBe('success');
    // The last book has no right neighbour: "bigger" is ✘, so no swap is tried.
    expect(run(config, right(), when(bigger(), swap()), right()).result).toBe('success');
  });

  it('compares with =, > and <', () => {
    const find = (op: 'EQ' | 'GT' | 'LT', n: number) =>
      key(shelf([4, 2, 9], { end: true }), until(bookIs(op, n), right()));
    expect(find('EQ', 9)).toBe('shelf:4,2,9@3');
    expect(find('GT', 5)).toBe('shelf:4,2,9@3');
    expect(find('LT', 3)).toBe('shelf:4,2,9@2');
  });

  it('counts book questions only; "hết kệ?" is free', () => {
    const config = shelf([1, 2, 3], { end: true }, 1);
    expect(run(config, until(atEnd(), right())).result).toBe('success');
    const twice = run(config, when(bigger()), when(bigger()));
    expect(twice.reasonCode).toBe('OUT_OF_QUESTIONS');
    expect(twice.events.at(-1)).toMatchObject({ type: 'outOfQuestions', at: 1 });
  });

  it('logs each book question for the stage right after its sense event', () => {
    const outcome = run(
      shelf([3, 1, 2], { sorted: true }, 5),
      when(bigger(), swap()),
      when(atEnd()),
    );
    const types = outcome.events.filter((event) => event.type !== 'highlight').map((e) => e.type);
    // "hết kệ?" is free and silent: only its sense event.
    expect(types).toEqual(['sense', 'ask', 'swap', 'sense']);
    expect(outcome.events.find((event) => event.type === 'ask')).toMatchObject({
      at: 1,
      pair: true,
      answer: true,
      questionsLeft: 4,
    });
  });

  it('refuses an unknown comparison (Blockly never sends one; the API still checks)', () => {
    const state = sorter.createState(shelf([3, 1], { end: true }), () => 0);
    const api = sorter.createApi({
      state,
      emit: () => undefined,
      sense: (value) => value,
      stop: () => {
        throw new Error('stop');
      },
      rng: () => 0,
      level: level(shelf([3, 1], { end: true })),
    });
    expect(() => api['bookIs']?.('NE', 3, 'q')).toThrow(/unknown comparison/);
  });

  it('does not find a book with the hand on the flag', () => {
    expect(run(shelf([3, 1], { find: 1 }), right(), right()).reasonCode).toBe('NOT_FOUND');
  });

  it('keys a timeout, and adds the box suffix on a level with boxes', () => {
    expect(key(shelf([3, 1], { end: true }), until(atEnd()))).toBe('timeout');
    const workspace = program(until(atEnd(), when(bookIs('GT', 5), add('big')), right()));
    const outcome = runLevel({
      kind: sorter,
      level: level(shelf([7, 2, 9, 4], { end: true }), {
        mode: 'predict',
        initialWorkspace: workspace,
        variables: [{ id: 'big', name: 'số sách lớn' }],
      }),
      workspace,
    });
    expect(outcome.answerKey).toBe('shelf:7,2,9,4@5#big=2');
  });

  it('logs no ask once the questions have run out', () => {
    const outcome = run(shelf([3, 1, 2], { sorted: true }, 1), when(bigger()), when(bigger()));
    const types = outcome.events.filter((event) => event.type !== 'highlight').map((e) => e.type);
    expect(types).toEqual(['sense', 'ask', 'outOfQuestions']);
  });

  it('has nothing to act out for "về đầu kệ" at the first book', () => {
    const outcome = run(shelf([2, 1], { end: true }), toStart());
    expect(outcome.events.filter((event) => event.type !== 'highlight')).toEqual([]);
  });

  it('checks sorted, then find, then end', () => {
    expect(run(shelf([2, 1], { sorted: true, find: 2 }), toStart()).reasonCode).toBe('NOT_SORTED');
    expect(run(shelf([1, 2], { sorted: true, find: 2 }), toStart()).reasonCode).toBe('NOT_FOUND');
    expect(run(shelf([1, 2], { end: true }), toStart()).reasonCode).toBe('NOT_AT_END');
  });

  it('keeps the question counter out of the state of a level without a budget', () => {
    expect(sorter.createState(shelf([2, 1], { sorted: true }), () => 0)).toEqual({
      books: [2, 1],
      p: 1,
    });
  });

  it('is deterministic and registered', () => {
    const config = shelf([3, 5, 1, 4, 2], { sorted: true });
    const program4 = [repeat(4, toStart(), pass(4))];
    expect(run(config, ...program4)).toEqual(run(config, ...program4));
    expect(getGameKind('sorter')).toBe(sorter);
    expect(sorter.reasonCodes).toHaveLength(6);
  });
});
