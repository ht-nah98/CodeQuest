import { describe, expect, it } from 'vitest';
import type { Level } from '@codequest/content-schema';
import type { RunOutcome } from '@codequest/engine';
import { starterEntry } from '@codequest/rewards';
import {
  addCreativeSave,
  addHint,
  addRun,
  closeSession,
  closeStale,
  levelHash,
  openSession,
  parseOpenRecord,
  toOpenRecord,
  toRunSummary,
  wrongPicks,
} from './session';

const level: Level = {
  id: 'w01-l03',
  worldId: 'w01-lang-tre',
  stage: 'guided',
  kind: 'runner',
  mode: 'build',
  title: 'Nhảy qua hố',
  objective: 'Tới cờ',
  learningGoal: 'Nhảy',
  toolbox: ['runner_walk', 'runner_jump'],
  par: 3,
  config: {},
  hints: [],
};

const NOW = new Date('2026-10-02T03:00:00Z');
const PROFILE = 'p1';

function outcome(result: RunOutcome['result'], blocksUsed = 3): RunOutcome {
  return {
    result,
    reasonCode: result === 'success' ? null : 'FELL_IN_HOLE',
    events: [],
    stats: { blocksUsed } as RunOutcome['stats'],
  };
}

const fresh = () =>
  openSession(level.id, { progress: undefined, ledger: [starterEntry(PROFILE, NOW)] });
const add = (
  state: ReturnType<typeof fresh>,
  result: RunOutcome['result'],
  id: string,
  blocks = 3,
) =>
  addRun(state, {
    level,
    run: toRunSummary(outcome(result, blocks), id),
    now: NOW,
    profileId: PROFILE,
  });

describe('play session bookkeeping', () => {
  it('first clear at par on the first run: 10 + 5 + 5 + 5 + daily 10 = 35 coins, 3 stars', () => {
    const { reward } = add(fresh(), 'success', 'r1');
    expect(reward?.stars).toBe(3);
    expect(reward?.coins).toBe(35);
    expect(reward?.entries.map((e) => e.id)).toEqual([
      'level-clear:w01-l03',
      'star-2:w01-l03',
      'star-3:w01-l03',
      'first-try:w01-l03',
      'daily:2026-10-02',
    ]);
    expect(reward?.progressBefore).toBeUndefined();
    expect(reward?.progressAfter).toMatchObject({ bestStars: 3, attempts: 1, firstTryWin: true });
  });

  it('a lost run gives no reward; the win after it is not "first try"', () => {
    const lost = add(fresh(), 'crash', 'r1');
    expect(lost.reward).toBeNull();
    const { reward } = add(lost.state, 'success', 'r2');
    expect(reward?.entries.map((e) => e.id)).not.toContain('first-try:w01-l03');
    expect(reward?.progressAfter.attempts).toBe(2);
  });

  it('a second win in the same session sees the first one (no double first-time coins)', () => {
    const first = add(fresh(), 'success', 'r1');
    const second = add(first.state, 'success', 'r2');
    // ⭐⭐⭐ already: only the replay coin.
    expect(second.reward?.entries.map((e) => e.reason)).toEqual(['replay']);
    expect(second.reward?.progressAfter.attempts).toBe(2);
  });

  it('over par: 1 star, no star coins', () => {
    const { reward } = add(fresh(), 'success', 'r1', 5);
    expect(reward?.stars).toBe(1);
    expect(reward?.coins).toBe(10 + 5 + 10);
  });

  it('closing records the runs after the last win as attempts, and an attempt row', () => {
    let state = add(fresh(), 'success', 'r1').state;
    state = add(state, 'crash', 'r2').state;
    state = add(state, 'error', 'r3').state;
    const closed = closeSession(state, {
      attemptId: 'a1',
      profileId: PROFILE,
      startedAt: new Date('2026-10-02T02:55:00Z'),
      now: NOW,
    });
    expect(closed?.progress.attempts).toBe(2); // the error run does not count
    expect(closed?.attempt).toMatchObject({
      id: 'a1',
      levelId: 'w01-l03',
      won: true,
      endedAt: NOW.toISOString(),
    });
    expect(closed?.attempt.runs).toHaveLength(3);
  });

  it('closing an empty session writes nothing', () => {
    expect(
      closeSession(fresh(), { attemptId: 'a', profileId: PROFILE, startedAt: NOW, now: NOW }),
    ).toBeNull();
  });
});

