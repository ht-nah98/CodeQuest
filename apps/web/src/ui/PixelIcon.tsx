export type PixelIconName =
  | 'coin'
  | 'star'
  | 'star-empty'
  | 'flame'
  | 'speaker'
  | 'play'
  | 'bulb'
  | 'lock'
  | 'gear'
  | 'book'
  | 'crown'
  | 'magnifier';

/** Integer zoom of the 16×16 grid; pixel art is only scaled by whole multiples (art-direction.md §4, §7). */
export type PixelIconScale = 1 | 2 | 3 | 4;

export interface PixelIconProps {
  name: PixelIconName;
  /** 1 = 16px, 2 = 32px… Defaults to 2. */
  scale?: PixelIconScale;
  /** Accessible name. Omit when the icon sits next to text that already says the same thing. */
  label?: string;
  /** Replays the bounce used when a coin or star is earned. */
  pop?: boolean;
  className?: string;
}

const GRID = 16;

// One character per pixel. Letters map to token fill classes below; '.' is transparent.
const MAPS: Record<PixelIconName, readonly string[]> = {
  coin: [
    '.....OOOOOO.....',
    '...OOyyyyyyOO...',
    '..OyWWyyyyyyyO..',
    '.OyWyDDDDDDyyyO.',
    '.OyyDyyyyyyDyyO.',
    'OyyDyyyWWyyyDyyO',
    'OyyDyyyWWyyyDyyO',
    'OyyDyyyWWyyyDyyO',
    'OyyDyyyWWyyyDyyO',
    'OyyDyyyWWyyyDyyO',
    'OyyDyyyyyyyyDyyO',
    '.OyyDyyyyyyDyyO.',
    '.OyyyDDDDDDyyDO.',
    '..OyyyyyyyyyDO..',
    '...OODDDDDDOO...',
    '.....OOOOOO.....',
  ],
  star: [
    '.......OO.......',
    '......OyyO......',
    '......OyyO......',
    '.....OyWyyO.....',
    'OOOOOyWyyyyOOOOO',
    'OyyyyyWyyyyyyyyO',
    '.OyyyyyyyyyyyyO.',
    '..OyyyyyyyyyyO..',
    '...OyyyyyyyyO...',
    '...OyyyyyyyDO...',
    '..OyyyyyyyyyDO..',
    '..OyyyyOOyyyDO..',
    '.OyyyyO..OyyyDO.',
    '.OyyyO....OyyDO.',
    'OyyOO......OOyDO',
    'OOO..........OOO',
  ],
  'star-empty': [
    '.......OO.......',
    '......OeeO......',
    '......OeeO......',
    '.....OeeeeO.....',
    'OOOOOeeeeeeOOOOO',
    'OeeeeeeeeeeeeeeO',
    '.OeeeeeeeeeeeeO.',
    '..OeeeeeeeeeeO..',
    '...OeeeeeeeeO...',
    '...OeeeeeeeeO...',
    '..OeeeeeeeeeeO..',
    '..OeeeeOOeeeeO..',
    '.OeeeeO..OeeeeO.',
    '.OeeeO....OeeeO.',
    'OeeOO......OOeeO',
    'OOO..........OOO',
  ],
  // Streak flame: drawn rather than an emoji so it renders the same on every OS.
  flame: [
    '......O.........',
    '......OO........',
    '.....ODO........',
    '.....ODDO.......',
    '....ODDDO...O...',
    '....ODDDDO.OO...',
    '...ODDDDDOODO...',
    '...ODDDyDDDDO...',
    '..ODDDyyyDDDDO..',
    '..ODDyyyyyDDDO..',
    '.ODDDyyWyyyDDDO.',
    '.ODDyyyWWyyyDDO.',
    '.ODDyyyWWyyyDDO.',
    '..ODDyyyyyyDDO..',
    '...OODDDDDDOO...',
    '.....OOOOOO.....',
  ],
  // Read-aloud speaker for the 🔊 button.
  speaker: [
    '................',
    '.......O........',
    '......OO........',
    '.....OwO....O...',
    '....OwwO.....O..',
    'OOOOwwwO.O....O.',
    'OwwwwwwO..O...O.',
    'OwwwwwwO..O...O.',
    'OwwwwwwO..O...O.',
    'OwwwwwwO..O...O.',
    'OOOOwwwO.O....O.',
    '....OwwO.....O..',
    '.....OwO....O...',
    '......OO........',
    '.......O........',
    '................',
  ],
  // Run triangle: a glyph, because "▶" turns into a colour emoji on Windows.
  play: [
    '................',
    '..OO............',
    '..OOOO..........',
    '..OOOOOO........',
    '..OOOOOOOO......',
    '..OOOOOOOOOO....',
    '..OOOOOOOOOOOO..',
    '..OOOOOOOOOOOOO.',
    '..OOOOOOOOOOOOO.',
    '..OOOOOOOOOOOO..',
    '..OOOOOOOOOO....',
    '..OOOOOOOO......',
    '..OOOOOO........',
    '..OOOO..........',
    '..OO............',
    '................',
  ],
  // Hint.
  bulb: [
    '.....OOOOOO.....',
    '...OOyyyyyyOO...',
    '..OyyWWyyyyyyO..',
    '.OyyWyyyyyyyyyO.',
    '.OyWyyyyyyyyyyO.',
    '.OyyyyyyyyyyyyO.',
    '.OyyyyyyyyyyyyO.',
    '..OyyyyyyyyyyO..',
    '...OyyyyyyyyO...',
    '....OyyyyyyO....',
    '....OOOOOOOO....',
    '....OppppppO....',
    '....OOOOOOOO....',
    '....OppppppO....',
    '.....OOOOOO.....',
    '................',
  ],
  // Locked world / item.
  lock: [
    '................',
    '.....OOOOOO.....',
    '....OssssssO....',
    '...OsOOOOOOsO...',
    '...OsO....OsO...',
    '...OsO....OsO...',
    '...OsO....OsO...',
    '.OOOOOOOOOOOOOO.',
    '.OyyyyyyyyyyyyO.',
    '.OyWyyyOOyyyyyO.',
    '.OyWyyOOOOyyyyO.',
    '.OyyyyyOOyyyyyO.',
    '.OyyyyyOOyyyyyO.',
    '.ODDDDDDDDDDDDO.',
    '.OOOOOOOOOOOOOO.',
    '................',
  ],
  // Settings.
  gear: [
    '......OOOO......',
    '..OO..OssO..OO..',
    '.OssOOOssOOOssO.',
    '.OssssssssssssO.',
    '..OsssOOOOsssO..',
    '.OOssOwwwwOssOO.',
    'OsssOwwwwwwOsssO',
    'OsssOwwwwwwOsssO',
    'OsssOwwwwwwOsssO',
    'OsssOwwwwwwOsssO',
    '.OOssOwwwwOssOO.',
    '..OsssOOOOsssO..',
    '.OssssssssssssO.',
    '.OssOOOssOOOssO.',
    '..OO..OssO..OO..',
    '......OOOO......',
  ],
  // Lesson.
  book: [
    '................',
    '................',
    '.OOOOO....OOOOO.',
    'OwwwwwOOOOwwwwwO',
    'OwsssswOOwsssswO',
    'OwwwwwwOOwwwwwwO',
    'OwssssswOwsssssw',
    'OwwwwwwOOwwwwwwO',
    'OwsssswOOwsssswO',
    'OwwwwwwOOwwwwwwO',
    'OwwwwwwOOwwwwwwO',
    'OOOOOOwOOwOOOOOO',
    'OhhhhhOOOOhhhhhO',
    '.OOOOOO..OOOOOO.',
    '................',
    '................',
  ],
  // Boss level.
  crown: [
    '................',
    '................',
    '.O.....OO.....O.',
    'OyO...OyyO...OyO',
    'OyyO.OyyyyO.OyyO',
    'OyyyOyyyyyyOyyyO',
    'OyyyyyyWyyyyyyyO',
    'OyyyyyWhWyyyyyyO',
    'OyyyyyyWyyyyyyyO',
    'OyyyyyyyyyyyyyyO',
    'ODDDDDDDDDDDDDDO',
    'OyyyyyyyyyyyyyyO',
    'OOOOOOOOOOOOOOOO',
    '................',
    '................',
    '................',
  ],
  // "Xem cả đường" (P2-22): look closer at the whole track.
  magnifier: [
    '....OOOOO.......',
    '..OOwwwwwOO.....',
    '.OwwWWeeeeeO....',
    '.OwWWeeeeeeO....',
    'OwwWeeeeeeeeO...',
    'OwWeeeeeeeeeO...',
    'OweeeeeeeeeeO...',
    'OweeeeeeeeeeO...',
    'OeeeeeeeeeeeO...',
    '.OeeeeeeeeeO....',
    '.OeeeeeeeeeOO...',
    '..OOeeeeeOODDO..',
    '....OOOOO.ODDDO.',
    '...........ODDDO',
    '............ODDO',
    '.............OO.',
  ],
};

