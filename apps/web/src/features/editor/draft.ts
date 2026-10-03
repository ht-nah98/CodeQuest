import {
  type Level,
  type LevelMode,
  MAX_VARIANTS,
  type WorkspaceJson,
} from '@codequest/content-schema';
import { COMMON_BLOCKS, CQ_REPEAT, CQ_START } from '@codequest/engine';
import {
  getGameKind,
  MAZE_MAX_SIZE,
  MAZE_MIN_SIZE,
  RUNNER_MAX_CELLS,
  RUNNER_MIN_CELLS,
  type MazeConfig,
  type MazeTile,
  type RunnerCell,
  type RunnerConfig,
} from '@codequest/games';
import type { RuleIssue } from '@codequest/validator';
import { SANDBOX_WORLD_ID } from '../content/sandbox';

// Level editor (/coach/editor, phase-2.md P2-07): pure helpers on the draft level. The draft is
// a `Level` whose strings may still be empty and whose fields may not fit its mode yet; the
// validator (`validateLevel`) reports what is wrong, and `levelJson` keeps only what the mode
// uses when the level is exported.

/** Game kinds the editor can draw a map for. */
export const EDITOR_KINDS = ['runner', 'maze'] as const;
export type EditorKind = (typeof EDITOR_KINDS)[number];

export function isEditorKind(kind: string): kind is EditorKind {
  return (EDITOR_KINDS as readonly string[]).includes(kind);
}

/** A program with only "khi bắt đầu". */
export const EMPTY_PROGRAM: WorkspaceJson = {
  blocks: {
    languageVersion: 0,
    blocks: [{ type: CQ_START, id: 'start', x: 40, y: 40, deletable: false }],
  },
};

const DEFAULT_CONFIG: Record<EditorKind, RunnerConfig | MazeConfig> = {
  runner: { cells: ['ground', 'ground', 'ground', 'ground', 'flag'], start: 0 },
  maze: { map: ['#####', '#S..#', '###.#', '###G#', '#####'], startDir: 'E' },
};

const DEFAULT_TOOLBOX: Record<EditorKind, string[]> = {
  runner: ['runner_walk'],
  maze: ['maze_forward', 'maze_turn_left', 'maze_turn_right'],
};

/**
 * A new draft in the sandbox world (`content/worlds/_sandbox`, exempt from the ID pattern and
 * the pedagogy rules). Texts start empty so the validator lists what is still missing.
 */
export function newDraft(kind: EditorKind): Level {
  return {
    id: `${kind}-moi`,
    worldId: SANDBOX_WORLD_ID,
    stage: 'practice',
    kind,
    mode: 'build',
    title: '',
    objective: '',
    learningGoal: '',
    toolbox: [...DEFAULT_TOOLBOX[kind]],
    par: 1,
    config: structuredClone(DEFAULT_CONFIG[kind]),
    solution: structuredClone(EMPTY_PROGRAM),
    hints: [],
  };
}

const LEVEL_MODES: readonly LevelMode[] = ['build', 'parsons', 'predict', 'bughunt', 'creative'];

/**
 * A draft from a level file, a saved draft or a content level: any object with an editor
 * `kind` and a known `mode`; missing fields come from a new draft. Null when it is not one.
 */
export function draftFromJson(json: unknown): Level | null {
  if (!isRecord(json)) return null;
  const kind = json['kind'];
  const mode = json['mode'];
  if (typeof kind !== 'string' || !isEditorKind(kind)) return null;
  if (typeof mode !== 'string' || !(LEVEL_MODES as readonly string[]).includes(mode)) return null;
  // A loaded level keeps its own mode fields: a build level without solution stays so.
  const base = Object.fromEntries(
    Object.entries(newDraft(kind)).filter(([key]) => !MODE_ONLY_FIELDS.has(key as keyof Level)),
  );
  return { ...base, ...structuredClone(json) } as unknown as Level;
}

/** Fields of the draft that only some modes use (content-model.md §3, LevelSchema). */
const MODE_FIELDS: Record<LevelMode, ReadonlyArray<keyof Level>> = {
  build: ['par', 'solution', 'variants'],
  parsons: ['par', 'solution', 'initialWorkspace'],
  bughunt: ['par', 'parEdits', 'solution', 'initialWorkspace', 'variants'],
  predict: ['initialWorkspace', 'predict'],
  creative: [],
};
const MODE_ONLY_FIELDS = new Set<keyof Level>([
  'par',
  'parEdits',
  'solution',
  'initialWorkspace',
  'predict',
  'variants',
]);

/** Whether `mode` uses `field` (the editor hides the others and export drops them). */
export function modeUses(mode: LevelMode, field: keyof Level): boolean {
  return !MODE_ONLY_FIELDS.has(field) || MODE_FIELDS[mode].includes(field);
}

