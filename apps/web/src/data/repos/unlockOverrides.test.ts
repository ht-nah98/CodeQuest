// @vitest-environment node
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import { countOutbox } from './outbox';
import { listUnlockOverrides, setUnlockOverride } from './unlockOverrides';

const NOW = new Date('2026-10-06T02:00:00.000Z');

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('unlock overrides repository', () => {
  it('opens and closes a target per profile, idempotently, without outbox lines', async () => {
    await setUnlockOverride('p1', 'w02', true, NOW);
    await setUnlockOverride('p1', 'w02', true, NOW);
    await setUnlockOverride('p1', 'w01-l05', true, NOW);
    await setUnlockOverride('p2', 'w03', true, NOW);
    expect((await listUnlockOverrides('p1')).map((r) => r.targetId).sort()).toEqual([
      'w01-l05',
      'w02',
    ]);
    await setUnlockOverride('p1', 'w02', false, NOW);
    await setUnlockOverride('p1', 'w09', false, NOW);
    expect(await listUnlockOverrides('p1')).toEqual([
      { profileId: 'p1', targetId: 'w01-l05', at: NOW.toISOString() },
    ]);
    expect(await listUnlockOverrides('p2')).toHaveLength(1);
    expect(await countOutbox()).toBe(0);
  });
});
