// A floating pixel island of the adventure map (art-direction.md §4 "Bản đồ phiêu lưu"),
// drawn on a 28×14 grid in token colours. Locked islands are drawn in lavender fog.

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

interface Run {
  x: number;
  y: number;
  w: number;
  ch: string;
}

const RUNS: Run[] = MAP.flatMap((row, y) => {
  const runs: Run[] = [];
  let x = 0;
  while (x < row.length) {
    const ch = row.charAt(x);
    let end = x + 1;
    while (end < row.length && row.charAt(end) === ch) end += 1;
    if (ch !== '.') runs.push({ x, y, w: end - x, ch });
    x = end;
  }
  return runs;
});

/** 6 screen px per island pixel: 168×84. */
export function Island({ look, scale = 6 }: { look: IslandLook; scale?: 5 | 6 | 7 }) {
  return (
    <svg
      aria-hidden="true"
      width={WIDTH * scale}
      height={HEIGHT * scale}
      viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
      shapeRendering="crispEdges"
      className="block"
    >
      {RUNS.map((r) => (
        <rect
          key={`${String(r.x)}-${String(r.y)}`}
          x={r.x}
          y={r.y}
          width={r.w}
          height={1}
          className={FILLS[look][r.ch]}
        />
      ))}
    </svg>
  );
}
