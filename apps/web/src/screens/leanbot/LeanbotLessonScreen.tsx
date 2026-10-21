import type { LeanbotLesson } from '@codequest/content-schema';
import { useNavigate, useParams } from 'react-router';
import {
  clampPage,
  findLesson,
  pageCount,
  progressOf,
  useLeanbotCourse,
} from '../../features/leanbot/leanbotCourse';
import { vi } from '../../i18n/vi';
import { Button, Panel } from '../../ui';
import { ScreenMessage } from '../shared/ScreenMessage';
import { TopBar } from '../shared/TopBar';
import { LeanbotEyebrow } from './LeanbotEyebrow';
import { LeanbotQuiz } from './LeanbotQuiz';
import { LeanbotScreenView } from './LeanbotScreenView';

const t = vi.leanbot;

/** "/leanbot/:lessonId/:page" One screen of a Leanbot lesson: one idea, then "Tiếp". */
export default function LeanbotLessonScreen() {
  const { lessonId = '', page = '0' } = useParams();
  const navigate = useNavigate();
  const { lessons, failed } = useLeanbotCourse();

  if (failed) return <ScreenMessage text={t.loadError} alert />;
  if (!lessons) return <ScreenMessage text={t.loading} />;

  const lesson = findLesson(lessons, lessonId);
  if (!lesson) {
    return (
      <ScreenMessage text={t.notFound} alert>
        <Button
          onClick={() => {
            void navigate('/leanbot');
          }}
        >
          {t.title}
        </Button>
      </ScreenMessage>
    );
  }

  const at = clampPage(lesson, Number(page));
  const last = pageCount(lesson) - 1;
  // Page 0 is the goals and the last page is the quiz; everything between is a screen.
  const screenAt = at > 0 && at <= lesson.screens.length ? lesson.screens[at - 1] : undefined;
  const go = (to: number) => {
    void navigate(`/leanbot/${lesson.id}/${String(to)}`);
    window.scrollTo(0, 0);
  };

  return (
    <main className="min-h-dvh bg-ground">
      <TopBar back={{ label: t.title, to: '/leanbot' }}>
        <h1 className="m-0 truncate font-display text-[22px] text-paper">{lesson.title}</h1>
      </TopBar>

      <div
        className="h-2 w-full bg-ink/20"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progressOf(lesson, at) * 100)}
        aria-label={t.progress}
      >
        <div
          className="h-full bg-go transition-[width] duration-300"
          style={{ width: `${String(progressOf(lesson, at) * 100)}%` }}
        />
      </div>

      <div className="mx-auto grid max-w-[760px] gap-4 p-4 pb-28">
        {at === 0 && <GoalsPage lesson={lesson} />}
        {screenAt !== undefined && (
          <LeanbotScreenView
            key={`${lesson.id}-${String(at)}`}
            lessonId={lesson.id}
            index={at - 1}
            screen={screenAt}
          />
        )}
        {at === last && <LeanbotQuiz lesson={lesson} />}
      </div>

      <nav className="fixed inset-x-0 bottom-0 border-t-3 border-ink bg-paper p-3">
        <div className="mx-auto flex max-w-[760px] items-center gap-3">
          <Button
            variant="plain"
            onClick={() => {
              if (at === 0) void navigate('/leanbot');
              else go(at - 1);
            }}
          >
            {at === 0 ? t.backToList : t.back}
          </Button>
          <span className="flex-1" />
          <span className="text-sm font-bold tabular-nums opacity-70">
            {at + 1} / {last + 1}
          </span>
          <Button
            variant="go"
            disabled={at === last}
            onClick={() => {
              go(at + 1);
            }}
          >
            {at === last - 1 ? t.toQuiz : t.next}
          </Button>
        </div>
      </nav>
    </main>
  );
}

function GoalsPage({ lesson }: { lesson: LeanbotLesson }) {
  return (
    <>
      <LeanbotEyebrow text={t.lessonNumber(lesson.number)} />
      <h2 className="m-0 font-display text-[30px] leading-tight">{lesson.title}</h2>
      <Panel className="grid gap-3 p-4">
        <h3 className="m-0 font-display text-[22px]">{t.goalsTitle}</h3>
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
      </Panel>
    </>
  );
}
