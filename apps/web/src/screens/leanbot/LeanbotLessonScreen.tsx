import type { LeanbotLesson, LeanbotScreen as Screen } from '@codequest/content-schema';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  clampPage,
  findLesson,
  LEANBOT_IMG,
  pageCount,
  progressOf,
  useLeanbotCourse,
} from '../../features/leanbot/leanbotCourse';
import { vi } from '../../i18n/vi';
import { Button, Panel } from '../../ui';
import { FOCUS_RING } from '../../ui/focusRing';
import { ScreenMessage } from '../shared/ScreenMessage';
import { TopBar } from '../shared/TopBar';
import { LeanbotQuiz } from './LeanbotQuiz';

const t = vi.leanbot;

const TONE: Record<string, string> = {
  go: 'border-go bg-go-soft',
  oops: 'border-oops bg-oops-soft',
  coin: 'border-coin bg-coin-soft',
  sky: 'border-sky bg-sky-soft',
};

const BOX = 'rounded-panel border-3 p-3 text-body';

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
          <ScreenPage
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
      <Eyebrow text={t.lessonNumber(lesson.number)} />
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

function Eyebrow({ text }: { text: string }) {
  return (
    <span className="justify-self-start rounded-key border-3 border-ink bg-brand-soft px-2 py-0.5 font-display text-sm tracking-wide uppercase">
      {text}
    </span>
  );
}

function ScreenPage({
  screen,
  lessonId,
  index,
}: {
  screen: Screen;
  lessonId: string;
  index: number;
}) {
  return (
    <>
      <Eyebrow text={screen.part} />
      <h2 className="m-0 font-display text-[28px] leading-tight">{screen.title}</h2>

      {screen.lines?.map((line) => (
        <p key={line} className="m-0 text-bubble">
          {line}
        </p>
      ))}

      {screen.image !== undefined && (
        <img
          src={LEANBOT_IMG + screen.image}
          alt={screen.alt ?? ''}
          className="w-full rounded-panel border-3 border-ink bg-paper"
        />
      )}

      {screen.chips && (
        <div className="grid gap-3 sm:grid-cols-2">
          {screen.chips.map((chip) => (
            <div key={chip.label} className={`${BOX} ${TONE[chip.tone] ?? ''}`}>
              <span className="block font-display text-sm tracking-wide uppercase">
                {chip.label}
              </span>
              <span className="block text-bubble font-bold">{chip.body}</span>
            </div>
          ))}
        </div>
      )}

      {screen.table && (
        <div className="overflow-x-auto rounded-panel border-3 border-ink bg-paper">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                {screen.table.head.map((head) => (
                  <th
                    key={head}
                    className="border-b-3 border-ink bg-brand-soft px-3 py-2 font-display text-sm tracking-wide whitespace-nowrap uppercase"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {screen.table.rows.map((row) => (
                <tr key={row.join('|')}>
                  {row.map((cell, i) => (
                    <td
                      key={`${row.join('|')}-${String(i)}`}
                      className="border-b-2 border-ink/20 px-3 py-2 align-top first:font-bold"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {screen.steps && (
        <ol className="m-0 grid list-none gap-2 p-0">
          {screen.steps.map(([num, text]) => (
            <li
              key={num}
              className="flex items-start gap-3 rounded-panel border-3 border-ink bg-paper p-3"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-key bg-brand font-display text-paper">
                {num}
              </span>
              <span className="text-body">{text}</span>
            </li>
          ))}
        </ol>
      )}

      {screen.list && (
        <ul className="m-0 grid list-none gap-2 p-0">
          {screen.list.map((item) => (
            <li key={item} className="rounded-panel border-3 border-ink bg-paper p-3 text-body">
              {item}
            </li>
          ))}
        </ul>
      )}

      {screen.code !== undefined && (
        <pre className="m-0 overflow-x-auto rounded-panel border-3 border-ink bg-ink p-3 text-paper">
          <code>{screen.code}</code>
        </pre>
      )}

      {screen.link && (
        <p className="m-0">
          <a
            href={screen.link.href}
            target="_blank"
            rel="noopener"
            className={`font-bold underline ${FOCUS_RING}`}
          >
            {screen.link.label}
          </a>
        </p>
      )}

      {screen.warn !== undefined && (
        <p className={`m-0 ${BOX} border-oops bg-oops-soft font-bold`}>⚠️ {screen.warn}</p>
      )}
      {screen.tip !== undefined && (
        <p className={`m-0 ${BOX} border-coin bg-coin-soft`}>💡 {screen.tip}</p>
      )}
      {screen.note !== undefined && (
        <p className={`m-0 ${BOX} border-ink bg-paper`}>{screen.note}</p>
      )}

      {screen.check !== undefined && <CheckBox id={`${lessonId}.${String(index)}`} label={screen.check} />}
    </>
  );
}

/**
 * A tick the child presses after doing it on the real robot. It is a note to themselves, not
 * progress the coach reports on, so it lives in this browser only.
 */
function CheckBox({ id, label }: { id: string; label: string }) {
  const key = `cq.leanbot.check.${id}`;
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  });

  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => {
        const next = !on;
        setOn(next);
        try {
          if (next) localStorage.setItem(key, '1');
          else localStorage.removeItem(key);
        } catch {
          // Storage can be blocked; the tick still works for this visit.
        }
      }}
      className={`flex w-full items-center gap-3 rounded-panel border-3 border-dashed border-go p-3 text-left text-bubble font-bold ${
        on ? 'bg-go text-paper' : 'bg-go-soft'
      } ${FOCUS_RING}`}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-key border-3 border-go bg-paper text-go">
        {on ? '✓' : ''}
      </span>
      {label}
    </button>
  );
}
