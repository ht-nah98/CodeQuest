// @vitest-environment node
import { type Application, Container, Texture, Ticker } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RunOutcome } from '@codequest/engine';
import type { MazeConfig, MazeEvent } from '@codequest/games';
import type { PandaTextures } from '../assets';
import { PANDA_ANIMATIONS } from '../panda';
import { MazeStage } from './MazeStage';

const FRAME_MS = 16;
const CONFIG: MazeConfig = {
  map: ['S.b', '#.#', 'b.G'],
  startDir: 'E',
  goal: { collectAll: true },
};

/** A hand-driven clock: nothing moves until `advance` feeds it frames. */
let ticker: Ticker;
let now: number;
let canvas: { dataset: Record<string, string> };
let stage: MazeStage;

async function flush(): Promise<void> {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

async function advance(ms: number): Promise<void> {
  for (let elapsed = 0; elapsed < ms; elapsed += FRAME_MS) {
    now += FRAME_MS;
    ticker.update(now);
    await flush();
  }
}

function pandaTextures(): PandaTextures {
  const textures = {} as PandaTextures;
  for (const name of PANDA_ANIMATIONS) textures[name] = [Texture.EMPTY];
  return textures;
}

const collect: MazeEvent = { type: 'collect', blockId: 'f1', at: [0, 2] };
const move: MazeEvent = { type: 'move', blockId: 'f1', from: [0, 1], to: [0, 2], dir: 'E' };

beforeEach(() => {
  ticker = new Ticker();
  ticker.autoStart = false;
  now = 1000;
  ticker.update(now);
  canvas = { dataset: {} };
  const app = { ticker, screen: { width: 516, height: 360 }, stage: new Container(), canvas };
  stage = new MazeStage(app as unknown as Application, CONFIG, pandaTextures());
});

afterEach(() => {
  ticker.destroy();
});

describe('MazeStage', () => {
  it('starts with every shoot on the board and the goal locked', () => {
    expect(canvas.dataset).toMatchObject({
      mazeShoots: '2',
      mazeCollected: '0/2',
      mazeGoal: 'locked',
      mazeMissed: 'false',
    });
  });

  it('a collect picks the shoot up', async () => {
    const controller = new AbortController();
    const done = stage.play(collect, controller.signal);
    await advance(600);
    await done;
    expect(canvas.dataset).toMatchObject({ mazeShoots: '1', mazeCollected: '1/2' });
  });

  it('a collect aborted by Làm lại leaves the shoot on the board after reset', async () => {
    const controller = new AbortController();
    const done = stage.play(collect, controller.signal);
    await advance(160); // mid-animation
    controller.abort();
    stage.reset();
    await done;
    await advance(600);
    expect(canvas.dataset).toMatchObject({
      mazeShoots: '2',
      mazeCollected: '0/2',
      mazeGoal: 'locked',
    });
  });

  it('every event handler stops touching the scene once aborted or destroyed', async () => {
    const events: MazeEvent[] = [
      move,
      { type: 'turn', blockId: 't1', from: 'E', to: 'S' },
      { type: 'bump', blockId: 'f2', at: [0, 0], dir: 'N' },
      collect,
      { type: 'win', blockId: 'f3', at: [2, 2] },
    ];
    for (const event of events) {
      const controller = new AbortController();
      const done = stage.play(event, controller.signal);
      await advance(100);
      controller.abort();
      stage.reset();
      await done;
      await advance(200);
      expect(canvas.dataset).toMatchObject({ mazeShoots: '2', mazeStunned: 'false' });
    }
    // Destroyed mid-collect (leaving the level): the continuation must not throw.
    const controller = new AbortController();
    const done = stage.play(collect, controller.signal);
    await advance(100);
    stage.destroy();
    controller.abort();
    await expect(done).resolves.toBeUndefined();
  });

  it('marks the missed bamboo only when the run ends with MISSED_ITEMS', () => {
    const end = (reasonCode: string) =>
      ({ result: 'incomplete', reasonCode, events: [] }) as unknown as RunOutcome<MazeEvent>;
    stage.rest();
    expect(canvas.dataset.mazeMissed).toBe('false');
    stage.finish(end('NOT_AT_GOAL'));
    expect(canvas.dataset.mazeMissed).toBe('false');
    stage.finish(end('MISSED_ITEMS'));
    expect(canvas.dataset.mazeMissed).toBe('true');
    stage.reset();
    expect(canvas.dataset.mazeMissed).toBe('false');
  });

  it('rest() restarts the idle loop frozen by hold()', () => {
    const animations: string[] = [];
    const app = { ticker, screen: { width: 516, height: 360 }, stage: new Container(), canvas };
    const own = new MazeStage(app as unknown as Application, CONFIG, pandaTextures(), (name) =>
      animations.push(name),
    );
    own.hold();
    own.rest();
    expect(animations).toEqual(['idle', 'idle']);
    own.destroy();
  });

  it('a bump leaves Măng dazed until reset', async () => {
    const controller = new AbortController();
    const done = stage.play(
      { type: 'bump', blockId: 'f1', at: [0, 0], dir: 'N' },
      controller.signal,
    );
    await advance(1400);
    await done;
    expect(canvas.dataset.mazeStunned).toBe('true');
    stage.reset();
    expect(canvas.dataset.mazeStunned).toBe('false');
  });
});
