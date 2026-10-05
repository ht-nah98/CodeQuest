import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router';
import { sceneThemeOf } from '@codequest/content-schema';
import { useMusic } from '../../audio/useAudio';
import { useUnlockOverrides } from '../../features/author/authorMode';
import {
  currentWorldId,
  useCatalog,
  type WorldView,
  worldViews,
} from '../../features/content/catalog';
import { SANDBOX_WORLD_ID } from '../../features/content/sandbox';
import { useSignedInProfile } from '../../features/profiles';
import { useLessonsDone, useProgressMap } from '../../features/progress';
import { vi } from '../../i18n/vi';
import { Bubble, PixelIcon } from '../../ui';
import { FOCUS_RING } from '../../ui/focusRing';
import { MangPortrait } from '../play/MangPortrait';
import { ScreenMessage } from '../shared/ScreenMessage';
import { TopBar } from '../shared/TopBar';
import { Island, type IslandLook } from './Island';

const t = vi.map;

/** The curriculum has 10 worlds (curriculum.md §2); unbuilt ones show as fog islands. */
const MAP_SLOTS = 10;
const SLOT_WIDTH = 236;
const PAD_X = 120;
/** Island tops alternate between two heights along the path (% of the strip). */
const ROW_Y = [36, 58];

type Slot = { kind: 'world'; view: WorldView } | { kind: 'soon'; order: number };

function slotY(index: number): number {
  return ROW_Y[index % ROW_Y.length] ?? 30;
}

