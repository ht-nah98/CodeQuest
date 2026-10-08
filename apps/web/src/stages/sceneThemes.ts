// Pixi-free colours and pieces of the world themes (P2-23, stage-rendering.md §7). One entry per
// `SceneTheme` (content-schema, `world.theme.scene`): the runner backdrop, the ground and maze tiles
// (sceneTiles.ts), the static pictures' sky and the animated decoration. Every colour is a token
// or derived from tokens (`shade`, `mix`), so the palette stays one source (ADR-0014).
// Hazards (hole, branch, crate), bamboo shoots, mission items and goals are NOT themed: they keep
// their shapes and colours everywhere; sceneThemes.test.ts checks they still stand out.
import {
  DEFAULT_SCENE_THEME,
  SCENE_THEMES,
  type SceneTheme,
  SceneThemeSchema,
} from '@codequest/content-schema';
import { BLOCK_COLORS, UI_COLORS } from '../ui/tokens';
import { mix, shade } from './colors';
import { PALETTE } from './maze/pixelArt';
import {
  GROUND_PATTERNS,
  type GroundPatterns,
  MAZE_PATTERNS,
  type MazePatterns,
} from './sceneTiles';

export { DEFAULT_SCENE_THEME, SCENE_THEMES, type SceneTheme };

const C = UI_COLORS;
const B = BLOCK_COLORS;

/** Three tones of one layer: the colour covering most of it, its shade and its highlight. */
export interface Tones {
  main: string;
  dark: string;
  light: string;
}

export interface SceneArt {
  id: SceneTheme;
  /** Runner sky bands, top to horizon (`low` is the band right behind the track). */
  sky: { high: string; mid: string; low: string };
  /** The far layer (bamboo grove, gears on the wall, mountains, far shore). */
  far: Tones;
  /** The near layer just behind the track (hills, bushes, benches, rocks, reeds). */
  near: Tones;
  /**
   * Colours covering large areas behind the track's action band (Măng, branches, crates, shoots,
   * items, goal): from the middle of the sky down to the ground. The contrast test checks every
   * hazard and item against each of them.
   */
  backdrop: readonly string[];
  /** Runner ground: `null` keeps the Kenney tiles (Làng Tre). */
  ground: { patterns: GroundPatterns; palette: Readonly<Record<string, string>> } | null;
  /** Maze tiles: `patterns: null` keeps maze/pixelArt.ts (Làng Tre). */
  maze: {
    patterns: MazePatterns | null;
    palette: Readonly<Record<string, string>>;
    /** Canvas around the board. */
    background: string;
  };
  /** Sky behind the static SVG pictures (track strip, "Xem cả đường", answer cards). */
  svgSky: string;
  /** Animated decoration (still under reduced motion). */
  decor: 'fireflies' | 'water' | null;
}

// ---- Làng Tre (W1): unchanged day valley --------------------------------------------------------

const LANG_TRE: SceneArt = {
  id: 'lang-tre',
  sky: { high: shade(C.sky, 0.93), mid: C.sky, low: shade(C.sky, 1.35) },
  far: { main: shade(C.go, 1.6), dark: shade(C.go, 1.45), light: shade(C.go, 1.68) },
  near: { main: shade(C.go, 1.35), dark: shade(C.go, 1.22), light: shade(C.go, 1.5) },
  backdrop: [],
  ground: null,
  maze: { patterns: null, palette: PALETTE, background: C.ground },
  svgSky: C.sky,
  decor: null,
};

/** Làng Tre's sun and the darker bamboo stalks among its hills. */
export const LANG_TRE_DETAIL = {
  sun: C.coinShine,
  sunRim: shade(C.coin, 1.55),
  nearStalk: shade(C.go, 1.15),
  nearNode: shade(C.go, 0.95),
  nearLeaf: shade(C.go, 1.25),
} as const;

// ---- Rừng Lặp Lại (W2): deep forest, darker bamboo, fireflies ----------------------------------

