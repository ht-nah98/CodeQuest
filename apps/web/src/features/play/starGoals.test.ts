import { describe, expect, it } from 'vitest';
import type { Level } from '@codequest/content-schema';
import {
  firstMissedGoal,
  goalLineKey,
  goalVerdicts,
  hasStarGoals,
  starGoalRows,
} from './starGoals';

type GoalLevel = Pick<Level, 'mode' | 'starGoals' | 'par' | 'parEdits'>;
const build: GoalLevel = { mode: 'build', par: 4, starGoals: [{ kind: 'collectAll' }] };
const bughunt: GoalLevel = { ...build, mode: 'bughunt', parEdits: 2 };
const plain: GoalLevel = { mode: 'build', par: 4 };

describe('star goals on the play screen (P2-21)', () => {
  it('only build / bughunt levels with starGoals have them', () => {
    expect(hasStarGoals(build)).toBe(true);
    expect(hasStarGoals(bughunt)).toBe(true);
    expect(hasStarGoals(plain)).toBe(false);
    expect(hasStarGoals({ ...build, mode: 'predict' })).toBe(false);
  });

  it('card: ⭐ win, ⭐⭐ + each goal, ⭐⭐⭐ + par (bughunt: parEdits)', () => {
    expect(starGoalRows(build)).toEqual([
      { stars: 1, key: 'win', text: 'Tới nơi' },
      { stars: 2, key: 'collectAll', text: 'Nhặt hết măng' },
      { stars: 3, key: 'par', text: 'Không quá 4 khối' },
    ]);
    expect(starGoalRows(bughunt).at(-1)).toEqual({
      stars: 3,
      key: 'par',
      text: 'Sửa không quá 2 khối',
    });
    expect(starGoalRows({ ...bughunt, parEdits: undefined }).at(-1)?.text).toBe(
      'Sửa không quá 1 khối',
    );
    expect(starGoalRows({ ...build, par: undefined }).map((row) => row.key)).toEqual([
      'win',
      'collectAll',
    ]);
    expect(starGoalRows(plain)).toEqual([]);
  });

  it('results: each line ticked, the hint line only when a hint took stars', () => {
    const reward = { goals: [false], overPar: false, hintCapped: false };
    // A missed ⭐⭐ goal: the ⭐⭐⭐ block line is not graded (no ✔ on a ⭐ result).
    expect(goalVerdicts(build, reward).map((v) => [v.key, v.met])).toEqual([
      ['win', true],
      ['collectAll', false],
      ['par', null],
    ]);
    expect(
      goalVerdicts(build, { goals: [true], overPar: false, hintCapped: false }).at(-1)?.met,
    ).toBe(true);
    expect(
      goalVerdicts(build, { goals: [true], overPar: true, hintCapped: true }).map((v) => [
        v.key,
        v.met,
      ]),
    ).toEqual([
      ['win', true],
      ['collectAll', true],
      ['par', false],
      ['hint', false],
    ]);
    // No flags at all (an older run) = not met, as rewards counts it.
    expect(goalVerdicts(build, { overPar: false, hintCapped: false })[1]?.met).toBe(false);
    expect(goalVerdicts(plain, reward)).toEqual([]);
  });

  it('multi-map: a goal missed names the maps that missed it', () => {
    const reward = { goals: [false], overPar: false, hintCapped: false };
    const verdict = goalVerdicts(build, reward, [[true], [false], undefined])[1];
    expect(verdict).toMatchObject({ met: false, missedOn: [2, 3] });
    // One map: nothing to name.
    expect(goalVerdicts(build, reward, [[false]])[1]).not.toHaveProperty('missedOn');
  });

  it('goalLineKey: the results line by the goal table', () => {
    const line = (level: GoalLevel, stars: 1 | 2 | 3, goals: boolean[], hintCapped = false) =>
      goalLineKey(level, { stars, goals, hintCapped });
    // ⭐⭐: goals met, over par.
    expect(line(build, 2, [true])).toBe('goals.stars2');
    expect(line(bughunt, 2, [true])).toBe('goals.stars2Edits');
    // ⭐: a goal missed names it.
    expect(line(build, 1, [false])).toBe('goals.stars1.collectAll');
    // Hint caps keep the usual lines: tier 2 (⭐⭐⭐ → ⭐⭐), tier 3 (→ ⭐).
    expect(line(build, 2, [true], true)).toBeNull();
    expect(line(build, 1, [true], true)).toBeNull();
    // ⭐⭐⭐ and levels without goals: the usual lines.
    expect(line(build, 3, [true])).toBeNull();
    expect(line(plain, 1, [])).toBeNull();
  });

  it('firstMissedGoal', () => {
    expect(firstMissedGoal(build, [false])).toBe('collectAll');
    expect(firstMissedGoal(build, undefined)).toBe('collectAll');
    expect(firstMissedGoal(build, [true])).toBeNull();
    expect(firstMissedGoal(plain, undefined)).toBeNull();
  });
});
