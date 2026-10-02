// @vitest-environment node
import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createDb, SCHEMA_VERSIONS, type ProgressRow } from './db';

const row: ProgressRow = {
  profileId: 'p1',
  levelId: 'w01-l01',
  bestStars: 3,
  bestBlocks: 4,
  completedAt: '2026-10-02T02:00:00.000Z',
  firstTryWin: true,
  attempts: 1,
  updatedAt: '2026-10-02T02:00:00.000Z',
};

describe('database schema', () => {
  it('creates every table of data-sync-auth.md §2 at version 1', async () => {
    const db = createDb('schema-v1');
    await db.open();
    expect(db.verno).toBe(1);
    expect(db.tables.map((t) => t.name).sort()).toEqual([
      'attempts',
      'badges',
      'creations',
      'drafts',
      'inventory',
      'ledger',
      'lessons',
      'meta',
      'outbox',
      'profiles',
      'progress',
    ]);
    expect(await db.meta.get('schemaVersion')).toEqual({ key: 'schemaVersion', value: 1 });
    db.close();
  });

  it('upgrades an existing version-1 database without losing rows', async () => {
    const v1 = createDb('schema-upgrade');
    await v1.progress.put(row);
    v1.close();

    const v2 = createDb('schema-upgrade', [
      ...SCHEMA_VERSIONS,
      {
        version: 2,
        stores: { progress: '[profileId+levelId], profileId, bestStars' },
        upgrade: async (tx) => {
          await tx
            .table<ProgressRow & { migrated?: boolean }>('progress')
            .toCollection()
            .modify((r) => {
              r.migrated = true;
            });
        },
      },
    ]);
    await v2.open();
    expect(v2.verno).toBe(2);
    expect(await v2.progress.where('bestStars').equals(3).toArray()).toEqual([
      { ...row, migrated: true },
    ]);
    expect(await v2.meta.get('schemaVersion')).toEqual({ key: 'schemaVersion', value: 2 });
    v2.close();
  });
});
