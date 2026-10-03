import Dexie, { type Table, type Transaction } from 'dexie';
import type { RunSummary, WorkspaceJson } from '@codequest/content-schema';
import type { HintTier, LedgerEntry, LevelProgress } from '@codequest/rewards';

// Local IndexedDB schema: docs/architecture/data-sync-auth.md §2 (source of truth).
// Components never touch this module; they go through data/repos/* or features/*.

export const DB_NAME = 'codequest';

export interface ProfileSettings {
  /** 0..1 */
  musicVolume: number;
  /** 0..1 */
  sfxVolume: number;
  /** 0..1 */
  voiceVolume: number;
  reducedMotion: boolean;
  colorBlindTheme: boolean;
}

/** One child on this laptop. Local only: never pushed to the outbox (the PIN hash stays here). */
export interface ProfileRow {
  id: string;
  nickname: string;
  avatarId: string;
  /** `pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>`, see data/pin.ts. */
  pinHash: string;
  settings: ProfileSettings;
  /** Set when the device is paired to a Supabase student (phase 2). */
  remoteStudentId?: string;
  /** ISO */
  createdAt: string;
}

export interface LessonRow {
  profileId: string;
  lessonId: string;
  /** ISO */
  completedAt: string;
}

export interface ProgressRow extends LevelProgress {
  profileId: string;
  /** ISO, device clock; informative only (merging never reads it). */
  updatedAt: string;
}

/** Unfinished workspace of a level. Local only. */
export interface DraftRow {
  profileId: string;
  levelId: string;
  workspace: WorkspaceJson;
  /** ISO */
  updatedAt: string;
}

/**
 * A level being written in the level editor (/coach/editor, P2-07). Local only, never synced
 * or backed up: the exported JSON file is what goes into content/.
 */
export interface LevelDraftRow {
  /** Random key of the draft (the level id can change while editing). */
  key: string;
  /** `level.id` when last saved, for the list. */
  levelId: string;
  /** The draft level (may not pass validation yet). */
  level: unknown;
  /** ISO */
  updatedAt: string;
}

export interface AttemptRow {
  /** uuid */
  id: string;
  profileId: string;
  levelId: string;
  /** ISO */
  startedAt: string;
  /** ISO. Always set: only finished sessions are stored (write-once, see repos/attempts.ts). */
  endedAt: string;
  runs: RunSummary[];
  hintTiersBought: HintTier[];
  won: boolean;
}

export type LedgerRow = LedgerEntry;

export interface InventoryRow {
  profileId: string;
  itemId: string;
  equipped: boolean;
  /** ISO */
  at: string;
}

export interface BadgeRow {
  profileId: string;
  badgeId: string;
  /** ISO */
  at: string;
}

export interface CreationRow {
  profileId: string;
  levelId: string;
  workspace: WorkspaceJson;
  title: string;
  /** ISO */
  sharedAt?: string;
}

/** Tables mirrored to Supabase in phase 2; only their writes go to the outbox. */
export interface SyncedRows {
  lessons: LessonRow;
  progress: ProgressRow;
  attempts: AttemptRow;
  ledger: LedgerRow;
  inventory: InventoryRow;
  badges: BadgeRow;
  creations: CreationRow;
}
export type SyncedTable = keyof SyncedRows;

export interface OutboxRow {
  /** Auto-increment; absent before insert. */
  seq?: number;
  table: SyncedTable;
  payload: SyncedRows[SyncedTable];
  /** ISO */
  createdAt: string;
  tries: number;
}

export interface MetaRow {
  key: string;
  value: unknown;
}

export type CodeQuestDb = Dexie & {
  profiles: Table<ProfileRow, string>;
  lessons: Table<LessonRow, [string, string]>;
  progress: Table<ProgressRow, [string, string]>;
  drafts: Table<DraftRow, [string, string]>;
  attempts: Table<AttemptRow, string>;
  ledger: Table<LedgerRow, [string, string]>;
  inventory: Table<InventoryRow, [string, string]>;
  badges: Table<BadgeRow, [string, string]>;
  creations: Table<CreationRow, [string, string]>;
  outbox: Table<OutboxRow, number>;
  meta: Table<MetaRow, string>;
  levelDrafts: Table<LevelDraftRow, string>;
};

export interface SchemaVersion {
  version: number;
  /** Dexie store specs; only tables that change need to be listed after version 1. */
  stores: Record<string, string | null>;
  /**
   * Rewrites rows for this version. Await only Dexie promises (table/collection calls) inside:
   * awaiting fetch, WebCrypto or timers lets the IndexedDB transaction auto-commit midway.
   */
  upgrade?: (tx: Transaction) => Promise<void>;
}

/**
 * Append-only list of schema versions. To change the schema, add a new entry (never edit an
 * old one) and, if rows need rewriting, an `upgrade` function. data/db.test.ts shows the path.
 */
export const SCHEMA_VERSIONS: readonly SchemaVersion[] = [
  {
    version: 1,
    stores: {
      profiles: 'id',
      lessons: '[profileId+lessonId], profileId',
      progress: '[profileId+levelId], profileId',
      drafts: '[profileId+levelId], profileId',
      attempts: 'id, profileId, [profileId+levelId]',
      ledger: '[profileId+id], profileId',
      inventory: '[profileId+itemId], profileId',
      badges: '[profileId+badgeId], profileId',
      creations: '[profileId+levelId], profileId',
      outbox: '++seq, table',
      meta: 'key',
    },
  },
  // P2-07: level editor drafts (local only).
  { version: 2, stores: { levelDrafts: 'key, updatedAt' } },
];

/** Builds a Dexie instance; it opens lazily on first use. Tests pass their own versions. */
export interface CreateDbOptions {
  /**
   * Called after this connection closed because another tab opened a newer schema version.
   * The app reloads so it picks up the new code; without this the other tab's upgrade is blocked.
   */
  onVersionChange?: () => void;
}

export function createDb(
  name: string = DB_NAME,
  versions: readonly SchemaVersion[] = SCHEMA_VERSIONS,
  options: CreateDbOptions = {},
): CodeQuestDb {
  const db = new Dexie(name) as CodeQuestDb;
  db.on('versionchange', () => {
    db.close();
    options.onVersionChange?.();
    return false;
  });
  for (const { version, stores, upgrade } of versions) {
    const dexieVersion = db.version(version).stores(stores);
    dexieVersion.upgrade(async (tx) => {
      if (upgrade) await upgrade(tx);
      await tx.table<MetaRow, string>('meta').put({ key: 'schemaVersion', value: version });
    });
  }
  const latest = versions.reduce((max, v) => Math.max(max, v.version), 0);
  db.on('populate', (tx) => {
    void tx.table<MetaRow, string>('meta').put({ key: 'schemaVersion', value: latest });
  });
  return db;
}

/** The app's database. */
export const db = createDb(DB_NAME, SCHEMA_VERSIONS, {
  onVersionChange: () => {
    window.location.reload();
  },
});
