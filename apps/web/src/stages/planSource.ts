import type { GameKindId, GoalSprite } from '@codequest/content-schema';
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
export type PlanSource = (
  | { kind: 'runner'; config: RunnerConfig; feed: TrackFeed }
  | { kind: 'maze'; config: MazeConfig; feed: MazeFeed }
) & {
  /** `level.goalSprite` (P2-11c): the picture on the goal cell (the flag when absent). */
  goalSprite?: GoalSprite;
};

/** The source of one map, or `null` for a kind without a static picture. */
export function planSourceFor(
  kind: GameKindId,
  config: unknown,
  goalSprite?: GoalSprite,
): PlanSource | null {
  const sprite = goalSprite === undefined ? {} : { goalSprite };
  if (kind === 'runner') {
    const parsed = runnerConfigSchema.safeParse(config);
    return parsed.success
      ? { kind, config: parsed.data, feed: createTrackFeed(parsed.data), ...sprite }
      : null;
  }
  if (kind === 'maze') {
    const parsed = mazeConfigSchema.safeParse(config);
    return parsed.success
      ? { kind, config: parsed.data, feed: createMazeFeed(parsed.data), ...sprite }
      : null;
  }
  return null;
}
