import { Graphics } from 'pixi.js';
import { UI_COLORS } from '../../ui/tokens';
import {
  CITY_DETAIL,
  FOREST_DETAIL,
  LANG_TRE_DETAIL,
  MOUNTAIN_DETAIL,
  RIVER_DETAIL,
  type SceneArt,
  sceneArt,
  type SceneTheme,
  WORKSHOP_DETAIL,
} from '../sceneThemes';
import type { RunnerLayout } from './layout';

/**
 * Background of the runner stage, drawn as chunky pixel shapes on the tile texel grid (one unit =
 * `tileScale` px) in soft colours, so it stays behind the track (stage-rendering.md §2 and §7,
 * art-direction.md §1). Four layers, each in the world's theme (sceneThemes.ts): a static sky
 * (bands and its light), a slow layer (clouds, canopy, lanterns), a far layer (bamboo grove,
 * workshop wall, mountains, far shore and river) and a near layer (hills, bushes, benches, rocks,
 * reeds and the dock). Never a crate, hole, branch or shoot: those mean something on the track.
 * Deterministic (seeded sequences), rebuilt on resize; colours from tokens via sceneThemes.ts.
 */

/** How far each layer moves for one px of camera movement. */
export const PARALLAX = { clouds: 0.12, far: 0.3, hills: 0.55 } as const;

/** Deterministic pseudo-random sequence (same scene on every reset and resize). */
export function sequence(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** Width a layer moving at `factor` must cover so it never shows its end while scrolling. */
export function spanOf(layout: RunnerLayout, factor: number): number {
  return layout.width + (layout.worldWidth - layout.width) * factor;
}

/** `value` snapped down to the texel grid. */
const snap = (value: number, u: number): number => Math.floor(value / u) * u;

/** A small pixel picture (rows of letters, '.' transparent), one rect per run of a colour. */
function picture(
  g: Graphics,
  x: number,
  y: number,
  rows: readonly string[],
  u: number,
  palette: Readonly<Record<string, string>>,
): void {
  rows.forEach((row, r) => {
    let c = 0;
    while (c < row.length) {
      const ch = row.charAt(c);
      let end = c + 1;
      while (end < row.length && row.charAt(end) === ch) end += 1;
      const color = palette[ch];
      if (ch !== '.' && color !== undefined)
        g.rect(x + c * u, y + r * u, (end - c) * u, u).fill(color);
      c = end;
    }
  });
}

/** A filled pixel disc of `r` texels around (cx, cy), one rect per texel row. */
function disc(g: Graphics, cx: number, cy: number, r: number, u: number, color: string): void {
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8));
    g.rect(cx - half * u, cy + dy * u, (2 * half + 1) * u, u);
  }
  g.fill(color);
}

// ---- Sky (static) -------------------------------------------------------------------------------

/** Static sky: three colour bands with dithered seams, and the theme's light. */
export function drawSky(layout: RunnerLayout, theme?: SceneTheme): Graphics {
  const art = sceneArt(theme);
  const { width, groundTop, tileScale: u } = layout;
  const sky = new Graphics();
  sky.rect(0, 0, width, groundTop).fill(art.sky.high);
  const band = Math.round(groundTop * 0.42);
  sky.rect(0, band, width, groundTop - band).fill(art.sky.mid);
  const low = Math.round(groundTop * 0.72);
  sky.rect(0, low, width, groundTop - low).fill(art.sky.low);
  // Checkerboard rows soften each seam the way old pixel games did.
  for (const [y, color] of [
    [band, art.sky.high],
    [low, art.sky.mid],
  ] as const) {
    for (let x = 0; x < width; x += 2 * u) sky.rect(x, y, u, u);
    for (let x = u; x < width; x += 2 * u) sky.rect(x, y + u, u, u);
    sky.fill(color);
  }
  switch (art.id) {
    case 'lang-tre':
      sun(sky, layout, LANG_TRE_DETAIL);
      break;
    case 'song':
      sun(sky, layout, RIVER_DETAIL);
      break;
    case 'thanh-pho-robot':
      sun(sky, layout, LANG_TRE_DETAIL);
      break;
    case 'rung-lap-lai':
      lightShafts(sky, layout);
      break;
    case 'xuong':
      workshopWall(sky, layout, band);
      break;
    case 'nga-ba':
      duskSky(sky, layout, band);
      break;
  }
  return sky;
}

