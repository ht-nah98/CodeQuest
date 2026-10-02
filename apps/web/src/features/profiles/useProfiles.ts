import { useLiveQuery } from 'dexie-react-hooks';
import { getProfile, listProfiles, type ProfileSummary } from '../../data/repos/profiles';

// Live views of the profiles table; `undefined` while the first query is loading.
// The PIN hash never reaches components: they verify with `verifyPin`.

export function useProfiles(): ProfileSummary[] | undefined {
  return useLiveQuery(() => listProfiles(), []);
}

/** `null` when there is no such profile (e.g. it was deleted). */
export function useProfile(profileId: string | undefined): ProfileSummary | null | undefined {
  return useLiveQuery(
    async () => (profileId === undefined ? null : ((await getProfile(profileId)) ?? null)),
    [profileId],
  );
}
