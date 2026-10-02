import type { ReactNode } from 'react';
import type { GameKindId } from '@codequest/content-schema';
import {
  mazeConfigSchema,
  type MazeConfig,
  runnerConfigSchema,
  type RunnerConfig,
} from '@codequest/games';
import sheetJson from '../../public/sprites/panda.json?raw';
import {
  type AnswerOutcome,
  mazeCell,
  parseAnswerKey,
  type ParsedAnswer,
  runnerCell,
} from '../features/play/answerKey';
import { BLOCK_COLORS, UI_COLORS } from '../ui/tokens';
import { shade } from './colors';

// Small static pictures of a predict answer (stage-rendering.md §4 "Hình đáp án"): the level's
// board drawn from its config as inline SVG, the answer cell framed in yellow and Măng in a pose
// that tells the outcome. Deliberately not a PixiJS renderer: 3–4 cards would each need a WebGL
// context, and an SVG is crisp at any card size, needs no async load and is easy to test.

const PANDA_SHEET = JSON.parse(sheetJson) as {
  frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
  meta: { size: { w: number; h: number } };
};

type Pose = 'cheer' | 'idle_1' | 'talk' | 'jump' | 'crouch';

const POSE: Record<AnswerOutcome, Pose> = {
  win: 'cheer',
  stop: 'idle_1',
  missed: 'talk',
  crash: 'crouch',
};

const tile = (name: string) => `/tiles/${name}.png`;

/** Măng, `height` units tall, feet centred on (cx, feetY); `flip` mirrors her (facing left). */
function Panda({
  pose,
  cx,
  feetY,
  height,
  flip = false,
}: {
  pose: Pose;
  cx: number;
  feetY: number;
  height: number;
  flip?: boolean;
}) {
  const frame = PANDA_SHEET.frames[`${pose}.png`]?.frame ?? PANDA_SHEET.frames['idle_1.png']?.frame;
  if (!frame) return null;
  const width = (frame.w / frame.h) * height;
  const { w, h } = PANDA_SHEET.meta.size;
  return (
    <g
      data-panda={pose}
      data-flip={flip}
      transform={flip ? `translate(${String(2 * cx)} 0) scale(-1 1)` : undefined}
    >
      <svg
        x={cx - width / 2}
        y={feetY - height}
        width={width}
        height={height}
        viewBox={`${String(frame.x)} ${String(frame.y)} ${String(frame.w)} ${String(frame.h)}`}
      >
        <image href="/sprites/panda.png" width={w} height={h} />
      </svg>
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
    <polygon
      points={points}
      fill={UI_COLORS.oops}
      stroke={UI_COLORS.ink}
      strokeWidth={r * 0.1}
      data-mark="crash"
    />
  );
}

