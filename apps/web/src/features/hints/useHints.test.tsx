import 'fake-indexeddb/auto';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi as vitest } from 'vitest';
import type { Level, WorkspaceJson } from '@codequest/content-schema';
import { computeStars, type HintTier, type LevelSession, starterEntry } from '@codequest/rewards';
import { db } from '../../data/db';
import * as ledgerRepo from '../../data/repos/ledger';
import { addLedgerEntries, getBalance, listLedger } from '../../data/repos/ledger';
import { hintTestLevel, sessionWithFails } from './testLevel';
import { type BuyResult, type HintFacts, type ProgramNow, useHints } from './useHints';

const NOW = new Date('2026-10-02T02:00:00.000Z');
const PROFILE = 'p1';
const level = hintTestLevel();

vitest.mock('../../data/repos/ledger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../data/repos/ledger')>();
  return { ...actual, spend: vitest.fn(actual.spend) };
});

/** The child's program: "khi bắt đầu" plus `types` in a chain. */
function program(...types: string[]): ProgramNow {
  let next: unknown;
  types.reverse().forEach((type, k) => {
    next = { block: { type, id: `p${String(k)}`, ...(next !== undefined && { next }) } };
  });
  const json = {
    blocks: {
      languageVersion: 0,
      blocks: [{ type: 'cq_start', id: 'start', ...(next !== undefined && { next }) }],
    },
  } as WorkspaceJson;
  return { json, capacityLeft: Infinity };
}

beforeEach(async () => {
  await db.delete();
  await db.open();
  await addLedgerEntries([starterEntry(PROFILE, NOW)], NOW); // 30 coins
});

function setup(session: LevelSession, lvl: Level = level) {
  const bought: HintTier[] = [];
  let ids = 0;
  const hook = renderHook(
    (props: { session: LevelSession }) =>
      useHints({
        profileId: PROFILE,
        level: lvl,
        session: props.session,
        onPurchased: (tier) => bought.push(tier),
        now: () => NOW,
        newPurchaseId: () => `buy-${String(++ids)}`,
      }),
    { initialProps: { session } },
  );
  return { hook, bought };
}

async function ready(hook: ReturnType<typeof setup>['hook']) {
  await waitFor(() => {
    expect(hook.result.current.ready).toBe(true);
  });
}

async function buy(
  hook: ReturnType<typeof setup>['hook'],
  tier: HintTier,
  prog?: ProgramNow,
): Promise<BuyResult | undefined> {
  let result: BuyResult | undefined;
  await act(async () => {
    result = await hook.result.current.buy(tier, prog);
  });
  return result;
}

