import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { LessonCard, MascotPose } from '@codequest/content-schema';
import { computeLessonRewards } from '@codequest/rewards';
import { useAudio, useMusic } from '../../audio/useAudio';
import { lessonCardVoiceId, uiVoiceId } from '../../audio/voiceIds';
import { canOpenLesson, firstPlayableLevelId } from '../../features/content/catalog';
import { useSignedInProfile } from '../../features/profiles';
import { listLedger, markLessonDone } from '../../features/progress';
import { vi } from '../../i18n/vi';
import { Bubble, Button, Panel, PixelIcon, SpeakButton } from '../../ui';
import { FOCUS_RING } from '../../ui/focusRing';
import { MangPortrait, type PortraitPose } from '../play/MangPortrait';
import { ScreenMessage } from '../shared/ScreenMessage';
import { TopBar } from '../shared/TopBar';
import { useChild } from '../shared/useChild';

const t = vi.lesson;

// The demo brings Blockly and the stage; load it only when a lesson reaches a demo card.
const LessonDemo = lazy(() => import('./LessonDemo').then((m) => ({ default: m.LessonDemo })));

// Sprite frames that exist today (art-direction.md §5); missing poses fall back to "talk".
const POSE: Record<MascotPose, PortraitPose> = {
  idle: 'idle_1',
  talk: 'talk',
  happy: 'happy',
  cheer: 'cheer',
  think: 'talk',
  point: 'talk',
  oops: 'talk',
};

type Finished = { coins: number };

