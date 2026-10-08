import type { ReactNode } from 'react';
import {
  type RobotBlock,
  type RobotDir,
  type RobotLabConfig,
  robotlabResolvedSchema,
} from '@codequest/games';
import { vi } from '../../i18n/vi';
import { UI_COLORS } from '../../ui/tokens';
import { mix } from '../colors';
import { pixelDataUrl } from '../sceneSvg';
import { arrivalDir, bumpDir, parseRobotKey, type RobotAnswer, startCell } from './answer';
import {
  BLOCK_CELLS,
  cellsOf,
  DIR_STEP,
  lineSegments,
  MAT_CELLS,
  ROBOT_BODY_CELLS,
  robotGeometry,
} from './layout';
import {
  blockArt,
  blockArtKey,
  BUILDING,
  BUILDING_PALETTES,
  CLAW_CLOSED,
  CLOCK,
  FLASK,
  ROBOT_BODY,
  ROBOT_COLOR_TONES,
  ROBOT_PALETTE,
} from './robotArt';

// The static picture of a robotlab predict answer (stage-rendering.md §4 "Hình đáp án"): the
// test mat drawn from the resolved config as inline SVG, the answer's crossing framed in yellow,
// Bíp there, plus a crash burst, an alarm clock (out of time), a score plate (`score:<n>`) or a
// star (`win`). Same pixel art as the PixiJS stage (robotArt.ts).

/** One board cell in SVG units. */
const M = 16;
const C = UI_COLORS;

const urls = new Map<string, string>();
function artUrl(key: string, rows: readonly string[], palette: Readonly<Record<string, string>>) {
  let url = urls.get(key);
  if (url === undefined) {
    url = pixelDataUrl(rows, palette);
    urls.set(key, url);
  }
  return url;
}

const blockUrl = (block: RobotBlock): string => {
  const { rows, palette } = blockArt(block);
  return artUrl(blockArtKey(block), rows, palette);
};

const ROTATE: Readonly<Record<RobotDir, number>> = { N: 0, E: 90, S: 180, W: -90 };

/** Bíp from above on crossing (row, col), facing `dir`. */
export function SvgBip({
  row,
  col,
  dir,
  held,
}: {
  row: number;
  col: number;
  dir: RobotDir;
  held?: RobotBlock | undefined;
}) {
  const scale = (ROBOT_BODY_CELLS * M) / 16;
  const geometry = robotGeometry(M, scale);
  const cx = (col + 0.5) * M;
  const cy = (row + 0.5) * M;
  const body = 16 * scale;
  const block = BLOCK_CELLS * M;
  return (
    <g
      data-bip={`${String(row)},${String(col)}`}
      data-dir={dir}
      transform={`rotate(${String(ROTATE[dir])} ${String(cx)} ${String(cy)})`}
    >
      <image
        href={artUrl('body', ROBOT_BODY, ROBOT_PALETTE)}
        x={cx - body / 2}
        y={cy + geometry.bodyY - body / 2}
        width={body}
        height={body}
      />
      {held && (
        <image
          href={blockUrl(held)}
          x={cx - block / 2}
          y={cy + geometry.heldY - block / 2}
          width={block}
          height={block}
        />
      )}
      <image
        href={artUrl('claw', CLAW_CLOSED, ROBOT_PALETTE)}
        x={cx - body / 2}
        y={cy + geometry.clawBaseY - 6 * scale}
        width={body}
        height={6 * scale}
      />
    </g>
  );
}

