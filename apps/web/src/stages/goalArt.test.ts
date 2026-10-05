import { describe, expect, it } from 'vitest';
import { GOAL_SPRITES } from '@codequest/content-schema';
import {
  CAGE_OPEN_ART,
  GOAL_ART,
  type GoalArt,
  type GoalArtName,
  goalArt,
  goalArtFor,
  goalPixels,
  goalRuns,
  goalScale,
  ITEM_ART,
} from './goalArt';

const NAMES = Object.keys(GOAL_ART) as GoalArtName[];
/** Every picture: goals, the open cage and the mission items. */
const ALL: ReadonlyArray<readonly [string, GoalArt]> = [
  ...NAMES.map((name) => [name, GOAL_ART[name]] as const),
  ['cage (open)', CAGE_OPEN_ART],
  ['key', ITEM_ART.key],
  ['friend item', ITEM_ART.friend],
];

describe('goal art (P2-11c)', () => {
  it('has a picture for every goal sprite but the flag', () => {
    expect([...NAMES].sort()).toEqual(GOAL_SPRITES.filter((s) => s !== 'flag').sort());
    expect(goalArt('flag')).toBeNull();
    expect(goalArt(undefined)).toBeNull();
    expect(goalArt('machine')).toBe(GOAL_ART.machine);
  });

  it.each(ALL)('%s is square and every colour is a token hex', (name, art) => {
    const size = art.rows.length;
    expect([12, 16]).toContain(size);
    for (const row of art.rows) {
      expect(row).toHaveLength(size);
      for (const ch of row) {
        if (ch !== '.') expect(art.palette[ch], `${name} "${ch}"`).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
    // Throws on an unknown colour; a real picture, not a speck (paw prints are the sparsest).
    const { data } = goalPixels(art);
    let opaque = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] === 0xff) opaque++;
    expect(opaque).toBeGreaterThan((size * size) / 6);
  });

  it('runs cover exactly the opaque texels', () => {
    for (const [name, art] of ALL) {
      const covered = goalRuns(art).reduce((sum, run) => sum + run.w, 0);
      const opaque = art.rows.join('').replace(/\./g, '').length;
      expect(covered, name).toBe(opaque);
    }
  });

  it('friend is the bunny avatar', () => {
    expect(GOAL_ART.friend.rows).toHaveLength(16);
    expect(goalRuns(GOAL_ART.friend).some((run) => run.color === '#f9a5a7')).toBe(true);
  });

  it('a cage opens once unlocked; other goals keep their picture (P2-11c)', () => {
    expect(goalArtFor('cage', false)).toBe(GOAL_ART.cage);
    expect(goalArtFor('cage', true)).toBe(CAGE_OPEN_ART);
    expect(goalArtFor('home', true)).toBe(GOAL_ART.home);
    expect(goalArtFor(undefined, true)).toBeNull();
  });

  it('the friend item is the chick avatar (Gà con), not the bunny goal', () => {
    expect(ITEM_ART.friend.rows).toHaveLength(16);
    expect(ITEM_ART.friend.rows).not.toEqual(GOAL_ART.friend.rows);
  });

  it('goalScale: whole-number zoom that fits the cell, at least 1', () => {
    expect(goalScale(GOAL_ART.machine, 48)).toBe(4);
    expect(goalScale(GOAL_ART.machine, 50)).toBe(4);
    expect(goalScale(GOAL_ART.friend, 48)).toBe(3);
    expect(goalScale(GOAL_ART.friend, 12)).toBe(1);
  });
});
