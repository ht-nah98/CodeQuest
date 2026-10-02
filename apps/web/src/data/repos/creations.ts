import type { WorkspaceJson } from '@codequest/content-schema';
import { db, type CreationRow } from '../db';
import { enqueue } from './outbox';

// A child's saved work on a `creative` level, one per (profile, level): saving again replaces
// it. Synced table (data-sync-auth.md §2), so every write is queued in the outbox. `sharedAt`
// ("Khoe với nhóm") arrives in phase 2; a later save keeps it.

export function saveCreation(
  input: { profileId: string; levelId: string; workspace: WorkspaceJson; title: string },
  now: Date = new Date(),
): Promise<CreationRow> {
  return db.transaction('rw', db.creations, db.outbox, async () => {
    const stored = await db.creations.get([input.profileId, input.levelId]);
    const row: CreationRow = {
      profileId: input.profileId,
      levelId: input.levelId,
      workspace: input.workspace,
      title: input.title,
      ...(stored?.sharedAt !== undefined && { sharedAt: stored.sharedAt }),
    };
    await db.creations.put(row);
    await enqueue('creations', row, now);
    return row;
  });
}

export function getCreation(profileId: string, levelId: string): Promise<CreationRow | undefined> {
  return db.creations.get([profileId, levelId]);
}
