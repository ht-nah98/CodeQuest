import { db, type LevelDraftRow } from '../db';

// Level editor drafts (/coach/editor, P2-07), one row per draft. Local only: not a synced
// table, not in backups (data-sync-auth.md §2).

/** Newest drafts first. */
export async function listLevelDrafts(): Promise<LevelDraftRow[]> {
  return db.levelDrafts.orderBy('updatedAt').reverse().toArray();
}

export async function saveLevelDraft(
  key: string,
  levelId: string,
  level: unknown,
  now: Date = new Date(),
): Promise<void> {
  await db.levelDrafts.put({ key, levelId, level, updatedAt: now.toISOString() });
}

export async function loadLevelDraft(key: string): Promise<unknown> {
  return (await db.levelDrafts.get(key))?.level;
}

export async function deleteLevelDraft(key: string): Promise<void> {
  await db.levelDrafts.delete(key);
}
