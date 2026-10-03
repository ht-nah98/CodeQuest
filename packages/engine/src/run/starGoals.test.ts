// Star goals in the run outcome (phase-2.md P2-21, ADR-0017): judged per map on the final
// state with `kind.checkStarGoal`, and at the top level only when they hold on every map.
import { describe, expect, it } from 'vitest';
import type { GameKindDefinition } from '../index';
import { runLevel } from '../index';
import {
  lineKind,
  lineLevel,
  program,
  step,
  type LineConfig,
  type LineEvent,
  type LineState,
} from '../testing/lineKind.test';

/** Test-only rule: `collectAll` holds on a map whose final position is past cell 2. */
const goalKind: GameKindDefinition<LineConfig, LineState, LineEvent> = {
  ...lineKind,
  checkStarGoal: (_goal, state) => state.pos > 2,
};

const threeSteps = program([step('a'), step('b'), step('c')]);
const twoSteps = program([step('a'), step('b')]);

describe('runLevel with starGoals', () => {
  it('adds no goals to a level without starGoals', () => {
    const outcome = runLevel({ kind: goalKind, level: lineLevel(), workspace: threeSteps });
    expect(outcome.result).toBe('success');
    expect('goals' in outcome).toBe(false);
  });

  it('reports a met goal and a missed one on a win', () => {
    const met = runLevel({
      kind: goalKind,
      level: lineLevel({ starGoals: [{ kind: 'collectAll' }] }),
      workspace: threeSteps,
    });
    expect(met).toMatchObject({ result: 'success', goals: [true] });

    const missed = runLevel({
      kind: goalKind,
      level: lineLevel({ config: { length: 10, goal: 2 }, starGoals: [{ kind: 'collectAll' }] }),
      workspace: twoSteps,
    });
    // The goal never decides the win.
    expect(missed).toMatchObject({ result: 'success', goals: [false] });
  });

  it('judges the final state even when the run is lost', () => {
    const outcome = runLevel({
      kind: goalKind,
      level: lineLevel({ config: { length: 10, goal: 5 }, starGoals: [{ kind: 'collectAll' }] }),
      workspace: threeSteps,
    });
    expect(outcome).toMatchObject({ result: 'incomplete', goals: [true] });
  });

  it('holds a goal for the level only when it holds on every map', () => {
    const level = (holes: number[]) =>
      lineLevel({
        config: { length: 10, goal: 3 },
        variants: [{ length: 10, goal: 3, holes }],
        starGoals: [{ kind: 'collectAll' }],
      });
    // Map 2 ends where Măng falls: on 3 the goal holds, on 2 it does not.
    const both = runLevel({ kind: goalKind, level: level([3]), workspace: threeSteps });
    expect(both.maps?.map((map) => map.goals)).toEqual([[true], [true]]);
    expect(both.goals).toEqual([true]);

    const one = runLevel({ kind: goalKind, level: level([2]), workspace: threeSteps });
    expect(one.maps?.map((map) => map.goals)).toEqual([[true], [false]]);
    expect(one.goals).toEqual([false]);
  });

  it('meets no goal when the kind has no checkStarGoal', () => {
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel({ starGoals: [{ kind: 'collectAll' }] }),
      workspace: threeSteps,
    });
    expect(outcome).toMatchObject({ result: 'success', goals: [false] });
  });

  it('has no goals when the program could not run', () => {
    const outcome = runLevel({
      kind: goalKind,
      level: lineLevel({ starGoals: [{ kind: 'collectAll' }] }),
      workspace: program([]),
    });
    expect(outcome.result).toBe('error');
    expect('goals' in outcome).toBe(false);
  });

  it('turns a throwing checkStarGoal into INTERNAL_ERROR', () => {
    const broken: GameKindDefinition<LineConfig, LineState, LineEvent> = {
      ...lineKind,
      checkStarGoal: () => {
        throw new Error('bad goal');
      },
    };
    const outcome = runLevel({
      kind: broken,
      level: lineLevel({ starGoals: [{ kind: 'collectAll' }] }),
      workspace: threeSteps,
    });
    expect(outcome).toMatchObject({ result: 'error', reasonCode: 'INTERNAL_ERROR' });
    expect(outcome.debug?.message).toBe('bad goal');
  });
});
