import { useLeanbotLinks } from '../../features/leanbot/leanbotCourse';
import { vi } from '../../i18n/vi';
import { Panel } from '../../ui';
import { ScreenMessage } from '../shared/ScreenMessage';
import { TopBar } from '../shared/TopBar';
import { LeanbotLinkList } from './LeanbotLinkList';

const t = vi.leanbot;

/** "/leanbot/duong-dan" Every page the course sends people to, in groups. */
export default function LeanbotLinksScreen() {
  const { page, failed } = useLeanbotLinks();

  if (failed) return <ScreenMessage text={t.loadError} alert />;
  if (!page) return <ScreenMessage text={t.loading} />;

  return (
    <main className="min-h-dvh bg-ground">
      <TopBar back={{ label: t.title, to: '/leanbot' }}>
        <h1 className="m-0 truncate font-display text-[28px] text-paper">{page.title}</h1>
      </TopBar>

      <div className="mx-auto grid max-w-[860px] gap-4 p-4 pb-16">
        {page.groups.map((group) => (
          <Panel key={group.title} className="grid gap-3 p-4">
            <h2 className="m-0 font-display text-[24px] leading-tight">{group.title}</h2>
            {group.note !== undefined && <p className="m-0 text-sm opacity-80">{group.note}</p>}
            <LeanbotLinkList links={group.links} />
          </Panel>
        ))}
      </div>
    </main>
  );
}