const FOREST: SceneArt = {
  id: 'rung-lap-lai',
  sky: {
    high: mix(C.goDeep, C.ink, 0.45),
    mid: mix(C.goDeep, C.sky, 0.5),
    low: mix(C.go, C.paper, 0.6),
  },
  far: {
    main: mix(C.goDeep, C.sky, 0.55),
    dark: mix(C.goDeep, C.sky, 0.4),
    light: mix(C.go, C.sky, 0.6),
  },
  near: {
    main: mix(C.goDeep, C.paper, 0.5),
    dark: mix(C.goDeep, C.paper, 0.4),
    light: mix(C.go, C.paper, 0.5),
  },
  backdrop: [],
  ground: {
    patterns: GROUND_PATTERNS['rung-lap-lai'],
    palette: {
      k: mix(C.ink, C.goDeep, 0.3),
      m: mix(C.go, C.goDeep, 0.35),
      M: C.goDeep,
      l: C.coinDeep,
      d: mix(B.robot, C.goDeep, 0.15),
      s: mix(B.robot, C.goDeep, 0.25),
      S: shade(mix(B.robot, C.goDeep, 0.25), 0.85),
      p: mix(B.robot, C.paper2, 0.45),
    },
  },
  maze: {
    patterns: MAZE_PATTERNS['rung-lap-lai'],
    palette: {
      q: mix(C.paper2, C.go, 0.15),
      r: shade(mix(C.paper2, C.go, 0.15), 0.9),
      l: mix(C.go, C.paper2, 0.3),
      G: mix(C.goDeep, C.ink, 0.35),
      g: C.goDeep,
    },
    background: mix(C.ground, C.go, 0.25),
  },
  svgSky: mix(C.go, C.paper, 0.6),
  decor: 'fireflies',
};

/** The canopy, light shafts, trunks, mushrooms and fireflies of the forest. */
export const FOREST_DETAIL = {
  canopy: mix(C.goDeep, C.ink, 0.3),
  canopyLight: C.goDeep,
  vine: mix(C.goDeep, C.ink, 0.15),
  shaft: C.coinShine,
  // Misty grey-brown trunks: dark enough to read as forest, light enough behind the track.
  trunk: mix(mix(B.robot, C.goDeep, 0.4), C.paper2, 0.45),
  trunkLight: mix(mix(B.robot, C.goDeep, 0.4), C.paper2, 0.6),
  cap: C.hint,
  capDot: C.paper,
  stem: C.paper2,
  firefly: C.coinShine,
  fireflyGlow: C.coin,
} as const;

// ---- Xưởng (W3): wooden workshop ----------------------------------------------------------------

const WORKSHOP: SceneArt = {
  id: 'xuong',
  sky: {
    high: shade(B.robot, 0.62),
    mid: mix(B.robot, C.paper, 0.45),
    low: mix(B.robot, C.paper, 0.6),
  },
  // Muted iron gears (not coin gold): grey-lavender with a softer ring and a pale hub.
  far: {
    main: mix(C.brand, C.paper2, 0.55),
    dark: mix(C.brand, C.paper2, 0.4),
    light: mix(C.brand, C.paper2, 0.8),
  },
  near: {
    main: mix(B.robot, C.paper, 0.5),
    dark: mix(B.robot, C.paper, 0.4),
    light: mix(B.robot, C.paper, 0.7),
  },
  backdrop: [],
  ground: {
    patterns: GROUND_PATTERNS.xuong,
    palette: {
      k: mix(C.ink, B.robot, 0.3),
      t: mix(B.robot, C.paper, 0.6),
      w: mix(B.robot, C.paper, 0.4),
      W: mix(B.robot, C.paper, 0.2),
      n: C.inkSoft,
      j: B.robot,
      b: mix(B.robot, C.paper, 0.15),
      B: shade(B.robot, 0.9),
    },
  },
  maze: {
    patterns: MAZE_PATTERNS.xuong,
    palette: {
      p: mix(C.paper2, B.robot, 0.15),
      P: mix(C.paper2, B.robot, 0.35),
      n: C.inkSoft,
      o: mix(C.paper2, B.robot, 0.3),
      r: mix(C.paper2, B.robot, 0.45),
      W: shade(B.robot, 0.65),
      w: shade(B.robot, 0.85),
      h: B.robot,
      i: C.inkSoft,
      I: mix(C.inkSoft, C.paper, 0.5),
    },
    background: mix(C.ground, B.robot, 0.15),
  },
  svgSky: mix(B.robot, C.paper, 0.6),
  decor: null,
};

/** The workshop's beams, plank seams, round window, lanterns, shelves and wind-up springs. */
export const WORKSHOP_DETAIL = {
  beam: shade(B.robot, 0.5),
  beamLight: shade(B.robot, 0.7),
  plankLine: mix(B.robot, C.paper, 0.38),
  frame: shade(B.robot, 0.6),
  glass: C.sky,
  glassLight: shade(C.sky, 1.4),
  rope: shade(B.robot, 0.6),
  lantern: C.coin,
  lanternGlow: C.coinShine,
  lanternCap: C.inkSoft,
  shelf: mix(B.robot, C.paper, 0.4),
  jarA: C.hint,
  jarB: C.sky,
  jarC: shade(C.go, 1.3),
  metal: mix(C.inkSoft, C.paper, 0.45),
  metalDark: C.inkSoft,
} as const;

// ---- Ngã Ba (W4): mountain path at dusk, signposts, rocks ---------------------------------------

