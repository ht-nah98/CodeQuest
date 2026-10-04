import type { GameKindId } from '@codequest/content-schema';
import {
  type MazeConfig,
  mazeConfigSchema,
  type RunnerConfig,
  runnerConfigSchema,
} from '@codequest/games';
import { createMazeFeed, type MazeFeed } from './maze/mazeFeed';
import { createTrackFeed, type TrackFeed } from './runner/trackStrip';

/**
 * One map of a level as the play screen's static pictures see it (P2-22): its config and the
 * feed that follows the replay on the stage (the runner's strip, the "Xem cả đường" view).
 */
export type PlanSource =
  | { kind: 'runner'; config: RunnerConfig; feed: TrackFeed }
  | { kind: 'maze'; config: MazeConfig; feed: MazeFeed };

/** The source of one map, or `null` for a kind without a static picture. */
export function planSourceFor(kind: GameKindId, config: unknown): PlanSource | null {
  if (kind === 'runner') {
    const parsed = runnerConfigSchema.safeParse(config);
    return parsed.success
      ? { kind, config: parsed.data, feed: createTrackFeed(parsed.data) }
      : null;
  }
  if (kind === 'maze') {
    const parsed = mazeConfigSchema.safeParse(config);
    return parsed.success ? { kind, config: parsed.data, feed: createMazeFeed(parsed.data) } : null;
  }
  return null;
}
