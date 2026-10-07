import type { RegisterSWOptions } from 'vite-plugin-pwa/types';

// New deploys (P2-09, deployment-ops.md "PWA"). The service worker is registered with
// `registerType: 'prompt'`: a new version installs in the background and waits. Nothing reloads by
// itself; the map and the settings screen show "Có bản mới" and reload only when someone presses
// it, so a child is never thrown out of a level. Pure of `window` so it is unit-tested.

/** `registerSW` of `virtual:pwa-register` (injected so tests pass a fake). */
export type RegisterServiceWorker = (
  options: RegisterSWOptions,
) => (reloadPage?: boolean) => Promise<void>;

export interface UpdateControllerDeps {
  reload: () => void;
  isOnline: () => boolean;
}

/** How often an open tab asks the server for a new service worker (it also does on each load). */
export const UPDATE_CHECK_MS = 60 * 60 * 1000;

/** "Tải lại" reloads after this long even if the new worker never reports taking control. */
export const APPLY_FALLBACK_MS = 3000;

export interface UpdateController {
  /** Registers the service worker; call once, production builds only. */
  start: (register: RegisterServiceWorker) => void;
  subscribe: (listener: () => void) => () => void;
  /** True when a new version is ready and this tab still runs the old one. */
  getSnapshot: () => boolean;
  /** Switches to the new version and reloads this tab. */
  apply: () => void;
}

export function createUpdateController({
  reload,
  isOnline,
}: UpdateControllerDeps): UpdateController {
  let needRefresh = false;
  // This tab pressed "Tải lại": the new worker taking control must reload it.
  let requested = false;
  // Another tab already activated the new worker: there is nothing left to skip-wait, a reload
  // is all this tab needs.
  let activatedElsewhere = false;
  let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null;
  const listeners = new Set<() => void>();

  const setNeedRefresh = (value: boolean) => {
    if (needRefresh === value) return;
    needRefresh = value;
    for (const listener of listeners) listener();
  };

  return {
    start(register) {
      if (updateServiceWorker) return;
      updateServiceWorker = register({
        onNeedRefresh: () => {
          setNeedRefresh(true);
        },
        // Default: the plugin reloads every tab. Only the tab that asked reloads; others keep
        // their level running and show the prompt at the next map / settings visit.
        onNeedReload: () => {
          if (requested) reload();
          else {
            activatedElsewhere = true;
            setNeedRefresh(true);
          }
        },
        onRegisteredSW: (_url, registration) => {
          if (!registration) return;
          setInterval(() => {
            if (isOnline()) registration.update().catch(() => undefined);
          }, UPDATE_CHECK_MS);
        },
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => needRefresh,
    apply() {
      if (!needRefresh) return;
      requested = true;
      if (activatedElsewhere || !updateServiceWorker) {
        reload();
        return;
      }
      void updateServiceWorker(true);
      // The new worker taking control reloads this tab (onNeedReload). If that never comes
      // (the waiting worker vanished, a browser quirk), reload anyway: the button must work.
      setTimeout(reload, APPLY_FALLBACK_MS);
    },
  };
}

const RELOAD_KEY = 'cq.chunkReloadAt';
const RELOAD_GUARD_MS = 10_000;

/**
 * A tab on an old version that loads a chunk deleted by a newer deploy (another tab accepted the
 * update, or the cache was cleared) gets `vite:preloadError`. That only happens on navigation
 * (a lazy screen or level), so reloading onto the new version is safe. At most once per 10 s, so
 * a chunk that is truly missing ends on the error screen instead of a reload loop. Without
 * working storage there is no loop guard, so no reload either: the error boundary takes it.
 */
export function installChunkErrorReload(
  target: Pick<Window, 'addEventListener'>,
  storage: Pick<Storage, 'getItem' | 'setItem'> | null,
  reload: () => void,
  now: () => number,
): void {
  if (!storage) return;
  target.addEventListener('vite:preloadError', (event) => {
    try {
      const last = Number(storage.getItem(RELOAD_KEY) ?? 0);
      if (now() - last < RELOAD_GUARD_MS) return;
      storage.setItem(RELOAD_KEY, String(now()));
    } catch {
      return;
    }
    event.preventDefault();
    reload();
  });
}

/** `window.sessionStorage`, or null where reading it throws (site data blocked). */
export function sessionStorageOf(win: Pick<Window, 'sessionStorage'>): Storage | null {
  try {
    return win.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Asks the browser not to evict IndexedDB (the children's progress) under storage pressure.
 * Called when a profile is created; Chromium decides silently, Firefox may ask the adult once.
 */
export async function requestPersistentStorage(
  storage: Pick<StorageManager, 'persist' | 'persisted'> | undefined,
): Promise<boolean> {
  if (!storage?.persist) return false;
  try {
    if (await storage.persisted()) return true;
    return await storage.persist();
  } catch {
    return false;
  }
}
