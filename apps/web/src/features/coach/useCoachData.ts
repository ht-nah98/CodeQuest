import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo, useState } from 'react';
import { listUnlockOverrides, setUnlockOverride } from '../../data/repos/unlockOverrides';
import { type ChildData, mergeChildren } from './metrics';
import { localSource, readBackupFile } from './sources';

export interface LoadedFile {
  name: string;
  children: ChildData[];
}

export type FileErrorCode =
  'too-large' | 'not-json' | 'not-backup' | 'newer-version' | 'invalid' | 'unknown';

export interface CoachData {
  /** null while the laptop's profiles load. */
  local: ChildData[] | null;
  files: LoadedFile[];
  /** Local first, then files; a child in several sources appears once. */
  children: ChildData[] | null;
  fileErrors: { name: string; error: FileErrorCode }[];
  openFiles: (files: readonly File[]) => Promise<void>;
  removeFile: (name: string) => void;
}

/** The coach corner's children: this laptop (live) plus backup files kept in memory only. */
export function useCoachData(): CoachData {
  const local = useLiveQuery(() => localSource.load(), []) ?? null;
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [fileErrors, setFileErrors] = useState<CoachData['fileErrors']>([]);

  const openFiles = useCallback(async (picked: readonly File[]) => {
    const loaded: LoadedFile[] = [];
    const errors: CoachData['fileErrors'] = [];
    for (const file of picked) {
      try {
        const result = await readBackupFile(file);
        if (result.ok) loaded.push({ name: file.name, children: result.children });
        else errors.push({ name: file.name, error: result.error });
      } catch {
        errors.push({ name: file.name, error: 'unknown' });
      }
    }
    // Opening a file with the same name again replaces it.
    setFiles((current) => [
      ...current.filter((f) => !loaded.some((l) => l.name === f.name)),
      ...loaded,
    ]);
    setFileErrors(errors);
  }, []);

  const removeFile = useCallback((name: string) => {
    setFiles((current) => current.filter((f) => f.name !== name));
  }, []);

  const children = useMemo(
    () => (local === null ? null : mergeChildren([...local, ...files.flatMap((f) => f.children)])),
    [local, files],
  );

  return { local, files, children, fileErrors, openFiles, removeFile };
}

/** Ids the coach opened by hand for a profile on this laptop (live); empty for `null`. */
export function useManualUnlocks(profileId: string | null): {
  ids: Set<string>;
  set: (targetId: string, open: boolean) => Promise<void>;
} {
  const rows = useLiveQuery(
    async () => (profileId === null ? [] : listUnlockOverrides(profileId)),
    [profileId],
  );
  const ids = useMemo(() => new Set((rows ?? []).map((r) => r.targetId)), [rows]);
  const set = useCallback(
    async (targetId: string, open: boolean) => {
      if (profileId !== null) await setUnlockOverride(profileId, targetId, open);
    },
    [profileId],
  );
  return { ids, set };
}
