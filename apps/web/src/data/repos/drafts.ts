import type { WorkspaceJson } from '@codequest/content-schema';
import { db } from '../db';

// Unfinished workspace per (profile, level), restored when the child comes back to the level.
// Local only: drafts are not a synced table (data-sync-auth.md §3), so no outbox line.

export async function saveDraft(
  profileId: string,
  levelId: string,
  workspace: WorkspaceJson,
  now: Date = new Date(),
): Promise<void> {
  await db.drafts.put({ profileId, levelId, workspace, updatedAt: now.toISOString() });
}

export async function loadDraft(
  profileId: string,
  levelId: string,
): Promise<WorkspaceJson | undefined> {
  return (await db.drafts.get([profileId, levelId]))?.workspace;
}

export async function deleteDraft(profileId: string, levelId: string): Promise<void> {
  await db.drafts.delete([profileId, levelId]);
}
