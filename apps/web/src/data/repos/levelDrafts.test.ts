// @vitest-environment node
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import { countOutbox } from './outbox';
import { deleteLevelDraft, listLevelDrafts, loadLevelDraft, saveLevelDraft } from './levelDrafts';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('level editor drafts repository', () => {
  it('saves, lists newest first, loads and deletes drafts', async () => {
    await saveLevelDraft(
      'k1',
      'runner-moi',
      { id: 'runner-moi' },
      new Date('2026-10-03T01:00:00Z'),
    );
    await saveLevelDraft('k2', 'maze-moi', { id: 'maze-moi' }, new Date('2026-10-03T02:00:00Z'));
    expect((await listLevelDrafts()).map((row) => row.key)).toEqual(['k2', 'k1']);

    // Saving again under the same key replaces the row (the id may have changed meanwhile).
    await saveLevelDraft('k1', 'w03-l01', { id: 'w03-l01' }, new Date('2026-10-03T03:00:00Z'));
    expect((await listLevelDrafts()).map((row) => [row.key, row.levelId])).toEqual([
      ['k1', 'w03-l01'],
      ['k2', 'maze-moi'],
    ]);
    expect(await loadLevelDraft('k1')).toEqual({ id: 'w03-l01' });

    await deleteLevelDraft('k1');
    expect(await loadLevelDraft('k1')).toBeUndefined();
    expect(await listLevelDrafts()).toHaveLength(1);
  });

  it('stays local: drafts are not queued for sync', async () => {
    await saveLevelDraft('k1', 'runner-moi', {});
    expect(await countOutbox()).toBe(0);
  });
});
