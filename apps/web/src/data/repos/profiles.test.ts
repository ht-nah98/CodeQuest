// @vitest-environment node
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import { getBalance, listLedger } from './ledger';
import { listOutbox } from './outbox';
import { saveProgress } from './progress';
import { saveAttempt } from './attempts';
import { saveDraft } from './drafts';
import { markLessonDone } from './lessons';
import {
  changePin,
  createProfile,
  deleteProfile,
  getProfile,
  listProfiles,
  ProfileError,
  updateProfile,
  verifyPin,
} from './profiles';

const NOW = new Date('2026-10-02T02:00:00.000Z');

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('profiles repository', () => {
  it('creates a profile with 30 starter coins', async () => {
    const profile = await createProfile(
      { nickname: '  Bé  Na ', avatarId: 'panda-1', pin: '1234' },
      NOW,
    );
    expect(profile.nickname).toBe('Bé Na');
    expect(await getBalance(profile.id)).toBe(30);
    expect(await listLedger(profile.id)).toEqual([
      {
        id: 'starter',
        profileId: profile.id,
        delta: 30,
        reason: 'starter',
        refId: null,
        at: NOW.toISOString(),
        localDay: '2026-10-02',
      },
    ]);
  });

  it('queues the starter line in the outbox, never the profile or its PIN hash', async () => {
    await createProfile({ nickname: 'Na', avatarId: 'panda-1', pin: '1234' }, NOW);
    const outbox = await listOutbox();
    expect(outbox.map((row) => row.table)).toEqual(['ledger']);
    expect(JSON.stringify(outbox)).not.toContain('pbkdf2');
  });

  it('stores the PIN only as a hash and verifies it', async () => {
    const profile = await createProfile({ nickname: 'Na', avatarId: 'panda-1', pin: '4321' }, NOW);
    const stored = await db.profiles.get(profile.id);
    expect(stored?.pinHash).toMatch(/^pbkdf2-sha256\$/);
    expect(JSON.stringify(stored)).not.toContain('4321');
    expect(await verifyPin(profile.id, '4321')).toBe(true);
    expect(await verifyPin(profile.id, '1234')).toBe(false);
    expect(await verifyPin('missing', '4321')).toBe(false);
  });

  it('changes the PIN', async () => {
    const profile = await createProfile({ nickname: 'Na', avatarId: 'panda-1', pin: '4321' }, NOW);
    await changePin(profile.id, '0000');
    expect(await verifyPin(profile.id, '0000')).toBe(true);
    expect(await verifyPin(profile.id, '4321')).toBe(false);
  });

  it.each([
    [{ nickname: '   ', pin: '1234' }, 'nickname-empty'],
    [{ nickname: 'Một hai ba bốn năm', pin: '1234' }, 'nickname-too-long'],
    [{ nickname: 'Na', pin: '12a4' }, 'pin-invalid'],
  ])('rejects %o with %s', async (input, code) => {
    await expect(createProfile({ ...input, avatarId: 'panda-1' }, NOW)).rejects.toEqual(
      new ProfileError(code as ProfileError['code']),
    );
    expect(await db.profiles.count()).toBe(0);
  });

  it('counts nickname length in visible letters, tone marks included', async () => {
    const nickname = 'Ngọc Ánh Mây'.normalize('NFD');
    const profile = await createProfile({ nickname, avatarId: 'panda-1', pin: '1234' }, NOW);
    expect(profile.nickname).toBe('Ngọc Ánh Mây'.normalize('NFC'));
  });

  it('rejects a nickname already used on this laptop, ignoring case', async () => {
    await createProfile({ nickname: 'Bé Na', avatarId: 'panda-1', pin: '1234' }, NOW);
    const error: unknown = await createProfile(
      { nickname: 'bé na', avatarId: 'panda-2', pin: '1234' },
      NOW,
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProfileError);
    expect((error as ProfileError).code).toBe('nickname-taken');
    expect(await db.profiles.count()).toBe(1);
    expect(await db.ledger.count()).toBe(1);
  });

  it('lists profiles oldest first', async () => {
    await createProfile(
      { nickname: 'B', avatarId: 'a', pin: '1111' },
      new Date('2026-10-02T05:00:00Z'),
    );
    await createProfile(
      { nickname: 'A', avatarId: 'a', pin: '1111' },
      new Date('2026-10-01T05:00:00Z'),
    );
    expect((await listProfiles()).map((p) => p.nickname)).toEqual(['A', 'B']);
  });

  it('updates avatar and settings', async () => {
    const profile = await createProfile({ nickname: 'Na', avatarId: 'panda-1', pin: '1234' }, NOW);
    await updateProfile(profile.id, { avatarId: 'panda-3', settings: { reducedMotion: true } });
    const stored = await db.profiles.get(profile.id);
    expect(stored?.avatarId).toBe('panda-3');
    expect(stored?.settings.reducedMotion).toBe(true);
    expect(stored?.settings.musicVolume).toBe(profile.settings.musicVolume);
  });

  it('deletes a profile with all its rows and pending outbox lines', async () => {
    const keep = await createProfile({ nickname: 'Keep', avatarId: 'a', pin: '1111' }, NOW);
    const gone = await createProfile({ nickname: 'Gone', avatarId: 'a', pin: '2222' }, NOW);
    const at = NOW.toISOString();
    const workspace = { blocks: { languageVersion: 0 as const, blocks: [] } };
    const pid = gone.id;
    await saveProgress(
      pid,
      {
        levelId: 'w01-l01',
        bestStars: 3,
        bestBlocks: 4,
        completedAt: at,
        firstTryWin: true,
        attempts: 1,
      },
      NOW,
    );
    await saveDraft(pid, 'w01-l02', workspace, NOW);
    await markLessonDone(pid, 'w01-lesson', [], NOW);
    await saveAttempt(
      {
        id: 'a1',
        profileId: pid,
        levelId: 'w01-l01',
        startedAt: at,
        endedAt: at,
        runs: [],
        hintTiersBought: [],
        won: false,
      },
      NOW,
    );
    await db.inventory.add({ profileId: pid, itemId: 'skin-red', equipped: true, at });
    await db.badges.add({ profileId: pid, badgeId: 'first-run', at });
    await db.creations.add({ profileId: pid, levelId: 'free-1', workspace, title: 'Nhà' });

    await deleteProfile(pid);

    expect((await listProfiles()).map((p) => p.id)).toEqual([keep.id]);
    for (const table of [
      db.lessons,
      db.progress,
      db.drafts,
      db.attempts,
      db.inventory,
      db.badges,
      db.creations,
    ]) {
      expect(await table.count(), table.name).toBe(0);
    }
    expect(await listLedger(pid)).toEqual([]);
    expect(await getBalance(keep.id)).toBe(30);
    expect((await listOutbox()).every((row) => row.payload.profileId === keep.id)).toBe(true);
  });

  it('never hands the PIN hash to callers', async () => {
    const created = await createProfile({ nickname: 'Na', avatarId: 'a', pin: '1111' }, NOW);
    expect(created).not.toHaveProperty('pinHash');
    expect(await getProfile(created.id)).not.toHaveProperty('pinHash');
    expect((await listProfiles())[0]).not.toHaveProperty('pinHash');
  });
});
