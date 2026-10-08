// Pixi-free pixel art of the robot lab (P3-03 placeholder art, P3-02 replaces it): one character
// per texel, '.' transparent, drawn for the project in token colours (ui/tokens.ts). Shared by the
// PixiJS stage (as `nearest` textures) and the static SVG answer pictures (as data: images), so a
// child sees the same Bíp, blocks and buildings on the card as on the board.
//
// Shapes tell the three block kinds apart even without colour (print / colour blindness):
// fence = striped square, neutraliser = round puck with a ring, pollution = spiky blob with dots.
import type { RobotBlock, RobotColor } from '@codequest/games';
import { BLOCK_COLORS, UI_COLORS } from '../../ui/tokens';
import { mix, shade } from '../colors';

const C = UI_COLORS;
const B = BLOCK_COLORS;

/** Colours of the robot lab art: tokens and shades derived from them. */
export const ROBOT_PALETTE: Readonly<Record<string, string>> = {
  k: C.ink,
  n: C.inkSoft,
  w: C.white,
  p: C.paper,
  q: C.paper2,
  /** Mid grey of the fence stripes and wheel treads. */
  d: mix(C.inkSoft, C.paper2, 0.45),
  b: C.brand,
  s: C.brandSoft,
  /** Bíp's eye lights: the sensor-block teal, so "câu hỏi" and the eyes match. */
  t: B.sensor,
  h: C.coinShine,
  y: C.coin,
  c: C.coinDeep,
  o: C.oops,
  /** The gripper: the robot-block brown (art-direction.md §2, "Robot (gắp/thả)"). */
  r: B.robot,
  R: shade(B.robot, 0.7),
};

/** Main, light and dark tone of each block / station colour (kid labels: đỏ · vàng · xanh lá). */
export const ROBOT_COLOR_TONES: Readonly<
  Record<RobotColor, { main: string; light: string; dark: string }>
> = {
  RED: { main: C.oops, light: mix(C.oops, C.paper, 0.55), dark: shade(C.oops, 0.68) },
  YELLOW: { main: C.coin, light: C.coinShine, dark: C.coinDeep },
  GREEN: { main: C.go, light: shade(C.go, 1.45), dark: C.goDeep },
};

/** The palette of a coloured piece: `X` main, `x` light, `Y` dark, plus the shared letters. */
export function colorPalette(color: RobotColor): Readonly<Record<string, string>> {
  const tones = ROBOT_COLOR_TONES[color];
  return { ...ROBOT_PALETTE, X: tones.main, x: tones.light, Y: tones.dark };
}

/**
 * Bíp seen from above, facing north (up): round cream body, brand-coloured cap, two teal eye
 * lights at the front, red tail lights and a wheel on each side. 16×16.
 */
export const ROBOT_BODY = [
  '................',
  '.....kkkkkk.....',
  '...kkppppppkk...',
  '..kpttppppttpk..',
  '.kpptwppppwtppk.',
  '.kppppppppppppk.',
  'nnkppbbbbbbppknn',
  'dnkpbbssbbbbpknd',
  'nnkpbsbbbbbbpknn',
  'dnkpbbbbbbbbpknd',
  'nnkppbbbbbbppknn',
  'dnkppppppppppknd',
  '.kppppppppppppk.',
  '..kppoppppoppk..',
  '...kkppppppkk...',
  '.....kkkkkk.....',
] as const;

/** The two-pronged gripper in front of Bíp, open: prongs splayed wide. 16×6. */
export const CLAW_OPEN = [
  'kk............kk',
  'krk..........krk',
  '.krk........krk.',
  '..krk......krk..',
  '...kkRRRRRRkk...',
  '....kkkkkkkk....',
] as const;

/** The gripper closed: the prongs clamp a block's sides. 16×6. */
export const CLAW_CLOSED = [
  '..kk........kk..',
  '..kr........rk..',
  '..kr........rk..',
  '..krk......krk..',
  '...kkRRRRRRkk...',
  '....kkkkkkkk....',
] as const;

/** Fence block ("khối rào"): a grey square with diagonal stripes, no colour. 12×12. */
export const FENCE = [
  '.kkkkkkkkkk.',
  'kqqddqqddqqk',
  'kqddqqddqqdk',
  'kddqqddqqddk',
  'kdqqddqqddqk',
  'kqqddqqddqqk',
  'kqddqqddqqdk',
  'kddqqddqqddk',
  'kdqqddqqddqk',
  'kqqddqqddqqk',
  'knnnnnnnnnnk',
  '.kkkkkkkkkk.',
] as const;

/**
 * Neutraliser block ("khối trung hòa"): a round puck in its colour with a dark plus ("cancels the
 * pollution"), so a yellow one never reads as a coin. 12×12.
 */
