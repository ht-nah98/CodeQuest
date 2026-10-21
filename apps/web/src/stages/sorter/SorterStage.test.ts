// @vitest-environment node
import { type Application, Container, Ticker } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SorterConfig, SorterEvent } from '@codequest/games';
import { SorterStage } from './SorterStage';

const FRAME_MS = 16;
const CONFIG: SorterConfig = { books: [3, 1, 2], goal: { sorted: true }, maxQuestions: 4 };

let ticker: Ticker;
let now: number;
let canvas: { dataset: Record<string, string> };
let stage: SorterStage;

async function flush(): Promise<void> {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

/** A hand-driven clock: nothing moves until `advance` feeds it frames. */
async function advance(ms: number): Promise<void> {
  for (let elapsed = 0; elapsed < ms; elapsed += FRAME_MS) {
    now += FRAME_MS;
    ticker.update(now);
    await flush();
  }
}

/** Plays one event to the end and returns what the canvas then says. */
async function play(event: SorterEvent): Promise<Record<string, string>> {
  const controller = new AbortController();
  const done = stage.play(event, controller.signal);
  await advance(1200);
  await done;
  return canvas.dataset;
}

beforeEach(() => {
  ticker = new Ticker();
  ticker.autoStart = false;
  now = 1000;
  ticker.update(now);
  canvas = { dataset: {} };
  const app = { ticker, screen: { width: 1100, height: 520 }, stage: new Container(), canvas };
  stage = new SorterStage(app as unknown as Application, CONFIG);
});

afterEach(() => {
  ticker.destroy();
});

describe('SorterStage', () => {
  it('starts with the config shelf, the hand on book 1 and the whole budget', () => {
    expect(canvas.dataset).toMatchObject({
      shelf: '3,1,2',
      shelfHand: '1',
      shelfSwaps: '0',
      shelfQuestions: '4',
    });
  });

  it('a move walks the hand to the place the event names', async () => {
    const data = await play({ type: 'move', blockId: 'm1', from: 1, to: 2 });
    expect(data).toMatchObject({ shelfHand: '2', shelf: '3,1,2' });
  });

  it('a swap shows the shelf of the event and counts one swap', async () => {
    const data = await play({ type: 'swap', blockId: 's1', at: 1, books: [1, 3, 2] });
    expect(data).toMatchObject({ shelf: '1,3,2', shelfSwaps: '1', shelfHand: '1' });
  });

  it('two swaps in a row leave the shelf sorted', async () => {
    await play({ type: 'swap', blockId: 's1', at: 1, books: [1, 3, 2] });
    const data = await play({ type: 'swap', blockId: 's2', at: 2, books: [1, 2, 3] });
    expect(data).toMatchObject({ shelf: '1,2,3', shelfSwaps: '2' });
  });

  it('a pair question lights both books and counts the budget down', async () => {
    const data = await play({
      type: 'ask',
      blockId: 'q1',
      at: 2,
      pair: true,
      answer: false,
      questionsLeft: 3,
    });
    expect(data).toMatchObject({ shelfAsking: '2,3', shelfQuestions: '3' });
  });

  it('a book question lights one book, and the next move puts the light out', async () => {
    await play({
      type: 'ask',
      blockId: 'q1',
      at: 1,
      pair: false,
      answer: true,
      questionsLeft: 3,
    });
    expect(canvas.dataset.shelfAsking).toBe('1');
    const data = await play({ type: 'move', blockId: 'm1', from: 1, to: 2 });
    expect(data.shelfAsking).toBe('');
  });

  it('a crash parks the hand where it happened', async () => {
    const data = await play({ type: 'offShelf', blockId: 'r1', at: 4 });
    expect(data.shelfHand).toBe('4');
  });

  it('reset puts the shelf, the hand and the counters back to the start of the level', async () => {
    await play({ type: 'swap', blockId: 's1', at: 1, books: [1, 3, 2] });
    await play({ type: 'move', blockId: 'm1', from: 1, to: 2 });
    stage.reset();
    expect(canvas.dataset).toMatchObject({
      shelf: '3,1,2',
      shelfHand: '1',
      shelfSwaps: '0',
      shelfQuestions: '4',
    });
  });

  it('a swap stopped halfway by Làm lại still leaves the shelf whole after reset', async () => {
    const controller = new AbortController();
    const done = stage.play(
      { type: 'swap', blockId: 's1', at: 1, books: [1, 3, 2] },
      controller.signal,
    );
    await advance(200); // mid-animation
    controller.abort();
    await done;
    stage.reset();
    expect(canvas.dataset).toMatchObject({ shelf: '3,1,2', shelfSwaps: '0' });
  });

  it('resizing keeps the state and only moves the art', async () => {
    await play({ type: 'swap', blockId: 's1', at: 1, books: [1, 3, 2] });
    stage.resize(760, 420);
    expect(canvas.dataset).toMatchObject({ shelf: '1,3,2', shelfSwaps: '1' });
  });

  it('a level without a budget shows no questions-left chip', () => {
    const app = {
      ticker,
      screen: { width: 900, height: 480 },
      stage: new Container(),
      canvas: { dataset: {} as Record<string, string> },
    };
    new SorterStage(app as unknown as Application, { books: [2, 1], goal: { sorted: true } });
    expect(app.canvas.dataset.shelfQuestions).toBe('');
  });
});
