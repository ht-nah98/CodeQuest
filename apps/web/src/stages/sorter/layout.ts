// Pixi-free geometry and replay model of the bookshelf stage (ADR-0025, stage-rendering.md §2),
// unit tested in layout.test.ts: how a shelf of 2…7 books fits the stage under its HUD, how tall
// each book stands, and what the shelf looks like as a run's events arrive.
import type { SorterConfig, SorterEvent } from '@codequest/games';
import { SORTER_MAX_NUMBER } from '@codequest/games';

/** Free px kept around the shelf. */
const MARGIN_PX = 16;
/** Strip along the top for the HUD chips (questions left, swaps). */
export const HUD_BAND = 44;
/** Strip at the bottom for the place numbers under the shelf. */
export const LABEL_STRIP = 26;
/** The hand hangs above the books; this much room is kept for it. */
export const HAND_BAND = 56;

/** A book slot, in px: wide enough for two digits, narrow enough that seven fit at 1280. */
const MIN_SLOT_PX = 56;
const MAX_SLOT_PX = 132;
/** A book this tall carries the number 1; the tallest (9) is `MIN_BOOK_PX + BOOK_STEP_PX * 8`. */
const MIN_BOOK_PX = 56;
const MAX_BOOK_PX = 260;
/** The shelf plank the books stand on. */
export const PLANK_PX = 14;

export interface BookPlace {
  /** 1…n, left to right. */
  place: number;
  /** Centre of the slot. */
  cx: number;
  /** Left edge and width of the book itself (narrower than the slot, so books do not touch). */
  x: number;
  width: number;
  /** Top of the book; it stands on the plank. */
  y: number;
  height: number;
}

export interface ShelfLayout {
  /** Height of a book carrying the biggest number, in px; every book is scaled against it. */
  tallest: number;
  /** Slot centres for 1…n books plus the flag at n + 1. */
  places: number[];
  books: BookPlace[];
  /** Slot width, including the gaps on both sides. */
  slot: number;
  /** y of the top of the plank: where every book's foot sits. */
  plankY: number;
  /** Left edge and width of the plank. */
  plankX: number;
  plankWidth: number;
  /** Centre of the flag pole at place n + 1. */
  flagX: number;
  /** Where the hand hangs (its tip points down at this y). */
  handY: number;
}

/** How tall a book with this number stands, in px. Bigger number, taller book (ADR-0025 §1). */
export function bookHeight(number: number, tallest: number): number {
  const steps = SORTER_MAX_NUMBER - 1;
  const clamped = Math.min(Math.max(number, 1), SORTER_MAX_NUMBER);
  const unit = (tallest - MIN_BOOK_PX) / steps;
  return Math.round(MIN_BOOK_PX + unit * (clamped - 1));
}

/**
 * Lays a shelf of `books` out inside a stage of `width` × `height`. The shelf is centred, the
 * flag sits one slot past the last book, and the books' feet share one plank, so a child compares
 * heights by looking along the tops.
 */
export function layoutShelf(books: readonly number[], width: number, height: number): ShelfLayout {
  const slots = books.length + 1; // books + the flag
  const usable = Math.max(width - MARGIN_PX * 2, MIN_SLOT_PX);
  const slot = Math.max(MIN_SLOT_PX, Math.min(MAX_SLOT_PX, Math.floor(usable / slots)));
  const shelfWidth = slot * slots;
  const left = Math.round((width - shelfWidth) / 2);

  const bodyTop = HUD_BAND + HAND_BAND;
  const bodyBottom = height - LABEL_STRIP - PLANK_PX;
  const tallest = Math.max(MIN_BOOK_PX, Math.min(MAX_BOOK_PX, bodyBottom - bodyTop));
  const plankY = bodyBottom;

  const places = Array.from({ length: slots }, (_, i) => left + slot * i + Math.round(slot / 2));
  const bookWidth = Math.round(slot * 0.74);

  return {
    tallest,
    places,
    slot,
    plankY,
    plankX: left,
    plankWidth: shelfWidth,
    flagX: places[books.length] ?? left,
    // Below the HUD chips (they share the top strip) and above the tallest book.
    handY: HUD_BAND + 40,
    books: books.map((number, i) => {
      const cx = places[i] ?? left;
      const bookTall = bookHeight(number, tallest);
      return {
        place: i + 1,
        cx,
        x: Math.round(cx - bookWidth / 2),
        width: bookWidth,
        y: plankY - bookTall,
        height: bookTall,
      };
    }),
  };
}

/** What the shelf shows at one point of a replay. */
export interface ShelfState {
  books: number[];
  /** 1…n for a book, n + 1 for the flag. */
  hand: number;
  /** Book questions left, or null on a level without a budget. */
  questionsLeft: number | null;
  /** How many swaps the run has done, for the HUD chip. */
  swaps: number;
  /** Places lit by the question just asked (one book, or a compared pair), empty between asks. */
  asking: number[];
}

export function startState(config: SorterConfig): ShelfState {
  return {
    books: [...config.books],
    hand: 1,
    questionsLeft: config.maxQuestions ?? null,
    swaps: 0,
    asking: [],
  };
}

/**
 * The shelf after one event. Pure, so the stage and its tests agree on what a run looks like at
 * every step without running PixiJS.
 */
export function applyEvent(state: ShelfState, event: SorterEvent): ShelfState {
  switch (event.type) {
    case 'move':
      return { ...state, hand: event.to, asking: [] };
    case 'swap':
      return { ...state, books: [...event.books], swaps: state.swaps + 1, asking: [] };
    case 'ask':
      return {
        ...state,
        questionsLeft: event.questionsLeft,
        asking: event.pair ? [event.at, event.at + 1] : [event.at],
      };
    case 'offShelf':
    case 'noBookRight':
    case 'outOfQuestions':
      return { ...state, hand: event.at, asking: [] };
  }
}

/** Replays a whole run from the start, for tests and for a stage that jumps to an event. */
export function replayShelf(config: SorterConfig, events: readonly SorterEvent[]): ShelfState {
  return events.reduce<ShelfState>(applyEvent, startState(config));
}
