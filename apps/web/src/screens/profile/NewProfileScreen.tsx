import { type KeyboardEvent, type SyntheticEvent, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  createProfile,
  NICKNAME_MAX_LENGTH,
  ProfileError,
  type ProfileErrorCode,
  useCurrentProfile,
  useProfiles,
} from '../../features/profiles';
import { vi } from '../../i18n/vi';
import { Avatar, AVATAR_IDS, type AvatarId, Bubble, Button, Panel } from '../../ui';
import { FOCUS_RING } from '../../ui/focusRing';
import { MangPortrait } from '../play/MangPortrait';
import { DevLinks } from '../shared/DevLinks';
import { PinPad } from './PinPad';

const t = vi.newProfile;

type Step = 'avatar' | 'nickname' | 'pin' | 'pin-again';
const STEP_NUMBER: Record<Step, number> = { avatar: 1, nickname: 2, pin: 3, 'pin-again': 3 };

const AVATAR_OPTION = [
  'grid size-[104px] cursor-pointer place-items-center rounded-chip border-3 border-ink bg-paper shadow-key',
  'transition-[transform,box-shadow,background-color] duration-150 ease-bounce hover:-translate-y-px',
  'aria-checked:translate-y-0.5 aria-checked:bg-coin aria-checked:shadow-button-pressed',
  FOCUS_RING,
].join(' ');

