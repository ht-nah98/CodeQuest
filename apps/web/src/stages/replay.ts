import type { Ticker } from 'pixi.js';
import type {
  CallEvent,
  GameEvent,
  RetEvent,
  RunOutcome,
  SenseEvent,
  VarEvent,
} from '@codequest/engine';
import { isAborted, type StageRenderer, tween } from './types';

/** Playback speed chosen by the child (Chậm / Vừa / Nhanh). */
export type Speed = 0.5 | 1 | 2;

/** Pause after each highlight before the action, at speed 1 (stage-rendering.md §1). */
export const HIGHLIGHT_MS = 120;
/**
 * A won run plays a little faster, a lost one slower and never above 1× (overview.md §4). A
 * timed-out run plays at the chosen speed (tempo 1): its lap can be long.
 */
export const WIN_TEMPO = 1.25;
export const LOSE_TEMPO = 0.85;
/**
 * How long a question block shows its answer (✔/✘) after it is asked, at speed 1 (P2-11,
 * curriculum.md §5.4 T7). The mark stays until the next action starts, so a step waits under it.
 */
export const SENSE_MS = 380;
/**
 * How long a box change (`var` event, ADR-0022 §6) holds the replay at speed 1, so the box panel's
 * pop / count-up is seen before the next block runs. Măng stands still meanwhile.
 */
export const VAR_MS = 320;
/**
 * How long a spell's start or end (`call` / `ret`, ADR-0023 §3) holds the replay at speed 1, so
 * the lit `dạy phép` block and the bubble "Đang làm phép «…»" are seen. Măng stands still.
 */
export const SPELL_MS = 240;
/** A spell starts (`call`) or ends (`ret`). */
export type SpellEvent = CallEvent | RetEvent;
const isSpellEvent = (event: GameEvent): event is SpellEvent =>
  event.type === 'call' || event.type === 'ret';
/** Events the replay holds on by itself; the renderer never sees them. */
const isReplayBoundary = (event: GameEvent): boolean =>
  event.type === 'highlight' ||
  event.type === 'sense' ||
  event.type === 'var' ||
  isSpellEvent(event);

/**
 * A timed-out run can hold thousands of events (TIMEOUT, coach question G13). When the run goes
 * round in a cycle, its replay shows at least TIMEOUT_REPLAY_MS of stage clock (speed 1) and
 * ends on a lap boundary after at least one full lap, so the child sees Măng come round again
 * before she gets dizzy (T8). Coach bug 16/10/2026: cutting at 3 s stopped w05-boss mid-ring,
 * which looked like a bug.
 */
export const TIMEOUT_REPLAY_MS = 3000;
/** How far (stage clock at speed 1) a timed-out run is searched for a lap. */
export const TIMEOUT_REPLAY_MAX_MS = 30_000;
/** Replay of a timed-out run without a lap in TIMEOUT_REPLAY_MAX_MS (at speed 1). */
export const TIMEOUT_NO_LAP_MS = 5000;

/** A question block was asked (`sense` event): the block and its answer. */
export interface SenseMark {
  blockId: string;
  value: boolean;
}

/** Replay time of one event at speed 1, by the replay's own holds or the renderer's estimate. */
function eventMs(event: GameEvent, estimate: (event: GameEvent) => number): number {
  if (event.type === 'highlight') return HIGHLIGHT_MS;
  if (event.type === 'sense') return SENSE_MS;
  if (event.type === 'var') return VAR_MS;
  if (isSpellEvent(event)) return SPELL_MS;
  return estimate(event);
}

/** Where the actor stands, read from events only (any game kind), plus the boxes. */
interface Pose {
  cell: string;
  dir: string;
  pen: string;
  vars: Map<string, number>;
}

/**
 * Updates the pose after an event, from its fields alone: a `turn` sets the heading from `to`
 * (maze / robot `'N'`…, turtle 0…11); any other `to` / `at` (a cell array, a runner index, a
 * turtle point) sets the place; `dir` sets the heading; `pen` the turtle's pen; `var` a box.
 * Limitation (L1): what a robot holds and which jobs are done are not in the pose, so a robot
 * going round the same crossings while its gripper changes counts as a lap one lap early. That
 * only shortens a replay, never stops one mid-move.
 */