/** "/w/:worldId/lesson/:lessonId" Bài giảng: big cards, ← → to flip, coins at the last card. */
export default function LessonScreen() {
  const { worldId = '', lessonId = '' } = useParams();
  const navigate = useNavigate();
  const profile = useSignedInProfile();
  const { catalog, child, failed } = useChild(profile.id);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState<Finished | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const { playSfx } = useAudio();
  useMusic('village');

  // A card turn swishes (keys or buttons; the buttons themselves are data-sfx="none").
  const shownIndex = useRef(index);
  useEffect(() => {
    if (shownIndex.current === index) return;
    shownIndex.current = index;
    playSfx('page-turn');
  }, [index, playSfx]);

  const lesson = catalog?.lessons.get(lessonId);
  const world = catalog?.worldById.get(worldId);
  const cards: readonly LessonCard[] = lesson?.cards ?? [];
  const card = cards[index];
  const last = index === cards.length - 1;
  const answered = card?.type !== 'quiz' || answers[index] !== undefined;
  // This lesson counts as done as soon as it is finished (the live query catches up later), so
  // "Vào chơi" is there, focused, together with the done panel.
  const firstLevelId =
    catalog && world && child
      ? firstPlayableLevelId(catalog, world, {
          ...child,
          lessonsDone: finished ? new Set([...child.lessonsDone, lessonId]) : child.lessonsDone,
        })
      : null;

  const finish = useCallback(async () => {
    if (!lesson) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      const now = new Date();
      const entries = computeLessonRewards({
        lessonId: lesson.id,
        ledger: await listLedger(profile.id),
        now,
        profileId: profile.id,
      });
      await markLessonDone(profile.id, lesson.id, entries, now);
      setFinished({ coins: entries.reduce((sum, e) => sum + e.delta, 0) });
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  }, [lesson, profile.id]);

  const go = useCallback(
    (step: -1 | 1) => {
      if (step === 1 && (!answered || last)) return;
      setIndex((i) => Math.min(Math.max(0, i + step), cards.length - 1));
    },
    [answered, last, cards.length],
  );

  // ← → flip cards (screens-and-flows.md §4), except inside Blockly or a form field. A layout
  // effect, so the keys work from the first painted frame (a passive effect can lag behind it).
  useLayoutEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (finished || document.querySelector('[aria-modal="true"]')) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, .injectionDiv, .blocklyWidgetDiv')) return;
      if (event.key === 'ArrowRight') go(1);
      else if (event.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [go, finished]);

  const backToWorld = (
    <Button icon="←" onClick={() => void navigate(world ? `/w/${worldId}` : '/map')}>
      {world ? vi.play.toWorld : vi.play.toMap}
    </Button>
  );
  if (failed) return <ScreenMessage text={vi.map.loadError} alert />;
  if (!catalog || !child) return <ScreenMessage text={vi.play.loading} />;
  if (!lesson || !card || lesson.worldId !== worldId) {
    return (
      <ScreenMessage text={t.notFound} alert>
        {backToWorld}
      </ScreenMessage>
    );
  }
  // URL guard: lessons are always open, but only inside a world the child has reached.
  if (!canOpenLesson(catalog, lesson.id, child)) {
    return (
      <ScreenMessage text={t.locked} alert>
        {backToWorld}
      </ScreenMessage>
    );
  }

  const toWorld = `/w/${worldId}`;

  return (
    <main className="grid min-h-screen grid-rows-[auto_minmax(0,1fr)] gap-3 bg-ground p-3">
      <TopBar back={{ label: world?.title ?? t.close, to: toWorld }}>
        <h1 className="m-0 flex min-w-0 items-center gap-3 font-display text-[28px] text-paper">
          <PixelIcon name="book" scale={2} />
          <span className="truncate">{lesson.title}</span>
        </h1>
      </TopBar>

      <div className="grid min-h-0 content-center justify-items-center gap-4 py-2">
        {finished ? (
          <Panel
            as="section"
            aria-labelledby="lesson-done"
            data-testid="lesson-done"
            className="grid w-[min(760px,100%)] animate-pop justify-items-center gap-4 p-10 text-center"
          >
            <MangPortrait pose="cheer" height={140} />
            <h2 id="lesson-done" className="m-0 text-display">
              {t.doneTitle}
            </h2>
            {finished.coins > 0 && (
              <p className="m-0 flex items-center gap-2 rounded-chip border-3 border-ink bg-brand-deep px-4 py-1 font-pixel text-hud text-paper">
                <PixelIcon name="coin" scale={2} pop />
                {t.coins(finished.coins)}
              </p>
            )}
            <div className="flex items-center gap-3">
              <p className="m-0 text-bubble font-bold">{t.doneBody}</p>
              <SpeakButton voiceId={uiVoiceId('lesson.doneBody')} />
            </div>
            <div className="flex gap-4">
              <Button onClick={() => void navigate(toWorld)}>{t.close}</Button>
              {firstLevelId !== null && (
                <Button
                  variant="go"
                  iconAfter={<PixelIcon name="play" scale={1} />}
                  autoFocus
                  onClick={() => void navigate(`/play/${firstLevelId}`)}
                >
                  {t.play}
                </Button>
              )}
            </div>
          </Panel>
        ) : (
          <Panel
            as="section"
            aria-label={t.cardOf(index + 1, cards.length)}
            data-testid="lesson-card"
            data-card={index}
            className="grid w-[min(1040px,100%)] grid-rows-[auto_minmax(0,1fr)_auto] gap-5 px-8 pt-6 pb-6"
          >
            <div className="flex items-center justify-between">
              <span className="font-pixel text-pixel text-brand-deep uppercase">
                {t.cardOf(index + 1, cards.length)}
              </span>
              <Dots count={cards.length} current={index} />
            </div>

            <div key={index} className="grid min-h-[300px] animate-pop content-center gap-5">
              <CardBody
                card={card}
                index={index}
                lessonId={lesson.id}
                worldId={worldId}
                answer={answers[index]}
                onAnswer={(option) => {
                  setAnswers((a) => (a[index] === undefined ? { ...a, [index]: option } : a));
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <Button
                icon="←"
                data-sfx="none"
                disabled={index === 0}
                onClick={() => {
                  go(-1);
                }}
              >
                {t.prev}
              </Button>
              {saveFailed ? (
                <span role="alert" className="font-bold text-oops">
                  {t.saveFailed}
                </span>
              ) : (
                <span className="text-small text-ink-soft">{t.keysHint}</span>
              )}
              {last ? (
                <Button
                  variant="go"
                  disabled={!answered || saving}
                  onClick={() => void finish()}
                  data-testid="lesson-finish"
                >
                  {t.finish}
                </Button>
              ) : (
                <Button
                  variant="go"
                  size="md"
                  iconAfter="→"
                  data-sfx="none"
                  disabled={!answered}
                  onClick={() => {
                    go(1);
                  }}
                  data-testid="lesson-next"
                >
                  {t.next}
                </Button>
              )}
            </div>
          </Panel>
        )}
      </div>
    </main>
  );
}

function Dots({ count, current }: { count: number; current: number }) {
  return (
    <span aria-hidden="true" className="flex gap-2">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`h-3 rounded-brick border-2 border-ink transition-all duration-200 ${
            i === current ? 'w-8 bg-coin' : i < current ? 'w-3 bg-brand' : 'w-3 bg-paper'
          }`}
        />
      ))}
    </span>
  );
}

