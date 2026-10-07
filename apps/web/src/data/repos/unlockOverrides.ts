import { db, type UnlockOverrideRow } from '../db';

// Worlds and levels the coach opened by hand for one child (phase-2.md P2-05). Local only: no
// outbox line and no backup (the coach opens them on the child's laptop during a session).

export function listUnlockOverrides(profileId: string): Promise<UnlockOverrideRow[]> {
  return db.unlockOverrides.where('profileId').equals(profileId).toArray();
}

/** Opens (`open: true`) or closes again one world or level for the child; idempotent. */
export async function setUnlockOverride(
  profileId: string,
  targetId: string,
  open: boolean,
  now: Date = new Date(),
): Promise<void> {
  if (open) {
    await db.unlockOverrides.put({ profileId, targetId, at: now.toISOString() });
  } else {
    await db.unlockOverrides.delete([profileId, targetId]);
  }
}
