import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import type { Level, World } from '@codequest/content-schema';
import { isUnlocked, type LevelProgress } from '@codequest/rewards';
import { useUnlockOverrides } from '../../features/author/authorMode';
import { nextLevelId, unlockContext, useCatalog } from '../../features/content/catalog';
import type { WinReward } from '../../features/play/session';
import { prefersReducedMotion } from '../../features/profiles';
import { useLessonsDone, useProgressMap } from '../../features/progress';
import { vi } from '../../i18n/vi';
import { Bubble, Button, Dialog, PixelIcon } from '../../ui';
import '../shared/screens.css';
import { MangPortrait } from './MangPortrait';

const t = vi.results;

export interface ResultsOverlayProps {
  profileId: string;
  level: Level;
  world: World;
  reward: WinReward;
  onReplay: () => void;
  onWorld: () => void;
  onNext: (levelId: string) => void;
}

const STAR_DELAYS_MS = [250, 550, 850];
const MAX_FLYING_COINS = 8;
const FLY_FROM_RIGHT = 96;

function withLevel(
  map: ReadonlyMap<string, LevelProgress>,
  levelId: string,
  progress: LevelProgress | undefined,
): Map<string, LevelProgress> {
  const next = new Map(map);
  if (progress) next.set(levelId, progress);
  else next.delete(levelId);
  return next;
}

/**
 * Kết quả màn (screens-and-flows.md §2): Măng cheers, the stars pop in one by one, the coins fly
 * into the HUD wallet, "con vừa viết N dòng code", then Màn tiếp / Chơi lại / Về thế giới.
 */
