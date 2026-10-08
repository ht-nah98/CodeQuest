// @vitest-environment node
import { type Application, Container, Ticker } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RunOutcome } from '@codequest/engine';
import { type RobotLabConfig, type RobotLabEvent, robotlabResolvedSchema } from '@codequest/games';
import { RobotLabStage } from './RobotLabStage';

const FRAME_MS = 16;
const CONFIG: RobotLabConfig = robotlabResolvedSchema.parse({
  map: ['#.Z.#', 'L....', '#r#y#'],
  startDir: 'E',
  blocks: [
    { kind: 'pollution', color: 'RED', at: [1, 3] },
    { kind: 'fence', at: [0, 3] },
  ],
  goal: { type: 'score', target: 140 },
  rules: {
    timeLimit: 20,
    costs: { forward: 2, turn: 1, grab: 2, release: 2 },
    points: { contain: 45, neutralize: 160, retrieve: 100, return: 40 },
  },
});

let ticker: Ticker;
let now: number;
let canvas: { dataset: Record<string, string> };
let stage: RobotLabStage;

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

/** Acts out `events` one after the other, each to its end. */
async function playAll(events: RobotLabEvent[]): Promise<void> {
  const controller = new AbortController();
  for (const event of events) {
    const done = stage.play(event, controller.signal);
    await advance(stage.estimate(event) + 100);
    await done;
  }
}

const move = (from: [number, number], to: [number, number], t: number): RobotLabEvent => ({
  type: 'move',
  blockId: 'f1',
  from,
  to,
  dir: 'E',
  t,
});
const drive3 = [move([1, 0], [1, 1], 2), move([1, 1], [1, 2], 4), move([1, 2], [1, 3], 6)];
const grab: RobotLabEvent = {
  type: 'grab',
  blockId: 'g1',
  at: [1, 3],
  block: { kind: 'pollution', color: 'RED' },
  index: 0,
  t: 8,
};

beforeEach(() => {
  ticker = new Ticker();
  ticker.autoStart = false;
  now = 1000;
  ticker.update(now);
  canvas = { dataset: {} };
  const app = { ticker, screen: { width: 516, height: 360 }, stage: new Container(), canvas };
  stage = new RobotLabStage(app as unknown as Application, CONFIG, 'thanh-pho-robot');
});

afterEach(() => {
  ticker.destroy();
});

