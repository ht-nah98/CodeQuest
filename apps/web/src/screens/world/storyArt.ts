// Landmarks of the story chapters' pictures (P2-24, `chapter.art.prop`): the goal pictures of
// the stages (stages/goalArt.ts) plus scenery props drawn here in the same 12×12 pixel
// style and token colours. Placeholders until the artist's vignettes arrive, like goalArt.
import type { StoryProp } from '@codequest/content-schema';
import { CAGE_OPEN_ART, GOAL_ART, ITEM_ART, type GoalArt } from '../../stages/goalArt';
import { shade } from '../../stages/colors';
import { PALETTE } from '../../stages/maze/pixelArt';
import { BLOCK_COLORS, UI_COLORS } from '../../ui/tokens';

/** A gust of wind: two curling blue strokes (the "phù thủy gió" of Thế giới 1–5). */
const WIND = [
  '............',
  '..mmmmm.....',
  '.m.....m....',
  '.......m....',
  '.mmmmmm.....',
  '............',
  'mmmmmmmmm...',
  '.........m..',
  '....mmm..m..',
  '...m...mm...',
  '....mm......',
  '............',
];

/** Two bamboo shoots (măng) on the grass. */
const SHOOTS = [
  '............',
  '............',
  '..g......g..',
  '..gg....gg..',
  '..yY....yY..',
  '.yYy...yYy..',
  '.YyY...YyY..',
  'yYyYy.yYyYy.',
  'YyYyY.YyYyY.',
  'yYyYy.yYyYy.',
  'GGGGGGGGGGGG',
  'gggggggggggg',
];

/** Two bamboo stalks with leaves. */
const BAMBOO = [
  '.gl.....gl..',
  '.gl..ll.gl..',
  '.GG.lgg.GG..',
  '.gl.....gl.l',
  '.gl.....glgg',
  '.GG.....GG..',
  '.gl.....gl..',
  'lgl.....gl..',
  'ggl.....gl..',
  '.GG.....GG..',
  '.gl.....gl..',
  '.gl.....gl..',
];

/** River water with white ripples. */
const RIVER = [
  '............',
  '............',
  '............',
  '............',
  'mmmmmmmmmmmm',
  'mwwmmmmwwmmm',
  'mmmmmmmmmmmm',
  'mmmmwwmmmmmw',
  'mmmmmmmmmmmm',
  'mwwmmmmmwwmm',
  'mmmmmmmmmmmm',
  'mmmmmmmmmmmm',
];

/** Robot Bíp (Thế giới 6): round blue body, light eyes, two grippers, two wheels. */
const ROBOT = [
  '.....kk.....',
  '.....yy.....',
  '..mmmmmmmm..',
  '.mmwwmmwwmm.',
  '.mmwkmmwkmm.',
  '.mmmmmmmmmm.',
  '.mmmnnnnmmm.',
  'k.mmmmmmmm.k',
  'kkmmmmmmmmkk',
  'k.mmmmmmmm.k',
  '..kkk..kkk..',
  '..kkk..kkk..',
];

/** Bác Cú's lab (Thế giới 6): a paper building with blue windows and a green flask sign. */
const LAB = [
  '.....gg.....',
  '....kggk....',
  '...kppppk...',
  '..kppppppk..',
  '.kkkkkkkkkk.',
  '.kqqqqqqqqk.',
  '.kqmmqqmmqk.',
  '.kqmmqqmmqk.',
  '.kqqqqqqqqk.',
  '.kqqkkkkqqk.',
  '.kqqknnkqqk.',
  'kkkkkkkkkkkk',
];

/** A market stall (Thế giới 7): striped awning over a counter with bamboo shoots. */
const MARKET = [
  '............',
  'oowwoowwooww',
  'oowwoowwooww',
  '.k........k.',
  '.k........k.',
  '.k..g..g..k.',
  '.k.yY.yY..k.',
  'kkkkkkkkkkkk',
  '.kppppppppk.',
  '.kpqqqqqqpk.',
  '.kppppppppk.',
  '.kk......kk.',
];

