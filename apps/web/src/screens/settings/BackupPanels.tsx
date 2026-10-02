import { useRef, useState } from 'react';
import {
  backupFileName,
  exportBackup,
  MAX_BACKUP_BYTES,
  parseBackup,
  restoreBackup,
  serializeBackup,
} from '../../features/backup';
import { vi } from '../../i18n/vi';
import { Button } from '../../ui';

const t = vi.settings;

/** "Sao lưu tiến độ": downloads every profile on this laptop as one JSON file. */
export function BackupPanel() {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const download = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const now = new Date();
      const text = serializeBackup(await exportBackup(undefined, now));
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = backupFileName(now);
      link.click();
      // Let the click start the download before the URL goes away.
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section aria-labelledby="backup-title" className="grid gap-2">
      <h3 id="backup-title" className="m-0 text-button">
        {t.backupTitle}
      </h3>
      <p className="m-0 text-small text-ink-soft">{t.backupHelp}</p>
      <Button
        variant="coin"
        size="sm"
        disabled={busy}
        onClick={() => void download()}
        className="justify-self-start"
        data-testid="backup-download"
      >
        {t.backup}
      </Button>
      {failed && (
        <p role="alert" className="m-0 font-bold text-oops">
          {t.backupFailed}
        </p>
      )}
    </section>
  );
}

type RestoreMessage = { kind: 'ok' | 'error'; lines: string[] };

/**
 * "Khôi phục": merges a backup file into this laptop (data/backup.ts, never overwrites). A profile
 * whose nickname is taken by another local profile is skipped and listed for the coach.
 */
export function RestorePanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<RestoreMessage | null>(null);

  const restore = async (file: File) => {
    setBusy(true);
    setMessage(null);
    try {
      if (file.size > MAX_BACKUP_BYTES) {
        setMessage({ kind: 'error', lines: [t.restoreErrors['too-large']] });
        return;
      }
      const parsed = parseBackup(await file.text());
      if (!parsed.ok) {
        setMessage({ kind: 'error', lines: [t.restoreErrors[parsed.error]] });
        return;
      }
      const result = await restoreBackup(parsed.backup);
      setMessage({
        kind: 'ok',
        lines: [
          t.restored(result.restored.length),
          ...result.conflicts.map((c) => t.conflict(c.nickname)),
        ],
      });
    } catch {
      setMessage({ kind: 'error', lines: [t.restoreErrors.unknown] });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <section aria-labelledby="restore-title" className="grid gap-2">
      <h3 id="restore-title" className="m-0 text-button">
        {t.restoreTitle}
      </h3>
      <p className="m-0 text-small text-ink-soft">{t.restoreHelp}</p>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="restore-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void restore(file);
        }}
      />
      <Button
        size="sm"
        disabled={busy}
        className="justify-self-start"
        data-testid="restore-pick"
        onClick={() => inputRef.current?.click()}
      >
        {busy ? t.restoring : t.restore}
      </Button>
      <div role="status" data-testid="restore-message" className="grid gap-0.5">
        {message?.lines.map((line) => (
          <p
            key={line}
            className={`m-0 font-bold ${message.kind === 'error' ? 'text-oops' : 'text-go-deep'}`}
          >
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}