describe('useHints: buying', () => {
  it('opens tier 1 for free after 3 losses and keeps it owned in later sessions', async () => {
    const { hook, bought } = setup(sessionWithFails(level.id, 3));
    await ready(hook);
    expect(hook.result.current.tiers[0]).toMatchObject({ tier: 1, state: 'free', price: 0 });
    expect(await buy(hook, 1)).toEqual({ status: 'opened', tier: 1 });
    expect(bought).toEqual([1]);
    expect(hook.result.current.tiersBought).toEqual([1]);
    expect(await getBalance(PROFILE)).toBe(30);
    expect((await listLedger(PROFILE)).find((e) => e.id === `hint-1:${level.id}`)).toMatchObject({
      delta: 0,
      reason: 'hint-1',
    });

    // A new session without losses: tier 1 stays free to reopen, nothing new is written.
    const later = setup(sessionWithFails(level.id, 0));
    await ready(later.hook);
    await waitFor(() => {
      expect(later.hook.result.current.tiers[0]?.state).toBe('owned');
    });
    expect(await buy(later.hook, 1)).toEqual({ status: 'opened', tier: 1 });
    expect(later.bought).toEqual([]);
    expect(await listLedger(PROFILE)).toHaveLength(2);
  });

  it('shows tier 1 free after the 3rd loss of a session mutated in place', async () => {
    const session = sessionWithFails(level.id, 2);
    const { hook } = setup(session);
    await ready(hook);
    expect(hook.result.current.tiers[0]?.state).toBe('buy');
    session.runs.push({ runId: 'r3', result: 'crash', reasonCode: 'FELL_IN_HOLE', blocksUsed: 2 });
    hook.rerender({ session });
    expect(hook.result.current.tiers[0]).toMatchObject({ state: 'free', price: 0 });
  });

  it('charges 5 for tier 1 and 15 for each tier 2, computing the step first', async () => {
    const { hook, bought } = setup(sessionWithFails(level.id, 0));
    await ready(hook);
    expect(hook.result.current.tiers.map((v) => v.price)).toEqual([5, 15, 40]);
    await buy(hook, 1);
    const first = await buy(hook, 2, program());
    expect(first).toMatchObject({ status: 'opened', tier: 2, step: { kind: 'add' } });
    // Tier 2 again (a new step each time) is charged again.
    expect(await buy(hook, 2, program('runner_jump'))).toMatchObject({
      status: 'missing',
      missing: 5,
    });
    expect(bought).toEqual([1, 2]);
    expect(await getBalance(PROFILE)).toBe(10);
    await addLedgerEntries(
      [{ ...starterEntry(PROFILE, NOW), id: 'coach-adjust:y', reason: 'coach-adjust', delta: 5 }],
      NOW,
    );
    expect(await buy(hook, 2, program('runner_jump'))).toMatchObject({ status: 'opened', tier: 2 });
    expect(await getBalance(PROFILE)).toBe(0);
    expect((await listLedger(PROFILE)).map((e) => e.id).sort()).toEqual([
      'coach-adjust:y',
      `hint-1:${level.id}`,
      `hint-2:${level.id}:buy-2`,
      `hint-2:${level.id}:buy-4`,
      'starter',
    ]);
    expect(hook.result.current.tiersBought).toEqual([1, 2, 2]);
  });

  it('takes nothing for tier 2 when the program already matches, or a block is gone in parsons', async () => {
    const { hook, bought } = setup(sessionWithFails(level.id, 0));
    await ready(hook);
    expect(await buy(hook, 2, program('runner_jump', 'runner_walk'))).toEqual({
      status: 'solved',
      tier: 2,
    });
    expect(await buy(hook, 2)).toEqual({ status: 'error' });
    const parsons = setup(
      sessionWithFails(level.id, 0),
      hintTestLevel({ mode: 'parsons', toolbox: [] }),
    );
    await ready(parsons.hook);
    expect(await buy(parsons.hook, 2, program('runner_walk'))).toEqual({
      status: 'reset',
      tier: 2,
    });
    expect(bought).toEqual([]);
    expect(parsons.bought).toEqual([]);
    expect(await getBalance(PROFILE)).toBe(30);
  });

  it('refuses a tier the level does not have, or one the child cannot afford', async () => {
    const predict = setup(sessionWithFails(level.id, 0), hintTestLevel({ mode: 'predict' }));
    await ready(predict.hook);
    expect(await buy(predict.hook, 2, program())).toEqual({ status: 'unavailable' });
    const { hook, bought } = setup(sessionWithFails(level.id, 0));
    await ready(hook);
    expect(hook.result.current.tiers[2]).toMatchObject({ state: 'locked', missing: 10 });
    expect(await buy(hook, 3)).toEqual({ status: 'missing', tier: 3, missing: 10 });
    expect(bought).toEqual([]);
    expect(await getBalance(PROFILE)).toBe(30);
  });

  it('caps the stars at 1 after buying tier 3, and reopens it for free', async () => {
    await addLedgerEntries(
      [{ ...starterEntry(PROFILE, NOW), id: 'coach-adjust:x', reason: 'coach-adjust', delta: 20 }],
      NOW,
    );
    const session = sessionWithFails(level.id, 0);
    const { hook } = setup(session);
    await ready(hook);
    expect(await buy(hook, 3)).toEqual({ status: 'opened', tier: 3 });
    expect(await getBalance(PROFILE)).toBe(10);

    // The play screen copies hints.tiersBought into the session, then scores the winning run.
    const win = { runId: 'win', result: 'success' as const, reasonCode: null, blocksUsed: 2 };
    const scored: LevelSession = { ...session, runs: [win] };
    expect(computeStars(level, scored, win)).toBe(3);
    const capped = { ...scored, hintTiersBought: [...hook.result.current.tiersBought] };
    expect(computeStars(level, capped, win)).toBe(1);

    expect(hook.result.current.tiers[2]?.state).toBe('owned');
    expect(await buy(hook, 3)).toEqual({ status: 'opened', tier: 3 });
    expect(await getBalance(PROFILE)).toBe(10);
  });

  it('ignores a second click while a purchase is being written', async () => {
    const { hook, bought } = setup(sessionWithFails(level.id, 0));
    await ready(hook);
    let second: BuyResult | undefined;
    await act(async () => {
      const first = hook.result.current.buy(2, program());
      second = await hook.result.current.buy(2, program());
      await first;
    });
    expect(second).toEqual({ status: 'busy' });
    expect(bought).toEqual([2]);
    expect(await getBalance(PROFILE)).toBe(15);
  });

  it('reports a storage failure without recording a purchase', async () => {
    vitest.mocked(ledgerRepo.spend).mockRejectedValueOnce(new Error('IndexedDB is gone'));
    const { hook, bought } = setup(sessionWithFails(level.id, 0));
    await ready(hook);
    expect(await buy(hook, 2, program())).toEqual({ status: 'error' });
    expect(bought).toEqual([]);
    expect(hook.result.current.tiersBought).toEqual([]);
    expect(hook.result.current.busy).toBe(false);
    expect(await getBalance(PROFILE)).toBe(30);
  });
});

