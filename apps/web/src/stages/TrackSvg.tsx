import type { ReactNode } from 'react';
import type { MazeCell, MazeConfig, RunnerCell } from '@codequest/games';
import sheetJson from 'virtual:panda-sheet';
import { BLOCK_COLORS, UI_COLORS } from '../ui/tokens';
import { shade } from './colors';

// SVG pieces shared by the static pictures of a level (stage-rendering.md §4): the predict
// answer cards (AnswerPicture), the runner's full-track strip (TrackStrip) and the big
// "Xem cả đường" view (screens/play/PlanView). Same Kenney tiles
// and panda sheet as the PixiJS stage, so a child recognises every cell.

const PANDA_SHEET = JSON.parse(sheetJson) as {
  frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
  meta: { size: { w: number; h: number } };
};

export type SvgPandaPose = 'cheer' | 'idle_1' | 'talk' | 'jump' | 'crouch';

export const tile = (name: string) => `/tiles/${name}.png`;

/** Măng, `height` units tall, feet centred on (cx, feetY); `flip` mirrors her (facing left). */
export function SvgPanda({
  pose,
  cx,
  feetY,
  height,
  flip = false,
}: {
  pose: SvgPandaPose;
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

// ---- Runner: one lane of cells -----------------------------------------------------------------

/** Width of one runner cell in picture units. */
export const TRACK_CELL = 24;
/** Bands of a runner picture, top to bottom: sky (Măng, obstacles), grass. */
export const TRACK_SKY = 1.6 * TRACK_CELL;
export const TRACK_GRASS = 0.55 * TRACK_CELL;

/**
 * Every cell of a runner track (ground, hole, branch, crate, flag) and its bamboo shoots, cell `i`
 * at x = i × TRACK_CELL. Odd cells are a little darker and ground cells have a seam between them,
 * like the stage, so a child can count them.
 */
export function TrackCells({
  cells,
  bamboo,
  seam = 1.5,
}: {
  cells: readonly RunnerCell[];
  bamboo: readonly number[];
  /** Width of the line between two ground cells (thicker where cells are drawn small). */
  seam?: number;
}) {
  const C = TRACK_CELL;
  const SKY = TRACK_SKY;
  const GRASS = TRACK_GRASS;
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
          data-cell="hole"
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
          data-cell={kind}
        />,
      );
      if (i > 0 && cells[i - 1] !== 'hole') {
        items.push(
          <rect
            key={`s${key}`}
            x={x - seam / 2}
            y={SKY + 1}
            width={seam}
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
  for (const at of bamboo) {
    items.push(
      <image
        key={`b${String(at)}`}
        href={tile('bamboo')}
        x={at * C + C * 0.22}
        y={SKY - C * 0.56}
        width={C * 0.56}
        height={C * 0.56}
        data-bamboo={at}
      />,
    );
  }
  return <>{items}</>;
}

// ---- Maze: the whole grid from above ------------------------------------------------------------

/** Width of one maze cell in picture units. */
export const MAZE_CELL = 12;
const MAZE_ARROW: Record<MazeConfig['startDir'], number> = { N: 0, E: 90, S: 180, W: 270 };

/** The start `S` and goal `G` cells of a maze map (`[row, column]`), `null` if missing. */
export function mazeLandmarks(map: readonly string[]): {
  start: [number, number] | null;
  goal: [number, number] | null;
} {
  let start: [number, number] | null = null;
  let goal: [number, number] | null = null;
  map.forEach((row, r) => {
    Array.from(row).forEach((ch, c) => {
      if (ch === 'S') start = [r, c];
      if (ch === 'G') goal = [r, c];
    });
  });
  return { start, goal };
}

/** A small arrow pointing `dir`, centred on (cx, cy), `size` units tall. */
export function MazeArrow({
  dir,
  cx,
  cy,
  size = MAZE_CELL,
}: {
  dir: MazeConfig['startDir'];
  cx: number;
  cy: number;
  size?: number;
}) {
  const k = size / MAZE_CELL;
  return (
    <g
      transform={`translate(${String(cx)} ${String(cy)}) rotate(${String(MAZE_ARROW[dir])}) scale(${String(k)})`}
      data-dir={dir}
    >
      <polygon
        points="0,-4.5 4,2.5 0,0.8 -4,2.5"
        fill={BLOCK_COLORS.move}
        stroke={UI_COLORS.ink}
        strokeWidth={0.6}
      />
    </g>
  );
}

/**
 * Every cell of a maze map (wall, path, bamboo), the goal flag and the start arrow, cell [r, c]
 * at (c × MAZE_CELL, r × MAZE_CELL). `bamboo` overrides the map's shoots (those not picked up yet).
 */
export function MazeBoard({
  config,
  bamboo,
}: {
  config: MazeConfig;
  bamboo?: readonly MazeCell[];
}) {
  const M = MAZE_CELL;
  const { map } = config;
  const shoots = bamboo?.map(([r, c]) => `${String(r)},${String(c)}`);
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
      if (shoots ? shoots.includes(key) : ch === 'b') {
        cells.push(
          <image
            key={`b${key}`}
            href={tile('bamboo')}
            x={x + 2}
            y={y + 2}
            width={M - 4}
            height={M - 4}
            data-bamboo={key}
          />,
        );
      }
    });
  });
  const { start, goal } = mazeLandmarks(map);
  return (
    <>
      {cells}
      {goal && (
        <image
          href={tile('flag_1')}
          x={goal[1] * M + 1}
          y={goal[0] * M + 1}
          width={M - 2}
          height={M - 2}
          data-mark="goal"
        />
      )}
      {start && (
        <g data-mark="start">
          <MazeArrow dir={config.startDir} cx={start[1] * M + M / 2} cy={start[0] * M + M / 2} />
        </g>
      )}
    </>
  );
}
