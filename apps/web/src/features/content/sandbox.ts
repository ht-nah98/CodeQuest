import type { World } from '@codequest/content-schema';
import { vi } from '../../i18n/vi';

// Dev builds only: content/worlds/_sandbox has levels and lessons but no world.json (it is not
// part of the curriculum, so content:check's world rules do not apply to it). The screens still
// need a world to list them, so this builds one from the folder: files in name order.

export const SANDBOX_WORLD_ID = '_sandbox';

const idsIn = (files: Record<string, unknown>, folder: 'levels' | 'lessons'): string[] =>
  Object.keys(files)
    .map((path) => new RegExp(`/worlds/${SANDBOX_WORLD_ID}/${folder}/([^/]+)\\.json$`).exec(path))
    .map((match) => match?.[1])
    .filter((id): id is string => id !== undefined)
    .sort();

/**
 * The synthetic sandbox world. `order: 0` keeps it out of the world chain (isUnlocked looks
 * for `order - 1`), so it is opened through an override instead (see features/content/catalog).
 */
export function sandboxWorld(
  levelFiles: Record<string, unknown>,
  lessonFiles: Record<string, unknown>,
): World {
  return {
    id: SANDBOX_WORLD_ID,
    order: 0,
    title: vi.dev.sandbox.title,
    emoji: '-',
    concept: vi.dev.sandbox.concept,
    story: vi.dev.sandbox.story,
    theme: { tileset: '/tiles/ground.png', palette: 'day' },
    lessonIds: idsIn(lessonFiles, 'lessons'),
    levelIds: idsIn(levelFiles, 'levels'),
    unlock: { minStarRatio: 0.6 },
  };
}
