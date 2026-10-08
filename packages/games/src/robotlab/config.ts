import { z } from 'zod';

/**
 * Map characters (product/game-kinds.md §3.3). Every cell is a crossing of the black line:
 * `#` a house (no line, never entered) · `.` a crossing · `L` the lab (exactly one) ·
 * `Z` a polluted-zone cell (needs a fence) · `r` `y` `g` red / yellow / green stations.
 */
export const ROBOT_TILES = ['#', '.', 'L', 'Z', 'r', 'y', 'g'] as const;
export type RobotTile = (typeof ROBOT_TILES)[number];

/** Block colours; kid labels: đỏ · vàng · xanh lá. */
export const ROBOT_COLORS = ['RED', 'YELLOW', 'GREEN'] as const;
export type RobotColor = (typeof ROBOT_COLORS)[number];

/** Competition blocks: fence (no colour), neutralizer and pollution (coloured). */
export const ROBOT_BLOCK_KINDS = ['fence', 'neutralizer', 'pollution'] as const;
export type RobotBlockKind = (typeof ROBOT_BLOCK_KINDS)[number];

/** Compass directions, clockwise from north; row 0 is the top row, so N is "up". */
export const ROBOT_DIRS = ['N', 'E', 'S', 'W'] as const;
export type RobotDir = (typeof ROBOT_DIRS)[number];

/** Station tile of each colour. */
export const STATION_OF: Readonly<Record<RobotColor, RobotTile>> = {
  RED: 'r',
  YELLOW: 'y',
  GREEN: 'g',
};

/** Bounds on both the row count and the column count. */
export const ROBOT_MIN_SIZE = 3;
export const ROBOT_MAX_SIZE = 9;
/** Most blocks on the board (`config.blocks`, not counting `startHolding`). */
export const ROBOT_MAX_BLOCKS = 8;
/** `tiến [N] ô`: bounds of the number field. */
export const ROBOT_FORWARD_MIN = 1;
export const ROBOT_FORWARD_MAX = 9;

const UNKNOWN_TILE = /[^#.LZryg]/;

const cellSchema = z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]);

/** A competition block: a fence has no colour, the other kinds must have one. */
const blockSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('fence') }),
  z.strictObject({ kind: z.enum(['neutralizer', 'pollution']), color: z.enum(ROBOT_COLORS) }),
]);
export type RobotBlock = z.infer<typeof blockSchema>;

const placedBlockSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('fence'), at: cellSchema }),
  z.strictObject({
    kind: z.enum(['neutralizer', 'pollution']),
    color: z.enum(ROBOT_COLORS),
    at: cellSchema,
  }),
]);

/**
 * Every action costs time, so a loop of them runs out of time (OUT_OF_TIME) instead of
 * spinning until the engine's TIMEOUT (content:check also checks `maxActions`).
 */
const movingSeconds = z.number().int().min(1);
const points = z.number().int().nonnegative();

const costsShape = { forward: movingSeconds, turn: movingSeconds, grab: movingSeconds, release: movingSeconds };
const pointsShape = { contain: points, neutralize: points, retrieve: points, return: points };
const timeLimit = z.number().int().min(1).max(600);

/** Shared rules (`content/shared/robotlab.json`): every field required. */
export const robotlabRulesSchema = z.strictObject({
  /** Seconds the robot may use in one run. */
  timeLimit,
  /** Seconds per action: per crossing for `forward`; sensors cost nothing. */
  costs: z.strictObject(costsShape),
  /** Points per finished job (`score` goals). */
  points: z.strictObject(pointsShape),
});
export type RobotLabRules = z.infer<typeof robotlabRulesSchema>;

/** Per-level overrides of the shared rules. */
const rulesOverrideSchema = z.strictObject({
  timeLimit: timeLimit.optional(),
  costs: z.strictObject(costsShape).partial().optional(),
  points: z.strictObject(pointsShape).partial().optional(),
});
export type RobotLabRulesOverride = z.infer<typeof rulesOverrideSchema>;

const goalSchema = z.discriminatedUnion('type', [
  /** Finish every job (+ end in the lab when `mustReturn`). */
  z.strictObject({ type: z.literal('missions'), mustReturn: z.boolean().optional() }),
  /** Reach `target` points before the time runs out. */
  z.strictObject({ type: z.literal('score'), target: z.number().int().min(1) }),
]);
export type RobotLabGoal = z.infer<typeof goalSchema>;

const baseShape = {
  /** Rows top to bottom, all the same width; cells are addressed `[row, column]` from 0. */
  map: z.array(z.string()).min(ROBOT_MIN_SIZE).max(ROBOT_MAX_SIZE),
  /** Direction the robot faces at the start. */
  startDir: z.enum(ROBOT_DIRS),
  /** Starting crossing; defaults to the `L` cell. */
  start: cellSchema.optional(),
  /** A block already in the gripper at the start (index 0 of the state's blocks). */
  startHolding: blockSchema.optional(),
  /** Blocks on `.` crossings. */
  blocks: z.array(placedBlockSchema).max(ROBOT_MAX_BLOCKS).optional(),
  goal: goalSchema,
};

function count(map: readonly string[], tile: RobotTile): number {
  return map.reduce((sum, row) => sum + row.split(tile).length - 1, 0);
}

