import { useEffect, useState } from 'react';
import {
  needsSharedRules,
  resolveLevelConfigs,
  robotlabRulesSchema,
  type SharedLevelRules,
} from '@codequest/games';
import { findFile } from './files';

// Rules shared by every level of a kind (content/shared/<kind>.json), merged into a level's maps
// before anything runs or draws them (game-kinds.md §3.3: robotlab's clock, costs and points).
// Imports the game kinds, so only play-side modules use it (playContent.ts, the lesson demo).

const robotlabFiles = import.meta.glob<unknown>('@content/shared/robotlab.json', {
  import: 'default',
});

let cached: Promise<SharedLevelRules> | null = null;

/** The shared rules, loaded and validated once. A failed load is not cached (a reload retries). */
export function loadSharedRules(): Promise<SharedLevelRules> {
  cached ??= (async () => {
    const load = findFile(robotlabFiles, '/shared/robotlab.json');
    if (load === undefined) throw new Error('content/shared/robotlab.json not found');
    return { robotlab: robotlabRulesSchema.parse(await load()) };
  })().catch((error: unknown) => {
    cached = null;
    throw error;
  });
  return cached;
}

/**
 * A level (or a lesson `demo` card: it has `kind` and `config` too) with its kind's shared rules
 * merged into `config` and every variant. Kinds without shared rules come back unchanged and
 * without a load.
 */
export async function withSharedRules<T extends { kind: string; config: unknown }>(
  level: T,
): Promise<T> {
  if (!needsSharedRules(level.kind)) return level;
  return resolveLevelConfigs(level, await loadSharedRules());
}

/** A level resolved for a component: loading, ready, or the shared rules could not be read. */
export type SharedRulesState<T> =
  { status: 'loading' } | { status: 'ready'; value: T } | { status: 'error'; error: unknown };

/**
 * `withSharedRules` for a component. A failed load is kept as `error` (and logged in dev builds)
 * so the caller can say so instead of waiting forever.
 */
export function useWithSharedRules<T extends { kind: string; config: unknown }>(
  level: T,
): SharedRulesState<T> {
  const [resolved, setResolved] = useState<{ from: T; state: SharedRulesState<T> } | null>(null);
  useEffect(() => {
    if (!needsSharedRules(level.kind)) return;
    let live = true;
    withSharedRules(level).then(
      (value) => {
        if (live) setResolved({ from: level, state: { status: 'ready', value } });
      },
      (error: unknown) => {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console -- dev-only: a broken content/shared/*.json
          console.error('Shared level rules could not be loaded', error);
        }
        if (live) setResolved({ from: level, state: { status: 'error', error } });
      },
    );
    return () => {
      live = false;
    };
  }, [level]);
  if (!needsSharedRules(level.kind)) return { status: 'ready', value: level };
  return resolved?.from === level ? resolved.state : { status: 'loading' };
}
