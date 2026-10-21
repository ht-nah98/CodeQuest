import { Link } from 'react-router';
import { useSignedInProfile } from '../../features/profiles';
import { vi } from '../../i18n/vi';
import { Panel, PixelIcon } from '../../ui';
import { FOCUS_RING } from '../../ui/focusRing';
import { MangPortrait } from '../play/MangPortrait';
import { TopBar } from '../shared/TopBar';

const t = vi.hub;

// Two courses, one account (ADR-0028). This screen exists so neither course is nested inside
// the other: a child signs in once and picks where to go.
const CARD = [
  'grid gap-2 rounded-panel border-3 border-ink bg-paper p-5 no-underline',
  'shadow-hard transition-[transform,box-shadow] duration-150 ease-bounce',
  'hover:-translate-y-1 active:translate-y-0.5 active:shadow-button-pressed',
  FOCUS_RING,
].join(' ');

/** "/hub" Chọn nơi học: Leanbot (robot thật) hoặc CodeQuest (tư duy). */
export default function HubScreen() {
  const profile = useSignedInProfile();

  return (
    <main className="min-h-dvh bg-ground">
      <TopBar>
        <h1 className="m-0 truncate font-display text-[28px] text-paper">{t.title}</h1>
      </TopBar>

      <div className="mx-auto grid max-w-[860px] gap-5 p-4 pb-16">
        <div className="flex items-end gap-4">
          <MangPortrait pose="talk" height={110} />
          <Panel className="mb-4 p-4">
            <p className="m-0 text-bubble font-bold">{t.greeting(profile.nickname)}</p>
          </Panel>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link to="/leanbot" className={CARD}>
            <PixelIcon name="gear" scale={3} />
            <h2 className="m-0 font-display text-[26px]">{t.leanbot.title}</h2>
            <p className="m-0 font-bold">{t.leanbot.what}</p>
            <p className="m-0 text-sm opacity-70">{t.leanbot.need}</p>
          </Link>

          <Link to="/map" className={CARD}>
            <PixelIcon name="star" scale={3} />
            <h2 className="m-0 font-display text-[26px]">{t.codequest.title}</h2>
            <p className="m-0 font-bold">{t.codequest.what}</p>
            <p className="m-0 text-sm opacity-70">{t.codequest.need}</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