/** A five-point star centred on (cx, cy): the win mark. */
function Star({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = (Math.PI * i) / 5 - Math.PI / 2;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
  return (
    <polygon
      points={points}
      fill={UI_COLORS.coin}
      stroke={UI_COLORS.ink}
      strokeWidth={r * 0.12}
      data-mark="win"
    />
  );
}

/** The lit answer cell: a coin-yellow frame with a soft fill. */
function Spot({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={Math.min(w, h) * 0.12}
      fill={UI_COLORS.coin}
      fillOpacity={0.35}
      stroke={UI_COLORS.coinDeep}
      strokeWidth={Math.min(w, h) * 0.1}
      data-mark="spot"
    />
  );
}

// ---- Runner: one lane of cells -----------------------------------------------------------------
// No cell numbers: the stage shows none, and option labels name places, not numbers
// (content-authoring.md §3). The yellow frame on the key cell is the "where".

const C = 24;
/** Bands of the runner picture, top to bottom: sky (Măng, obstacles), grass. */
const SKY = 1.6 * C;
const GRASS = 0.55 * C;

function RunnerAnswer({ config, answer }: { config: RunnerConfig; answer: ParsedAnswer }) {
  const { cells } = config;
  const flagCell = cells.indexOf('flag');
  const cell = answer.outcome === 'win' ? flagCell : runnerCell(answer);
  const lit = cell !== null && cell >= 0 && cell < cells.length ? cell : null;
  const width = cells.length * C;
  const height = SKY + GRASS;
  const items: ReactNode[] = [];
  cells.forEach((kind, i) => {
    const x = i * C;
    const key = String(i);
    if (kind === 'hole') {
      items.push(
        <rect
          key={`c${key}`}
          x={x}
          y={SKY + 2}
          width={C}
          height={GRASS}
          fill={UI_COLORS.ink}
          fillOpacity={0.82}
        />,
      );
    } else {
      items.push(
        <image
          key={`c${key}`}
          href={tile('ground')}
          x={x}
          y={SKY}
          width={C}
          height={C}
          opacity={i % 2 === 1 ? 0.85 : 1}
        />,
      );
      if (i > 0 && cells[i - 1] !== 'hole') {
        items.push(
          <rect
            key={`s${key}`}
            x={x - 0.75}
            y={SKY + 1}
            width={1.5}
            height={GRASS}
            fill={UI_COLORS.ink}
            fillOpacity={0.55}
          />,
        );
      }
    }
    if (kind === 'crate') {
      items.push(
        <image
          key={`k${key}`}
          href={tile('crate')}
          x={x + C * 0.12}
          y={SKY - C * 0.76}
          width={C * 0.76}
          height={C * 0.76}
        />,
      );
    }
    if (kind === 'branch') {
      items.push(
        <rect key={`t${key}`} x={x + C - 4} y={0} width={3} height={SKY} fill={UI_COLORS.goDeep} />,
        <image
          key={`bl${key}`}
          href={tile('branch_left')}
          x={x}
          y={SKY - C * 1.3}
          width={C / 2}
          height={C / 2}
        />,
        <image
          key={`br${key}`}
          href={tile('branch_right')}
          x={x + C / 2}
          y={SKY - C * 1.3}
          width={C / 2}
          height={C / 2}
        />,
      );
    }
    if (kind === 'flag') {
      items.push(
        <image
          key="pole"
          href={tile('flag_pole')}
          x={x + C * 0.35}
          y={SKY - C * 0.8}
          width={C * 0.8}
          height={C * 0.8}
        />,
        <image
          key="flag"
          href={tile('flag_1')}
          x={x + C * 0.35}
          y={SKY - C * 1.55}
          width={C * 0.8}
          height={C * 0.8}
        />,
      );
    }
  });
  for (const at of config.bamboo ?? []) {
    items.push(
      <image
        key={`b${String(at)}`}
        href={tile('bamboo')}
        x={at * C + C * 0.22}
        y={SKY - C * 0.56}
        width={C * 0.56}
        height={C * 0.56}
      />,
    );
  }

  let mark: ReactNode = null;
  if (lit !== null) {
    const cx = lit * C + C / 2;
    const fell = answer.outcome === 'crash' && cells[lit] === 'hole';
    // Bumping a branch or crate: Măng stands on the cell before it, the burst on the boundary,
    // so the obstacle in the framed cell stays visible. A hole swallows her in place; OFF_TRACK
    // keys the cell she jumped from.
    const bumped = answer.outcome === 'crash' && !fell && answer.reason !== 'OFF_TRACK' && lit > 0;
    const pandaX = bumped ? cx - C : cx;
    mark = (
      <g data-answer-cell={lit}>
        {answer.outcome === 'crash' && (
          <Burst
            cx={bumped ? lit * C : cx}
            cy={fell ? SKY : SKY - C * 0.6}
            r={C * (bumped ? 0.45 : 0.62)}
          />
        )}
        <Panda
          pose={answer.reason === 'OFF_TRACK' ? 'jump' : POSE[answer.outcome]}
          cx={pandaX}
          feetY={fell ? SKY + GRASS : SKY + 1}
          height={C * 1.3}
        />
        {answer.outcome === 'win' && <Star cx={cx - C * 0.42} cy={C * 0.3} r={C * 0.3} />}
      </g>
    );
  }
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      className="block h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect x={0} y={0} width={width} height={SKY + GRASS} fill={UI_COLORS.sky} />
      {lit !== null && <Spot x={lit * C + 1} y={1} w={C - 2} h={SKY + GRASS - 2} />}
      {items}
      {mark}
    </svg>
  );
}