function trackPose(event: GameEvent, pose: Pose): void {
  const fields = event as GameEvent & { to?: unknown; at?: unknown; dir?: unknown; down?: unknown };
  if (event.type === 'var') {
    const { id, value } = event as VarEvent;
    pose.vars.set(id, value);
    return;
  }
  if (event.type === 'turn') {
    if (fields.to !== undefined) pose.dir = JSON.stringify(fields.to);
    return;
  }
  if (event.type === 'pen' && typeof fields.down === 'boolean') pose.pen = String(fields.down);
  const place = fields.to ?? fields.at;
  if (place !== undefined) pose.cell = JSON.stringify(place);
  if (typeof fields.dir === 'string') pose.dir = JSON.stringify(fields.dir);
}

const poseKey = (pose: Pose, blockId: string | null): string =>
  [
    pose.cell,
    pose.dir,
    pose.pen,
    [...pose.vars].map(([id, value]) => `${id}=${String(value)}`).join(';'),
    String(blockId),
  ].join('|');

/**
 * The start of a timed-out run's events to replay. Two passes, both pure (the cut is the same on
 * every replay), timed at speed 1 by the replay's holds and `estimate`:
 * 1. Up to TIMEOUT_REPLAY_MAX_MS, find the first highlight whose key (place, heading, pen, boxes,
 *    block) was seen before: that key starts a lap.
 * 2. With a lap: cut just before the first highlight with that key, not before the lap closed
 *    once, at or after TIMEOUT_REPLAY_MS, so the replay ends on a lap boundary. Without one: cut
 *    at the first highlight, question or other boundary at or after TIMEOUT_NO_LAP_MS.
 * Keeps at least one event; a block is never left half done.
 */
export function timeoutReplayEvents(
  events: readonly GameEvent[],
  estimate: (event: GameEvent) => number,
): GameEvent[] {
  // Pass 1: the key and index of the first repeat, and each highlight's key and clock.
  const pose: Pose = { cell: '', dir: '', pen: '', vars: new Map() };
  const keys = new Map<number, string>();
  const seen = new Set<string>();
  const startMs: number[] = [];
  let lap: { key: string; at: number } | null = null;
  let ms = 0;
  for (const [index, event] of events.entries()) {
    startMs.push(ms);
    if (event.type === 'highlight') {
      const key = poseKey(pose, event.blockId);
      keys.set(index, key);
      if (lap === null && ms <= TIMEOUT_REPLAY_MAX_MS && seen.has(key)) lap = { key, at: index };
      seen.add(key);
    }
    trackPose(event, pose);
    ms += eventMs(event, estimate);
  }
  // Pass 2: where to cut.
  let cut = events.length;
  for (let index = 1; index < events.length; index++) {
    const event = events[index] as GameEvent;
    const at = startMs[index] ?? 0;
    if (lap !== null) {
      if (index >= lap.at && keys.get(index) === lap.key && at >= TIMEOUT_REPLAY_MS) {
        cut = index;
        break;
      }
    } else if (isReplayBoundary(event) && at >= TIMEOUT_NO_LAP_MS) {
      cut = index;
      break;
    }
  }
  return events.slice(0, cut);
}

export type PlayResult = 'finished' | 'aborted';

export interface ReplayHooks {
  /** Lights up the block that runs now; `null` clears it (Blockly `highlightBlock`). */
  onHighlight: (blockId: string | null) => void;
  /**
   * A question block was asked (`sense` event, P2-11): show its ✔/✘ on that block; `null` clears
   * the mark (the next action starts, the replay ends or the stage is reset).
   */
  onSense?: (mark: SenseMark | null) => void;
  /**
   * A box changed (`var` event, ADR-0022 §6): the box panel shows the new number (or, with
   * `overflow`, that the box is full). Never handed to the renderer, which knows no boxes.
   */
  onVar?: (event: VarEvent) => void;
  /**
   * A spell starts or ends (`call` / `ret`, ADR-0023 §6): light the `dạy phép` block of
   * `event.id` and say "Đang làm phép «…»", or (`ret`) turn it off; `null` clears it (reset, end).
   * Never handed to the renderer.
   */
  onSpell?: (event: SpellEvent | null) => void;
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
  /** A question block shows its answer (cleared by the next action, the end or a reset). */
  private senseShown = false;

