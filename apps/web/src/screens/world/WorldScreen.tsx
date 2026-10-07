import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import type { Lesson } from '@codequest/content-schema';
import { chapterStates, isUnlocked, openingChapterIndex } from '@codequest/rewards';
import { useMusic } from '../../audio/useAudio';
import { levelVoiceId, uiVoiceId } from '../../audio/voiceIds';
import { useUnlockOverrides } from '../../features/author/authorMode';
import {
  lessonsBefore,
  levelViews,
  type LevelView,
  pendingLessonId,
  unlockContext,
  useCatalog,
} from '../../features/content/catalog';
import { levelNumberOf } from '../../features/content/files';
import { SANDBOX_WORLD_ID } from '../../features/content/sandbox';
import { useSignedInProfile } from '../../features/profiles';
import { useFreshChapters } from '../../features/story';
import { useLessonsDone, useProgressMap } from '../../features/progress';
import { vi } from '../../i18n/vi';
import { Bubble, Button, Panel, PixelIcon, Stars } from '../../ui';
import { FOCUS_RING } from '../../ui/focusRing';
import { MangPortrait } from '../play/MangPortrait';
import { ScreenMessage } from '../shared/ScreenMessage';
import { TopBar } from '../shared/TopBar';
import { StoryBook } from './StoryBook';

const t = vi.world;

const STONE = [
  'relative grid h-[104px] w-[96px] content-start justify-items-center gap-1 rounded-panel border-3 border-ink pt-2.5 pb-2',
  'transition-[transform,box-shadow] duration-150 ease-bounce',
].join(' ');
const STONE_LIVE = `${STONE} cursor-pointer shadow-hard hover:-translate-y-1 active:translate-y-1 active:shadow-button-pressed ${FOCUS_RING}`;

/**
 * Stones per row of the path. The path snakes: left → right, then right → left on the next
 * row, so a world of 16 levels + lesson is 3 rows and fits a 1280×600 page (a 1280×720 laptop
 * minus the browser bar) without scrolling. The DOM keeps the level order, so Tab does too.
 */
const PATH_COLUMNS = 6;