export function ResultsOverlay({
  profileId,
  level,
  world,
  reward,
  onReplay,
  onWorld,
  onNext,
}: ResultsOverlayProps) {
  const catalogState = useCatalog();
  const catalog = catalogState.status === 'ready' ? catalogState.catalog : null;
  const progress = useProgressMap(profileId);
  const lessonsDone = useLessonsDone(profileId);
  const overrides = useUnlockOverrides(catalog);
  const nextRef = useRef<HTMLButtonElement>(null);
  const worldRef = useRef<HTMLButtonElement>(null);
  const totalRef = useRef<HTMLParagraphElement>(null);
  const [flight, setFlight] = useState<{ dx: number; dy: number } | null>(null);

  // What the win opened, judged on progress with this win in (and, for "new world", without):
  // the live query may not have caught up with the write yet.
  const opened = useMemo(() => {
    if (!catalog || !progress || !lessonsDone) return null;
    const after = {
      progress: withLevel(progress, level.id, reward.progressAfter),
      lessonsDone,
      overrides,
    };
    const before = { ...after, progress: withLevel(progress, level.id, reward.progressBefore) };
    const next = nextLevelId(catalog, level.id, after);
    const nextWorld = catalog.worlds.find((w) => w.order === world.order + 1);
    const newWorld =
      nextWorld !== undefined &&
      isUnlocked({ worldId: nextWorld.id }, unlockContext(catalog, after)) &&
      !isUnlocked({ worldId: nextWorld.id }, unlockContext(catalog, before));
    return { next, newWorld };
  }, [catalog, progress, lessonsDone, overrides, level.id, world.order, reward]);

  // Coins fly from the total to the HUD wallet once the stars have landed.
  useEffect(() => {
    if (reward.coins <= 0 || prefersReducedMotion()) return;
    const timer = window.setTimeout(() => {
      const from = totalRef.current?.getBoundingClientRect();
      const to = document.querySelector('[data-hud-coins]')?.getBoundingClientRect();
      if (!from || !to) return;
      // Coins start on the total's coin (FLY_FROM_RIGHT from the row's right edge, 32px wide).
      const fromX = from.right - FLY_FROM_RIGHT - 16;
      const fromY = from.top + 16;
      setFlight({ dx: to.left + 22 - fromX, dy: to.top + to.height / 2 - fromY });
    }, 1100);
    return () => {
      window.clearTimeout(timer);
    };
  }, [reward.coins]);

  const line =
    reward.stars >= 3
      ? t.stars3
      : reward.stars === 2
        ? t.stars2
        : reward.overPar
          ? t.stars1
          : t.stars1Hint;
  const next = opened?.next ?? null;

  return (
    <Dialog
      title={t.title}
      hideTitle
      onClose={onReplay}
      initialFocus={next !== null ? nextRef : worldRef}
      data-testid="play-success"
      className="grid w-[min(640px,calc(100vw-32px))] justify-items-center gap-3 px-8 pt-5 pb-7 text-center"
    >
      <div className="flex items-end gap-2" data-testid="results-stars" data-stars={reward.stars}>
        {[0, 1, 2].map((i) => {
          const lit = i < reward.stars;
          return (
            <span
              key={i}
              className={`${lit ? 'cq-star-in' : ''} ${i === 1 ? '-translate-y-3' : ''}`}
              style={lit ? { animationDelay: `${String(STAR_DELAYS_MS[i] ?? 0)}ms` } : undefined}
            >
              <PixelIcon name={lit ? 'star' : 'star-empty'} scale={4} />
            </span>
          );
        })}
        <span className="sr-only">{vi.ui.starsOf(reward.stars, 3)}</span>
      </div>

      <p aria-hidden="true" className="m-0 font-display text-display">
        {t.title}
      </p>

      <div className="flex items-end gap-3">
        <MangPortrait pose="cheer" height={104} />
        <Bubble text={line} tail="left" className="mb-6 text-left" />
      </div>

      <p
        data-testid="results-lines"
        className="m-0 rounded-chip border-3 border-ink bg-brand-deep px-4 pt-1 font-pixel text-pixel-lg text-paper"
      >
        {t.lines(reward.blocksUsed)}
      </p>

      {opened?.newWorld && (
        <p className="m-0 flex items-center gap-2 font-display text-button font-extrabold text-go-deep">
          <PixelIcon name="crown" scale={2} />
          {t.newWorld}
        </p>
      )}

      <section
        aria-label={t.coinsTitle}
        className="grid w-full gap-1 rounded-chip border-3 border-ink bg-white px-4 py-2"
      >
        {reward.entries.length === 0 ? (
          <p className="m-0 text-ink-soft">{t.noCoins}</p>
        ) : (
          <ul className="m-0 grid list-none gap-0.5 p-0 text-left" data-testid="results-coins">
            {reward.entries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4">
                <span>{t.reasons[entry.reason] ?? entry.reason}</span>
                <span className="font-pixel text-pixel text-coin-deep">+{entry.delta}</span>
              </li>
            ))}
          </ul>
        )}
        {reward.coins > 0 && (
          <p
            ref={totalRef}
            data-testid="results-total"
            className="relative m-0 flex items-center justify-end gap-2 border-t-2 border-dashed border-ink-soft pt-1 font-pixel text-hud"
          >
            <PixelIcon name="coin" scale={2} pop />
            {t.total(reward.coins)}
            {flight &&
              Array.from({ length: Math.min(MAX_FLYING_COINS, reward.coins) }, (_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="cq-coin-fly pointer-events-none absolute top-0 z-10"
                  style={
                    {
                      right: FLY_FROM_RIGHT,
                      '--cq-dx': `${String(flight.dx)}px`,
                      '--cq-dy': `${String(flight.dy)}px`,
                      animationDelay: `${String(i * 70)}ms`,
                    } as CSSProperties
                  }
                >
                  <PixelIcon name="coin" scale={2} />
                </span>
              ))}
          </p>
        )}
      </section>

      <div className="mt-2 flex w-full flex-wrap justify-center gap-3">
        <Button icon="↺" onClick={onReplay}>
          {t.replay}
        </Button>
        <Button ref={worldRef} onClick={onWorld}>
          {t.toWorld}
        </Button>
        {next !== null && (
          <Button
            ref={nextRef}
            variant="go"
            size="md"
            iconAfter={<PixelIcon name="play" scale={1} />}
            data-testid="results-next"
            onClick={() => {
              onNext(next);
            }}
          >
            {t.next}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
