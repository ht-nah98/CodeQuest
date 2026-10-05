import type { ReactNode } from 'react';
import type { GameKindId, GoalSprite, SceneTheme } from '@codequest/content-schema';
import {
  mazeConfigSchema,
  type MazeConfig,
  runnerConfigSchema,
  type RunnerConfig,
} from '@codequest/games';
import {
  type AnswerOutcome,
  mazeCell,
  parseAnswerKey,
  type ParsedAnswer,
  runnerCell,
} from '../features/play/answerKey';
import { UI_COLORS } from '../ui/tokens';
import { sceneArt } from './sceneThemes';
import {
  MAZE_CELL,
  MazeBoard,
  mazeLandmarks,
  SvgPanda,
  type SvgPandaPose,
  TRACK_CELL,
  TRACK_GRASS,
  TRACK_SKY,
  TrackCells,
} from './TrackSvg';

// Small static pictures of a predict answer (stage-rendering.md §4 "Hình đáp án"): the level's
// board drawn from its config as inline SVG, the answer cell framed in yellow and Măng in a pose
// that tells the outcome. Deliberately not a PixiJS renderer: 3–4 cards would each need a WebGL
// context, and an SVG is crisp at any card size, needs no async load and is easy to test.

const POSE: Record<AnswerOutcome, SvgPandaPose> = {
  win: 'cheer',
  stop: 'idle_1',
  missed: 'talk',
  crash: 'crouch',
};

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

const C = TRACK_CELL;
const SKY = TRACK_SKY;
const GRASS = TRACK_GRASS;

function RunnerAnswer({
  config,
  answer,
  goalSprite,
  theme,
}: {
  config: RunnerConfig;
  answer: ParsedAnswer;
  goalSprite: GoalSprite | undefined;
  theme: SceneTheme | undefined;
}) {
  const { cells } = config;
  const flagCell = cells.indexOf('flag');
  const cell = answer.outcome === 'win' ? flagCell : runnerCell(answer);
  const lit = cell !== null && cell >= 0 && cell < cells.length ? cell : null;
  // Room right of the last cell: the flag or goal picture sticks out of its cell a little.
  const width = cells.length * C + 0.2 * C;
  const height = SKY + GRASS;
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
        <SvgPanda
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
      <rect x={0} y={0} width={width} height={SKY + GRASS} fill={sceneArt(theme).svgSky} />
      {lit !== null && <Spot x={lit * C + 1} y={1} w={C - 2} h={SKY + GRASS - 2} />}
      <TrackCells
        cells={cells}
        bamboo={config.bamboo ?? []}
        items={config.goal?.items}
        goalSprite={goalSprite}
        theme={theme}
      />
      {mark}
    </svg>
  );
}

// ---- Maze: the whole grid from above ------------------------------------------------------------

const M = MAZE_CELL;
/** Wall cells kept around the open area of the picture. */
const BORDER = 0.35;
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

function MazeAnswer({
  config,
  answer,
  goalSprite,
  theme,
}: {
  config: MazeConfig;
  answer: ParsedAnswer;
  goalSprite: GoalSprite | undefined;
  theme: SceneTheme | undefined;
}) {
  const { map } = config;
  const rows = map.length;
  const cols = map[0]?.length ?? 0;
  const { start, goal } = mazeLandmarks(map);
  const keyed = answer.outcome === 'win' ? goal : mazeCell(answer);
  // A key pointing outside the map or into a wall is a content error: draw no answer mark.
  const cell = keyed !== null && isOpen(map, keyed[0], keyed[1]) ? keyed : null;
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
    cell !== null && start !== null && answer.outcome === 'crash'
      ? wallDir(config, start, cell)
      : null;
  return (
    <svg
      viewBox={viewBox}
      className="block h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ imageRendering: 'pixelated' }}
    >
      <MazeBoard config={config} goalSprite={goalSprite} theme={theme} />
      {cell && (
        <g data-answer-cell={`${String(cell[0])},${String(cell[1])}`}>
          <Spot x={cell[1] * M + 0.6} y={cell[0] * M + 0.6} w={M - 1.2} h={M - 1.2} />
          <SvgPanda
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
  goalSprite,
  theme,
}: {
  kind: GameKindId;
  config: unknown;
  answerKey: string;
  /** `level.goalSprite` (P2-11c): the goal cell's picture instead of the flag. */
  goalSprite?: GoalSprite | undefined;
  /** The world's scenery (P2-23): sky, ground and maze tiles; absent = Làng Tre. */
  theme?: SceneTheme | undefined;
}) {
  const answer = parseAnswerKey(answerKey);
  if (answer === null) return null;
  if (kind === 'runner') {
    const parsed = runnerConfigSchema.safeParse(config);
    return parsed.success ? (
      <RunnerAnswer config={parsed.data} answer={answer} goalSprite={goalSprite} theme={theme} />
    ) : null;
  }
  if (kind === 'maze') {
    const parsed = mazeConfigSchema.safeParse(config);
    return parsed.success ? (
      <MazeAnswer config={parsed.data} answer={answer} goalSprite={goalSprite} theme={theme} />
    ) : null;
  }
  return null;
}
