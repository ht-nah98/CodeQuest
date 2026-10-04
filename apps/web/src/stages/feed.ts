import type { GameEvent } from '@codequest/engine';

/**
 * A tiny store fed from the stage controller's hooks (`onEvent` / `onReset`) and read by React
 * through `useSyncExternalStore`: the full-track strip and the "Xem cả đường" view follow the
 * replay without a clock of their own (stage-rendering.md §2).
 */
export interface EventFeed<S> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => S;
  /** An action event's animation starts (StageController `onEvent`). */
  event: (event: GameEvent) => void;
  /** The stage went back to the start (StageController `onReset`). */
  reset: () => void;
}

/** A feed starting at `start`, moved by `step` on every event; `set` replaces the state. */
export function createEventFeed<S>(
  start: S,
  step: (state: S, event: GameEvent) => S,
): EventFeed<S> & { set: (next: S) => void } {
  let state = start;
  const listeners = new Set<() => void>();
  const set = (next: S) => {
    if (next === state) return;
    state = next;
    for (const listener of listeners) listener();
  };
  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state,
    event: (event) => {
      set(step(state, event));
    },
    reset: () => {
      set(start);
    },
    set,
  };
}
