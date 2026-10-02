import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  deleteProfile,
  type ProfileSettings,
  updateProfile,
  useCurrentProfile,
  useSignedInProfile,
  verifyPin,
} from '../../features/profiles';
import { vi } from '../../i18n/vi';
import { Avatar, AVATAR_IDS, Button, Dialog, Panel, PixelIcon } from '../../ui';
import { FOCUS_RING } from '../../ui/focusRing';
import { PinPad } from '../profile/PinPad';
import { TopBar } from '../shared/TopBar';
import { BackupPanel, RestorePanel } from './BackupPanels';

const t = vi.settings;

type VolumeKey = 'musicVolume' | 'sfxVolume' | 'voiceVolume';
type SwitchKey = 'reducedMotion' | 'colorBlindTheme';

/** "/settings" Cài đặt: sound, display, avatar; for adults: backup, restore, delete. */
export default function SettingsScreen() {
  const profile = useSignedInProfile();
  const { signOut } = useCurrentProfile();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState<'pin' | 'confirm' | null>(null);
  // The adults' tools (backup, restore, delete) open with the profile's PIN, once per visit.
  const [adultsOpen, setAdultsOpen] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [pinWrong, setPinWrong] = useState(false);

  const save = (patch: Partial<ProfileSettings>) => {
    void updateProfile(profile.id, { settings: patch });
  };

  return (
    <main className="grid min-h-screen grid-rows-[auto_minmax(0,1fr)] gap-3 bg-ground p-3">
      <TopBar back={{ label: vi.world.backToMap, to: '/map' }}>
        <h1 className="m-0 font-display text-[28px] text-paper">{t.title}</h1>
      </TopBar>

      <div className="grid min-h-0 grid-cols-2 items-start gap-3">
        <Panel as="section" aria-labelledby="settings-kid" className="grid gap-4 px-6 py-5">
          <h2 id="settings-kid" className="sr-only">
            {t.title}
          </h2>
          <Group title={t.sound}>
            {(
              [
                ['musicVolume', t.music],
                ['sfxVolume', t.sfx],
                ['voiceVolume', t.voice],
              ] as const satisfies ReadonlyArray<readonly [VolumeKey, string]>
            ).map(([key, label]) => (
              <label
                key={key}
                className="grid grid-cols-[140px_minmax(0,1fr)_56px] items-center gap-3"
              >
                <span className="font-bold">{label}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={10}
                  value={Math.round(profile.settings[key] * 100)}
                  onChange={(event) => {
                    save({ [key]: Number(event.target.value) / 100 });
                  }}
                  className="h-9 cursor-pointer accent-brand-deep"
                />
                <span aria-hidden="true" className="font-pixel text-pixel tabular-nums">
                  {Math.round(profile.settings[key] * 100)}
                </span>
              </label>
            ))}
          </Group>

          <Group title={t.display}>
            {(
              [
                ['reducedMotion', t.reducedMotion],
                ['colorBlindTheme', t.colorBlind],
              ] as const satisfies ReadonlyArray<readonly [SwitchKey, string]>
            ).map(([key, label]) => (
              <Switch
                key={key}
                label={label}
                checked={profile.settings[key]}
                onChange={(checked) => {
                  save({ [key]: checked });
                }}
              />
            ))}
          </Group>

          <Group title={t.avatar}>
            <div role="radiogroup" aria-label={t.avatar} className="grid grid-cols-6 gap-2">
              {AVATAR_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={profile.avatarId === id}
                  aria-label={vi.avatars[id]}
                  onClick={() => {
                    void updateProfile(profile.id, { avatarId: id });
                  }}
                  className={`grid h-16 cursor-pointer place-items-center rounded-chip border-3 border-ink bg-paper shadow-key transition-transform duration-150 hover:-translate-y-px aria-checked:translate-y-0.5 aria-checked:bg-coin aria-checked:shadow-button-pressed ${FOCUS_RING}`}
                >
                  <Avatar id={id} scale={3} />
                </button>
              ))}
            </div>
          </Group>
        </Panel>

        <Panel as="section" aria-labelledby="settings-adults" className="grid gap-4 px-6 py-5">
          <h2 id="settings-adults" className="m-0 flex items-center gap-2 text-title">
            <span className="rounded-kbd bg-brand-deep px-2 pt-0.5 font-pixel text-pixel-sm font-normal text-paper uppercase">
              {t.adults}
            </span>
          </h2>
          {adultsOpen ? (
            <>
              <BackupPanel />
              <RestorePanel />
              <section
                aria-labelledby="delete-title"
                className="grid gap-2 rounded-chip border-3 border-oops bg-oops-soft p-4"
              >
                <h3 id="delete-title" className="m-0 text-button">
                  {t.deleteTitle}
                </h3>
                <p className="m-0 text-small text-ink-soft">{t.deleteHelp}</p>
                <Button
                  size="sm"
                  className="justify-self-start"
                  onClick={() => {
                    setPinWrong(false);
                    setDeleting('pin');
                  }}
                >
                  {t.delete}
                </Button>
              </section>
            </>
          ) : (
            <div className="grid justify-items-start gap-3" data-testid="adults-locked">
              <p className="m-0 text-ink-soft">{t.adultsLocked}</p>
              <Button
                icon={<PixelIcon name="lock" scale={1} />}
                onClick={() => {
                  setPinWrong(false);
                  setUnlocking(true);
                }}
              >
                {t.adultsUnlock}
              </Button>
            </div>
          )}
        </Panel>
      </div>

      {unlocking && (
        <Dialog
          title={t.adultsPin}
          onClose={() => {
            setUnlocking(false);
          }}
          className="grid w-[420px] justify-items-center gap-4 px-8 pt-6 pb-8"
        >
          <PinPad
            autoFocus
            {...(pinWrong && { message: t.pinWrong })}
            onComplete={async (pin) => {
              const ok = await verifyPin(profile.id, pin);
              setPinWrong(!ok);
              if (ok) {
                setUnlocking(false);
                setAdultsOpen(true);
              }
              return ok;
            }}
          />
        </Dialog>
      )}
      {deleting === 'pin' && (
        <Dialog
          title={t.deletePin}
          onClose={() => {
            setDeleting(null);
          }}
          className="grid w-[420px] justify-items-center gap-4 px-8 pt-6 pb-8"
        >
          <PinPad
            autoFocus
            {...(pinWrong && { message: t.pinWrong })}
            onComplete={async (pin) => {
              const ok = await verifyPin(profile.id, pin);
              setPinWrong(!ok);
              if (ok) setDeleting('confirm');
              return ok;
            }}
          />
        </Dialog>
      )}
      {deleting === 'confirm' && (
        <Dialog
          title={t.deleteConfirm(profile.nickname)}
          onClose={() => {
            setDeleting(null);
          }}
          className="grid w-[480px] gap-5 px-8 pt-6 pb-8"
        >
          <p className="m-0">{t.deleteHelp}</p>
          {deleteFailed && (
            <p role="alert" className="m-0 font-bold text-oops">
              {t.deleteFailed}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="go"
              onClick={() => {
                setDeleting(null);
              }}
            >
              {t.deleteNo}
            </Button>
            <Button
              onClick={() => {
                setDeleteFailed(false);
                deleteProfile(profile.id).then(
                  () => {
                    signOut();
                    void navigate('/');
                  },
                  () => {
                    setDeleteFailed(true);
                  },
                );
              }}
              className="bg-oops"
            >
              {t.deleteYes}
            </Button>
          </div>
        </Dialog>
      )}
    </main>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 grid gap-3 border-0 p-0">
      <legend className="mb-2 p-0 font-display text-button font-extrabold">{title}</legend>
      {children}
    </fieldset>
  );
}

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        onChange(!checked);
      }}
      className={`flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-key px-1 text-left font-bold ${FOCUS_RING}`}
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className={`relative h-8 w-16 shrink-0 rounded-full border-3 border-ink transition-colors duration-150 ${checked ? 'bg-go' : 'bg-paper-2'}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full border-3 border-ink bg-white transition-[left] duration-150 ease-bounce ${checked ? 'left-8' : 'left-0.5'}`}
        />
      </span>
    </button>
  );
}
