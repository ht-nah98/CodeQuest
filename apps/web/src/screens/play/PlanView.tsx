import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  memo,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { GoalSprite } from '@codequest/content-schema';
import type { MazeConfig, RunnerConfig } from '@codequest/games';
import { uiVoiceId } from '../../audio';
import { vi } from '../../i18n/vi';
import type { MazePlanState } from '../../stages/maze/mazeFeed';
import type { PlanSource } from '../../stages/planSource';
import {
  cellAt,
  clampPan,
  isClick,
  keyPan,
  panToCentre,
  type Point,
  type Size,
  toggleMark,
  wheelPan,
} from '../../stages/planView';
import type { TrackStripState } from '../../stages/runner/trackStrip';
import {
  MAZE_CELL,
  MazeArrow,
  MazeBoard,
  SvgPanda,
  TRACK_CELL,
  TRACK_GRASS,
  TRACK_SKY,
  TrackCells,
} from '../../stages/TrackSvg';
import { Button, Panel, PixelIcon, SpeakButton } from '../../ui';
import { UI_COLORS } from '../../ui/tokens';
import { useModalDialog } from './useModalDialog';

const t = vi.play.plan;

// "Xem cả đường" (P2-22, stage-rendering.md §4, screens-and-flows.md §3): the selected map as a
// big static SVG (the same pieces as the strip and the answer cards, no second PixiJS app) in a
// window the child pans by dragging, the wheel or the arrow keys. A ruler counts the cells (the
// only place with cell numbers); a click marks a cell. Marks are a planning aid: kept while the
// level is open, never saved.

/** On-screen size of one runner cell: 3 × the 18 px Kenney tile, so the tiles stay crisp. */
const RUNNER_CELL_PX = 54;
/** Room right of the flag, in picture units (the flag sticks out of its cell). */
const FLAG_ROOM = 0.2 * TRACK_CELL;
/** Maze cells: ×5 or ×4 the 12-texel tiles; big maps get the smaller cells and pan instead. */
const MAZE_BIG_PX = 60;
const MAZE_SMALL_PX = 48;
const MAZE_BIG_MAX_ROWS = 7;
/** Height of the column ruler and width of the row ruler, px. */
const RULER_PX = 30;
/** A track up to this wide (px) gets a card that hugs it; a longer one fills the width. */
const NARROW_MAX_PX = 1000;
/** A wheel turn in lines (deltaMode 1) is this many px. */
const WHEEL_LINE_PX = 40;

/** Picture of the map: size in px, the cell grid for hit-testing, and how it is drawn. */
interface Picture {
  size: Size;
  cols: number;
  rows: number;
  cellPx: Size;
  /** Măng's cell, to centre the window on when the view opens. */
  at: { row: number; col: number };
  content: ReactNode;
  /** Cells numbered on the rulers; start / goal columns get a coloured pill (runner). */
  startCol: number | null;
  goalCol: number | null;
  label: string;
}

const markKey = (row: number, col: number, kind: PlanSource['kind']) =>
  kind === 'runner' ? String(col) : `${String(row)},${String(col)}`;

function MarkRect({ x, y, w, h, id }: { x: number; y: number; w: number; h: number; id: string }) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={Math.min(w, h) * 0.1}
      fill={UI_COLORS.hint}
      fillOpacity={0.5}
      stroke={UI_COLORS.ink}
      strokeWidth={Math.min(w, h) * 0.05}
      strokeDasharray={`${String(Math.min(w, h) * 0.15)} ${String(Math.min(w, h) * 0.1)}`}
      data-marked={id}
    />
  );
}