/** The test mat: buildings, zones, stations, lab, black lines, crossing dots and the blocks. */
export function RobotBoardSvg({ config }: { config: RobotLabConfig }) {
  const { map } = config;
  const cells: ReactNode[] = [];
  map.forEach((row, r) => {
    Array.from(row).forEach((tile, c) => {
      const x = c * M;
      const y = r * M;
      const key = `${String(r)},${String(c)}`;
      if (tile === '#') {
        cells.push(
          <image
            key={key}
            href={artUrl(
              `building${String((r + c) % 2)}`,
              BUILDING,
              BUILDING_PALETTES[(r + c) % 2] ?? ROBOT_PALETTE,
            )}
            x={x}
            y={y}
            width={M}
            height={M}
          />,
        );
      } else if (tile === 'Z') {
        cells.push(
          <rect
            key={key}
            data-tile="zone"
            x={x + 1}
            y={y + 1}
            width={M - 2}
            height={M - 2}
            fill={C.oopsSoft}
            stroke={C.oops}
            strokeWidth={1.4}
            strokeDasharray="2.5 1.5"
          />,
        );
      } else if (tile === 'r' || tile === 'y' || tile === 'g') {
        const tones = ROBOT_COLOR_TONES[({ r: 'RED', y: 'YELLOW', g: 'GREEN' } as const)[tile]];
        cells.push(
          <rect
            key={key}
            data-tile="station"
            x={x + 2}
            y={y + 2}
            width={M - 4}
            height={M - 4}
            rx={3}
            fill={tones.light}
            stroke={tones.main}
            strokeWidth={2.4}
          />,
        );
      } else if (tile === 'L') {
        cells.push(
          <g key={key} data-tile="lab">
            <rect
              x={x + 1}
              y={y + 1}
              width={M - 2}
              height={M - 2}
              fill={C.brandSoft}
              stroke={C.brandDeep}
              strokeWidth={1.6}
            />
            <image
              href={artUrl('flask', FLASK, ROBOT_PALETTE)}
              x={x + 2}
              y={y + 2}
              width={6}
              height={6}
            />
          </g>,
        );
      }
    });
  });
  const lineW = 1.6;
  return (
    <g>
      {cells}
      {lineSegments(map).map(([a, b]) => (
        <rect
          key={`${String(a)}-${String(b)}`}
          x={Math.min(a[1], b[1]) * M + M / 2 - lineW / 2}
          y={Math.min(a[0], b[0]) * M + M / 2 - lineW / 2}
          width={Math.abs(b[1] - a[1]) * M + lineW}
          height={Math.abs(b[0] - a[0]) * M + lineW}
          fill={C.ink}
        />
      ))}
      {map.flatMap((row, r) =>
        Array.from(row).flatMap((tile, c) =>
          tile === '#'
            ? []
            : [
                <circle
                  key={`dot${String(r)},${String(c)}`}
                  cx={(c + 0.5) * M}
                  cy={(r + 0.5) * M}
                  r={1.9}
                  fill={C.ink}
                />,
              ],
        ),
      )}
      {(config.blocks ?? []).map(({ at, ...block }) => (
        <image
          key={`block${String(at)}`}
          data-block={block.kind}
          href={blockUrl(block)}
          x={(at[1] + 0.5) * M - (BLOCK_CELLS * M) / 2}
          y={(at[0] + 0.5) * M - (BLOCK_CELLS * M) / 2}
          width={BLOCK_CELLS * M}
          height={BLOCK_CELLS * M}
        />
      ))}
    </g>
  );
}

