import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { GoalSprite, SceneTheme } from '@codequest/content-schema';
import { vi } from '../i18n/vi';
import { UI_COLORS } from '../ui/tokens';
import { sceneArt } from './sceneThemes';
import {
  STRIP_MAX_CELL_PX,
  stripLook,
  stripView,
  type TrackFeed,
  type TrackStripState,
} from './runner/trackStrip';
import { isClick } from './planView';
import { SvgPanda, TRACK_CELL, TRACK_GRASS, TRACK_SKY, TrackCells } from './TrackSvg';

const C = TRACK_CELL;
const HEIGHT = TRACK_SKY + TRACK_GRASS;
/** Room right of the last cell: the flag sticks out of its cell a little. */
const FLAG_ROOM = 0.2 * C;

/**
 * The strip itself, for a stage `stageWidth` px wide; nothing when the whole track fits the stage.
 * Exported for unit tests (jsdom has no layout to measure).
 */
export function TrackStripView({
  state,
  stageWidth,
  onDragCell,
  goalSprite,
  theme,
}: {
  state: TrackStripState;
  stageWidth: number;
  /** The world's scenery (P2-23): sky and ground of the strip; absent = Làng Tre. */
  theme?: SceneTheme | undefined;
  /** `level.goalSprite` (P2-11c): drawn on the flag cell instead of the flag. */
  goalSprite?: GoalSprite | undefined;
  /**
   * While set (Măng idle), pressing and dragging on the strip reports the cell under the
   * pointer (fractional), so the play screen can move the stage's view there (P2-22).
   */
  onDragCell?: (cell: number) => void;
}) {
  const { cells, bamboo, items, itemTotal, at, look } = state;
  const pressRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const view = stripView(cells.length, stageWidth, at, look);
  if (view === null) return null;
  const width = cells.length * C + FLAG_ROOM;
  const viewX = view.from * C;
  const viewW = (view.to - view.from) * C;
  // CSS transforms in SVG user units: the marker and the frame glide to the next cell (a short
  // transition, killed by reduced motion in index.css), not timed by a clock of their own.
  const glide = 'transition-transform duration-200 ease-out';
  const report = (event: ReactPointerEvent<SVGSVGElement>) => {
    // A plain click does nothing: the view moves only once the press really drags.
    const press = pressRef.current;
    if (press === null) return;
    if (!press.moved && isClick(event.clientX - press.x, event.clientY - press.y)) return;
    press.moved = true;
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width <= 0) return;
    onDragCell?.(((event.clientX - box.left) / box.width) * (width / C));
  };
  return (
    <div
      role="img"
      aria-label={vi.play.trackStrip(cells.length, at + 1)}
      data-testid="track-strip"
      data-cells={cells.length}
      data-at={at}
      data-view={`${view.from.toFixed(2)}-${view.to.toFixed(2)}`}
      data-peek={look !== undefined}
      data-theme={sceneArt(theme).id}
      className="min-w-0 flex-1 px-2 py-1"
    >
      <svg
        viewBox={`0 0 ${String(width)} ${String(HEIGHT)}`}
        className={`mx-auto block h-auto w-full touch-none ${onDragCell ? 'cursor-grab active:cursor-grabbing' : ''}`}
        aria-hidden="true"
        style={{ imageRendering: 'pixelated', maxWidth: (width / C) * STRIP_MAX_CELL_PX }}
        {...(onDragCell && {
          onPointerDown: (event: ReactPointerEvent<SVGSVGElement>) => {
            if (event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            pressRef.current = { x: event.clientX, y: event.clientY, moved: false };
          },
          onPointerMove: (event: ReactPointerEvent<SVGSVGElement>) => {
            if (event.buttons === 0) pressRef.current = null;
            report(event);
          },
          onPointerUp: () => {
            pressRef.current = null;
          },
          onLostPointerCapture: () => {
            pressRef.current = null;
          },
        })}
      >
        <rect x={0} y={0} width={width} height={HEIGHT} fill={sceneArt(theme).svgSky} />
        <TrackCells
          theme={theme}
          cells={cells}
          bamboo={bamboo}
          items={items}
          seam={3}
          goalSprite={goalSprite}
          goalOpen={itemTotal > 0 && items.length === 0}
        />
        {/* What the big stage shows now: the rest of the strip is dimmed, the part framed. */}
        <g className={glide} style={{ transform: `translateX(${String(viewX)}px)` }}>
          <rect
            x={-width}
            y={0}
            width={width}
            height={HEIGHT}
            fill={UI_COLORS.ink}
            fillOpacity={0.28}
          />
          <rect
            x={viewW}
            y={0}
            width={width}
            height={HEIGHT}
            fill={UI_COLORS.ink}
            fillOpacity={0.28}
          />
          <rect
            data-mark="view"
            x={1.5}
            y={1.5}
            width={viewW - 3}
            height={HEIGHT - 3}
            rx={3}
            fill="none"
            stroke={UI_COLORS.paper}
            strokeWidth={3}
          />
        </g>
        <g
          data-mark="mang"
          className={glide}
          style={{ transform: `translateX(${String(at * C)}px)` }}
        >
          <rect
            x={1}
            y={1}
            width={C - 2}
            height={HEIGHT - 2}
            rx={3}
            fill={UI_COLORS.coin}
            fillOpacity={0.35}
            stroke={UI_COLORS.coinDeep}
            strokeWidth={2.5}
          />
          <SvgPanda pose="idle_1" cx={C / 2} feetY={TRACK_SKY + 1} height={C * 1.35} />
        </g>
      </svg>
    </div>
  );
}

/**
 * The runner's full-track strip under the stage (stage-rendering.md §2, screens-and-flows.md §3):
 * every cell, Măng's live cell and the part the big stage shows. Shown only while the track is
 * wider than the stage. Its width is the stage's (same column), so it measures itself.
 * `action` (the "Xem cả đường" button) sits at its right end; `onShownChange` tells the play
 * screen whether the strip is up, so the button can sit on the stage instead when it is not.
 * `onPeek` (Măng idle only): dragging the strip moves the stage's view (P2-22).
 */
export function TrackStrip({
  feed,
  action,
  onShownChange,
  onPeek,
  goalSprite,
  theme,
}: {
  feed: TrackFeed;
  goalSprite?: GoalSprite;
  /** The world's scenery (P2-23). */
  theme?: SceneTheme;
  action?: ReactNode;
  onShownChange?: (shown: boolean) => void;
  onPeek?: (look: number) => void;
}) {
  const state = useSyncExternalStore(feed.subscribe, feed.getSnapshot);
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      setWidth(Math.floor(box.clientWidth));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => {
      observer.disconnect();
    };
  }, []);
  const cellCount = state.cells.length;
  const shown = stripView(cellCount, width, state.at) !== null;
  // Before paint, so the button never shows in both places for a frame.
  useLayoutEffect(() => {
    onShownChange?.(shown);
  }, [shown, onShownChange]);
  return (
    <div
      ref={boxRef}
      className={shown ? 'flex items-center border-b-3 border-ink bg-paper-2' : undefined}
    >
      <TrackStripView
        state={state}
        stageWidth={width}
        goalSprite={goalSprite}
        theme={theme}
        {...(onPeek && {
          onDragCell: (cell: number) => {
            onPeek(stripLook(cellCount, width, cell));
          },
        })}
      />
      {shown && action !== undefined && <div className="shrink-0 py-0.5 pr-2">{action}</div>}
    </div>
  );
}
