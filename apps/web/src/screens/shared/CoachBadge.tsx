import { vi } from '../../i18n/vi';

/** Small "HLV" tag on the coach review profile (picker tile and top bar). */
export function CoachBadge() {
  return (
    <span
      data-testid="coach-badge"
      className="rounded-key border-2 border-ink bg-coin px-1.5 text-small leading-5 font-extrabold text-ink"
    >
      {vi.topBar.coachBadge}
    </span>
  );
}
