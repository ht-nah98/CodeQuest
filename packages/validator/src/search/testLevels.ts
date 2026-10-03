// Real W1/W2 levels as test fixtures, loaded through Vite (headless packages have no node:fs).
import { LevelSchema, type Level } from '@codequest/content-schema';
import { vi } from 'vitest';

const WORLD_DIRS: Readonly<Record<string, string>> = {
  w01: 'w01-lang-tre',
  w02: 'w02-rung-lap-lai',
};

/** Parses `content/worlds/<world>/levels/<id>.json`. */
export async function loadLevel(id: string): Promise<Level> {
  const dir = WORLD_DIRS[id.slice(0, 3)];
  if (dir === undefined) throw new Error(`no world folder for ${id}`);
  const json = await vi.importActual<{ default: unknown }>(
    `../../../../content/worlds/${dir}/levels/${id}.json`,
  );
  return LevelSchema.parse(json.default);
}
