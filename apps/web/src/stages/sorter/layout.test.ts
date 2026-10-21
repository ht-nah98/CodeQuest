// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { SorterConfig, SorterEvent } from '@codequest/games';
import {
  applyEvent,
  bookHeight,
  HUD_BAND,
  layoutShelf,
  replayShelf,
  startState,
  type ShelfState,
} from './layout';

const CONFIG: SorterConfig = { books: [3, 1, 2], goal: { sorted: true }, maxQuestions: 5 };

const ask = (at: number, pair: boolean, left: number | null): SorterEvent => ({
  type: 'ask',
  blockId: 'q1',
  at,
  pair,
  answer: true,
  questionsLeft: left,
});

describe('bookHeight', () => {
  it('gives 1 the shortest book and 9 the tallest', () => {
    expect(bookHeight(1, 200)).toBeLessThan(bookHeight(9, 200));
    expect(bookHeight(9, 200)).toBe(200);
  });

  it('is monotonic, so a taller book always carries a bigger number', () => {
    const heights = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => bookHeight(n, 240));
    for (const [i, height] of heights.entries()) {
      if (i > 0) expect(height).toBeGreaterThan(heights[i - 1] ?? 0);
    }
  });

  it('clamps a number outside 1…9 instead of drawing off the stage', () => {
    expect(bookHeight(0, 200)).toBe(bookHeight(1, 200));
    expect(bookHeight(99, 200)).toBe(bookHeight(9, 200));
  });
});

describe('layoutShelf', () => {
  it('centres the shelf and leaves one slot for the flag past the last book', () => {
    const l = layoutShelf([3, 1, 2], 1280, 600);
    expect(l.books).toHaveLength(3);
    expect(l.places).toHaveLength(4);
    expect(l.flagX).toBe(l.places[3]);
    const left = l.books[0]?.cx ?? 0;
    const right = l.flagX;
    expect(Math.abs((left + right) / 2 - 640)).toBeLessThanOrEqual(2);
  });

  it('stands every book on the same plank, so tops can be compared', () => {
    const l = layoutShelf([9, 1, 5], 1280, 600);
    for (const book of l.books) expect(book.y + book.height).toBe(l.plankY);
    expect(l.books[0]?.height).toBeGreaterThan(l.books[1]?.height ?? 0);
  });

  it('fits seven books on the smallest laptop without overlapping', () => {
    const l = layoutShelf([1, 2, 3, 4, 5, 6, 7], 1280, 560);
    for (const [i, book] of l.books.entries()) {
      if (i === 0) continue;
      const before = l.books[i - 1];
      expect(book.x).toBeGreaterThan((before?.x ?? 0) + (before?.width ?? 0));
    }
    expect(l.books.at(-1)?.y).toBeGreaterThan(0);
  });

  it('keeps the hand clear of the HUD chips and above the tallest book', () => {
    const l = layoutShelf([9, 9], 1280, 600);
    expect(l.handY).toBeGreaterThan(HUD_BAND);
    expect(l.handY).toBeLessThan(l.books[0]?.y ?? 0);
    expect(l.plankY).toBeLessThan(600);
  });
});

describe('applyEvent', () => {
  const start = startState(CONFIG);

  it('starts with the config shelf, the hand on the first book and the full budget', () => {
    expect(start).toEqual<ShelfState>({
      books: [3, 1, 2],
      hand: 1,
      questionsLeft: 5,
      swaps: 0,
      asking: [],
    });
  });

  it('moves the hand and clears what a question lit', () => {
    const lit = applyEvent(start, ask(1, true, 4));
    expect(lit.asking).toEqual([1, 2]);
    const moved = applyEvent(lit, { type: 'move', blockId: 'm1', from: 1, to: 2 });
    expect(moved).toMatchObject({ hand: 2, asking: [] });
  });

  it('takes the shelf of a swap from the event and counts it', () => {
    const swapped = applyEvent(start, { type: 'swap', blockId: 's1', at: 1, books: [1, 3, 2] });
    expect(swapped).toMatchObject({ books: [1, 3, 2], swaps: 1 });
    // The hand stays where it was (ADR-0025 §3).
    expect(swapped.hand).toBe(1);
  });

  it('lights one book for `sách này …?` and the pair for `lớn hơn bên phải?`', () => {
    expect(applyEvent(start, ask(2, false, 3)).asking).toEqual([2]);
    expect(applyEvent(start, ask(2, true, 3)).asking).toEqual([2, 3]);
  });

  it('counts the budget down from the event, never on its own', () => {
    const after = applyEvent(start, ask(1, false, 2));
    expect(after.questionsLeft).toBe(2);
  });

  it('leaves no budget chip on a level without one', () => {
    const free = startState({ books: [2, 1], goal: { sorted: true } });
    expect(free.questionsLeft).toBeNull();
    expect(applyEvent(free, ask(1, true, null)).questionsLeft).toBeNull();
  });

  it('parks the hand where a crash happened', () => {
    const off = applyEvent(start, { type: 'offShelf', blockId: 'r1', at: 4 });
    expect(off).toMatchObject({ hand: 4, asking: [] });
  });
});

describe('replayShelf', () => {
  it('ends where the run ended: sorted shelf, hand at the flag, two swaps', () => {
    const events: SorterEvent[] = [
      ask(1, true, 4),
      { type: 'swap', blockId: 's1', at: 1, books: [1, 3, 2] },
      { type: 'move', blockId: 'm1', from: 1, to: 2 },
      ask(2, true, 3),
      { type: 'swap', blockId: 's2', at: 2, books: [1, 2, 3] },
      { type: 'move', blockId: 'm2', from: 2, to: 3 },
      { type: 'move', blockId: 'm3', from: 3, to: 4 },
    ];
    expect(replayShelf(CONFIG, events)).toMatchObject({
      books: [1, 2, 3],
      hand: 4,
      swaps: 2,
      questionsLeft: 3,
    });
  });

  it('with no events is the start of the level', () => {
    expect(replayShelf(CONFIG, [])).toEqual(startState(CONFIG));
  });
});