// ---- Maze: the whole grid from above ------------------------------------------------------------

const M = 12;
/** Wall cells kept around the open area of the picture. */
const BORDER = 0.35;
const ARROW: Record<MazeConfig['startDir'], number> = { N: 0, E: 90, S: 180, W: 270 };
const STEP: Record<MazeConfig['startDir'], readonly [number, number]> = {
  N: [-1, 0],
  E: [0, 1],
  S: [1, 0],
  W: [0, -1],
};
const TURN_ORDER: Record<MazeConfig['startDir'], readonly MazeConfig['startDir'][]> = {
  N: ['N', 'W', 'E', 'S'],
  E: ['E', 'N', 'S', 'W'],
  S: ['S', 'E', 'W', 'N'],
  W: ['W', 'S', 'N', 'E'],
};

const isOpen = (map: readonly string[], r: number, c: number): boolean => {
  const ch = map[r]?.[c];
  return ch !== undefined && ch !== '#';
};

/**
 * Which way Măng most likely faces on `cell`: the last step of a shortest path from S
 * (startDir on S itself). A key has only the cell, so this is a picture heuristic, not the run.
 */
function arrivalDir(config: MazeConfig, start: [number, number], cell: [number, number]) {
  const { map } = config;
  const seen = new Map<string, MazeConfig['startDir']>([[String(start), config.startDir]]);
  const queue: Array<[number, number]> = [start];
  for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
    if (next[0] === cell[0] && next[1] === cell[1]) break;
    for (const dir of ['N', 'E', 'S', 'W'] as const) {
      const r = next[0] + STEP[dir][0];
      const c = next[1] + STEP[dir][1];
      if (!isOpen(map, r, c) || seen.has(String([r, c]))) continue;
      seen.set(String([r, c]), dir);
      queue.push([r, c]);
    }
  }
  return seen.get(String(cell)) ?? config.startDir;
}

/** HIT_WALL: the wall Măng bumped from `cell`, first of facing, left, right, back that is one. */
function wallDir(config: MazeConfig, start: [number, number], cell: [number, number]) {
  const facing = arrivalDir(config, start, cell);
  return (
    TURN_ORDER[facing].find(
      (dir) => !isOpen(config.map, cell[0] + STEP[dir][0], cell[1] + STEP[dir][1]),
    ) ?? facing
  );
}

