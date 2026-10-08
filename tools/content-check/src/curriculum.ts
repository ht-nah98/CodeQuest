/**
 * Cross-file rules 3, 4, 7, 8 and 21 (story chapters, story.ts) of content-model.md §5: how worlds, lessons and levels fit
 * together into one curriculum. Draft folders `worlds/_*` are outside the curriculum and
 * skipped (content-model.md §1).
 */
import { CQ_START } from '@codequest/engine';
import type { Level, LevelMode, World } from '@codequest/content-schema';
import { gameKinds } from '@codequest/games';
import { blockTypesOf, toolboxTypes } from '@codequest/validator';
import type { Issue } from './rules';
import { checkStory } from './story';

/**
 * Worlds whose world.json is still a temporary stub (content-model.md §7), with the roadmap
 * task that completes them. Rules 4 and 7 only warn for them; remove the entry in that task.
 */
export const PROVISIONAL_WORLDS: ReadonlyMap<string, string> = new Map<string, string>();

/** A file under `worlds/<dir>/`; `id` and `worldId` are read loosely so broken files still count. */
export interface WorldFile {
  path: string;
  /** Name of the world folder. */
  dir: string;
  id: string;
  worldId: string | null;
}

export interface CurriculumInput {
  /** Schema-valid world.json files outside draft folders. */
  worlds: Array<{ path: string; dir: string; world: World }>;
  /** Level files outside draft folders; `level` is null when the schema failed. */
  levels: Array<WorldFile & { level: Level | null }>;
  /** Lesson files outside draft folders; `beforeLevel` is null for opening lessons. */
  lessons: Array<WorldFile & { beforeLevel?: string | null }>;
}

export interface CurriculumReport {
  errors: Issue[];
  warnings: Issue[];
}

/** The four modes every world should practise (rule 8). */
const WORLD_MODES: readonly LevelMode[] = ['build', 'parsons', 'predict', 'bughunt'];
const MAX_BUILD_RUN = 3;

/**
 * Kid-facing label of every action block (category `move`: it moves Măng or changes the world),
 * e.g. `runner_jump` → "nhảy", `robot_forward` (`tiến %1 ô`) → "tiến ô": field placeholders
 * dropped, spaces collapsed. Rule 7 warns when the level introducing one never names it.
 */
export const ACTION_LABELS: ReadonlyMap<string, string> = new Map(
  Object.values(gameKinds)
    .flatMap((kind) => kind.blocks)
    .filter((spec) => spec.category === 'move' && typeof spec.json.message0 === 'string')
    .map((spec) => [spec.type, words(spec.json.message0.replace(/%\d+/g, ' ')).trim()]),
);

