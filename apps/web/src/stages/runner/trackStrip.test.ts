import { describe, expect, it } from 'vitest';
import type { RunnerConfig } from '@codequest/games';
import { cameraX, cellCenterX, computeRunnerLayout } from './layout';
import { createTrackFeed, initialStrip, stripStep, stripView, trackFeedFor } from './trackStrip';

const config: RunnerConfig = {
  cells: ['ground', 'ground', 'crate', 'hole', 'ground', 'branch', 'ground', 'flag'],
  start: 0,
  bamboo: [1, 6],
};
const ev = <T extends object>(event: T) => ({ blockId: 'b', ...event });

describe('stripStep', () => {
  it('moves the marker to where a move goes, as the move starts', () => {
    let state = initialStrip(config);
    expect(state.at).toBe(0);
    state = stripStep(state, ev({ type: 'walk', from: 0, to: 1 }));
    expect(state.at).toBe(1);
    state = stripStep(state, ev({ type: 'jump', from: 4, to: 6 }));
    expect(state.at).toBe(6);
    state = stripStep(state, ev({ type: 'crouch', from: 6, to: 7 }));
    expect(state.at).toBe(7);
  });

  it('a fall stays in the hole, a bump goes back to its cell, off-track keeps the cell', () => {
    const start = initialStrip(config);
    expect(stripStep(start, ev({ type: 'fall', at: 3 })).at).toBe(3);
    const bumped = stripStep(
      { ...start, at: 4 },
      ev({ type: 'bump', from: 4, at: 5, obstacle: 'branch', move: 'walk' }),
    );
    expect(bumped.at).toBe(4);
    expect(stripStep({ ...start, at: 6 }, ev({ type: 'offTrack', from: 6 })).at).toBe(6);
    expect(stripStep(start, ev({ type: 'win', at: 7 })).at).toBe(7);
  });

  it('a picked shoot disappears; a kicked-over crate becomes ground, a miss changes nothing', () => {
    const start = initialStrip(config);
    expect(stripStep(start, ev({ type: 'collect', at: 1 })).bamboo).toEqual([6]);
    expect(stripStep(start, ev({ type: 'kick', at: 2, hit: true })).cells[2]).toBe('ground');
    expect(stripStep(start, ev({ type: 'kick', at: 3, hit: false }))).toBe(start);
    // The level's config itself is never changed.
    expect(config.cells[2]).toBe('crate');
  });
});

describe('stripView', () => {
  it('is null when the whole track fits the stage (no strip needed) or before measuring', () => {
    expect(stripView(5, 520, 0)).toBeNull();
    expect(stripView(30, 0, 0)).toBeNull();
  });

  it('frames the cells the stage camera shows, following Măng', () => {
    // runner-long at 1280×720: a ~500 px stage shows about 6–7 of 30 cells.
    const start = stripView(30, 500, 0);
    expect(start).not.toBeNull();
    expect(start?.from).toBe(0);
    const shown = (start?.to ?? 0) - (start?.from ?? 0);
    expect(shown).toBeGreaterThan(5);
    expect(shown).toBeLessThan(8);

    const middle = stripView(30, 500, 15);
    const layout = computeRunnerLayout(30, 500, 1);
    const left = cameraX(layout, cellCenterX(layout, 15)) - layout.originX;
    expect(middle?.from).toBeCloseTo(left / layout.cellPx);
    expect(middle?.from ?? 0).toBeLessThan(15);
    expect(middle?.to ?? 0).toBeGreaterThan(16);

    // At the flag the camera is clamped to the world end; the frame never passes the track.
    expect(stripView(30, 500, 29)?.to).toBe(30);
  });
});

describe('createTrackFeed', () => {
  it('notifies on change and resets to the start', () => {
    const feed = createTrackFeed(config);
    let calls = 0;
    const unsubscribe = feed.subscribe(() => {
      calls += 1;
    });
    feed.event(ev({ type: 'walk', from: 0, to: 1 }));
    feed.event(ev({ type: 'collect', at: 1 }));
    expect(feed.getSnapshot()).toMatchObject({ at: 1, bamboo: [6] });
    feed.reset();
    expect(feed.getSnapshot()).toEqual(initialStrip(config));
    expect(calls).toBe(3);
    // Nothing changed: no notification.
    feed.reset();
    feed.event(ev({ type: 'offTrack', from: 0 }));
    expect(calls).toBe(3);
    unsubscribe();
    feed.event(ev({ type: 'walk', from: 0, to: 1 }));
    expect(calls).toBe(3);
  });

  it('exists only for valid runner levels', () => {
    expect(trackFeedFor('runner', config)).not.toBeNull();
    expect(trackFeedFor('runner', { cells: [] })).toBeNull();
    expect(trackFeedFor('maze', config)).toBeNull();
  });
});
