import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { getProfile, type ProfileSummary } from '../../data/repos/profiles';

// Who is playing in this tab (screens-and-flows.md "/": avatar + PIN). Kept in sessionStorage so
// a reload does not ask for the PIN again, while closing the tab (or "Đổi người chơi") does.
// Only the profile id is stored; nothing leaves the laptop (security-privacy.md).

export const CURRENT_PROFILE_KEY = 'cq.profileId';

function readStored(): string | null {
  try {
    return sessionStorage.getItem(CURRENT_PROFILE_KEY);
  } catch {
    return null;
  }
}

function writeStored(id: string | null): void {
  try {
    if (id === null) sessionStorage.removeItem(CURRENT_PROFILE_KEY);
    else sessionStorage.setItem(CURRENT_PROFILE_KEY, id);
  } catch {
    // Blocked storage: the choice still holds until the page is reloaded.
  }
}

interface CurrentProfileValue {
  /** `undefined` while loading, `null` when nobody is signed in (or the profile was deleted). */
  profile: ProfileSummary | null | undefined;
  /** Call after the PIN was checked (or right after creating the profile). */
  select: (profileId: string) => void;
  signOut: () => void;
}

const CurrentProfileContext = createContext<CurrentProfileValue | null>(null);

export function CurrentProfileProvider({ children }: { children: ReactNode }) {
  const [profileId, setProfileId] = useState<string | null>(readStored);
  // Tagged with the id it was read for: right after `select`, the live query still holds the
  // previous answer for a moment, which must read as "loading", not as "deleted".
  const loaded = useLiveQuery(
    async () => ({ id: profileId, profile: profileId === null ? null : ((await getProfile(profileId)) ?? null) }),
    [profileId],
  );
  const profile = profileId === null ? null : loaded?.id === profileId ? loaded.profile : undefined;

  const select = useCallback((id: string) => {
    writeStored(id);
    setProfileId(id);
  }, []);
  const signOut = useCallback(() => {
    writeStored(null);
    setProfileId(null);
  }, []);

  // The profile's "Giảm chuyển động" switch (coding-standards.md §5, ui/index.css).
  const reducedMotion = profile?.settings.reducedMotion ?? false;
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
  }, [reducedMotion]);

  const value = useMemo(() => ({ profile, select, signOut }), [profile, select, signOut]);
  return <CurrentProfileContext value={value}>{children}</CurrentProfileContext>;
}

export function useCurrentProfile(): CurrentProfileValue {
  const value = useContext(CurrentProfileContext);
  if (value === null) throw new Error('useCurrentProfile needs <CurrentProfileProvider>');
  return value;
}

/** The signed-in profile, for screens behind <RequireProfile> (throws elsewhere). */
export function useSignedInProfile(): ProfileSummary {
  const { profile } = useCurrentProfile();
  if (!profile) throw new Error('useSignedInProfile outside <RequireProfile>');
  return profile;
}

/** Route guard: renders its children only for a signed-in profile, else back to "/". */
export function RequireProfile({ children }: { children: ReactNode }) {
  const { profile } = useCurrentProfile();
  if (profile === undefined) return null;
  if (profile === null) return <Navigate to="/" replace />;
  return children;
}

/** Whether the user prefers less motion (OS setting or the profile switch). */
export function prefersReducedMotion(): boolean {
  return (
    document.documentElement.dataset.reducedMotion === 'true' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