describe('useHints: tier-0 tips', () => {
  const facts: HintFacts = {
    analysis: {
      startBlockId: 'start',
      programBlockIds: [],
      orphanBlockIds: [],
      blocksUsed: 0,
      blockTypesUsed: {},
      topBlockCount: 1,
    },
    capacityLeft: Infinity,
    idleMs: 0,
    isFirstOfModeInWorld: true,
    seenModes: new Set(),
  };

  it('shows a hint once per session and reads failStreak from the session', async () => {
    const { hook } = setup(sessionWithFails(level.id, 3));
    act(() => {
      hook.result.current.evaluate('enter', facts);
    });
    expect(hook.result.current.tip?.rule.id).toBe('g-empty-enter');
    act(() => {
      hook.result.current.dismissTip();
    });
    expect(hook.result.current.tip).toBeNull();
    let again: unknown;
    act(() => {
      again = hook.result.current.evaluate('enter', facts);
    });
    expect(again).toBeNull();
    // After a run, the 3 losses of the session make g-fail3 the hint, once.
    act(() => {
      hook.result.current.evaluate('run-end', facts);
    });
    expect(hook.result.current.tip?.rule.id).toBe('g-fail3');
    act(() => {
      again = hook.result.current.evaluate('run-end', facts);
    });
    expect(again).toBeNull();
    await ready(hook);
  });

  it('passes the last run of the session as lastOutcome', () => {
    const { hook } = setup(sessionWithFails(level.id, 1));
    let selection: ReturnType<typeof hook.result.current.evaluate> = null;
    act(() => {
      selection = hook.result.current.evaluate('run-end', {
        ...facts,
        isFirstOfModeInWorld: false,
      });
    });
    expect(selection).toBeNull();
    const timeout = sessionWithFails(level.id, 0);
    timeout.runs.push({ runId: 't', result: 'timeout', reasonCode: 'TIMEOUT', blocksUsed: 1 });
    hook.rerender({ session: timeout });
    act(() => {
      selection = hook.result.current.evaluate('run-end', facts);
    });
    expect(selection).toMatchObject({ rule: { id: 'g-timeout' } });
  });
});