const MOUNTAIN: SceneArt = {
  id: 'nga-ba',
  sky: {
    high: mix(C.brandDeep, C.brand, 0.4),
    mid: mix(C.hint, C.brand, 0.35),
    low: mix(C.coinShine, C.hint, 0.45),
  },
  far: {
    main: mix(C.brand, C.brandSoft, 0.45),
    dark: mix(C.brand, C.brandDeep, 0.3),
    light: mix(C.brandSoft, C.hint, 0.3),
  },
  near: {
    main: mix(C.brand, C.paper2, 0.5),
    dark: mix(C.brand, C.paper2, 0.4),
    light: C.paper2,
  },
  backdrop: [],
  ground: {
    patterns: GROUND_PATTERNS['nga-ba'],
    palette: {
      k: mix(C.ink, C.brandDeep, 0.4),
      d: mix(C.paper2, C.coin, 0.25),
      y: mix(C.coin, C.go, 0.35),
      g: mix(C.paper2, B.robot, 0.3),
      G: mix(C.paper2, B.robot, 0.55),
      r: mix(C.brand, B.robot, 0.35),
      R: shade(mix(C.brand, B.robot, 0.35), 0.8),
      s: mix(C.brand, C.paper2, 0.35),
    },
  },
  maze: {
    patterns: MAZE_PATTERNS['nga-ba'],
    palette: {
      q: mix(C.paper2, C.coin, 0.12),
      r: shade(mix(C.paper2, C.coin, 0.12), 0.9),
      n: mix(C.paper2, C.brand, 0.45),
      R: mix(C.brand, C.inkSoft, 0.55),
      s: C.brand,
      S: mix(C.brand, C.brandSoft, 0.5),
    },
    background: mix(C.ground, C.hint, 0.2),
  },
  svgSky: mix(C.coinShine, C.hint, 0.45),
  decor: null,
};

/** The setting sun, evening stars, streaky clouds, snow, signposts and pines of the pass. */
export const MOUNTAIN_DETAIL = {
  sun: mix(C.hint, C.coin, 0.35),
  sunRim: mix(C.hint, C.oops, 0.3),
  star: C.coinShine,
  cloud: mix(C.hint, C.paper, 0.45),
  snow: C.paper,
  post: B.robot,
  postDark: shade(B.robot, 0.7),
  board: mix(B.robot, C.paper2, 0.5),
  boardEdge: C.inkSoft,
  pine: mix(C.goDeep, C.brandSoft, 0.6),
} as const;

// ---- Sông (W5): riverside, water, ferry dock, bamboo bridge on the boss level ---------------------------------------

const RIVER: SceneArt = {
  id: 'song',
  sky: { high: shade(C.sky, 0.93), mid: C.sky, low: shade(C.sky, 1.35) },
  far: {
    main: mix(C.go, C.sky, 0.6),
    dark: mix(C.go, C.sky, 0.45),
    light: mix(C.go, C.paper, 0.7),
  },
  near: {
    main: mix(C.go, C.paper, 0.3),
    dark: mix(C.go, C.paper, 0.15),
    light: mix(C.go, C.paper, 0.55),
  },
  backdrop: [],
  ground: {
    patterns: GROUND_PATTERNS.song,
    palette: {
      k: mix(C.ink, C.goDeep, 0.3),
      m: shade(C.go, 1.3),
      M: shade(C.go, 1.1),
      D: C.go,
      c: mix(C.paper2, C.coinDeep, 0.35),
      C: mix(C.paper2, C.coinDeep, 0.55),
      p: mix(C.brand, C.paper2, 0.4),
      h: C.hint,
    },
  },
  maze: {
    patterns: MAZE_PATTERNS.song,
    palette: {
      q: mix(C.paper2, C.coin, 0.2),
      r: shade(mix(C.paper2, C.coin, 0.2), 0.9),
      n: mix(C.paper2, B.robot, 0.3),
      h: C.hint,
      u: shade(B.move, 0.95),
      U: shade(B.move, 0.75),
      w: mix(B.move, C.sky, 0.6),
    },
    background: mix(C.ground, C.sky, 0.5),
  },
  svgSky: shade(C.sky, 1.35),
  decor: 'water',
};

/** The river, its glints, the dock, a ferry boat, reeds and the boss level's bamboo bridge. */
export const RIVER_DETAIL = {
  sun: C.coinShine,
  sunRim: shade(C.coin, 1.55),
  water: mix(C.sky, B.move, 0.3),
  waterDeep: mix(C.sky, B.move, 0.5),
  glint: C.white,
  reedHead: B.robot,
  deck: mix(B.robot, C.paper, 0.35),
  deckDark: B.robot,
  post: shade(B.robot, 0.75),
  boat: C.hint,
  boatLight: C.paper,
  bridge: mix(C.coin, C.go, 0.4),
  bridgeDark: mix(C.goDeep, B.robot, 0.4),
} as const;