describe('RobotLabStage', () => {
  it('starts in the lab facing east, full clock, nothing done', () => {
    expect(canvas.dataset).toMatchObject({
      theme: 'thanh-pho-robot',
      robotPos: '1,0',
      robotDir: 'E',
      robotHeld: 'none',
      robotClock: '20',
      robotScore: '40',
      robotJobs: 'contain:0/1 retrieve:0/1 home:1/1',
      robotCrash: 'none',
      robotTimeUp: 'false',
    });
  });

  it('score levels: every job chip shows earned / worth from the start (rules × blocks)', () => {
    expect(canvas.dataset.robotChips).toBe(
      'clock:20 giây | contain:0/45 | retrieve:0/100 | home:40/40 | total:40/140',
    );
  });

  it('counts crossings on tiến 3 and runs the clock down by each move’s t', async () => {
    await playAll(drive3);
    expect(canvas.dataset).toMatchObject({ robotPos: '1,3', robotClock: '14', robotScore: '0' });
  });

  it('grabs, turns round, drives home and releases: retrieved, 140 points', async () => {
    const turn = (from: 'E' | 'S', to: 'S' | 'W', t: number): RobotLabEvent => ({
      type: 'turn',
      blockId: 'r1',
      from,
      to,
      t,
    });
    const back = (from: [number, number], to: [number, number], t: number): RobotLabEvent => ({
      type: 'move',
      blockId: 'f2',
      from,
      to,
      dir: 'W',
      t,
    });
    await playAll([...drive3, grab]);
    expect(canvas.dataset.robotHeld).toBe('pollution');
    await playAll([
      turn('E', 'S', 9),
      turn('S', 'W', 10),
      back([1, 3], [1, 2], 12),
      back([1, 2], [1, 1], 14),
      back([1, 1], [1, 0], 16),
      {
        type: 'release',
        blockId: 'd1',
        at: [1, 0],
        block: { kind: 'pollution', color: 'RED' },
        index: 0,
        result: 'retrieved',
        t: 18,
      },
    ]);
    expect(canvas.dataset).toMatchObject({
      robotPos: '1,0',
      robotDir: 'W',
      robotHeld: 'none',
      robotClock: '2',
      robotScore: '140',
      robotJobs: 'contain:0/1 retrieve:1/1 home:1/1',
    });
    const outcome = {
      result: 'success',
      reasonCode: null,
      events: [],
    } as unknown as RunOutcome<RobotLabEvent>;
    stage.finish(outcome);
    expect(canvas.dataset.robotFinish).toBe('success');
  });

  it('the count badge counts one tiến, and starts again after each highlight (loops)', async () => {
    const step = (from: [number, number], to: [number, number], t: number): RobotLabEvent => ({
      type: 'move',
      blockId: 'loopFwd',
      from,
      to,
      dir: 'E',
      t,
    });
    await playAll([step([1, 0], [1, 1], 2), step([1, 1], [1, 2], 4)]);
    expect(canvas.dataset.robotCount).toBe('2');
    stage.reset();
    await playAll([step([1, 0], [1, 1], 2)]);
    expect(canvas.dataset.robotCount).toBe('1');
    stage.hold(); // the loop lights the same block again
    await playAll([step([1, 1], [1, 2], 4)]);
    expect(canvas.dataset.robotCount).toBe('1');
  });

  it('mirrors the clock the child sees while a move plays', async () => {
    const controller = new AbortController();
    const done = stage.play(move([1, 0], [1, 1], 2), controller.signal);
    await advance(220); // half way: 19 s shown
    expect(canvas.dataset.robotClockShown).toBe('19');
    expect(canvas.dataset.robotClock).toBe('20');
    await advance(600);
    await done;
    expect(canvas.dataset.robotClockShown).toBe('18');
    expect(canvas.dataset.robotGround).toBe('pavement');
  });

  it('a bump into a block crashes and dazes Bíp until reset', async () => {
    await playAll([
      move([1, 0], [1, 1], 2),
      move([1, 1], [1, 2], 4),
      { type: 'bump', blockId: 'f1', at: [1, 2], dir: 'E', into: 'block' },
    ]);
    expect(canvas.dataset).toMatchObject({
      robotCrash: 'block',
      robotStunned: 'true',
      robotClock: '16',
    });
    stage.reset();
    expect(canvas.dataset).toMatchObject({
      robotCrash: 'none',
      robotStunned: 'false',
      robotPos: '1,0',
    });
  });

  it('timeUp turns the clock to the time left and marks it', async () => {
    await playAll([{ type: 'timeUp', blockId: 'd1', at: [1, 0], t: 20 }]);
    expect(canvas.dataset).toMatchObject({ robotTimeUp: 'true', robotClock: '0' });
  });

  it('a Làm lại mid-grab leaves the block on the board after reset', async () => {
    await playAll(drive3);
    const controller = new AbortController();
    const done = stage.play(grab, controller.signal);
    await advance(200);
    controller.abort();
    stage.reset();
    await done;
    await advance(100);
    expect(canvas.dataset).toMatchObject({ robotHeld: 'none', robotPos: '1,0', robotClock: '20' });
    expect(ticker.count).toBe(1); // only the stage's own frame callback is left
  });

  it('points at the jobs left at the end of a low score', () => {
    const outcome = {
      result: 'incomplete',
      reasonCode: 'LOW_SCORE',
      events: [],
    } as unknown as RunOutcome<RobotLabEvent>;
    stage.finish(outcome);
    expect(canvas.dataset.robotFinish).toBe('LOW_SCORE');
  });
});
