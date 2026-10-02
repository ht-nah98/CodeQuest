import { starterEntry } from '@codequest/rewards';
import { db, type ProfileRow, type ProfileSettings } from '../db';
import { hashPin, isValidPin, verifyPinHash } from '../pin';
import { addLedgerEntries } from './ledger';

// Child profiles on this laptop (screens-and-flows.md "/profile/new"). Profiles are local only
// and never enter the outbox: in phase 2 the coach creates students on the server.

export const NICKNAME_MAX_LENGTH = 12;

export const DEFAULT_SETTINGS: ProfileSettings = {
  musicVolume: 0.8,
  sfxVolume: 0.8,
  voiceVolume: 0.8,
  reducedMotion: false,
  colorBlindTheme: false,
};

export type ProfileErrorCode =
  'nickname-empty' | 'nickname-too-long' | 'nickname-taken' | 'pin-invalid';

/** Validation failure; the UI maps `code` to Vietnamese copy. */
export class ProfileError extends Error {
  constructor(readonly code: ProfileErrorCode) {
    super(code);
    this.name = 'ProfileError';
  }
}

/** What the UI sees of a profile: everything but the PIN hash. */
export type ProfileSummary = Omit<ProfileRow, 'pinHash'>;

export function toSummary(row: ProfileRow): ProfileSummary {
  const { id, nickname, avatarId, settings, remoteStudentId, createdAt } = row;
  const summary: ProfileSummary = { id, nickname, avatarId, settings, createdAt };
  if (remoteStudentId !== undefined) summary.remoteStudentId = remoteStudentId;
  return summary;
}

export function normalizeNickname(nickname: string): string {
  return nickname.normalize('NFC').trim().replace(/\s+/g, ' ');
}

const graphemes = new Intl.Segmenter('vi', { granularity: 'grapheme' });

/** Visible characters, so a letter with tone marks counts once. */
function graphemeCount(text: string): number {
  return Array.from(graphemes.segment(text)).length;
}

/** Same key ⇒ same nickname on this laptop (case and spacing ignored). */
export function nicknameKey(nickname: string): string {
  return normalizeNickname(nickname).toLocaleLowerCase('vi');
}

/** True for an already-normalized nickname of 1..NICKNAME_MAX_LENGTH visible letters. */
export function isValidNickname(nickname: string): boolean {
  const count = graphemeCount(nickname);
  return nickname === normalizeNickname(nickname) && count >= 1 && count <= NICKNAME_MAX_LENGTH;
}

/** Oldest first, so the profile grid keeps a stable order. */
export async function listProfiles(): Promise<ProfileSummary[]> {
  const rows = await db.profiles.toArray();
  return rows
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
    .map(toSummary);
}

export async function getProfile(id: string): Promise<ProfileSummary | undefined> {
  const row = await db.profiles.get(id);
  return row && toSummary(row);
}

export interface NewProfile {
  nickname: string;
  avatarId: string;
  pin: string;
}

/** Creates the profile and its `starter` ledger line (30 coins) in one transaction. */
export async function createProfile(
  input: NewProfile,
  now: Date = new Date(),
): Promise<ProfileSummary> {
  const nickname = normalizeNickname(input.nickname);
  if (nickname === '') throw new ProfileError('nickname-empty');
  if (graphemeCount(nickname) > NICKNAME_MAX_LENGTH) throw new ProfileError('nickname-too-long');
  if (!isValidPin(input.pin)) throw new ProfileError('pin-invalid');
  // WebCrypto is not an IndexedDB operation: hash before the transaction or it would auto-commit.
  const pinHash = await hashPin(input.pin);
  const profile: ProfileRow = {
    id: crypto.randomUUID(),
    nickname,
    avatarId: input.avatarId,
    pinHash,
    settings: { ...DEFAULT_SETTINGS },
    createdAt: now.toISOString(),
  };
  await db.transaction('rw', db.profiles, db.ledger, db.outbox, async () => {
    const key = nicknameKey(nickname);
    const taken = await db.profiles.filter((p) => nicknameKey(p.nickname) === key).count();
    if (taken > 0) throw new ProfileError('nickname-taken');
    await db.profiles.add(profile);
    await addLedgerEntries([starterEntry(profile.id, now)], now);
  });
  return toSummary(profile);
}

export async function verifyPin(profileId: string, pin: string): Promise<boolean> {
  const profile = await db.profiles.get(profileId);
  return profile !== undefined && verifyPinHash(pin, profile.pinHash);
}

export async function changePin(profileId: string, pin: string): Promise<void> {
  if (!isValidPin(pin)) throw new ProfileError('pin-invalid');
  const pinHash = await hashPin(pin);
  await db.profiles.update(profileId, { pinHash });
}

export async function updateProfile(
  profileId: string,
  patch: { avatarId?: string; settings?: Partial<ProfileSettings> },
): Promise<void> {
  await db.transaction('rw', db.profiles, async () => {
    const profile = await db.profiles.get(profileId);
    if (!profile) return;
    await db.profiles.put({
      ...profile,
      avatarId: patch.avatarId ?? profile.avatarId,
      settings: { ...profile.settings, ...patch.settings },
    });
  });
}

/**
 * Removes the profile and every row it owns on this laptop, pending outbox lines included
 * ("Xóa hồ sơ trên máy này"). The caller checks the PIN and the 2-step confirmation first.
 */
export async function deleteProfile(profileId: string): Promise<void> {
  const owned = [
    db.lessons,
    db.progress,
    db.drafts,
    db.attempts,
    db.ledger,
    db.inventory,
    db.badges,
    db.creations,
  ];
  await db.transaction('rw', [db.profiles, db.outbox, ...owned], async () => {
    for (const table of owned) await table.where('profileId').equals(profileId).delete();
    await db.outbox.filter((row) => row.payload.profileId === profileId).delete();
    await db.profiles.delete(profileId);
  });
}
