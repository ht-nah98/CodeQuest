/**
 * Authoring rule R5 "phép phải có ích" (ADR-0023 §4) as a test helper: without the spell blocks
 * nothing may win up to `maxBlocks`. Searched like `npm run par`, with a work budget; a caller
 * that wants the 120 s wall-clock budget passes `shouldStop`.
 */
import type { Level } from '@codequest/content-schema';
import { PROC_CALL_TYPES, PROC_DEF_TYPES } from '@codequest/engine';
import { findShortestPrograms, type ShortestOptions } from './shortest';
import type { Program } from './program';

/** R5's work budget per level (ADR-0023 §4). */
export const R5_MAX_WORK = 300_000_000;
/** R5's wall-clock budget per level, for callers' `shouldStop`. */
export const R5_TIMEOUT_MS = 120_000;

const SPELL_TYPES: ReadonlySet<string> = new Set([...PROC_DEF_TYPES, ...PROC_CALL_TYPES]);

/** The level with every spell block (`cq_proc_*`) taken out of its toolbox. */
export function withoutProcedures(level: Level): Level {
  return {
    ...level,
    toolbox: level.toolbox.filter(
      (entry) => !SPELL_TYPES.has(typeof entry === 'string' ? entry : entry.type),
    ),
  };
}

export interface SpellsNeededResult {
  /** `proven`: nothing wins without spells; `wins`: a program does; `unproven`: budget out. */
  verdict: 'proven' | 'wins' | 'unproven';
  /** A winning program without spells (verdict `wins`). */
  win: Program | null;
  /** Largest size fully searched. */
  searchedSize: number;
  work: number;
  states: number;
}

/**
 * R5 for one level: searches it without spell blocks up to `maxBlocks` (else `par`). With
 * `maxInstances` on an action block the search stops early (the cheaper way to enforce R5).
 */
export function spellsNeeded(level: Level, options: ShortestOptions = {}): SpellsNeededResult {
  const plain = withoutProcedures(level);
  const maxSize = level.maxBlocks ?? level.par;
  const result = findShortestPrograms(plain, {
    maxWork: R5_MAX_WORK,
    ...options,
    ...(maxSize !== undefined && { maxSize }),
  });
  // Proven only by a complete search of every toolbox block that agrees with runLevel.
  const sound =
    result.complete && result.unsupported.length === 0 && result.mismatches.length === 0;
  const verdict = result.minBlocks !== null ? 'wins' : sound ? 'proven' : 'unproven';
  return {
    verdict,
    win: result.examples[0] ?? null,
    searchedSize: result.searchedSize,
    work: result.work,
    states: result.states,
  };
}
