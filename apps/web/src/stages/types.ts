import type { Ticker } from 'pixi.js';
import type { GameEvent, RunOutcome } from '@codequest/engine';
import type { PandaAnimation } from './panda';

/**
 * Drawing half of a game kind (game-kind-sdk.md §2). The StageController owns the PIXI
 * application and its one clock; playback speed is the clock's `ticker.speed`, so renderers time
 * everything with `ticker.deltaMS` and never read a speed themselves.
 */
export interface StageRenderer<E extends GameEvent> {
  /** Puts the scene back to the level's start, without reloading assets. */
  reset(): void;
  /**
   * Acts out one event; resolves when done, or as soon as `signal` aborts. `next` is the event
   * that follows within the same block (e.g. `fall` after the `jump` into a hole), if any.
   */
  play(event: E, signal: AbortSignal, next?: E): Promise<void>;
  /** Estimated duration in ms at speed 1 (for a future scrub bar). */
  estimate(event: E): number;
  /** The character stops moving in place (between steps, at the end of an unfinished run). */
  rest(): void;
  /** Freezes the current frame (while the next block lights up). */
  hold(): void;
  /**
   * Optional end-of-run cue: called once after the last event of a run has been acted out
   * (after `rest()` for an unfinished run), never after an abort / reset and never between
   * steps. E.g. the maze shows its MISSED_ITEMS cue here.
   */
  finish?(outcome: RunOutcome<E>): void;
  /**
   * Optional end of a timed-out run (TIMEOUT, P2-11 T8): Măng spins and sees stars ("chóng mặt"),
   * then stays dizzy until reset. Called instead of `rest()`, before `finish`; resolves when the
   * spin is over or as soon as `signal` aborts. Sets `data-dizzy="true"` on the canvas (e2e).
   */
  dizzy?(signal: AbortSignal): Promise<void>;
  /**
   * Optional camera peek while no replay runs (P2-22): the child drags the full-track strip and
   * the view starts at cell `leftCell` instead of following Măng; `null` (and `reset()`) gives
   * the camera back to Măng. Kinds whose stage always shows the whole board leave it out.
   */
  peek?(leftCell: number | null): void;
  /** New stage size in CSS px (ResizeObserver). */
  resize(width: number, height: number): void;
  destroy(): void;
}

/** Callback for e2e/debug: Măng's current animation. */
export type PandaAnimationListener = (animation: PandaAnimation) => void;

/**
 * `signal.aborted`, re-read after an `await`. A function call keeps TypeScript from narrowing
 * the flag to `false` across awaits, where an abort can happen at any time.
 */
export function isAborted(signal: AbortSignal): boolean {
  return signal.aborted;
}

/**
 * Resolves after `durationMs` of the given clock, calling `onFrame(t)` with t in 0…1 each frame.
 * Resolves early (without the final frame) when `signal` aborts, so callers check `signal.aborted`.
 */
export function tween(
  ticker: Ticker,
  durationMs: number,
  signal: AbortSignal,
  onFrame?: (t: number) => void,
): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    let elapsed = 0;
    const done = () => {
      ticker.remove(tick);
      signal.removeEventListener('abort', done);
      resolve();
    };
    const tick = (clock: Ticker) => {
      elapsed += clock.deltaMS;
      const t = durationMs <= 0 ? 1 : Math.min(1, elapsed / durationMs);
      onFrame?.(t);
      if (t >= 1) done();
    };
    signal.addEventListener('abort', done);
    ticker.add(tick);
  });
}