/**
 * Switches the mode and fills what the new mode requires (empty program, 3 predict cards),
 * keeping every other field so switching back loses nothing.
 */
export function withMode(level: Level, mode: LevelMode): Level {
  const next: Level = { ...level, mode };
  if (modeUses(mode, 'solution') && next.solution === undefined) {
    next.solution = structuredClone(EMPTY_PROGRAM);
  }
  if (modeUses(mode, 'initialWorkspace') && next.initialWorkspace === undefined) {
    next.initialWorkspace =
      mode === 'parsons' && next.solution !== undefined
        ? scatterProgram(next.solution)
        : structuredClone(next.solution ?? EMPTY_PROGRAM);
  }
  if (mode === 'predict' && next.predict === undefined) {
    next.predict = {
      options: [
        { key: '', label: '' },
        { key: '', label: '' },
        { key: '', label: '' },
      ],
    };
  }
  if ((mode === 'build' || mode === 'parsons') && next.par === undefined) next.par = 1;
  if (mode === 'bughunt' && next.parEdits === undefined) next.parEdits = 1;
  return next;
}

/** Keys in content file order (content-model.md §3), so exported files read like the others. */
const KEY_ORDER: ReadonlyArray<keyof Level> = [
  'id',
  'worldId',
  'stage',
  'kind',
  'mode',
  'title',
  'objective',
  'learningGoal',
  'misconception',
  'toolbox',
  'par',
  'maxBlocks',
  'maxInstances',
  'parEdits',
  'config',
  'variants',
  'initialWorkspace',
  'solution',
  'predict',
  'hints',
  'thinkingHint',
  'feedback',
  'limits',
  'retired',
];

/**
 * Keys of an opened level object that are not level fields: the editor cannot keep them
 * (export writes level fields only), so it tells the coach which ones are dropped.
 */
export function unknownLevelKeys(json: unknown): string[] {
  if (!isRecord(json)) return [];
  const known = new Set<string>(KEY_ORDER);
  return Object.keys(json).filter((key) => !known.has(key));
}

/** Optional texts: an empty input means "not set". */
const OPTIONAL_TEXT = new Set<keyof Level>(['misconception', 'thinkingHint']);

/**
 * The level as it is validated and exported: fields its mode does not use are dropped, as are
 * unset optional fields and empty optional texts; keys follow content file order.
 */
export function levelJson(level: Level): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const source = level as unknown as Record<string, unknown>;
  for (const key of KEY_ORDER) {
    const value = source[key];
    if (value === undefined || !modeUses(level.mode, key)) continue;
    if (OPTIONAL_TEXT.has(key) && typeof value === 'string' && value.trim() === '') continue;
    out[key] = value;
  }
  return out;
}

/** The exported file: 2-space JSON with a final newline, as in content/. */
export function levelFileText(level: Level): string {
  return `${JSON.stringify(levelJson(level), null, 2)}\n`;
}

/** Validation options matching content:check: sandbox worlds (`_*`) are drafts. */
export function isDraftWorld(worldId: string): boolean {
  return worldId.startsWith('_');
}

// ---- Maps (multi-map levels, P2-12) ---------------------------------------------------------

/** The maps of the draft: `config` is map 1, then each variant. */
export function draftMaps(level: Pick<Level, 'config' | 'variants'>): unknown[] {
  return [level.config, ...(level.variants ?? [])];
}

/** The draft with maps `maps` (map 1 becomes `config`; no variants when only one is left). */
function withMaps(level: Level, maps: readonly unknown[]): Level {
  const [config, ...variants] = maps;
  const next: Level = { ...level, config };
  if (variants.length > 0) next.variants = variants;
  else delete next.variants;
  return next;
}

/** Applies `update` to map `index` (0 = `config`); out of range leaves the draft as it is. */
export function updateMap(
  level: Level,
  index: number,
  update: (config: unknown) => unknown,
): Level {
  const maps = draftMaps(level);
  if (index < 0 || index >= maps.length) return level;
  return withMaps(
    level,
    maps.map((config, at) => (at === index ? update(config) : config)),
  );
}

/** Adds a copy of map `from` as the last map, up to 1 + MAX_VARIANTS maps. */
export function addMap(level: Level, from: number): Level {
  const maps = draftMaps(level);
  if (maps.length > MAX_VARIANTS || from < 0 || from >= maps.length) return level;
  return withMaps(level, [...maps, structuredClone(maps[from])]);
}

/** Removes map `index`; the last map left cannot be removed (removing map 1 promotes map 2). */
export function removeMap(level: Level, index: number): Level {
  const maps = draftMaps(level);
  if (maps.length <= 1 || index < 0 || index >= maps.length) return level;
  return withMaps(
    level,
    maps.filter((_, at) => at !== index),
  );
}