function runnerPicture(
  config: RunnerConfig,
  { cells, bamboo, items, itemTotal, at }: TrackStripState,
  marks: readonly string[],
  goalSprite: GoalSprite | undefined,
): Picture {
  const C = TRACK_CELL;
  const height = TRACK_SKY + TRACK_GRASS;
  const width = cells.length * C + FLAG_ROOM;
  const k = RUNNER_CELL_PX / C;
  const flag = config.cells.indexOf('flag');
  return {
    size: { width: Math.round(width * k), height: Math.round(height * k) },
    cols: cells.length,
    rows: 1,
    cellPx: { width: RUNNER_CELL_PX, height: Math.round(height * k) },
    at: { row: 0, col: at },
    startCol: config.start,
    goalCol: flag >= 0 ? flag : null,
    label: t.track(cells.length, at + 1),
    content: (
      <svg
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        width={Math.round(width * k)}
        height={Math.round(height * k)}
        className="block"
        aria-hidden="true"
        style={{ imageRendering: 'pixelated' }}
      >
        <rect x={0} y={0} width={width} height={height} fill={UI_COLORS.sky} />
        <TrackCells
          cells={cells}
          bamboo={bamboo}
          items={items}
          goalSprite={goalSprite}
          goalOpen={itemTotal > 0 && items.length === 0}
        />
        {marks.map((key) => (
          <MarkRect key={key} id={key} x={Number(key) * C + 1} y={1} w={C - 2} h={height - 2} />
        ))}
        <g data-mark="mang" data-at={at}>
          <rect
            x={at * C + 1}
            y={1}
            width={C - 2}
            height={height - 2}
            rx={3}
            fill={UI_COLORS.coin}
            fillOpacity={0.3}
            stroke={UI_COLORS.coinDeep}
            strokeWidth={1.5}
          />
          <SvgPanda pose="idle_1" cx={at * C + C / 2} feetY={TRACK_SKY + 1} height={C * 1.35} />
        </g>
      </svg>
    ),
  };
}

function mazePicture(
  config: MazeConfig,
  { at, dir, bamboo, items, itemTotal }: MazePlanState,
  marks: readonly string[],
  goalSprite: GoalSprite | undefined,
): Picture {
  const M = MAZE_CELL;
  const rows = config.map.length;
  const cols = config.map[0]?.length ?? 0;
  const px = rows <= MAZE_BIG_MAX_ROWS ? MAZE_BIG_PX : MAZE_SMALL_PX;
  const [r, c] = at;
  return {
    size: { width: cols * px, height: rows * px },
    cols,
    rows,
    cellPx: { width: px, height: px },
    at: { row: r, col: c },
    startCol: null,
    goalCol: null,
    label: t.maze(rows, cols),
    content: (
      <svg
        viewBox={`0 0 ${String(cols * M)} ${String(rows * M)}`}
        width={cols * px}
        height={rows * px}
        className="block"
        aria-hidden="true"
        style={{ imageRendering: 'pixelated' }}
      >
        <MazeBoard
          config={config}
          bamboo={bamboo}
          items={items}
          goalSprite={goalSprite}
          goalOpen={itemTotal > 0 && items.length === 0}
        />
        {marks.map((key) => {
          const [mr = 0, mc = 0] = key.split(',').map(Number);
          return (
            <MarkRect
              key={key}
              id={key}
              x={mc * M + 0.6}
              y={mr * M + 0.6}
              w={M - 1.2}
              h={M - 1.2}
            />
          );
        })}
        <g data-mark="mang" data-at={`${String(r)},${String(c)}`}>
          <rect
            x={c * M + 0.6}
            y={r * M + 0.6}
            width={M - 1.2}
            height={M - 1.2}
            rx={1.2}
            fill={UI_COLORS.coin}
            fillOpacity={0.3}
            stroke={UI_COLORS.coinDeep}
            strokeWidth={0.8}
          />
          <SvgPanda pose="idle_1" cx={c * M + M / 2} feetY={r * M + M - 0.5} height={M * 1.1} />
          <MazeArrow dir={dir} cx={c * M + M * 0.82} cy={r * M + M * 0.2} size={M * 0.45} />
        </g>
      </svg>
    ),
  };
}

interface RulerAxis {
  axis: 'cols' | 'rows';
  count: number;
  cellPx: number;
  startCol: number | null;
  goalCol: number | null;
}

