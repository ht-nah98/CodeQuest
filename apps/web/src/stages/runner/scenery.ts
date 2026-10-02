import { Graphics } from 'pixi.js';
import { UI_COLORS } from '../../ui/tokens';
import { shade } from '../colors';
import type { RunnerLayout } from './layout';

/**
 * Background of the runner stage, drawn as chunky pixel shapes on the tile texel grid (one unit =
 * `tileScale` px) in soft day colours, so it stays behind the track: sky bands, a pale sun,
 * clouds, a far bamboo grove and near hills (stage-rendering.md §2, art-direction.md §1).
 */

/**
 * Scenery colours: the sky, sun and leaf-green tokens, lighter with distance (`shade` > 1 mixes
 * towards white), so the backdrop stays softer than the track.
 */
const SCENERY = {
  skyHigh: shade(UI_COLORS.sky, 0.93),
  skyLow: shade(UI_COLORS.sky, 1.35),
  sun: UI_COLORS.coinShine,
  sunRim: shade(UI_COLORS.coin, 1.55),
  farStalk: shade(UI_COLORS.go, 1.6),
  farNode: shade(UI_COLORS.go, 1.45),
  farLeaf: shade(UI_COLORS.go, 1.68),
  hill: shade(UI_COLORS.go, 1.35),
  hillShade: shade(UI_COLORS.go, 1.22),
  hillTop: shade(UI_COLORS.go, 1.5),
  nearStalk: shade(UI_COLORS.go, 1.15),
  nearNode: shade(UI_COLORS.go, 0.95),
  nearLeaf: shade(UI_COLORS.go, 1.25),
} as const;

/** How far each layer moves for one px of camera movement. */
export const PARALLAX = { clouds: 0.12, far: 0.3, hills: 0.55 } as const;

