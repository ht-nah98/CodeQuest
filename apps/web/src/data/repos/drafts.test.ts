// @vitest-environment node
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import type { WorkspaceJson } from '@codequest/content-schema';
import { db } from '../db';
import { deleteDraft, loadDraft, saveDraft } from './drafts';
import { countOutbox } from './outbox';

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

describe('drafts repository', () => {
  it('saves and loads a draft per profile and level', async () => {
    await saveDraft('p1', 'w01-l01', workspace('runner_jump'));
    await saveDraft('p1', 'w01-l02', workspace('runner_walk', 'runner_jump'));
    await saveDraft('p2', 'w01-l01', workspace('runner_walk'));
    expect(await loadDraft('p1', 'w01-l01')).toEqual(workspace('runner_jump'));
    expect(await loadDraft('p1', 'w01-l02')).toEqual(workspace('runner_walk', 'runner_jump'));
    expect(await loadDraft('p2', 'w01-l01')).toEqual(workspace('runner_walk'));
    expect(await loadDraft('p2', 'w01-l02')).toBeUndefined();
  });

  it('overwrites the previous draft and can delete it', async () => {
    await saveDraft('p1', 'w01-l01', workspace('runner_jump'));
    await saveDraft('p1', 'w01-l01', workspace('runner_walk'));
    expect(await loadDraft('p1', 'w01-l01')).toEqual(workspace('runner_walk'));
    await deleteDraft('p1', 'w01-l01');
    expect(await loadDraft('p1', 'w01-l01')).toBeUndefined();
  });

  it('stays local: drafts are not queued for sync', async () => {
    await saveDraft('p1', 'w01-l01', workspace('runner_jump'));
    expect(await countOutbox()).toBe(0);
  });
});
