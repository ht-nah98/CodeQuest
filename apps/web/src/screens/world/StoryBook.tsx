import { useEffect, useMemo, useRef, useState } from 'react';
import type { Level, StoryChapter, World } from '@codequest/content-schema';
import type { ChapterState } from '@codequest/rewards';
import { audio } from '../../audio/audio';
import { storyLineVoiceId } from '../../audio/voiceIds';
import { vi } from '../../i18n/vi';
import { Avatar, SpeakButton } from '../../ui';
import { FOCUS_RING } from '../../ui/focusRing';
import { goalRuns } from '../../stages/goalArt';
import { MangPortrait } from '../play/MangPortrait';
import { STORY_PROP_ART } from './storyArt';

const t = vi.world.story;

export interface StoryBookProps {
  world: World;
  states: readonly ChapterState[];
  levels: ReadonlyMap<string, Level>;
  /** Chapters opened since the child last saw this page ("Chương mới!"). */
  fresh: readonly string[];
  /** Page shown first (`openingChapterIndex`). */
  initialPage: number;
  /** The child turned a page or read aloud: the "new chapter" nudge has done its job. */
  onInteract: () => void;
}

/**
 * "Truyện của Măng" (P2-24, screens-and-flows.md §6): the world's tale as a small book on the
 * world page. One chapter per page (picture, title, 2–4 lines, read aloud); dots and arrows turn
 * pages; a locked chapter is a "?" page saying which level opens it.
 */
