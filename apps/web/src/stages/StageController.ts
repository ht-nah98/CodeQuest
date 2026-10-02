import type { Application } from 'pixi.js';
import type { GameKindId } from '@codequest/content-schema';
import type { GameEvent, RunOutcome } from '@codequest/engine';
import { createStageApp, destroyStageApp } from './createStageApp';
import { getStageKind } from './registry';
import { type PlayResult, Replay, type Speed } from './replay';
import { isAborted, type PandaAnimationListener, type StageRenderer } from './types';

export type { PlayResult, Speed } from './replay';
export { HIGHLIGHT_MS, TIMEOUT_REPLAY_EVENTS } from './replay';

export interface StageControllerOptions {
  /** `level.kind`: picks the renderer from the stage registry (`stages/registry.ts`). */
  kind: GameKindId;
  /** `level.config`, validated by the kind's renderer factory. */
  config: unknown;
  /** Lights up the block that runs now; `null` clears it (Blockly `highlightBlock`). */
  onHighlight: (blockId: string | null) => void;
  onAnimation?: PandaAnimationListener;
  /** Step mode: true while the replay waits for `step()` (e2e reads it as data-waiting-step). */
  onWaitingStep?: (waiting: boolean) => void;
  /** The clock's speed after every change (e2e, dev build: data-stage-speed). */
  onClockSpeed?: (speed: number) => void;
  /** An action event's animation starts (the play screen plays its sound effect). */
  onEvent?: (event: GameEvent) => void;
  /** The stage went back to the start (Làm lại, Dừng, and the start of every run). */
  onReset?: () => void;
}

/**
 * One per level (stage-rendering.md §1): owns the PIXI application and its one clock, mounts
 * the renderer of the level's kind and replays runs on it (run / pause / step / speed / reset).
 * Blockly stays out of `stages/`: highlighting goes through `onHighlight`.
 */
export class StageController {
  private readonly replay: Replay;
  private readonly resizeObserver: ResizeObserver;

  private constructor(
    private readonly app: Application,
    private readonly renderer: StageRenderer<GameEvent>,
    options: StageControllerOptions,
    container: HTMLElement,
  ) {
    this.replay = new Replay(app.ticker, renderer, options);
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
   * Loads assets and mounts the stage of `options.kind`, filling `container`. Resolves `null`
   * when `signal` aborts first (React StrictMode unmounts on purpose), leaving no canvas behind.
   * Rejects when the kind has no renderer or the config does not fit it.
   */
  static async mount(
    container: HTMLElement,
    signal: AbortSignal,
    options: StageControllerOptions,
  ): Promise<StageController | null> {
    const kind = getStageKind(options.kind);
    if (kind === undefined) throw new Error(`No stage for game kind: ${options.kind}`);
    const create = await kind.prepare();
    if (isAborted(signal)) return null;
    const app = await createStageApp(container, signal, {
      width: Math.max(1, Math.floor(container.clientWidth)),
      height: Math.max(1, Math.floor(container.clientHeight)),
      background: kind.background,
    });
    if (!app) return null;
    try {
      const renderer = create(app, options.config, options);
      return new StageController(app, renderer, options, container);
    } catch (error) {
      destroyStageApp(app);
      throw error;
    }
  }

  /** Replays a run from the start; resolves 'aborted' if reset / destroyed / replayed meanwhile. */
  play(outcome: RunOutcome, options: { step?: boolean } = {}): Promise<PlayResult> {
    return this.replay.play(outcome, options);
  }

  /** Whether a replay is in progress (including a paused one or one waiting for a step). */
  get playing(): boolean {
    return this.replay.playing;
  }

  get paused(): boolean {
    return this.replay.isPaused;
  }

  /** Whether the replay is waiting for `step()`. */
  get waitingForStep(): boolean {
    return this.replay.waitingForStep;
  }

  /** Freezes the replay mid-move (every tween and sprite stands still). */
  pause(): void {
    this.replay.pause();
  }

  resume(): void {
    this.replay.resume();
  }

  /** In step mode: act out the next block (a paused replay continues up to the next block). */
  step(): void {
    this.replay.step();
  }

  setSpeed(speed: Speed): void {
    this.replay.setSpeed(speed);
  }

  /** Stops any replay at once, puts the scene back at the start and clears the highlight. */
  reset(): void {
    this.replay.reset();
  }

  destroy(): void {
    this.replay.stop();
    this.resizeObserver.disconnect();
    this.renderer.destroy();
    destroyStageApp(this.app);
  }
}