const FILLS: Record<string, string> = {
  O: 'fill-ink',
  y: 'fill-coin',
  D: 'fill-coin-deep',
  W: 'fill-coin-shine',
  e: 'fill-brand-soft',
  w: 'fill-white',
  s: 'fill-ink-soft',
  p: 'fill-paper-2',
  h: 'fill-hint',
};

interface Run {
  x: number;
  y: number;
  w: number;
  fill: string;
}

/** Merges horizontal runs of one colour so a 16×16 icon is ~40 rects instead of ~200. */
function toRuns(map: readonly string[]): Run[] {
  const runs: Run[] = [];
  map.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row.charAt(x);
      let end = x + 1;
      while (end < row.length && row.charAt(end) === ch) end += 1;
      const fill = FILLS[ch];
      if (fill) runs.push({ x, y, w: end - x, fill });
      x = end;
    }
  });
  return runs;
}

const RUNS = Object.fromEntries(
  Object.entries(MAPS).map(([name, map]) => [name, toRuns(map)]),
) as Record<PixelIconName, Run[]>;

/** Pixel-art icons (coin, star, flame, speaker, play, bulb, lock) on a 16×16 grid, in token colours. */
export function PixelIcon({ name, scale = 2, label, pop = false, className = '' }: PixelIconProps) {
  const size = GRID * scale;
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${String(GRID)} ${String(GRID)}`}
      shapeRendering="crispEdges"
      data-icon={name}
      className={`inline-block shrink-0 ${pop ? 'animate-pop' : ''} ${className}`}
      {...a11y}
    >
      {RUNS[name].map((r) => (
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