export function StoryBook({
  world,
  states,
  levels,
  fresh,
  initialPage,
  onInteract,
}: StoryBookProps) {
  const [page, setPage] = useState(initialPage);
  const current = states[page] ?? states[0];
  const voiceIds = useMemo(
    () =>
      current?.unlocked === true
        ? current.chapter.lines.map((_, n) => storyLineVoiceId(world.id, current.chapter.id, n))
        : [],
    [world.id, current],
  );
  const read = useReadAloud(voiceIds);
  if (current === undefined) return null;
  const isFresh = fresh.includes(current.chapter.id);
  const turn = (to: number) => {
    read.stop();
    setPage(Math.max(0, Math.min(states.length - 1, to)));
    onInteract();
  };
  const unlockTitle = (chapter: StoryChapter) => {
    const level = chapter.unlockAfter === undefined ? undefined : levels.get(chapter.unlockAfter);
    return level?.title ?? '';
  };

  return (
    <article
      data-testid="story-book"
      data-chapter={current.chapter.id}
      data-locked={!current.unlocked}
      data-fresh={isFresh}
      className={`relative flex min-h-0 flex-1 flex-col gap-1.5 rounded-panel border-3 border-ink bg-paper p-3 shadow-hard ${
        isFresh ? 'cq-chapter-new' : ''
      }`}
    >
      <ChapterPicture world={world} chapter={current.chapter} locked={!current.unlocked} />
      {/* The numbered page dots show where we are; screen readers hear it on every turn. */}
      <p aria-live="polite" className="sr-only">
        {t.chapterOf(page + 1, states.length)}
      </p>
      {isFresh && (
        <span
          data-testid="story-new"
          className="absolute -top-3 right-4 animate-pop rounded-chip border-3 border-ink bg-coin px-2.5 pt-0.5 font-display text-[17px] leading-6 font-extrabold shadow-key"
        >
          {t.newChapter}
        </span>
      )}

      {current.unlocked ? (
        <>
          <h2 id="world-story" className="m-0 font-display text-[24px] leading-[1.3]">
            {current.chapter.title}
          </h2>
          <ol className="m-0 grid min-h-0 list-none gap-0.5 overflow-y-auto p-0 text-body leading-[1.35]">
            {current.chapter.lines.map((line, n) => (
              <li
                key={n}
                data-reading={read.line === n}
                className="rounded-kbd px-1 data-[reading=true]:bg-coin-shine"
              >
                {line}
              </li>
            ))}
          </ol>
        </>
      ) : (
        <>
          <h2 id="world-story" className="m-0 font-display text-[24px] leading-[1.3]">
            {t.lockedTitle}
          </h2>
          <p className="m-0 text-body leading-[1.4]" data-testid="story-locked-hint">
            {t.lockedHint(unlockTitle(current.chapter))}
          </p>
        </>
      )}

      <nav aria-label={t.pagesLabel} className="mt-auto flex items-center gap-2">
        <PageArrow
          label={t.prev}
          glyph="◀"
          disabled={page === 0}
          onClick={() => {
            turn(page - 1);
          }}
        />
        <ol className="m-0 flex min-w-0 flex-1 list-none flex-wrap items-center justify-center gap-1.5 p-0">
          {states.map((s) => {
            const state = !s.unlocked ? 'locked' : fresh.includes(s.chapter.id) ? 'new' : 'read';
            return (
              <li key={s.chapter.id}>
                <button
                  type="button"
                  data-testid="story-dot"
                  data-state={state}
                  aria-current={s.index === page ? 'page' : undefined}
                  aria-label={
                    s.unlocked ? t.dot(s.index + 1, s.chapter.title) : t.dotLocked(s.index + 1)
                  }
                  onClick={() => {
                    turn(s.index);
                  }}
                  className={`relative grid size-7 cursor-pointer place-items-center rounded-full border-3 border-ink font-display text-[15px] leading-none font-extrabold transition-transform duration-150 hover:-translate-y-px ${FOCUS_RING} ${
                    s.index === page ? 'scale-110 shadow-key' : ''
                  } ${
                    state === 'locked'
                      ? 'bg-paper-2 text-ink-soft'
                      : state === 'new'
                        ? 'bg-coin'
                        : s.index === page
                          ? 'bg-brand-deep text-paper'
                          : 'bg-brand-soft'
                  }`}
                >
                  {state === 'locked' ? '?' : s.index + 1}
                  {state === 'new' && (
                    <span
                      aria-hidden="true"
                      className="cq-float absolute -top-2 -right-2 size-3 rounded-full border-2 border-ink bg-oops"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
        <PageArrow
          label={t.next}
          glyph="▶"
          disabled={page === states.length - 1}
          onClick={() => {
            turn(page + 1);
          }}
        />
        {read.available && (
          <SpeakButton
            onSpeak={() => {
              read.toggle();
              onInteract();
            }}
            speaking={read.line !== null}
          />
        )}
      </nav>
    </article>
  );
}

function PageArrow({
  label,
  glyph,
  disabled,
  onClick,
}: {
  label: string;
  glyph: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      // aria-disabled, not disabled: a focused arrow that turns off must keep the focus.
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`grid size-11 shrink-0 cursor-pointer place-items-center rounded-key border-3 border-ink bg-paper font-display text-[18px] shadow-key transition-transform duration-150 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-[disabled=false]:hover:-translate-y-px aria-[disabled=false]:active:translate-y-0.5 aria-[disabled=false]:active:shadow-button-pressed ${FOCUS_RING}`}
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}

const BACKDROP: Record<NonNullable<World['theme']['palette']>, string> = {
  day: 'bg-sky',
  dusk: 'bg-brand-soft',
  night: 'bg-brand',
};

/** The chapter's pixel picture: Măng, its characters and its landmark on a strip of grass. */
function ChapterPicture({
  world,
  chapter,
  locked,
}: {
  world: World;
  chapter: StoryChapter;
  locked: boolean;
}) {
  const art = STORY_PROP_ART[chapter.art.prop];
  const size = art.rows.length;
  return (
    <div
      aria-hidden="true"
      data-testid="story-picture"
      className={`relative h-[76px] shrink-0 overflow-hidden [@media(max-height:660px)]:h-[62px] rounded-chip border-3 border-ink ${
        locked ? 'bg-paper-2' : BACKDROP[world.theme.palette ?? 'day']
      }`}
    >
      {locked ? (
        <span className="grid h-full place-items-center font-pixel text-[56px] leading-none text-ink-soft">
          ?
        </span>
      ) : (
        <>
          <span className="absolute inset-x-0 bottom-0 h-3 border-t-3 border-ink bg-go" />
          <span className="absolute inset-x-0 bottom-2 flex items-end justify-center gap-3">
            <MangPortrait pose="happy" height={56} />
            {(chapter.art.cast ?? []).map((id) => (
              <Avatar key={id} id={id} scale={3} />
            ))}
            <svg
              width={48}
              height={48}
              viewBox={`0 0 ${String(size)} ${String(size)}`}
              shapeRendering="crispEdges"
              data-prop={chapter.art.prop}
            >
              {goalRuns(art).map((run) => (
                <rect
                  key={`${String(run.x)}-${String(run.y)}`}
                  x={run.x}
                  y={run.y}
                  width={run.w}
                  height={1}
                  fill={run.color}
                />
              ))}
            </svg>
          </span>
        </>
      )}
    </div>
  );
}

/**
 * Reads a chapter aloud line after line (one voice file per line). `available` only when every
 * line has a voice file (`npm run voice`); `line` is the line being read, or null. Turning the
 * page or leaving the screen stops the reading.
 */
function useReadAloud(ids: readonly string[]): {
  available: boolean;
  line: number | null;
  toggle: () => void;
  stop: () => void;
} {
  const [line, setLine] = useState<number | null>(null);
  /** Token of the playback this hook started (`audio.voiceToken`); 0 when not reading. */
  const token = useRef(0);
  const available = ids.length > 0 && ids.every((id) => audio.hasVoice(id));

  const play = (index: number): boolean => {
    const id = ids[index];
    if (id === undefined || !audio.playVoice(id)) return false;
    token.current = audio.voiceToken;
    return true;
  };

  // When the line being read ends, read the next one; another voice taking over ends it.
  useEffect(() => {
    if (line === null) return;
    return audio.subscribe(() => {
      const now = audio.getSpeaking();
      // Our own line, or the next one we are starting right now (playVoice emits synchronously).
      if (now === ids[line] || (now !== null && now === ids[line + 1])) return;
      if (now !== null) {
        token.current = 0;
        setLine(null);
        return;
      }
      const next = line + 1;
      if (next < ids.length && audio.playVoice(ids[next] ?? '')) {
        token.current = audio.voiceToken;
        setLine(next);
      } else {
        token.current = 0;
        setLine(null);
      }
    });
  }, [line, ids]);

  // Leaving the page stops only the playback this book started.
  useEffect(
    () => () => {
      if (token.current !== 0) audio.stopVoice(token.current);
    },
    [],
  );

  const stop = () => {
    if (token.current !== 0) audio.stopVoice(token.current);
    token.current = 0;
    setLine(null);
  };
  return {
    available,
    line,
    stop,
    toggle: () => {
      if (line !== null) {
        stop();
        return;
      }
      if (play(0)) setLine(0);
    },
  };
}
