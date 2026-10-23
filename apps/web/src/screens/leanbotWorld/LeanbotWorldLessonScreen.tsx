import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import type { LbwReadScreen, LeanbotWorldLesson } from '@codequest/content-schema';
import { programCode } from '@codequest/games';
import { LEANBOT_IMG } from '../../features/leanbot/leanbotCourse';
import {
  clampPage,
  isDone,
  markDone,
  pageCount,
  useLeanbotWorld,
} from '../../features/leanbotWorld/course';
import { useSignedInProfile } from '../../features/profiles';
import { CodeLines, copyText } from '../../features/workshop/LeanbotEditor';
import { LEANBOT_IDE_URL, setupWorkshopBlocks } from '../../features/workshop/workshopToolbox';
import { vi } from '../../i18n/vi';
import { Button, Panel } from '../../ui';
import { LeanbotEyebrow } from '../leanbot/LeanbotEyebrow';
import { LeanbotScreenView } from '../leanbot/LeanbotScreenView';
import { ScreenMessage } from '../shared/ScreenMessage';
import { TopBar } from '../shared/TopBar';
import { BuildStep } from './BuildStep';

const t = vi.leanbotWorld;

/** "/the-gioi-leanbot/:lessonId/:page" One screen of a Thế giới Leanbot lesson. */
export default function LeanbotWorldLessonScreen() {
  const profile = useSignedInProfile();
  // Unfinished, so only the coach sees it (AGENTS.md §9.10).
  if (profile.role !== 'coach') return <Navigate to="/hub" replace />;
  return <LessonPlayer coach />;
}

function LessonPlayer({ coach }: { coach: boolean }) {
  const { lessonId = '', page = '0' } = useParams();
  const navigate = useNavigate();
  const { lessons, failed } = useLeanbotWorld();
  // Re-render after a screen is marked done (the marks live in localStorage).
  const [, setVersion] = useState(0);

  if (failed) return <ScreenMessage text={t.loadError} alert />;
  if (!lessons) return <ScreenMessage text={t.loading} />;
  const index = lessons.findIndex((l) => l.id === lessonId);
  const lesson = lessons[index];
  if (!lesson) {
    return (
      <ScreenMessage text={t.notFound} alert>
        <Button
          onClick={() => {
            void navigate('/the-gioi-leanbot');
          }}
        >
          {t.title}
        </Button>
      </ScreenMessage>
    );
  }

  const at = clampPage(lesson, Number(page));
  const last = pageCount(lesson) - 1;
  const screen = at > 0 && at < last ? lesson.screens[at - 1] : undefined;
  const screenDone = screen === undefined || screen.kind === 'read' || isDone(lesson.id, screen.id);
  const go = (to: number) => {
    if (screen?.kind === 'read') markDone(lesson.id, screen.id);
    void navigate(`/the-gioi-leanbot/${lesson.id}/${String(to)}`);
    window.scrollTo(0, 0);
  };
  const nextLesson = lessons[index + 1];

  return (
    <main className="flex h-dvh flex-col gap-3 bg-ground p-3">
      <TopBar back={{ label: t.title, to: '/the-gioi-leanbot' }}>
        <h1 className="m-0 truncate font-display text-[22px] text-paper">
          {t.lessonNumber(lesson.number)}. {lesson.title}
        </h1>
      </TopBar>

      <div
        className="h-2 w-full shrink-0 rounded-full bg-ink/20"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round((at / last) * 100)}
        aria-label={t.progress}
      >
        <div
          className="h-full rounded-full bg-go transition-[width] duration-300"
          style={{ width: `${String((at / last) * 100)}%` }}
        />
      </div>

      {screen?.kind === 'build' ? (
        <BuildStep
          key={`${lesson.id}-${screen.id}`}
          screen={screen}
          done={isDone(lesson.id, screen.id)}
          onDone={() => {
            markDone(lesson.id, screen.id);
            setVersion((v) => v + 1);
          }}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto grid max-w-[760px] gap-4 pb-4">
            {at === 0 && <CanDoPage lesson={lesson} />}
            {screen?.kind === 'read' && <ReadStep lesson={lesson} screen={screen} index={at - 1} />}
            {at === last && (
              <Panel className="grid gap-3 p-6 text-center">
                <h2 className="m-0 font-display text-[30px]">🎉 {t.finishTitle}</h2>
                <p className="m-0 text-bubble">{lesson.canDo}</p>
                {nextLesson ? (
                  <Link
                    to={`/the-gioi-leanbot/${nextLesson.id}/0`}
                    className="font-display text-[22px] text-brand-deep"
                  >
                    {t.nextLesson} {nextLesson.title}
                  </Link>
                ) : (
                  <p className="m-0">{t.allDone}</p>
                )}
              </Panel>
            )}
          </div>
        </div>
      )}

      <nav className="flex shrink-0 items-center gap-3 rounded-panel border-3 border-ink bg-paper p-2">
        <Button
          variant="plain"
          size="sm"
          onClick={() => {
            if (at === 0) void navigate('/the-gioi-leanbot');
            else go(at - 1);
          }}
        >
          {at === 0 ? t.backToList : t.back}
        </Button>
        <span className="flex-1" />
        {!screenDone && !coach && (
          <span className="text-sm font-bold opacity-70">{t.mustCheck}</span>
        )}
        <span className="text-sm font-bold tabular-nums opacity-70">
          {at + 1} / {last + 1}
        </span>
        <Button
          variant="go"
          size="sm"
          disabled={at === last || (!screenDone && !coach)}
          onClick={() => {
            go(at + 1);
          }}
          data-testid="lbw-next"
        >
          {t.next}
        </Button>
      </nav>
    </main>
  );
}

