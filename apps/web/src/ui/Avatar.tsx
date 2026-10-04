// Profile avatars (screens-and-flows.md "/profile/new": 12 avatars, chosen without reading).
// Pixel-art animal faces on the 16×16 grid, drawn in token colours like PixelIcon, so they stay
// crisp at whole-number zooms and need no image files.

export const AVATAR_IDS = [
  'panda',
  'bear',
  'koala',
  'cat',
  'fox',
  'tiger',
  'bunny',
  'pig',
  'chick',
  'owl',
  'penguin',
  'frog',
] as const;
export type AvatarId = (typeof AVATAR_IDS)[number];

export function isAvatarId(id: string): id is AvatarId {
  return (AVATAR_IDS as readonly string[]).includes(id);
}

export interface AvatarArt {
  map: readonly string[];
  /** Map letter → token fill class; '.' is transparent. */
  fills: Readonly<Record<string, string>>;
}

const ART: Record<AvatarId, AvatarArt> = {
  panda: {
    map: [
      '................',
      '................',
      '..OOO......OOO..',
      '.OAAAO....OAAAO.',
      '.OAIAOOOOOOAIAO.',
      '..OFFFFFFFFFFO..',
      '.OFFFFFFFFFFFFO.',
      '.OFPPPFFFFPPPFO.',
      'OFPPEwPFFPEwPPFO',
      'OFPPEEPFFPEEPPFO',
      'OCCPPFFNNFFPPCCO',
      'OFFFFFFMMFFFFFFO',
      '.OFFFFMFFMFFFFO.',
      '.OFFFFFFFFFFFFO.',
      '..OOFFFFFFFFOO..',
      '....OOOOOOOO....',
    ],
    fills: {
      A: 'fill-ink',
      C: 'fill-hint',
      E: 'fill-ink',
      F: 'fill-white',
      I: 'fill-ink-soft',
      M: 'fill-ink',
      N: 'fill-ink',
      O: 'fill-ink',
      P: 'fill-ink',
      w: 'fill-white',
    },
  },
  bear: {
    map: [
      '................',
      '................',
      '..OOO......OOO..',
      '.OAAAO....OAAAO.',
      '.OAIAOOOOOOAIAO.',
      '..OFFFFFFFFFFO..',
      '.OFFFFFFFFFFFFO.',
      '.OFFEEFFFFEEFFO.',
      'OFFFEwFFFFEwFFFO',
      'OFCCFFMMMMFFCCFO',
      'OFFFFMMNNMMFFFFO',
      'OFFFFMMMMMMFFFFO',
      '.OFFFFMMMMFFFFO.',
      '.OFFFFFFFFFFFFO.',
      '..OOFFFFFFFFOO..',
      '....OOOOOOOO....',
    ],
    fills: {
      A: 'fill-block-robot',
      C: 'fill-hint',
      E: 'fill-ink',
      F: 'fill-block-robot',
      I: 'fill-coin',
      M: 'fill-paper-2',
      N: 'fill-ink',
      O: 'fill-ink',
      w: 'fill-white',
    },
  },
  koala: {
    map: [
      '................',
      '................',
      '..OOO......OOO..',
      '.OAAAO....OAAAO.',
      '.OAIAOOOOOOAIAO.',
      '..OFFFFFFFFFFO..',
      '.OFFFFFFFFFFFFO.',
      '.OFFEEFFFFEEFFO.',
      'OFFFEwFFFFEwFFFO',
      'OFCCFFMMMMFFCCFO',
      'OFFFFMMNNMMFFFFO',
      'OFFFFMMMMMMFFFFO',
      '.OFFFFMMMMFFFFO.',
      '.OFFFFFFFFFFFFO.',
      '..OOFFFFFFFFOO..',
      '....OOOOOOOO....',
    ],
    fills: {
      A: 'fill-brand',
      C: 'fill-hint',
      E: 'fill-ink',
      F: 'fill-brand',
      I: 'fill-paper',
      M: 'fill-brand-soft',
      N: 'fill-ink',
      O: 'fill-ink',
      w: 'fill-white',
    },
  },
  cat: {
    map: [
      '................',
      '.OO..........OO.',
      '.OAO........OAO.',
      '.OIAO......OAIO.',
      '.OIIAOOOOOOAIIO.',
      '..OFFFFFFFFFFO..',
      '.OFFFFFFFFFFFFO.',
      '.OFFEEFFFFEEFFO.',
      'OFFFEwFFFFEwFFFO',
      'OFCCFFMMMMFFCCFO',
      'OFFFFMMNNMMFFFFO',
      'OFFFFMMMMMMFFFFO',
      '.OFFFFMMMMFFFFO.',
      '.OFFFFFFFFFFFFO.',
      '..OOFFFFFFFFOO..',
      '....OOOOOOOO....',
    ],
    fills: {
      A: 'fill-coin',
      C: 'fill-hint',
      E: 'fill-ink',
      F: 'fill-coin',
      I: 'fill-hint',
      M: 'fill-paper',
      N: 'fill-block-var',
      O: 'fill-ink',
      w: 'fill-white',
    },
  },
  fox: {
    map: [
      '................',
      '.OO..........OO.',
      '.OAO........OAO.',
      '.OIAO......OAIO.',
      '.OIIAOOOOOOAIIO.',
      '..OFFFFFFFFFFO..',
      '.OFFFFFFFFFFFFO.',
      '.OFFEEFFFFEEFFO.',
      'OFFFEwFFFFEwFFFO',
      'OFCCFFMMMMFFCCFO',
      'OFFFFMMNNMMFFFFO',
      'OFFFFMMMMMMFFFFO',
      '.OFFFFMMMMFFFFO.',
      '.OFFFFFFFFFFFFO.',
      '..OOFFFFFFFFOO..',
      '....OOOOOOOO....',
    ],
    fills: {
      A: 'fill-block-loop',
      C: 'fill-hint',
      E: 'fill-ink',
      F: 'fill-block-loop',
      I: 'fill-ink',
      M: 'fill-white',
      N: 'fill-ink',
      O: 'fill-ink',
      w: 'fill-white',
    },
  },
  tiger: {
    map: [
      '................',
      '.OO..........OO.',
      '.OAO........OAO.',
      '.OIAO......OAIO.',
      '.OIIAOOOOOOAIIO.',
      '..OFSFFFFFFSFO..',
      '.OFFSFFSSFFSFFO.',
      '.OSFEEFFFFEESFO.',
      'OSFFEwFFFFEwFFSO',
      'OFCCFFMMMMFFCCFO',
      'OSFFFMMNNMMFFFSO',
      'OFSFFMMMMMMFFSFO',
      '.OFFFFMMMMFFFFO.',
      '.OFSFFFFFFFFSFO.',
      '..OOFFFFFFFFOO..',
      '....OOOOOOOO....',
    ],
    fills: {
      A: 'fill-coin-deep',
      C: 'fill-hint',
      E: 'fill-ink',
      F: 'fill-coin-deep',
      I: 'fill-paper',
      M: 'fill-paper',
      N: 'fill-ink',
      O: 'fill-ink',
      S: 'fill-ink',
      w: 'fill-white',
    },
  },
  bunny: {
    map: [
      '...OO......OO...',
      '..OAAO....OAAO..',
      '..OIAO....OAIO..',
      '..OIAO....OAIO..',
      '...OIAOOOOAIO...',
      '..OFFFFFFFFFFO..',
      '.OFFFFFFFFFFFFO.',
      '.OFFEEFFFFEEFFO.',
      'OFFFEwFFFFEwFFFO',
      'OFCCFFMMMMFFCCFO',
      'OFFFFMMNNMMFFFFO',
      'OFFFFMMMMMMFFFFO',
      '.OFFFFMMMMFFFFO.',
      '.OFFFFFFFFFFFFO.',
      '..OOFFFFFFFFOO..',
      '....OOOOOOOO....',
    ],
    fills: {
      A: 'fill-paper',
      C: 'fill-hint',
      E: 'fill-ink',
      F: 'fill-paper',
      I: 'fill-hint',
      M: 'fill-white',
      N: 'fill-block-var',
      O: 'fill-ink',
      w: 'fill-white',
    },
  },
  pig: {
    map: [
      '................',
      '.OO..........OO.',
      '.OAO........OAO.',
      '.OIAO......OAIO.',
      '.OIIAOOOOOOAIIO.',
      '..OFFFFFFFFFFO..',
      '.OFFFFFFFFFFFFO.',
      '.OFFEEFFFFEEFFO.',
      'OFFFEwFFFFEwFFFO',
      'OFCCFFSSSSFFCCFO',
      'OFFFFSNSSNSFFFFO',
      'OFFFFSSSSSSFFFFO',
      '.OFFFFSSSSFFFFO.',
      '.OFFFFFFFFFFFFO.',
      '..OOFFFFFFFFOO..',
      '....OOOOOOOO....',
    ],
    fills: {
      A: 'fill-hint',
      C: 'fill-oops',
      E: 'fill-ink',
      F: 'fill-hint',
      I: 'fill-block-var',
      N: 'fill-ink',
      O: 'fill-ink',
      S: 'fill-block-var',
      w: 'fill-white',
    },
  },
  chick: {
    map: [
      '................',
      '......OO........',
      '.....OCCO.......',
      '....OCCCOO......',
      '...OOOOOOOOOO...',
      '..OFFFFFFFFFFO..',
      '.OFFFFFFFFFFFFO.',
      '.OFFEEFFFFEEFFO.',
      'OFFFEwFFFFEwFFFO',
      'OFCCFFFBBFFFCCFO',
      'OFFFFFBBBBFFFFFO',
      'OFFFFFFBBFFFFFFO',
      '.OFFFFFFFFFFFFO.',
      '.OFFFFFFFFFFFFO.',
      '..OOFFFFFFFFOO..',
      '....OOOOOOOO....',
    ],
    fills: {
      B: 'fill-block-loop',
      C: 'fill-hint',
      E: 'fill-ink',
      F: 'fill-coin',
      O: 'fill-ink',
      w: 'fill-white',
    },
  },
  owl: {
    map: [
      '................',
      '................',
      '..OO........OO..',
      '..OAO......OAO..',
      '..OAAOOOOOOAAO..',
      '..OFFFFFFFFFFO..',
      '.OFMMMFFFFMMMFO.',
      '.OMMEEMFFMEEMMO.',
      'OFMMEwMFFMEwMMFO',
      'OFFMMMFBBFMMMFFO',
      'OFFFFFBBBBFFFFFO',
      'OFFFFFFBBFFFFFFO',
      '.OFFIFFFFFFIFFO.',
      '.OFFFIFFFFIFFFO.',
      '..OOFFFFFFFFOO..',
      '....OOOOOOOO....',
    ],
    fills: {
      A: 'fill-block-robot',
      B: 'fill-coin',
      E: 'fill-ink',
      F: 'fill-block-robot',
      I: 'fill-paper-2',
      M: 'fill-paper',
      O: 'fill-ink',
      w: 'fill-white',
    },
  },
  penguin: {
    map: [
      '................',
      '................',
      '................',
      '................',
      '...OOOOOOOOOO...',
      '..OFFFFFFFFFFO..',
      '.OFFMMMFFMMMFFO.',
      '.OFMMEEMMEEMMFO.',
      'OFMMMEwMMEwMMMFO',
      'OFMCCMMBBMMCCMFO',
      'OFMMMMBBBBMMMMFO',
      'OFFMMMMMMMMMMFFO',
      '.OFFMMMMMMMMFFO.',
      '.OFFFMMMMMMFFFO.',
      '..OOFFFFFFFFOO..',
      '....OOOOOOOO....',
    ],
    fills: {
      B: 'fill-coin',
      C: 'fill-hint',
      E: 'fill-ink',
      F: 'fill-block-fn',
      M: 'fill-white',
      O: 'fill-ink',
      w: 'fill-white',
    },
  },
  frog: {
    map: [
      '................',
      '..OOOO....OOOO..',
      '.OwwwwO..OwwwwO.',
      '.OwEEwO..OwEEwO.',
      '.OAEEAOOOOAEEAO.',
      '..OAAAAAAAAAAO..',
      '.OAAAAAAAAAAAAO.',
      '.OAAAAAAAAAAAAO.',
      'OAAAAAAAAAAAAAAO',
      'OACCAAAAAAAACCAO',
      'OAAAAAAAAAAAAAAO',
      'OAOAAAAAAAAAAOAO',
      '.OAOOOOOOOOOOAO.',
      '.OAAAAMMMMAAAAO.',
      '..OOAAAAAAAAOO..',
      '....OOOOOOOO....',
    ],
    fills: {
      A: 'fill-go',
      C: 'fill-hint',
      E: 'fill-ink',
      M: 'fill-hint',
      O: 'fill-ink',
      w: 'fill-white',
    },
  },
};

