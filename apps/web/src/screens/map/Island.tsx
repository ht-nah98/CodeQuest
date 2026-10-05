// A floating pixel island of the adventure map (art-direction.md §4 "Bản đồ phiêu lưu"),
// drawn on a 28×14 grid in token colours. Locked islands are drawn in lavender fog.
// Each world's island wears its scenery theme (P2-23, stage-rendering.md §7): its own ground
// colours and a small landmark standing on top (trees and fireflies, a gear and a lantern, a peak
// and a signpost, a river with reeds and a dock). Làng Tre keeps the original island.
import type { SceneTheme } from '@codequest/content-schema';
import { mix, shade } from '../../stages/colors';
import { BLOCK_COLORS, UI_COLORS } from '../../ui/tokens';

const MAP = [
  '......kkkkkkkkkkkkkkkk......',
  '....kkggggggggggggggggkk....',
  '..kkgggggLgggggggggLggggkk..',
  '.kgggLggggggggggggggggLgggk.',
  'kggggggggggggggLgggggggggggk',
  'kGGGgggGGGGgggggggGGGGgggGGk',
  'kdddGGGddddGGGGGGGddddGGGddk',
  '.kddddddddddsdddddddddddddk.',
  '..kddsdddddddddddddddsdddk..',
  '...kkdddddddddddddddddddk...',
  '.....kkddddddsddddddddkk....',
  '.......kkddddddddddkkk......',
  '.........kkkdddddkk.........',
  '............kkkkk...........',
];

const WIDTH = 28;
const HEIGHT = MAP.length;

export type IslandLook = 'open' | 'done' | 'locked';

const FILLS: Record<IslandLook, Record<string, string>> = {
  open: {
    k: 'fill-ink',
    g: 'fill-go',
    G: 'fill-go-deep',
    L: 'fill-go-deep',
    d: 'fill-block-robot',
    s: 'fill-ink-soft',
  },
  done: {
    k: 'fill-ink',
    g: 'fill-go',
    G: 'fill-go-deep',
    L: 'fill-coin',
    d: 'fill-block-robot',
    s: 'fill-ink-soft',
  },
  locked: {
    k: 'fill-ink-soft',
    g: 'fill-brand-soft',
    G: 'fill-brand',
    L: 'fill-brand',
    d: 'fill-brand',
    s: 'fill-ink-soft',
  },
};

const C = UI_COLORS;
const B = BLOCK_COLORS;

/**
 * A theme's look on the map: the island's ground (hex per letter of MAP, open look; `L` turns
 * coin when the world is done) and its landmark: rows standing on the grass, bottom row on MAP
 * row 1, letters coloured by `colors` (open / done) or fogged with the island when locked.
 */
interface IslandTheme {
  ground: Record<string, string>;
  landmark: readonly string[];
  colors: Record<string, string>;
}

const ISLAND_THEMES: Readonly<Partial<Record<SceneTheme, IslandTheme>>> = {
  'rung-lap-lai': {
    ground: {
      g: mix(C.go, C.goDeep, 0.5),
      G: mix(C.goDeep, C.ink, 0.25),
      L: shade(C.go, 1.2),
      d: shade(B.robot, 0.8),
      s: C.inkSoft,
    },
    landmark: [
      '..........f.................',
      '......TTT.......f..TTTT.....',
      '.....TTTTT........TTTTTT....',
      '....TTtTTTT......TTTtTTTT...',
      '.....TTTTT..f.....TTTTTT....',
      '.......b...........bb.......',
      '.......b...........bb.......',
      '.......b...........bb.......',
    ],
    colors: { T: mix(C.goDeep, C.ink, 0.3), t: C.go, b: shade(B.robot, 0.6), f: C.coin },
  },
  xuong: {
    ground: {
      g: mix(B.robot, C.paper, 0.45),
      G: B.robot,
      L: C.coinDeep,
      d: shade(B.robot, 0.75),
      s: C.inkSoft,
    },
    landmark: [
      '.........y..........k.......',
      '......y.yyy.y......kyk......',
      '.......yyyyy.......kyk......',
      '......yyykyyy.......k.......',
      '.......yyyyy........p.......',
      '......y.yyy.y.......p.......',
      '.........y..........p.......',
      '....................p.......',
    ],
    colors: { y: mix(C.coinDeep, C.coin, 0.4), k: C.inkSoft, p: B.robot },
  },
  'nga-ba': {
    ground: {
      g: mix(C.paper2, B.robot, 0.3),
      G: mix(C.brand, B.robot, 0.35),
      L: mix(C.coin, C.go, 0.35),
      d: mix(C.brand, C.inkSoft, 0.3),
      s: C.brandSoft,
    },
    landmark: [
      '...........w................',
      '..........www.....kkkkkk....',
      '.........wwmmm....kbbbbbk...',
      '........mmmmmmm...kkkkkk....',
      '.......mmmmmmmmm....p.......',
      '.......mmmmmmmmm....p.......',
      '.......mmmmmmmmm....p.......',
    ],
    colors: {
      w: C.paper,
      m: mix(C.brand, C.brandSoft, 0.35),
      k: C.ink,
      b: mix(B.robot, C.coin, 0.4),
      p: B.robot,
    },
  },
  song: {
    ground: {
      g: shade(C.go, 1.15),
      G: C.go,
      L: C.sky,
      d: mix(B.robot, C.paper2, 0.35),
      s: C.paper2,
    },
    landmark: [
      '.......r....................',
      '......rr.r..................',
      '......rrrr.....kkkkkkk......',
      '.......rr.uuuu..p...p.......',
      '..........uuuu..p...p.......',
    ],
    colors: {
      r: mix(C.go, C.paper, 0.2),
      u: mix(C.sky, B.move, 0.35),
      k: B.robot,
      p: shade(B.robot, 0.75),
    },
  },
};

