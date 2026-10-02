// @vitest-environment node
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import type { LevelProgress } from '@codequest/rewards';
import { createDb, db, type AttemptRow, type LedgerRow } from '../db';
import { listAttempts, newAttemptId, saveAttempt } from './attempts';
import { getBalance } from './ledger';
import { listLessonsDone, markLessonDone } from './lessons';
import { countOutbox, listOutbox } from './outbox';
import {
  getProgress,
  listProgress,
  saveLevelResult,
  saveProgress,
  toProgressMap,
} from './progress';

const NOW = new Date('2026-10-02T02:00:00.000Z');
const LATER = new Date('2026-10-03T02:00:00.000Z');

const progress = (patch: Partial<LevelProgress> = {}): LevelProgress => ({
  levelId: 'w01-l01',
  bestStars: 2,
  bestBlocks: 6,
  completedAt: NOW.toISOString(),
  firstTryWin: false,
  attempts: 2,
  ...patch,
});

const coin = (id: string, delta: number): LedgerRow => ({
  id,
  profileId: 'p1',
  delta,
  reason: 'level-clear',
  refId: 'w01-l01',
  at: NOW.toISOString(),
  localDay: '2026-10-02',
});

const attempt = (patch: Partial<AttemptRow> = {}): AttemptRow => ({
  id: newAttemptId(),
  profileId: 'p1',
  levelId: 'w01-l01',
  startedAt: NOW.toISOString(),
  endedAt: NOW.toISOString(),
  runs: [{ runId: 'r1', result: 'success', reasonCode: null, blocksUsed: 6 }],
  hintTiersBought: [],
  won: true,
  ...patch,
});

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('progress repository', () => {
  it('inserts, then only ever improves (upsert with merge)', async () => {
    await saveProgress('p1', progress(), NOW);
    const worse = await saveProgress(
      'p1',
      progress({ bestStars: 1, bestBlocks: 4, completedAt: LATER.toISOString(), attempts: 5 }),
      LATER,
    );
    expect(worse).toMatchObject({
      bestStars: 2,
      bestBlocks: 4,
      completedAt: NOW.toISOString(),
      attempts: 5,
    });
    expect(await getProgress('p1', 'w01-l01')).toEqual({
      ...progress({ bestBlocks: 4, attempts: 5 }),
      profileId: 'p1',
      updatedAt: LATER.toISOString(),
    });
    expect(await countOutbox()).toBe(2);
  });

  it('writes nothing when the result does not improve', async () => {
    await saveProgress('p1', progress(), NOW);
    await saveProgress('p1', progress({ bestStars: 1 }), LATER);
    expect((await getProgress('p1', 'w01-l01'))?.updatedAt).toBe(NOW.toISOString());
    expect(await countOutbox()).toBe(1);
  });

  it('lists one profile as a levelId map', async () => {
    await saveProgress('p1', progress(), NOW);
    await saveProgress('p1', progress({ levelId: 'w01-l02' }), NOW);
    await saveProgress('p2', progress(), NOW);
    const map = toProgressMap(await listProgress('p1'));
    expect([...map.keys()].sort()).toEqual(['w01-l01', 'w01-l02']);
  });

  it('saves a level result atomically with its outbox lines', async () => {
    await saveLevelResult(
      { profileId: 'p1', progress: progress(), entries: [coin('level-clear:w01-l01', 10)] },
      NOW,
    );
    expect(await getBalance('p1')).toBe(10);
    expect((await listOutbox()).map((row) => row.table).sort()).toEqual(['ledger', 'progress']);
  });

  it('rolls everything back, outbox included, when the last write fails', async () => {
    // Writes: progress row, its outbox line, 2 ledger rows, then 2 ledger outbox lines.
    // Fail the very last one: everything before it must disappear too.
    let outboxWrites = 0;
    const failLast = () => {
      outboxWrites += 1;
      if (outboxWrites === 3) throw new Error('disk full');
    };
    db.outbox.hook('creating', failLast);
    try {
      await expect(
        saveLevelResult(
          {
            profileId: 'p1',
            progress: progress(),
            entries: [coin('level-clear:w01-l01', 10), coin('star-2:w01-l01', 5)],
          },
          NOW,
        ),
      ).rejects.toThrow('disk full');
    } finally {
      db.outbox.hook('creating').unsubscribe(failLast);
    }
    expect(outboxWrites).toBe(3);
    expect(await getProgress('p1', 'w01-l01')).toBeUndefined();
    expect(await getBalance('p1')).toBe(0);
    expect(await countOutbox()).toBe(0);
  });

  it('keeps progress across a reload (new connection to the same database)', async () => {
    await saveProgress('p1', progress({ bestStars: 3 }), NOW);
    db.close();
    const reopened = createDb();
    expect(await reopened.progress.get(['p1', 'w01-l01'])).toMatchObject({ bestStars: 3 });
    reopened.close();
    await db.open();
  });
});

describe('lessons repository', () => {
  it('marks a lesson done once, with its coins', async () => {
    await markLessonDone('p1', 'w01-lesson', [coin('lesson:w01-lesson', 5)], NOW);
    await markLessonDone('p1', 'w01-lesson', [coin('lesson:w01-lesson', 5)], LATER);
    expect(await listLessonsDone('p1')).toEqual([
      { profileId: 'p1', lessonId: 'w01-lesson', completedAt: NOW.toISOString() },
    ]);
    expect(await getBalance('p1')).toBe(5);
    expect(await countOutbox()).toBe(2);
  });
});

describe('attempts repository', () => {
  it('writes a finished attempt once, with one outbox line', async () => {
    const a = attempt();
    expect(await saveAttempt(a, NOW)).toBe(true);
    expect(await saveAttempt({ ...a, won: false, runs: [] }, LATER)).toBe(false);
    expect(await listAttempts('p1', 'w01-l01')).toEqual([a]);
    expect(await countOutbox()).toBe(1);
  });

  it('lists by profile or level, oldest first', async () => {
    const later = attempt({ startedAt: LATER.toISOString(), endedAt: LATER.toISOString() });
    const other = attempt({ levelId: 'w01-l02' });
    const earlier = attempt();
    for (const a of [later, other, earlier]) await saveAttempt(a, NOW);
    expect((await listAttempts('p1', 'w01-l01')).map((a) => a.id)).toEqual([earlier.id, later.id]);
    expect(await listAttempts('p1')).toHaveLength(3);
    expect(await listAttempts('p2')).toEqual([]);
  });
});
