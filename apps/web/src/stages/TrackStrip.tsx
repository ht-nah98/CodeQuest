import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { vi } from '../i18n/vi';
import { UI_COLORS } from '../ui/tokens';
import {
  STRIP_MAX_CELL_PX,
  stripView,
  type TrackFeed,
  type TrackStripState,
} from './runner/trackStrip';
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
}: {
  state: TrackStripState;
  stageWidth: number;
}) {
  const { cells, bamboo, at } = state;
  const view = stripView(cells.length, stageWidth, at);
  if (view === null) return null;
  const width = cells.length * C + FLAG_ROOM;
  const viewX = view.from * C;
  const viewW = (view.to - view.from) * C;
  // CSS transforms in SVG user units: the marker and the frame glide to the next cell (a short
  // transition, killed by reduced motion in index.css), not timed by a clock of their own.
  const glide = 'transition-transform duration-200 ease-out';
  return (
    <div
      role="img"
      aria-label={vi.play.trackStrip(cells.length, at + 1)}
      data-testid="track-strip"
      data-cells={cells.length}
      data-at={at}
      data-view={`${view.from.toFixed(2)}-${view.to.toFixed(2)}`}
      className="border-b-3 border-ink bg-paper-2 px-2 py-1"
    >
      <svg
        viewBox={`0 0 ${String(width)} ${String(HEIGHT)}`}
        className="mx-auto block h-auto w-full"
        aria-hidden="true"
        style={{ imageRendering: 'pixelated', maxWidth: (width / C) * STRIP_MAX_CELL_PX }}
      >
        <rect x={0} y={0} width={width} height={HEIGHT} fill={UI_COLORS.sky} />
        <TrackCells cells={cells} bamboo={bamboo} seam={3} />
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
 */
export function TrackStrip({ feed }: { feed: TrackFeed }) {
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
  return (
    <div ref={boxRef}>
      <TrackStripView state={state} stageWidth={width} />
    </div>
  );
}
