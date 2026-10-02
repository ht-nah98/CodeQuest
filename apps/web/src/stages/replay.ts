import type { Ticker } from 'pixi.js';
import type { GameEvent, RunOutcome } from '@codequest/engine';
import { isAborted, type StageRenderer, tween } from './types';

/** Playback speed chosen by the child (Chậm / Vừa / Nhanh). */
export type Speed = 0.5 | 1 | 2;

/** Pause after each highlight before the action, at speed 1 (stage-rendering.md §1). */
export const HIGHLIGHT_MS = 120;
/** A won run plays a little faster, a lost one slower and never above 1× (overview.md §4). */
export const WIN_TEMPO = 1.25;
export const LOSE_TEMPO = 0.85;
/** A timed-out run can hold thousands of events; replay only its start. */
export const TIMEOUT_REPLAY_EVENTS = 24;

export type PlayResult = 'finished' | 'aborted';

export interface ReplayHooks {
  /** Lights up the block that runs now; `null` clears it (Blockly `highlightBlock`). */
  onHighlight: (blockId: string | null) => void;
  /** Step mode: true while the replay waits for `step()` (e2e reads it as data-waiting-step). */
  onWaitingStep?: (waiting: boolean) => void;
  /** The clock's speed after every change (tempo, speed, pause); e2e reads it as data-stage-speed. */
  onClockSpeed?: (speed: number) => void;
  /**
   * An action event's animation starts now (sound effects, audio.md §3). Called on the replay's
   * own clock, so sound follows speed, pause and step without a second timer.
   */
  onEvent?: (event: GameEvent) => void;
  /** The scene went back to the level's start (every reset, including the one each run starts with). */
  onReset?: () => void;
}

/**
 * Replays a run's event log on a renderer, timed by one clock (stage-rendering.md §1).
 * Speed, pause and step all act on that clock: `ticker.speed` scales every tween and sprite
 * animation, and a paused replay is the same clock at speed 0. Pixi-free apart from the
 * `Ticker` type, so it is unit tested with a hand-driven ticker.
 */
export class Replay {
  private playback: AbortController | null = null;
  private speed: Speed = 1;
  private tempo = 1;
  private paused = false;
  private stepping = false;
  private releaseStep: (() => void) | null = null;
  /** A step pressed while no step was awaited (e.g. during a highlight) is kept for the next one. */
  private stepQueued = false;

  constructor(
    private readonly ticker: Ticker,
    private readonly renderer: StageRenderer<GameEvent>,
    private readonly hooks: ReplayHooks,
  ) {}

  /**
   * Replays a run from the start: highlight events light up their block for HIGHLIGHT_MS,
   * action events go to the renderer. Resolves 'aborted' if reset / destroyed / replayed meanwhile.
   */
  async play(outcome: RunOutcome, options: { step?: boolean } = {}): Promise<PlayResult> {
    this.reset();
    const playback = new AbortController();
    this.playback = playback;
    const { signal } = playback;
    this.stepping = options.step ?? false;
    this.tempo = outcome.result === 'success' ? WIN_TEMPO : LOSE_TEMPO;
    this.applySpeed();

    const events =
      outcome.result === 'timeout'
        ? outcome.events.slice(0, TIMEOUT_REPLAY_EVENTS)
        : outcome.events;
    // In step mode the replay waits once per block: before the first action after a highlight.
    // Follow-up events of the same block (fall, win) play on without another step.
    let blockStarted = false;
    try {
      for (const [index, event] of events.entries()) {
        if (isAborted(signal)) return 'aborted';
        if (event.type === 'highlight') {
          this.hooks.onHighlight(event.blockId);
          blockStarted = true;
          // Măng holds still while the next block lights up, instead of walking on the spot.
          this.renderer.hold();
          await tween(this.ticker, HIGHLIGHT_MS, signal);
          continue;
        }
        const firstOfBlock = blockStarted;
        blockStarted = false;
        if (this.stepping && firstOfBlock) {
          this.renderer.rest();
          await this.waitForStep(signal);
          if (isAborted(signal)) return 'aborted';
        }
        const next = events[index + 1];
        this.hooks.onEvent?.(event);
        await this.renderer.play(event, signal, next?.type === 'highlight' ? undefined : next);
      }
      if (isAborted(signal)) return 'aborted';
      this.hooks.onHighlight(null);
      if (outcome.result !== 'success' && outcome.result !== 'crash') this.renderer.rest();
      this.renderer.finish?.(outcome);
      return 'finished';
    } finally {
      if (this.playback === playback) {
        this.playback = null;
        this.paused = false;
        this.applySpeed();
      }
    }
  }

  /** Whether a replay is in progress (including a paused one or one waiting for a step). */
  get playing(): boolean {
    return this.playback !== null;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  /** Whether the replay is waiting for `step()`. */
  get waitingForStep(): boolean {
    return this.releaseStep !== null;
  }

  /** Freezes the replay where it is: the clock runs on at speed 0, so nothing moves. */
  pause(): void {
    if (!this.playing || this.paused) return;
    this.paused = true;
    this.applySpeed();
  }

  /** Continues a paused replay at the chosen speed. */
  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.applySpeed();
  }

  /** Step mode: act out the next block. A paused replay continues up to the next block. */
  step(): void {
    const wasStepping = this.stepping;
    this.stepping = true;
    this.resume();
    const release = this.releaseStep;
    this.releaseStep = null;
    if (release) release();
    // Pressed early in step mode (e.g. during a highlight): kept for the next wait. Pressed while
    // playing normally: the current block finishes and the replay waits before the next one.
    else if (wasStepping) this.stepQueued = true;
  }

  setSpeed(speed: Speed): void {
    this.speed = speed;
    this.applySpeed();
  }

  /**
   * Stops any replay at once (every tween listening to the abort signal leaves the clock),
   * puts the scene back at the start and clears the highlight.
   */
  reset(): void {
    this.playback?.abort();
    this.playback = null;
    this.releaseStep = null;
    this.stepQueued = false;
    this.stepping = false;
    this.paused = false;
    this.tempo = 1;
    this.applySpeed();
    this.hooks.onWaitingStep?.(false);
    this.renderer.reset();
    this.hooks.onReset?.();
    this.hooks.onHighlight(null);
  }

  /** Stops any replay without touching the scene (the stage is being torn down). */
  stop(): void {
    this.playback?.abort();
    this.playback = null;
  }

  private applySpeed(): void {
    const capped = this.tempo < 1 ? Math.min(this.speed, 1) : this.speed;
    this.ticker.speed = this.paused ? 0 : capped * this.tempo;
    this.hooks.onClockSpeed?.(this.ticker.speed);
  }

  private waitForStep(signal: AbortSignal): Promise<void> {
    if (this.stepQueued) {
      this.stepQueued = false;
      return Promise.resolve();
    }
    this.hooks.onWaitingStep?.(true);
    return new Promise((resolve) => {
      const done = () => {
        signal.removeEventListener('abort', done);
        this.hooks.onWaitingStep?.(false);
        resolve();
      };
      this.releaseStep = done;
      signal.addEventListener('abort', done);
    });
  }
}