/**
 * "/w/:worldId" Trang thế giới: the opening lesson, then the levels as stepping stones; a block
 * lesson ("Khối mới", `lesson.beforeLevel`) is a book on the stone where its block first appears.
 */
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
    () => (progress && lessonsDone && overrides ? { progress, lessonsDone, overrides } : null),
    [progress, lessonsDone, overrides],
  );
  const views = useMemo(
    () => (catalog && world && child ? levelViews(catalog, world, child) : null),
    [catalog, world, child],
  );
  const chapters = useMemo(
    () =>
      catalog && world && progress
        ? chapterStates(world, { levels: catalog.levels, progress })
        : null,
    [catalog, world, progress],
  );
  const fresh = useFreshChapters(profile.id, worldId, chapters);
  // Turning a page (or reading aloud) ends Măng's "new chapter" nudge.
  // Keyed by world: the screen stays mounted when the route goes to another world.
  const [storyTouched, setStoryTouched] = useState<string | null>(null);

  useMusic('village');

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
  const needsLesson = pending !== null && world.lessonIds[0] === pending;
  // The free-play level is always open: it is "next" only once every other level is done,
  // and nothing is "next" while the lesson comes first.
  const open = needsLesson ? [] : views.filter((v) => v.status === 'open');
  const nextUp = open.find((v) => v.level.mode !== 'creative') ?? open[0];
  // A block lesson not seen yet right before the next level comes first (it does not lock it).
  const blockFirst =
    nextUp &&
    lessonsBefore(catalog, world, nextUp.level.id).find((l) => !child.lessonsDone.has(l.id));
  // A lesson to watch first is more urgent than the story; the new chapter beats the objective.
  const newChapter = fresh !== null && fresh.length > 0 && storyTouched !== world.id;
  const mangLine = needsLesson
    ? t.lessonFirst
    : blockFirst
      ? t.newBlockFirst
      : newChapter
        ? t.story.newChapterSay
        : (nextUp?.level.objective ?? t.allDone);
  const mangVoice = needsLesson
    ? uiVoiceId('world.lessonFirst')
    : blockFirst
      ? uiVoiceId('world.newBlockFirst')
      : newChapter
        ? uiVoiceId('world.story.newChapterSay')
        : nextUp
          ? levelVoiceId(nextUp.level.id, 'objective')
          : uiVoiceId('world.allDone');
  const lessonStone = (lesson: Lesson): PathStone => {
    const done = child.lessonsDone.has(lesson.id);
    return {
      key: lesson.id,
      dimAfter: false,
      node: (
        <Link
          to={`/w/${world.id}/lesson/${lesson.id}`}
          aria-label={`${t.lesson}: ${lesson.title}`}
          data-testid="lesson-stone"
          data-lesson={lesson.id}
          data-done={done}
          className={`${STONE_LIVE} ${done ? 'bg-brand-soft' : 'bg-coin'}`}
        >
          <PixelIcon name="book" scale={3} />
          <span className="font-display text-[15px] leading-5 font-extrabold">{t.lesson}</span>
          {!done && <Pulse />}
        </Link>
      ),
    };
  };
  // A block lesson is a small book on the corner of its level's stone (the path keeps 3 rows).
  const blockChip = (lesson: Lesson) => {
    const done = child.lessonsDone.has(lesson.id);
    return (
      <Link
        key={lesson.id}
        to={`/w/${world.id}/lesson/${lesson.id}`}
        aria-label={`${t.lesson}: ${lesson.title}`}
        title={t.newBlock}
        data-testid="block-lesson-stone"
        data-lesson={lesson.id}
        data-done={done}
        data-next={lesson === blockFirst}
        className={`absolute -top-4 -left-5 z-10 grid size-12 place-items-center rounded-chip border-3 border-ink shadow-hard transition-transform duration-150 hover:-translate-y-0.5 ${FOCUS_RING} ${done ? 'bg-brand-soft' : 'bg-coin'}`}
      >
        <PixelIcon name="book" scale={2} />
        {lesson === blockFirst && <Pulse />}
      </Link>
    );
  };
  const sandbox = world.id === SANDBOX_WORLD_ID;

  return (
    <main className="grid h-dvh min-h-[500px] grid-rows-[auto_minmax(0,1fr)] gap-3 bg-ground p-3">
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
          aria-label={t.story.label}
          data-testid="world-story-panel"
          className="cq-sky flex min-h-0 flex-col gap-2.5 overflow-hidden p-4"
        >
          {/* Hidden on a short page (1280×600): the story lines need the room. */}
          <span className="w-fit shrink-0 rounded-chip [@media(max-height:660px)]:hidden border-3 border-ink bg-coin px-3 pt-1 font-pixel text-pixel uppercase">
            {world.concept}
          </span>
          {chapters && chapters.length > 0 ? (
            fresh !== null && (
              <StoryBook
                key={world.id}
                world={world}
                states={chapters}
                levels={catalog.levels}
                fresh={fresh}
                initialPage={openingChapterIndex(chapters, fresh)}
                onInteract={() => {
                  setStoryTouched(world.id);
                }}
              />
            )
          ) : (
            <>
              <h2 id="world-story" className="m-0 text-display">
                {world.title}
              </h2>
              <p className="m-0 text-body">{world.story}</p>
            </>
          )}
          <div className="mt-auto flex shrink-0 items-end gap-3 pb-10 [@media(max-height:660px)]:pb-8">
            <MangPortrait pose={needsLesson || newChapter ? 'talk' : 'idle_1'} height={72} />
            <Bubble text={mangLine} tail="left" voiceId={mangVoice} />
          </div>
        </Panel>

        <Panel
          as="section"
          aria-label={t.pathLabel}
          className="flex min-h-0 flex-col overflow-y-auto px-6 pt-8 pb-6"
        >
          <StonePath
            stones={[
              ...lessonsBefore(catalog, world, null).map(lessonStone),
              ...views.map((view, index) => ({
                key: view.level.id,
                dimAfter: view === firstLocked,
                node: (
                  <div className="relative">
                    {lessonsBefore(catalog, world, view.level.id).map(blockChip)}
                    <LevelStone
                      view={view}
                      number={levelNumberOf(view.level.id) ?? index + 1}
                      next={view === nextUp && !blockFirst}
                      worldId={world.id}
                    />
                  </div>
                ),
              })),
            ]}
          />
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

interface PathStone {
  key: string;
  /** The way on from this stone is not open yet. */
  dimAfter: boolean;
  node: ReactNode;
}

/** The stones in order on a snaking path (see PATH_COLUMNS); keeps the next stone in view. */
function StonePath({ stones }: { stones: PathStone[] }) {
  const list = useRef<HTMLOListElement>(null);
  const columns = Math.min(PATH_COLUMNS, stones.length);
  useEffect(() => {
    // A longer world scrolls inside the panel: start with the stone to play next in view.
    list.current?.querySelector('[data-next="true"]')?.scrollIntoView({ block: 'nearest' });
  }, []);
  return (
    <ol
      ref={list}
      className="m-auto grid w-full max-w-[960px] list-none gap-y-10 p-0"
      style={{ gridTemplateColumns: `repeat(${String(columns)}, minmax(0, 1fr))` }}
    >
      {stones.map((stone, index) => {
        const row = Math.floor(index / columns);
        const reversed = row % 2 === 1;
        const column = reversed ? columns - 1 - (index % columns) : index % columns;
        const last = index === stones.length - 1;
        const turn = !last && Math.floor((index + 1) / columns) !== row;
        return (
          <li
            key={stone.key}
            className="relative flex justify-center"
            style={{ gridRow: row + 1, gridColumn: column + 1 }}
          >
            {stone.node}
            {!last && (
              <Connector dim={stone.dimAfter} way={turn ? 'down' : reversed ? 'left' : 'right'} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

const CONNECTOR_WAY = {
  // From the stone's edge (48px = half a stone) to the next stone's edge, one cell away.
  right: 'top-1/2 left-[calc(50%+48px)] w-[calc(100%-96px)] -translate-y-1/2',
  left: 'top-1/2 right-[calc(50%+48px)] w-[calc(100%-96px)] -translate-y-1/2',
  down: 'top-full left-1/2 h-10 -translate-x-1/2 flex-col',
} as const;

function Connector({ dim, way }: { dim: boolean; way: keyof typeof CONNECTOR_WAY }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute flex items-center justify-center gap-1.5 ${CONNECTOR_WAY[way]} ${dim ? 'opacity-40' : ''}`}
    >
      <span className="size-2.5 shrink-0 rounded-brick bg-ink-soft" />
      <span className="size-2.5 shrink-0 rounded-brick bg-ink-soft" />
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
        <span className="font-pixel text-[48px] leading-[44px]">{number}</span>
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
      data-next={next}
      className={`${STONE_LIVE} ${next ? 'bg-go' : 'bg-paper'}`}
    >
      {inner}
      {next && <Pulse />}
    </Link>
  );
}
