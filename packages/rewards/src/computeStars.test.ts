import { describe, expect, it } from 'vitest';
import type { Level } from '@codequest/content-schema';
import {
  computeLevelRewards,
  computeStars,
  failStreak,
  meetsStarGoals,
  predictPickSummary,
} from './index';
import { emptyProgress } from './progress';
import { makeLevel, run, session } from './testFixtures';
import type { HintTier, StarCount } from './types';

const build = makeLevel({ mode: 'build', par: 4 });
const parsons = makeLevel({ mode: 'parsons', par: 3 });
const bughunt = makeLevel({ mode: 'bughunt', parEdits: 2 });
const bughuntDefault = makeLevel({ mode: 'bughunt' });
const predict = makeLevel({ mode: 'predict', par: undefined });
const creative = makeLevel({ mode: 'creative', stage: 'creative', par: undefined });

interface Row {
  name: string;
  level: Level;
  blocksUsed?: number;
  edits?: number;
  priorRuns?: number;
  priorErrors?: number;
  hints?: HintTier[];
  stars: StarCount;
}

// One row per line of rewards-economy.md §1.
const TABLE: Row[] = [
  { name: 'build: clear, blocks > par → ⭐', level: build, blocksUsed: 5, stars: 1 },
  { name: 'build: blocks = par, no hint → ⭐⭐⭐', level: build, blocksUsed: 4, stars: 3 },
  { name: 'build: blocks < par → ⭐⭐⭐', level: build, blocksUsed: 2, stars: 3 },
  { name: 'build: tier 1 hint does not cap', level: build, hints: [1], stars: 3 },
  { name: 'build: tier 2 hint caps at ⭐⭐', level: build, hints: [2], stars: 2 },
  { name: 'build: tier 2 bought twice still ⭐⭐', level: build, hints: [2, 2], stars: 2 },
  { name: 'build: tier 3 hint caps at ⭐', level: build, hints: [3], stars: 1 },
  { name: 'build: tiers 1, 2, 3 → ⭐', level: build, hints: [1, 2, 3], stars: 1 },
  { name: 'build: over par + tier 2 → ⭐', level: build, blocksUsed: 9, hints: [2], stars: 1 },
  { name: 'parsons: blocks ≤ par → ⭐⭐⭐', level: parsons, blocksUsed: 3, stars: 3 },
  { name: 'parsons: blocks > par → ⭐', level: parsons, blocksUsed: 4, stars: 1 },
  { name: 'parsons: tier 2 caps at ⭐⭐', level: parsons, blocksUsed: 3, hints: [2], stars: 2 },
  { name: 'bughunt: edits ≤ parEdits → ⭐⭐⭐', level: bughunt, edits: 2, stars: 3 },
  { name: 'bughunt: edits > parEdits → ⭐', level: bughunt, edits: 3, stars: 1 },
  { name: 'bughunt: ignores block count', level: bughunt, edits: 1, blocksUsed: 99, stars: 3 },
  { name: 'bughunt: default parEdits = 1 (1 edit)', level: bughuntDefault, edits: 1, stars: 3 },
  { name: 'bughunt: default parEdits = 1 (2 edits)', level: bughuntDefault, edits: 2, stars: 1 },
  { name: 'bughunt: missing edits → ⭐', level: bughunt, stars: 1 },
  { name: 'bughunt: tier 2 caps at ⭐⭐', level: bughunt, edits: 0, hints: [2], stars: 2 },
  { name: 'bughunt: tier 3 caps at ⭐', level: bughunt, edits: 0, hints: [3], stars: 1 },
  { name: 'predict: right on 1st pick → ⭐⭐⭐', level: predict, priorRuns: 0, stars: 3 },
  { name: 'predict: right on 2nd pick → ⭐⭐', level: predict, priorRuns: 1, stars: 2 },
  { name: 'predict: right on 3rd pick → ⭐', level: predict, priorRuns: 2, stars: 1 },
  { name: 'predict: right on 5th pick → ⭐', level: predict, priorRuns: 4, stars: 1 },
  { name: 'predict: error runs are not picks', level: predict, priorErrors: 2, stars: 3 },
  { name: 'predict: ignores blocksUsed', level: predict, blocksUsed: 99, stars: 3 },
  { name: 'predict: tier 1 hint does not cap', level: predict, hints: [1], stars: 3 },
  { name: 'creative: no stars', level: creative, stars: 0 },
];

