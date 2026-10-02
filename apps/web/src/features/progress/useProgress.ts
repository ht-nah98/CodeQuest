import { useLiveQuery } from 'dexie-react-hooks';
import type { LevelProgress } from '@codequest/rewards';
import type { ProgressRow } from '../../data/db';
import { getBalance } from '../../data/repos/ledger';
import { listLessonsDone } from '../../data/repos/lessons';
import { getProgress, listProgress, toProgressMap } from '../../data/repos/progress';

// Live views of one child's progress; each hook returns `undefined` while loading.

export function useProgressMap(profileId: string): Map<string, LevelProgress> | undefined {
  return useLiveQuery(async () => toProgressMap(await listProgress(profileId)), [profileId]);
}

/** `null` when the level was never saved. */
export function useLevelProgress(
  profileId: string,
  levelId: string,
): ProgressRow | null | undefined {
  return useLiveQuery(
    async () => (await getProgress(profileId, levelId)) ?? null,
    [profileId, levelId],
  );
}

export function useLessonsDone(profileId: string): Set<string> | undefined {
  return useLiveQuery(
    async () => new Set((await listLessonsDone(profileId)).map((row) => row.lessonId)),
    [profileId],
  );
}

/**
 * Coin balance from the ledger, never shown below 0 (features/coins can take this over when it
 * exists). Spending goes through `spend`, which re-checks the balance atomically.
 */
export function useCoinBalance(profileId: string): number | undefined {
  return useLiveQuery(async () => Math.max(0, await getBalance(profileId)), [profileId]);
}
