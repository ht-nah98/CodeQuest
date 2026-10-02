// Backup / restore of the laptop's profiles (data-sync-auth.md §2 "File sao lưu").
export {
  backupFileName,
  exportBackup,
  MAX_BACKUP_BYTES,
  parseBackup,
  restoreBackup,
  serializeBackup,
} from '../../data/backup';
export type { ParseBackupResult, RestoreConflict, RestoreResult } from '../../data/backup';
