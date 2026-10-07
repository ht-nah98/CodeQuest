import { useMemo } from 'react';
import { useUnlockOverrides } from '../../features/author/authorMode';
import { type Catalog, type ChildState, useCatalog } from '../../features/content/catalog';
import { useLessonsDone, useProgressMap } from '../../features/progress';

/**
 * The catalog plus what one child has done, for unlock decisions on any screen. `child` is null
 * while any of them is loading; dev unlock overrides (sandbox, `?unlock=all`) are included.
 */
export function useChild(profileId: string): {
  catalog: Catalog | null;
  child: ChildState | null;
  failed: boolean;
} {
  const state = useCatalog();
  const catalog = state.status === 'ready' ? state.catalog : null;
  const progress = useProgressMap(profileId);
  const lessonsDone = useLessonsDone(profileId);
  const overrides = useUnlockOverrides(catalog);
  const child = useMemo(
    () => (progress && lessonsDone && overrides ? { progress, lessonsDone, overrides } : null),
    [progress, lessonsDone, overrides],
  );
  return { catalog, child: catalog ? child : null, failed: state.status === 'error' };
}