/** A pale pixel sun in the top right corner. */
function sun(sky: Graphics, layout: RunnerLayout, colors: { sun: string; sunRim: string }): void {
  const { width, groundTop, tileScale: u } = layout;
  const r = 7 * u;
  const cx = Math.round(width * 0.84);
  const cy = Math.round(groundTop * 0.2);
  sky
    .rect(cx - r, cy - r + 2 * u, 2 * r, 2 * r - 4 * u)
    .rect(cx - r + 2 * u, cy - r, 2 * r - 4 * u, 2 * r)
    .fill(colors.sunRim);
  sky
    .rect(cx - r + u, cy - r + 3 * u, 2 * r - 2 * u, 2 * r - 6 * u)
    .rect(cx - r + 3 * u, cy - r + u, 2 * r - 6 * u, 2 * r - 2 * u)
    .fill(colors.sun);
}

/** Forest: slanted shafts of light falling through the canopy. */
function lightShafts(sky: Graphics, layout: RunnerLayout): void {
  const { width, groundTop, tileScale: u } = layout;
  for (const share of [0.12, 0.46, 0.74]) {
    const x0 = snap(width * share, u);
    for (let y = 0; y < groundTop; y += 2 * u) {
      sky.rect(x0 + snap(y * 0.35, u), y, 7 * u, 2 * u);
    }
    sky.fill({ color: FOREST_DETAIL.shaft, alpha: 0.16 });
  }
}

/** Workshop: rafters up high, a plank wall with a rail, and a round window. */
function workshopWall(sky: Graphics, layout: RunnerLayout, band: number): void {
  const { width, groundTop, tileScale: u } = layout;
  const d = WORKSHOP_DETAIL;
  for (let x = 4 * u; x < width; x += 34 * u) sky.rect(x, 0, 4 * u, band);
  sky.fill(d.beam);
  // Plank seams: few and soft, so the wall stays quiet behind the track.
  for (let x = 0; x < width; x += 18 * u) sky.rect(x, band, u, groundTop - band);
  sky.fill(d.plankLine);
  sky.rect(0, band - 3 * u, width, 4 * u).fill(d.beam);
  sky.rect(0, band - 3 * u, width, u).fill(d.beamLight);
  const cx = snap(width * 0.84, u);
  const cy = snap(groundTop * 0.22, u);
  disc(sky, cx, cy, 8, u, d.frame);
  disc(sky, cx, cy, 6, u, d.glass);
  sky
    .rect(cx, cy - 6 * u, u, 13 * u)
    .rect(cx - 6 * u, cy, 13 * u, u)
    .fill(d.frame);
  sky
    .rect(cx - 4 * u, cy - 4 * u, 2 * u, u)
    .rect(cx - 4 * u, cy - 3 * u, u, u)
    .fill(d.glassLight);
}

/** Mountain pass at dusk: a few first stars and a big low-lit sun high over the peaks. */
function duskSky(sky: Graphics, layout: RunnerLayout, band: number): void {
  const { width, groundTop, tileScale: u } = layout;
  const d = MOUNTAIN_DETAIL;
  const next = sequence(5);
  for (let i = 0; i < 14; i++) {
    sky.rect(snap(next() * width, u), snap(next() * band * 0.85, u), u, u);
  }
  sky.fill(d.star);
  // High in the sky (above the action band, groundTop × 0.3) and orange-pink, not coin gold:
  // a key or a branch never stands on it, and it never reads as a coin.
  const cx = snap(width * 0.7, u);
  const cy = snap(groundTop * 0.15, u);
  disc(sky, cx, cy, 9, u, d.sunRim);
  disc(sky, cx, cy, 8, u, d.sun);
}

// ---- Slow layer: clouds, canopy, lanterns -------------------------------------------------------

/** The slow layer (parallax `clouds`): clouds, or the theme's canopy, lanterns or streaks. */
export function drawClouds(layout: RunnerLayout, theme?: SceneTheme): Graphics {
  const art = sceneArt(theme);
  if (art.id === 'rung-lap-lai') return canopy(layout);
  if (art.id === 'xuong') return lanterns(layout);
  if (art.id === 'nga-ba') return streaks(layout);
  return clouds(layout);
}

