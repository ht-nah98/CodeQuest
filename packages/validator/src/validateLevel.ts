/**
 * Every rule of content-model.md §5 that can be checked on one level alone: 1 (schema and
 * config), 2 (ID pattern), 5–6 (pedagogy), 9–11 (the solution wins within par, maxBlocks and
 * the toolbox), 12–16, 19 (star goals) and 20 (block limits). Runs on Node and in the browser
 * (level editor).
 */
import { LevelSchema, type Level, type WorkspaceJson } from '@codequest/content-schema';
import {
  analyzeWorkspace,
  CQ_START,
  registerBlockSpecs,
  runLevel,
  type AnyGameKindDefinition,
} from '@codequest/engine';
import {
  getGameKind,
  needsSharedRules,
  resolveLevelConfigs,
  type SharedLevelRules,
} from '@codequest/games';
import { describeError, formatSchemaIssues, type GameKindLookup, type RuleIssue } from './issue';
import {
  hintIssues,
  goalSpriteIssues,
  limitIssues,
  modeIssues,
  pedagogyIssues,
  robotlabTimeIssues,
  shadowIssues,
  starGoalIssues,
  toolboxTypes,
} from './levelRules';
import { blockTypesOf } from './workspace';

/** Rule 2: ID patterns of content-model.md §2 (draft folders `worlds/_*` are exempt). */
export const ID_PATTERNS = {
  world: /^w\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/,
  level: /^w\d{2}-(?:l\d{2}|boss|creative|bonus\d{2})$/,
  lesson: /^w\d{2}-lesson(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?$/,
} as const;

export interface ValidateLevelOptions {
  /**
   * A draft (`worlds/_*`) skips the ID pattern (rule 2) and the pedagogy rules 5–6.
   * Default false.
   */
  isDraft?: boolean;
  /** Game kind registry; defaults to `getGameKind` of `@codequest/games`. */
  getKind?: GameKindLookup;
  /**
   * Shared rules merged into the level's maps before anything runs (`resolveLevelConfigs`):
   * a robotlab level needs `robotlab` (`content/shared/robotlab.json`), else rule 1 fails.
   */
  shared?: SharedLevelRules;
}

export interface LevelValidation {
  /** The parsed level, or null when it fails `LevelSchema`. */
  level: Level | null;
  /** Broken rules, in a stable order: schema, 5–6, 12, config, 9–11, 13–15, 16, 19, 20, then 2. */
  issues: RuleIssue[];
  /** Blocks used by `solution` when it could be counted (not for `predict` levels). */
  solutionBlocks: number | null;
}

/**
 * Rule 1 for a level beyond its own schema: `config` and every map in `variants` must match its
 * kind's `configSchema`.
 */
function levelConfigIssues(
  level: Level,
  kind: AnyGameKindDefinition | undefined,
  shared: SharedLevelRules,
): RuleIssue[] {
  if (kind === undefined) {
    return [{ rule: 1, message: `game kind "${level.kind}" is not implemented yet` }];
  }
  if (needsSharedRules(level.kind) && shared[level.kind] === undefined) {
    return [{ rule: 1, message: `${level.kind} needs the shared rules shared/${level.kind}.json` }];
  }
  const maps: Array<[unknown, string]> = [
    [level.config, 'config'],
    ...(level.variants ?? []).map((variant, index): [unknown, string] => [
      variant,
      `variants.${String(index)}`,
    ]),
  ];
  return maps.flatMap(([config, path]) => {
    const parsed = kind.configSchema.safeParse(config);
    return parsed.success ? [] : formatSchemaIssues(parsed.error, path);
  });
}

/**
 * Rules 9–11 for a level with a solution whose schema and config are valid. Returns the issues
 * and the solution's block count (null if the solution cannot even be loaded).
 */
function solutionIssues(
  level: Level,
  solution: WorkspaceJson,
  kind: AnyGameKindDefinition,
): { issues: RuleIssue[]; blocksUsed: number | null } {
  const issues: RuleIssue[] = [];

  // Rule 9: the solution wins.
  const outcome = runLevel({ kind, level, workspace: solution });
  if (outcome.result !== 'success') {
    // Rerun as a predict level to learn where it ended (`crash:FELL_IN_HOLE@2`, `stop@3`…).
    const where = runLevel({
      kind,
      level: { ...level, mode: 'predict', initialWorkspace: solution },
      workspace: solution,
    }).answerKey;
    // Multi-map levels (P2-12): which map the solution loses on, counted from 1 as the child sees.
    const map = outcome.mapIndex === undefined ? null : `on map ${String(outcome.mapIndex + 1)}`;
    const why = [
      outcome.reasonCode,
      where === undefined ? null : `(${where})`,
      map,
      outcome.debug?.message,
    ]
      .filter((part) => part !== null && part !== undefined)
      .join(' ');
    issues.push({ rule: 9, message: `solution ends ${outcome.result} ${why}`.trim() });
  }

  // Rule 10: blocksUsed(solution) ≤ par ≤ maxBlocks.
  let blocksUsed: number | null = null;
  try {
    registerBlockSpecs(kind.blocks);
    blocksUsed = analyzeWorkspace(solution).blocksUsed;
  } catch (error) {
    issues.push({ rule: 10, message: `cannot count solution blocks: ${describeError(error)}` });
  }
  const { par, maxBlocks } = level;
  if (blocksUsed !== null && par !== undefined && blocksUsed > par) {
    issues.push({
      rule: 10,
      message: `solution uses ${String(blocksUsed)} blocks > par ${String(par)}`,
    });
  }
  if (blocksUsed !== null && maxBlocks !== undefined && blocksUsed > maxBlocks) {
    issues.push({
      rule: 10,
      message: `solution uses ${String(blocksUsed)} blocks > maxBlocks ${String(maxBlocks)}`,
    });
  }
  if (par !== undefined && maxBlocks !== undefined && par > maxBlocks) {
    issues.push({ rule: 10, message: `par ${String(par)} > maxBlocks ${String(maxBlocks)}` });
  }

  // Rule 11: solution blocks ⊆ toolbox (parsons: ⊆ initialWorkspace).
  const available =
    level.mode === 'parsons'
      ? blockTypesOf(level.initialWorkspace ?? solution)
      : toolboxTypes(level);
  const source = level.mode === 'parsons' ? 'initialWorkspace' : 'toolbox';
  for (const type of blockTypesOf(solution)) {
    if (type !== CQ_START && !available.has(type)) {
      issues.push({ rule: 11, message: `solution uses "${type}", which is not in ${source}` });
    }
  }

  return { issues, blocksUsed };
}

/**
 * Rules 1 (config), 5–6 (not in drafts), 9–16, 19 and 20 for a schema-valid level. Every run
 * uses the level with its shared rules merged in (`resolveLevelConfigs`).
 */
function checkParsedLevel(
  written: Level,
  isDraft: boolean,
  getKind: GameKindLookup,
  shared: SharedLevelRules,
): { issues: RuleIssue[]; solutionBlocks: number | null } {
  const level = resolveLevelConfigs(written, shared);
  const kind = getKind(level.kind);
  const issues = [
    ...(isDraft ? [] : pedagogyIssues(level)),
    ...shadowIssues(level),
    ...goalSpriteIssues(level),
  ];
  const configIssues = levelConfigIssues(level, kind, shared);
  issues.push(...configIssues);
  if (configIssues.length === 0) issues.push(...robotlabTimeIssues(level));
  let solutionBlocks: number | null = null;
  // The run rules 9–11, 13–16 and 19 need a valid config of an implemented kind.
  if (configIssues.length > 0 || kind === undefined) {
    return { issues: [...issues, ...limitIssues(level)], solutionBlocks };
  }
  // A predict level runs initialWorkspace, never a solution (rule 15 checks it instead).
  if (level.solution !== undefined && level.mode !== 'predict') {
    const solved = solutionIssues(level, level.solution, kind);
    issues.push(...solved.issues);
    solutionBlocks = solved.blocksUsed;
  }
  issues.push(
    ...modeIssues(level, kind),
    ...hintIssues(level, kind),
    ...starGoalIssues(level, kind),
    ...limitIssues(level),
  );
  return { issues, solutionBlocks };
}

function readId(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const id: unknown = (value as Record<string, unknown>)['id'];
  return typeof id === 'string' ? id : null;
}

/**
 * Checks one level (parsed JSON, or a draft object from the level editor) against every
 * per-level rule. Rules that need other files (3–4, 7–8, 17–18, and the ID matching its file
 * name or being unique) are left to `content:check`. Synchronous and deterministic; it runs
 * the solution, `initialWorkspace` and predict program with the real engine.
 */
export function validateLevel(json: unknown, options: ValidateLevelOptions = {}): LevelValidation {
  const isDraft = options.isDraft ?? false;
  const parsed = LevelSchema.safeParse(json);
  const issues: RuleIssue[] = parsed.success ? [] : formatSchemaIssues(parsed.error);
  let solutionBlocks: number | null = null;
  if (parsed.success) {
    const checked = checkParsedLevel(
      parsed.data,
      isDraft,
      options.getKind ?? getGameKind,
      options.shared ?? {},
    );
    issues.push(...checked.issues);
    solutionBlocks = checked.solutionBlocks;
  }
  const id = readId(json);
  if (!isDraft && id !== null && !ID_PATTERNS.level.test(id)) {
    issues.push({
      rule: 2,
      message: `level id "${id}" does not match ${ID_PATTERNS.level.source}`,
    });
  }
  return { level: parsed.success ? parsed.data : null, issues, solutionBlocks };
}
