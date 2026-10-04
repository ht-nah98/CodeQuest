import { describe, expect, it } from 'vitest';
import type { MazeConfig } from '@codequest/games';
import { createMazeFeed, initialMazePlan, mazePlanStep } from './mazeFeed';

const config: MazeConfig = {
  map: ['#####', '#S.b#', '#.#.#', '#b.G#', '#####'],
  startDir: 'E',
};
const ev = <T extends object>(event: T) => ({ blockId: 'b', ...event });

describe('mazePlanStep', () => {
  it('starts on S facing startDir with every shoot', () => {
    expect(initialMazePlan(config)).toEqual({
      at: [1, 1],
      dir: 'E',
      bamboo: [
        [1, 3],
        [3, 1],
      ],
    });
  });

  it('follows moves and turns, picks shoots, stays put on a bump or a win', () => {
    let state = initialMazePlan(config);
    state = mazePlanStep(state, ev({ type: 'move', from: [1, 1], to: [1, 2], dir: 'E' }));
    expect(state.at).toEqual([1, 2]);
    state = mazePlanStep(state, ev({ type: 'move', from: [1, 2], to: [1, 3], dir: 'E' }));
    state = mazePlanStep(state, ev({ type: 'collect', at: [1, 3] }));
    expect(state.bamboo).toEqual([[3, 1]]);
    state = mazePlanStep(state, ev({ type: 'turn', from: 'E', to: 'S' }));
    expect(state.dir).toBe('S');
    const bumped = mazePlanStep(state, ev({ type: 'bump', at: [1, 3], dir: 'E' }));
    expect(bumped).toBe(state);
    expect(mazePlanStep(state, ev({ type: 'win', at: [1, 3] }))).toBe(state);
  });

  it('a feed goes back to the start on reset', () => {
    const feed = createMazeFeed(config);
    feed.event(ev({ type: 'move', from: [1, 1], to: [2, 1], dir: 'S' }));
    expect(feed.getSnapshot().at).toEqual([2, 1]);
    feed.reset();
    expect(feed.getSnapshot()).toEqual(initialMazePlan(config));
  });
});