function MazeAnswer({ config, answer }: { config: MazeConfig; answer: ParsedAnswer }) {
  const { map } = config;
  const rows = map.length;
  const cols = map[0]?.length ?? 0;
  let goal: [number, number] | null = null;
  let start: [number, number] | null = null;
  const cells: ReactNode[] = [];
  map.forEach((row, r) => {
    Array.from(row).forEach((ch, c) => {
      const x = c * M;
      const y = r * M;
      const key = `${String(r)},${String(c)}`;
      if (ch === '#') {
        cells.push(
          <g key={key}>
            <rect x={x} y={y} width={M} height={M} fill={UI_COLORS.goDeep} />
            <rect x={x + 2} y={y} width={2} height={M} fill={shade(UI_COLORS.go, 1.35)} />
            <rect x={x + 7} y={y} width={2} height={M} fill={UI_COLORS.go} />
          </g>,
        );
        return;
      }
      cells.push(
        <rect
          key={key}
          x={x}
          y={y}
          width={M}
          height={M}
          fill={UI_COLORS.paper2}
          stroke={shade(UI_COLORS.paper2, 0.85)}
          strokeWidth={0.5}
        />,
      );
      if (ch === 'G') goal = [r, c];
      if (ch === 'S') start = [r, c];
      if (ch === 'b') {
        cells.push(
          <image
            key={`b${key}`}
            href={tile('bamboo')}
            x={x + 2}
            y={y + 2}
            width={M - 4}
            height={M - 4}
          />,
        );
      }
    });
  });
  const keyed = answer.outcome === 'win' ? goal : mazeCell(answer);
  // A key pointing outside the map or into a wall is a content error: draw no answer mark.
  const cell = keyed !== null && isOpen(map, keyed[0], keyed[1]) ? keyed : null;
  const goalCell = goal as [number, number] | null;
  const startCell = start as [number, number] | null;
  // Crop to the open cells plus a strip of the surrounding grove: a bordered map's outer wall
  // ring would otherwise take a third of a small card.
  const open = map.flatMap((row, r) =>
    Array.from(row).flatMap((ch, c) => (ch === '#' ? [] : [[r, c] as const])),
  );
  const top = Math.max(0, Math.min(...open.map(([r]) => r)) - BORDER);
  const left = Math.max(0, Math.min(...open.map(([, c]) => c)) - BORDER);
  const bottom = Math.min(rows, Math.max(...open.map(([r]) => r)) + 1 + BORDER);
  const right = Math.min(cols, Math.max(...open.map(([, c]) => c)) + 1 + BORDER);
  const viewBox = [left * M, top * M, (right - left) * M, (bottom - top) * M].map(String).join(' ');
  // HIT_WALL keys the cell Măng bumped FROM: she stands there, the burst sits on the wall edge.
  const wall =
    cell !== null && startCell !== null && answer.outcome === 'crash'
      ? wallDir(config, startCell, cell)
      : null;
  return (
    <svg
      viewBox={viewBox}
      className="block h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ imageRendering: 'pixelated' }}
    >
      {cells}
      {goalCell && (
        <image
          href={tile('flag_1')}
          x={goalCell[1] * M + 1}
          y={goalCell[0] * M + 1}
          width={M - 2}
          height={M - 2}
        />
      )}
      {startCell && (
        <g
          transform={`translate(${String(startCell[1] * M + M / 2)} ${String(startCell[0] * M + M / 2)}) rotate(${String(ARROW[config.startDir])})`}
          data-mark="start"
        >
          <polygon
            points="0,-4.5 4,2.5 0,0.8 -4,2.5"
            fill={BLOCK_COLORS.move}
            stroke={UI_COLORS.ink}
            strokeWidth={0.6}
          />
        </g>
      )}
      {cell && (
        <g data-answer-cell={`${String(cell[0])},${String(cell[1])}`}>
          <Spot x={cell[1] * M + 0.6} y={cell[0] * M + 0.6} w={M - 1.2} h={M - 1.2} />
          <Panda
            pose={POSE[answer.outcome]}
            cx={cell[1] * M + M / 2}
            feetY={cell[0] * M + M - 0.5}
            height={M * 1.25}
            flip={wall === 'W'}
          />
          {wall !== null && (
            <g data-wall={wall}>
              <Burst
                cx={cell[1] * M + M / 2 + (STEP[wall][1] * M) / 2}
                cy={cell[0] * M + M / 2 + (STEP[wall][0] * M) / 2}
                r={M * 0.5}
              />
            </g>
          )}
          {answer.outcome === 'win' && (
            <Star cx={cell[1] * M + M * 0.9} cy={cell[0] * M + M * 0.1} r={M * 0.32} />
          )}
        </g>
      )}
    </svg>
  );
}

/**
 * The picture of one predict answer (`key` in the kind's predictAnswer format) on the level's
 * board. Null when the kind has no picture yet or the key / config cannot be read.
 */
export function AnswerPicture({
  kind,
  config,
  answerKey,
}: {
  kind: GameKindId;
  config: unknown;
  answerKey: string;
}) {
  const answer = parseAnswerKey(answerKey);
  if (answer === null) return null;
  if (kind === 'runner') {
    const parsed = runnerConfigSchema.safeParse(config);
    return parsed.success ? <RunnerAnswer config={parsed.data} answer={answer} /> : null;
  }
  if (kind === 'maze') {
    const parsed = mazeConfigSchema.safeParse(config);
    return parsed.success ? <MazeAnswer config={parsed.data} answer={answer} /> : null;
  }
  return null;
}
