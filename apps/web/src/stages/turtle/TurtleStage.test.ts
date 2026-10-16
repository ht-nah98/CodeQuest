// @vitest-environment node
import { type Application, Container, Texture, Ticker } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RunOutcome } from '@codequest/engine';
import type { TurtleConfig, TurtleEvent } from '@codequest/games';
import type { PandaTextures } from '../assets';
import { PANDA_ANIMATIONS } from '../panda';
import { TurtleStage } from './TurtleStage';

const FRAME_MS = 16;
/** A 2 × 2 square from (1, 1), counter-clockwise. */
const CONFIG: TurtleConfig = {
  size: { w: 4, h: 4 },
  start: { x: 1, y: 1, heading: 0 },
  target: [{ from: [1, 1], heading: 0, path: 'F2 L90 F2 L90 F2 L90 F2' }],
  grid: 'square',
};

let ticker: Ticker;
let now: number;
let canvas: { dataset: Record<string, string> };
let stage: TurtleStage;

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

async function play(event: TurtleEvent): Promise<void> {
  const done = stage.play(event, new AbortController().signal);
  await advance(stage.estimate(event) + 100);
  await done;
}

function pandaTextures(): PandaTextures {
  const textures = {} as PandaTextures;
  for (const name of PANDA_ANIMATIONS) textures[name] = [Texture.EMPTY];
  return textures;
}

beforeEach(() => {
  ticker = new Ticker();
  ticker.autoStart = false;
  now = 1000;
  ticker.update(now);
  canvas = { dataset: {} };
  const app = { ticker, screen: { width: 640, height: 480 }, stage: new Container(), canvas };
  stage = new TurtleStage(app as unknown as Application, CONFIG, pandaTextures());
});

afterEach(() => {
  ticker.destroy();
});

describe('TurtleStage', () => {
  it('starts with 8 lines to draw, pen down, facing right', () => {
    expect(canvas.dataset).toMatchObject({
      turtleDrawn: '0',
      turtleLeft: '8',
      turtlePen: 'down',
      turtleHeading: '0',
      turtleHud: 'Còn 8 nét',
      turtleStray: '',
    });
  });

  it('draws a line step by step and counts it down', async () => {
    await play({ type: 'line', blockId: 'f1', from: [2, 0, 2, 0], to: [4, 0, 2, 0] });
    expect(canvas.dataset.turtleDrawn).toBe('1');
    expect(canvas.dataset.turtleHud).toBe('Còn 7 nét');
    // Drawing the same line again changes nothing.
    await play({ type: 'line', blockId: 'f1', from: [4, 0, 2, 0], to: [2, 0, 2, 0] });
    expect(canvas.dataset.turtleDrawn).toBe('1');
  });

  it('moves without drawing with the pen up, and turns', async () => {
    await play({ type: 'pen', blockId: 'u1', down: false });
    expect(canvas.dataset.turtlePen).toBe('up');
    await play({ type: 'move', blockId: 'f1', from: [2, 0, 2, 0], to: [4, 0, 2, 0] });
    expect(canvas.dataset.turtleDrawn).toBe('0');
    await play({ type: 'turn', blockId: 'l1', from: 0, to: 3, side: 'LEFT', deg: 90 });
    expect(canvas.dataset.turtleHeading).toBe('3');
  });

  it('paints a stray line red and dazes Măng until reset', async () => {
    await play({ type: 'extraLine', blockId: 'f1', from: [2, 0, 2, 0], to: [2, 0, 0, 0] });
    expect(canvas.dataset.turtleStray).toBe('2,0,0,0|2,0,2,0');
    expect(canvas.dataset.turtleStunned).toBe('true');
    expect(canvas.dataset.turtleRed).toBe('true');
    stage.reset();
    expect(canvas.dataset.turtleStray).toBe('');
    expect(canvas.dataset.turtleRed).toBe('false');
    expect(canvas.dataset.turtleStunned).toBe('false');
  });

  it('turns across east both ways (11 → 0 and 0 → 11)', async () => {
    await play({ type: 'turn', blockId: 'r1', from: 0, to: 11, side: 'RIGHT', deg: 30 });
    expect(canvas.dataset.turtleHeading).toBe('11');
    await play({ type: 'turn', blockId: 'l1', from: 11, to: 0, side: 'LEFT', deg: 30 });
    expect(canvas.dataset.turtleHeading).toBe('0');
  });

  it('marks the paper edge after OFF_PAPER', async () => {
    await play({ type: 'offPaper', blockId: 'f1', from: [0, 0, 2, 0], to: [-2, 0, 2, 0] });
    expect(canvas.dataset.turtleOffPaper).toBe('true');
  });

  it('stops at once when aborted and survives a resize and finish', async () => {
    const controller = new AbortController();
    const done = stage.play(
      { type: 'line', blockId: 'f1', from: [2, 0, 2, 0], to: [4, 0, 2, 0] },
      controller.signal,
    );
    await advance(50);
    expect(canvas.dataset.turtleWet).toBe('true');
    controller.abort();
    await done;
    expect(canvas.dataset.turtleDrawn).toBe('0');
    // Làm lại mid-step: the half-drawn line goes too.
    stage.reset();
    expect(canvas.dataset.turtleWet).toBe('false');
    stage.resize(1280, 720);
    stage.finish({ result: 'success' } as RunOutcome<TurtleEvent>);
    stage.destroy();
  });
});