/** Chunky white clouds, spread over the span the cloud layer scrolls through. */
function clouds(layout: RunnerLayout): Graphics {
  const { groundTop, tileScale } = layout;
  const span = spanOf(layout, PARALLAX.clouds);
  const g = new Graphics();
  // A fixed pixel shape (rows of texels: start, width) at an integer size, so every cloud is clean.
  const SHAPE = [
    [3, 3],
    [1, 7],
    [0, 10],
  ] as const;
  const cloud = (cx: number, cy: number, size: number): void => {
    const u = tileScale * size;
    for (const [row, [start, width]] of SHAPE.entries()) {
      g.rect(cx + start * u, cy + row * u, width * u, u);
    }
    g.fill({ color: UI_COLORS.white, alpha: 0.9 });
  };
  const next = sequence(7);
  const gap = Math.max(160, layout.width * 0.38);
  for (let x = layout.width * 0.16; x < span + gap; x += gap * (0.8 + next() * 0.5)) {
    cloud(Math.round(x), Math.round(groundTop * (0.12 + next() * 0.3)), next() < 0.5 ? 2 : 3);
  }
  return g;
}

/** Forest canopy: leaf clumps hanging from the top, a few vines down into the light. */
function canopy(layout: RunnerLayout): Graphics {
  const { groundTop, tileScale: u } = layout;
  const span = spanOf(layout, PARALLAX.clouds);
  const d = FOREST_DETAIL;
  const g = new Graphics();
  const next = sequence(13);
  for (let x = -4 * u; x < span + 20 * u; x += (9 + Math.floor(next() * 8)) * u) {
    const depth = 6 + Math.floor(next() * 10);
    const half = 6 + Math.floor(next() * 5);
    for (let row = 0; row < depth; row++) {
      const w = Math.max(1, half - Math.floor((row * row) / (depth * 1.4)));
      g.rect(snap(x, u) - w * u, row * u, 2 * w * u, u);
    }
    g.fill(d.canopy);
    g.rect(snap(x, u) - 2 * u, (depth - 2) * u, 2 * u, u).fill(d.canopyLight);
    if (next() < 0.4) {
      const vine = snap(x + 2 * u, u);
      const end = snap(groundTop * (0.22 + next() * 0.2), u);
      g.rect(vine, depth * u, u, end - depth * u).fill(d.vine);
      for (let y = depth * u + 4 * u; y < end; y += 5 * u) g.rect(vine + u, y, 2 * u, u);
      g.fill(d.canopyLight);
    }
  }
  return g;
}

/** A hanging lantern, 5 × 8 texels. */
const LANTERN = ['..c..', '.ccc.', 'cyyyc', 'cysyc', 'cysyc', 'cyyyc', '.ccc.', '..y..'];

/** Workshop: lanterns hanging on ropes from the rafters. */
function lanterns(layout: RunnerLayout): Graphics {
  const { groundTop, tileScale } = layout;
  const span = spanOf(layout, PARALLAX.clouds);
  const d = WORKSHOP_DETAIL;
  const palette = { c: d.lanternCap, y: d.lantern, s: d.lanternGlow };
  const g = new Graphics();
  const next = sequence(17);
  const gap = Math.max(150, layout.width * 0.34);
  // Small and high: the lanterns end above the action band (groundTop × 0.3), so a gold
  // lantern is never next to a key or a shoot.
  const u = tileScale;
  for (let x = layout.width * 0.1; x < span + gap; x += gap * (0.8 + next() * 0.4)) {
    const left = snap(x, tileScale);
    const drop = snap(groundTop * (0.06 + next() * 0.08), tileScale);
    g.rect(left + 2 * u, 0, tileScale, drop).fill(d.rope);
    picture(g, left, drop, LANTERN, u, palette);
  }
  return g;
}

/** Dusk: long thin pink clouds. */
function streaks(layout: RunnerLayout): Graphics {
  const { groundTop, tileScale: u } = layout;
  const span = spanOf(layout, PARALLAX.clouds);
  const g = new Graphics();
  const next = sequence(19);
  const gap = Math.max(140, layout.width * 0.3);
  for (let x = layout.width * 0.05; x < span + gap; x += gap * (0.7 + next() * 0.5)) {
    const left = snap(x, u);
    const y = snap(groundTop * (0.1 + next() * 0.32), u);
    const w = (14 + Math.floor(next() * 14)) * u;
    g.rect(left + 4 * u, y, w - 8 * u, u).rect(left, y + u, w, u);
  }
  g.fill({ color: MOUNTAIN_DETAIL.cloud, alpha: 0.85 });
  return g;
}