function CanDoPage({ lesson }: { lesson: LeanbotWorldLesson }) {
  return (
    <>
      <LeanbotEyebrow text={`${t.stage(lesson.stage)} · ${t.lessonNumber(lesson.number)}`} />
      <h2 className="m-0 font-display text-[30px] leading-tight">{lesson.title}</h2>
      <Panel className="grid gap-3 p-4">
        <h3 className="m-0 font-display text-[22px]">{t.canDo}</h3>
        <p className="m-0 text-bubble font-bold">{lesson.canDo}</p>
        {lesson.image && (
          <img
            src={LEANBOT_IMG + lesson.image.src}
            alt={lesson.image.alt}
            className="h-auto w-full rounded-panel border-3 border-ink bg-paper"
          />
        )}
        <h3 className="m-0 font-display text-[20px]">{t.goals}</h3>
        <ul className="m-0 grid list-none gap-2 p-0">
          {lesson.goals.map((goal) => (
            <li key={goal} className="relative pl-7 text-body">
              <span aria-hidden className="absolute left-0 font-bold text-go">
                ✓
              </span>
              {goal}
            </li>
          ))}
        </ul>
        {lesson.course !== undefined && (
          <Link to={`/leanbot/${lesson.course}/0`} className="font-bold text-brand-deep">
            {t.readMore} ↗
          </Link>
        )}
      </Panel>
    </>
  );
}

/** A card, or a real-robot step with the code to copy into Leanbot IDE. */
function ReadStep({
  lesson,
  screen,
  index,
}: {
  lesson: LeanbotWorldLesson;
  screen: LbwReadScreen;
  index: number;
}) {
  const [copied, setCopied] = useState(false);
  const code = useMemo(() => {
    if (screen.program === undefined) return null;
    setupWorkshopBlocks();
    return programCode(screen.program);
  }, [screen.program]);
  return (
    <>
      <LeanbotScreenView lessonId={`lbw-${lesson.id}`} index={index} screen={screen.screen} />
      {code !== null && (
        <Panel className="flex flex-col gap-2 p-3" raised={false}>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 mr-auto font-display text-[20px]">{t.yourCode}</h3>
            <Button
              size="sm"
              variant="go"
              onClick={() => {
                void copyText(code).then(setCopied);
              }}
            >
              {copied ? t.copied : t.copy}
            </Button>
          </div>
          <div className="flex max-h-80 min-h-40 flex-col">
            <CodeLines code={code} testId="lbw-robot-code" />
          </div>
          <a
            href={LEANBOT_IDE_URL}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-brand-deep"
          >
            {t.openIde} ↗
          </a>
        </Panel>
      )}
    </>
  );
}
