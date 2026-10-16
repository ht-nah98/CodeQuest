import {
  gridPoint,
  parsePointKey,
  parseSegmentKey,
  targetSegments,
  toXY,
  type TurtleConfig,
  turtleConfigSchema,
  type TurtlePoint,
} from '@codequest/games';
import { UI_COLORS } from '../../ui/tokens';
import { gridDots, PAPER_PAD } from './layout';

// The static picture of a turtle predict answer (stage-rendering.md §4 "Hình đáp án"): the paper
// drawn from the config as inline SVG with the lines of a `draw:` key in ink (the same picture
// the stage would end with), or the point of a `crash:…@a,b,c,d` key with a red burst. Every card
// of a level shows the whole paper at one scale, so two drawings that differ only in size look
// different; the room around it is paper too. Authors fit the paper around the drawings of all the
// cards (the W9 generator leaves a margin of 1 step), so the pictures stay big.

/** One unit step in SVG units. */
const U = 10;
const C = UI_COLORS;

type TurtleKey =
  { kind: 'draw'; segments: string[] } | { kind: 'crash'; reason: string; at: TurtlePoint };

/** A turtle predict key (`draw:` + segments, or `crash:<REASON>@a,b,c,d`), or null. */
export function parseTurtleKey(key: string): TurtleKey | null {
  if (key.startsWith('draw:')) {
    const body = key.slice('draw:'.length);
    return { kind: 'draw', segments: body === '' ? [] : body.split(';') };
  }
  const crash = /^crash:([A-Z][A-Z0-9_]*)@(-?\d+,-?\d+,-?\d+,-?\d+)$/.exec(key);
  if (crash === null) return null;
  return { kind: 'crash', reason: crash[1] ?? '', at: parsePointKey(crash[2] ?? '') };
}

function svgPoint(config: TurtleConfig, point: TurtlePoint): { x: number; y: number } {
  const { x, y } = toXY(point);
  return { x: (x + PAPER_PAD) * U, y: (config.size.h - y + PAPER_PAD) * U };
}

function Segment({
  config,
  segment,
  ...style
}: { config: TurtleConfig; segment: string } & {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  strokeOpacity?: number;
}) {
  const [p, q] = parseSegmentKey(segment).map((point) => svgPoint(config, point));
  if (p === undefined || q === undefined) return null;
  return <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} strokeLinecap="round" {...style} />;
}

export function TurtleAnswerPicture({ config, answerKey }: { config: unknown; answerKey: string }) {
  const parsed = turtleConfigSchema.safeParse(config);
  const key = parseTurtleKey(answerKey);
  if (!parsed.success || key === null) return null;
  const paper = parsed.data;
  const start = svgPoint(paper, gridPoint(paper.start.x, paper.start.y));
  const target = [...(targetSegments(paper) ?? [])];
  const box = {
    x: 0,
    y: 0,
    width: (paper.size.w + 2 * PAPER_PAD) * U,
    height: (paper.size.h + 2 * PAPER_PAD) * U,
  };
  return (
    <svg
      viewBox={`0 0 ${String(box.width)} ${String(box.height)}`}
      className="block h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      data-turtle-answer={key.kind}
      style={{ background: C.paper }}
    >
      <rect {...box} fill={C.paper} />
      {gridDots(paper).map((point) => {
        const { x, y } = svgPoint(paper, point);
        return (
          <circle key={point.join(',')} cx={x} cy={y} r={0.6} fill={C.inkSoft} opacity={0.5} />
        );
      })}
      {target.map((segment) => (
        <Segment
          key={`t${segment}`}
          config={paper}
          segment={segment}
          stroke={C.brand}
          strokeWidth={0.9}
          strokeDasharray="1.6 1.2"
          strokeOpacity={0.55}
        />
      ))}
      {key.kind === 'draw' &&
        key.segments.map((segment) => (
          <Segment
            key={segment}
            config={paper}
            segment={segment}
            stroke={C.ink}
            strokeWidth={1.4}
          />
        ))}
      {/* Where the brush starts: a small ring, so cards show which way the drawing goes. */}
      <circle cx={start.x} cy={start.y} r={1.3} fill={C.white} stroke={C.ink} strokeWidth={0.6} />
      {key.kind === 'crash' && <CrashMark {...svgPoint(paper, key.at)} />}
    </svg>
  );
}

/** A red spiky burst where Măng stopped. */
function CrashMark({ x, y }: { x: number; y: number }) {
  const points = Array.from({ length: 16 }, (_, i) => {
    const radius = i % 2 === 0 ? 3.2 : 1.8;
    const angle = (Math.PI * i) / 8 - Math.PI / 2;
    return `${(x + radius * Math.cos(angle)).toFixed(2)},${(y + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
  return (
    <polygon points={points} fill={C.oops} stroke={C.ink} strokeWidth={0.4} data-mark="crash" />
  );
}
