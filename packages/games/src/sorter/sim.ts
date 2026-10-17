import type { GameKindApi, Primitive, SimContext } from '@codequest/engine';
import { SORTER_OPS, type SorterOp } from './config';
import type { SorterEvent } from './events';
import { flagOf, type SorterState } from './state';

type SorterContext = SimContext<SorterState, SorterEvent>;

function opOf(value: Primitive): SorterOp {
  const op = SORTER_OPS.find((candidate) => candidate === value);
  if (op === undefined) throw new Error(`bookIs: unknown comparison ${String(value)}`);
  return op;
}

/**
 * One book question (`sách này …?`, `lớn hơn bên phải?`): on a level with `maxQuestions`, the
 * question past the budget stops the run before it is answered (ADR-0025 §4).
 */
function ask(ctx: SorterContext, answer: boolean, blockId: string, pair: boolean): boolean {
  const state = ctx.state;
  if (state.questionsLeft !== undefined) {
    if (state.questionsLeft === 0) {
      ctx.emit({ type: 'outOfQuestions', at: state.p }, blockId);
      ctx.stop('crash', 'OUT_OF_QUESTIONS');
    }
    state.questionsLeft--;
  }
  const value = ctx.sense(answer, blockId);
  // After `sense`, so the replay's step mode still stops once per question; the par search
  // ignores events of questions.
  ctx.emit(
    { type: 'ask', at: state.p, pair, answer, questionsLeft: state.questionsLeft ?? null },
    blockId,
  );
  return value;
}

/** Sandbox API of the shelf (ADR-0025 §3). Places are 1-based; n + 1 is the flag. */
export function createSorterApi(ctx: SorterContext): GameKindApi {
  return {
    right: (blockId) => {
      const id = String(blockId);
      const state = ctx.state;
      if (state.p === flagOf(state)) {
        ctx.emit({ type: 'offShelf', at: state.p }, id);
        ctx.stop('crash', 'OFF_SHELF');
      }
      ctx.emit({ type: 'move', from: state.p, to: state.p + 1 }, id);
      state.p++;
    },
    toStart: (blockId) => {
      const state = ctx.state;
      // Already at the first book: nothing to act out.
      if (state.p === 1) return;
      ctx.emit({ type: 'move', from: state.p, to: 1 }, String(blockId));
      state.p = 1;
    },
    swap: (blockId) => {
      const id = String(blockId);
      const state = ctx.state;
      const i = state.p - 1;
      const left = state.books[i];
      const right = state.books[i + 1];
      if (left === undefined || right === undefined) {
        ctx.emit({ type: 'noBookRight', at: state.p }, id);
        ctx.stop('crash', 'NO_BOOK_RIGHT');
      }
      const books = [...state.books];
      books[i] = right;
      books[i + 1] = left;
      state.books = books;
      ctx.emit({ type: 'swap', at: state.p, books: [...books] }, id);
    },
    bookIs: (op, num, blockId) => {
      const book = ctx.state.books[ctx.state.p - 1];
      const n = Number(num);
      const compare = opOf(op);
      const answer =
        book !== undefined &&
        (compare === 'EQ' ? book === n : compare === 'GT' ? book > n : book < n);
      return ask(ctx, answer, String(blockId), false);
    },
    bigger: (blockId) => {
      const { books, p } = ctx.state;
      const here = books[p - 1];
      const next = books[p];
      return ask(
        ctx,
        here !== undefined && next !== undefined && here > next,
        String(blockId),
        true,
      );
    },
    // Asking where the hand is does not look at a book: free (ADR-0025 "Phương án").
    atEnd: (blockId) => ctx.sense(ctx.state.p === flagOf(ctx.state), String(blockId)),
  };
}