/** "/profile/new": 1 avatar → 2 nickname (≤ 12 letters) → 3 PIN, entered twice. */
export default function NewProfileScreen() {
  const navigate = useNavigate();
  const { select } = useCurrentProfile();
  const profiles = useProfiles();
  const [step, setStep] = useState<Step>('avatar');
  const [avatarId, setAvatarId] = useState<AvatarId>('panda');
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<ProfileErrorCode | 'unknown' | 'mismatch' | null>(null);
  const avatarRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const hasProfiles = (profiles?.length ?? 0) > 0;

  const onAvatarKey = (event: KeyboardEvent, index: number) => {
    const cols = 6;
    const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const next = (index + delta + AVATAR_IDS.length) % AVATAR_IDS.length;
    const id = AVATAR_IDS[next];
    if (id === undefined) return;
    setAvatarId(id);
    avatarRefs.current[next]?.focus();
  };

  const submitNickname = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = nickname.trim();
    if (trimmed === '') {
      setError('nickname-empty');
      return;
    }
    if (
      [...new Intl.Segmenter('vi', { granularity: 'grapheme' }).segment(trimmed)].length >
      NICKNAME_MAX_LENGTH
    ) {
      setError('nickname-too-long');
      return;
    }
    setError(null);
    setStep('pin');
  };

  const create = async (confirmed: string): Promise<boolean> => {
    if (confirmed !== pin) {
      setError('mismatch');
      setPin('');
      setStep('pin');
      return false;
    }
    try {
      const profile = await createProfile({ nickname, avatarId, pin });
      select(profile.id);
      void navigate('/map');
      return true;
    } catch (caught) {
      const code = caught instanceof ProfileError ? caught.code : 'unknown';
      setError(code);
      setPin('');
      setStep(code.startsWith('nickname') ? 'nickname' : 'pin');
      return false;
    }
  };

  const message = error === null ? null : error === 'mismatch' ? t.pinMismatch : t.errors[error];
  const mangLine = {
    avatar: t.avatarMang,
    nickname: t.nicknameTitle,
    pin: t.pinTitle,
    'pin-again': t.pinAgainTitle,
  }[step];

  return (
    <main className="cq-sky grid min-h-screen content-center justify-items-center gap-4 px-6 py-4">
      <Panel
        as="section"
        aria-labelledby="new-profile-title"
        className="grid w-[min(880px,100%)] gap-5 px-10 pt-6 pb-7"
      >
        <header className="flex items-center justify-between gap-4">
          <h1 id="new-profile-title" className="m-0 text-title">
            {t.title}
          </h1>
          <span className="rounded-chip border-3 border-ink bg-brand-deep px-3 pt-1 font-pixel text-pixel text-paper">
            {t.stepOf(STEP_NUMBER[step])}
          </span>
        </header>

        <div className="flex items-end gap-4">
          <MangPortrait pose="talk" height={84} />
          <Bubble text={mangLine} tail="left" />
        </div>

        {step === 'avatar' && (
          <>
            <h2 className="m-0 text-title">{t.avatarTitle}</h2>
            <div
              role="radiogroup"
              aria-label={t.avatarGroup}
              className="grid grid-cols-6 justify-items-center gap-4"
            >
              {AVATAR_IDS.map((id, index) => (
                <button
                  key={id}
                  ref={(el) => {
                    avatarRefs.current[index] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={avatarId === id}
                  aria-label={vi.avatars[id]}
                  tabIndex={avatarId === id ? 0 : -1}
                  data-avatar-option={id}
                  className={AVATAR_OPTION}
                  onKeyDown={(event) => {
                    onAvatarKey(event, index);
                  }}
                  onClick={() => {
                    setAvatarId(id);
                  }}
                >
                  <Avatar id={id} scale={5} />
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              {hasProfiles ? (
                <Button onClick={() => void navigate('/')}>{t.cancel}</Button>
              ) : (
                <span />
              )}
              <Button
                variant="go"
                size="md"
                iconAfter="→"
                onClick={() => {
                  setStep('nickname');
                }}
              >
                {t.next}
              </Button>
            </div>
          </>
        )}

        {step === 'nickname' && (
          <form onSubmit={submitNickname} className="grid gap-4" noValidate>
            <div className="flex items-center gap-5">
              <span className="grid size-28 shrink-0 place-items-center rounded-chip border-3 border-ink bg-brand-soft">
                <Avatar id={avatarId} scale={6} />
              </span>
              <label className="grid flex-1 gap-2">
                <span className="font-display text-button font-extrabold">{t.nicknameLabel}</span>
                <input
                  autoFocus
                  value={nickname}
                  maxLength={24}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={error !== null}
                  aria-describedby="nickname-help"
                  onChange={(event) => {
                    setNickname(event.target.value);
                  }}
                  className="h-16 rounded-button border-3 border-ink bg-white px-4 font-display text-[30px] font-extrabold shadow-key outline-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-brand-deep"
                />
                <span id="nickname-help" className="text-small text-ink-soft">
                  {t.nicknameHelp}
                </span>
              </label>
            </div>
            <p role="alert" className="m-0 min-h-7 font-bold text-oops">
              {message ?? ''}
            </p>
            <div className="flex justify-between">
              <Button
                icon="←"
                onClick={() => {
                  setError(null);
                  setStep('avatar');
                }}
              >
                {t.back}
              </Button>
              <Button type="submit" variant="go" size="md" iconAfter="→">
                {t.next}
              </Button>
            </div>
          </form>
        )}

        {(step === 'pin' || step === 'pin-again') && (
          <div className="grid gap-2">
            <p className="m-0 text-center text-ink-soft">
              {step === 'pin' ? t.pinHelp : t.pinAgainHelp}
            </p>
            <PinPad
              key={step}
              autoFocus
              {...(message !== null && { message })}
              onComplete={(entered) => {
                if (step === 'pin') {
                  setPin(entered);
                  setError(null);
                  setStep('pin-again');
                  return true;
                }
                return create(entered);
              }}
            />
            <div className="flex justify-start">
              <Button
                icon="←"
                onClick={() => {
                  setError(null);
                  setPin('');
                  setStep('nickname');
                }}
              >
                {t.back}
              </Button>
            </div>
          </div>
        )}
      </Panel>
      {!hasProfiles && (
        <Link
          to="/restore"
          className={`rounded-key px-2 text-small font-bold text-ink-soft underline ${FOCUS_RING}`}
        >
          {vi.profiles.restore}
        </Link>
      )}
      <DevLinks />
    </main>
  );
}