export const NEUTRALIZER = [
  '....kkkk....',
  '..kkXXXXkk..',
  '.kXXxxxxXXk.',
  '.kXxxYYxxXk.',
  'kXxxxYYxxxXk',
  'kXxYYYYYYxXk',
  'kXxYYYYYYxXk',
  'kXxxxYYxxxXk',
  '.kXxxYYxxXk.',
  '.kXXxxxxXXk.',
  '..kkXXXXkk..',
  '....kkkk....',
] as const;

/** Pollution block ("khối ô nhiễm"): a spiky blob in its colour with dark dots. 12×12. */
export const POLLUTION = [
  '...kk..kk...',
  '..kXXkkXXk..',
  '.kXXXXXXXXk.',
  'kXXYXXXXYXXk',
  'kXYYXXXYYXXk',
  '.kXXXXXXXXk.',
  '.kXXYXXXXXk.',
  'kXXXXXXYXXXk',
  'kXXYYXXXXXXk',
  '.kXXXXXXXXk.',
  '..kXXkkXXk..',
  '...kk..kk...',
] as const;

/** The lab's sign: a flask of teal liquid with bubbles. 12×12. */
export const FLASK = [
  '...kkkkkk...',
  '....kwqk....',
  '....kwqk....',
  '....kwqk....',
  '...kwqqqk...',
  '..kwqqqqqk..',
  '.kwttttttqk.',
  '.kttwtttttk.',
  'kttttttwtttk',
  'kttttwtttttk',
  'kttttttttttk',
  '.kkkkkkkkkk.',
] as const;

/**
 * A city building seen from above (a `#` cell, no line): flat roof with a parapet (`A`), a
 * skylight, a vent box and the facade's shadow on the south side. 16×16; `A a Y` per variant.
 */
export const BUILDING = [
  '.kkkkkkkkkkkkkk.',
  'kAAAAAAAAAAAAAAk',
  'kAaaaaaaaaaaaaAk',
  'kAakkkkaaaaaaaAk',
  'kAakyykaaaaaaaAk',
  'kAakyykaaaaaaaAk',
  'kAakkkkaaaaaaaAk',
  'kAaaaaaaaaaaaaAk',
  'kAaaaaaaaannnaAk',
  'kAaaaaaaaanqnaAk',
  'kAaaaaaaaannnaAk',
  'kAaaaaaaaaaaaaAk',
  'kAaaaaaaaaaaaaAk',
  'kAAAAAAAAAAAAAAk',
  'kYYYYYYYYYYYYYYk',
  '.kkkkkkkkkkkkkk.',
] as const;

/** Roof colours of the building variants (by cell parity, so neighbours differ a little). */
export const BUILDING_PALETTES: ReadonlyArray<Readonly<Record<string, string>>> = [
  {
    ...ROBOT_PALETTE,
    A: mix(C.brand, C.paper2, 0.35),
    a: mix(C.brand, C.paper2, 0.62),
    Y: mix(C.brandDeep, C.brand, 0.3),
    y: C.sky,
  },
  {
    ...ROBOT_PALETTE,
    A: mix(B.robot, C.paper2, 0.4),
    a: mix(B.robot, C.paper2, 0.68),
    Y: shade(B.robot, 0.75),
    y: C.sky,
  },
];

/** The clock icon of the HUD: a round alarm clock. 12×12; `X` the face rim. */
export const CLOCK = [
  '.kk......kk.',
  'kXXk.kk.kXXk',
  'kXkkkXXkkkXk',
  '.kkwwwwwwkk.',
  '.kwwwkwwwwk.',
  'kwwwwkwwwwwk',
  'kwwwwkwwwwwk',
  'kwwwwkkkkwwk',
  '.kwwwwwwwwk.',
  '.kkwwwwwwkk.',
  '.kXkkkkkkXk.',
  'kk........kk',
] as const;

/** The HUD's points icon: a trophy cup in coin colours (stars mean level stars elsewhere). 12×12. */
export const TROPHY = [
  '..kkkkkkkk..',
  'kkkhyyyyykkk',
  'k.khyyyyyk.k',
  'k.khyyyyyk.k',
  'kk.khyyyk.kk',
  '..kkyyyykk..',
  '....kyyk....',
  '....kyyk....',
  '...kkyykk...',
  '..kcccccck..',
  '..kcccccck..',
  '..kkkkkkkk..',
] as const;

/** Pattern and palette of a competition block. */
export function blockArt(block: RobotBlock): {
  rows: readonly string[];
  palette: Readonly<Record<string, string>>;
} {
  if (block.kind === 'fence') return { rows: FENCE, palette: ROBOT_PALETTE };
  return {
    rows: block.kind === 'neutralizer' ? NEUTRALIZER : POLLUTION,
    palette: colorPalette(block.color),
  };
}

/** Stable cache key of a block's picture: kind and colour. */
export function blockArtKey(block: RobotBlock): string {
  return block.kind === 'fence' ? 'fence' : `${block.kind}:${block.color}`;
}
