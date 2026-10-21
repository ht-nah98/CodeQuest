import { sorterConfigSchema } from '@codequest/games';
import { UI_COLORS as C } from '../../ui/tokens';

// The static picture of a shelf predict answer (ADR-0025 §5, stage-rendering.md §4 "Hình đáp án"):
// the books of the key in the order it names, the hand over the place it stops at, and the flag at
// the end of the shelf - the same picture the stage would be left with. A `crash:` key shows the
// red burst where the run stopped; `timeout` shows the shelf the level starts with and a clock.
// Every card of a level is drawn at one scale, so two shelves that differ by one swap look
// different at a glance.

/** SVG units: one slot is SLOT wide, a book of 9 is TALL high. */
const SLOT = 44;
const TALL = 120;
const SHORT = 34;
const PLANK = 8;
const HAND_BAND = 34;
const PAD = 8;

const SPINES = [C.brand, C.go, C.coin, C.sky, C.oops] as const;

export type ShelfKey =
  | { kind: 'shelf'; books: number[]; at: number }
  | { kind: 'crash'; reason: string; at: number }
  | { kind: 'timeout' };

/** A shelf predict key: `shelf:3,1,2@2`, `crash:OFF_SHELF@4` or `timeout`. */
export function parseShelfKey(key: string): ShelfKey | null {
  if (key === 'timeout') return { kind: 'timeout' };
  const shelf = /^shelf:((?:\d+)(?:,\d+)*)@(\d+)$/.exec(key);
  if (shelf) {
    return {
      kind: 'shelf',
      books: (shelf[1] ?? '').split(',').map(Number),
      at: Number(shelf[2]),
    };
  }
  const crash = /^crash:([A-Z][A-Z0-9_]*)@(\d+)$/.exec(key);
  if (crash) return { kind: 'crash', reason: crash[1] ?? '', at: Number(crash[2]) };
  return null;
}

/** Book height in SVG units: 1 is shortest, 9 tallest, the steps even in between. */
function heightOf(number: number): number {
  const clamped = Math.min(Math.max(number, 1), 9);
  return SHORT + ((TALL - SHORT) * (clamped - 1)) / 8;
}

function Hand({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect
        x={x - 13}
        y={y - 17}
        width={26}
        height={17}
        rx={4}
        fill={C.paper}
        stroke={C.ink}
        strokeWidth={2}
      />
      <polygon
        points={`${String(x - 6)},${String(y)} ${String(x + 6)},${String(y)} ${String(x)},${String(y + 11)}`}
        fill={C.brand}
        stroke={C.ink}
        strokeWidth={2}
      />
    </g>
  );
}

function Burst({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={13} fill={C.oopsSoft} stroke={C.oops} strokeWidth={3} />
      <path
        d={`M${String(cx - 6)} ${String(cy - 6)} L${String(cx + 6)} ${String(cy + 6)} M${String(cx + 6)} ${String(cy - 6)} L${String(cx - 6)} ${String(cy + 6)}`}
        stroke={C.oops}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </g>
  );
}

/**
 * Draws one answer card. `config` is the level's own config, which gives the books a `crash:` or
 * `timeout` key does not carry (those keys only say where the run stopped).
 */
export function ShelfAnswerPicture({ config, answerKey }: { config: unknown; answerKey: string }) {
  const parsed = sorterConfigSchema.safeParse(config);
  const key = parseShelfKey(answerKey);
  if (!parsed.success || key === null) return null;

  const books = key.kind === 'shelf' ? key.books : parsed.data.books;
  const hand = key.kind === 'timeout' ? null : key.at;
  const slots = books.length + 1;
  const width = slots * SLOT + PAD * 2;
  const height = HAND_BAND + TALL + PLANK + PAD * 2;
  const plankY = PAD + HAND_BAND + TALL;
  const centre = (place: number) => PAD + (place - 1) * SLOT + SLOT / 2;

  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      className="block h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      data-shelf-answer={key.kind}
      style={{ background: C.paper }}
    >
      <rect
        x={PAD - 4}
        y={plankY}
        width={width - (PAD - 4) * 2}
        height={PLANK}
        fill={C.inkSoft}
      />
      {books.map((number, i) => {
        const tall = heightOf(number);
        const x = centre(i + 1) - SLOT * 0.36;
        return (
          <g key={`${String(i)}-${String(number)}`}>
            <rect
              x={x}
              y={plankY - tall}
              width={SLOT * 0.72}
              height={tall}
              rx={3}
              fill={SPINES[(number - 1) % SPINES.length]}
              stroke={C.ink}
              strokeWidth={2}
            />
            <text
              x={centre(i + 1)}
              y={plankY - tall / 2 + 6}
              textAnchor="middle"
              fontFamily="VT323"
              fontSize={20}
              fill={C.ink}
            >
              {number}
            </text>
          </g>
        );
      })}
      {/* The flag one place past the last book. */}
      <g>
        <rect x={centre(slots) - 1.5} y={plankY - 54} width={3} height={54} fill={C.inkSoft} />
        <polygon
          points={`${String(centre(slots) + 1.5)},${String(plankY - 54)} ${String(centre(slots) + 20)},${String(plankY - 47)} ${String(centre(slots) + 1.5)},${String(plankY - 40)}`}
          fill={C.go}
          stroke={C.ink}
          strokeWidth={2}
        />
      </g>
      {hand !== null && <Hand x={centre(hand)} y={PAD + HAND_BAND - 4} />}
      {key.kind === 'crash' && <Burst cx={centre(key.at)} cy={plankY - 20} />}
      {key.kind === 'timeout' && (
        <g>
          <circle
            cx={width / 2}
            cy={PAD + HAND_BAND / 2}
            r={13}
            fill={C.paper}
            stroke={C.ink}
            strokeWidth={3}
          />
          <path
            d={`M${String(width / 2)} ${String(PAD + HAND_BAND / 2 - 8)} V${String(PAD + HAND_BAND / 2)} H${String(width / 2 + 7)}`}
            stroke={C.ink}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
