import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';
import {
  createUpdateController,
  installChunkErrorReload,
  requestPersistentStorage,
  sessionStorageOf,
} from './updates';

// Offline play and updates (P2-09, ADR-0020). `npm run dev` has no service worker
// (vite.config.ts devOptions), so main.tsx starts this in production builds only.

const appUpdates = createUpdateController({
  reload: () => {
    window.location.reload();
  },
  isOnline: () => navigator.onLine,
});

/** Registers the service worker and the stale-chunk reload. Production builds only. */
export function startOfflineSupport(): void {
  appUpdates.start(registerSW);
  installChunkErrorReload(
    window,
    sessionStorageOf(window),
    () => {
      window.location.reload();
    },
    () => Date.now(),
  );
}

/** True when a new version waits; `apply` reloads onto it. */
export function useAppUpdate(): { ready: boolean; apply: () => void } {
  const ready = useSyncExternalStore(appUpdates.subscribe, appUpdates.getSnapshot);
  return { ready, apply: appUpdates.apply };
}

/** Keeps the progress database from being evicted (see requestPersistentStorage). */
export function persistLocalData(): void {
  void requestPersistentStorage(navigator.storage);
}
