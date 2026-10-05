import { describe, expect, it } from 'vitest';
import { SCENE_THEMES } from '@codequest/content-schema';
import { UI_COLORS } from '../ui/tokens';
import { contrast, deltaE, luminance } from './colors';
import { CAGE_OPEN_ART, GOAL_ART, type GoalArt, ITEM_ART } from './goalArt';
import { PALETTE, PATTERNS } from './maze/pixelArt';
import {
  DEFAULT_SCENE_THEME,
  parseSceneTheme,
  SCENE_ART,
  type SceneArt,
  sceneArt,
} from './sceneThemes';
import { GROUND_PIECES, groundPiece } from './sceneTiles';

// P2-23: every theme changes only the scenery. Hazards (hole, branch, crate), bamboo shoots,
// mission items, goals and Măng must stay instantly recognisable, so each must stand out from
// every large colour behind it.
//
// Thresholds: WCAG 2.x non-text contrast (SC 1.4.11), 3:1, for the object's outline against
// every backdrop colour, and a clearly different colour for its body (CIE76 ΔE ≥ 20: a gold key
// on a blue sky has little luminance contrast but a big colour difference); a picture without
// an outline needs 3:1 from its body. Exceptions are listed in OUTLINE_ONLY.
const MIN_CONTRAST = 3;
/** The body of an outlined object against a backdrop colour: clearly a different colour (ΔE). */
const MIN_BODY_DELTA_E = 20;
/**
 * Maze walls against the floor, by mean luminance of the two tiles: at least as clear as Làng
 * Tre's approved bamboo maze (2.28:1; its bamboo stalks have light stripes, so its mean is lower
 * than its darkest green).
 */
const MIN_WALL_CONTRAST = 2.25;

