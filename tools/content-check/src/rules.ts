/**
 * content:check, all 20 rules of docs/architecture/content-model.md §5 (phases: §7).
 * The per-level rules (1–2, 5–6, 9–16, 19) live in `@codequest/validator`, so the level editor
 * runs the same code in the browser. This file reads every file, checks rules 1–2 for worlds,
 * lessons and shared files, ID file names and uniqueness, 17 (feedback coverage) and 18
 * (assets), and wires in curriculum.ts (3–4, 7–8). Draft folders `worlds/_*` skip rules 3–8.
 */
import { statSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BadgesFileSchema,
  FeedbackFileSchema,
  LessonSchema,
  ShopFileSchema,
  WorldSchema,
  type FeedbackFile,
  type Level,
} from '@codequest/content-schema';
import { ENGINE_REASONS, type AnyGameKindDefinition } from '@codequest/engine';
import { gameKinds, getGameKind } from '@codequest/games';
import {
  formatSchemaIssues,
  ID_PATTERNS,
  validateLevel,
  type GameKindLookup,
  type RuleIssue,
} from '@codequest/validator';
import type { z } from 'zod';
import { checkCurriculum, type CurriculumInput, type WorldFile } from './curriculum';

export type { GameKindLookup } from '@codequest/validator';

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
  /** Levels only: `<kind>/<mode>`, then `par N`, `sol N` and `maps N` when known. */
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

const SHARED_FILES = new Set(['feedback.json', 'shop.json', 'badges.json']);
const FEEDBACK_PATH = 'shared/feedback.json';

const SHOP_ITEM_ID = /^(?:skin|pen|fx|music|bonus-level)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BADGE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ENTITY_SCHEMAS: Record<'world' | 'lesson', z.ZodType> = {
  world: WorldSchema,
  lesson: LessonSchema,
};

function schemaIssues(path: string, error: z.ZodError): Issue[] {
  return withPath(path, formatSchemaIssues(error));
}

function withPath(path: string, issues: readonly RuleIssue[]): Issue[] {
  return issues.map((issue) => ({ path, ...issue }));
}

/**
 * Table detail of a level: `<kind>/<mode>`, then `par N` and `sol N` when known, then `maps N`
 * for a multi-map level (P2-12) and `goals N` for a level with star goals (P2-21).
 */
function levelDetail(level: Level, solutionBlocks: number | null): string {
  let detail = `${level.kind}/${level.mode}`;
  if (level.par !== undefined) detail += `  par ${String(level.par)}`;
  if (solutionBlocks !== null) detail += `  sol ${String(solutionBlocks)}`;
  if (level.variants !== undefined) detail += `  maps ${String(level.variants.length + 1)}`;
  if (level.starGoals !== undefined) detail += `  goals ${String(level.starGoals.length)}`;
  return detail;
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

/** Runs all 20 rules over every JSON file under `content/` (paths relative to it). */
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
  /** Rule 2 checks that need the file's location: name, world prefix, uniqueness. */
  const claimFileId = (location: Location, id: string, path: string): void => {
    if (id !== location.expectedId) {
      const where = location.kind === 'world' ? 'folder name' : 'file name';
      issues.push({
        path,
        rule: 2,
        message: `id "${id}" must equal its ${where} "${location.expectedId ?? ''}"`,
      });
    }
    if (location.worldPrefix !== null && !id.startsWith(location.worldPrefix)) {
      issues.push({
        path,
        rule: 2,
        message: `id "${id}" must start with its world prefix "${location.worldPrefix}"`,
      });
    }
    const duplicate = claimId(id, path);
    if (duplicate !== null) issues.push(duplicate);
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

    const worldFile: WorldFile = {
      path: file.path,
      dir: location.worldDir ?? '',
      id,
      worldId: readString(parsed, 'worldId'),
    };
    if (location.kind === 'level') {
      hasLevels = true;
      // Rules 1, 2 (ID pattern), 5–6, 9–16, in the order content:check always printed them.
      const checked = validateLevel(parsed, { isDraft: location.isDraft, getKind });
      issues.push(...withPath(file.path, checked.issues));
      if (checked.level !== null) entry.detail = levelDetail(checked.level, checked.solutionBlocks);
      if (!location.isDraft) curriculum.levels.push({ ...worldFile, level: checked.level });
      claimFileId(location, id, file.path);
      continue;
    }

    const entity = ENTITY_SCHEMAS[location.kind].safeParse(parsed);
    if (!entity.success) issues.push(...schemaIssues(file.path, entity.error));
    if (location.kind === 'lesson') {
      const lesson = entity.success ? LessonSchema.parse(parsed) : null;
      for (const [index, card] of (lesson?.cards ?? []).entries()) {
        if (card.type === 'say' && card.image !== undefined) {
          shared.assets.push([file.path, `cards.${String(index)}.image`, card.image]);
        }
      }
      if (!location.isDraft) {
        curriculum.lessons.push({ ...worldFile, beforeLevel: lesson?.beforeLevel ?? null });
      }
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
    claimFileId(location, id, file.path);
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
