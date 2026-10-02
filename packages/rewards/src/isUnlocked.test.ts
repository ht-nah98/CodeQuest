import { describe, expect, it } from 'vitest';
import type { Level, LevelStage, World } from '@codequest/content-schema';
import { isUnlocked } from './index';
import type { UnlockContext } from './index';
import { emptyProgress } from './progress';
import { makeLevel } from './testFixtures';
import type { LevelProgress, StarCount } from './types';

function makeWorld(
  id: string,
  order: number,
  levelIds: string[],
  lessonIds = [`${id}-lesson1`],
): World {
  return {
    id,
    order,
    title: id,
    emoji: '🎋',
    concept: 'c',
    story: 's',
    theme: { tileset: 't' },
    lessonIds,
    levelIds,
    unlock: { minStarRatio: 0.6 },
  };
}

// World 1: g1 g2 p1 c1 p2 b1 cr1 bo1 (challenge sits between practice levels on purpose).
const W1: Array<[string, LevelStage]> = [
  ['g1', 'guided'],
  ['g2', 'guided'],
  ['p1', 'practice'],
  ['c1', 'challenge'],
  ['p2', 'practice'],
  ['b1', 'boss'],
  ['cr1', 'creative'],
  ['bo1', 'bonus'],
];

function context(
  stars: Record<string, StarCount> = {},
  extra: Partial<Pick<UnlockContext, 'lessonsDone' | 'bonusOwned' | 'overrides'>> = {},
  levelOverrides: Record<string, Partial<Level>> = {},
): UnlockContext {
  const levels = new Map<string, Level>();
  for (const [id, stage] of W1) {
    levels.set(id, { ...makeLevel({ id, worldId: 'w1', stage }), ...levelOverrides[id] });
  }
  levels.set('w2-g1', makeLevel({ id: 'w2-g1', worldId: 'w2', stage: 'guided' }));
  const progress = new Map<string, LevelProgress>();
  for (const [id, best] of Object.entries(stars)) {
    progress.set(id, {
      ...emptyProgress(id),
      bestStars: best,
      completedAt: best > 0 ? '2026-03-01T05:00:00.000Z' : null,
    });
  }
  return {
    worlds: new Map([
      [
        'w1',
        makeWorld(
          'w1',
          1,
          W1.map(([id]) => id),
        ),
      ],
      ['w2', makeWorld('w2', 2, ['w2-g1'], [])],
    ]),
    levels,
    progress,
    lessonsDone: extra.lessonsDone ?? new Set(['w1-lesson1']),
    bonusOwned: extra.bonusOwned ?? new Set(),
    overrides: extra.overrides ?? new Set(),
  };
}

const level = (levelId: string, ctx: UnlockContext) => isUnlocked({ levelId }, ctx);
const world = (worldId: string, ctx: UnlockContext) => isUnlocked({ worldId }, ctx);

