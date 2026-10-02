import type { ReactNode } from 'react';
import type { RunnerCell } from '@codequest/games';
import sheetJson from '../../public/sprites/panda.json?raw';
import { UI_COLORS } from '../ui/tokens';

// SVG pieces shared by the small static pictures of a level (stage-rendering.md §4): the predict
// answer cards (AnswerPicture) and the runner's full-track strip (TrackStrip). Same Kenney tiles
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