/** The ticks and numbers of a ruler; memoised, so panning only moves them (Ruler's translate). */
const RulerTicks = memo(function RulerTicks({ axis, count, cellPx, startCol, goalCol }: RulerAxis) {
  const across = axis === 'cols';
  const span = count * cellPx;
  const items = Array.from({ length: count }, (_, i) => {
    const pill = i === startCol ? UI_COLORS.go : i === goalCol ? UI_COLORS.coin : null;
    const fifth = (i + 1) % 5 === 0;
    const mid = i * cellPx + cellPx / 2;
    const tick = i * cellPx;
    return (
      <g
        key={i}
        data-tick={i + 1}
        {...(pill && { 'data-pill': i === startCol ? 'start' : 'goal' })}
      >
        {across ? (
          <line
            x1={tick}
            y1={0}
            x2={tick}
            y2={fifth ? 10 : 6}
            stroke={UI_COLORS.ink}
            strokeWidth={2}
          />
        ) : (
          <line
            x1={0}
            y1={tick}
            x2={fifth ? 10 : 6}
            y2={tick}
            stroke={UI_COLORS.ink}
            strokeWidth={2}
          />
        )}
        {pill && (
          <rect
            x={across ? mid - 15 : 3}
            y={across ? 7 : mid - 11}
            width={across ? 30 : RULER_PX - 6}
            height={22}
            rx={6}
            fill={pill}
            stroke={UI_COLORS.ink}
            strokeWidth={2}
          />
        )}
        <text
          x={across ? mid : RULER_PX / 2}
          y={across ? 25 : mid + 6}
          textAnchor="middle"
          className="font-pixel"
          fontSize={fifth ? 24 : 20}
          fontWeight={fifth ? 700 : 400}
          fill={fifth || pill ? UI_COLORS.ink : UI_COLORS.inkSoft}
        >
          {i + 1}
        </text>
      </g>
    );
  });
  return (
    <>
      {items}
      {across ? (
        <line x1={span} y1={0} x2={span} y2={6} stroke={UI_COLORS.ink} strokeWidth={2} />
      ) : (
        <line x1={0} y1={span} x2={6} y2={span} stroke={UI_COLORS.ink} strokeWidth={2} />
      )}
    </>
  );
});

/** Cell numbers along one axis, from 1; every 5th is bigger so counting long rows is easy. */
function Ruler({
  offset,
  length,
  ...ticks
}: RulerAxis & {
  /** Where cell 0 starts in the window (px): follows the pan. */
  offset: number;
  /** Length of the window along this axis (px). */
  length: number;
}) {
  const { axis, count, cellPx } = ticks;
  const across = axis === 'cols';
  const span = count * cellPx;
  return (
    <div
      aria-hidden="true"
      data-testid={`plan-ruler-${axis}`}
      data-count={count}
      className="relative overflow-hidden bg-paper-2"
      style={across ? { height: RULER_PX, width: length } : { width: RULER_PX, height: length }}
    >
      <svg
        width={across ? span + 2 : RULER_PX}
        height={across ? RULER_PX : span + 2}
        className="absolute top-0 left-0 block"
        style={{
          transform: across ? `translateX(${String(offset)}px)` : `translateY(${String(offset)}px)`,
        }}
      >
        <RulerTicks {...ticks} />
      </svg>
    </div>
  );
}

/** Where the content's top-left sits in the window: centred on an axis that fits, else -pan. */
function contentOffset(pan: Point, content: Size, view: Size): Point {
  return {
    x: content.width <= view.width ? Math.floor((view.width - content.width) / 2) : -pan.x,
    y: content.height <= view.height ? Math.floor((view.height - content.height) / 2) : -pan.y,
  };
}