// ---- Far layer ----------------------------------------------------------------------------------

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

/** The far layer (parallax `far`) in the theme's look. */
export function drawFar(layout: RunnerLayout, theme?: SceneTheme): Graphics {
  const art = sceneArt(theme);
  if (art.id === 'xuong') return workshopShelves(layout, art);
  if (art.id === 'nga-ba') return mountains(layout, art);
  if (art.id === 'song') return farShore(layout, art);
  if (art.id === 'thanh-pho-robot') return skyline(layout, art);
  return farBamboo(layout, art);
}

/**
 * Robot city skyline: blocks of towers in soft lavender-grey with lit windows, an antenna with a
 * beacon here and there. Flat and pale, so it never looks like a crate or a goal.
 */
function skyline(layout: RunnerLayout, art: SceneArt): Graphics {
  const { groundTop, tileScale: u } = layout;
  const span = spanOf(layout, PARALLAX.far);
  const d = CITY_DETAIL;
  const g = new Graphics();
  const next = sequence(43);
  let x = -snap(next() * 10 * u, u);
  while (x < span + 20 * u) {
    const w = (10 + Math.floor(next() * 10)) * u;
    const h = snap(groundTop * (0.28 + next() * 0.32), u);
    const top = groundTop - h;
    g.rect(x, top, w, h).fill(next() < 0.5 ? art.far.main : art.far.dark);
    g.rect(x, top, w, u).fill(art.far.light);
    // Windows in a grid, some lit.
    for (let wy = top + 3 * u; wy < groundTop - 3 * u; wy += 4 * u) {
      for (let wx = x + 2 * u; wx < x + w - 2 * u; wx += 4 * u) {
        g.rect(wx, wy, 2 * u, 2 * u).fill(next() < 0.35 ? d.window : d.windowDark);
      }
    }
    if (next() < 0.3) {
      const ax = x + snap(w / 2, u);
      g.rect(ax, top - 5 * u, u, 5 * u).fill(d.antenna);
      g.rect(ax - u, top - 6 * u, 3 * u, u).fill(d.beacon);
    }
    x += w + (1 + Math.floor(next() * 4)) * u;
  }
  return g;
}

/** The far bamboo grove standing on the horizon (denser and taller in the forest). */
function farBamboo(layout: RunnerLayout, art: SceneArt): Graphics {
  const { groundTop, tileScale: u } = layout;
  const span = spanOf(layout, PARALLAX.far);
  const g = new Graphics();
  const next = sequence(11);
  const colors = { stalk: art.far.main, node: art.far.dark, leaf: art.far.light };
  const forest = art.id === 'rung-lap-lai';
  const [step, spread] = forest ? [5, 7] : [8, 9];
  const [tall, extra] = forest ? [0.5, 0.5] : [0.35, 0.6];
  for (
    let x = Math.round(next() * 8 * u);
    x < span + 8 * u;
    x += (step + Math.floor(next() * spread)) * u
  ) {
    const height = Math.round(groundTop * (tall + next() * extra));
    stalk(g, Math.round(x / u) * u, groundTop, height, u, colors, next);
  }
  return g;
}

/** A gear of `r` texels: a disc with square teeth, a darker ring and a hub. */
function gear(g: Graphics, cx: number, cy: number, r: number, u: number, art: SceneArt): void {
  const teeth = 8;
  for (let i = 0; i < teeth; i++) {
    const angle = (i / teeth) * Math.PI * 2;
    const tx = cx + snap(Math.cos(angle) * (r + 1) * u, u);
    const ty = cy + snap(Math.sin(angle) * (r + 1) * u, u);
    g.rect(tx - u, ty - u, 3 * u, 3 * u);
  }
  g.fill(art.far.main);
  disc(g, cx, cy, r, u, art.far.main);
  disc(g, cx, cy, Math.max(2, r - 3), u, art.far.dark);
  disc(g, cx, cy, Math.max(1, r - 5), u, art.far.main);
  g.rect(cx - u, cy - u, 2 * u, 2 * u).fill(art.far.light);
}