describe('computeStars (rewards-economy.md §1)', () => {
  it.each(TABLE)('$name', (row) => {
    const prior = [
      ...Array.from({ length: row.priorErrors ?? 0 }, () => run('error')),
      ...Array.from({ length: row.priorRuns ?? 0 }, () => run('incomplete')),
    ];
    const winning = run('success', {
      blocksUsed: row.blocksUsed ?? 4,
      ...(row.edits !== undefined ? { edits: row.edits } : {}),
    });
    expect(computeStars(row.level, session([...prior, winning], row.hints), winning)).toBe(
      row.stars,
    );
  });

  it('treats a winning run not yet in the session as the next run', () => {
    const winning = run('success');
    expect(computeStars(predict, session([run('incomplete')]), winning)).toBe(2);
  });

  it('gives 0 to a run that did not succeed', () => {
    const failed = run('crash');
    expect(computeStars(build, session([failed]), failed)).toBe(0);
  });

  it('gives ⭐ only when a build level has no par', () => {
    const noPar = makeLevel({ mode: 'build', par: undefined });
    const winning = run('success', { blocksUsed: 1 });
    expect(computeStars(noPar, session([winning]), winning)).toBe(1);
  });
});

describe('computeStars: predict across sessions', () => {
  const progress = (attempts: number) => ({ ...emptyProgress('w01-l03'), attempts });

  it('counts picks from earlier sessions, so re-entering cannot farm ⭐⭐⭐', () => {
    const winning = run('success');
    expect(computeStars(predict, session([winning]), winning, progress(0))).toBe(3);
    expect(computeStars(predict, session([winning]), winning, progress(1))).toBe(2);
    expect(computeStars(predict, session([run('incomplete'), winning]), winning, progress(1))).toBe(
      1,
    );
  });

  it('throws when the session belongs to another level', () => {
    const winning = run('success');
    expect(() => computeStars(build, session([winning], [], 'other'), winning)).toThrow(
      /session of other/,
    );
  });
});

describe('predictPickSummary', () => {
  const answer = 'crash:FELL_IN_HOLE@3';

  it('scores a right pick on a program that crashes', () => {
    const engineRun = run('crash', { reasonCode: 'FELL_IN_HOLE', blocksUsed: 5 });
    const pick = predictPickSummary(engineRun, answer, answer, 'pick-1');
    expect(pick).toEqual({
      runId: 'pick-1',
      result: 'success',
      reasonCode: null,
      blocksUsed: 5,
      predictChoice: answer,
    });
    expect(computeStars(predict, session([pick]), pick)).toBe(3);
  });

  it('fails a wrong pick on a program that wins, and counts it in failStreak', () => {
    const engineRun = run('success');
    const pick = predictPickSummary(engineRun, 'win', answer, 'pick-2');
    expect(pick).toMatchObject({ result: 'incomplete', reasonCode: 'WRONG_ANSWER' });
    expect(computeStars(predict, session([pick]), pick)).toBe(0);
    const picks = [pick, predictPickSummary(engineRun, 'win', answer, 'pick-3')];
    expect(failStreak(session([...picks, predictPickSummary(engineRun, 'x', answer, 'p4')]))).toBe(
      3,
    );
  });
});

// Levels with starGoals (rewards-economy.md §1, approved 03/10/2026, P2-21).
const goals = [{ kind: 'collectAll' as const }];
const goalBuild = makeLevel({ mode: 'build', par: 7, starGoals: goals });
const goalBughunt = makeLevel({ mode: 'bughunt', parEdits: 2, starGoals: goals });
const goalBughuntDefault = makeLevel({ mode: 'bughunt', starGoals: goals });

interface GoalRow {
  name: string;
  level: Level;
  goals?: boolean[];
  blocksUsed?: number;
  edits?: number;
  hints?: HintTier[];
  stars: StarCount;
}

