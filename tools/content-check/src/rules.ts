/**
 * content:check, all 18 rules of docs/architecture/content-model.md §5 (phases: §7).
 * This file: rules 1–2 (schema, IDs), 9–11 (the solution wins within par, maxBlocks and the
 * toolbox), 17 (feedback coverage) and 18 (assets), and wires in levelRules.ts (5–6, 12–16) and
 * curriculum.ts (3–4, 7–8). Draft folders `worlds/_*` skip the curriculum rules 3–8.
 */
import { statSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BadgesFileSchema,
  FeedbackFileSchema,
  LessonSchema,
  LevelSchema,
  ShopFileSchema,
  WorldSchema,
  type FeedbackFile,
  type GameKindId,
  type Level,
  type WorkspaceJson,
} from '@codequest/content-schema';
import {
  analyzeWorkspace,
  CQ_START,
  ENGINE_REASONS,
  registerBlockSpecs,
  runLevel,
  type AnyGameKindDefinition,
} from '@codequest/engine';
import { gameKinds, getGameKind } from '@codequest/games';
import type { z } from 'zod';
import { checkCurriculum, type CurriculumInput, type WorldFile } from './curriculum';
import { hintIssues, modeIssues, pedagogyIssues, shadowIssues, toolboxTypes } from './levelRules';
import { blockTypesOf } from './workspace';

export type ContentKind = 'world' | 'level' | 'lesson' | 'shared';

export interface ContentFile {
  /** Path relative to `content/`, always with `/` separators. */
  path: string;
  text: string;
}

export interface Issue {
  path: string;
  rule: number;
  message: string;
}

export interface CheckedEntry {
  path: string;
  kind: ContentKind;
  id: string | null;
  /** Levels only: `<kind>/<mode>`, then `par N` and `sol N` when known. */
  detail?: string;
}

export interface CheckReport {
  entries: CheckedEntry[];
  /** Errors: any of them makes content:check exit 1. */
  issues: Issue[];
  /** Printed but never fail the check (rule 8, provisional worlds). */
  warnings: Issue[];
}

/** Assets are served from the web app's public folder (content-model.md §5 rule 18). */
const PUBLIC_DIR = fileURLToPath(new URL('../../../apps/web/public/', import.meta.url));

/** True when `publicPath` (`/…`) names a file inside apps/web/public. */
export function publicAssetExists(publicPath: string): boolean {
  const full = resolve(PUBLIC_DIR, `.${publicPath}`);
  const inside = relative(PUBLIC_DIR, full);
  if (inside === '..' || inside.startsWith(`..${sep}`) || isAbsolute(inside)) return false;
  return statSync(full, { throwIfNoEntry: false })?.isFile() === true;
}

