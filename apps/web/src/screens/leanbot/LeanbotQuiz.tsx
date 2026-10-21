import type { LeanbotLesson } from '@codequest/content-schema';
import { useState } from 'react';
import { Link } from 'react-router';
import { vi } from '../../i18n/vi';
import { Panel } from '../../ui';
import { FOCUS_RING } from '../../ui/focusRing';
import { LeanbotEyebrow } from './LeanbotEyebrow';

const t = vi.leanbot;

const KEYS = ['A', 'B', 'C', 'D'];

/** The quiz that closes a Leanbot lesson. One answer per question, then the reason why. */
export function LeanbotQuiz({ lesson }: { lesson: LeanbotLesson }) {
  const [picked, setPicked] = useState<Record<number, number>>({});

  const answered = Object.keys(picked).length;
  const right = lesson.quiz.filter((q, i) => picked[i] === q.correct).length;
  const finished = answered === lesson.quiz.length;

  return (
    <>
      <LeanbotEyebrow text={t.quizEyebrow} />
      <h2 className="m-0 font-display text-[28px] leading-tight">{t.quizTitle}</h2>

      {lesson.quiz.map((question, qi) => {
        const choice = picked[qi];
        const done = choice !== undefined;
        return (
          <section key={question.q} className="grid gap-2">
            <p className="m-0 text-sm font-bold opacity-70">
              {t.questionNumber(qi + 1, lesson.quiz.length)}
            </p>
            <p className="m-0 text-bubble font-bold">{question.q}</p>
            {question.options.map((option, oi) => {
              const isAnswer = oi === question.correct;
              const show = done && (isAnswer || oi === choice);
              const tone = !show
                ? 'border-ink bg-paper'
                : isAnswer
                  ? 'border-go bg-go-soft'
                  : 'border-oops bg-oops-soft';
              return (
                <button
                  key={option}
                  type="button"
                  disabled={done}
                  onClick={() => {
                    setPicked((p) => ({ ...p, [qi]: oi }));
                  }}
                  className={`flex w-full items-center gap-3 rounded-panel border-3 p-3 text-left text-bubble font-bold ${tone} ${FOCUS_RING}`}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-key border-3 border-ink bg-brand-soft font-display">
                    {KEYS[oi]}
                  </span>
                  {option}
                </button>
              );
            })}
            {done && (
              <p className="m-0 rounded-panel border-3 border-ink bg-paper p-3">
                {question.explain}
              </p>
            )}
          </section>
        );
      })}

      {finished && (
        <Panel className="grid justify-items-start gap-3 p-4">
          <h3 className="m-0 font-display text-[22px]">
            {t.quizDone(lesson.number, right, lesson.quiz.length)}
          </h3>
          <Link
            to="/leanbot"
            className={`rounded-key border-3 border-ink bg-go px-4 py-2 font-display text-paper no-underline ${FOCUS_RING}`}
          >
            {t.backToList}
          </Link>
        </Panel>
      )}
    </>
  );
}