/**
 * The pixel map of one avatar (16×16, '.' transparent) and its token fill classes, for pictures
 * that reuse a face elsewhere (the "friend" goal sprite of P2-11c, stages/goalArt.ts).
 */
export function avatarArt(id: AvatarId): AvatarArt {
  return ART[id];
}

const GRID = 16;

interface Run {
  x: number;
  y: number;
  w: number;
  fill: string;
}

function toRuns({ map, fills }: AvatarArt): Run[] {
  const runs: Run[] = [];
  map.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row.charAt(x);
      let end = x + 1;
      while (end < row.length && row.charAt(end) === ch) end += 1;
      const fill = fills[ch];
      if (fill !== undefined) runs.push({ x, y, w: end - x, fill });
      x = end;
    }
  });
  return runs;
}

const RUNS = Object.fromEntries(AVATAR_IDS.map((id) => [id, toRuns(ART[id])])) as Record<
  AvatarId,
  Run[]
>;

export interface AvatarProps {
  /** Unknown ids (e.g. from an older backup) fall back to the panda. */
  id: string;
  /** Pixel zoom of the 16×16 grid. */
  scale?: 2 | 3 | 4 | 5 | 6;
  /** Accessible name; omit when a visible nickname sits next to the avatar. */
  label?: string;
  className?: string;
}

export function Avatar({ id, scale = 4, label, className = '' }: AvatarProps) {
  const size = GRID * scale;
  const art = isAvatarId(id) ? id : 'panda';
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${String(GRID)} ${String(GRID)}`}
      shapeRendering="crispEdges"
      data-avatar={art}
      className={`inline-block shrink-0 ${className}`}
      {...a11y}
    >
      {RUNS[art].map((r) => (
        <rect
          key={`${String(r.x)}-${String(r.y)}`}
          x={r.x}
          y={r.y}
          width={r.w}
          height={1}
          className={r.fill}
        />
      ))}
    </svg>
  );
}