/** Deterministic pseudo-random sequence (same scene on every reset and resize). */
function sequence(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** Width a layer moving at `factor` must cover so it never shows its end while scrolling. */
function spanOf(layout: RunnerLayout, factor: number): number {
  return layout.width + (layout.worldWidth - layout.width) * factor;
}

/** Static sky: two colour bands with a dithered seam, and a pale sun. */
export function drawSky(layout: RunnerLayout): Graphics {
  const { width, groundTop, tileScale: u } = layout;
  const sky = new Graphics();
  sky.rect(0, 0, width, groundTop).fill(SCENERY.skyHigh);
  const band = Math.round(groundTop * 0.42);
  sky.rect(0, band, width, groundTop - band).fill(UI_COLORS.sky);
  const low = Math.round(groundTop * 0.72);
  sky.rect(0, low, width, groundTop - low).fill(SCENERY.skyLow);
  // Checkerboard rows soften each seam the way old pixel games did.
  for (const [y, color] of [
    [band, SCENERY.skyHigh],
    [low, UI_COLORS.sky],
  ] as const) {
    for (let x = 0; x < width; x += 2 * u) sky.rect(x, y, u, u);
    for (let x = u; x < width; x += 2 * u) sky.rect(x, y + u, u, u);
    sky.fill(color);
  }
  const r = 7 * u;
  const cx = Math.round(width * 0.84);
  const cy = Math.round(groundTop * 0.2);
  sky
    .rect(cx - r, cy - r + 2 * u, 2 * r, 2 * r - 4 * u)
    .rect(cx - r + 2 * u, cy - r, 2 * r - 4 * u, 2 * r)
    .fill(SCENERY.sunRim);
  sky
    .rect(cx - r + u, cy - r + 3 * u, 2 * r - 2 * u, 2 * r - 6 * u)
    .rect(cx - r + 3 * u, cy - r + u, 2 * r - 6 * u, 2 * r - 2 * u)
    .fill(SCENERY.sun);
  return sky;
}

/** Chunky white clouds, spread over the span the cloud layer scrolls through. */
export function drawClouds(layout: RunnerLayout): Graphics {
  const { groundTop, tileScale } = layout;
  const span = spanOf(layout, PARALLAX.clouds);
  const clouds = new Graphics();
  // A fixed pixel shape (rows of texels: start, width) at an integer size, so every cloud is clean.
  const SHAPE = [
    [3, 3],
    [1, 7],
    [0, 10],
  ] as const;
  const cloud = (cx: number, cy: number, size: number): void => {
    const u = tileScale * size;
    for (const [row, [start, width]] of SHAPE.entries()) {
      clouds.rect(cx + start * u, cy + row * u, width * u, u);
    }
    clouds.fill({ color: UI_COLORS.white, alpha: 0.9 });
  };
  const next = sequence(7);
  const gap = Math.max(160, layout.width * 0.38);
  for (let x = layout.width * 0.16; x < span + gap; x += gap * (0.8 + next() * 0.5)) {
    cloud(Math.round(x), Math.round(groundTop * (0.12 + next() * 0.3)), next() < 0.5 ? 2 : 3);
  }
  return clouds;
}

/** One bamboo stalk: segments with darker node rings and a few leaf tufts. */
function stalk(
  g: Graphics,
  x: number,
  bottom: number,
  height: number,
  u: number,
  colors: { stalk: string; node: string; leaf: string },
  next: () => number,
): void {
  const w = 2 * u;
  const top = bottom - height;
  g.rect(x, top, w, height).fill(colors.stalk);
  const segment = (6 + Math.floor(next() * 3)) * u;
  for (let y = bottom - segment; y > top + u; y -= segment) {
    g.rect(x - u, y, w + 2 * u, u).fill(colors.node);
    if (next() < 0.45) {
      // A leaf tuft pointing left or right from the node.
      const dir = next() < 0.5 ? -1 : 1;
      const base = dir < 0 ? x - u : x + w;
      g.rect(base + dir * u * 1, y - u, u * 2 * dir, u)
        .rect(base + dir * u * 2, y - 2 * u, u * 3 * dir, u)
        .fill(colors.leaf);
    }
  }
}

/** The far bamboo grove standing on the horizon. */
export function drawFarBamboo(layout: RunnerLayout): Graphics {
  const { groundTop, tileScale: u } = layout;
  const span = spanOf(layout, PARALLAX.far);
  const g = new Graphics();
  const next = sequence(11);
  const colors = { stalk: SCENERY.farStalk, node: SCENERY.farNode, leaf: SCENERY.farLeaf };
  for (
    let x = Math.round(next() * 8 * u);
    x < span + 8 * u;
    x += (8 + Math.floor(next() * 9)) * u
  ) {
    const height = Math.round(groundTop * (0.35 + next() * 0.6));
    stalk(g, Math.round(x / u) * u, groundTop, height, u, colors, next);
  }
  return g;
}

/** Rolling near hills with a few darker bamboo stalks, just behind the track. */
export function drawHills(layout: RunnerLayout): Graphics {
  const { groundTop, tileScale: u } = layout;
  const span = spanOf(layout, PARALLAX.hills);
  const g = new Graphics();
  const next = sequence(23);
  const colors = { stalk: SCENERY.nearStalk, node: SCENERY.nearNode, leaf: SCENERY.nearLeaf };
  // A few stalks behind the hills, so the grove gets depth.
  for (let x = Math.round(next() * 30 * u); x < span; x += (26 + Math.floor(next() * 30)) * u) {
    const height = Math.round(groundTop * (0.3 + next() * 0.25));
    stalk(g, Math.round(x / u) * u, groundTop, height, u, colors, next);
    stalk(g, Math.round(x / u) * u + 5 * u, groundTop, height * 0.75, u, colors, next);
  }
  // Hills as stacked steps of an arc, one texel per step: round from afar, pixel up close.
  let x = -Math.round(next() * 20) * u;
  while (x < span) {
    const half = Math.round((18 + next() * 22) / 1) * u;
    const rise = Math.round(groundTop * (0.1 + next() * 0.08));
    for (let dx = -half; dx < half; dx += u) {
      const k = 1 - (dx / half) ** 2;
      const h = Math.max(u, Math.round((rise * Math.sqrt(k)) / u) * u);
      g.rect(x + half + dx, groundTop - h, u, h).fill(
        dx > half * 0.35 ? SCENERY.hillShade : SCENERY.hill,
      );
      g.rect(x + half + dx, groundTop - h, u, u).fill(SCENERY.hillTop);
    }
    x += Math.round((half * (1.3 + next() * 0.5)) / u) * u;
  }
  return g;
}
