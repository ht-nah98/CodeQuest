import type { IndexableType, Table } from 'dexie';
import { z } from 'zod';
import { RunResultSchema, WorkspaceJsonSchema, type RunSummary } from '@codequest/content-schema';
import { localDay, type LedgerReason } from '@codequest/rewards';
import {
  db,
  type AttemptRow,
  type BadgeRow,
  type CreationRow,
  type DraftRow,
  type InventoryRow,
  type LedgerRow,
  type LessonRow,
  type ProfileRow,
  type ProfileSettings,
  type ProgressRow,
} from './db';
import { isWellFormedPinHash } from './pin';
import { addLedgerEntries } from './repos/ledger';
import { enqueue } from './repos/outbox';
import { saveProgress } from './repos/progress';
import { isValidNickname, nicknameKey } from './repos/profiles';

// "Sao lưu tiến độ" / "Khôi phục" (data-sync-auth.md §5, phase 1). A backup holds only what
// security-privacy.md §1 allows: nickname, avatar, PIN hash (never the PIN), settings and
// learning data. Outbox and meta (pairing) are device state and stay out.
// Restore merges with the same convergent rules as sync, so restoring twice, or onto a laptop
// that already has some of the data, never counts coins twice.

export const BACKUP_FORMAT = 'codequest-backup';
export const BACKUP_VERSION = 1;

/**
 * Largest backup text accepted (5 MB; a real one is a few hundred KB). parseBackup checks the
 * string length; callers should also check `File.size` before reading the file into memory.
 */
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

const isoDate = z.iso.datetime();
const id = z.string().min(1);

const LEDGER_REASONS: Record<LedgerReason, true> = {
  'level-clear': true,
  'star-2': true,
  'star-3': true,
  'first-try': true,
  lesson: true,
  daily: true,
  'streak-7': true,
  replay: true,
  creative: true,
  'group-goal': true,
  'hint-1': true,
  'hint-2': true,
  'hint-3': true,
  shop: true,
  'bonus-level': true,
  starter: true,
  'coach-adjust': true,
};

const SettingsSchema: z.ZodType<ProfileSettings> = z.object({
  musicVolume: z.number().min(0).max(1),
  sfxVolume: z.number().min(0).max(1),
  voiceVolume: z.number().min(0).max(1),
  reducedMotion: z.boolean(),
  colorBlindTheme: z.boolean(),
});

const ProfileSchema: z.ZodType<ProfileRow> = z.object({
  id,
  nickname: z.string().refine(isValidNickname, 'Nickname must be NFC, trimmed, 1–12 letters'),
  avatarId: id,
  pinHash: z.string().refine(isWellFormedPinHash, 'Malformed PIN hash'),
  settings: SettingsSchema,
  remoteStudentId: id.exactOptional(),
  createdAt: isoDate,
});

const LessonSchema: z.ZodType<LessonRow> = z.object({
  profileId: id,
  lessonId: id,
  completedAt: isoDate,
});

const ProgressSchema: z.ZodType<ProgressRow> = z.object({
  profileId: id,
  levelId: id,
  bestStars: z.literal([0, 1, 2, 3]),
  bestBlocks: z.number().int().nonnegative().nullable(),
  completedAt: isoDate.nullable(),
  firstTryWin: z.boolean(),
  attempts: z.number().int().nonnegative(),
  updatedAt: isoDate,
});

const DraftSchema: z.ZodType<DraftRow> = z.object({
  profileId: id,
  levelId: id,
  workspace: WorkspaceJsonSchema,
  updatedAt: isoDate,
});

const RunSummarySchema: z.ZodType<RunSummary> = z.object({
  runId: id,
  result: RunResultSchema,
  reasonCode: z.string().nullable(),
  blocksUsed: z.number().int().nonnegative(),
  edits: z.number().int().nonnegative().exactOptional(),
  predictChoice: z.string().exactOptional(),
});

const AttemptSchema: z.ZodType<AttemptRow> = z.object({
  id,
  profileId: id,
  levelId: id,
  startedAt: isoDate,
  endedAt: isoDate,
  runs: z.array(RunSummarySchema),
  hintTiersBought: z.array(z.literal([1, 2, 3])),
  won: z.boolean(),
});