/** Lower-case words of a sentence, space-padded, for whole-word matching ("đi" ≠ "đích"). */
function words(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()} `;
}

/**
 * Whether a hint names an action label as the child sees it on the block: whole words, and a
 * number the child typed into a field counts as the field ("tiến 3 ô" names "tiến ô").
 */
export function hintNamesLabel(say: string, label: string): boolean {
  const said = words(say);
  return said.includes(` ${label} `) || said.replace(/ \p{N}+(?= )/gu, '').includes(` ${label} `);
}

function count<T>(items: readonly T[], keep: (item: T) => boolean): number {
  return items.filter(keep).length;
}

export function checkCurriculum(input: CurriculumInput): CurriculumReport {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  /** Rules 4 and 7 only warn inside a provisional world. */
  const reportStrict = (worldId: string, issue: Issue): void => {
    const task = PROVISIONAL_WORLDS.get(worldId);
    if (task === undefined) errors.push(issue);
    else warnings.push({ ...issue, message: `${issue.message} (provisional world until ${task})` });
  };

  // Rule 3: world → files, file → exactly one world.
  const levelById = new Map(input.levels.map((file) => [file.id, file]));
  const lessonById = new Map(input.lessons.map((file) => [file.id, file]));
  const listedIn = new Map<string, string[]>();
  for (const { path, dir, world } of input.worlds) {
    const refs: Array<['levelIds' | 'lessonIds', string[], Map<string, WorldFile>]> = [
      ['levelIds', world.levelIds, levelById],
      ['lessonIds', world.lessonIds, lessonById],
    ];
    for (const [field, ids, files] of refs) {
      const seen = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) {
          errors.push({ path, rule: 3, message: `${field} lists "${id}" twice` });
          continue;
        }
        seen.add(id);
        const file = files.get(id);
        if (file === undefined) {
          errors.push({ path, rule: 3, message: `${field} lists "${id}", which has no file` });
        } else if (file.dir !== dir) {
          errors.push({
            path,
            rule: 3,
            message: `${field} lists "${id}", which lives in worlds/${file.dir}/`,
          });
        }
        if (field === 'levelIds') listedIn.set(id, [...(listedIn.get(id) ?? []), world.id]);
      }
    }
  }
  for (const file of [...input.levels, ...input.lessons]) {
    if (file.worldId !== null && file.worldId !== file.dir) {
      errors.push({
        path: file.path,
        rule: 3,
        message: `worldId "${file.worldId}" must equal its world folder "${file.dir}"`,
      });
    }
  }
  // Rule 3, block lessons: `beforeLevel` names a level of the same world, and never on the
  // world's opening lesson (lessonIds[0] gates level 1, so it must come first on the path).
  for (const { world } of input.worlds) {
    for (const [index, id] of world.lessonIds.entries()) {
      const file = lessonById.get(id);
      const before = file?.beforeLevel ?? null;
      if (file === undefined || before === null) continue;
      if (index === 0) {
        errors.push({
          path: file.path,
          rule: 3,
          message: `opening lesson "${id}" must not set beforeLevel`,
        });
      } else if (!world.levelIds.includes(before)) {
        errors.push({
          path: file.path,
          rule: 3,
          message: `beforeLevel "${before}" is not in the levelIds of ${world.id}`,
        });
      }
    }
  }
  for (const file of input.levels) {
    const worlds = listedIn.get(file.id) ?? [];
    if (worlds.length !== 1) {
      errors.push({
        path: file.path,
        rule: 3,
        message:
          worlds.length === 0
            ? `level "${file.id}" is not in any world.levelIds`
            : `level "${file.id}" is in the levelIds of ${worlds.join(', ')}`,
      });
    }
  }

  /** Live (not retired), schema-valid levels of a world, in display order. */
  const liveLevels = (world: World): Level[] =>
    world.levelIds
      .map((id) => levelById.get(id)?.level ?? null)
      .filter((level): level is Level => level !== null && level.retired !== true);

  // Rule 4: ≥ 1 lesson, exactly 1 boss, at most 1 creative.
  for (const { path, world } of input.worlds) {
    const levels = liveLevels(world);
    const lessons = count(world.lessonIds, (id) => lessonById.has(id));
    if (lessons === 0) reportStrict(world.id, { path, rule: 4, message: 'world has no lesson' });
    const bosses = count(levels, (level) => level.stage === 'boss');
    if (bosses !== 1) {
      reportStrict(world.id, {
        path,
        rule: 4,
        message: `world has ${String(bosses)} live boss levels; expected exactly 1`,
      });
    }
    const creatives = count(levels, (level) => level.stage === 'creative');
    if (creatives > 1) {
      reportStrict(world.id, {
        path,
        rule: 4,
        message: `world has ${String(creatives)} creative levels; expected at most 1`,
      });
    }
  }

  // Rule 7: a block first appears in a guided/practice build or parsons level that points to it.
  const ordered = [...input.worlds].sort(
    (a, b) => a.world.order - b.world.order || a.world.id.localeCompare(b.world.id),
  );
  const seen = new Set<string>([CQ_START]);
  for (const { world } of ordered) {
    for (const level of liveLevels(world)) {
      const path = levelById.get(level.id)?.path ?? '';
      const types = new Set([
        ...toolboxTypes(level),
        ...(level.initialWorkspace === undefined ? [] : blockTypesOf(level.initialWorkspace)),
        ...(level.solution === undefined ? [] : blockTypesOf(level.solution)),
      ]);
      for (const type of types) {
        if (seen.has(type)) continue;
        seen.add(type);
        const prefix = `block "${type}" first appears here (${level.stage}/${level.mode})`;
        if (level.stage !== 'guided' && level.stage !== 'practice') {
          reportStrict(world.id, {
            path,
            rule: 7,
            message: `${prefix}; must be guided or practice`,
          });
        } else if (level.mode !== 'build' && level.mode !== 'parsons') {
          reportStrict(world.id, { path, rule: 7, message: `${prefix}; must be build or parsons` });
        } else {
          const target = `${level.mode === 'build' ? 'toolbox' : 'block'}:${type}`;
          if (!level.hints.some((hint) => hint.point === target)) {
            reportStrict(world.id, {
              path,
              rule: 7,
              message: `${prefix}; needs a hint with point "${target}"`,
            });
            continue;
          }
          // Warning: an action block's first level should say in kid words what it does
          // (content-authoring.md §5.1). Cheap proxy: at least one hint names the block (whole
          // words, so "đi" does not match "đích"); whether it explains the move is for review.
          const label = ACTION_LABELS.get(type);
          if (
            label !== undefined &&
            label !== '' &&
            !level.hints.some((hint) => hintNamesLabel(hint.say, label))
          ) {
            warnings.push({
              path,
              rule: 7,
              message: `${prefix}; no hint mentions "${label}" (introduce it in kid words)`,
            });
          }
        }
      }
    }
  }

  // Rule 21: story chapters open in order, each after a level on the world's path.
  for (const { path, world } of input.worlds) {
    errors.push(...checkStory(path, world, (id) => levelById.get(id)?.level ?? undefined));
  }

  // Rule 8 (warning only): every mode once per world, at most 3 build levels in a row.
  for (const { path, world } of input.worlds) {
    const levels = liveLevels(world);
    const missing = WORLD_MODES.filter((mode) => !levels.some((level) => level.mode === mode));
    if (missing.length > 0) {
      warnings.push({ path, rule: 8, message: `world has no ${missing.join(', ')} level` });
    }
    let run: string[] = [];
    for (const level of [...levels, null]) {
      if (level?.mode === 'build') {
        run.push(level.id);
        continue;
      }
      if (run.length > MAX_BUILD_RUN) {
        warnings.push({
          path,
          rule: 8,
          message: `${String(run.length)} build levels in a row (${run.join(', ')}); max ${String(MAX_BUILD_RUN)}`,
        });
      }
      run = [];
    }
  }

  return { errors, warnings };
}