// apps/web has no Node types (DOM code must not see them): declare just what is used here, and
// build the path with plain string maths (Vite rewrites `new URL('./x', import.meta.url)`).
declare const process: {
  getBuiltinModule(id: 'node:fs'): { readFileSync(path: string): Uint8Array };
};
const tilesDir = decodeURIComponent(
  import.meta.url.replace(/^file:\/\//, '').replace(/src\/stages\/[^/]*$/, 'public/tiles/'),
);

/** Opaque palette entries of an indexed Kenney PNG (PLTE minus fully transparent tRNS entries). */
function tileColours(name: string): string[] {
  const file = process.getBuiltinModule('node:fs').readFileSync(`${tilesDir}${name}.png`);
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  let plte: Uint8Array | null = null;
  let trns: Uint8Array | null = null;
  for (let at = 8; at + 8 <= file.length;) {
    const length = view.getUint32(at);
    const type = String.fromCharCode(...file.subarray(at + 4, at + 8));
    const data = file.subarray(at + 8, at + 8 + length);
    if (type === 'PLTE') plte = data;
    if (type === 'tRNS') trns = data;
    at += 12 + length;
  }
  if (plte === null) throw new Error(`${name}.png is not an indexed PNG`);
  const colours: string[] = [];
  for (let i = 0; i * 3 < plte.length; i++) {
    if (trns !== null && i < trns.length && trns[i] === 0) continue;
    const hex = [0, 1, 2].map((k) => (plte[i * 3 + k] ?? 0).toString(16).padStart(2, '0'));
    colours.push(`#${hex.join('')}`);
  }
  return colours;
}


/** Colours covering at least `share` of a pattern's texels. */
function dominant(
  rows: readonly string[],
  palette: Readonly<Record<string, string>>,
  share: number,
  skip = '.',
): string[] {
  const counts = new Map<string, number>();
  let total = 0;
  for (const ch of rows.join('')) {
    if (skip.includes(ch)) continue;
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
    total += 1;
  }
  return [...counts].filter(([, n]) => n / total >= share).map(([ch]) => palette[ch] ?? '#000000');
}

/** Mean relative luminance of a pattern's opaque texels. */
function meanLuminance(rows: readonly string[], palette: Readonly<Record<string, string>>): number {
  const texels = Array.from(rows.join('').replaceAll('.', ''));
  const sum = texels.reduce((total, ch) => total + luminance(palette[ch] ?? '#000000'), 0);
  return sum / texels.length;
}

const best = (colours: readonly string[], backdrop: string): number =>
  Math.max(...colours.map((c) => contrast(c, backdrop)));

/** Măng's fur and cream (art-direction.md §2, sampled from the sprite). */
const PANDA = ['#202028', '#f9f0e8'];

/**
 * A thing on the track as the eye finds it: its outline (the dark ring around it; `null` when
 * the picture has none) and its body (the colours filling most of it).
 */
interface Silhouette {
  name: string;
  outline: string | null;
  body: readonly string[];
}

/** Outline and body of a goal / item picture: the border letter, then its biggest colour. */
function artSilhouette(name: string, art: GoalArt): Silhouette {
  const border = ['k', 'O'].find((ch) => art.rows.some((row) => row.includes(ch)));
  const counts = new Map<string, number>();
  for (const ch of art.rows.join('')) {
    if (ch === '.' || ch === border) continue;
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  const [top] = [...counts].sort((a, b) => b[1] - a[1]);
  return {
    name,
    outline: border === undefined ? null : (art.palette[border] ?? null),
    body: top ? [art.palette[top[0]] ?? '#000000'] : [],
  };
}

/** A Kenney tile's outline and body, checked against the tile's own PNG palette. */
function tileSilhouette(
  name: string,
  tiles: string[],
  outline: string,
  body: string[],
): Silhouette {
  const palette = tiles.flatMap(tileColours);
  for (const color of [outline, ...body]) expect(palette, `${name} ${color}`).toContain(color);
  return { name, outline, body };
}

/** Everything that stands on the runner track, as drawn on the stage. */
const RUNNER_OBJECTS: readonly Silhouette[] = [
  tileSilhouette('crate', ['crate'], '#6f3e43', ['#cb815e', '#9f5a52']),
  tileSilhouette('branch', ['branch_left', 'branch_right'], '#345551', ['#36e377', '#2eb082']),
  tileSilhouette('bamboo shoot', ['bamboo'], '#345551', ['#36e377', '#2eb082']),
  tileSilhouette('flag', ['flag_1'], '#434a5f', ['#fc683b', '#dd442c']),
  // Măng: black fur (outline, ears, arms, legs: half of her) round a cream face and belly.
  { name: 'Măng', outline: PANDA[0] ?? '#202028', body: PANDA },
  artSilhouette('key', ITEM_ART.key),
  artSilhouette('friend', ITEM_ART.friend),
  artSilhouette('open cage', CAGE_OPEN_ART),
  ...Object.entries(GOAL_ART).map(([name, art]) => artSilhouette(`goal ${name}`, art)),
];

/**
 * Pictures recognised by their thick ink outline alone: their body is pale (paper house, white
 * bunny, lit doorway, water under the dock), close to a pale sky in every theme, Làng Tre's
 * approved one included. Accepted and documented in stage-rendering.md §7. Any other
 * outline-only case must be added here on purpose, as `<theme>/<object>`.
 */
const OUTLINE_ONLY_EVERYWHERE: ReadonlySet<string> = new Set([
  'goal home',
  'goal friend',
  'goal exit',
  'goal dock',
]);
const OUTLINE_ONLY: ReadonlySet<string> = new Set<string>([]);
const outlineOnly = (theme: string, name: string): boolean =>
  OUTLINE_ONLY_EVERYWHERE.has(name) || OUTLINE_ONLY.has(`${theme}/${name}`);

/** An object passes a backdrop when its outline reaches 3:1 and its body ΔE 20 (best colour). */
function standsOut(object: Silhouette, backdrop: string, outlineOnly = false): boolean {
  // A picture without an outline must stand out by its body alone, at the full 3:1.
  if (object.outline === null) return best(object.body, backdrop) >= MIN_CONTRAST;
  const outline = contrast(object.outline, backdrop) >= MIN_CONTRAST;
  const body =
    outlineOnly || Math.max(...object.body.map((c) => deltaE(c, backdrop))) >= MIN_BODY_DELTA_E;
  return outline && body;
}

/** Kenney's grass and dirt (ground.png minus its outline and specks): Làng Tre's ground. */
const KENNEY_GROUND = ['#36e377', '#2eb082', '#cb815e'];

/** The big colours of a theme's runner ground surface (what a hole is cut into). */
function groundColours(art: SceneArt): string[] {
  if (art.ground === null) return KENNEY_GROUND;
  const top = groundPiece(art.ground.patterns, 'ground').slice(2);
  const fill = groundPiece(art.ground.patterns, 'dirt');
  return [
    ...dominant(top, art.ground.palette, 0.1, '.k'),
    ...dominant(fill, art.ground.palette, 0.1, '.k'),
  ];
}

const THEMES = SCENE_THEMES.map((id) => [id, SCENE_ART[id]] as const);

describe('scene themes (P2-23)', () => {
  it('has art for every theme of the schema, Làng Tre by default', () => {
    expect(Object.keys(SCENE_ART).sort()).toEqual([...SCENE_THEMES].sort());
    for (const [id, art] of THEMES) expect(art.id).toBe(id);
    expect(sceneArt(undefined)).toBe(SCENE_ART[DEFAULT_SCENE_THEME]);
    expect(sceneArt('song')).toBe(SCENE_ART.song);
    expect(DEFAULT_SCENE_THEME).toBe('lang-tre');
  });

  it('reads a theme id from outside, rejecting unknown ones', () => {
    expect(parseSceneTheme('nga-ba')).toBe('nga-ba');
    expect(parseSceneTheme('moon')).toBeNull();
    expect(parseSceneTheme(null)).toBeNull();
    expect(parseSceneTheme(undefined)).toBeNull();
  });

  it('keeps Làng Tre as it was (Kenney ground, the maze bamboo tiles, sky token)', () => {
    const art = SCENE_ART['lang-tre'];
    expect(art.ground).toBeNull();
    expect(art.maze.patterns).toBeNull();
    expect(art.maze.palette).toBe(PALETTE);
    expect(art.maze.background).toBe(UI_COLORS.ground);
    expect(art.sky.mid).toBe(UI_COLORS.sky);
    expect(art.svgSky).toBe(UI_COLORS.sky);
    expect(art.decor).toBeNull();
  });

  it.each(THEMES)('%s: every colour is a hex and every pattern letter has one', (_id, art) => {
    const hex = /^#[0-9a-f]{6}$/;
    for (const color of [
      art.sky.high,
      art.sky.mid,
      art.sky.low,
      ...[art.far, art.near].flatMap((t) => [t.main, t.dark, t.light]),
      ...art.backdrop,
      art.svgSky,
      art.maze.background,
    ]) {
      expect(color).toMatch(hex);
    }
    if (art.ground) {
      for (const piece of GROUND_PIECES) {
        const rows = groundPiece(art.ground.patterns, piece);
        expect(rows).toHaveLength(18);
        for (const row of rows) {
          expect(row).toHaveLength(18);
          for (const ch of row.replaceAll('.', '')) expect(art.ground.palette[ch], ch).toMatch(hex);
        }
      }
    }
    const maze = art.maze.patterns;
    if (maze) {
      for (const rows of [maze.floor, maze.wall]) {
        expect(rows).toHaveLength(12);
        for (const row of rows) {
          expect(row).toHaveLength(12);
          for (const ch of row) expect(art.maze.palette[ch], ch).toMatch(hex);
        }
      }
    }
  });

  it('the contrast check can fail: an object on its own colours does not stand out', () => {
    const crate = RUNNER_OBJECTS.find((o) => o.name === 'crate');
    if (!crate) throw new Error('no crate');
    expect(standsOut(crate, UI_COLORS.sky)).toBe(true);
    // A backdrop of the crate's own outline colour, or of its body colour, fails.
    expect(standsOut(crate, crate.outline ?? '')).toBe(false);
    expect(standsOut(crate, crate.body[0] ?? '')).toBe(false);
    // A dark backdrop fails every dark-outlined object.
    expect(RUNNER_OBJECTS.filter((o) => standsOut(o, UI_COLORS.ink)).length).toBeLessThan(
      RUNNER_OBJECTS.length / 2,
    );
  });

  it('gives edge pieces a 2-texel outline and a cut top corner, like the Kenney tiles', () => {
    const patterns = SCENE_ART.song.ground?.patterns;
    if (!patterns) throw new Error('song has its own ground');
    const left = groundPiece(patterns, 'ground_left');
    const right = groundPiece(patterns, 'ground_right');
    expect(left[0]?.slice(0, 3)).toBe('.kk');
    expect(right[0]?.slice(-3)).toBe('kk.');
    expect(left[5]?.slice(0, 2)).toBe('kk');
    expect(right[5]?.slice(-2)).toBe('kk');
    expect(groundPiece(patterns, 'dirt_left')[0]?.slice(0, 3)).not.toContain('.');
    expect(groundPiece(patterns, 'ground')).toEqual(patterns.top);
  });

  describe.each(THEMES)('%s keeps hazards and items easy to see', (_id, art) => {
    it.each(RUNNER_OBJECTS.map((o) => [o.name, o] as const))(
      '%s stands out from the sky and the layers behind it',
      (name, object) => {
        const onlyOutline = outlineOnly(art.id, name);
        for (const backdrop of [...art.backdrop, art.svgSky]) {
          expect(standsOut(object, backdrop, onlyOutline), `${name} on ${backdrop}`).toBe(true);
        }
      },
    );

    it('a hole (the dark pit) stands out from the ground around it', () => {
      for (const ground of groundColours(art)) {
        expect(contrast(UI_COLORS.ink, ground), ground).toBeGreaterThanOrEqual(MIN_CONTRAST);
      }
    });

    it('maze walls stand out from the floor, and items from the floor', () => {
      const floor = art.maze.patterns?.floor ?? PATTERNS.floor;
      const wall = art.maze.patterns?.wall ?? PATTERNS.wall;
      const lw = meanLuminance(wall, art.maze.palette);
      const lf = meanLuminance(floor, art.maze.palette);
      expect((lf + 0.05) / (lw + 0.05)).toBeGreaterThanOrEqual(MIN_WALL_CONTRAST);
      const floors = dominant(floor, art.maze.palette, 0.1);
      const mazeItems: Silhouette[] = [
        artSilhouette('maze shoot', { rows: PATTERNS.bamboo, palette: PALETTE }),
        artSilhouette('arrow', { rows: PATTERNS.arrow, palette: PALETTE }),
        artSilhouette('key', ITEM_ART.key),
        artSilhouette('friend', ITEM_ART.friend),
        { name: 'Măng', outline: PANDA[0] ?? '#202028', body: PANDA },
      ];
      for (const f of floors) {
        for (const item of mazeItems) expect(standsOut(item, f), `${item.name} on ${f}`).toBe(true);
      }
    });
  });
});
