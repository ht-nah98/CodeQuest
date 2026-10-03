import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCurrentProfile, useSignedInProfile } from '../../features/profiles';
import { useCoinBalance, useStreakDays, useTotalStars } from '../../features/progress';
import { vi } from '../../i18n/vi';
import { Avatar, Button, Hud, PixelIcon } from '../../ui';
import { FOCUS_RING } from '../../ui/focusRing';
import { CoachBadge } from './CoachBadge';

export interface TopBarProps {
  /** Back button (label + route); omitted on the map, the hub of the app. */
  back?: { label: string; to: string };
  /** Middle of the bar (screen title). */
  children?: ReactNode;
  /** Show the stars and streak counters too (map); coins are always shown. */
  fullHud?: boolean;
}

const CHIP = [
  'shrink-0 cursor-pointer rounded-key border-3 border-ink bg-paper',
  'shadow-key transition-[transform,box-shadow] duration-150 ease-bounce',
  'hover:-translate-y-px active:translate-y-0.5 active:shadow-button-pressed',
  FOCUS_RING,
].join(' ');

const ICON_BUTTON = [
  'grid size-11 shrink-0 cursor-pointer place-items-center rounded-key border-3 border-ink bg-paper',
  'shadow-key transition-[transform,box-shadow] duration-150 ease-bounce',
  'hover:-translate-y-px active:translate-y-0.5 active:shadow-button-pressed',
  FOCUS_RING,
].join(' ');

/**
 * Dark lavender bar of every screen after sign-in (style board "Thanh trên màn chơi"): back,
 * title, live coin HUD (`data-hud-coins` is where results coins fly to), settings, who is playing.
 */
export function TopBar({ back, children, fullHud = false }: TopBarProps) {
  const profile = useSignedInProfile();
  const navigate = useNavigate();
  const { signOut } = useCurrentProfile();
  const coins = useCoinBalance(profile.id) ?? 0;
  const stars = useTotalStars(profile.id);
  const streak = useStreakDays(profile.id);

  return (
    <header className="flex min-h-16 min-w-0 items-center gap-4 rounded-panel border-3 border-ink bg-brand-deep px-3 py-2 text-paper shadow-hard">
      {back && (
        <Button
          size="sm"
          icon="←"
          onClick={() => {
            void navigate(back.to);
          }}
        >
          {back.label}
        </Button>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      <div data-hud-coins="">
        <Hud
          coins={coins}
          {...(fullHud && stars !== undefined && { stars })}
          {...(fullHud && streak !== undefined && streak > 0 && { streakDays: streak })}
        />
      </div>
      <Link
        to="/settings"
        aria-label={vi.topBar.settings}
        title={vi.topBar.settings}
        className={ICON_BUTTON}
      >
        <PixelIcon name="gear" scale={2} />
      </Link>
      <Link
        to="/"
        aria-label={`${vi.topBar.switchProfile}: ${profile.nickname}`}
        title={vi.topBar.switchProfile}
        className={`${CHIP} flex h-11 items-center gap-2 pr-3 pl-1`}
        data-testid="switch-profile"
        // Signing out here: "Back" from the picker must not land on this child's map unlocked.
        onClick={signOut}
      >
        <Avatar id={profile.avatarId} scale={2} />
        <span className="max-w-[9ch] truncate font-display text-body font-extrabold text-ink">
          {profile.nickname}
        </span>
        {profile.role === 'coach' && <CoachBadge />}
      </Link>
    </header>
  );
}