describe('hints and the open session record', () => {
  it('addHint appends immutably; a tier-3 hint caps the next win at 1 star', () => {
    const start = fresh();
    const hinted = addHint(start, 3, null);
    expect(start.session.hintTiersBought).toEqual([]);
    expect(hinted.session.hintTiersBought).toEqual([3]);
    const { reward } = add(hinted, 'success', 'r1');
    expect(reward?.stars).toBe(1);
    expect(reward?.overPar).toBe(false);
  });

  it('a stale open session (tab closed mid-session) is recovered: attempts + attempt row', () => {
    let state = add(fresh(), 'crash', 'r1').state;
    state = add(state, 'incomplete', 'r2').state;
    const record = toOpenRecord(state, {
      attemptId: 'a-stale',
      profileId: PROFILE,
      startedAt: new Date('2026-10-02T02:50:00Z'),
    });
    const text = JSON.stringify(record);
    const parsed = parseOpenRecord(text, PROFILE, level.id);
    expect(parsed).toEqual(record);
    // Another profile / level, or junk, is ignored.
    expect(parseOpenRecord(text, 'other', level.id)).toBeNull();
    expect(parseOpenRecord(text, PROFILE, 'w01-l04')).toBeNull();
    expect(parseOpenRecord('{"nope":1}', PROFILE, level.id)).toBeNull();
    expect(parseOpenRecord('not json', PROFILE, level.id)).toBeNull();

    if (parsed === null) throw new Error('unreachable');
    const closed = closeStale(parsed, NOW);
    expect(closed?.progress.attempts).toBe(2);
    expect(closed?.attempt).toMatchObject({ id: 'a-stale', won: false, levelId: 'w01-l03' });
  });

  it('levelHash changes with the level and is stable otherwise', () => {
    expect(levelHash(level)).toBe(levelHash({ ...level }));
    expect(levelHash({ ...level, par: 4 })).not.toBe(levelHash(level));
  });
});

