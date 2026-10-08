import { LevelSchema, type FeedbackFile, type Level, type World } from '@codequest/content-schema';
import { getGameKind } from '@codequest/games';
import { findFile, levelFiles, levelNumberOf, loadFeedback, loadWorld } from './files';
import { isModeSupported } from './modes';
import { withSharedRules } from './sharedRules';

// What only the play screen needs: game kinds (and with them Blockly) are imported here.

/** Everything the play screen needs about one level, validated with zod at the boundary. */
export interface PlayContent {
  level: Level;
  world: World;
  /** Curriculum number from the level id (`w01-l03` → 3), shown as "Màn N"; null if none. */
  levelNumber: number | null;
  feedback: FeedbackFile;
}

/** The level exists but its game kind is not implemented yet, or its config does not fit it. */
export class UnplayableLevelError extends Error {
  override name = 'UnplayableLevelError';
}

/**
 * Throws `UnplayableLevelError` unless the play screen supports the level's mode (./modes.ts)
 * and its kind exists and accepts its config.
 */
export function assertPlayable(level: Pick<Level, 'id' | 'kind' | 'mode' | 'config'>): void {
  if (!isModeSupported(level.mode)) {
    throw new UnplayableLevelError(`Mode not implemented yet: ${level.mode} (${level.id})`);
  }
  const kind = getGameKind(level.kind);
  if (kind === undefined)
    throw new UnplayableLevelError(`Game kind not implemented: ${level.kind}`);
  const config = kind.configSchema.safeParse(level.config);
  if (!config.success) {
    throw new UnplayableLevelError(
      `Invalid ${level.kind} config in ${level.id}: ${config.error.message}`,
    );
  }
}

/**
 * Loads and validates a level, its world and the shared feedback lines; a kind with shared rules
 * (robotlab) gets them merged into `config` and every variant.
 * Resolves `null` when no level has this id. Throws `UnplayableLevelError` when the level's kind
 * is not implemented or its `config` fails that kind's schema (LevelSchema keeps config unknown),
 * and a zod error when the content does not match the content schema.
 */
export async function loadPlayContent(levelId: string): Promise<PlayContent | null> {
  const loadLevel = findFile(levelFiles, `/levels/${levelId}.json`);
  if (loadLevel === undefined) return null;
  const written = LevelSchema.parse(await loadLevel());

  assertPlayable(written);
  // Robotlab: the shared clock, costs and points merged into every map (game-kinds.md §3.3), so
  // the run, the stage, the predict answer and its pictures all see the same resolved rules.
  const level = await withSharedRules(written);

  const [world, feedback] = await Promise.all([loadWorld(level.worldId), loadFeedback()]);
  return { level, world, levelNumber: levelNumberOf(level.id), feedback };
}
