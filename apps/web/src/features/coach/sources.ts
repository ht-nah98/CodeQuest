import {
  type Backup,
  MAX_BACKUP_BYTES,
  parseBackup,
  type ParseBackupResult,
} from '../../data/backup';
import { COACH_PROFILE_ID } from '../../data/db';
import { listAttempts } from '../../data/repos/attempts';
import { listLedger } from '../../data/repos/ledger';
import { listLessonsDone } from '../../data/repos/lessons';
import { listProfiles } from '../../data/repos/profiles';
import { listProgress } from '../../data/repos/progress';
import type { ChildData, ChildSource } from './metrics';

// Data sources of the coach corner (phase-2.md P2-05). Every source yields the same ChildData
// rows, so metrics.ts never knows where they came from. Backup files are read into memory only:
// nothing from them is written to this laptop (Cài đặt > Khôi phục does that, on purpose).
// Supabase becomes a third source in P2-16.

export interface CoachDataSource {
  source: ChildSource;
  load: () => Promise<ChildData[]>;
}

/** Every child profile on this laptop; the coach review profile is never a child. */
export const localSource: CoachDataSource = {
  source: { kind: 'local' },
  load: async () => {
    const profiles = (await listProfiles()).filter(
      (p) => p.role !== 'coach' && p.id !== COACH_PROFILE_ID,
    );
    return Promise.all(
      profiles.map(async (p) => {
        const [progress, attempts, ledger, lessons] = await Promise.all([
          listProgress(p.id),
          listAttempts(p.id),
          listLedger(p.id),
          listLessonsDone(p.id),
        ]);
        return {
          profileId: p.id,
          nickname: p.nickname,
          avatarId: p.avatarId,
          sources: [{ kind: 'local' } as const],
          progress,
          attempts,
          ledger,
          lessons,
        };
      }),
    );
  },
};

/** The children of a parsed backup; PIN hash, settings, drafts and items are left behind. */
export function childrenOfBackup(backup: Backup, name: string): ChildData[] {
  return backup.profiles
    .filter((p) => p.profile.id !== COACH_PROFILE_ID)
    .map((p) => ({
      profileId: p.profile.id,
      nickname: p.profile.nickname,
      avatarId: p.profile.avatarId,
      sources: [{ kind: 'file', name }],
      progress: p.progress,
      attempts: p.attempts,
      ledger: p.ledger,
      lessons: p.lessons,
    }));
}

export type BackupFileResult =
  | { ok: true; children: ChildData[] }
  | { ok: false; error: Extract<ParseBackupResult, { ok: false }>['error'] };

/** Reads one backup file (validated by parseBackup) into memory. */
export async function readBackupFile(file: File): Promise<BackupFileResult> {
  if (file.size > MAX_BACKUP_BYTES) return { ok: false, error: 'too-large' };
  const parsed = parseBackup(await file.text());
  return parsed.ok
    ? { ok: true, children: childrenOfBackup(parsed.backup, file.name) }
    : { ok: false, error: parsed.error };
}