describe('isUnlocked: levels', () => {
  it('opens the first level only after the first lesson was seen', () => {
    expect(level('g1', context())).toBe(true);
    expect(level('g1', context({}, { lessonsDone: new Set() }))).toBe(false);
  });

  it('opens guided/practice levels when the previous one is done', () => {
    expect(level('g2', context())).toBe(false);
    expect(level('g2', context({ g1: 1 }))).toBe(true);
    expect(level('p1', context({ g1: 1 }))).toBe(false);
  });

  it('skips challenge levels in the chain: they are optional', () => {
    expect(level('p2', context({ g1: 1, g2: 1, p1: 1 }))).toBe(true);
  });

  it('opens a challenge level after every practice level', () => {
    expect(level('c1', context({ g1: 1, g2: 1, p1: 1 }))).toBe(false);
    expect(level('c1', context({ p1: 1, p2: 1 }))).toBe(true);
  });

  it('opens the boss after every guided and practice level', () => {
    expect(level('b1', context({ g1: 1, g2: 1, p1: 1 }))).toBe(false);
    expect(level('b1', context({ g1: 1, g2: 1, p1: 1, p2: 1 }))).toBe(true);
  });

  it('opens creative levels as soon as the world is open', () => {
    expect(level('cr1', context())).toBe(true);
    expect(level('w2-g1', context())).toBe(false);
  });

  it('opens a bonus level once bought, after the boss is beaten', () => {
    const owned = { bonusOwned: new Set(['bo1']) };
    expect(level('bo1', context({ b1: 1 }))).toBe(false);
    expect(level('bo1', context({}, owned))).toBe(false);
    expect(level('bo1', context({ b1: 1 }, owned))).toBe(true);
  });

  it('honours coach overrides on levels', () => {
    expect(level('b1', context({}, { overrides: new Set(['b1']) }))).toBe(true);
  });

  it('locks unknown and retired levels, and ignores retired ones in chains', () => {
    expect(level('nope', context())).toBe(false);
    const retired = { p1: { retired: true } };
    expect(level('p1', context({ g1: 1, g2: 1 }, {}, retired))).toBe(false);
    expect(level('p2', context({ g1: 1, g2: 1 }, {}, retired))).toBe(true);
  });

  it('keeps a retired level locked even with a coach override', () => {
    const ctx = context({}, { overrides: new Set(['p1']) }, { p1: { retired: true } });
    expect(level('p1', ctx)).toBe(false);
  });

  it('locks a bonus level in a world without a live boss', () => {
    const ctx = context({}, { bonusOwned: new Set(['bo1']) }, { b1: { retired: true } });
    expect(level('bo1', ctx)).toBe(false);
  });

  it('locks a level whose world is unknown', () => {
    const ctx = context();
    ctx.levels.set('lost', makeLevel({ id: 'lost', worldId: 'w9' }));
    expect(level('lost', ctx)).toBe(false);
  });
});

describe('isUnlocked: worlds', () => {
  const allStars = (n: StarCount) => ({ g1: n, g2: n, p1: n, p2: n, b1: n });

  it('always opens the first world', () => {
    expect(world('w1', context())).toBe(true);
  });

  it('opens the next world after the boss and ≥ 60% of max stars', () => {
    // 5 counted levels × 3 = 15 max stars; 60% = 9.
    expect(world('w2', context({ ...allStars(1), g1: 3, g2: 3 }))).toBe(true); // 3+3+1+1+1 = 9
    expect(world('w2', context({ ...allStars(1), g1: 3, g2: 2 }))).toBe(false); // 8
  });

  it('needs the boss even with enough stars', () => {
    expect(world('w2', context({ g1: 3, g2: 3, p1: 3, p2: 3 }))).toBe(false);
  });

  it('does not count challenge, creative or bonus stars', () => {
    const ctx = context({ ...allStars(1), c1: 3, cr1: 3, bo1: 3 });
    expect(world('w2', ctx)).toBe(false);
  });

  it('rounds a fractional threshold up to whole stars', () => {
    // 3 counted levels: 60% of 9 = 5.4, so 6 whole stars are needed.
    const ctx = context(
      { g1: 3, g2: 2, b1: 1 },
      {},
      { p1: { retired: true }, p2: { retired: true } },
    );
    expect(world('w2', ctx)).toBe(true);
    const short = context(
      { g1: 3, g2: 1, b1: 1 },
      {},
      { p1: { retired: true }, p2: { retired: true } },
    );
    expect(world('w2', short)).toBe(false);
  });

  it('never clears a world without a live boss', () => {
    const ctx = context({ g1: 3, g2: 3, p1: 3, p2: 3 }, {}, { b1: { retired: true } });
    expect(world('w2', ctx)).toBe(false);
  });

  it('never clears an empty world', () => {
    const ctx = context();
    ctx.worlds.set('w1', makeWorld('w1', 1, []));
    expect(world('w2', ctx)).toBe(false);
  });

  it('honours coach overrides and locks unknown worlds', () => {
    expect(world('w2', context({}, { overrides: new Set(['w2']) }))).toBe(true);
    expect(world('w9', context())).toBe(false);
    const ctx = context();
    ctx.worlds.set('w5', makeWorld('w5', 5, []));
    expect(world('w5', ctx)).toBe(false); // no world with order 4
  });

  it('opens the first level of an overridden world without a lesson', () => {
    expect(level('w2-g1', context({}, { overrides: new Set(['w2']) }))).toBe(true);
  });
});