interface Checked {
  map: string[];
  start?: [number, number] | undefined;
  startHolding?: RobotBlock | undefined;
  blocks?: Array<RobotBlock & { at: [number, number] }> | undefined;
  goal: RobotLabGoal;
}

/** Board rules shared by the level schema and the resolved schema (game-kinds.md §3.3). */
function checkBoard(config: Checked, ctx: z.RefinementCtx): void {
  const { map } = config;
  const issue = (path: PropertyKey[], message: string): void => {
    ctx.addIssue({ code: 'custom', path, message });
  };
  const width = map[0]?.length ?? 0;
  if (width < ROBOT_MIN_SIZE || width > ROBOT_MAX_SIZE) {
    issue(['map', 0], `rows must have ${String(ROBOT_MIN_SIZE)}–${String(ROBOT_MAX_SIZE)} columns`);
  }
  map.forEach((row, index) => {
    if (row.length !== width) {
      issue(['map', index], `every row must have ${String(width)} columns like row 0`);
    }
    const bad = UNKNOWN_TILE.exec(row)?.[0];
    if (bad !== undefined) {
      issue(['map', index], `unknown tile "${bad}"; use ${ROBOT_TILES.join(' ')}`);
    }
  });
  if (count(map, 'L') !== 1) issue(['map'], 'map must contain exactly one "L"');

  const key = ([r, c]: readonly [number, number]): string => `${String(r)},${String(c)}`;
  if (config.start !== undefined) {
    const tile = map[config.start[0]]?.[config.start[1]];
    if (tile === undefined || tile === '#') {
      issue(['start'], 'start must be a crossing on the map (not "#")');
    }
  }
  const startKey = config.start === undefined ? null : key(config.start);
  const taken = new Set<string>();
  const blocks = config.blocks ?? [];
  for (const [index, block] of blocks.entries()) {
    const at = key(block.at);
    if (map[block.at[0]]?.[block.at[1]] !== '.') {
      issue(['blocks', index, 'at'], 'block must be on a "." crossing');
    } else if (taken.has(at)) {
      issue(['blocks', index, 'at'], 'block positions must be unique');
    } else if (at === startKey) {
      issue(['blocks', index, 'at'], 'block must not be on the start crossing');
    }
    taken.add(at);
  }

  const all: RobotBlock[] = [
    ...(config.startHolding === undefined ? [] : [config.startHolding]),
    ...blocks,
  ];
  const fences = all.filter((block) => block.kind === 'fence').length;
  const zones = count(map, 'Z');
  if (fences < zones) {
    issue(['blocks'], `${String(zones)} "Z" cells need at least ${String(zones)} fences`);
  }
  for (const color of ROBOT_COLORS) {
    const neutralizers = all.filter(
      (block) => block.kind === 'neutralizer' && block.color === color,
    ).length;
    const stations = count(map, STATION_OF[color]);
    if (neutralizers > stations) {
      issue(
        ['blocks'],
        `${String(neutralizers)} ${color} neutralizers need at least ${String(neutralizers)} "${STATION_OF[color]}" stations`,
      );
    }
  }
  if (config.goal.type === 'missions') {
    const hasJob = zones > 0 || all.some((block) => block.kind !== 'fence');
    if (!hasJob && config.goal.mustReturn !== true) {
      issue(['goal'], 'missions need a job ("Z", neutralizer, pollution) or mustReturn: true');
    }
  }
}

/**
 * `level.config` as written in a content file (shared rules not merged): content:check rule 1,
 * the level editor and `runLevel` check this.
 */
export const robotlabLevelConfigSchema = z
  .strictObject({ ...baseShape, rules: rulesOverrideSchema.optional() })
  .superRefine(checkBoard);
export type RobotLabLevelConfig = z.infer<typeof robotlabLevelConfigSchema>;

/** A config that can run: `rules` merged with the shared rules, every field present. */
export const robotlabResolvedSchema = z
  .strictObject({ ...baseShape, rules: robotlabRulesSchema })
  .superRefine(checkBoard);
export type RobotLabConfig = z.infer<typeof robotlabResolvedSchema>;

/**
 * The one merge of a level's `rules` over the shared rules (`content/shared/robotlab.json`).
 * Pure. Every caller that runs or draws a robotlab level goes through here; `createState`
 * refuses a config that skipped it.
 */
export function resolveRobotlabRules(
  levelConfig: RobotLabLevelConfig,
  shared: RobotLabRules,
): RobotLabConfig {
  const { rules, ...rest } = levelConfig;
  const costs = rules?.costs ?? {};
  const pts = rules?.points ?? {};
  return {
    ...rest,
    rules: {
      timeLimit: rules?.timeLimit ?? shared.timeLimit,
      costs: {
        forward: costs.forward ?? shared.costs.forward,
        turn: costs.turn ?? shared.costs.turn,
        grab: costs.grab ?? shared.costs.grab,
        release: costs.release ?? shared.costs.release,
      },
      points: {
        contain: pts.contain ?? shared.points.contain,
        neutralize: pts.neutralize ?? shared.points.neutralize,
        retrieve: pts.retrieve ?? shared.points.retrieve,
        return: pts.return ?? shared.points.return,
      },
    },
  };
}