// ---- Runner track -------------------------------------------------------------------------

/** What a click on a runner cell does (phase-2.md P2-07). */
export type RunnerTool = 'cell' | 'bamboo' | 'start';

const CELL_CYCLE: readonly RunnerCell[] = ['ground', 'hole', 'branch', 'crate'];

/**
 * Applies a runner tool to cell `index`: `cell` cycles ground → hole → branch → crate,
 * `bamboo` toggles a bamboo shoot, `start` moves Măng there. The flag always stays the last
 * cell and cannot be changed. Bamboo on a cell that becomes a hole or crate is dropped.
 */
export function applyRunnerTool(
  config: RunnerConfig,
  index: number,
  tool: RunnerTool,
): RunnerConfig {
  const last = config.cells.length - 1;
  if (index < 0 || index >= last) return config;
  if (tool === 'start') return { ...config, start: index };
  if (tool === 'bamboo') {
    const bamboo = config.bamboo ?? [];
    const next = bamboo.includes(index)
      ? bamboo.filter((at) => at !== index)
      : [...bamboo, index].sort((a, b) => a - b);
    return withBamboo(config, next);
  }
  const current = config.cells[index] ?? 'ground';
  const cell = CELL_CYCLE[(CELL_CYCLE.indexOf(current) + 1) % CELL_CYCLE.length] ?? 'ground';
  const cells = config.cells.map((old, at) => (at === index ? cell : old));
  const keepsBamboo = cell === 'ground' || cell === 'branch';
  return withBamboo(
    { ...config, cells },
    (config.bamboo ?? []).filter((at) => at !== index || keepsBamboo),
  );
}

function withBamboo(config: RunnerConfig, bamboo: number[]): RunnerConfig {
  const next: RunnerConfig = { ...config };
  if (bamboo.length > 0) next.bamboo = bamboo;
  else delete next.bamboo;
  return next;
}

/** Track length clamped to 3–40; new cells are ground, the flag moves to the new end. */
export function resizeRunner(config: RunnerConfig, length: number): RunnerConfig {
  const size = clamp(Math.round(length), RUNNER_MIN_CELLS, RUNNER_MAX_CELLS);
  const body = config.cells.slice(0, -1).slice(0, size - 1);
  while (body.length < size - 1) body.push('ground');
  const cells: RunnerCell[] = [...body, 'flag'];
  const start = Math.min(config.start, size - 2);
  return withBamboo(
    { ...config, cells, start },
    (config.bamboo ?? []).filter((at) => at < size - 1),
  );
}

// ---- Maze grid ------------------------------------------------------------------------------

/**
 * Paints `tile` at `[row, col]`. `S` and `G` are unique: painting one moves it (its old cell
 * becomes path).
 */
export function paintMaze(
  config: MazeConfig,
  row: number,
  col: number,
  tile: MazeTile,
): MazeConfig {
  if (config.map[row]?.[col] === undefined) return config;
  const unique = tile === 'S' || tile === 'G';
  const map = config.map.map((line, r) =>
    Array.from(line)
      .map((old, c) => {
        if (r === row && c === col) return tile;
        return unique && old === tile ? '.' : old;
      })
      .join(''),
  );
  return { ...config, map };
}