const GOAL_TABLE: GoalRow[] = [
  {
    name: 'build: win, goal missed, ≤ par → ⭐',
    level: goalBuild,
    goals: [false],
    blocksUsed: 5,
    stars: 1,
  },
  {
    name: 'build: win, goal missed, > par → ⭐',
    level: goalBuild,
    goals: [false],
    blocksUsed: 9,
    stars: 1,
  },
  {
    name: 'build: goal met, > par → ⭐⭐',
    level: goalBuild,
    goals: [true],
    blocksUsed: 8,
    stars: 2,
  },
  {
    name: 'build: goal met, = par → ⭐⭐⭐',
    level: goalBuild,
    goals: [true],
    blocksUsed: 7,
    stars: 3,
  },
  {
    name: 'build: goal met, < par → ⭐⭐⭐',
    level: goalBuild,
    goals: [true],
    blocksUsed: 6,
    stars: 3,
  },
  { name: 'build: no goal flags → ⭐', level: goalBuild, blocksUsed: 5, stars: 1 },
  {
    name: 'build: flags of the wrong length → ⭐',
    level: goalBuild,
    goals: [true, true],
    blocksUsed: 7,
    stars: 1,
  },
  {
    name: 'build: tier 1 hint does not cap',
    level: goalBuild,
    goals: [true],
    blocksUsed: 7,
    hints: [1],
    stars: 3,
  },
  {
    name: 'build: tier 2 caps ⭐⭐⭐ at ⭐⭐',
    level: goalBuild,
    goals: [true],
    blocksUsed: 7,
    hints: [2],
    stars: 2,
  },
  {
    name: 'build: tier 2 keeps ⭐⭐ (over par)',
    level: goalBuild,
    goals: [true],
    blocksUsed: 8,
    hints: [2],
    stars: 2,
  },
  {
    name: 'build: tier 3 caps at ⭐',
    level: goalBuild,
    goals: [true],
    blocksUsed: 7,
    hints: [3],
    stars: 1,
  },
  {
    name: 'build: tier 2 + goal missed → ⭐',
    level: goalBuild,
    goals: [false],
    blocksUsed: 7,
    hints: [2],
    stars: 1,
  },
  {
    name: 'bughunt: goal met, edits ≤ parEdits → ⭐⭐⭐',
    level: goalBughunt,
    goals: [true],
    edits: 2,
    stars: 3,
  },
  {
    name: 'bughunt: goal met, edits > parEdits → ⭐⭐',
    level: goalBughunt,
    goals: [true],
    edits: 3,
    stars: 2,
  },
  { name: 'bughunt: goal met, missing edits → ⭐⭐', level: goalBughunt, goals: [true], stars: 2 },
  {
    name: 'bughunt: goal missed, edits ≤ parEdits → ⭐',
    level: goalBughunt,
    goals: [false],
    edits: 1,
    stars: 1,
  },
  {
    name: 'bughunt: ignores block count',
    level: goalBughunt,
    goals: [true],
    edits: 1,
    blocksUsed: 99,
    stars: 3,
  },
  {
    name: 'bughunt: default parEdits = 1',
    level: goalBughuntDefault,
    goals: [true],
    edits: 2,
    stars: 2,
  },
  {
    name: 'bughunt: tier 2 caps at ⭐⭐',
    level: goalBughunt,
    goals: [true],
    edits: 0,
    hints: [2],
    stars: 2,
  },
  {
    name: 'bughunt: tier 3 caps at ⭐',
    level: goalBughunt,
    goals: [true],
    edits: 0,
    hints: [3],
    stars: 1,
  },
  {
    name: 'build: goal met, over par + tier 3 → ⭐',
    level: goalBuild,
    goals: [true],
    blocksUsed: 8,
    hints: [3],
    stars: 1,
  },
  {
    name: 'build: goal missed + tier 3 → ⭐',
    level: goalBuild,
    goals: [false],
    blocksUsed: 7,
    hints: [3],
    stars: 1,
  },
  {
    name: 'bughunt: goal missed, edits > parEdits → ⭐',
    level: goalBughunt,
    goals: [false],
    edits: 3,
    stars: 1,
  },
  // A multi-map level: the engine sends one flag per goal, false when one map missed it.
  {
    name: 'multi-map: goal missed on one map → ⭐',
    level: goalBuild,
    goals: [false],
    blocksUsed: 7,
    stars: 1,
  },
];

