import type { Level } from '@codequest/content-schema';
import {
  findFixes,
  findShortestPrograms,
  type FixResult,
  type ShortestResult,
  UnsearchableLevel,
  WORKER_MAX_WORK,
} from '@codequest/validator';

// "Tìm par nhỏ nhất" of the level editor (phase-2.md P2-07, content-model.md §8): the searches
// of @codequest/validator, run in a Web Worker (./parSearch.worker.ts) with the worker budget.
// Cancel = the page terminates the worker; `shouldStop` adds a wall-clock limit inside it.

/** Request from the page to the worker. */
export interface ParSearchRequest {
  level: Level;
}

/** What one search found; plain data, so it crosses `postMessage`. */
export type ParSearchReply =
  | {
      ok: true;
      shortest: ShortestResult;
      fixes: FixResult | null;
      /**
       * Levels with `starGoals` (P2-21): the cheapest win that ignores the goals (⭐ only), next
       * to `shortest`, whose minimum then counts only goal-meeting wins (par under goals).
       */
      plain: ShortestResult | null;
    }
  | { ok: false; message: string; unsearchable: boolean };

/** Largest program tried when the level has no `maxBlocks` (and a smaller `par`). */
export const EDITOR_MAX_SIZE = 10;
/** Most edits tried for a bughunt fix, unless `parEdits` is larger. */
export const EDITOR_MAX_EDITS = 2;

/**
 * The limits of the editor's search. Unlike `npm run par`, it looks past a `par` / `parEdits`
 * that may still be too low, so the coach sees the real minimum (and setting `par` from the
 * result does not change the search).
 */
export function searchLimits(level: Pick<Level, 'par' | 'parEdits' | 'maxBlocks'>): {
  maxSize: number;
  maxEdits: number;
} {
  return {
    maxSize: level.maxBlocks ?? Math.max(level.par ?? 0, EDITOR_MAX_SIZE),
    maxEdits: Math.max(level.parEdits ?? 1, EDITOR_MAX_EDITS),
  };
}

/** Wall-clock limit of one search in the worker, on top of `WORKER_MAX_WORK`. */
export const WORKER_TIMEOUT_MS = 60_000;

/** Whether the editor offers the search for this mode (content-model.md §8: build, bughunt). */
export function canSearchPar(level: Pick<Level, 'mode'>): boolean {
  return level.mode === 'build' || level.mode === 'bughunt';
}

/**
 * What the search result depends on: the map, toolbox, start program and search limits. Texts,
 * hints and a `par` / `parEdits` within the limits (set from the result) do not make it stale.
 */
export function searchKey(level: Level): string {
  const { kind, mode, toolbox, config, variants, starGoals, initialWorkspace } = level;
  return JSON.stringify({
    kind,
    mode,
    toolbox,
    config,
    variants,
    starGoals,
    initialWorkspace,
    ...searchLimits(level),
  });
}

/** Runs the searches of one level (inside the worker; also callable in tests). */
export function searchPar(level: Level, shouldStop?: () => boolean): ParSearchReply {
  const options = { maxWork: WORKER_MAX_WORK, ...(shouldStop && { shouldStop }) };
  try {
    const { maxSize, maxEdits } = searchLimits(level);
    const shortest = findShortestPrograms(level, { ...options, maxSize });
    const fixes = level.mode === 'bughunt' ? findFixes(level, { ...options, maxEdits }) : null;
    // As `npm run par`: the plain win shows the trade-off the child sees (ADR-0017).
    const plain =
      level.starGoals === undefined
        ? null
        : findShortestPrograms(level, { ...options, maxSize, ignoreStarGoals: true });
    return { ok: true, shortest, fixes, plain };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
      unsearchable: error instanceof UnsearchableLevel,
    };
  }
}

/** One line of the verdict, judged like `npm run par` (tools/par: ✖ only when certain). */
export interface ParAdvice {
  tone: 'ok' | 'warn' | 'error';
  kind:
    | 'parOk'
    | 'parTooHigh'
    | 'parTooLow'
    | 'noWin'
    | 'noWinMaybe'
    | 'stopped'
    | 'unsupported'
    | 'mismatch'
    | 'fixOk'
    | 'fixFewer'
    | 'fixTooMany'
    | 'noFix'
    | 'noFixMaybe'
    | 'fixStopped';
  /** The number the line is about (blocks or edits), when there is one. */
  value?: number;
}

/**
 * Judges the found minimum against the level's `par` / `parEdits`, with the same certainty
 * rules as `npm run par` (content-model.md §8): an error only when a smaller program really
 * wins or a complete search of every toolbox block found nothing; otherwise a warning.
 */
export function parAdvice(
  level: Pick<Level, 'mode' | 'par' | 'parEdits'>,
  reply: Extract<ParSearchReply, { ok: true }>,
): ParAdvice[] {
  const { shortest, fixes } = reply;
  const out: ParAdvice[] = [];
  const partial = shortest.unsupported.length > 0;
  if (partial) out.push({ tone: 'warn', kind: 'unsupported' });
  if (shortest.mismatches.length > 0 || (fixes?.mismatches.length ?? 0) > 0) {
    out.push({ tone: 'error', kind: 'mismatch' });
  }
  if (!shortest.complete) out.push({ tone: 'warn', kind: 'stopped' });

  if (level.mode === 'build') {
    if (shortest.minBlocks === null) {
      out.push(
        shortest.complete && !partial
          ? { tone: 'error', kind: 'noWin', value: shortest.maxSize }
          : { tone: 'warn', kind: 'noWinMaybe', value: shortest.searchedSize },
      );
    } else if (level.par !== undefined && shortest.minBlocks < level.par) {
      out.push({ tone: 'error', kind: 'parTooHigh', value: shortest.minBlocks });
    } else if (level.par !== undefined && shortest.minBlocks > level.par) {
      // Every smaller size was searched; certain unless some toolbox block was not searched.
      out.push({ tone: partial ? 'warn' : 'error', kind: 'parTooLow', value: shortest.minBlocks });
    } else {
      out.push({ tone: 'ok', kind: 'parOk', value: shortest.minBlocks });
    }
  }

  if (level.mode === 'bughunt' && fixes !== null) {
    const parEdits = level.parEdits ?? 1;
    if (!fixes.complete) out.push({ tone: 'warn', kind: 'fixStopped' });
    if (fixes.minEdits === null) {
      out.push(
        fixes.complete && !partial
          ? { tone: 'error', kind: 'noFix', value: fixes.maxEdits }
          : { tone: 'warn', kind: 'noFixMaybe', value: fixes.searchedEdits },
      );
    } else if (fixes.minEdits < parEdits) {
      out.push({ tone: 'warn', kind: 'fixFewer', value: fixes.minEdits });
    } else if (fixes.minEdits > parEdits) {
      // Every smaller distance was searched: certain unless some toolbox block was not.
      out.push({ tone: partial ? 'warn' : 'error', kind: 'fixTooMany', value: fixes.minEdits });
    } else {
      out.push({ tone: 'ok', kind: 'fixOk', value: fixes.minEdits });
    }
  }
  return out;
}
