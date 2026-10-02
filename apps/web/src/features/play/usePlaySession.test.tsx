import 'fake-indexeddb/auto';
import { StrictMode, type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi as vitest } from 'vitest';
import type { Level } from '@codequest/content-schema';
import type { RunOutcome } from '@codequest/engine';
import { db } from '../../data/db';
import { listAttempts } from '../../data/repos/attempts';
import { getCreation } from '../../data/repos/creations';
import { saveDraft } from '../../data/repos/drafts';
import { getBalance } from '../../data/repos/ledger';
import { getProgress } from '../../data/repos/progress';
import { createProfile } from '../../data/repos/profiles';
import {
  DRAFT_HASH_KEY,
  levelHash,
  openSessionKey,
  toOpenRecord,
  openSession,
  addRun,
  toRunSummary,
} from './session';
import { usePlaySession } from './usePlaySession';

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

function outcome(result: RunOutcome['result'], blocksUsed = 3): RunOutcome {
  return {
    result,
    reasonCode: result === 'success' ? null : 'FELL_IN_HOLE',
    events: [],
    stats: { blocksUsed } as RunOutcome['stats'],
  };
}

let profileId: string;

beforeEach(async () => {
  sessionStorage.clear();
  await db.delete();
  await db.open();
  profileId = (await createProfile({ nickname: 'Na', avatarId: 'panda', pin: '1234' })).id;
});

afterEach(() => {
  vitest.restoreAllMocks();
});

async function mount(
  wrapper?: (props: { children: ReactNode }) => ReactNode,
  forLevel: Level = level,
) {
  const hook = renderHook(() => usePlaySession(profileId, forLevel), wrapper ? { wrapper } : {});
  await waitFor(() => {
    expect(hook.result.current.ready).toBe(true);
  });
  return hook;
}

describe('usePlaySession', () => {
  it('records a win at once (35 coins), the attempt on unmount', async () => {
    const hook = await mount();
    let coins = 0;
    await act(async () => {
      coins = (await hook.result.current.recordRun(outcome('success')))?.coins ?? -1;
    });
    expect(coins).toBe(35);
    expect(await getBalance(profileId)).toBe(65);
    expect((await getProgress(profileId, level.id))?.bestStars).toBe(3);
    expect(sessionStorage.getItem(openSessionKey(profileId, level.id))).not.toBeNull();

    hook.unmount();
    await waitFor(async () => {
      expect(await listAttempts(profileId, level.id)).toHaveLength(1);
    });
    await waitFor(() => {
      expect(sessionStorage.getItem(openSessionKey(profileId, level.id))).toBeNull();
    });
  });

  it('pagehide ends the session too; unmounting after it writes nothing more', async () => {
    const hook = await mount();
    await act(async () => {
      await hook.result.current.recordRun(outcome('crash'));
    });
    window.dispatchEvent(new Event('pagehide'));
    await waitFor(async () => {
      expect(await listAttempts(profileId, level.id)).toHaveLength(1);
    });
    hook.unmount();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const [attempt] = await listAttempts(profileId, level.id);
    expect(attempt?.runs).toHaveLength(1);
    expect(await listAttempts(profileId, level.id)).toHaveLength(1);
    expect((await getProgress(profileId, level.id))?.attempts).toBe(1);
  });

  it('StrictMode mounting twice without runs stores no attempt', async () => {
    const hook = await mount(StrictMode);
    hook.unmount();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(await listAttempts(profileId, level.id)).toHaveLength(0);
  });

  it('a hint bought in the session caps the stars of the win (tier 2 → ⭐⭐)', async () => {
    const hook = await mount();
    act(() => {
      hook.result.current.recordHintBought(2, null);
    });
    let stars = 0;
    await act(async () => {
      stars = (await hook.result.current.recordRun(outcome('success')))?.stars ?? -1;
    });
    expect(stars).toBe(2);
    expect(hook.result.current.snapshot().session.hintTiersBought).toEqual([2]);
    hook.unmount();
  });

  it('closes a session a previous page left open (stale sessionStorage record)', async () => {
    let state = openSession(level.id, { progress: undefined, ledger: [] });
    state = addRun(state, {
      level,
      run: toRunSummary(outcome('crash'), 'old-run'),
      now: new Date(),
      profileId,
    }).state;
    const record = toOpenRecord(state, {
      attemptId: 'stale-attempt',
      profileId,
      startedAt: new Date(Date.now() - 60_000),
    });
    sessionStorage.setItem(openSessionKey(profileId, level.id), JSON.stringify(record));

    const hook = await mount();
    const attempts = await listAttempts(profileId, level.id);
    expect(attempts.map((a) => a.id)).toEqual(['stale-attempt']);
    expect((await getProgress(profileId, level.id))?.attempts).toBe(1);
    expect(sessionStorage.getItem(openSessionKey(profileId, level.id))).toBeNull();
    // That earlier lost run means this win is not "first try".
    let ids: string[] = [];
    await act(async () => {
      ids =
        (await hook.result.current.recordRun(outcome('success')))?.entries.map((e) => e.id) ?? [];
    });
    expect(ids).not.toContain('first-try:w01-l03');
    hook.unmount();
  });
});

