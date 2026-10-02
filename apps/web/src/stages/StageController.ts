import type { Application } from 'pixi.js';
import type { RunOutcome } from '@codequest/engine';
import type { RunnerConfig, RunnerEvent } from '@codequest/games';
import { loadPandaSheet, loadTiles } from './assets';
import { createStageApp, destroyStageApp } from './createStageApp';
import { RunnerStage } from './runner/RunnerStage';
import { isAborted, type PandaAnimationListener, type StageRenderer, tween } from './types';
import { UI_COLORS } from '../ui/tokens';

/** Playback speed chosen by the child (🐢 / 1× / 🐇). */
export type Speed = 0.5 | 1 | 2;

/** Pause after each highlight before the action, at speed 1 (stage-rendering.md §1). */
export const HIGHLIGHT_MS = 120;
/** A won run plays a little faster, a lost one slower and never above 1× (overview.md §4). */
const WIN_TEMPO = 1.25;
const LOSE_TEMPO = 0.85;
/** A timed-out run can hold thousands of events; replay only its start. */
export const TIMEOUT_REPLAY_EVENTS = 24;

export interface StageControllerOptions {
  config: RunnerConfig;
  /** Lights up the block that runs now; `null` clears it (Blockly `highlightBlock`). */
  onHighlight: (blockId: string | null) => void;
  onAnimation?: PandaAnimationListener;
  /** Step mode: true while the replay waits for `step()` (e2e reads it as data-waiting-step). */
  onWaitingStep?: (waiting: boolean) => void;
}

export type PlayResult = 'finished' | 'aborted';

/**
 * One per level (stage-rendering.md §1): owns the PIXI application, replays a run's event log
 * on the renderer with block highlights, and handles speed / step / reset.
 * Blockly stays out of `stages/`: highlighting goes through `onHighlight`.
 */
export class StageController {
  private playback: AbortController | null = null;
  private speed: Speed = 1;
  private tempo = 1;
  private stepping = false;
  private releaseStep: (() => void) | null = null;
  /** A step pressed while no step was awaited (e.g. during a highlight) is kept for the next one. */
  private stepQueued = false;
  private readonly resizeObserver: ResizeObserver;

  private constructor(
    private readonly app: Application,
    private readonly renderer: StageRenderer<RunnerEvent>,
    private readonly options: StageControllerOptions,
    container: HTMLElement,
  ) {
    this.resizeObserver = new ResizeObserver(() => {
      const width = Math.max(1, Math.floor(container.clientWidth));
      const height = Math.max(1, Math.floor(container.clientHeight));
      if (width === app.screen.width && height === app.screen.height) return;
      app.renderer.resize(width, height);
      renderer.resize(width, height);
    });
    this.resizeObserver.observe(container);
  }

  /**
   * Loads assets and mounts the runner stage, filling `container`. Resolves `null` when `signal`
   * aborts first (React StrictMode unmounts on purpose), leaving no canvas behind.
   */
  static async mount(
    container: HTMLElement,
    signal: AbortSignal,
    options: StageControllerOptions,
  ): Promise<StageController | null> {
    const [pandaTextures, tiles] = await Promise.all([loadPandaSheet(), loadTiles()]);
    if (isAborted(signal)) return null;
    const app = await createStageApp(container, signal, {
      width: Math.max(1, Math.floor(container.clientWidth)),
      height: Math.max(1, Math.floor(container.clientHeight)),
      background: UI_COLORS.sky,
    });
    if (!app) return null;
    try {
      const renderer = new RunnerStage(
        app,
        options.config,
        tiles,
        pandaTextures,
        options.onAnimation,
      );
      return new StageController(app, renderer, options, container);
    } catch (error) {
      destroyStageApp(app);
      throw error;
    }
  }

  /**
   * Replays a run from the start: highlight events light up their block for HIGHLIGHT_MS,
   * action events go to the renderer. Resolves 'aborted' if reset / destroyed / replayed meanwhile.
   */
  async play(
    outcome: RunOutcome<RunnerEvent>,
    options: { step?: boolean } = {},
  ): Promise<PlayResult> {
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
          this.options.onHighlight(event.blockId);
          blockStarted = true;
          // Măng holds still while the next block lights up, instead of walking on the spot.
          this.renderer.hold();
          await tween(this.app.ticker, HIGHLIGHT_MS, signal);
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
        await this.renderer.play(event, signal, next?.type === 'highlight' ? undefined : next);
      }
      if (isAborted(signal)) return 'aborted';
      this.options.onHighlight(null);
      if (outcome.result !== 'success' && outcome.result !== 'crash') this.renderer.rest();
      return 'finished';
    } finally {
      if (this.playback === playback) this.playback = null;
    }
  }

  /** Whether a replay is in progress (including one waiting for a step). */
  get playing(): boolean {
    return this.playback !== null;
  }

  /** Whether the replay is waiting for `step()`. */
  get waitingForStep(): boolean {
    return this.releaseStep !== null;
  }

  /** In step mode: act out the next action. */
  step(): void {
    this.stepping = true;
    const release = this.releaseStep;
    this.releaseStep = null;
    if (release) release();
    else this.stepQueued = true;
  }

  setSpeed(speed: Speed): void {
    this.speed = speed;
    this.applySpeed();
  }

  /** Stops any replay, puts Măng back at the start and clears the highlight. */
  reset(): void {
    this.playback?.abort();
    this.playback = null;
    this.releaseStep = null;
    this.stepQueued = false;
    this.stepping = false;
    this.options.onWaitingStep?.(false);
    this.renderer.reset();
    this.options.onHighlight(null);
  }

  destroy(): void {
    this.playback?.abort();
    this.playback = null;
    this.resizeObserver.disconnect();
    this.renderer.destroy();
    destroyStageApp(this.app);
  }

  private applySpeed(): void {
    const capped = this.tempo < 1 ? Math.min(this.speed, 1) : this.speed;
    this.app.ticker.speed = capped * this.tempo;
  }

  private waitForStep(signal: AbortSignal): Promise<void> {
    if (this.stepQueued) {
      this.stepQueued = false;
      return Promise.resolve();
    }
    this.options.onWaitingStep?.(true);
    return new Promise((resolve) => {
      const done = () => {
        signal.removeEventListener('abort', done);
        this.options.onWaitingStep?.(false);
        resolve();
      };
      this.releaseStep = done;
      signal.addEventListener('abort', done);
    });
  }
}
