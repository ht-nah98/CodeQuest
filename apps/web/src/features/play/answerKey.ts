// Reads a `predict` answer key (product/game-kinds.md §3: `win`, `stop@<cell>`,
// `missed@<cell>`, `crash:<REASON>@<cell>`) so a card can draw it. Runner cells are an index
// ("4"), maze cells "row,col" ("1,3"); the picture of each kind reads `cell` its own way.

export type AnswerOutcome = 'win' | 'stop' | 'missed' | 'crash';

export interface ParsedAnswer {
  outcome: AnswerOutcome;
  /** Crash reason, e.g. FELL_IN_HOLE; null for the other outcomes. */
  reason: string | null;
  /** The cell part after `@`; null for `win`. */
  cell: string | null;
}

const KEY = /^(stop|missed|crash:([A-Z][A-Z0-9_]*))@(.+)$/;

/** Null when the key is not in the predictAnswer format (a content error content:check reports). */
export function parseAnswerKey(key: string): ParsedAnswer | null {
  if (key === 'win') return { outcome: 'win', reason: null, cell: null };
  const match = KEY.exec(key);
  if (match === null) return null;
  const [, head = '', reason, cell = ''] = match;
  if (reason !== undefined) return { outcome: 'crash', reason, cell };
  return { outcome: head === 'missed' ? 'missed' : 'stop', reason: null, cell };
}

/** Runner cell index, or null. */
export function runnerCell(answer: ParsedAnswer): number | null {
  if (answer.cell === null || !/^\d+$/.test(answer.cell)) return null;
  return Number(answer.cell);
}

/** Maze cell `[row, col]`, or null. */
export function mazeCell(answer: ParsedAnswer): [number, number] | null {
  const match = answer.cell === null ? null : /^(\d+),(\d+)$/.exec(answer.cell);
  if (match === null) return null;
  return [Number(match[1]), Number(match[2])];
}
