import type { FeedbackFile, Level, WorkspaceJson } from '@codequest/content-schema';
import { runLevel, type RunOutcome } from '@codequest/engine';
import {
  getGameKind,
  runnerConfigSchema,
  type RunnerConfig,
  type RunnerEvent,
} from '@codequest/games';
import { vi } from '../../i18n/vi';
import { feedbackLine } from '../content/content';

/** The runner config of a level, validated (throws for a level of another kind). */
export function runnerConfigOf(level: Level): RunnerConfig {
  if (level.kind !== 'runner') throw new Error(`Not a runner level: ${level.id} (${level.kind})`);
  return runnerConfigSchema.parse(level.config);
}

/**
 * Runs the child's program headlessly (run-then-replay, overview.md §4). Synchronous and bounded
 * by the level's maxSteps / maxActions, so an endless loop ends as TIMEOUT instead of hanging.
 */
export function runRunnerProgram(level: Level, workspace: WorkspaceJson): RunOutcome<RunnerEvent> {
  const kind = getGameKind(level.kind);
  if (kind === undefined || level.kind !== 'runner') {
    throw new Error(`Game kind not implemented: ${level.kind}`);
  }
  // The registry erases event types; the runner kind only emits RunnerEvent.
  return runLevel({ kind, level, workspace }) as RunOutcome<RunnerEvent>;
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