describe('modes other than build (P1-06)', () => {
  const predictLevel: Level = {
    ...level,
    id: 'p-predict',
    mode: 'predict',
    toolbox: [],
    predict: {
      options: [
        { key: 'win', label: 'Tới cờ' },
        { key: 'stop@1', label: 'Dừng ở ô 1' },
        { key: 'crash:FELL_IN_HOLE@2', label: 'Rơi hố' },
      ],
    },
  };
  const engineRun = (): RunOutcome => ({ ...outcome('crash'), answerKey: 'crash:FELL_IN_HOLE@2' });
  const pick = (state: ReturnType<typeof fresh>, key: string, id: string) =>
    addRun(state, {
      level: predictLevel,
      run: toRunSummary(engineRun(), id, key),
      now: NOW,
      profileId: PROFILE,
    });
  const freshPredict = () =>
    openSession(predictLevel.id, { progress: undefined, ledger: [starterEntry(PROFILE, NOW)] });

  it('predict: a pick is the run; wrong = WRONG_ANSWER, right = success whatever Măng did', () => {
    expect(toRunSummary(engineRun(), 'r1', 'win')).toMatchObject({
      result: 'incomplete',
      reasonCode: 'WRONG_ANSWER',
      predictChoice: 'win',
    });
    expect(toRunSummary(engineRun(), 'r2', 'crash:FELL_IN_HOLE@2')).toMatchObject({
      result: 'success',
      reasonCode: null,
    });
  });

  it('predict: stars by pick number, counted across sessions', () => {
    expect(pick(freshPredict(), 'crash:FELL_IN_HOLE@2', 'r1').reward?.stars).toBe(3);
    const wrong = pick(freshPredict(), 'win', 'r1');
    expect(wrong.reward).toBeNull();
    expect(pick(wrong.state, 'crash:FELL_IN_HOLE@2', 'r2').reward?.stars).toBe(2);
    // Two wrong picks in an earlier session (recorded in progress): the right pick is the 3rd.
    const leftBefore = closeSession(
      pick(pick(freshPredict(), 'win', 'a').state, 'stop@1', 'b').state,
      {
        attemptId: 'x',
        profileId: PROFILE,
        startedAt: NOW,
        now: NOW,
      },
    );
    const back = openSession(predictLevel.id, { progress: leftBefore?.progress, ledger: [] });
    expect(pick(back, 'crash:FELL_IN_HOLE@2', 'r3').reward?.stars).toBe(1);
  });

  it('bughunt: edits over parEdits is "over par" (1 star line)', () => {
    const bughunt: Level = { ...level, id: 'p-bug', mode: 'bughunt', parEdits: 1 };
    const win = (edits: number) =>
      addRun(openSession(bughunt.id, { progress: undefined, ledger: [] }), {
        level: bughunt,
        run: toRunSummary({ ...outcome('success', 9), edits }, `r${String(edits)}`),
        now: NOW,
        profileId: PROFILE,
      }).reward;
    expect(win(1)).toMatchObject({ stars: 3, edits: 1, overPar: false });
    expect(win(2)).toMatchObject({ stars: 1, edits: 2, overPar: true });
  });

  describe('star goals (P2-21)', () => {
    const goalLevel: Level = {
      ...level,
      id: 'p-goals',
      par: 4,
      starGoals: [{ kind: 'collectAll' }],
    };
    const win = (goals: boolean[] | undefined, blocks: number, tiers: Array<2 | 3> = []) => {
      let state = openSession(goalLevel.id, { progress: undefined, ledger: [] });
      for (const tier of tiers) state = addHint(state, tier);
      const run = toRunSummary(
        { ...outcome('success', blocks), ...(goals !== undefined && { goals }) },
        `r${String(blocks)}`,
      );
      return addRun(state, { level: goalLevel, run, now: NOW, profileId: PROFILE }).reward;
    };

    it('toRunSummary copies the goal flags (a copy, not the engine array)', () => {
      const goals = [true];
      const run = toRunSummary({ ...outcome('success'), goals }, 'r1');
      expect(run.goals).toEqual([true]);
      expect(run.goals).not.toBe(goals);
      expect('goals' in toRunSummary(outcome('success'), 'r2')).toBe(false);
    });

    it('a plain win is ⭐, goals met is ⭐⭐, goals + par is ⭐⭐⭐', () => {
      expect(win([false], 3)).toMatchObject({ stars: 1, goals: [false], goalsMet: false });
      expect(win(undefined, 3)).toMatchObject({ stars: 1, goalsMet: false });
      expect(win([true], 6)).toMatchObject({ stars: 2, goalsMet: true, overPar: true });
      expect(win([true], 4)).toMatchObject({
        stars: 3,
        goalsMet: true,
        overPar: false,
        hintCapped: false,
      });
    });

    it('hintCapped: only when a hint took stars away', () => {
      expect(win([true], 4, [2])).toMatchObject({ stars: 2, hintCapped: true });
      expect(win([true], 4, [3])).toMatchObject({ stars: 1, hintCapped: true });
      // Already ⭐ from the missed goal: the tier-3 cap took nothing away.
      expect(win([false], 4, [3])).toMatchObject({ stars: 1, hintCapped: false });
    });

    it('a level without goals: goalsMet is true and no flags', () => {
      const reward = add(fresh(), 'success', 'r1').reward;
      expect(reward).toMatchObject({ goalsMet: true, hintCapped: false });
      expect(reward && 'goals' in reward).toBe(false);
    });

    it('the open session record keeps the flags', () => {
      const state = addRun(openSession(goalLevel.id, { progress: undefined, ledger: [] }), {
        level: goalLevel,
        run: toRunSummary({ ...outcome('success'), goals: [false] }, 'r1'),
        now: NOW,
        profileId: PROFILE,
      }).state;
      const record = toOpenRecord(state, { attemptId: 'a1', profileId: PROFILE, startedAt: NOW });
      const back = parseOpenRecord(JSON.stringify(record), PROFILE, goalLevel.id);
      expect(back?.session.runs[0]?.goals).toEqual([false]);
    });
  });

  it('creative: the first save pays 10 coins once and marks the level done', () => {
    const creative: Level = { ...level, id: 'p-creative', mode: 'creative', stage: 'creative' };
    const start = openSession(creative.id, { progress: undefined, ledger: [] });
    const first = addCreativeSave(start, { level: creative, now: NOW, profileId: PROFILE });
    expect(first.coins).toBe(10);
    expect(first.entries.map((e) => e.id)).toEqual(['creative:p-creative']);
    expect(first.progress.completedAt).toBe(NOW.toISOString());
    const again = addCreativeSave(first.state, { level: creative, now: NOW, profileId: PROFILE });
    expect(again.coins).toBe(0);
    expect(again.entries).toEqual([]);
  });

  it('wrongPicks: wrong cards since the last right pick', () => {
    const run = (runId: string, key: string, right: boolean) =>
      toRunSummary({ ...outcome('crash'), answerKey: right ? key : 'other' }, runId, key);
    expect(wrongPicks([run('1', 'a', false), run('2', 'b', false)])).toEqual(['a', 'b']);
    expect(wrongPicks([run('1', 'a', false), run('2', 'b', true), run('3', 'c', false)])).toEqual([
      'c',
    ]);
    expect(wrongPicks([toRunSummary(outcome('crash'), 'x')])).toEqual([]);
  });
});