const OPTION = [
  'min-h-14 cursor-pointer rounded-button border-3 border-ink px-5 text-left font-display text-button font-extrabold shadow-button',
  'transition-[transform,box-shadow] duration-150 ease-bounce enabled:hover:-translate-y-px',
  'enabled:active:translate-y-1 enabled:active:shadow-button-pressed disabled:cursor-default',
  FOCUS_RING,
].join(' ');

function CardBody({
  card,
  index,
  lessonId,
  worldId,
  answer,
  onAnswer,
}: {
  card: LessonCard;
  index: number;
  lessonId: string;
  worldId: string;
  answer: number | undefined;
  onAnswer: (option: number) => void;
}) {
  if (card.type === 'say') {
    return (
      <div className="flex items-end justify-center gap-6">
        <MangPortrait pose={POSE[card.pose]} height={180} />
        <Bubble
          text={card.text}
          tail="left"
          voiceId={lessonCardVoiceId(lessonId, index)}
          className="mb-10 max-w-[600px] text-[28px] leading-snug"
        />
      </div>
    );
  }
  if (card.type === 'demo') {
    return (
      <>
        <div className="flex items-center gap-4">
          <MangPortrait pose="talk" height={72} />
          <Bubble text={card.text} tail="left" voiceId={lessonCardVoiceId(lessonId, index)} />
        </div>
        <Suspense fallback={<div className="h-[260px]" />}>
          <LessonDemo card={card} id={`${lessonId}-demo-${String(index)}`} worldId={worldId} />
        </Suspense>
      </>
    );
  }
  const right = answer === card.correct;
  return (
    <>
      <div className="flex items-center gap-4">
        <MangPortrait pose={answer === undefined ? 'talk' : right ? 'happy' : 'talk'} height={96} />
        <Bubble
          text={card.text}
          tail="left"
          voiceId={lessonCardVoiceId(lessonId, index)}
          className="text-[24px]"
        />
      </div>
      <div className="grid grid-cols-2 gap-4" role="group" aria-label={card.text}>
        {card.options.map((option, i) => {
          const chosen = answer === i;
          const reveal = answer !== undefined && i === card.correct;
          return (
            <button
              key={option}
              type="button"
              disabled={answer !== undefined}
              aria-pressed={chosen}
              data-testid="quiz-option"
              onClick={() => {
                onAnswer(i);
              }}
              className={`${OPTION} ${reveal ? 'bg-go' : chosen ? 'bg-hint' : 'bg-paper'}`}
            >
              <span className="mr-3 font-pixel text-pixel text-brand-deep">
                {String.fromCharCode(65 + i)}
              </span>
              {option}
            </button>
          );
        })}
      </div>
      <div className="flex min-h-11 items-center gap-3">
        <p aria-live="polite" className="m-0 min-h-8 text-bubble font-bold">
          {answer === undefined ? '' : `${right ? t.quizRight : t.quizWrong} ${card.explain}`}
        </p>
        {answer !== undefined && <SpeakButton voiceId={lessonCardVoiceId(lessonId, index, true)} />}
      </div>
    </>
  );
}
