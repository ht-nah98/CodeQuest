// @vitest-environment node
import { type Application, Container, Texture, Ticker } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RunnerConfig, RunnerEvent } from '@codequest/games';
import { type PandaTextures, TILE_NAMES, type TileTextures } from '../assets';
import { PANDA_ANIMATIONS } from '../panda';
import { RunnerStage } from './RunnerStage';

/** Node's setImmediate (these tests run on Node; the web tsconfig has no Node types). */
declare const setImmediate: (callback: () => void) => unknown;

const FRAME_MS = 16;
const CONFIG: RunnerConfig = {
  cells: ['ground', 'ground', 'crate', 'ground', 'branch', 'ground', 'hole', 'ground', 'flag'],
  start: 0,
  bamboo: [3],
};

/** What the scene shows of Măng and the props, read from the stage's private state. */
interface SceneState {
  pose: { cell: number; lift: number; sink: number; squash: number; flash: number };
  shake: number;
  stunned: number;
  focus: unknown;
  wobble: unknown;
  tip: Map<number, number>;
  rise: Map<number, number>;
  missed: Set<number>;
}

/** A hand-driven clock: nothing moves until `advance` feeds it frames. */
let ticker: Ticker;
let now: number;
let stage: RunnerStage;

const scene = (): SceneState => stage as unknown as SceneState;

/** Lets pending promise continuations (the code after an awaited tween) run. */
const settle = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

async function advance(ms: number): Promise<void> {
  for (let elapsed = 0; elapsed < ms; elapsed += FRAME_MS) {
    now += FRAME_MS;
    ticker.update(now);
    await settle();
  }
}

function pandaTextures(): PandaTextures {
  const textures = {} as PandaTextures;
  for (const name of PANDA_ANIMATIONS) textures[name] = [Texture.EMPTY];
  return textures;
}

function tileTextures(): TileTextures {
  const textures = {} as TileTextures;
  for (const name of TILE_NAMES) textures[name] = Texture.EMPTY;
  return textures;
}

function createStage(onAnimation?: (name: string) => void): RunnerStage {
  const app = { ticker, screen: { width: 516, height: 360 }, stage: new Container() };
  return new RunnerStage(
    app as unknown as Application,
    CONFIG,
    tileTextures(),
    pandaTextures(),
    onAnimation,
  );
}

/** Acts out `event` to its end. */
async function playThrough(event: RunnerEvent): Promise<void> {
  const done = stage.play(event, new AbortController().signal);
  await advance(4000);
  await done;
}

function expectAtStart(): void {
  const state = scene();
  expect(state.pose).toEqual({ cell: CONFIG.start, lift: 0, sink: 0, squash: 1, flash: 0 });
  expect(state.shake).toBe(0);
  expect(state.stunned).toBe(0);
  expect(state.focus).toBeNull();
  expect(state.wobble).toBeNull();
  expect(state.tip.size).toBe(0);
  expect(state.rise.size).toBe(0);
  expect(state.missed.size).toBe(0);
}

const walkToOne: RunnerEvent = { type: 'walk', blockId: 'w0', from: 0, to: 1 };
const kick: RunnerEvent = { type: 'kick', blockId: 'k', at: 2, hit: true };
const bumpWalk: RunnerEvent = {
  type: 'bump',
  blockId: 'b',
  from: 1,
  at: 2,
  obstacle: 'crate',
  move: 'walk',
};

/** Every runner event, each with Măng somewhere other than the start before it plays. */
const EVENTS: RunnerEvent[] = [
  { type: 'walk', blockId: 'w', from: 1, to: 2 },
  { type: 'crouch', blockId: 'c', from: 3, to: 4 },
  { type: 'jump', blockId: 'j', from: 1, to: 3 },
  kick,
  { type: 'kick', blockId: 'k', at: 2, hit: false },
  { type: 'collect', blockId: 'g', at: 3 },
  { type: 'fall', blockId: 'f', at: 6 },
  bumpWalk,
  { type: 'bump', blockId: 'b', from: 3, at: 4, obstacle: 'branch', move: 'jump' },
  { type: 'bump', blockId: 'b', from: 1, at: 2, obstacle: 'crate', move: 'crouch' },
  { type: 'offTrack', blockId: 'o', from: 7 },
  { type: 'win', blockId: 'v', at: 8 },
  { type: 'missed', blockId: 'm', at: 8, left: [3] },
];

/** Abort points: early in the first tween, mid-way, and late (inside the last tween of most). */
const ABORT_AFTER_MS = [40, 200, 380, 620, 900, 1300];

beforeEach(() => {
  ticker = new Ticker();
  ticker.autoStart = false;
  now = 1000;
  ticker.update(now);
  stage = createStage();
});

afterEach(() => {
  stage.destroy();
  ticker.destroy();
});

describe('RunnerStage', () => {
  it('a kick aborted by Làm lại leaves Măng on the start cell after reset', async () => {
    await playThrough(walkToOne);
    expect(scene().pose.cell).toBe(1);
    const controller = new AbortController();
    const done = stage.play(kick, controller.signal);
    await advance(200); // in the kick itself, after the wind-up
    controller.abort();
    stage.reset();
    await done;
    await advance(600);
    expectAtStart();
  });

  it('a bump aborted mid-recoil leaves Măng on the start cell after reset', async () => {
    const controller = new AbortController();
    const done = stage.play(bumpWalk, controller.signal);
    await advance(300); // approach is 220 ms: now in the recoil
    expect(scene().stunned).toBeGreaterThan(0);
    controller.abort();
    stage.reset();
    await done;
    await advance(600);
    expectAtStart();
  });

  it('every event handler stops touching the scene once aborted, at any point', async () => {
    for (const event of EVENTS) {
      for (const ms of ABORT_AFTER_MS) {
        stage.reset();
        await playThrough(walkToOne);
        const controller = new AbortController();
        const done = stage.play(event, controller.signal);
        await advance(ms);
        controller.abort();
        stage.reset();
        await done;
        await advance(400);
        expectAtStart();
      }
    }
  });

  it('a played event ends where it should (the test harness drives the stage)', async () => {
    await playThrough(walkToOne);
    await playThrough(kick);
    expect(scene().pose.cell).toBe(1);
    expect(scene().tip.get(2)).toBe(1);
    await playThrough(bumpWalk);
    expect(scene().pose).toMatchObject({ cell: 1, lift: 0, flash: 0 });
    expect(scene().stunned).toBeGreaterThan(0);
  });

  it('destroyed mid-event: the continuation does not touch the scene or throw', async () => {
    await playThrough(walkToOne);
    for (const event of [kick, bumpWalk, EVENTS[2], EVENTS[11]]) {
      if (!event) continue;
      const controller = new AbortController();
      const done = stage.play(event, controller.signal);
      await advance(200);
      const before = { ...scene().pose };
      stage.destroy();
      controller.abort();
      await expect(done).resolves.toBeUndefined();
      expect(scene().pose).toEqual(before);
      // A destroyed stage ignores later calls.
      stage.rest();
      stage.resize(800, 500);
      await expect(stage.play(walkToOne, new AbortController().signal)).resolves.toBeUndefined();
      expect(scene().pose).toEqual(before);
      stage = createStage();
      await playThrough(walkToOne);
    }
  });

  it('rest() restarts the idle loop frozen by hold()', () => {
    const animations: string[] = [];
    const own = createStage((name) => animations.push(name));
    own.hold();
    own.rest();
    expect(animations).toEqual(['idle', 'idle']);
    own.destroy();
  });
});