const program = (...types: string[]) => ({
  blocks: {
    languageVersion: 0 as const,
    blocks: [
      { type: 'cq_start', id: 'start', x: 0, y: 0 },
      ...types.map((type, i) => ({ type, id: `b${String(i)}`, x: 0, y: 99 })),
    ],
  },
});

describe('usePlaySession modes (P1-06)', () => {
  const predictLevel: Level = {
    ...level,
    id: 'p-predict',
    mode: 'predict',
    toolbox: [],
    initialWorkspace: program('runner_walk'),
    predict: {
      options: [
        { key: 'win', label: 'Tới cờ' },
        { key: 'stop@1', label: 'Dừng' },
        { key: 'crash:FELL_IN_HOLE@2', label: 'Rơi hố' },
      ],
    },
  };
  const creative: Level = { ...level, id: 'p-creative', mode: 'creative', stage: 'creative' };

  it('a run before the session is loaded records nothing (the screen waits for ready)', async () => {
    const hook = renderHook(() => usePlaySession(profileId, predictLevel));
    expect(hook.result.current.ready).toBe(false);
    expect(await hook.result.current.recordRun(outcome('crash'), 'win')).toBeNull();
    await waitFor(() => {
      expect(hook.result.current.ready).toBe(true);
    });
    expect(hook.result.current.snapshot().session.runs).toEqual([]);
    hook.unmount();
  });

  it('predict ignores drafts: the program is always the level own', async () => {
    const tagged = { ...program('runner_jump'), [DRAFT_HASH_KEY]: levelHash(predictLevel) };
    await saveDraft(profileId, predictLevel.id, tagged);
    const hook = await mount(undefined, predictLevel);
    expect(hook.result.current.initialWorkspace).toEqual(predictLevel.initialWorkspace);
    hook.unmount();
  });

  it('predict: wrong picks of a session a reload left open come back', async () => {
    let state = openSession(predictLevel.id, { progress: undefined, ledger: [] });
    const engine = { ...outcome('crash'), answerKey: 'crash:FELL_IN_HOLE@2' };
    for (const [id, key] of [
      ['r1', 'win'],
      ['r2', 'stop@1'],
    ] as const) {
      state = addRun(state, {
        level: predictLevel,
        run: toRunSummary(engine, id, key),
        now: new Date(),
        profileId,
      }).state;
    }
    const record = toOpenRecord(state, { attemptId: 'old', profileId, startedAt: new Date() });
    sessionStorage.setItem(openSessionKey(profileId, predictLevel.id), JSON.stringify(record));
    const hook = await mount(StrictMode, predictLevel);
    expect(hook.result.current.wrongPicks).toEqual(['win', 'stop@1']);
    hook.unmount();
  });

  it('creative: Lưu pays 10 coins once, stores the creation, restores it next time', async () => {
    const hook = await mount(undefined, creative);
    let coins = -1;
    await act(async () => {
      coins = await hook.result.current.saveCreative(program('runner_walk'));
    });
    expect(coins).toBe(10);
    await act(async () => {
      coins = await hook.result.current.saveCreative(program('runner_jump'));
    });
    expect(coins).toBe(0);
    expect(await getBalance(profileId)).toBe(40);
    expect((await getCreation(profileId, creative.id))?.workspace).toEqual(program('runner_jump'));
    hook.unmount();
    // No draft: the saved creation is what the workspace starts with.
    const again = await mount(undefined, creative);
    expect(again.result.current.initialWorkspace).toEqual(program('runner_jump'));
    again.unmount();
  });

  it('creative: a failed save pays nothing and the next save pays the coins', async () => {
    const hook = await mount(undefined, creative);
    vitest.spyOn(db.ledger, 'bulkAdd').mockRejectedValueOnce(new Error('disk full'));
    await act(async () => {
      await expect(hook.result.current.saveCreative(program('runner_walk'))).rejects.toThrow();
    });
    expect(await getBalance(profileId)).toBe(30);
    let coins = -1;
    await act(async () => {
      coins = await hook.result.current.saveCreative(program('runner_walk'));
    });
    expect(coins).toBe(10);
    expect(await getBalance(profileId)).toBe(40);
    hook.unmount();
  });

  it('creative offline (data layer unreadable): Lưu rejects', async () => {
    vitest.spyOn(db.progress, 'get').mockRejectedValue(new Error('blocked'));
    const hook = await mount(undefined, creative);
    expect(hook.result.current.offline).toBe(true);
    await act(async () => {
      await expect(hook.result.current.saveCreative(program('runner_walk'))).rejects.toThrow();
    });
    hook.unmount();
  });
});
