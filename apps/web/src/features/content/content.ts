import {
  FeedbackFileSchema,
  LevelSchema,
  WorldSchema,
  type FeedbackFile,
  type Level,
  type ReasonCode,
  type World,
} from '@codequest/content-schema';
import { getGameKind } from '@codequest/games';

// content/ lives outside apps/web, so globs go through the '@content' alias (content-model.md §1).
// Sandbox worlds (`_*`) are not shown to children.
const levelFiles = import.meta.glob<unknown>(
  ['@content/worlds/*/levels/*.json', '!@content/worlds/_*/**'],
  { import: 'default' },
);
const worldFiles = import.meta.glob<unknown>(
  ['@content/worlds/*/world.json', '!@content/worlds/_*/**'],
  { import: 'default' },
);
const feedbackFiles = import.meta.glob<unknown>('@content/shared/feedback.json', {
  import: 'default',
});

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

function findFile(
  files: Record<string, () => Promise<unknown>>,
  suffix: string,
): (() => Promise<unknown>) | undefined {
  const key = Object.keys(files).find((path) => path.endsWith(suffix));
  return key === undefined ? undefined : files[key];
}

/** `w01-l03` → 3. Boss, creative and other ids without `-lNN` have no number. */
export function levelNumberOf(levelId: string): number | null {
  const match = /-l(\d+)$/.exec(levelId);
  return match?.[1] === undefined ? null : Number(match[1]);
}

/** Throws `UnplayableLevelError` unless the level's kind exists and accepts its config. */
export function assertPlayable(level: Pick<Level, 'id' | 'kind' | 'config'>): void {
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
 * Loads and validates a level, its world and the shared feedback lines.
 * Resolves `null` when no level has this id. Throws `UnplayableLevelError` when the level's kind
 * is not implemented or its `config` fails that kind's schema (LevelSchema keeps config unknown),
 * and a zod error when the content does not match the content schema.
 */
export async function loadPlayContent(levelId: string): Promise<PlayContent | null> {
  const loadLevel = findFile(levelFiles, `/levels/${levelId}.json`);
  if (loadLevel === undefined) return null;
  const level = LevelSchema.parse(await loadLevel());

  assertPlayable(level);

  const loadWorld = findFile(worldFiles, `/worlds/${level.worldId}/world.json`);
  const loadFeedback = findFile(feedbackFiles, '/shared/feedback.json');
  if (loadWorld === undefined) throw new Error(`World not found: ${level.worldId}`);
  if (loadFeedback === undefined) throw new Error('content/shared/feedback.json not found');

  const [worldJson, feedbackJson] = await Promise.all([loadWorld(), loadFeedback()]);
  const world = WorldSchema.parse(worldJson);
  const feedback = FeedbackFileSchema.parse(feedbackJson);
  return { level, world, levelNumber: levelNumberOf(level.id), feedback };
}

/**
 * Măng's sentence for a failed run: the level's own line, else the shared default
 * (ui-copy-guide.md §3). Falls back to INTERNAL_ERROR, which content:check guarantees exists.
 */
export function feedbackLine(
  reasonCode: ReasonCode,
  level: Pick<Level, 'feedback'>,
  feedback: FeedbackFile,
): string {
  return level.feedback?.[reasonCode] ?? feedback[reasonCode] ?? feedback.INTERNAL_ERROR ?? '';
}