// ---- Thành Phố Robot (W6): robot city, line-grid test mat, lab --------------------------------

const CITY: SceneArt = {
  id: 'thanh-pho-robot',
  sky: { high: mix(C.sky, C.brand, 0.2), mid: C.sky, low: shade(C.sky, 1.35) },
  // A lavender-grey skyline far away, street hedges near the track.
  far: {
    main: mix(C.brand, C.paper2, 0.55),
    dark: mix(C.brand, C.paper2, 0.4),
    light: mix(C.brand, C.paper2, 0.8),
  },
  near: {
    main: mix(C.go, C.paper, 0.3),
    dark: mix(C.go, C.paper, 0.15),
    light: mix(C.go, C.paper, 0.55),
  },
  backdrop: [],
  ground: {
    patterns: GROUND_PATTERNS['thanh-pho-robot'],
    palette: {
      k: mix(C.ink, C.brandDeep, 0.4),
      c: mix(C.paper2, C.brand, 0.2),
      C: mix(C.paper2, C.brand, 0.4),
      p: mix(C.paper2, C.coin, 0.15),
      P: mix(C.paper2, C.coin, 0.3),
      j: mix(C.paper2, C.brand, 0.45),
      a: mix(C.inkSoft, C.paper2, 0.62),
      A: mix(C.inkSoft, C.paper2, 0.45),
    },
  },
  maze: {
    patterns: MAZE_PATTERNS['thanh-pho-robot'],
    palette: {
      q: mix(C.paper2, C.brandSoft, 0.35),
      r: shade(mix(C.paper2, C.brandSoft, 0.35), 0.9),
      n: mix(C.paper2, C.brand, 0.4),
      W: C.brandDeep,
      w: C.brand,
      g: mix(C.sky, C.brand, 0.3),
    },
    background: mix(C.ground, C.sky, 0.35),
  },
  svgSky: shade(C.sky, 1.35),
  decor: null,
};

/** The skyline's windows and antennas, and the robot lab board's pavement (stages/robotlab). */
export const CITY_DETAIL = {
  window: C.coinShine,
  windowDark: mix(C.brand, C.paper2, 0.3),
  antenna: C.inkSoft,
  beacon: C.oops,
  /** The pavement around the robot lab's test mat, and its slab seams. */
  pavement: mix(C.ground, C.sky, 0.35),
  pavementSeam: shade(mix(C.ground, C.sky, 0.35), 0.94),
} as const;

/** Each theme's backdrop: the sky in the action band and the big layers behind the track. */
const withBackdrop = (art: SceneArt, extra: readonly string[] = []): SceneArt => ({
  ...art,
  backdrop: [art.sky.mid, art.sky.low, art.far.main, art.near.main, art.near.dark, ...extra],
});

/** Every theme by id. */
export const SCENE_ART: Readonly<Record<SceneTheme, SceneArt>> = {
  'lang-tre': withBackdrop(LANG_TRE),
  // Big shapes crossing the action band (groundTop × 0.3 … 1) count as backdrop too.
  'rung-lap-lai': withBackdrop(FOREST, [FOREST_DETAIL.trunk, FOREST_DETAIL.trunkLight]),
  xuong: withBackdrop(WORKSHOP, [
    WORKSHOP.far.dark,
    WORKSHOP_DETAIL.shelf,
    WORKSHOP_DETAIL.plankLine,
    WORKSHOP.near.light,
  ]),
  'nga-ba': withBackdrop(MOUNTAIN, [
    MOUNTAIN.far.light,
    MOUNTAIN_DETAIL.board,
    MOUNTAIN_DETAIL.pine,
    MOUNTAIN_DETAIL.snow,
  ]),
  song: withBackdrop(RIVER, [
    RIVER_DETAIL.water,
    RIVER_DETAIL.waterDeep,
    RIVER_DETAIL.deck,
    RIVER_DETAIL.boat,
    RIVER_DETAIL.bridge,
  ]),
  'thanh-pho-robot': withBackdrop(CITY, [CITY.far.dark, CITY.far.light]),
};

/** The art of a theme; no theme (a stage mounted without one) is Làng Tre. */
export function sceneArt(theme: SceneTheme | undefined): SceneArt {
  return SCENE_ART[theme ?? DEFAULT_SCENE_THEME];
}

/** A theme id read from outside (the dev `?theme=` preview): unknown values give `null`. */
export function parseSceneTheme(value: string | null | undefined): SceneTheme | null {
  const parsed = SceneThemeSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