/** Grid size clamped to 3–12 each way; kept cells stay, new cells are walls. */
export function resizeMaze(config: MazeConfig, rows: number, cols: number): MazeConfig {
  const height = clamp(Math.round(rows), MAZE_MIN_SIZE, MAZE_MAX_SIZE);
  const width = clamp(Math.round(cols), MAZE_MIN_SIZE, MAZE_MAX_SIZE);
  const map = Array.from({ length: height }, (_, r) => {
    const line = config.map[r] ?? '';
    return line.slice(0, width).padEnd(width, '#');
  });
  return { ...config, map };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

// ---- Programs and toolbox -------------------------------------------------------------------

/** Blocks the toolbox can offer for a kind: its own blocks, then the common loop. */
export function toolboxChoices(kind: string): string[] {
  const definition = isEditorKind(kind) ? getGameKind(kind) : undefined;
  return [...(definition?.blocks.map((spec) => spec.type) ?? []), CQ_REPEAT];
}

/**
 * The Vietnamese label of a block, as the child sees it (`message0` with its inputs as "…"),
 * e.g. "đi", "lặp … lần", "phía trước có …". The type itself when the block is unknown.
 */
export function blockLabel(type: string, kind: string): string {
  const specs = [
    ...COMMON_BLOCKS,
    ...((isEditorKind(kind) ? getGameKind(kind)?.blocks : undefined) ?? []),
  ];
  const message = specs.find((spec) => spec.type === type)?.json.message0;
  if (message === undefined) return type;
  return message
    .replace(/%\d+/g, '…')
    .replace(/…(?:\s*…)+/g, '…')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Toolbox entry types, in order. */
export function toolboxTypes(level: Pick<Level, 'toolbox'>): string[] {
  return level.toolbox.map((entry) => (typeof entry === 'string' ? entry : entry.type));
}

/**
 * Ticks or unticks a block type. An entry with fixed field values (`{ type, fields }`) of an
 * opened level stays as it is while ticked; a new tick adds the bare type in choice order.
 */
export function toggleToolbox(level: Level, type: string, on: boolean): Level {
  const has = toolboxTypes(level).includes(type);
  if (on === has) return level;
  if (!on) {
    return {
      ...level,
      toolbox: level.toolbox.filter(
        (entry) => (typeof entry === 'string' ? entry : entry.type) !== type,
      ),
    };
  }
  const order = toolboxChoices(level.kind);
  const toolbox = [...level.toolbox, type].sort((a, b) => {
    const rank = (entry: (typeof level.toolbox)[number]) => {
      const at = order.indexOf(typeof entry === 'string' ? entry : entry.type);
      return at === -1 ? order.length : at;
    };
    return rank(a) - rank(b);
  });
  return { ...level, toolbox };
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * A parsons start from a solution: every block of the chain under "khi bắt đầu" becomes its own
 * loose block (a loop keeps its body), laid out in a column right of "khi bắt đầu". The coach
 * can shuffle them by hand; the result never wins (only "khi bắt đầu" is connected).
 */
export function scatterProgram(solution: WorkspaceJson): WorkspaceJson {
  const copy = structuredClone(solution);
  const blocks: Array<{ type: string } & JsonRecord> = [];
  for (const top of copy.blocks.blocks) {
    blocks.push(top);
    if (top.type !== CQ_START) continue;
    let link = top['next'];
    delete top['next'];
    let y = 40;
    while (isRecord(link) && isRecord(link['block'])) {
      const block = link['block'] as { type: string } & JsonRecord;
      link = block['next'];
      delete block['next'];
      blocks.push({ ...block, x: 320, y });
      y += 64;
    }
  }
  return { ...copy, blocks: { ...copy.blocks, blocks } };
}

// ---- Issues next to their field --------------------------------------------------------------

/** Where an issue is shown in the editor. */
export type EditorField =
  | 'id'
  | 'worldId'
  | 'stage'
  | 'mode'
  | 'title'
  | 'objective'
  | 'learningGoal'
  | 'misconception'
  | 'thinkingHint'
  | 'toolbox'
  | 'par'
  | 'maxBlocks'
  | 'parEdits'
  | 'config'
  | 'solution'
  | 'initialWorkspace'
  | 'predict'
  | 'hints'
  | 'other';

const SCHEMA_FIELDS = new Set<string>([
  'id',
  'worldId',
  'stage',
  'mode',
  'title',
  'objective',
  'learningGoal',
  'misconception',
  'thinkingHint',
  'toolbox',
  'par',
  'maxBlocks',
  'parEdits',
  'config',
  'solution',
  'initialWorkspace',
  'predict',
  'hints',
]);

/** The field an issue of `validateLevel` is about (its rule and message, content-model.md §5). */
export function issueField(issue: RuleIssue): EditorField {
  const { rule, message } = issue;
  switch (rule) {
    case 1: {
      if (message.startsWith('game kind')) return 'other';
      const head = /^([A-Za-z]+)[.:]/.exec(message)?.[1];
      // A variant is a map too: its issues show with the map editor.
      if (head === 'variants') return 'config';
      return head !== undefined && SCHEMA_FIELDS.has(head) ? (head as EditorField) : 'other';
    }
    case 2:
      return 'id';
    case 5:
      return message.startsWith('objective')
        ? 'objective'
        : message.startsWith('title')
          ? 'title'
          : 'hints';
    case 6:
      return message.includes('misconception') ? 'misconception' : 'thinkingHint';
    case 9:
      return 'solution';
    case 10:
      if (message.includes('maxBlocks')) return 'maxBlocks';
      return message.includes('> par') ? 'par' : 'solution';
    case 11:
      return 'toolbox';
    case 12:
      return message.startsWith('toolbox')
        ? 'toolbox'
        : message.startsWith('initialWorkspace')
          ? 'initialWorkspace'
          : 'solution';
    case 13:
      return 'initialWorkspace';
    case 14:
      return message.includes('parEdits') ? 'parEdits' : 'initialWorkspace';
    case 15:
      return 'predict';
    case 16:
      return 'hints';
    default:
      return 'other';
  }
}
