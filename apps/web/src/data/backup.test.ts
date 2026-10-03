// @vitest-environment node
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  BACKUP_VERSION,
  type Backup,
  backupFileName,
  MAX_BACKUP_BYTES,
  exportBackup,
  parseBackup,
  restoreBackup,
  serializeBackup,
} from './backup';
import { db, type LedgerRow } from './db';
import { saveAttempt } from './repos/attempts';
import { loadDraft, saveDraft } from './repos/drafts';
import { addLedgerEntries, getBalance } from './repos/ledger';
import { markLessonDone } from './repos/lessons';
import { countOutbox } from './repos/outbox';
import { createProfile, ensureCoachProfile, listProfiles, verifyPin } from './repos/profiles';
import { listProgress, saveProgress } from './repos/progress';

const NOW = new Date('2026-10-02T02:00:00.000Z');
const WORKSPACE = {
  blocks: { languageVersion: 0 as const, blocks: [{ type: 'runner_jump', id: 'b1' }] },
};

const coin = (
  profileId: string,
  id: string,
  delta: number,
  reason: LedgerRow['reason'] = 'level-clear',
): LedgerRow => ({
  id,
  profileId,
  delta,
  reason,
  refId: null,
  at: NOW.toISOString(),
  localDay: '2026-10-02',
});

async function seed(): Promise<string> {
  const { id } = await createProfile({ nickname: 'Na', avatarId: 'panda-1', pin: '1234' }, NOW);
  await saveProgress(
    id,
    {
      levelId: 'w01-l01',
      bestStars: 3,
      bestBlocks: 5,
      completedAt: NOW.toISOString(),
      firstTryWin: true,
      attempts: 1,
    },
    NOW,
  );
  await addLedgerEntries(
    [
      coin(id, 'level-clear:w01-l01', 10),
      coin(id, 'star-2:w01-l01', 5, 'star-2'),
      coin(id, 'hint-2:w01-l01:u1', -15, 'hint-2'),
    ],
    NOW,
  );
  await markLessonDone(id, 'w01-lesson', [coin(id, 'lesson:w01-lesson', 5, 'lesson')], NOW);
  await saveDraft(id, 'w01-l02', WORKSPACE, NOW);
  await saveAttempt(
    {
      id: '6d1f3a52-0d43-4c6e-9a65-3f4c4b0e6a11',
      profileId: id,
      levelId: 'w01-l01',
      startedAt: NOW.toISOString(),
      endedAt: NOW.toISOString(),
      runs: [{ runId: 'r1', result: 'success', reasonCode: null, blocksUsed: 5 }],
      hintTiersBought: [2],
      won: true,
    },
    NOW,
  );
  await db.inventory.add({
    profileId: id,
    itemId: 'skin-red',
    equipped: true,
    at: NOW.toISOString(),
  });
  await db.badges.add({ profileId: id, badgeId: 'first-run', at: NOW.toISOString() });
  return id;
}

function firstProfile(backup: Backup): Backup['profiles'][number] {
  const data = backup.profiles[0];
  if (!data) throw new Error('empty backup');
  return data;
}

async function wipe(): Promise<void> {
  await db.delete();
  await db.open();
}

beforeEach(wipe);

