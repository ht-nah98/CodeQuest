import { describe, expect, it } from 'vitest';
import type { RobotLabConfig, RobotLabEvent } from '@codequest/games';
import {
  addExamRun,
  examBest,
  examFinished,
  newScoreboard,
  nextSeed,
  parseSeed,
  runPoints,
} from './exam';

const config: RobotLabConfig = {
  map: ['L..', '...', '..r'],
  startDir: 'E',
  blocks: [
    { kind: 'pollution', color: 'RED', at: [0, 1] },
    { kind: 'neutralizer', color: 'RED', at: [1, 2] },
  ],
  goal: { type: 'score', target: 100 },
  rules: {
    timeLimit: 120,
    costs: { forward: 2, turn: 1, grab: 2, release: 2 },
    points: { contain: 45, neutralize: 160, retrieve: 100, return: 40 },
  },
};

const b = 'b1';

describe('exam scoreboard', () => {
  it('records runs up to the limit and keeps the best', () => {
    let board = newScoreboard(42, 2);
    expect(examBest(board)).toBeNull();
    board = addExamRun(board, 140);
    expect(examFinished(board)).toBe(false);
    board = addExamRun(board, 300);
    expect(board.points).toEqual([140, 300]);
    expect(examFinished(board)).toBe(true);
    expect(examBest(board)).toBe(300);
    // A third run does not count.
    expect(addExamRun(board, 900)).toBe(board);
  });
});

describe('runPoints', () => {
  it('counts retrieved pollution and the lab bonus from the events, ignoring senses', () => {
    const events = [
      { type: 'move', from: [0, 0], to: [0, 1], dir: 'E', t: 2, blockId: b },
      { type: 'sense', blockId: b, value: true },
      {
        type: 'grab',
        at: [0, 1],
        block: { kind: 'pollution', color: 'RED' },
        index: 0,
        t: 4,
        blockId: b,
      },
      { type: 'turn', from: 'E', to: 'S', t: 5, blockId: b },
      { type: 'turn', from: 'S', to: 'W', t: 6, blockId: b },
      { type: 'move', from: [0, 1], to: [0, 0], dir: 'W', t: 8, blockId: b },
      {
        type: 'release',
        at: [0, 0],
        block: { kind: 'pollution', color: 'RED' },
        index: 0,
        result: 'retrieved',
        t: 10,
        blockId: b,
      },
    ] as unknown as RobotLabEvent[];
    expect(runPoints(config, { events })).toBe(140);
  });

  it('keeps the points made before a crash', () => {
    const events = [
      { type: 'move', from: [0, 0], to: [0, 1], dir: 'E', t: 2, blockId: b },
      { type: 'bump', at: [0, 1], dir: 'N', into: 'offLine', blockId: b },
    ] as unknown as RobotLabEvent[];
    expect(runPoints(config, { events })).toBe(0);
    expect(runPoints(config, { events: [] })).toBe(40);
  });
});

describe('seeds', () => {
  it('parses đề numbers 1–9999 only', () => {
    expect(parseSeed('2026')).toBe(2026);
    expect(parseSeed(' 7 ')).toBe(7);
    for (const bad of ['0', '10000', '-1', '1.5', 'abc', '', null, undefined]) {
      expect(parseSeed(bad)).toBeNull();
    }
  });

  it('draws a new seed in range, never the current one', () => {
    expect(nextSeed(5, () => 0)).toBe(1);
    expect(nextSeed(1, () => 0)).toBe(2);
    expect(nextSeed(9999, () => 0.99999999)).toBe(9998);
    expect(nextSeed(9998, () => 0.99999999)).toBe(9999);
    for (let i = 0; i < 50; i++) {
      const seed = nextSeed(2026, () => i / 50);
      expect(seed).not.toBe(2026);
      expect(seed).toBeGreaterThanOrEqual(1);
      expect(seed).toBeLessThanOrEqual(9999);
    }
  });
});