/** Workshop wall: shelves of jars and big gears. */
function workshopShelves(layout: RunnerLayout, art: SceneArt): Graphics {
  const { groundTop, tileScale: u } = layout;
  const span = spanOf(layout, PARALLAX.far);
  const d = WORKSHOP_DETAIL;
  const g = new Graphics();
  const next = sequence(29);
  const jars = [d.jarA, d.jarB, d.jarC] as const;
  for (
    let x = snap(next() * 20 * u, u);
    x < span + 40 * u;
    x += (52 + Math.floor(next() * 30)) * u
  ) {
    // A shelf with brackets and a few jars.
    const shelfY = snap(groundTop * (0.38 + next() * 0.08), u);
    g.rect(x, shelfY, 24 * u, 2 * u).fill(d.shelf);
    g.rect(x + 2 * u, shelfY + 2 * u, u, 3 * u).rect(x + 21 * u, shelfY + 2 * u, u, 3 * u);
    g.fill(d.shelf);
    for (let j = 0; j < 4; j++) {
      const jx = x + (2 + j * 6) * u;
      const h = (3 + Math.floor(next() * 3)) * u;
      g.rect(jx, shelfY - h, 4 * u, h).fill(jars[j % 3] ?? d.jarA);
      g.rect(jx + u, shelfY - h - u, 2 * u, u).fill(d.metalDark);
    }
    // A big gear and a small one turning against it.
    // Gears high on the wall (centre above groundTop × 0.45), in muted iron, never coin gold.
    const gx = x + 36 * u;
    const gy = snap(groundTop * (0.3 + next() * 0.12), u);
    const r = 6 + Math.floor(next() * 3);
    gear(g, gx, gy, r, u, art);
    gear(g, gx + (r + 5) * u, gy - (r - 1) * u, 4, u, art);
  }
  return g;
}

/** Mountain range: stepped peaks lit from the left, snow on the tops. */
function mountains(layout: RunnerLayout, art: SceneArt): Graphics {
  const { groundTop, tileScale: u } = layout;
  const span = spanOf(layout, PARALLAX.far);
  const g = new Graphics();
  const next = sequence(31);
  let x = -snap(next() * 30 * u, u);
  while (x < span + 20 * u) {
    const half = (18 + Math.floor(next() * 20)) * u;
    const rise = snap(groundTop * (0.3 + next() * 0.28), u);
    const centre = x + half;
    const height = (dx: number) => Math.max(u, snap(rise * (1 - Math.abs(dx + u / 2) / half), u));
    // One fill per colour of a peak (lit side, shaded side, snow); later peaks stand in front.
    for (let dx = -half; dx < 0; dx += u)
      g.rect(centre + dx, groundTop - height(dx), u, height(dx));
    g.fill(art.far.light);
    for (let dx = 0; dx < half; dx += u) g.rect(centre + dx, groundTop - height(dx), u, height(dx));
    g.fill(art.far.main);
    for (let dx = -half; dx < half; dx += u) {
      const snow = height(dx) - rise * 0.72;
      if (snow > 0) g.rect(centre + dx, groundTop - height(dx), u, snap(snow, u) + u);
    }
    g.fill(MOUNTAIN_DETAIL.snow);
    g.rect(centre - u, groundTop - rise, u, rise).fill(art.far.dark);
    x += snap(half * (1.1 + next() * 0.6), u);
  }
  return g;
}

/** River: y of the far bank's waterline (the water fills the band below it down to the ground). */
export function riverShoreY(layout: RunnerLayout): number {
  return snap(layout.groundTop * 0.8, layout.tileScale);
}

/** River: the far shore with round trees, and the water up to the bank under the track. */
function farShore(layout: RunnerLayout, art: SceneArt): Graphics {
  const { width, groundTop, tileScale: u } = layout;
  const span = spanOf(layout, PARALLAX.far);
  const d = RIVER_DETAIL;
  const g = new Graphics();
  const next = sequence(37);
  const shore = riverShoreY(layout);
  // Trees on the far bank, then the bank itself.
  for (let x = snap(next() * 10 * u, u); x < span + 10 * u; x += (7 + Math.floor(next() * 9)) * u) {
    const r = 3 + Math.floor(next() * 3);
    const top = shore - (r + 3 + Math.floor(next() * 4)) * u;
    g.rect(x - u, top, 2 * u, shore - top).fill(art.far.dark);
    disc(g, x, top, r, u, next() < 0.5 ? art.far.main : art.far.dark);
  }
  g.rect(0, shore - 2 * u, Math.max(width, span), 3 * u).fill(art.far.light);
  g.rect(0, shore + u, Math.max(width, span), groundTop - shore).fill(d.water);
  g.rect(0, shore + u, Math.max(width, span), 2 * u).fill(d.waterDeep);
  return g;
}

