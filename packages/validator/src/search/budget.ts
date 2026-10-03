import type { Level } from '@codequest/content-schema';
import { CQ_REPEAT_MAX_TIMES, type AnyGameKindDefinition } from '@codequest/engine';
import { getGameKind } from '@codequest/games';
import type { GameKindLookup } from '../issue';

/** Options shared by both searches. */
export interface SearchOptions {
  /** Deepest `cq_repeat` nesting: 0 = no loops, 1 = no loop inside a loop. Default 2. */
  maxDepth?: number;
  /** Counts tried for every `cq_repeat`. Default 2–20 (1 never helps). */
  repeatTimes?: readonly number[];
  /**
   * Deterministic work budget (simulation steps and candidates). When it runs out the result
   * says `complete: false`. Default 20 000 000.
   */
  maxWork?: number;
  /** Winning programs kept as examples. Default 5. */
  maxExamples?: number;
  /** Polled every few thousand work units; return true to cancel (wall clock, Web Worker). */
  shouldStop?: () => boolean;
  /** Game kind registry; defaults to `getGameKind` of `@codequest/games`. */
  getKind?: GameKindLookup;
}

export const DEFAULT_MAX_DEPTH = 2;
export const DEFAULT_MAX_WORK = 20_000_000;
/**
 * Suggested `maxWork` for the level editor's Web Worker: a few seconds on a laptop and a few
 * hundred MB at most, enough for every W1–W2 build par and for bughunt fixes up to 2 edits.
 * Raise it (or run `npm run par`) for parEdits 3.
 */
export const WORKER_MAX_WORK = 2_000_000;
export const DEFAULT_MAX_EXAMPLES = 5;
export const DEFAULT_REPEAT_TIMES: readonly number[] = Array.from(
  { length: CQ_REPEAT_MAX_TIMES - 1 },
  (_, index) => index + 2,
);

const POLL_EVERY = 4096;

/** Thrown inside a search when the budget runs out or `shouldStop` says so. */
export class SearchAborted extends Error {}

/** Counts work and aborts the search when the budget is spent. */
export class Budget {
  work = 0;
  private readonly maxWork: number;
  private readonly shouldStop: (() => boolean) | undefined;

  constructor(options: SearchOptions) {
    this.maxWork = options.maxWork ?? DEFAULT_MAX_WORK;
    this.shouldStop = options.shouldStop;
  }

  spend(units = 1): void {
    const before = this.work;
    this.work += units;
    if (this.work > this.maxWork) throw new SearchAborted('work budget spent');
    const poll = Math.floor(this.work / POLL_EVERY) !== Math.floor(before / POLL_EVERY);
    if (poll && this.shouldStop?.() === true) throw new SearchAborted('stopped');
  }
}

/** The game kind of a level the searches can run, or an Error explaining why not. */
export function searchableKind(level: Level, options: SearchOptions): AnyGameKindDefinition {
  if (level.mode === 'predict' || level.mode === 'creative') {
    throw new Error(`mode ${level.mode} has no program to search`);
  }
  const kind = (options.getKind ?? getGameKind)(level.kind);
  if (kind === undefined) throw new Error(`game kind "${level.kind}" is not implemented yet`);
  return kind;
}
