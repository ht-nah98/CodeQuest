import 'fake-indexeddb/auto';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../data/db';
import { addLedgerEntries } from '../../data/repos/ledger';
import { saveProgress } from '../../data/repos/progress';
import { createProfile } from '../../data/repos/profiles';
import { useProfiles } from '../profiles/useProfiles';
import { useCoinBalance, useLevelProgress } from './useProgress';

const NOW = new Date('2026-10-02T02:00:00.000Z');

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('live data hooks', () => {
  it('re-render when the database changes', async () => {
    const profile = await createProfile({ nickname: 'Na', avatarId: 'panda-1', pin: '1234' }, NOW);
    const coins = renderHook(() => useCoinBalance(profile.id));
    const level = renderHook(() => useLevelProgress(profile.id, 'w01-l01'));
    const profiles = renderHook(() => useProfiles());

    await waitFor(() => {
      expect(coins.result.current).toBe(30);
    });
    await waitFor(() => {
      expect(level.result.current).toBeNull();
    });
    await waitFor(() => {
      expect(profiles.result.current?.map((p) => p.nickname)).toEqual(['Na']);
    });

    await act(async () => {
      await addLedgerEntries(
        [
          {
            id: 'level-clear:w01-l01',
            profileId: profile.id,
            delta: 10,
            reason: 'level-clear',
            refId: 'w01-l01',
            at: NOW.toISOString(),
            localDay: '2026-10-02',
          },
        ],
        NOW,
      );
      await saveProgress(
        profile.id,
        {
          levelId: 'w01-l01',
          bestStars: 2,
          bestBlocks: 5,
          completedAt: NOW.toISOString(),
          firstTryWin: false,
          attempts: 2,
        },
        NOW,
      );
    });
    await waitFor(() => {
      expect(coins.result.current).toBe(40);
    });
    await waitFor(() => {
      expect(level.result.current?.bestStars).toBe(2);
    });
  });
});
