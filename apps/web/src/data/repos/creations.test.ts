// @vitest-environment node
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import type { WorkspaceJson } from '@codequest/content-schema';
import { db } from '../db';
import { getCreation, saveCreation } from './creations';
import { listOutbox } from './outbox';

const workspace = (...types: string[]): WorkspaceJson => ({
  blocks: {
    languageVersion: 0,
    blocks: types.map((type, i) => ({ type, id: `b${String(i)}`, x: 0, y: 0 })),
  },
});

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('creations repository', () => {
  it('keeps one creation per profile and level; a new save replaces it', async () => {
    await saveCreation({
      profileId: 'p1',
      levelId: 'w01-creative',
      workspace: workspace('runner_walk'),
      title: 'Sân chơi',
    });
    await saveCreation({
      profileId: 'p1',
      levelId: 'w01-creative',
      workspace: workspace('runner_jump'),
      title: 'Sân chơi',
    });
    expect((await getCreation('p1', 'w01-creative'))?.workspace).toEqual(workspace('runner_jump'));
    expect(await getCreation('p2', 'w01-creative')).toBeUndefined();
  });

  it('queues every save for sync and keeps sharedAt', async () => {
    await db.creations.put({
      profileId: 'p1',
      levelId: 'w01-creative',
      workspace: workspace(),
      title: 't',
      sharedAt: '2026-10-01T00:00:00.000Z',
    });
    const row = await saveCreation({
      profileId: 'p1',
      levelId: 'w01-creative',
      workspace: workspace('runner_walk'),
      title: 't',
    });
    expect(row.sharedAt).toBe('2026-10-01T00:00:00.000Z');
    const outbox = await listOutbox();
    expect(outbox.map((line) => line.table)).toEqual(['creations']);
  });
});