const LedgerSchema: z.ZodType<LedgerRow> = z.object({
  id,
  profileId: id,
  delta: z.number().int(),
  reason: z.custom<LedgerReason>((v) => typeof v === 'string' && Object.hasOwn(LEDGER_REASONS, v)),
  refId: z.string().nullable(),
  at: isoDate,
  localDay: z.iso.date(),
});

const InventorySchema: z.ZodType<InventoryRow> = z.object({
  profileId: id,
  itemId: id,
  equipped: z.boolean(),
  at: isoDate,
});

const BadgeSchema: z.ZodType<BadgeRow> = z.object({
  profileId: id,
  badgeId: id,
  at: isoDate,
});

const CreationSchema: z.ZodType<CreationRow> = z.object({
  profileId: id,
  levelId: id,
  workspace: WorkspaceJsonSchema,
  title: z.string(),
  sharedAt: isoDate.exactOptional(),
});

export interface ProfileBackup {
  profile: ProfileRow;
  lessons: LessonRow[];
  progress: ProgressRow[];
  drafts: DraftRow[];
  attempts: AttemptRow[];
  ledger: LedgerRow[];
  inventory: InventoryRow[];
  badges: BadgeRow[];
  creations: CreationRow[];
}

export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  /** ISO */
  exportedAt: string;
  profiles: ProfileBackup[];
}

const OWNED_KEYS = [
  'lessons',
  'progress',
  'drafts',
  'attempts',
  'ledger',
  'inventory',
  'badges',
  'creations',
] as const satisfies readonly (keyof ProfileBackup)[];

const ProfileBackupSchema: z.ZodType<ProfileBackup> = z
  .object({
    profile: ProfileSchema,
    lessons: z.array(LessonSchema),
    progress: z.array(ProgressSchema),
    drafts: z.array(DraftSchema),
    attempts: z.array(AttemptSchema),
    ledger: z.array(LedgerSchema),
    inventory: z.array(InventorySchema),
    badges: z.array(BadgeSchema),
    creations: z.array(CreationSchema),
  })
  .refine(
    (backup) =>
      OWNED_KEYS.every((key) => backup[key].every((row) => row.profileId === backup.profile.id)),
    { message: 'Every row must belong to its profile' },
  );

const BackupSchema: z.ZodType<Backup> = z
  .object({
    format: z.literal(BACKUP_FORMAT),
    version: z.literal(BACKUP_VERSION),
    exportedAt: isoDate,
    profiles: z.array(ProfileBackupSchema),
  })
  .refine(
    (backup) => new Set(backup.profiles.map((p) => p.profile.id)).size === backup.profiles.length,
    { message: 'Duplicate profile id' },
  )
  .refine(
    (backup) =>
      new Set(backup.profiles.map((p) => nicknameKey(p.profile.nickname))).size ===
      backup.profiles.length,
    { message: 'Duplicate nickname' },
  );

const HeaderSchema = z.looseObject({ format: z.literal(BACKUP_FORMAT), version: z.number() });

export type ParseBackupResult =
  | { ok: true; backup: Backup }
  | { ok: false; error: 'too-large' | 'not-json' | 'not-backup' | 'newer-version' | 'invalid' };

/** Validates a backup file's text. Nothing from the file reaches the DB without this. */
export function parseBackup(text: string): ParseBackupResult {
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, error: 'too-large' };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'not-json' };
  }
  const header = HeaderSchema.safeParse(json);
  if (!header.success) return { ok: false, error: 'not-backup' };
  if (header.data.version > BACKUP_VERSION) return { ok: false, error: 'newer-version' };
  const parsed = BackupSchema.safeParse(json);
  return parsed.success ? { ok: true, backup: parsed.data } : { ok: false, error: 'invalid' };
}

