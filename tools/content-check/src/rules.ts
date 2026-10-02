/**
 * content:check rules 1–2 and 9–11 (docs/architecture/content-model.md §5, §7): every file
 * matches its zod schema (levels also their kind's `configSchema`), IDs are unique, well-formed
 * and match their file; shop item and badge IDs inside shared/ are checked too. Every level
 * solution runs to success, fits `par` and `maxBlocks`, and only uses toolbox blocks.
 */
import {
  BadgesFileSchema,
  FeedbackFileSchema,
  LessonSchema,
  LevelSchema,
  ShopFileSchema,
  WorldSchema,
  type GameKindId,
  type Level,
  type WorkspaceJson,
} from '@codequest/content-schema';
import {
  analyzeWorkspace,
  CQ_START,
  registerBlockSpecs,
  runLevel,
  type AnyGameKindDefinition,
} from '@codequest/engine';
import { getGameKind } from '@codequest/games';
import type { z } from 'zod';

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
  issues: Issue[];
}

const ID_PATTERNS: Record<Exclude<ContentKind, 'shared'>, RegExp> = {
  world: /^w\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/,
  level: /^w\d{2}-(?:l\d{2}|boss|creative|bonus\d{2})$/,
  lesson: /^w\d{2}-lesson(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?$/,
};

const SHARED_FILES = new Set(['feedback.json', 'shop.json', 'badges.json']);

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

/** Types of every non-shadow block in a workspace JSON, orphans included. */
function blockTypesOf(workspace: WorkspaceJson): Set<string> {
  const types = new Set<string>();
  const visit = (block: unknown): void => {
    if (typeof block !== 'object' || block === null) return;
    const { type, next, inputs } = block as Record<string, unknown>;
    if (typeof type === 'string') types.add(type);
    if (typeof next === 'object' && next !== null)
      visit((next as Record<string, unknown>)['block']);
    if (typeof inputs === 'object' && inputs !== null) {
      for (const input of Object.values(inputs)) {
        if (typeof input === 'object' && input !== null) {
          visit((input as Record<string, unknown>)['block']);
        }
      }
    }
  };
  for (const block of workspace.blocks.blocks) visit(block);
  return types;
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
      : new Set(level.toolbox.map((entry) => (typeof entry === 'string' ? entry : entry.type)));
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

/** Rules 1 (config) and 9–11 for a level file, plus its table detail. */
function levelIssues(
  path: string,
  parsed: unknown,
  getKind: GameKindLookup,
): { issues: Issue[]; detail?: string } {
  const parsedLevel = LevelSchema.safeParse(parsed);
  if (!parsedLevel.success) return { issues: [] };
  const level = parsedLevel.data;
  const kind = getKind(level.kind);
  const issues = levelConfigIssues(path, level, kind);
  let detail = `${level.kind}/${level.mode}`;
  if (level.par !== undefined) detail += `  par ${String(level.par)}`;
  if (issues.length > 0 || kind === undefined || level.solution === undefined) {
    return { issues, detail };
  }
  const solved = solutionIssues(path, level, level.solution, kind);
  if (solved.blocksUsed !== null) detail += `  sol ${String(solved.blocksUsed)}`;
  return { issues: solved.issues, detail };
}

/** Rule 1–2 for shared/*.json: schema, then shop item and badge IDs. */
function sharedIssues(
  path: string,
  parsed: unknown,
  claimId: (id: string, path: string) => Issue | null,
): Issue[] {
  const name = path.split('/')[1];
  if (name === 'feedback.json') {
    const feedback = FeedbackFileSchema.safeParse(parsed);
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
}

function locate(path: string): Location | string {
  const parts = path.split('/');
  if (parts[0] === 'shared' && parts.length === 2) {
    if (!SHARED_FILES.has(parts[1] ?? '')) {
      return `unknown shared file; expected one of ${[...SHARED_FILES].join(', ')}`;
    }
    return { kind: 'shared', isDraft: false, expectedId: null, worldPrefix: null };
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
    return { kind: 'world', isDraft, expectedId: worldDir, worldPrefix: null };
  }
  if (parts.length === 4 && parts[2] === 'levels') {
    return { kind: 'level', isDraft, expectedId: baseName, worldPrefix };
  }
  if (parts.length === 4 && parts[2] === 'lessons') {
    return { kind: 'lesson', isDraft, expectedId: baseName, worldPrefix };
  }
  return 'unexpected location; use world.json, levels/<id>.json or lessons/<id>.json';
}

function readId(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const id: unknown = (value as Record<string, unknown>)['id'];
  return typeof id === 'string' ? id : null;
}

/** Runs rules 1–2 and 9–11 over every JSON file under `content/`. */
export function checkContent(
  files: readonly ContentFile[],
  getKind: GameKindLookup = getGameKind,
): CheckReport {
  const entries: CheckedEntry[] = [];
  const issues: Issue[] = [];
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
      issues.push(...sharedIssues(file.path, parsed, claimId));
      continue;
    }

    const id = readId(parsed);
    const entry: CheckedEntry = { path: file.path, kind: location.kind, id };
    entries.push(entry);
    if (id === null) {
      issues.push({ path: file.path, rule: 1, message: 'missing string "id"' });
      continue;
    }

    const entity = ENTITY_SCHEMAS[location.kind].safeParse(parsed);
    if (!entity.success) issues.push(...schemaIssues(file.path, entity.error));
    if (location.kind === 'level') {
      const level = levelIssues(file.path, parsed, getKind);
      issues.push(...level.issues);
      if (level.detail !== undefined) entry.detail = level.detail;
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

  return { entries, issues };
}
