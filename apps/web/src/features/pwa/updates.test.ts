import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RegisterSWOptions } from 'vite-plugin-pwa/types';
import {
  createUpdateController,
  installChunkErrorReload,
  APPLY_FALLBACK_MS,
  requestPersistentStorage,
  sessionStorageOf,
  UPDATE_CHECK_MS,
} from './updates';

function setup(online = true) {
  const reload = vi.fn();
  const updateServiceWorker = vi.fn(() => Promise.resolve());
  let options: RegisterSWOptions = {};
  const controller = createUpdateController({ reload, isOnline: () => online });
  controller.start((given) => {
    options = given;
    return updateServiceWorker;
  });
  return { controller, reload, updateServiceWorker, options: () => options };
}

describe('createUpdateController', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports a waiting version to subscribers and never reloads by itself', () => {
    const { controller, reload, options } = setup();
    const listener = vi.fn();
    controller.subscribe(listener);
    expect(controller.getSnapshot()).toBe(false);

    options().onNeedRefresh?.();
    expect(controller.getSnapshot()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();
  });

  it('apply reloads after a while even if the new worker never takes control', () => {
    vi.useFakeTimers();
    const { controller, reload, options } = setup();
    options().onNeedRefresh?.();
    controller.apply();
    vi.advanceTimersByTime(APPLY_FALLBACK_MS - 1);
    expect(reload).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('apply skips waiting, then reloads when the new worker takes this tab', () => {
    const { controller, reload, updateServiceWorker, options } = setup();
    options().onNeedRefresh?.();
    controller.apply();
    expect(updateServiceWorker).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();

    options().onNeedReload?.();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('another tab updating does not reload this one (a child may be mid-level)', () => {
    const { controller, reload, updateServiceWorker, options } = setup();
    options().onNeedRefresh?.();
    options().onNeedReload?.();
    expect(reload).not.toHaveBeenCalled();
    expect(controller.getSnapshot()).toBe(true);

    // Nothing waits any more: pressing "Tải lại" just reloads.
    controller.apply();
    expect(updateServiceWorker).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('apply does nothing while no update waits', () => {
    const { controller, reload, updateServiceWorker } = setup();
    controller.apply();
    expect(updateServiceWorker).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('registers once', () => {
    const { controller } = setup();
    const register = vi.fn(() => () => Promise.resolve());
    controller.start(register);
    expect(register).not.toHaveBeenCalled();
  });

  it('unsubscribed listeners are not called', () => {
    const { controller, options } = setup();
    const listener = vi.fn();
    controller.subscribe(listener)();
    options().onNeedRefresh?.();
    expect(listener).not.toHaveBeenCalled();
  });

  it.each([
    [true, 2],
    [false, 0],
  ])('checks for a new version every hour (online: %s)', (online, checks) => {
    vi.useFakeTimers();
    const update = vi.fn(() => Promise.resolve());
    const { options } = setup(online);
    options().onRegisteredSW?.('/sw.js', { update } as unknown as ServiceWorkerRegistration);
    vi.advanceTimersByTime(UPDATE_CHECK_MS * 2);
    expect(update).toHaveBeenCalledTimes(checks);
  });
});

describe('installChunkErrorReload', () => {
  function fire(target: EventTarget): Event {
    const event = new Event('vite:preloadError', { cancelable: true });
    target.dispatchEvent(event);
    return event;
  }

  it('reloads on a stale chunk, at most once per 10 s', () => {
    const target = new EventTarget();
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
    const reload = vi.fn();
    let now = 100_000;
    installChunkErrorReload(target, storage, reload, () => now);

    expect(fire(target).defaultPrevented).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);

    now += 5_000;
    // Within the guard: left to the error boundary, no reload loop.
    expect(fire(target).defaultPrevented).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);

    now += 10_000;
    fire(target);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('never reloads when storage is blocked (no loop guard)', () => {
    const target = new EventTarget();
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const reload = vi.fn();
    installChunkErrorReload(target, blocked, reload, () => 0);
    expect(fire(target).defaultPrevented).toBe(false);
    installChunkErrorReload(target, null, reload, () => 0);
    fire(target);
    expect(reload).not.toHaveBeenCalled();
  });
});

describe('sessionStorageOf', () => {
  it('is null when reading window.sessionStorage throws (site data blocked)', () => {
    const blocked = {
      get sessionStorage(): Storage {
        throw new DOMException('denied', 'SecurityError');
      },
    };
    expect(sessionStorageOf(blocked)).toBeNull();
    expect(sessionStorageOf(window)).toBe(window.sessionStorage);
  });
});

describe('requestPersistentStorage', () => {
  it('asks only when not persisted yet', async () => {
    const persist = vi.fn(() => Promise.resolve(true));
    expect(
      await requestPersistentStorage({ persisted: () => Promise.resolve(true), persist }),
    ).toBe(true);
    expect(persist).not.toHaveBeenCalled();

    expect(
      await requestPersistentStorage({ persisted: () => Promise.resolve(false), persist }),
    ).toBe(true);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('is false without the API or when it throws', async () => {
    expect(await requestPersistentStorage(undefined)).toBe(false);
    expect(
      await requestPersistentStorage({
        persisted: () => Promise.reject(new Error('no')),
        persist: () => Promise.resolve(true),
      }),
    ).toBe(false);
  });
});
