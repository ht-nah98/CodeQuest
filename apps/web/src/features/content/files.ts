import {
  FeedbackFileSchema,
  WorldSchema,
  type FeedbackFile,
  type Level,
  type ReasonCode,
  type World,
} from '@codequest/content-schema';
import { SANDBOX_WORLD_ID, sandboxWorld } from './sandbox';

// Content files and the light helpers around them. No game kinds here (they pull in Blockly):
// the map, world, lesson and results screens import only this module; the play screen adds
// ./playContent.ts.

// content/ lives outside apps/web, so globs go through the '@content' alias (content-model.md §1).
// Sandbox worlds (`_*`) are not shown to children: their files are only bundled in dev builds
// (the DEV ternary lets Rollup drop them), where they form one synthetic world (./sandbox.ts).
export const levelFiles: Record<string, () => Promise<unknown>> = {
  ...import.meta.glob<unknown>(['@content/worlds/*/levels/*.json', '!@content/worlds/_*/**'], {
    import: 'default',
  }),
  ...(import.meta.env.DEV
    ? import.meta.glob<unknown>('@content/worlds/_sandbox/levels/*.json', { import: 'default' })
    : {}),
};
export const lessonFiles: Record<string, () => Promise<unknown>> = {
  ...import.meta.glob<unknown>(['@content/worlds/*/lessons/*.json', '!@content/worlds/_*/**'], {
    import: 'default',
  }),
  ...(import.meta.env.DEV
    ? import.meta.glob<unknown>('@content/worlds/_sandbox/lessons/*.json', { import: 'default' })
    : {}),
};
export const worldFiles = import.meta.glob<unknown>(
  ['@content/worlds/*/world.json', '!@content/worlds/_*/**'],
  { import: 'default' },
);
export const feedbackFiles = import.meta.glob<unknown>('@content/shared/feedback.json', {
  import: 'default',
});

export function findFile(
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

/** A world by id, validated; the dev sandbox world is built from its folder (./sandbox.ts). */
export async function loadWorld(worldId: string): Promise<World> {
  if (import.meta.env.DEV && worldId === SANDBOX_WORLD_ID)
    return sandboxWorld(levelFiles, lessonFiles);
  const load = findFile(worldFiles, `/worlds/${worldId}/world.json`);
  if (load === undefined) throw new Error(`World not found: ${worldId}`);
  return WorldSchema.parse(await load());
}

/** The shared feedback lines (content/shared/feedback.json), validated. */
export async function loadFeedback(): Promise<FeedbackFile> {
  const load = findFile(feedbackFiles, '/shared/feedback.json');
  if (load === undefined) throw new Error('content/shared/feedback.json not found');
  return FeedbackFileSchema.parse(await load());
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