/** A spiky "bump!" burst centred on (cx, cy). */
function Burst({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const points = Array.from({ length: 16 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.55;
    const angle = (Math.PI * i) / 8 - Math.PI / 2;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
  return (
    <polygon points={points} fill={C.oops} stroke={C.ink} strokeWidth={r * 0.1} data-mark="crash" />
  );
}

function Star({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = (Math.PI * i) / 5 - Math.PI / 2;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
  return (
    <polygon points={points} fill={C.coin} stroke={C.ink} strokeWidth={r * 0.12} data-mark="win" />
  );
}

function Spot({ row, col }: { row: number; col: number }) {
  return (
    <rect
      x={col * M + 0.6}
      y={row * M + 0.6}
      width={M - 1.2}
      height={M - 1.2}
      rx={2}
      fill={C.coin}
      fillOpacity={0.35}
      stroke={C.coinDeep}
      strokeWidth={1.6}
      data-mark="spot"
    />
  );
}

/** The marks of one answer on the board: spot, Bíp, burst, clock, star. */
function AnswerMarks({ config, answer }: { config: RobotLabConfig; answer: RobotAnswer }) {
  const { map } = config;
  const lab = cellsOf(map, 'L')[0] ?? startCell(config);
  const start = startCell(config);
  if (answer.outcome === 'score') return null;
  if (answer.outcome === 'timeout' || answer.outcome === 'win') {
    // A win with mustReturn ends in the lab; otherwise the key says nothing about where.
    const home =
      answer.outcome === 'win' &&
      config.goal.type === 'missions' &&
      config.goal.mustReturn === true;
    const [r, c] = home ? lab : start;
    return (
      <g data-answer-cell={`${String(r)},${String(c)}`}>
        {home && <Spot row={r} col={c} />}
        <SvgBip row={r} col={c} dir={home ? arrivalDir(config, [r, c]) : config.startDir} />
        {answer.outcome === 'win' ? (
          <Star cx={(c + 0.9) * M} cy={(r + 0.1) * M} r={M * 0.32} />
        ) : (
          <g data-mark="dizzy">
            {[0, 1, 2].map((i) => (
              <Star key={i} cx={(c + 0.2 + i * 0.3) * M} cy={(r + 0.05) * M} r={M * 0.12} />
            ))}
          </g>
        )}
      </g>
    );
  }
  const cell = answer.cell;
  if (cell === null || map[cell[0]]?.[cell[1]] === undefined || map[cell[0]]?.[cell[1]] === '#') {
    return null;
  }
  const [r, c] = cell;
  const dir = arrivalDir(config, cell);
  const bump = answer.reason === null ? null : bumpDir(config, cell, answer.reason);
  return (
    <g data-answer-cell={`${String(r)},${String(c)}`}>
      <Spot row={r} col={c} />
      <SvgBip row={r} col={c} dir={bump ?? dir} />
      {answer.outcome === 'crash' &&
        (bump !== null ? (
          <g data-bump={bump}>
            <Burst
              cx={(c + 0.5 + DIR_STEP[bump][1] / 2) * M}
              cy={(r + 0.5 + DIR_STEP[bump][0] / 2) * M}
              r={M * 0.38}
            />
          </g>
        ) : (
          <Burst cx={(c + 0.85) * M} cy={(r + 0.15) * M} r={M * 0.32} />
        ))}
      {answer.outcome === 'outOfTime' && (
        <image
          data-mark="out-of-time"
          href={artUrl('clock', CLOCK, { ...ROBOT_PALETTE, X: C.oops })}
          x={(c + 0.5) * M}
          y={(r - 0.15) * M}
          width={M * 0.6}
          height={M * 0.6}
        />
      )}
    </g>
  );
}

/**
 * The picture of a robotlab predict answer. `config` must be resolved (shared rules merged);
 * null when it is not, or when the key cannot be read.
 */
export function RobotAnswerPicture({ config, answerKey }: { config: unknown; answerKey: string }) {
  const parsed = robotlabResolvedSchema.safeParse(config);
  const answer = parseRobotKey(answerKey);
  if (!parsed.success || answer === null) return null;
  const board = parsed.data;
  const rows = board.map.length;
  const cols = board.map[0]?.length ?? 0;
  const pad = MAT_CELLS * M;
  // A score plate below the board: "160 điểm".
  const plate = answer.outcome === 'score' ? M * 1.1 : 0;
  const width = cols * M + 2 * pad;
  const height = rows * M + 2 * pad + plate;
  return (
    <svg
      viewBox={`${String(-pad)} ${String(-pad)} ${String(width)} ${String(height)}`}
      className="block h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      data-robot-answer={answer.outcome}
      style={{ imageRendering: 'pixelated' }}
    >
      <rect
        x={-pad}
        y={-pad}
        width={width}
        height={rows * M + 2 * pad}
        fill={C.white}
        stroke={C.ink}
        strokeWidth={1}
      />
      <RobotBoardSvg config={board} />
      <AnswerMarks config={board} answer={answer} />
      {answer.outcome === 'score' && (
        <g data-mark="score" data-points={answer.points ?? 0}>
          <rect
            x={-pad + 2}
            y={rows * M + pad + 1}
            width={width - 4}
            height={plate - 2}
            rx={3}
            fill={mix(C.coinShine, C.paper, 0.3)}
            stroke={C.ink}
            strokeWidth={0.8}
          />
          <text
            x={-pad + width / 2}
            y={rows * M + pad + plate * 0.74}
            textAnchor="middle"
            fontFamily="VT323, monospace"
            fontSize={plate * 0.8}
            fill={C.ink}
          >
            {`${String(answer.points ?? 0)} ${vi.play.robotlab.points}`}
          </text>
        </g>
      )}
    </svg>
  );
}