const ID_PATTERNS: Record<Exclude<ContentKind, 'shared'>, RegExp> = {
  world: /^w\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/,
  level: /^w\d{2}-(?:l\d{2}|boss|creative|bonus\d{2})$/,
  lesson: /^w\d{2}-lesson(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?$/,
};

const SHARED_FILES = new Set(['feedback.json', 'shop.json', 'badges.json']);
const FEEDBACK_PATH = 'shared/feedback.json';

const SHOP_ITEM_ID = /^(?:skin|pen|fx|music|bonus-level)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BADGE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ENTITY_SCHEMAS: Record<Exclude<ContentKind, 'shared'>, z.ZodType> = {
  world: WorldSchema,
  level: LevelSchema,
  lesson: LessonSchema,
};

/** Finds the game kind of a level; injectable so tests do not depend on real kinds. */
export type GameKindLookup = (id: GameKindId) => AnyGameKindDefinition | undefined;

function schemaIssues(path: string, error: z.ZodError, prefix = ''): Issue[] {
  return error.issues.map((issue) => {
    const where = [prefix, ...issue.path.map(String)].filter((part) => part !== '').join('.');
    return { path, rule: 1, message: `${where === '' ? '' : `${where}: `}${issue.message}` };
  });
}

/** Rule 1 for a level beyond its own schema: `config` must match its kind's `configSchema`. */
function levelConfigIssues(
  path: string,
  level: Level,
  kind: AnyGameKindDefinition | undefined,
): Issue[] {
  if (kind === undefined) {
    return [{ path, rule: 1, message: `game kind "${level.kind}" is not implemented yet` }];
  }
  const config = kind.configSchema.safeParse(level.config);
  return config.success ? [] : schemaIssues(path, config.error, 'config');
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Rules 9–11 for a level with a solution whose schema and config are valid. Returns the issues
 * and the solution's block count (null if the solution cannot even be loaded).
 */
function solutionIssues(
  path: string,
  level: Level,
  solution: WorkspaceJson,
  kind: AnyGameKindDefinition,
): { issues: Issue[]; blocksUsed: number | null } {
  const issues: Issue[] = [];

  // Rule 9: the solution wins.
  const outcome = runLevel({ kind, level, workspace: solution });
  if (outcome.result !== 'success') {
    // Rerun as a predict level to learn where it ended (`crash:FELL_IN_HOLE@2`, `stop@3`…).
    const where = runLevel({
      kind,
      level: { ...level, mode: 'predict', initialWorkspace: solution },
      workspace: solution,
    }).answerKey;
    const why = [
      outcome.reasonCode,
      where === undefined ? null : `(${where})`,
      outcome.debug?.message,
    ]
      .filter((part) => part !== null && part !== undefined)
      .join(' ');
    issues.push({ path, rule: 9, message: `solution ends ${outcome.result} ${why}`.trim() });
  }

  // Rule 10: blocksUsed(solution) ≤ par ≤ maxBlocks.
  let blocksUsed: number | null = null;
  try {
    registerBlockSpecs(kind.blocks);
    blocksUsed = analyzeWorkspace(solution).blocksUsed;
  } catch (error) {
    issues.push({
      path,
      rule: 10,
      message: `cannot count solution blocks: ${describeError(error)}`,
    });
  }
  const { par, maxBlocks } = level;
  if (blocksUsed !== null && par !== undefined && blocksUsed > par) {
    issues.push({
      path,
      rule: 10,
      message: `solution uses ${String(blocksUsed)} blocks > par ${String(par)}`,
    });
  }
  if (blocksUsed !== null && maxBlocks !== undefined && blocksUsed > maxBlocks) {
    issues.push({
      path,
      rule: 10,
      message: `solution uses ${String(blocksUsed)} blocks > maxBlocks ${String(maxBlocks)}`,
    });
  }
  if (par !== undefined && maxBlocks !== undefined && par > maxBlocks) {
    issues.push({ path, rule: 10, message: `par ${String(par)} > maxBlocks ${String(maxBlocks)}` });
  }

  // Rule 11: solution blocks ⊆ toolbox (parsons: ⊆ initialWorkspace).
  const available =
    level.mode === 'parsons'
      ? blockTypesOf(level.initialWorkspace ?? solution)
      : toolboxTypes(level);
  const source = level.mode === 'parsons' ? 'initialWorkspace' : 'toolbox';
  for (const type of blockTypesOf(solution)) {
    if (type !== CQ_START && !available.has(type)) {
      issues.push({
        path,
        rule: 11,
        message: `solution uses "${type}", which is not in ${source}`,
      });
    }
  }

  return { issues, blocksUsed };
}

/**
 * Rules 1 (config), 5–6 (not in drafts), 9–16 for a schema-valid level, plus its table detail.
 * The run rules 9–11 and 13–16 need a valid config of an implemented kind.
 */
function levelIssues(
  path: string,
  level: Level,
  isDraft: boolean,
  getKind: GameKindLookup,
): { issues: Issue[]; detail: string } {
  const kind = getKind(level.kind);
  const issues = [...(isDraft ? [] : pedagogyIssues(path, level)), ...shadowIssues(path, level)];
  const configIssues = levelConfigIssues(path, level, kind);
  issues.push(...configIssues);
  let detail = `${level.kind}/${level.mode}`;
  if (level.par !== undefined) detail += `  par ${String(level.par)}`;
  if (configIssues.length > 0 || kind === undefined) return { issues, detail };
  // A predict level runs initialWorkspace, never a solution (rule 15 checks it instead).
  if (level.solution !== undefined && level.mode !== 'predict') {
    const solved = solutionIssues(path, level, level.solution, kind);
    issues.push(...solved.issues);
    if (solved.blocksUsed !== null) detail += `  sol ${String(solved.blocksUsed)}`;
  }
  issues.push(...modeIssues(path, level, kind), ...hintIssues(path, level, kind));
  return { issues, detail };
}

/** Rule 17: every engine and game-kind reason code has a sentence in feedback.json. */
function feedbackIssues(feedback: FeedbackFile, kinds: readonly AnyGameKindDefinition[]): Issue[] {
  const codes = new Set<string>([...ENGINE_REASONS, ...kinds.flatMap((kind) => kind.reasonCodes)]);
  return [...codes]
    .filter((code) => feedback[code] === undefined)
    .map((code) => ({
      path: FEEDBACK_PATH,
      rule: 17,
      message: `reasonCode ${code} has no sentence`,
    }));
}

/** What rules 17–18 need, collected while reading the files. */
interface SharedData {
  feedback: FeedbackFile | null;
  /** Rule 18: `[path, field, public path]` of every referenced asset. */
  assets: Array<[string, string, string]>;
}

/** Rule 1–2 for shared/*.json: schema, then shop item and badge IDs. */
function sharedIssues(
  path: string,
  parsed: unknown,
  claimId: (id: string, path: string) => Issue | null,
  shared: SharedData,
): Issue[] {
  const name = path.split('/')[1];
  if (name === 'feedback.json') {
    const feedback = FeedbackFileSchema.safeParse(parsed);
    if (feedback.success) shared.feedback = feedback.data;
    return feedback.success ? [] : schemaIssues(path, feedback.error);
  }
  const issues: Issue[] = [];
  const check = (id: string, pattern: RegExp, extra: string | null): void => {
    if (!pattern.test(id)) {
      issues.push({ path, rule: 2, message: `id "${id}" does not match ${pattern.source}` });
    }
    if (extra !== null) issues.push({ path, rule: 2, message: extra });
    const duplicate = claimId(id, path);
    if (duplicate !== null) issues.push(duplicate);
  };
  if (name === 'shop.json') {
    const shop = ShopFileSchema.safeParse(parsed);
    if (!shop.success) return schemaIssues(path, shop.error);
    for (const item of shop.data) {
      shared.assets.push([path, `${item.id}.asset`, item.asset]);
      const prefix = `${item.kind}-`;
      check(
        item.id,
        SHOP_ITEM_ID,
        item.id.startsWith(prefix) ? null : `id "${item.id}" must start with "${prefix}"`,
      );
    }
    return issues;
  }
  const badges = BadgesFileSchema.safeParse(parsed);
  if (!badges.success) return schemaIssues(path, badges.error);
  for (const badge of badges.data) check(badge.id, BADGE_ID, null);
  return issues;
}

interface Location {
  kind: ContentKind;
  /** Draft folders `worlds/_*` are exempt from the ID pattern (content-model.md §1). */
  isDraft: boolean;
  /** For world.json the ID must equal its folder name instead of the file name. */
  expectedId: string | null;
  /** `w<NN>` prefix that level and lesson IDs must share with their world folder. */
  worldPrefix: string | null;
  /** Name of the `worlds/<dir>/` folder, null for shared/. */
  worldDir: string | null;
}

function locate(path: string): Location | string {
  const parts = path.split('/');
  if (parts[0] === 'shared' && parts.length === 2) {
    if (!SHARED_FILES.has(parts[1] ?? '')) {
      return `unknown shared file; expected one of ${[...SHARED_FILES].join(', ')}`;
    }
    return { kind: 'shared', isDraft: false, expectedId: null, worldPrefix: null, worldDir: null };
  }
  if (parts[0] !== 'worlds' || parts.length < 3) {
    return 'file is outside shared/ and worlds/<world>/';
  }
  const worldDir = parts[1] ?? '';
  const isDraft = worldDir.startsWith('_');
  const fileName = parts[parts.length - 1] ?? '';
  const baseName = fileName.replace(/\.json$/, '');
  const worldPrefix = isDraft ? null : (/^w\d{2}-/.exec(worldDir)?.[0] ?? null);
  if (parts.length === 3 && fileName === 'world.json') {
    return { kind: 'world', isDraft, expectedId: worldDir, worldPrefix: null, worldDir };
  }
  if (parts.length === 4 && parts[2] === 'levels') {
    return { kind: 'level', isDraft, expectedId: baseName, worldPrefix, worldDir };
  }
  if (parts.length === 4 && parts[2] === 'lessons') {
    return { kind: 'lesson', isDraft, expectedId: baseName, worldPrefix, worldDir };
  }
  return 'unexpected location; use world.json, levels/<id>.json or lessons/<id>.json';
}

function readString(value: unknown, key: string): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const field: unknown = (value as Record<string, unknown>)[key];
  return typeof field === 'string' ? field : null;
}

/** Runs all 18 rules over every JSON file under `content/` (paths relative to it). */
export function checkContent(
  files: readonly ContentFile[],
  getKind: GameKindLookup = getGameKind,
): CheckReport {
  const entries: CheckedEntry[] = [];
  const issues: Issue[] = [];
  const curriculum: CurriculumInput = { worlds: [], levels: [], lessons: [] };
  const shared: SharedData = { feedback: null, assets: [] };
  let hasLevels = false;
  const firstPathById = new Map<string, string>();
  const claimId = (id: string, path: string): Issue | null => {
    const firstPath = firstPathById.get(id);
    if (firstPath === undefined) {
      firstPathById.set(id, path);
      return null;
    }
    return { path, rule: 2, message: `duplicate id "${id}" (also in ${firstPath})` };
  };

  for (const file of files) {
    const location = locate(file.path);
    if (typeof location === 'string') {
      issues.push({ path: file.path, rule: 2, message: location });
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(file.text);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      issues.push({ path: file.path, rule: 1, message: `invalid JSON: ${reason}` });
      continue;
    }

    if (location.kind === 'shared') {
      entries.push({ path: file.path, kind: 'shared', id: null });
      issues.push(...sharedIssues(file.path, parsed, claimId, shared));
      continue;
    }

    const id = readString(parsed, 'id');
    const entry: CheckedEntry = { path: file.path, kind: location.kind, id };
    entries.push(entry);
    if (id === null) {
      issues.push({ path: file.path, rule: 1, message: 'missing string "id"' });
      continue;
    }

    const entity = ENTITY_SCHEMAS[location.kind].safeParse(parsed);
    if (!entity.success) issues.push(...schemaIssues(file.path, entity.error));
    const worldFile: WorldFile = {
      path: file.path,
      dir: location.worldDir ?? '',
      id,
      worldId: readString(parsed, 'worldId'),
    };
    if (location.kind === 'level') {
      hasLevels = true;
      const level = entity.success ? LevelSchema.parse(parsed) : null;
      if (level !== null) {
        const checked = levelIssues(file.path, level, location.isDraft, getKind);
        issues.push(...checked.issues);
        entry.detail = checked.detail;
      }
      if (!location.isDraft) curriculum.levels.push({ ...worldFile, level });
    }
    if (location.kind === 'lesson') {
      const lesson = entity.success ? LessonSchema.parse(parsed) : null;
      for (const [index, card] of (lesson?.cards ?? []).entries()) {
        if (card.type === 'say' && card.image !== undefined) {
          shared.assets.push([file.path, `cards.${String(index)}.image`, card.image]);
        }
      }
      if (!location.isDraft) curriculum.lessons.push(worldFile);
    }
    if (location.kind === 'world') {
      const world = entity.success ? WorldSchema.parse(parsed) : null;
      if (world !== null) {
        shared.assets.push([file.path, 'theme.tileset', world.theme.tileset]);
        if (world.theme.music !== undefined) {
          shared.assets.push([file.path, 'theme.music', world.theme.music]);
        }
        if (!location.isDraft) {
          curriculum.worlds.push({ path: file.path, dir: worldFile.dir, world });
        }
      }
    }

    if (!location.isDraft && !ID_PATTERNS[location.kind].test(id)) {
      issues.push({
        path: file.path,
        rule: 2,
        message: `${location.kind} id "${id}" does not match ${ID_PATTERNS[location.kind].source}`,
      });
    }
    if (id !== location.expectedId) {
      const where = location.kind === 'world' ? 'folder name' : 'file name';
      issues.push({
        path: file.path,
        rule: 2,
        message: `id "${id}" must equal its ${where} "${location.expectedId ?? ''}"`,
      });
    }
    if (location.worldPrefix !== null && !id.startsWith(location.worldPrefix)) {
      issues.push({
        path: file.path,
        rule: 2,
        message: `id "${id}" must start with its world prefix "${location.worldPrefix}"`,
      });
    }
    const duplicate = claimId(id, file.path);
    if (duplicate !== null) issues.push(duplicate);
  }

  // Rules 3–4, 7–8 across worlds.
  const { errors, warnings } = checkCurriculum(curriculum);
  issues.push(...errors);

  // Rule 17: feedback.json covers every reason code.
  if (shared.feedback !== null) {
    issues.push(...feedbackIssues(shared.feedback, Object.values(gameKinds)));
  } else if (hasLevels && !files.some((file) => file.path === FEEDBACK_PATH)) {
    issues.push({ path: FEEDBACK_PATH, rule: 17, message: 'file is missing' });
  }

  // Rule 18: referenced assets exist.
  for (const [path, field, asset] of shared.assets) {
    if (!asset.startsWith('/') || !publicAssetExists(asset)) {
      issues.push({
        path,
        rule: 18,
        message: `${field} "${asset}" is not a file in apps/web/public/`,
      });
    }
  }

  return { entries, issues, warnings };
}