// ---- Near layer ---------------------------------------------------------------------------------

/** The near layer (parallax `hills`) just behind the track, in the theme's look. */
export function drawNear(layout: RunnerLayout, theme?: SceneTheme, boss = false): Graphics {
  const art = sceneArt(theme);
  if (art.id === 'rung-lap-lai') return forestFloor(layout, art);
  if (art.id === 'xuong') return workbenches(layout, art);
  if (art.id === 'nga-ba') return rocksAndSigns(layout, art);
  if (art.id === 'song') return riverBank(layout, art, boss);
  return hills(layout, art);
}

/** Rolling hills (stacked steps of an arc, one texel per step), from `seed`. */
function rollingHills(
  g: Graphics,
  layout: RunnerLayout,
  art: SceneArt,
  next: () => number,
  size: { half: [number, number]; rise: [number, number]; gap: [number, number] },
): void {
  const { groundTop, tileScale: u } = layout;
  const span = spanOf(layout, PARALLAX.hills);
  let x = -Math.round(next() * 20) * u;
  while (x < span) {
    const half = Math.round(size.half[0] + next() * size.half[1]) * u;
    const rise = Math.round(groundTop * (size.rise[0] + next() * size.rise[1]));
    for (let dx = -half; dx < half; dx += u) {
      const k = 1 - (dx / half) ** 2;
      const h = Math.max(u, Math.round((rise * Math.sqrt(k)) / u) * u);
      g.rect(x + half + dx, groundTop - h, u, h).fill(
        dx > half * 0.35 ? art.near.dark : art.near.main,
      );
      g.rect(x + half + dx, groundTop - h, u, u).fill(art.near.light);
    }
    x += Math.round((half * (size.gap[0] + next() * size.gap[1])) / u) * u;
  }
}

/** Làng Tre: rolling near hills with a few darker bamboo stalks, just behind the track. */
function hills(layout: RunnerLayout, art: SceneArt): Graphics {
  const { groundTop, tileScale: u } = layout;
  const span = spanOf(layout, PARALLAX.hills);
  const g = new Graphics();
  const next = sequence(23);
  const colors = {
    stalk: LANG_TRE_DETAIL.nearStalk,
    node: LANG_TRE_DETAIL.nearNode,
    leaf: LANG_TRE_DETAIL.nearLeaf,
  };
  // A few stalks behind the hills, so the grove gets depth.
  for (let x = Math.round(next() * 30 * u); x < span; x += (26 + Math.floor(next() * 30)) * u) {
    const height = Math.round(groundTop * (0.3 + next() * 0.25));
    stalk(g, Math.round(x / u) * u, groundTop, height, u, colors, next);
    stalk(g, Math.round(x / u) * u + 5 * u, groundTop, height * 0.75, u, colors, next);
  }
  rollingHills(g, layout, art, next, { half: [18, 22], rise: [0.1, 0.08], gap: [1.3, 0.5] });
  return g;
}

/** A mushroom, 5 × 5 texels. */
const MUSHROOM = ['.hhh.', 'hdhhh', 'hhhdh', '..s..', '..s..'];

/** Forest: dark trunks up into the canopy, low bushes and mushrooms. */
function forestFloor(layout: RunnerLayout, art: SceneArt): Graphics {
  const { groundTop, tileScale: u } = layout;
  const span = spanOf(layout, PARALLAX.hills);
  const d = FOREST_DETAIL;
  const g = new Graphics();
  const next = sequence(41);
  for (let x = snap(next() * 30 * u, u); x < span; x += (44 + Math.floor(next() * 36)) * u) {
    const w = (5 + Math.floor(next() * 3)) * u;
    g.rect(x, 0, w, groundTop).fill(d.trunk);
    g.rect(x + u, 0, u, groundTop).fill(d.trunkLight);
    // Roots spreading at the foot.
    g.rect(x - 2 * u, groundTop - 2 * u, w + 4 * u, 2 * u).rect(
      x - u,
      groundTop - 3 * u,
      w + 2 * u,
      u,
    );
    g.fill(d.trunk);
  }
  rollingHills(g, layout, art, next, { half: [8, 10], rise: [0.07, 0.08], gap: [1.1, 0.5] });
  const palette = { h: d.cap, d: d.capDot, s: d.stem };
  for (let x = snap(next() * 40 * u, u); x < span; x += (30 + Math.floor(next() * 40)) * u) {
    picture(g, x, groundTop - 5 * u, MUSHROOM, u, palette);
  }
  return g;
}