/** Snapshot of the given profiles (all profiles on this laptop by default). */
export function exportBackup(
  profileIds?: readonly string[],
  now: Date = new Date(),
): Promise<Backup> {
  return db.transaction('r', db.tables, async () => {
    const profiles = profileIds
      ? (await db.profiles.bulkGet([...profileIds])).filter((p) => p !== undefined)
      : await db.profiles.toArray();
    const backups: ProfileBackup[] = [];
    for (const profile of profiles) {
      const owned = <T, K extends IndexableType>(table: Table<T, K>) =>
        table.where('profileId').equals(profile.id).toArray();
      backups.push({
        profile,
        lessons: await owned(db.lessons),
        progress: await owned(db.progress),
        drafts: await owned(db.drafts),
        attempts: await owned(db.attempts),
        ledger: await owned(db.ledger),
        inventory: await owned(db.inventory),
        badges: await owned(db.badges),
        creations: await owned(db.creations),
      });
    }
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: now.toISOString(),
      profiles: backups,
    };
  });
}

export function serializeBackup(backup: Backup): string {
  return JSON.stringify(backup);
}

/** File name for the download, e.g. `codequest-sao-luu-2026-10-02.json` (Vietnam day). */
export function backupFileName(now: Date = new Date()): string {
  return `codequest-sao-luu-${localDay(now)}.json`;
}

/** Adds the rows whose key is not stored yet and returns them; existing rows win. */
async function addMissing<T, K extends IndexableType>(
  table: Table<T, K>,
  rows: readonly T[],
  key: (row: T) => NoInfer<K>,
): Promise<T[]> {
  // A hand-edited file may repeat a row; keep the first so bulkAdd never sees a duplicate key.
  const seen = new Set<string>();
  const unique = rows.filter((row) => {
    const k = JSON.stringify(key(row));
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const existing = await table.bulkGet(unique.map(key));
  const fresh = unique.filter((_, i) => existing[i] === undefined);
  await table.bulkAdd(fresh);
  return fresh;
}

/** A backup profile skipped because another profile on this laptop has the same nickname. */
export interface RestoreConflict {
  profileId: string;
  nickname: string;
  existingProfileId: string;
}

export interface RestoreResult {
  restored: string[];
  conflicts: RestoreConflict[];
}

/**
 * Merges a parsed backup into the database in one transaction: profiles and append-only rows
 * are unioned (local copy wins on the same key), progress goes through mergeProgress, the newer
 * draft wins. Synced rows that are new here enter the outbox.
 * A backup profile whose nickname belongs to a *different* local profile is skipped with all
 * its rows and reported in `conflicts`, so the UI can ask the coach (no silent duplicates).
 */
export function restoreBackup(backup: Backup, now: Date = new Date()): Promise<RestoreResult> {
  return db.transaction('rw', db.tables, async () => {
    const result: RestoreResult = { restored: [], conflicts: [] };
    const local = await db.profiles.toArray();
    for (const data of backup.profiles) {
      const pid = data.profile.id;
      const key = nicknameKey(data.profile.nickname);
      const clash = local.find((p) => p.id !== pid && nicknameKey(p.nickname) === key);
      if (clash) {
        result.conflicts.push({
          profileId: pid,
          nickname: data.profile.nickname,
          existingProfileId: clash.id,
        });
        continue;
      }
      await addMissing(db.profiles, [data.profile], (p) => p.id);
      const pair = (other: string): [string, string] => [pid, other];

      for (const row of await addMissing(db.lessons, data.lessons, (r) => pair(r.lessonId))) {
        await enqueue('lessons', row, now);
      }
      for (const row of data.progress) await saveProgress(pid, row, now);
      for (const draft of data.drafts) {
        const stored = await db.drafts.get([pid, draft.levelId]);
        if (!stored || stored.updatedAt < draft.updatedAt) await db.drafts.put(draft);
      }
      // Attempts are write-once and always closed (endedAt required), so union is enough.
      for (const row of await addMissing(db.attempts, data.attempts, (r) => r.id)) {
        await enqueue('attempts', row, now);
      }
      await addLedgerEntries(data.ledger, now);
      for (const row of await addMissing(db.inventory, data.inventory, (r) => pair(r.itemId))) {
        await enqueue('inventory', row, now);
      }
      for (const row of await addMissing(db.badges, data.badges, (r) => pair(r.badgeId))) {
        await enqueue('badges', row, now);
      }
      for (const row of await addMissing(db.creations, data.creations, (r) => pair(r.levelId))) {
        await enqueue('creations', row, now);
      }
      result.restored.push(pid);
    }
    return result;
  });
}
