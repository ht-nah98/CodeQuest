// @vitest-environment node
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { exportBackup, parseBackup, serializeBackup } from '../../data/backup';
import { db } from '../../data/db';
import { saveAttempt } from '../../data/repos/attempts';
import { createProfile, ensureCoachProfile } from '../../data/repos/profiles';
import { saveProgress } from '../../data/repos/progress';
import { childrenOfBackup, localSource, readBackupFile } from './sources';

const NOW = new Date('2026-10-06T02:00:00.000Z');

beforeEach(async () => {
  await db.delete();
  await db.open();
});

async function seedChild(nickname: string): Promise<string> {
  const { id } = await createProfile({ nickname, avatarId: 'panda', pin: '1234' }, NOW);
  await saveProgress(
    id,
    {
      levelId: 'w01-l01',
      bestStars: 2,
      bestBlocks: 4,
      completedAt: NOW.toISOString(),
      firstTryWin: false,
      attempts: 1,
    },
    NOW,
  );
  await saveAttempt({
    id: `a-${id}`,
    profileId: id,
    levelId: 'w01-l01',
    startedAt: NOW.toISOString(),
    endedAt: NOW.toISOString(),
    runs: [],
    hintTiersBought: [],
    won: true,
  });
  return id;
}

describe('coach data sources', () => {
  it('reads every child on this laptop but never the coach profile', async () => {
    const id = await seedChild('Na');
    await ensureCoachProfile('2468', NOW);
    const children = await localSource.load();
    expect(children.map((c) => c.nickname)).toEqual(['Na']);
    const [na] = children;
    expect(na).toMatchObject({ profileId: id, avatarId: 'panda', sources: [{ kind: 'local' }] });
    expect(na?.progress).toHaveLength(1);
    expect(na?.attempts).toHaveLength(1);
    expect(na?.ledger.map((e) => e.reason)).toEqual(['starter']);
    expect(na).not.toHaveProperty('pinHash');
  });

  it('turns a backup into children without PIN hashes and without touching the DB', async () => {
    await seedChild('Na');
    await seedChild('Bo');
    const text = serializeBackup(await exportBackup(undefined, NOW));
    await db.delete();
    await db.open();

    const file = new File([text], 'lop-a.json', { type: 'application/json' });
    const result = await readBackupFile(file);
    if (!result.ok) throw new Error(result.error);
    expect(result.children.map((c) => c.nickname).sort()).toEqual(['Bo', 'Na']);
    for (const child of result.children) {
      expect(child.sources).toEqual([{ kind: 'file', name: 'lop-a.json' }]);
      expect(JSON.stringify(child)).not.toContain('pbkdf2');
    }
    expect(await db.profiles.count()).toBe(0);
    expect(await db.progress.count()).toBe(0);
  });

  it('reports a file that is not a backup', async () => {
    const file = new File(['{"hello":1}'], 'x.json');
    expect(await readBackupFile(file)).toEqual({ ok: false, error: 'not-backup' });
  });

  it('drops a profile with the coach id from a hand-edited file', async () => {
    await seedChild('Na');
    const parsed = parseBackup(serializeBackup(await exportBackup(undefined, NOW)));
    if (!parsed.ok) throw new Error(parsed.error);
    const [first] = parsed.backup.profiles;
    if (!first) throw new Error('empty');
    first.profile.id = 'coach-hlv';
    expect(childrenOfBackup(parsed.backup, 'x.json')).toEqual([]);
  });
});