  constructor(
    private readonly ticker: Ticker,
    private renderer: StageRenderer<GameEvent>,
    private readonly hooks: ReplayHooks,
  ) {}

  /**
   * Replays on another renderer from now on (another map of a multi-map level, P2-12): stops any
   * replay, then resets like `reset()` on the new scene. The chosen speed is kept.
   */
  setRenderer(renderer: StageRenderer<GameEvent>): void {
    this.stop();
    this.renderer = renderer;
    this.reset();
  }

  /**
   * Replays a run from the start: highlight events light up their block for HIGHLIGHT_MS, sense
   * events show the question's answer for SENSE_MS, var events go to `onVar` for VAR_MS (the box
   * panel), call / ret events go to `onSpell` for SPELL_MS, action events go to the renderer. A
   * timed-out run plays up to one full lap of its cycle (or TIMEOUT_NO_LAP_MS without one), at
   * the child's own speed, then Măng gets dizzy (`timeoutReplayEvents`). Resolves 'aborted' if reset / destroyed /
   * replayed meanwhile.
   */
  async play(outcome: RunOutcome, options: { step?: boolean } = {}): Promise<PlayResult> {
    this.reset();
    const playback = new AbortController();
    this.playback = playback;
    const { signal } = playback;
    this.stepping = options.step ?? false;
    // A timed-out run plays at the child's own speed (tempo 1, no 1× cap): its lap can be long,
    // and "Nhanh" must help.
    this.tempo =
      outcome.result === 'success' ? WIN_TEMPO : outcome.result === 'timeout' ? 1 : LOSE_TEMPO;
    this.applySpeed();

    const timedOut = outcome.result === 'timeout';
    const events = timedOut
      ? timeoutReplayEvents(outcome.events, (event) => this.renderer.estimate(event))
      : outcome.events;
    // In step mode the replay waits once per block, before the first action after a highlight,
    // and before every question and box change (a loop asks again without a new highlight). Follow-up events of
    // the same block (fall, win) play on without another step.
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
        const isSense = event.type === 'sense';
        const isVar = event.type === 'var';
        const isSpell = isSpellEvent(event);
        if (this.stepping && (firstOfBlock || isSense || isVar || isSpell)) {
          this.renderer.rest();
          await this.waitForStep(signal);
          if (isAborted(signal)) return 'aborted';
        }
        if (isSense) {
          const { value } = event as SenseEvent;
          if (event.blockId !== null) {
            this.senseShown = true;
            this.hooks.onSense?.({ blockId: event.blockId, value });
          }
          this.renderer.hold();
          await tween(this.ticker, SENSE_MS, signal);
          continue;
        }
        this.clearSense();
        if (isVar) {
          this.hooks.onVar?.(event as VarEvent);
          this.renderer.hold();
          await tween(this.ticker, VAR_MS, signal);
          continue;
        }
        if (isSpell) {
          this.hooks.onSpell?.(event);
          this.renderer.hold();
          await tween(this.ticker, SPELL_MS, signal);
          continue;
        }
        const next = events[index + 1];
        this.hooks.onEvent?.(event);
        await this.renderer.play(
          event,
          signal,
          next === undefined || isReplayBoundary(next) ? undefined : next,
        );
      }
      if (isAborted(signal)) return 'aborted';
      this.clearSense();
      this.hooks.onSpell?.(null);
      this.hooks.onHighlight(null);
      if (timedOut && this.renderer.dizzy) {
        // The loop never stops: Măng spins and sees stars, then stays dizzy (T8, T18).
        await this.renderer.dizzy(signal);
        if (isAborted(signal)) return 'aborted';
      } else if (
        (outcome.result !== 'success' && outcome.result !== 'crash') ||
        // A full box ends the run without a crash of the kind's own: Măng just stops.
        outcome.reasonCode === 'BOX_FULL'
      ) {
        this.renderer.rest();
      }
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
    this.clearSense();
    this.hooks.onSpell?.(null);
    this.hooks.onHighlight(null);
  }

  /**
   * Stops any replay without touching the scene (the stage is being torn down). A lit spell is
   * workspace state, not scene state: it is turned off.
   */
  stop(): void {
    this.playback?.abort();
    this.playback = null;
    this.hooks.onSpell?.(null);
  }

  private clearSense(): void {
    if (!this.senseShown) return;
    this.senseShown = false;
    this.hooks.onSense?.(null);
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