describe('computeStars with starGoals (rewards-economy.md §1)', () => {
  it.each(GOAL_TABLE)('$name', (row) => {
    const winning = run('success', {
      blocksUsed: row.blocksUsed ?? 7,
      ...(row.goals !== undefined ? { goals: row.goals } : {}),
      ...(row.edits !== undefined ? { edits: row.edits } : {}),
    });
    expect(computeStars(row.level, session([winning], row.hints), winning)).toBe(row.stars);
  });

  it('gives 0 to a lost run that met the goals', () => {
    const lost = run('crash', { goals: [true] });
    expect(computeStars(goalBuild, session([lost]), lost)).toBe(0);
  });

  it('keeps the old rule on levels without starGoals, whatever the run says about goals', () => {
    for (const row of TABLE) {
      if (row.priorRuns !== undefined || row.priorErrors !== undefined) continue;
      for (const flags of [undefined, [false], [true]]) {
        const winning = run('success', {
          blocksUsed: row.blocksUsed ?? 4,
          ...(row.edits !== undefined ? { edits: row.edits } : {}),
          ...(flags !== undefined ? { goals: flags } : {}),
        });
        expect(computeStars(row.level, session([winning], row.hints), winning)).toBe(row.stars);
      }
    }
  });

  it('leaves predict and creative alone even if a level carried starGoals', () => {
    const winning = run('success', { goals: [false] });
    const goalPredict = makeLevel({ mode: 'predict', par: undefined, starGoals: goals });
    const goalCreative = makeLevel({
      mode: 'creative',
      stage: 'creative',
      par: undefined,
      starGoals: goals,
    });
    expect(computeStars(goalPredict, session([winning]), winning)).toBe(3);
    expect(computeStars(goalCreative, session([winning]), winning)).toBe(0);
  });

  it('ignores starGoals on a parsons level (the schema only allows build and bughunt)', () => {
    const goalParsons = makeLevel({ mode: 'parsons', par: 3, starGoals: goals });
    const missed = run('success', { blocksUsed: 3, goals: [false] });
    expect(computeStars(goalParsons, session([missed]), missed)).toBe(3);
    const over = run('success', { blocksUsed: 4, goals: [true] });
    expect(computeStars(goalParsons, session([over]), over)).toBe(1);
    expect(meetsStarGoals(goalParsons, missed)).toBe(true);
  });

  it('meetsStarGoals needs one true flag per goal', () => {
    expect(meetsStarGoals(goalBuild, run('success', { goals: [true] }))).toBe(true);
    expect(meetsStarGoals(goalBuild, run('success', { goals: [false] }))).toBe(false);
    expect(meetsStarGoals(goalBuild, run('success'))).toBe(false);
    expect(meetsStarGoals(goalBuild, run('success', { goals: [] }))).toBe(false);
    expect(meetsStarGoals(build, run('success'))).toBe(true);
  });

  it('pays the ⭐⭐ coins for goals met over par, and ⭐ only for a missed goal', () => {
    const rewards = (goalsFlags: boolean[], blocksUsed: number) => {
      const winning = run('success', { goals: goalsFlags, blocksUsed });
      return computeLevelRewards({
        level: goalBuild,
        session: session([winning]),
        winning,
        progress: undefined,
        ledger: [],
        now: new Date('2026-10-03T05:00:00.000Z'),
        profileId: 'p1',
      });
    };
    const twoStars = rewards([true], 8);
    expect(twoStars.stars).toBe(2);
    expect(twoStars.entries.map((e) => e.reason)).toContain('star-2');
    expect(twoStars.entries.map((e) => e.reason)).not.toContain('star-3');
    const oneStar = rewards([false], 5);
    expect(oneStar.stars).toBe(1);
    expect(oneStar.entries.map((e) => e.reason)).not.toContain('star-2');
  });
});