/** A wind-up spring with its key, 7 × 15 texels. */
const SPRING = [
  'kk...kk',
  'kmk.kmk',
  'kmmkmmk',
  '.kkmkk.',
  '...m...',
  '...m...',
  '.mmmmm.',
  'mM.....',
  '.MMMMM.',
  '.....Mm',
  '.mmmmm.',
  'mM.....',
  '.MMMMM.',
  '.....Mm',
  'kkkkkkk',
];

/** Workshop: workbenches with a hammer and a wind-up spring on each. */
function workbenches(layout: RunnerLayout, art: SceneArt): Graphics {
  const { groundTop, tileScale: u } = layout;
  const span = spanOf(layout, PARALLAX.hills);
  const d = WORKSHOP_DETAIL;
  const g = new Graphics();
  const next = sequence(43);
  const springPalette = { k: d.metalDark, m: d.metal, M: d.metalDark };
  for (let x = snap(next() * 20 * u, u); x < span; x += (48 + Math.floor(next() * 40)) * u) {
    const top = groundTop - 14 * u;
    const w = 28 * u;
    g.rect(x + u, top + 2 * u, 2 * u, 12 * u).rect(x + w - 3 * u, top + 2 * u, 2 * u, 12 * u);
    g.rect(x + u, top + 9 * u, w - 2 * u, u);
    g.fill(art.near.dark);
    g.rect(x, top, w, 3 * u).fill(art.near.main);
    g.rect(x, top, w, u).fill(art.near.light);
    // A hammer and a wind-up spring on the bench (never on the floor next to the track).
    g.rect(x + 5 * u, top - u, 8 * u, u).fill(d.shelf);
    g.rect(x + 12 * u, top - 3 * u, 2 * u, 3 * u).fill(d.metalDark);
    picture(g, x + 18 * u, top - SPRING.length * u, SPRING, u, springPalette);
  }
  return g;
}

/** A signpost at the crossroads, 15 × 16 texels: two boards pointing opposite ways. */
const SIGN = [
  '......pP.......',
  'kkkkkkkkkkkkk..',
  'kbbbbbbbbbbbbk.',
  'kbbbbbbbbbbbbbk',
  'kbbbbbbbbbbbbk.',
  'kkkkkkkkkkkkk..',
  '......pP.......',
  '..kkkkkkkkkkkkk',
  '.kbbbbbbbbbbbbk',
  'kbbbbbbbbbbbbbk',
  '.kbbbbbbbbbbbbk',
  '..kkkkkkkkkkkkk',
  '......pP.......',
  '......pP.......',
  '......pP.......',
  '......pP.......',
];

/** Mountain pass: boulders, small pines and signposts. */
function rocksAndSigns(layout: RunnerLayout, art: SceneArt): Graphics {
  const { groundTop, tileScale: u } = layout;
  const span = spanOf(layout, PARALLAX.hills);
  const d = MOUNTAIN_DETAIL;
  const g = new Graphics();
  const next = sequence(47);
  // Small pines behind the rocks: two tiers of a stepped triangle on a short trunk.
  for (let x = snap(next() * 30 * u, u); x < span; x += (22 + Math.floor(next() * 40)) * u) {
    const tier = 4 + Math.floor(next() * 3);
    for (let row = 0; row < 2 * tier; row++) {
      const half = Math.floor((row % tier) / 1.5) + (row >= tier ? 1 : 0);
      g.rect(x - half * u, groundTop - (2 * tier - row + 2) * u, (2 * half + 1) * u, u);
    }
    g.fill(d.pine);
    g.rect(x, groundTop - 2 * u, u, 2 * u).fill(d.postDark);
  }
  // Boulders: domes of texel rows, shaded on the right, lit along the top.
  for (let x = snap(next() * 16 * u, u); x < span; x += (16 + Math.floor(next() * 26)) * u) {
    const w = 8 + Math.floor(next() * 9);
    const h = 4 + Math.floor(next() * 5);
    for (let row = 0; row < h; row++) {
      const frac = (h - row) / h;
      const inset = Math.round((w - w * Math.sqrt(1 - frac * frac * 0.85)) / 2);
      const cols = w - 2 * inset;
      const lit = Math.ceil(cols * 0.65);
      const y = groundTop - (h - row) * u;
      g.rect(x + inset * u, y, lit * u, u).fill(row === 0 ? art.near.light : art.near.main);
      g.rect(x + (inset + lit) * u, y, (cols - lit) * u, u).fill(art.near.dark);
    }
  }
  const palette = { k: d.boardEdge, b: d.board, p: d.post, P: d.postDark };
  for (
    let x = snap(span * 0.08, u);
    x < span;
    x += snap(Math.max(110 * u, layout.width * 0.45), u)
  ) {
    picture(g, x, groundTop - SIGN.length * u, SIGN, u, palette);
  }
  return g;
}

