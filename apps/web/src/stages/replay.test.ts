// @vitest-environment node
import { Ticker } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GameEvent, RunOutcome } from '@codequest/engine';
import {
  HIGHLIGHT_MS,
  LOSE_TEMPO,
  Replay,
  SENSE_MS,
  type SenseMark,
  TIMEOUT_REPLAY_MS,
  timeoutReplayEvents,
  WIN_TEMPO,
} from './replay';
import { type StageRenderer, tween } from './types';

/** Node's setImmediate (these tests run on Node; the web tsconfig has no Node types). */
declare const setImmediate: (callback: () => void) => unknown;

const FRAME_MS = 16;
const ACTION_MS = 200;

/** A hand-driven clock: nothing moves until `advance` feeds it frames. */
let ticker: Ticker;
let now: number;

/** Lets every pending promise continuation run (a macrotask comes after all microtasks). */
function flush(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

async function advance(ms: number): Promise<void> {
  for (let elapsed = 0; elapsed < ms; elapsed += FRAME_MS) {
    now += FRAME_MS;
    ticker.update(now);
    await flush();
  }
}

/** A renderer whose every action is one tween on the clock, recording progress and calls. */
class FakeRenderer implements StageRenderer<GameEvent> {
  readonly played: string[] = [];
  /** The `next` argument of each play() call (its type, or null when none was given). */
  readonly nexts: Array<string | null> = [];
  readonly calls: string[] = [];
  progress = 0;

  constructor(private readonly clock: Ticker) {}

  reset(): void {
    this.calls.push('reset');
    this.progress = 0;
  }
  async play(event: GameEvent, signal: AbortSignal, next?: GameEvent): Promise<void> {
    this.played.push(event.type);
    this.nexts.push(next?.type ?? null);
    await tween(this.clock, ACTION_MS, signal, (t) => {
      this.progress = t;
    });
  }
  estimate(): number {
    return ACTION_MS;
  }
  rest(): void {
    this.calls.push('rest');
  }
  hold(): void {
    this.calls.push('hold');
  }
  finish(): void {
    this.calls.push('finish');
  }
  resize(): void {}
  dizzy?: (signal: AbortSignal) => Promise<void>;
  destroy(): void {}
}

function outcome(result: RunOutcome['result'], actions: number): RunOutcome {
  const events: RunOutcome['events'][number][] = [];
  for (let i = 0; i < actions; i++) {
    events.push({ type: 'highlight', blockId: `b${String(i)}` });
    events.push({ type: 'walk', blockId: `b${String(i)}` });
  }
  return {
    result,
    reasonCode: result === 'success' ? null : 'NOT_AT_GOAL',
    events,
    stats: { steps: actions, actions, blocksUsed: actions },
  };
}

let renderer: FakeRenderer;
let highlights: Array<string | null>;
let waiting: boolean[];
let replay: Replay;

beforeEach(() => {
  ticker = new Ticker();
  ticker.autoStart = false;
  now = 1000;
  ticker.update(now);
  renderer = new FakeRenderer(ticker);
  highlights = [];
  waiting = [];
  replay = new Replay(ticker, renderer, {
    onHighlight: (id) => highlights.push(id),
    onWaitingStep: (w) => waiting.push(w),
  });
});

afterEach(() => {
  ticker.destroy();
});

describe('Replay', () => {
  it('plays every event in order and finishes', async () => {
    const done = replay.play(outcome('success', 3));
    await advance((3 * (HIGHLIGHT_MS + ACTION_MS)) / WIN_TEMPO + 200);
    await expect(done).resolves.toBe('finished');
    expect(renderer.played).toEqual(['walk', 'walk', 'walk']);
    expect(highlights).toEqual([null, 'b0', 'b1', 'b2', null]);
    expect(ticker.count).toBe(0);
    expect(renderer.calls.filter((call) => call === 'finish')).toHaveLength(1);
    expect(renderer.calls.at(-1)).toBe('finish');
  });

  it('setRenderer aborts the replay, resets the new scene and keeps the speed (P2-12)', async () => {
    replay.setSpeed(2);
    const done = replay.play(outcome('success', 3));
    await advance(HIGHLIGHT_MS / 2);
    const before = [...renderer.played];
    const next = new FakeRenderer(ticker);
    replay.setRenderer(next);
    await flush();
    await expect(done).resolves.toBe('aborted');
    expect(next.calls).toEqual(['reset']);
    expect(ticker.speed).toBe(2);

    const again = replay.play(outcome('success', 1));
    await advance(1000);
    await expect(again).resolves.toBe('finished');
    expect(next.played).toEqual(['walk']);
    // The old scene got nothing more after the swap.
    expect(renderer.played).toEqual(before);
  });

  it('calls finish after rest for an unfinished run, never after an abort or between steps', async () => {
    const stepped = replay.play(outcome('incomplete', 2), { step: true });
    await advance(HIGHLIGHT_MS * 2);
    expect(replay.waitingForStep).toBe(true);
    expect(renderer.calls).toContain('rest');
    expect(renderer.calls).not.toContain('finish');
    replay.reset();
    await flush();
    await expect(stepped).resolves.toBe('aborted');
    expect(renderer.calls).not.toContain('finish');

    const done = replay.play(outcome('incomplete', 1));
    await advance(1000);
    await expect(done).resolves.toBe('finished');
    expect(renderer.calls.slice(-2)).toEqual(['rest', 'finish']);
  });

  it('Làm lại mid-replay stops at once: no tween keeps running on the clock', async () => {
    const done = replay.play(outcome('crash', 5));
    await advance(HIGHLIGHT_MS + ACTION_MS / 2);
    expect(renderer.played).toEqual(['walk']);
    expect(ticker.count).toBe(1); // the walk's tween

    replay.reset();
    await flush();
    await expect(done).resolves.toBe('aborted');
    expect(ticker.count).toBe(0);
    expect(replay.playing).toBe(false);
    expect(renderer.calls.at(-1)).toBe('reset');
    expect(highlights.at(-1)).toBeNull();

    // Time passes: nothing else is played, nothing moves, nothing is highlighted.
    const progress = renderer.progress;
    const highlightCount = highlights.length;
    await advance(5 * (HIGHLIGHT_MS + ACTION_MS) * 2);
    expect(renderer.played).toEqual(['walk']);
    expect(renderer.progress).toBe(progress);
    expect(highlights).toHaveLength(highlightCount);
    expect(ticker.count).toBe(0);
  });

  it('reset while paused or waiting for a step also leaves nothing behind', async () => {
    const paused = replay.play(outcome('crash', 3));
    await advance(HIGHLIGHT_MS + 40);
    replay.pause();
    replay.reset();
    await flush();
    await expect(paused).resolves.toBe('aborted');
    expect(ticker.count).toBe(0);
    expect(ticker.speed).toBe(1);

    const stepping = replay.play(outcome('crash', 3), { step: true });
    await advance(HIGHLIGHT_MS + 40);
    expect(replay.waitingForStep).toBe(true);
    replay.reset();
    await flush();
    await expect(stepping).resolves.toBe('aborted');
    expect(ticker.count).toBe(0);
    expect(waiting.at(-1)).toBe(false);
  });

  it('pause freezes the move mid-way; resume carries on from there', async () => {
    const done = replay.play(outcome('success', 1));
    await advance(HIGHLIGHT_MS / WIN_TEMPO + ACTION_MS / 2 / WIN_TEMPO);
    replay.pause();
    expect(replay.isPaused).toBe(true);
    expect(ticker.speed).toBe(0);
    const frozen = renderer.progress;
    expect(frozen).toBeGreaterThan(0.2);
    expect(frozen).toBeLessThan(0.8);
    await advance(2000);
    expect(renderer.progress).toBe(frozen);

    replay.resume();
    expect(ticker.speed).toBe(WIN_TEMPO);
    await advance(ACTION_MS);
    await expect(done).resolves.toBe('finished');
    expect(renderer.progress).toBe(1);
    expect(replay.isPaused).toBe(false);
  });

  it('pause and resume do nothing without a replay', () => {
    replay.pause();
    expect(replay.isPaused).toBe(false);
    expect(ticker.speed).toBe(1);
  });

  it('a step while paused resumes and stops before the next block', async () => {
    const done = replay.play(outcome('success', 2));
    await advance(HIGHLIGHT_MS / WIN_TEMPO + 30);
    replay.pause();
    replay.step();
    expect(replay.isPaused).toBe(false);
    await advance(ACTION_MS + HIGHLIGHT_MS);
    expect(replay.waitingForStep).toBe(true);
    expect(renderer.played).toEqual(['walk']);
    replay.step();
    await advance(ACTION_MS + 50);
    await expect(done).resolves.toBe('finished');
  });

  it('step mode waits once per block until step()', async () => {
    const done = replay.play(outcome('success', 2), { step: true });
    await advance(HIGHLIGHT_MS * 2);
    expect(replay.waitingForStep).toBe(true);
    expect(renderer.played).toEqual([]);
    await advance(1000);
    expect(renderer.played).toEqual([]);
    replay.step();
    await advance(ACTION_MS + HIGHLIGHT_MS);
    expect(renderer.played).toEqual(['walk']);
    expect(replay.waitingForStep).toBe(true);
    replay.step();
    await advance(ACTION_MS + 50);
    await expect(done).resolves.toBe('finished');
  });

  it('speeds: 0.5 / 1 / 2; a won replay plays faster, a lost one never above 1×', async () => {
    replay.setSpeed(2);
    const won = replay.play(outcome('success', 1));
    expect(ticker.speed).toBe(2 * WIN_TEMPO);
    replay.setSpeed(0.5);
    expect(ticker.speed).toBe(0.5 * WIN_TEMPO);
    replay.reset();
    await won;

    replay.setSpeed(2);
    const lost = replay.play(outcome('crash', 1));
    expect(ticker.speed).toBe(LOSE_TEMPO);
    replay.setSpeed(0.5);
    expect(ticker.speed).toBe(0.5 * LOSE_TEMPO);
    replay.reset();
    await lost;
  });

  it('a new play aborts the one before it', async () => {
    const first = replay.play(outcome('crash', 3));
    await advance(HIGHLIGHT_MS + 30);
    const second = replay.play(outcome('success', 1));
    await flush();
    await expect(first).resolves.toBe('aborted');
    await advance(1000);
    await expect(second).resolves.toBe('finished');
    expect(ticker.count).toBe(0);
  });

  it('a timed-out run replays about TIMEOUT_REPLAY_MS of its start, then finishes once', async () => {
    const long = outcome('timeout', 30); // 60 events, far more than 3 s
    const kept = timeoutReplayEvents(long.events, () => ACTION_MS);
    // highlight + walk = 320 ms per block: 10 blocks reach 3 200 ms ≥ 3 000 ms.
    expect(kept).toHaveLength(20);
    const done = replay.play(long);
    await advance(30 * (HIGHLIGHT_MS + ACTION_MS) * 2);
    await expect(done).resolves.toBe('finished');
    expect(renderer.played).toHaveLength(10);
    expect(renderer.calls.filter((call) => call === 'finish')).toHaveLength(1);
    // Without a dizzy cue the renderer just rests.
    expect(renderer.calls.slice(-2)).toEqual(['rest', 'finish']);
  });

  it('timeoutReplayEvents keeps at least one event and counts senses as SENSE_MS', () => {
    expect(timeoutReplayEvents([{ type: 'walk', blockId: null }], () => 99_999)).toHaveLength(1);
    const asks = Array.from({ length: 40 }, (_, i) => ({
      type: 'sense',
      blockId: `s${String(i)}`,
      value: false,
    }));
    expect(timeoutReplayEvents(asks, () => 0)).toHaveLength(Math.ceil(TIMEOUT_REPLAY_MS / SENSE_MS));
  });

  it('a timed-out run ends with the dizzy cue instead of rest, then finish', async () => {
    const order: string[] = [];
    renderer.dizzy = async (signal) => {
      order.push('dizzy');
      await tween(ticker, 500, signal);
    };
    const done = replay.play(outcome('timeout', 2));
    await advance(2 * (HIGHLIGHT_MS + ACTION_MS) * 2 + 600);
    await expect(done).resolves.toBe('finished');
    expect(order).toEqual(['dizzy']);
    expect(renderer.calls).not.toContain('rest');
    expect(renderer.calls.at(-1)).toBe('finish');
  });

  it('sense events light the question block for SENSE_MS, never reach the renderer', async () => {
    const marks: Array<SenseMark | null> = [];
    replay = new Replay(ticker, renderer, {
      onHighlight: (id) => highlights.push(id),
      onSense: (mark) => marks.push(mark),
    });
    const run: RunOutcome = {
      result: 'success',
      reasonCode: null,
      events: [
        { type: 'highlight', blockId: 'if1' },
        { type: 'sense', blockId: 'ask1', value: true },
        { type: 'highlight', blockId: 'b1' },
        { type: 'walk', blockId: 'b1' },
        { type: 'highlight', blockId: 'if1' },
        { type: 'sense', blockId: 'ask1', value: false },
      ],
      stats: { steps: 2, actions: 3, blocksUsed: 3 },
    };
    const done = replay.play(run);
    await advance((HIGHLIGHT_MS + SENSE_MS / 2) / WIN_TEMPO);
    expect(marks).toEqual([{ blockId: 'ask1', value: true }]);
    await advance(3000);
    await expect(done).resolves.toBe('finished');
    expect(renderer.played).toEqual(['walk']);
    // Shown, cleared by the walk, shown again, cleared at the end.
    expect(marks).toEqual([
      { blockId: 'ask1', value: true },
      null,
      { blockId: 'ask1', value: false },
      null,
    ]);
  });

  it('step mode waits before every question, also a loop asking again', async () => {
    const marks: Array<SenseMark | null> = [];
    replay = new Replay(ticker, renderer, {
      onHighlight: (id) => highlights.push(id),
      onSense: (mark) => marks.push(mark),
    });
    const ask = (value: boolean) =>
      ({ type: 'sense', blockId: 'ask', value }) as RunOutcome['events'][number];
    const run: RunOutcome = {
      result: 'success',
      reasonCode: null,
      events: [
        { type: 'highlight', blockId: 'until' },
        ask(false),
        { type: 'highlight', blockId: 'w' },
        { type: 'walk', blockId: 'w' },
        ask(true),
      ],
      stats: { steps: 2, actions: 3, blocksUsed: 3 },
    };
    const done = replay.play(run, { step: true });
    await advance(HIGHLIGHT_MS + 50);
    expect(replay.waitingForStep).toBe(true);
    expect(marks).toEqual([]);
    replay.step();
    await advance(SENSE_MS + HIGHLIGHT_MS + 50);
    expect(marks).toEqual([{ blockId: 'ask', value: false }]);
    // Waiting before the walk with the answer still shown.
    expect(replay.waitingForStep).toBe(true);
    replay.step();
    await advance(ACTION_MS + 50);
    expect(replay.waitingForStep).toBe(true);
    expect(marks.at(-1)).toBeNull();
    replay.step();
    await advance(SENSE_MS + 50);
    await expect(done).resolves.toBe('finished');
    expect(marks.at(-2)).toEqual({ blockId: 'ask', value: true });
  });

  it('reset clears a shown answer', async () => {
    const marks: Array<SenseMark | null> = [];
    replay = new Replay(ticker, renderer, {
      onHighlight: () => undefined,
      onSense: (mark) => marks.push(mark),
    });
    const done = replay.play({
      result: 'success',
      reasonCode: null,
      events: [{ type: 'sense', blockId: 'a', value: true }],
      stats: { steps: 1, actions: 1, blocksUsed: 1 },
    });
    await advance(SENSE_MS / 2);
    replay.reset();
    await expect(done).resolves.toBe('aborted');
    expect(marks).toEqual([{ blockId: 'a', value: true }, null]);
  });

  it('S pressed twice before the step wait is kept once: it does not skip two waits', async () => {
    const done = replay.play(outcome('success', 3), { step: true });
    // Both presses land during the first highlight, before the replay waits.
    replay.step();
    replay.step();
    await advance(HIGHLIGHT_MS + ACTION_MS + HIGHLIGHT_MS + 100);
    expect(renderer.played).toEqual(['walk']);
    expect(replay.waitingForStep).toBe(true);
    await advance(1000);
    expect(renderer.played).toEqual(['walk']);
    replay.reset();
    await expect(done).resolves.toBe('aborted');
  });

  it('passes the following event of the same block as `next`, never a highlight', async () => {
    const run: RunOutcome = {
      result: 'crash',
      reasonCode: 'FELL_IN_HOLE',
      events: [
        { type: 'highlight', blockId: 'b0' },
        { type: 'walk', blockId: 'b0' },
        { type: 'highlight', blockId: 'b1' },
        { type: 'jump', blockId: 'b1' },
        { type: 'fall', blockId: 'b1' },
      ],
      stats: { steps: 2, actions: 2, blocksUsed: 2 },
    };
    const done = replay.play(run);
    await advance(5 * (HIGHLIGHT_MS + ACTION_MS) * 2);
    await expect(done).resolves.toBe('finished');
    expect(renderer.played).toEqual(['walk', 'jump', 'fall']);
    expect(renderer.nexts).toEqual([null, 'fall', null]);
  });
});

describe('Replay onEvent (sound effects)', () => {
  it('reports each action event as its animation starts, on the replay clock, in step mode too', async () => {
    const seen: Array<{ type: string; progress: number }> = [];
    const hooked = new Replay(ticker, renderer, {
      onHighlight: () => undefined,
      onEvent: (event) => seen.push({ type: event.type, progress: renderer.progress }),
    });
    const done = hooked.play(outcome('incomplete', 2), { step: true });
    await advance(HIGHLIGHT_MS * 3);
    // Waiting for the first step: no sound yet.
    expect(seen).toEqual([]);
    hooked.step();
    await advance(16);
    expect(seen.map((s) => s.type)).toEqual(['walk']);
    hooked.step();
    await advance((2 * (HIGHLIGHT_MS + ACTION_MS)) / LOSE_TEMPO + 200);
    hooked.step();
    await advance(400);
    await expect(done).resolves.toBe('finished');
    expect(seen.map((s) => s.type)).toEqual(['walk', 'walk']);
    // Each one fires before its own animation moved (progress of the previous one is done or 0).
    expect(seen.every((s) => s.progress === 0 || s.progress === 1)).toBe(true);
  });
});

describe('Replay onReset', () => {
  it('reports every reset after the renderer reset, including the one each run starts with', async () => {
    const order: string[] = [];
    const hooked = new Replay(ticker, renderer, {
      onHighlight: () => undefined,
      onEvent: (event) => order.push(event.type),
      onReset: () => order.push(`onReset after ${renderer.calls.at(-1) ?? 'nothing'}`),
    });
    const done = hooked.play(outcome('incomplete', 1));
    expect(order).toEqual(['onReset after reset']);
    await advance(HIGHLIGHT_MS + 32);
    hooked.reset();
    await expect(done).resolves.toBe('aborted');
    expect(order).toEqual(['onReset after reset', 'walk', 'onReset after reset']);
  });
});
