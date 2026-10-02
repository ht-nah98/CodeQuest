import type { Level, RunSummary } from '@codequest/content-schema';
import { FAILED_RESULTS } from './config';
import type { LevelSession } from './types';

/** Runs of the session that came before `run`; all of them if `run` is not recorded yet. */
export function runsBefore(session: LevelSession, run: RunSummary): RunSummary[] {
  const index = session.runs.findIndex((r) => r.runId === run.runId);
  return index === -1 ? [...session.runs] : session.runs.slice(0, index);
}

/** `error` runs (empty program, too many blocks) never ran, so they are not attempts. */
export function isCountedRun(run: RunSummary): boolean {
  return run.result !== 'error';
}

/**
 * Failed runs in a row at the end of the session (`failStreak`, rewards-economy.md).
 * `error` runs are skipped: they neither count nor reset the streak.
 */
export function failStreak(session: LevelSession): number {
  let count = 0;
  for (let i = session.runs.length - 1; i >= 0; i--) {
    const run = session.runs[i];
    if (run === undefined || run.result === 'success') break;
    if (FAILED_RESULTS.includes(run.result)) count++;
  }
  return count;
}

/** Counted runs after the last win of `runs`; earlier ones were already recorded in progress. */
export function unrecordedRuns(runs: readonly RunSummary[]): number {
  let count = 0;
  for (let i = runs.length - 1; i >= 0; i--) {
    const run = runs[i];
    if (run === undefined || run.result === 'success') break;
    if (isCountedRun(run)) count++;
  }
  return count;
}

/** Throws when a session is paired with another level: a caller bug, never a child's action. */
export function assertSameLevel(level: Level, session: LevelSession): void {
  if (session.levelId !== level.id) {
    throw new Error(`session of ${session.levelId} used with level ${level.id}`);
  }
}

/** Reason code of a wrong pick in mode `predict` (feedback.json needs a line for it). */
export const WRONG_ANSWER = 'WRONG_ANSWER';

/**
 * Turns a `predict` pick into the run that rewards score: `success` when the child picked
 * the right answer, else `incomplete` + WRONG_ANSWER, whatever the program itself did.
 */
export function predictPickSummary(
  engineRun: RunSummary,
  pickedKey: string,
  answerKey: string,
  runId: string,
): RunSummary {
  const right = pickedKey === answerKey;
  return {
    runId,
    result: right ? 'success' : 'incomplete',
    reasonCode: right ? null : WRONG_ANSWER,
    blocksUsed: engineRun.blocksUsed,
    predictChoice: pickedKey,
  };
}
