import { Link, Navigate } from 'react-router';
import type { LeanbotWorldLesson } from '@codequest/content-schema';
import { doneCount, useLeanbotWorld } from '../../features/leanbotWorld/course';
import { useSignedInProfile } from '../../features/profiles';
import { vi } from '../../i18n/vi';
import { PixelIcon } from '../../ui';
import { FOCUS_RING } from '../../ui/focusRing';
import { ScreenMessage } from '../shared/ScreenMessage';
import { TopBar } from '../shared/TopBar';

const t = vi.leanbotWorld;

const CARD = [
  'flex w-full items-center gap-4 rounded-panel border-3 border-ink bg-paper p-4 no-underline',
  'shadow-hard transition-[transform,box-shadow] duration-150 ease-bounce',
  'hover:-translate-y-px active:translate-y-0.5 active:shadow-button-pressed',
  FOCUS_RING,
].join(' ');

/** "/the-gioi-leanbot" The lessons of Thế giới Leanbot, by stage, and the Xưởng Phiên Dịch. */
export default function LeanbotWorldScreen() {
  const profile = useSignedInProfile();
  // Unfinished, so only the coach sees it (AGENTS.md §9.10).
  if (profile.role !== 'coach') return <Navigate to="/hub" replace />;
  return <LessonList />;
}

function LessonList() {
  const { lessons, failed } = useLeanbotWorld();
  if (failed) return <ScreenMessage text={t.loadError} alert />;
  if (!lessons) return <ScreenMessage text={t.loading} />;
  const stages = [...new Set(lessons.map((l) => l.stage))].sort((a, b) => a - b);

  return (
    <main className="min-h-dvh bg-ground">
      <TopBar back={{ label: vi.hub.title, to: '/hub' }}>
        <h1 className="m-0 truncate font-display text-[28px] text-paper">{t.title}</h1>
      </TopBar>
      <div className="mx-auto grid max-w-[860px] gap-4 p-4 pb-16">
        <p className="m-0 text-bubble font-bold">{t.intro}</p>
        <Link to="/xuong-phien-dich" className={CARD} data-testid="lbw-workshop">
          <PixelIcon name="gear" scale={2} />
          <span className="font-display text-[22px]">{t.workshop}</span>
        </Link>
        {stages.map((stage) => (
          <section key={stage} className="grid gap-3">
            <h2 className="m-0 font-display text-[24px]">
              {t.stage(stage)}: {t.stages[stage]}
            </h2>
            {lessons
              .filter((l) => l.stage === stage)
              .map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
          </section>
        ))}
      </div>
    </main>
  );
}

function LessonCard({ lesson }: { lesson: LeanbotWorldLesson }) {
  const done = doneCount(lesson);
  const all = lesson.screens.length;
  return (
    <Link to={`/the-gioi-leanbot/${lesson.id}/0`} className={CARD} data-lesson={lesson.id}>
      <span className="grid size-12 shrink-0 place-items-center rounded-key border-3 border-ink bg-coin font-display text-[22px]">
        {done === all ? '✓' : lesson.number}
      </span>
      <span className="grid flex-1 gap-1">
        <span className="font-display text-[22px] leading-tight">{lesson.title}</span>
        <span className="text-body">{lesson.canDo}</span>
      </span>
      <span className="shrink-0 text-sm font-bold tabular-nums opacity-70">
        {t.done(done, all)}
      </span>
    </Link>
  );
}
