import { Link } from 'react-router';
import { useLeanbotCourse } from '../../features/leanbot/leanbotCourse';
import { gateState, isLessonOpen } from '../../features/leanbot/leanbotGate';
import { vi } from '../../i18n/vi';
import { Panel } from '../../ui';
import { FOCUS_RING } from '../../ui/focusRing';
import { ScreenMessage } from '../shared/ScreenMessage';
import { TopBar } from '../shared/TopBar';

const t = vi.leanbot;

const CARD_BASE = 'flex w-full items-center gap-4 rounded-panel border-3 border-ink p-4';

const CARD = [
  CARD_BASE,
  'bg-paper no-underline shadow-hard transition-[transform,box-shadow] duration-150 ease-bounce',
  'hover:-translate-y-px active:translate-y-0.5 active:shadow-button-pressed',
  FOCUS_RING,
].join(' ');

/** A lesson still waiting for lesson 0: shown, named, but not a link. */
const CARD_LOCKED = `${CARD_BASE} bg-ground opacity-70`;

const FACTS: [label: string, value: string][] = [
  ['Hạng thi', 'Creator'],
  ['Tuổi', '9–12'],
  ['Mỗi lượt', '2 phút'],
  ['Sa bàn', '4ft × 4ft'],
];

/** "/leanbot" Danh sách bài của khóa Leanbot. */
export default function LeanbotScreen() {
  const { lessons, failed } = useLeanbotCourse();

  if (failed) return <ScreenMessage text={t.loadError} alert />;
  if (!lessons) return <ScreenMessage text={t.loading} />;

  const gate = gateState(lessons);

  return (
    <main className="min-h-dvh bg-ground">
      <TopBar back={{ label: vi.hub.title, to: '/hub' }}>
        <h1 className="m-0 truncate font-display text-[28px] text-paper">{t.title}</h1>
      </TopBar>

      <div className="mx-auto grid max-w-[860px] gap-4 p-4 pb-16">
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {FACTS.map(([label, value]) => (
            <li
              key={label}
              className="rounded-key border-3 border-ink bg-paper px-3 py-1 text-center"
            >
              <span className="block font-display text-[20px] leading-tight">{value}</span>
              <span className="text-xs opacity-70">{label}</span>
            </li>
          ))}
        </ul>

        {gate.total > 0 && (
          <Panel className="p-4">
            <p className="m-0 font-bold">
              {gate.open ? t.gateDone(gate.total) : t.lockedCount(gate.done, gate.total)}
            </p>
          </Panel>
        )}

        <ul className="m-0 grid list-none gap-3 p-0">
          {lessons.map((lesson) => {
            const open = isLessonOpen(lesson, gate);
            const body = (
              <>
                <span className="grid size-14 shrink-0 place-items-center rounded-key border-3 border-ink bg-brand-soft font-display text-[24px]">
                  {open ? lesson.number : '🔒'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[22px] leading-tight">
                    {lesson.title}
                  </span>
                  <span className="block text-sm opacity-70">
                    {open ? lesson.tagline : t.locked}
                  </span>
                </span>
                <span className="shrink-0 rounded-key border-3 border-ink bg-brand-soft px-2 py-1 text-sm font-bold">
                  {t.minutes(lesson.minutes)}
                </span>
              </>
            );
            return (
              <li key={lesson.id}>
                {open ? (
                  <Link to={`/leanbot/${lesson.id}/0`} className={CARD}>
                    {body}
                  </Link>
                ) : (
                  <div className={CARD_LOCKED} aria-disabled="true">
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <Panel className="p-4">
          <p className="m-0 text-sm">{t.moreSoon}</p>
        </Panel>
      </div>
    </main>
  );
}