/** The named box (Thế giới 7): a wooden crate with a paper label. */
const BOX = [
  '............',
  '............',
  '.YYYYYYYYYY.',
  '.YyyyyyyyyY.',
  '.YyywwwwyyY.',
  '.YyywkkwyyY.',
  '.YyywwwwyyY.',
  '.YyyyyyyyyY.',
  '.YYYYYYYYYY.',
  '.YyyyyyyyyY.',
  '.YYYYYYYYYY.',
  '............',
];

/** Spellbook (Thế giới 8): a purple book, open at a page with a gold star. */
const SPELLBOOK = [
  '............',
  '.kkkkkkkkkk.',
  'kPPPPPPPPPPk',
  'kPpppPPpppPk',
  'kPppsPPpppPk',
  'kPpsssPpppPk',
  'kPppsPPpnpPk',
  'kPpppPPpppPk',
  'kPpnpPPpppPk',
  'kPPPPPPPPPPk',
  '.kkkkkkkkkk.',
  '............',
];

/** Magic wand (Thế giới 8): a diagonal wooden stick with a gold star at the tip. */
const WAND = [
  '........s...',
  '.......sys..',
  '......sssss.',
  '.......sys..',
  '......b.s...',
  '.....b......',
  '....b.......',
  '...b........',
  '..b.........',
  '.B..........',
  'B...........',
  '............',
];

/** Easel (Thế giới 9): a canvas with a little house and sun on a wooden tripod. */
const EASEL = [
  '.....bb.....',
  '.kkkkkkkkkk.',
  '.kwwwwwwwwk.',
  '.kwwwyywwwk.',
  '.kwwwyywwwk.',
  '.kwwwwwwwwk.',
  '.kwwoooowwk.',
  '.kwooooooGk.',
  '.kwgGkoooGk.',
  '.kkkkkkkkkk.',
  '.b...bb...b.',
  'bb...bb...bb',
];

/** Painter's tower (Thế giới 9): five floors in pastel colours, a window each, a flag on top. */
const TOWER = [
  '.....kk.....',
  '.....koo....',
  '....kkkk....',
  '...kyyyyk...',
  '...kymmyk...',
  '..kkkkkkkk..',
  '..khhhhhhk..',
  '..khmhhmhk..',
  '..kkkkkkkk..',
  '..kuuuuuuk..',
  '..kumuumuk..',
  '..kkkkkkkk..',
];

const scenery = (rows: readonly string[]): GoalArt => ({ rows, palette: PALETTE });

/** The maze palette plus the purple of spell covers, wood browns, pink and sky (Thế giới 8–9). */
const MAGIC_PALETTE: Readonly<Record<string, string>> = {
  ...PALETTE,
  P: UI_COLORS.brandDeep,
  b: BLOCK_COLORS.robot,
  B: shade(BLOCK_COLORS.robot, 0.7),
  h: UI_COLORS.hint,
  u: UI_COLORS.sky,
};
const magic = (rows: readonly string[]): GoalArt => ({ rows, palette: MAGIC_PALETTE });

export const STORY_PROP_ART: Readonly<Record<StoryProp, GoalArt>> = {
  wind: scenery(WIND),
  shoots: scenery(SHOOTS),
  bamboo: scenery(BAMBOO),
  river: scenery(RIVER),
  machine: GOAL_ART.machine,
  exit: GOAL_ART.exit,
  home: GOAL_ART.home,
  footprints: GOAL_ART.footprints,
  cage: GOAL_ART.cage,
  'cage-open': CAGE_OPEN_ART,
  dock: GOAL_ART.dock,
  key: ITEM_ART.key,
  robot: scenery(ROBOT),
  lab: scenery(LAB),
  market: scenery(MARKET),
  box: scenery(BOX),
  spellbook: magic(SPELLBOOK),
  wand: magic(WAND),
  easel: magic(EASEL),
  tower: magic(TOWER),
};
