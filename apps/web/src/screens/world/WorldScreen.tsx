import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { isUnlocked } from '@codequest/rewards';
import { useUnlockOverrides } from '../../features/author/authorMode';
import {
  levelViews,
  type LevelView,
  pendingLessonId,
  unlockContext,
  useCatalog,
} from '../../features/content/catalog';
import { levelNumberOf } from '../../features/content/files';
import { SANDBOX_WORLD_ID } from '../../features/content/sandbox';
import { useSignedInProfile } from '../../features/profiles';
import { useLessonsDone, useProgressMap } from '../../features/progress';
import { vi } from '../../i18n/vi';
import { Bubble, Button, Panel, PixelIcon, Stars } from '../../ui';
import { FOCUS_RING } from '../../ui/focusRing';
import { MangPortrait } from '../play/MangPortrait';
import { ScreenMessage } from '../shared/ScreenMessage';
import { TopBar } from '../shared/TopBar';

const t = vi.world;

const STONE = [
  'relative grid h-[124px] w-[112px] content-start justify-items-center gap-1 rounded-panel border-3 border-ink pt-3 pb-2',
  'transition-[transform,box-shadow] duration-150 ease-bounce',
].join(' ');
const STONE_LIVE = `${STONE} cursor-pointer shadow-hard hover:-translate-y-1 active:translate-y-1 active:shadow-button-pressed ${FOCUS_RING}`;

