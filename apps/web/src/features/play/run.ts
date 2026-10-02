import type { FeedbackFile, Level, WorkspaceJson } from '@codequest/content-schema';
import { runLevel, type RunOutcome } from '@codequest/engine';
import { getGameKind } from '@codequest/games';
import { vi } from '../../i18n/vi';
import { feedbackLine } from '../content/files';

/**
 * Runs the child's program headlessly with the level's game kind (run-then-replay,
 * overview.md §4). Synchronous and bounded by the level's maxSteps / maxActions, so an endless
 * loop ends as TIMEOUT instead of hanging. Throws when the kind is not implemented.
 */
export function runProgram(level: Level, workspace: WorkspaceJson): RunOutcome {
  const kind = getGameKind(level.kind);
  if (kind === undefined) throw new Error(`Game kind not implemented: ${level.kind}`);
  return runLevel({ kind, level, workspace });
}

/** The block to shake after a failed run: the block of the last event (game-kind-sdk.md §1.1). */
export function offendingBlockId(outcome: RunOutcome): string | null {
  if (outcome.result === 'success') return null;
  return outcome.events.at(-1)?.blockId ?? null;
}

/** What Măng says after a replay: specific praise on a win, the feedback line otherwise. */
export function resultLine(
  outcome: RunOutcome,
  level: Pick<Level, 'feedback' | 'par'>,
  feedback: FeedbackFile,
): string {
  if (outcome.result === 'success') {
    const used = outcome.stats.blocksUsed;
    if (level.par === undefined || used > level.par) return vi.play.win;
    return used === level.par ? vi.play.winPar(used) : vi.play.winUnderPar(used);
  }
  return feedbackLine(outcome.reasonCode ?? 'INTERNAL_ERROR', level, feedback);
}
