import { useMemo } from 'react';
import { useLocation } from 'react-router';
import { useCurrentProfile } from '../profiles';
import { allIds, type Catalog } from '../content/catalog';
import { SANDBOX_WORLD_ID } from '../content/sandbox';

// Author mode (phase-1.md P1-10), dev builds only: `?author=1` shows authoring tools on the play
// screen ("Sao chép workspace JSON"), `?unlock=all` opens every world and level. A flag set in
// the URL is remembered for the tab (sessionStorage) so it survives in-app navigation;
// `?author=0` / `?unlock=0` turns it off again. Production builds always answer false.

export interface AuthorFlags {
  author: boolean;
  unlockAll: boolean;
}

const OFF: AuthorFlags = { author: false, unlockAll: false };
const KEYS = { author: 'cq.author', unlockAll: 'cq.unlockAll' } as const;

function readFlag(params: URLSearchParams, param: string, on: string, key: string): boolean {
  const value = params.get(param);
  try {
    if (value !== null) {
      const enabled = value === on;
      if (enabled) sessionStorage.setItem(key, '1');
      else sessionStorage.removeItem(key);
      return enabled;
    }
    return sessionStorage.getItem(key) === '1';
  } catch {
    // Storage can be blocked (private window): the URL flag still works for this page.
    return value === on;
  }
}

/** Reads (and remembers) the author flags from a query string. */
export function authorFlags(search: string): AuthorFlags {
  if (!import.meta.env.DEV) return OFF;
  const params = new URLSearchParams(search);
  return {
    author: readFlag(params, 'author', '1', KEYS.author),
    unlockAll: readFlag(params, 'unlock', 'all', KEYS.unlockAll),
  };
}

export function useAuthorFlags(): AuthorFlags {
  const { search } = useLocation();
  return useMemo(() => authorFlags(search), [search]);
}

/** Ids opened by hand, see useUnlockOverrides. Pure, so it is unit-tested without React. */
export function unlockOverrideIds(
  catalog: Catalog | null,
  options: { dev: boolean; unlockAll: boolean; coach: boolean },
): Set<string> {
  if (!options.dev || catalog === null) return new Set<string>();
  return new Set(options.unlockAll || options.coach ? allIds(catalog) : [SANDBOX_WORLD_ID]);
}

/**
 * Ids opened by hand (isUnlocked `overrides`): in dev builds the sandbox world, and with
 * `?unlock=all` or the signed-in coach profile (role 'coach') every world and level. Reads the
 * role from the current profile, so it must run under <CurrentProfileProvider> (every screen
 * after sign-in does).
 */
export function useUnlockOverrides(catalog: Catalog | null): Set<string> {
  const { unlockAll } = useAuthorFlags();
  const coach = useCurrentProfile().profile?.role === 'coach';
  return useMemo(
    () => unlockOverrideIds(catalog, { dev: import.meta.env.DEV, unlockAll, coach }),
    [catalog, unlockAll, coach],
  );
}
