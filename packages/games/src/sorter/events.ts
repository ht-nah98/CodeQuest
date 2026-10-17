/**
 * Shelf events, in the order a run emits them (game-kind-sdk.md §1.5). Pure JSON data: the stage
 * replays a run from `config` + events. Places are 1…n (books) and n + 1 (the flag). Book
 * questions log the engine's `sense` event (ADR-0018), then `ask` for the stage; past the budget
 * they log `outOfQuestions` instead.
 */
export type SorterEvent =
  /** The hand moves one place right, or back to the first book (`về đầu kệ`). */
  | { type: 'move'; blockId: string | null; from: number; to: number }
  /** The books at `at` and `at + 1` change places; `books` is the shelf afterwards. */
  | { type: 'swap'; blockId: string | null; at: number; books: number[] }
  /** `sang phải` on the flag: the hand stays at `at`; crash OFF_SHELF. */
  | { type: 'offShelf'; blockId: string | null; at: number }
  /** `đổi chỗ` on the last book or the flag: nothing on the right; crash NO_BOOK_RIGHT. */
  | { type: 'noBookRight'; blockId: string | null; at: number }
  /**
   * A book question was answered (right after the engine's `sense` event of the question block):
   * `pair` for `lớn hơn bên phải?` (books `at` and `at + 1`), else `sách này …?` (book `at`, or
   * nothing at the flag). `questionsLeft` is the budget after it (null without `maxQuestions`).
   * Lets the stage light the compared books and count down; `hết kệ?` (free) emits nothing.
   */
  | {
      type: 'ask';
      blockId: string | null;
      at: number;
      pair: boolean;
      answer: boolean;
      questionsLeft: number | null;
    }
  /** A book question past `maxQuestions`, before it is answered; crash OUT_OF_QUESTIONS. */
  | { type: 'outOfQuestions'; blockId: string | null; at: number };

export type SorterEventType = SorterEvent['type'];