/** A small ferry boat, 14 × 4 texels. */
const BOAT = ['kkkkkkkkkkkkkk', 'kooooooooooook', '.kOOOOOOOOOOk.', '..kkkkkkkkkk..'];

/** River bank: reeds, a ferry dock with its boat, and (boss level) a bamboo bridge. */
function riverBank(layout: RunnerLayout, art: SceneArt, boss: boolean): Graphics {
  const { groundTop, tileScale: u } = layout;
  const span = spanOf(layout, PARALLAX.hills);
  const d = RIVER_DETAIL;
  const g = new Graphics();
  const next = sequence(53);
  if (boss) bridge(g, layout, snap(span * 0.42, u));
  // Docks with a boat moored alongside.
  for (let x = snap(span * 0.2, u); x < span; x += snap(Math.max(120 * u, layout.width * 0.6), u)) {
    const deck = groundTop - 7 * u;
    for (const px of [x + u, x + 11 * u, x + 21 * u]) g.rect(px, deck + 2 * u, 2 * u, 7 * u);
    g.fill(d.post);
    g.rect(x, deck, 24 * u, 2 * u).fill(d.deck);
    for (let px = x + 3 * u; px < x + 24 * u; px += 4 * u) g.rect(px, deck, u, 2 * u);
    g.fill(d.deckDark);
    g.rect(x + 22 * u, deck - 3 * u, 2 * u, 3 * u).fill(d.deckDark);
    picture(g, x + 26 * u, groundTop - 5 * u, BOAT, u, {
      k: d.deckDark,
      o: d.boat,
      O: d.boatLight,
    });
  }
  // Reed clumps at the water's edge.
  for (let x = snap(next() * 12 * u, u); x < span; x += (14 + Math.floor(next() * 22)) * u) {
    const blades = 3 + Math.floor(next() * 3);
    for (let i = 0; i < blades; i++) {
      const h = (5 + Math.floor(next() * 7)) * u;
      const bx = x + i * 2 * u;
      g.rect(bx, groundTop - h, u, h).fill(i % 2 === 0 ? art.near.main : art.near.dark);
      if (next() < 0.4) g.rect(bx, groundTop - h - 3 * u, u, 3 * u).fill(d.reedHead);
    }
  }
  return g;
}

/** Boss level of the river: an arched bridge of dry bamboo poles with rails, in the water. */
function bridge(g: Graphics, layout: RunnerLayout, left: number): void {
  const { groundTop, tileScale: u } = layout;
  const d = RIVER_DETAIL;
  const w = 56;
  const rise = 10;
  const base = groundTop - 6 * u;
  for (const pier of [Math.round(w * 0.2), Math.round(w * 0.8) - 2]) {
    const top = base - Math.round(rise * Math.sin((Math.PI * pier) / w)) * u;
    g.rect(left + pier * u, top, 3 * u, groundTop - top);
  }
  g.fill(d.bridgeDark);
  for (let i = 0; i < w; i++) {
    const y = base - Math.round(rise * Math.sin((Math.PI * (i + 0.5)) / w)) * u;
    // Bamboo poles: a darker node every 5 texels along the deck.
    g.rect(left + i * u, y, u, 3 * u).fill(i % 5 === 4 ? d.bridgeDark : d.bridge);
    g.rect(left + i * u, y + 3 * u, u, u).fill(d.bridgeDark);
    if (i % 6 === 0) g.rect(left + i * u, y - 4 * u, u, 4 * u).fill(d.bridgeDark);
    g.rect(left + i * u, y - 4 * u, u, u).fill(d.bridgeDark);
  }
}