/** "/w/:worldId" Trang thế giới: the lesson, then the levels as stepping stones. */
export default function WorldScreen() {
  const { worldId = '' } = useParams();
  const profile = useSignedInProfile();
  const state = useCatalog();
  const catalog = state.status === 'ready' ? state.catalog : null;
  const progress = useProgressMap(profile.id);
  const lessonsDone = useLessonsDone(profile.id);
  const overrides = useUnlockOverrides(catalog);

  const world = catalog?.worldById.get(worldId);
  const child = useMemo(
    () => (progress && lessonsDone ? { progress, lessonsDone, overrides } : null),
    [progress, lessonsDone, overrides],
  );
  const views = useMemo(
    () => (catalog && world && child ? levelViews(catalog, world, child) : null),
    [catalog, world, child],
  );

  if (state.status === 'error') return <ScreenMessage text={vi.map.loadError} alert />;
  if (!catalog || !child || !views) return <ScreenMessage text={vi.play.loading} />;
  if (!world) {
    return (
      <ScreenMessage text={t.notFound} alert>
        <BackToMap />
      </ScreenMessage>
    );
  }
  if (!isUnlocked({ worldId: world.id }, unlockContext(catalog, child))) {
    return (
      <ScreenMessage text={t.lockedWorld} alert>
        <BackToMap />
      </ScreenMessage>
    );
  }

  const pending = pendingLessonId(world, child.lessonsDone);
  const firstLocked = views.find((v) => v.status === 'locked');
  const nextUp = views.find((v) => v.status === 'open');
  const needsLesson = pending !== null && world.lessonIds[0] === pending;
  const mangLine = needsLesson ? t.lessonFirst : (nextUp?.level.objective ?? t.allDone);
  const sandbox = world.id === SANDBOX_WORLD_ID;

  return (
    <main className="grid min-h-screen grid-rows-[auto_minmax(0,1fr)] gap-3 bg-ground p-3">
      <TopBar back={{ label: t.backToMap, to: '/map' }}>
        <h1 className="m-0 flex min-w-0 items-baseline gap-3 font-display text-[28px] text-paper">
          <span className="font-pixel text-pixel text-brand-soft uppercase">
            {sandbox ? vi.map.sandbox : vi.map.worldNumber(world.order)}
          </span>
          <span className="truncate">{world.title}</span>
        </h1>
      </TopBar>

      <div className="grid min-h-0 grid-cols-[minmax(300px,32fr)_minmax(0,68fr)] gap-3">
        <Panel
          as="section"
          aria-labelledby="world-story"
          className="cq-sky flex flex-col gap-4 overflow-hidden p-6"
        >
          <span className="w-fit rounded-chip border-3 border-ink bg-coin px-3 pt-1 font-pixel text-pixel uppercase">
            {world.concept}
          </span>
          <h2 id="world-story" className="m-0 text-display">
            {world.title}
          </h2>
          <p className="m-0 text-body">{world.story}</p>
          <div className="mt-auto flex items-end gap-3 pb-14">
            <MangPortrait pose={needsLesson ? 'talk' : 'idle_1'} height={104} />
            <Bubble text={mangLine} tail="left" />
          </div>
        </Panel>

        <Panel as="section" aria-label={t.pathLabel} className="min-h-0 overflow-y-auto p-6">
          <ol className="m-0 flex list-none flex-wrap content-start items-center gap-x-3 gap-y-6 p-0">
            {world.lessonIds.map((lessonId) => {
              const lesson = catalog.lessons.get(lessonId);
              if (!lesson) return null;
              const done = child.lessonsDone.has(lessonId);
              return (
                <li key={lessonId} className="flex items-center gap-3">
                  <Link
                    to={`/w/${world.id}/lesson/${lessonId}`}
                    aria-label={`${t.lesson}: ${lesson.title}`}
                    data-testid="lesson-stone"
                    data-done={done}
                    className={`${STONE_LIVE} ${done ? 'bg-brand-soft' : 'bg-coin'}`}
                  >
                    <PixelIcon name="book" scale={3} />
                    <span className="font-display text-body font-extrabold">{t.lesson}</span>
                    {!done && <Pulse />}
                  </Link>
                  <Connector />
                </li>
              );
            })}
            {views.map((view, index) => (
              <li key={view.level.id} className="flex items-center gap-3">
                <LevelStone
                  view={view}
                  number={levelNumberOf(view.level.id) ?? index + 1}
                  next={view === nextUp}
                  worldId={world.id}
                />
                {index < views.length - 1 && <Connector dim={view === firstLocked} />}
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </main>
  );
}

function BackToMap() {
  const navigate = useNavigate();
  return (
    <Button icon="←" onClick={() => void navigate('/map')}>
      {t.backToMap}
    </Button>
  );
}

function Connector({ dim = false }: { dim?: boolean }) {
  return (
    <span aria-hidden="true" className={`flex gap-1.5 ${dim ? 'opacity-40' : ''}`}>
      <span className="size-2.5 rounded-brick bg-ink-soft" />
      <span className="size-2.5 rounded-brick bg-ink-soft" />
    </span>
  );
}

function Pulse() {
  return (
    <span
      aria-hidden="true"
      className="cq-float absolute -top-3 -right-3 size-6 rounded-full border-3 border-ink bg-coin"
    />
  );
}

function LevelStone({
  view,
  number,
  next,
  worldId,
}: {
  view: LevelView;
  number: number;
  next: boolean;
  worldId: string;
}) {
  const { level, status, stars } = view;
  const playable = status !== 'locked' && status !== 'soon';
  const tag = status === 'soon' ? t.soonTag : t.stage[level.stage];
  const label = `${t.levelLabel(number, level.title)}${tag ? ` · ${tag}` : ''}, ${t.status[status]}`;
  const boss = level.stage === 'boss';
  const inner = (
    <>
      {tag && (
        <span
          className={`absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-kbd border-2 border-ink px-1.5 font-display text-[13px] leading-5 font-extrabold whitespace-nowrap ${
            boss ? 'bg-oops text-ink' : 'bg-hint'
          }`}
        >
          {tag}
        </span>
      )}
      {!playable ? (
        <span className="pt-2">
          <PixelIcon name="lock" scale={3} />
        </span>
      ) : boss ? (
        <PixelIcon name="crown" scale={3} />
      ) : (
        <span className="font-pixel text-[52px] leading-[48px]">{number}</span>
      )}
      {playable && <Stars earned={stars} scale={1} className="mt-auto" />}
    </>
  );

  if (!playable) {
    return (
      <div
        role="img"
        aria-label={label}
        data-level={level.id}
        data-status={status}
        className={`${STONE} bg-paper-2 text-ink-soft shadow-key`}
      >
        {inner}
      </div>
    );
  }
  return (
    <Link
      to={`/play/${level.id}`}
      state={{ fromWorld: worldId }}
      aria-label={label}
      data-level={level.id}
      data-status={status}
      className={`${STONE_LIVE} ${next ? 'bg-go' : 'bg-paper'}`}
    >
      {inner}
      {next && <Pulse />}
    </Link>
  );
}
