// Landmarks of the story chapters' pictures (P2-24, `chapter.art.prop`): the goal pictures of
// the stages (stages/goalArt.ts) plus six scenery props drawn here in the same 12×12 pixel
// style and token colours. Placeholders until the artist's vignettes arrive, like goalArt.
import type { StoryProp } from '@codequest/content-schema';
import { CAGE_OPEN_ART, GOAL_ART, ITEM_ART, type GoalArt } from '../../stages/goalArt';
import { PALETTE } from '../../stages/maze/pixelArt';

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

const scenery = (rows: readonly string[]): GoalArt => ({ rows, palette: PALETTE });

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
};
