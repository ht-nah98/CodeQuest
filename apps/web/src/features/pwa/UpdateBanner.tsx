import { vi } from '../../i18n/vi';
import { Button } from '../../ui';
import { useAppUpdate } from './offline';

/**
 * "Có bản mới! · Tải lại" chip for the top bar of the map and the settings screen. Never on the
 * play or lesson screens: a new version must not interrupt a level (P2-09).
 */
export function UpdateBanner() {
  const { ready, apply } = useAppUpdate();
  if (!ready) return null;
  return (
    <div
      role="status"
      data-testid="update-banner"
      className="flex shrink-0 items-center gap-2 rounded-key border-3 border-ink bg-paper py-1 pr-1 pl-3 text-body font-bold text-ink shadow-key"
    >
      <span>{vi.update.ready}</span>
      <Button size="sm" variant="go" onClick={apply}>
        {vi.update.reload}
      </Button>
    </div>
  );
}
