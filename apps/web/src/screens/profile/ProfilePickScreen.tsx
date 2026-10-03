import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import {
  type ProfileSummary,
  useCurrentProfile,
  useProfiles,
  verifyPin,
} from '../../features/profiles';
import { vi } from '../../i18n/vi';
import { Avatar, Dialog } from '../../ui';
import { FOCUS_RING } from '../../ui/focusRing';
import { MangPortrait } from '../play/MangPortrait';
import { ScreenMessage } from '../shared/ScreenMessage';
import { DevLinks } from '../shared/DevLinks';
import { CoachBadge } from '../shared/CoachBadge';
import { PinPad } from './PinPad';

const t = vi.profiles;

const TILE = [
  'group grid w-44 cursor-pointer justify-items-center gap-2 rounded-panel border-3 border-ink bg-paper px-3 pt-4 pb-3',
  'shadow-hard transition-[transform,box-shadow] duration-150 ease-bounce',
  'hover:-translate-y-1 hover:shadow-[0_10px_0_var(--color-ink)] active:translate-y-1 active:shadow-button-pressed',
  FOCUS_RING,
].join(' ');

/** "/" Chọn hồ sơ: avatar grid (no reading needed), then the 4-digit PIN. */
export default function ProfilePickScreen() {
  const profiles = useProfiles();
  const { select, signOut } = useCurrentProfile();
  // Whoever played before is signed out on this screen: another child picks with their PIN,
  // and the browser's Back cannot return to the previous child's map.
  useEffect(() => {
    signOut();
  }, [signOut]);
  const navigate = useNavigate();
  const [picked, setPicked] = useState<ProfileSummary | null>(null);
  const [wrong, setWrong] = useState(false);

  if (profiles === undefined) return <ScreenMessage text={t.loading} />;
  // First run on this laptop: straight to creating a profile.
  if (profiles.length === 0) return <Navigate to="/profile/new" replace />;

  const close = () => {
    setPicked(null);
    setWrong(false);
  };

  return (
    <main className="cq-sky grid min-h-screen content-center justify-items-center gap-8 px-6 py-10">
      <div className="flex items-end gap-4">
        <MangPortrait pose="talk" height={112} />
        <h1 className="m-0 rounded-bubble border-3 border-ink bg-white px-6 py-3 text-display shadow-bubble">
          {t.title}
        </h1>
      </div>

      <ul className="m-0 flex max-w-[1100px] list-none flex-wrap justify-center gap-6 p-0">
        {profiles.map((profile) => (
          <li key={profile.id}>
            <button
              type="button"
              className={TILE}
              data-testid={profile.role === 'coach' ? 'coach-tile' : 'profile-tile'}
              onClick={() => {
                setWrong(false);
                setPicked(profile);
              }}
            >
              <span className="grid size-28 place-items-center rounded-chip border-3 border-ink bg-brand-soft">
                <Avatar id={profile.avatarId} scale={6} />
              </span>
              <span className="max-w-full truncate font-display text-[26px] font-extrabold">
                {profile.nickname}
              </span>
              {profile.role === 'coach' && <CoachBadge />}
            </button>
          </li>
        ))}
        <li>
          <Link to="/profile/new" className={`${TILE} h-full content-center`} aria-label={t.add}>
            <span
              aria-hidden="true"
              className="grid size-28 place-items-center rounded-chip border-3 border-dashed border-ink-soft font-display text-[72px] leading-none font-extrabold text-ink-soft"
            >
              +
            </span>
            <span className="font-display text-button font-extrabold text-ink-soft">{t.add}</span>
          </Link>
        </li>
      </ul>

      <Link
        to="/restore"
        className={`rounded-key px-2 text-small font-bold text-ink-soft underline ${FOCUS_RING}`}
      >
        {t.restore}
      </Link>

      {picked && (
        <Dialog
          title={t.pinTitle(picked.nickname)}
          onClose={close}
          className="grid w-[420px] justify-items-center gap-4 px-8 pt-6 pb-8"
          data-testid="pin-dialog"
        >
          <div className="flex items-center gap-3">
            <Avatar id={picked.avatarId} scale={4} />
            <p className="m-0 text-bubble font-bold">{t.pinPrompt}</p>
          </div>
          <PinPad
            autoFocus
            {...(wrong && { message: t.pinWrong })}
            onComplete={async (pin) => {
              const ok = await verifyPin(picked.id, pin);
              setWrong(!ok);
              if (ok) {
                select(picked.id);
                void navigate('/map');
              }
              return ok;
            }}
          />
        </Dialog>
      )}
      <DevLinks />
    </main>
  );
}