/** "/map" Bản đồ phiêu lưu: islands along a path, Măng on the world in progress. */
export default function MapScreen() {
  const profile = useSignedInProfile();
  const state = useCatalog();
  const catalog = state.status === 'ready' ? state.catalog : null;
  const progress = useProgressMap(profile.id);
  const lessonsDone = useLessonsDone(profile.id);
  const overrides = useUnlockOverrides(catalog);
  const stripRef = useRef<HTMLDivElement>(null);
  useMusic('village');

  const views = useMemo(
    () =>
      catalog && progress && lessonsDone
        ? worldViews(catalog, { progress, lessonsDone, overrides })
        : null,
    [catalog, progress, lessonsDone, overrides],
  );
  const current = views ? currentWorldId(views) : null;

  const slots: Slot[] = useMemo(() => {
    if (!views) return [];
    const real = views.filter((v) => v.world.id !== SANDBOX_WORLD_ID);
    const taken = new Set(real.map((v) => v.world.order));
    const soon: Slot[] = [];
    for (let order = 1; order <= MAP_SLOTS; order++) {
      if (!taken.has(order)) soon.push({ kind: 'soon', order });
    }
    const worlds: Slot[] = real.map((view) => ({ kind: 'world', view }));
    const ordered = [...worlds, ...soon].sort((a, b) => orderOf(a) - orderOf(b));
    const sandbox = views.find((v) => v.world.id === SANDBOX_WORLD_ID);
    return sandbox ? [...ordered, { kind: 'world', view: sandbox }] : ordered;
  }, [views]);

  // Bring the island Măng stands on into view.
  useEffect(() => {
    const strip = stripRef.current;
    const island = strip?.querySelector<HTMLElement>('[data-current="true"]');
    if (!strip || !island) return;
    strip.scrollLeft = Math.max(0, island.offsetLeft - strip.clientWidth / 2 + 120);
  }, [current]);

  if (state.status === 'error') return <ScreenMessage text={t.loadError} alert />;

  const width = PAD_X * 2 + Math.max(0, slots.length - 1) * SLOT_WIDTH + 200;

  return (
    <main className="grid h-dvh min-h-[500px] grid-rows-[auto_minmax(0,1fr)] gap-3 bg-ground p-3">
      <TopBar fullHud>
        <h1 className="m-0 truncate font-display text-[28px] text-paper">{t.title}</h1>
      </TopBar>

      <section
        aria-label={t.title}
        className="cq-sky relative min-h-0 overflow-hidden rounded-panel border-3 border-ink shadow-hard"
      >
        {!views ? (
          <p className="m-0 grid h-full place-items-center text-bubble font-bold">{t.loading}</p>
        ) : (
          <div
            ref={stripRef}
            className="h-full overflow-x-auto overflow-y-hidden"
            data-testid="map-strip"
          >
            <div className="relative h-full" style={{ width }}>
              <Path slots={slots.length} />
              <ol className="m-0 list-none p-0">
                {slots.map((slot, index) => (
                  <li
                    key={slot.kind === 'world' ? slot.view.world.id : `soon-${String(slot.order)}`}
                    className="absolute -translate-x-1/2"
                    style={{
                      left: PAD_X + index * SLOT_WIDTH + 84,
                      top: `${String(slotY(index))}%`,
                    }}
                  >
                    {slot.kind === 'world' ? (
                      <WorldIsland
                        view={slot.view}
                        current={slot.view.world.id === current}
                        greeting={t.greeting(profile.nickname)}
                      />
                    ) : (
                      <SoonIsland order={slot.order} />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function orderOf(slot: Slot): number {
  return slot.kind === 'world' ? slot.view.world.order : slot.order;
}

/** Dashed trail through the island centres. */
function Path({ slots }: { slots: number }) {
  if (slots < 2) return null;
  const points = Array.from({ length: slots }, (_, i) => ({
    x: PAD_X + i * SLOT_WIDTH + 84,
    y: slotY(i) + 9,
  }));
  const d = points
    .map((p, i) => {
      if (i === 0) return `M ${String(p.x)} ${String(p.y)}`;
      const prev = points[i - 1] ?? p;
      const mid = (prev.x + p.x) / 2;
      return `C ${String(mid)} ${String(prev.y)} ${String(mid)} ${String(p.y)} ${String(p.x)} ${String(p.y)}`;
    })
    .join(' ');
  const width = PAD_X * 2 + (slots - 1) * SLOT_WIDTH + 200;
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full"
      width={width}
      viewBox={`0 0 ${String(width)} 100`}
      preserveAspectRatio="none"
    >
      <path
        d={d}
        fill="none"
        className="stroke-ink"
        strokeWidth={10}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={d}
        fill="none"
        className="stroke-paper"
        strokeWidth={5}
        strokeDasharray="14 10"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const PLATE =
  'grid min-w-[188px] justify-items-center gap-0.5 rounded-chip border-3 border-ink px-3 pt-1 pb-2 text-center shadow-key';

function WorldIsland({
  view,
  current,
  greeting,
}: {
  view: WorldView;
  current: boolean;
  greeting: string;
}) {
  const { world, status } = view;
  const sandbox = world.id === SANDBOX_WORLD_ID;
  const look: IslandLook = status === 'locked' ? 'locked' : status === 'done' ? 'done' : 'open';
  const statusText =
    status === 'locked'
      ? t.locked
      : status === 'done'
        ? t.done
        : t.levelsDone(view.levelsDone, view.levelCount);
  const eyebrow = sandbox ? t.sandbox : t.worldNumber(world.order);

  const body = (
    <>
      <span className="relative block">
        {current && (
          <span className="absolute -top-[118px] left-1/2 flex -translate-x-[28%] items-end gap-1">
            <span className="cq-float block">
              <MangPortrait pose="idle_1" height={88} />
            </span>
            <Bubble text={greeting} tail="left" className="mb-14 whitespace-nowrap text-body" />
          </span>
        )}
        <Island look={look} theme={sceneThemeOf(world)} />
        {status === 'locked' && (
          <span className="absolute top-1 left-1/2 -translate-x-1/2">
            <PixelIcon name="lock" scale={3} />
          </span>
        )}
        {status === 'done' && (
          <span className="absolute top-0 left-1/2 -translate-x-1/2">
            <PixelIcon name="crown" scale={3} />
          </span>
        )}
      </span>
      <span
        className={`${PLATE} ${status === 'locked' ? 'bg-paper-2 text-ink-soft' : 'bg-paper text-ink'}`}
      >
        <span className="font-pixel text-pixel-sm text-brand-deep uppercase">{eyebrow}</span>
        <span className="font-display text-[24px] leading-tight font-extrabold">{world.title}</span>
        <span className="flex items-center gap-1.5 text-small font-bold">
          {status !== 'locked' && view.maxStars > 0 && (
            <>
              <PixelIcon name="star" scale={1} />
              <span className="font-pixel text-pixel-sm">
                {view.stars}/{view.maxStars}
              </span>
              <span aria-hidden="true">·</span>
            </>
          )}
          {statusText}
        </span>
      </span>
    </>
  );

  const label = t.worldLabel(world.order, world.title, statusText);
  if (status === 'locked') {
    return (
      <div
        role="img"
        aria-label={label}
        data-current={current}
        data-world={world.id}
        data-theme={sceneThemeOf(world)}
        className="grid justify-items-center gap-1"
      >
        {body}
      </div>
    );
  }
  return (
    <Link
      to={`/w/${world.id}`}
      aria-label={label}
      data-current={current}
      data-world={world.id}
      data-theme={sceneThemeOf(world)}
      className={`group grid justify-items-center gap-1 rounded-panel p-1 transition-transform duration-150 ease-bounce hover:-translate-y-1.5 ${FOCUS_RING}`}
    >
      {body}
    </Link>
  );
}

function SoonIsland({ order }: { order: number }) {
  return (
    <div
      role="img"
      aria-label={t.worldLabel(order, t.comingSoon, t.locked)}
      className="grid justify-items-center gap-1 opacity-80"
    >
      <span className="relative block">
        <Island look="locked" />
        <span className="absolute top-0 left-1/2 -translate-x-1/2 font-pixel text-pixel-lg text-ink-soft">
          ?
        </span>
      </span>
      <span className={`${PLATE} bg-paper-2 text-ink-soft`}>
        <span className="font-pixel text-pixel-sm uppercase">{t.worldNumber(order)}</span>
        <span className="font-display text-[22px] leading-tight font-extrabold">
          {t.comingSoon}
        </span>
      </span>
    </div>
  );
}