export function PlanView({
  source,
  mapNumber,
  marks,
  onMarks,
  onClose,
}: {
  source: PlanSource;
  /** Multi-map levels: the number of the map shown (1-based); `null` for one map. */
  mapNumber: number | null;
  marks: readonly string[];
  onMarks: (next: string[]) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  // Focus lands on the picture window, so the arrow keys pan at once.
  useModalDialog(ref, onClose, viewRef);
  const titleId = useId();
  const labelId = useId();
  const keysId = useId();
  // Every replay event re-renders (a paused run shows where Măng stands).
  const snapshot = useSyncExternalStore<TrackStripState | MazePlanState>(
    source.feed.subscribe,
    source.feed.getSnapshot,
  );
  // Drawn again only when the map, Măng or the marks change, never while panning.
  const picture = useMemo(
    () =>
      source.kind === 'runner'
        ? runnerPicture(source.config, snapshot as TrackStripState, marks, source.goalSprite)
        : mazePicture(source.config, snapshot as MazePlanState, marks, source.goalSprite),
    [source, snapshot, marks],
  );

  const [view, setView] = useState<Size>({ width: 0, height: 0 });
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const content = picture.size;
  const shown = clampPan(pan, content, view);
  const offset = contentOffset(shown, content, view);
  // Latest values for the native wheel listener and the first measure.
  const live = useRef({ content, view, picture });
  useLayoutEffect(() => {
    live.current = { content, view, picture };
  });

  useEffect(() => {
    const box = viewRef.current;
    if (!box) return;
    let first = true;
    const measure = () => {
      const next = { width: box.clientWidth, height: box.clientHeight };
      setView(next);
      if (first && next.width > 0) {
        // Open on Măng's cell.
        first = false;
        const { picture: p } = live.current;
        setPan(
          panToCentre(
            {
              x: p.at.col * p.cellPx.width,
              y: p.at.row * p.cellPx.height,
              width: p.cellPx.width,
              height: p.cellPx.height,
            },
            p.size,
            next,
          ),
        );
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    // The wheel pans the picture, never the page: a non-passive listener can preventDefault.
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const scale = event.deltaMode === 1 ? WHEEL_LINE_PX : 1;
      const { content: size, view: frame } = live.current;
      setPan((current) =>
        wheelPan(
          clampPan(current, size, frame),
          { dx: event.deltaX * scale, dy: event.deltaY * scale, shift: event.shiftKey },
          size,
          frame,
        ),
      );
    };
    box.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      observer.disconnect();
      box.removeEventListener('wheel', onWheel);
    };
  }, []);

  const drag = useRef<{ x: number; y: number; from: Point; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, from: shown, moved: false };
    setDragging(true);
  };
  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const press = drag.current;
    if (!press) return;
    // The button came up outside the window (no pointerup reached us): the drag is over.
    if (event.buttons === 0) {
      endDrag();
      return;
    }
    const dx = event.clientX - press.x;
    const dy = event.clientY - press.y;
    if (!press.moved && isClick(dx, dy)) return;
    press.moved = true;
    setPan(clampPan({ x: press.from.x - dx, y: press.from.y - dy }, content, view));
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const press = drag.current;
    endDrag();
    if (!press || press.moved) return;
    const box = event.currentTarget.getBoundingClientRect();
    toggleCellAt({ x: event.clientX - box.left, y: event.clientY - box.top });
  };
  /** Marks / unmarks the cell under `point` (px in the window). */
  const toggleCellAt = (point: Point) => {
    const cell = cellAt(
      { x: point.x - offset.x, y: point.y - offset.y },
      { cols: picture.cols, rows: picture.rows, cell: picture.cellPx },
    );
    if (cell) onMarks(toggleMark(marks, markKey(cell.row, cell.col, source.kind)));
  };
  // Keyboard marking works on the cell in the middle of the window (framed while focused).
  const centre = cellAt(
    { x: view.width / 2 - offset.x, y: view.height / 2 - offset.y },
    { cols: picture.cols, rows: picture.rows, cell: picture.cellPx },
  );
  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleCellAt({ x: view.width / 2, y: view.height / 2 });
      return;
    }
    const next = keyPan(shown, event.key, picture.cellPx, content, view);
    if (next === null) return;
    event.preventDefault();
    setPan(next);
  };

  const maze = source.kind === 'maze';
  const title = maze ? t.titleMaze : t.title;
  // A short track or any maze: the card hugs the picture; a long track fills the width and pans.
  const narrow = maze || content.width <= NARROW_MAX_PX;

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-40 grid place-items-center bg-ink/40 p-4"
      onMouseDown={(event) => {
        // preventDefault: the press must not move focus off the button the view gives it back to.
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        onClose();
      }}
    >
      <Panel
        as="section"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="plan-view"
        data-kind={source.kind}
        className={`flex max-h-full animate-pop flex-col gap-2 p-4 ${narrow ? 'w-fit max-w-full' : 'w-[min(1200px,100%)]'}`}
      >
        <header className="flex flex-wrap items-center gap-3">
          <PixelIcon name="magnifier" scale={2} />
          <h2 id={titleId} className="m-0 text-title leading-tight">
            {title}
            {mapNumber !== null && (
              <span data-testid="plan-map" className="text-ink-soft">
                {' · '}
                {vi.play.plan.onMap(mapNumber)}
              </span>
            )}
          </h2>
          <p className="m-0 flex items-center gap-2 font-bold text-ink-soft">
            {t.help}
            <SpeakButton voiceId={uiVoiceId('play.plan.help')} />
          </p>
          <Button
            size="sm"
            className="ml-auto"
            onClick={onClose}
            aria-label={t.close}
            data-testid="plan-close"
          >
            ✕
          </Button>
        </header>

        <div
          className={`grid min-h-0 border-3 border-ink bg-paper-2 ${narrow ? 'self-center' : ''}`}
          style={{
            gridTemplateColumns: `${maze ? `${String(RULER_PX)}px ` : ''}minmax(0,${
              narrow ? `${String(content.width)}px` : '1fr'
            })`,
          }}
        >
          {maze && (
            <Ruler
              axis="rows"
              count={picture.rows}
              cellPx={picture.cellPx.height}
              offset={offset.y}
              length={view.height}
              startCol={null}
              goalCol={null}
            />
          )}
          <div
            ref={viewRef}
            tabIndex={0}
            role="group"
            aria-roledescription={t.viewRole}
            aria-labelledby={labelId}
            aria-describedby={keysId}
            data-testid="plan-viewport"
            data-pan-x={shown.x}
            data-pan-y={shown.y}
            data-max-pan-x={Math.max(0, content.width - view.width)}
            data-max-pan-y={Math.max(0, content.height - view.height)}
            className={`group relative min-h-0 touch-none overflow-hidden bg-sky outline-none select-none focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-brand-deep ${
              dragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              height: content.height,
              maxHeight: maze ? 'calc(100dvh - 15rem)' : undefined,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            onKeyDown={onKeyDown}
          >
            <span id={labelId} className="sr-only">
              {picture.label}
            </span>
            <span id={keysId} className="sr-only">
              {t.keys}
            </span>
            <div
              className="absolute top-0 left-0"
              style={{ transform: `translate(${String(offset.x)}px, ${String(offset.y)}px)` }}
            >
              {picture.content}
            </div>
            {centre && (
              <div
                aria-hidden="true"
                data-testid="plan-centre"
                className="pointer-events-none absolute hidden rounded-sm border-3 border-dashed border-brand-deep group-focus-visible:block"
                style={{
                  left: offset.x + centre.col * picture.cellPx.width,
                  top: offset.y + centre.row * picture.cellPx.height,
                  width: picture.cellPx.width,
                  height: picture.cellPx.height,
                }}
              />
            )}
          </div>
          {maze && <div aria-hidden="true" />}
          <Ruler
            axis="cols"
            count={picture.cols}
            cellPx={picture.cellPx.width}
            offset={offset.x}
            length={view.width}
            startCol={picture.startCol}
            goalCol={picture.goalCol}
          />
        </div>

        <footer className="flex flex-wrap items-center gap-x-5 gap-y-1 text-small font-bold">
          {!maze && (
            <>
              <Legend
                swatch={<span className="block size-4 rounded-sm border-2 border-ink bg-go" />}
              >
                {t.start}
              </Legend>
              <Legend
                swatch={<span className="block size-4 rounded-sm border-2 border-ink bg-coin" />}
              >
                {t.goal}
              </Legend>
            </>
          )}
          <Legend
            swatch={
              <span className="block size-4 rounded-sm border-2 border-coin-deep bg-coin/30" />
            }
          >
            {t.mang}
          </Legend>
          <Legend
            swatch={
              <span className="block size-4 rounded-sm border-2 border-dashed border-ink bg-hint/50" />
            }
          >
            {t.marked}
          </Legend>
          <span className="ml-auto text-ink-soft" aria-live="polite" data-testid="plan-marks">
            {marks.length > 0 ? t.marks(marks.length) : ''}
          </span>
        </footer>
      </Panel>
    </div>
  );
}

function Legend({ swatch, children }: { swatch: ReactNode; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      {swatch}
      {children}
    </span>
  );
}