/** Fogged landmark letters (locked island): the shape stays, in lavender. */
const FOG = [C.brand, C.brandSoft, C.inkSoft] as const;

interface Run {
  x: number;
  y: number;
  w: number;
  ch: string;
}

function runsOf(rows: readonly string[], top: number): Run[] {
  return rows.flatMap((row, i) => {
    const runs: Run[] = [];
    let x = 0;
    while (x < row.length) {
      const ch = row.charAt(x);
      let end = x + 1;
      while (end < row.length && row.charAt(end) === ch) end += 1;
      if (ch !== '.') runs.push({ x, y: top + i, w: end - x, ch });
      x = end;
    }
    return runs;
  });
}

const RUNS: Run[] = runsOf(MAP, 0);

/** Landmark runs per theme, bottom row on MAP row 1 (above the island's own grid). */
const LANDMARK_RUNS = new Map(
  Object.entries(ISLAND_THEMES).map(([id, theme]) => [
    id,
    runsOf(theme.landmark, 2 - theme.landmark.length),
  ]),
);

/** 6 screen px per island pixel: 168×84 (a landmark rises above it, outside the box). */
export function Island({
  look,
  theme = 'lang-tre',
  scale = 6,
}: {
  look: IslandLook;
  /** The world's scenery theme (P2-23); Làng Tre is the original island. */
  theme?: SceneTheme;
  scale?: 5 | 6 | 7;
}) {
  const own = ISLAND_THEMES[theme];
  const landmark = LANDMARK_RUNS.get(theme) ?? [];
  const groundFill = (ch: string): { className?: string; fill?: string } => {
    const hex = look === 'locked' ? undefined : own?.ground[ch];
    if (hex === undefined) return { className: FILLS[look][ch] ?? '' };
    return { fill: look === 'done' && ch === 'L' ? C.coin : hex };
  };
  const landmarkFill = (ch: string): string => {
    if (look === 'locked') {
      const letters = Object.keys(own?.colors ?? {});
      return FOG[Math.max(0, letters.indexOf(ch)) % FOG.length] ?? C.brand;
    }
    return own?.colors[ch] ?? C.ink;
  };
  return (
    <svg
      aria-hidden="true"
      width={WIDTH * scale}
      height={HEIGHT * scale}
      viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
      shapeRendering="crispEdges"
      className="block overflow-visible"
      data-theme={theme}
    >
      {RUNS.map((r) => (
        <rect
          key={`${String(r.x)}-${String(r.y)}`}
          x={r.x}
          y={r.y}
          width={r.w}
          height={1}
          {...groundFill(r.ch)}
        />
      ))}
      {landmark.map((r) => (
        <rect
          key={`m${String(r.x)}-${String(r.y)}`}
          x={r.x}
          y={r.y}
          width={r.w}
          height={1}
          fill={landmarkFill(r.ch)}
        />
      ))}
    </svg>
  );
}