describe('backup and restore', () => {
  it('backup → wipe → restore gives the same balance, progress, draft and PIN', async () => {
    const id = await seed();
    const balanceBefore = await getBalance(id);
    expect(balanceBefore).toBe(35);
    const progressBefore = await listProgress(id);
    const file = serializeBackup(await exportBackup(undefined, NOW));

    await wipe();
    expect(await getBalance(id)).toBe(0);

    const parsed = parseBackup(file);
    if (!parsed.ok) throw new Error(parsed.error);
    expect(await restoreBackup(parsed.backup, NOW)).toEqual({ restored: [id], conflicts: [] });

    expect(await getBalance(id)).toBe(balanceBefore);
    expect(await listProgress(id)).toEqual(progressBefore);
    expect(await loadDraft(id, 'w01-l02')).toEqual(WORKSPACE);
    expect(await verifyPin(id, '1234')).toBe(true);
    expect(await verifyPin(id, '9999')).toBe(false);
    expect(await db.lessons.count()).toBe(1);
    expect(await db.attempts.count()).toBe(1);
    expect(await db.inventory.count()).toBe(1);
    expect(await db.badges.count()).toBe(1);
    // Restored synced rows are queued so phase 2 can push them to the student account.
    expect(await countOutbox()).toBe(5 + 1 + 1 + 1 + 1 + 1);
  });

  it('never contains the PIN, the outbox or device meta', async () => {
    await seed();
    const file = serializeBackup(await exportBackup(undefined, NOW));
    expect(file).not.toContain('"1234"');
    expect(file).not.toContain('outbox');
    expect(file).not.toContain('schemaVersion');
    expect(JSON.parse(file)).toMatchObject({ format: 'codequest-backup', version: BACKUP_VERSION });
  });

  it('restoring twice, or onto the same data, does not count coins twice', async () => {
    const id = await seed();
    const parsed = parseBackup(serializeBackup(await exportBackup(undefined, NOW)));
    if (!parsed.ok) throw new Error(parsed.error);
    const { backup } = parsed;
    const outboxBefore = await countOutbox();
    await restoreBackup(backup, NOW);
    await restoreBackup(backup, NOW);
    expect(await getBalance(id)).toBe(35);
    expect(await countOutbox()).toBe(outboxBefore);
  });

  it('merges with newer local data instead of overwriting it', async () => {
    const id = await seed();
    const backup = await exportBackup(undefined, NOW);
    await saveProgress(
      id,
      {
        levelId: 'w01-l01',
        bestStars: 3,
        bestBlocks: 3,
        completedAt: NOW.toISOString(),
        firstTryWin: true,
        attempts: 4,
      },
      NOW,
    );
    await addLedgerEntries([coin(id, 'level-clear:w01-l02', 10)], NOW);
    await restoreBackup(backup, NOW);
    expect(await getBalance(id)).toBe(45);
    expect((await listProgress(id))[0]).toMatchObject({ bestBlocks: 3, attempts: 4 });
  });

  it('exports only the chosen profiles', async () => {
    const id = await seed();
    await createProfile({ nickname: 'Bin', avatarId: 'panda-2', pin: '5555' }, NOW);
    const backup = await exportBackup([id], NOW);
    expect(backup.profiles.map((p) => p.profile.id)).toEqual([id]);
  });

  it.each([
    ['not json', 'not-json'],
    ['{"hello":1}', 'not-backup'],
    [JSON.stringify({ format: 'codequest-backup', version: BACKUP_VERSION + 1 }), 'newer-version'],
    [
      JSON.stringify({
        format: 'codequest-backup',
        version: BACKUP_VERSION,
        exportedAt: 'yesterday',
        profiles: [],
      }),
      'invalid',
    ],
  ])('rejects %s as %s', (text, error) => {
    expect(parseBackup(text)).toEqual({ ok: false, error });
  });

  it('rejects rows that belong to another profile or bad coin lines', async () => {
    const id = await seed();
    const good = await exportBackup(undefined, NOW);
    const stranger = structuredClone(good);
    stranger.profiles[0]?.ledger.push(coin('someone-else', 'level-clear:w01-l09', 10));
    expect(parseBackup(JSON.stringify(stranger))).toEqual({ ok: false, error: 'invalid' });

    const badReason = structuredClone(good);
    badReason.profiles[0]?.ledger.push({
      ...coin(id, 'x', 999),
      reason: 'cheat' as LedgerRow['reason'],
    });
    expect(parseBackup(JSON.stringify(badReason))).toEqual({ ok: false, error: 'invalid' });

    expect(parseBackup(JSON.stringify(good)).ok).toBe(true);
  });

  it('names the file with the Vietnam day', () => {
    expect(backupFileName(NOW)).toBe('codequest-sao-luu-2026-10-02.json');
    expect(backupFileName(new Date('2026-10-02T18:00:00.000Z'))).toBe(
      'codequest-sao-luu-2026-10-03.json',
    );
  });

  it('rejects a malformed PIN hash or nickname in the file', async () => {
    await seed();
    const good = await exportBackup(undefined, NOW);
    const cases: [string, (b: Backup) => void][] = [
      [
        'short hash',
        (b) => {
          firstProfile(b).profile.pinHash = 'pbkdf2-sha256$100000$AA==$AA==';
        },
      ],
      [
        'too few iterations',
        (b) => {
          const p = firstProfile(b).profile;
          p.pinHash = p.pinHash.replace('$100000$', '$10$');
        },
      ],
      [
        'too many iterations',
        (b) => {
          const p = firstProfile(b).profile;
          p.pinHash = p.pinHash.replace('$100000$', '$9999999$');
        },
      ],
      [
        'nickname too long',
        (b) => {
          firstProfile(b).profile.nickname = 'Một hai ba bốn năm';
        },
      ],
      [
        'nickname not trimmed',
        (b) => {
          firstProfile(b).profile.nickname = ' Na';
        },
      ],
      [
        'nickname not NFC',
        (b) => {
          firstProfile(b).profile.nickname = 'Ánh'.normalize('NFD');
        },
      ],
    ];
    for (const [name, mutate] of cases) {
      const bad = structuredClone(good);
      mutate(bad);
      expect(parseBackup(JSON.stringify(bad)), name).toEqual({ ok: false, error: 'invalid' });
    }
  });

  it('rejects a file over MAX_BACKUP_BYTES before parsing it', () => {
    expect(parseBackup(' '.repeat(MAX_BACKUP_BYTES + 1))).toEqual({
      ok: false,
      error: 'too-large',
    });
  });

  it('skips and reports a profile whose nickname belongs to another local profile', async () => {
    const id = await seed();
    const backup = await exportBackup(undefined, NOW);
    await wipe();
    const local = await createProfile({ nickname: 'na', avatarId: 'panda-9', pin: '9999' }, NOW);

    expect(await restoreBackup(backup, NOW)).toEqual({
      restored: [],
      conflicts: [{ profileId: id, nickname: 'Na', existingProfileId: local.id }],
    });
    expect((await listProfiles()).map((p) => p.id)).toEqual([local.id]);
    expect(await getBalance(id)).toBe(0);
    expect(await db.progress.count()).toBe(0);
    expect(await getBalance(local.id)).toBe(30);
  });

  it('keeps the replay cap after a restore', async () => {
    const id = await seed();
    const replays = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'].map((r) =>
      coin(id, `replay:${r}`, 1, 'replay'),
    );
    await addLedgerEntries(replays, NOW);
    expect(await getBalance(id)).toBe(35 + 5);
    const file = serializeBackup(await exportBackup(undefined, NOW));
    await wipe();
    const parsed = parseBackup(file);
    if (!parsed.ok) throw new Error(parsed.error);
    await restoreBackup(parsed.backup, NOW);
    expect(await db.ledger.count()).toBe(5 + 7);
    expect(await getBalance(id)).toBe(35 + 5);
  });

  it('ignores rows repeated inside the file instead of failing', async () => {
    const id = await seed();
    const backup = await exportBackup(undefined, NOW);
    const data = firstProfile(backup);
    data.lessons.push(...data.lessons);
    data.attempts.push(...data.attempts);
    data.badges.push(...data.badges);
    data.ledger.push(...data.ledger);
    await wipe();
    const parsed = parseBackup(JSON.stringify(backup));
    if (!parsed.ok) throw new Error(parsed.error);
    expect((await restoreBackup(parsed.backup, NOW)).restored).toEqual([id]);
    expect(await db.lessons.count()).toBe(1);
    expect(await db.attempts.count()).toBe(1);
    expect(await getBalance(id)).toBe(35);
  });
});

describe('coach review profile and backups', () => {
  it('is left out of exports, by default and when asked for by id', async () => {
    await ensureCoachProfile('2468', NOW);
    const kid = await createProfile({ nickname: 'Na', avatarId: 'panda', pin: '1234' }, NOW);
    const coach = (await listProfiles()).find((p) => p.role === 'coach');
    if (!coach) throw new Error('no coach profile');
    expect((await exportBackup(undefined, NOW)).profiles.map((p) => p.profile.id)).toEqual([
      kid.id,
    ]);
    expect(await exportBackup([coach.id], NOW)).toMatchObject({ profiles: [] });
  });
});
