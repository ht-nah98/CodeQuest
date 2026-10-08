import { basename, join, resolve } from 'node:path';
import type { Level } from '@codequest/content-schema';
import { robotlabRulesSchema, type SharedLevelRules } from '@codequest/games';
import {
  findFixes,
  findParsonsArrangements,
  findShortestPrograms,
  formatProgram,
  type Program,
  type ShortestOptions,
  UnsearchableLevel,
} from '@codequest/validator';

/** A level file to search, or why it could not be found. */
export interface LevelFile {
  name: string;
  path?: string;
  text?: string;
  error?: string;
}

/** The file system calls `findLevelFiles` needs (injectable for tests). */
export interface ContentReader {
  /** Entry names of a directory, [] when it does not exist. */
  list(dir: string): string[];
  /** File contents; throws when missing. */
  read(path: string): string;
}

/**
 * Level files for the CLI targets: level ids (`w02-l05`), paths to `.json` files, and worlds
 * (`w02`, `w02-rung-lap-lai`) in their `levelIds` order.
 */
export function findLevelFiles(
  fs: ContentReader,
  contentDir: string,
  targets: readonly string[],
  worlds: readonly string[],
): LevelFile[] {
  const worldsDir = join(contentDir, 'worlds');
  const worldDirs = fs.list(worldsDir).sort();
  const load = (name: string, path: string): LevelFile => {
    try {
      return { name, path, text: fs.read(path) };
    } catch {
      return { name, path, error: `cannot read ${path}` };
    }
  };
  const byId = (id: string): LevelFile => {
    for (const dir of worldDirs) {
      const file = `${id}.json`;
      if (fs.list(join(worldsDir, dir, 'levels')).includes(file)) {
        return load(id, join(worldsDir, dir, 'levels', file));
      }
    }
    return { name: id, error: 'no such level in content/worlds/*/levels/' };
  };

  const out: LevelFile[] = [];
  for (const world of worlds) {
    const dir = worldDirs.find((name) => name === world || name.startsWith(`${world}-`));
    if (dir === undefined) {
      out.push({ name: world, error: 'no such world in content/worlds/' });
      continue;
    }
    let levelIds: unknown;
    try {
      levelIds = (JSON.parse(fs.read(join(worldsDir, dir, 'world.json'))) as { levelIds?: unknown })
        .levelIds;
    } catch {
      levelIds = undefined;
    }
    if (!Array.isArray(levelIds)) {
      out.push({ name: world, error: `${dir}/world.json has no levelIds` });
      continue;
    }
    for (const id of levelIds) out.push(byId(String(id)));
  }
  for (const target of targets) {
    out.push(
      target.endsWith('.json') ? load(basename(target, '.json'), resolve(target)) : byId(target),
    );
  }
  return out;
}

/**
 * Shared rules from `<sharedDir>/robotlab.json`, to merge into each level with
 * `resolveLevelConfigs`. A missing or invalid file leaves robotlab out: its levels then fail
 * loudly (INTERNAL_ERROR) instead of running with wrong rules; content:check says why.
 */
export function readSharedRules(
  read: (path: string) => string,
  sharedDir: string,
): SharedLevelRules {
  let json: unknown;
  try {
    json = JSON.parse(read(join(sharedDir, 'robotlab.json')));
  } catch {
    return {};
  }
  const rules = robotlabRulesSchema.safeParse(json);
  return rules.success ? { robotlab: rules.data } : {};
}

/** One printed result: `✔`/`⚠`/`✖`/`–`, a headline and indented details. */
export interface Verdict {
  mark: '✔' | '⚠' | '✖' | '–';
  head: string;
  lines: string[];
}

const SHOWN_EXAMPLES = 3;

function examples(label: string, programs: readonly Program[]): string[] {
  return programs.slice(0, SHOWN_EXAMPLES).map((program) => `${label}: ${formatProgram(program)}`);
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Searches one level and judges its `par` (build) or `parEdits` (bughunt).
 * ✖ only when the result is certain: a real program smaller than `par` wins, `runLevel`
 * disagrees with the search on a found program, or nothing wins within `par` / `parEdits`
 * after a complete search of every toolbox block. Everything uncertain is at most ⚠: the
 * budget ran out, some toolbox blocks could not be searched (sensors, conditions), or the game
 * kind cannot be replayed. A bughunt level fixable with fewer edits than `parEdits` is ⚠.
 * With `starGoals` (P2-21) par / parEdits count only programs that meet every goal ("min
 * (goals)"), and the head adds the cheapest plain win (" · plain win M") for the trade-off.
 */
export function judgeLevel(level: Level, options: ShortestOptions): Verdict {
  // A multi-map level (P2-12): the search only counts programs that win every map.
  const maps = level.variants === undefined ? '' : `  maps ${String(level.variants.length + 1)}`;
  const name = `${level.id} ${level.kind}/${level.mode}${maps}`;
  if (level.mode === 'parsons') return judgeParsons(level, name, options);
  if (level.mode !== 'build' && level.mode !== 'bughunt') {
    return { mark: '–', head: `${name}  skipped (blocks are given)`, lines: [] };
  }
  try {
    const shortest = findShortestPrograms(level, options);
    // With unsearched blocks, "nothing wins" and "this is the minimum" are not proven.
    const partial = shortest.unsupported.length > 0;
    const lines = [
      ...shortest.unsupported.map((text) => `not searched: ${text}`),
      ...shortest.mismatches.map((text) => `runLevel disagrees: ${text}`),
    ];
    const marks: Array<Verdict['mark']> = [shortest.mismatches.length > 0 ? '✖' : '✔'];
    if (partial) marks.push('⚠');
    if (!shortest.complete) lines.push('search stopped (budget or --timeout)');
    const par = level.par === undefined ? 'no par' : `par ${String(level.par)}`;
    let head = `${name}  ${par}`;
    // With star goals (P2-21) par counts only wins that meet every goal: "min (goals)".
    const goals = level.starGoals === undefined ? '' : ' (goals)';
    if (shortest.minBlocks === null) {
      head += `  no win${goals} ≤ ${String(shortest.complete ? shortest.maxSize : shortest.searchedSize)} blocks`;
      // A bughunt level is judged by its fixes; for build there must be a win within par.
      if (level.mode === 'build') marks.push(shortest.complete && !partial ? '✖' : '⚠');
    } else {
      const count = `${shortest.complete ? '' : '≥'}${String(shortest.count)}`;
      head += `  min${goals} ${String(shortest.minBlocks)} (${count} shortest)`;
      lines.push(...examples('shortest', shortest.examples));
      if (level.mode === 'build' && level.par !== undefined && shortest.minBlocks < level.par) {
        marks.push('✖');
        lines.push(
          `par ${String(level.par)} is too high: ${String(shortest.minBlocks)} blocks win${goals}`,
        );
      }
      if (level.mode === 'build' && level.par === undefined) marks.push('⚠');
    }
    if (level.starGoals !== undefined) {
      // The trade-off the child sees: the cheapest plain win (⭐ only) next to par.
      const plain = findShortestPrograms(level, { ...options, ignoreStarGoals: true });
      lines.push(...plain.mismatches.map((text) => `runLevel disagrees: ${text}`));
      if (plain.mismatches.length > 0) marks.push('✖');
      if (!plain.complete) lines.push('plain-win search stopped (budget or --timeout)');
      if (plain.minBlocks === null) {
        head += ` · plain win none ≤ ${String(plain.complete ? plain.maxSize : plain.searchedSize)}`;
      } else {
        const count = `${plain.complete ? '' : '≥'}${String(plain.count)}`;
        head += ` · plain win ${String(plain.minBlocks)} (${count})`;
        lines.push(...examples('plain win', plain.examples));
      }
    }

    if (level.mode === 'bughunt') {
      const fixes = findFixes(level, options);
      const parEdits = level.parEdits ?? 1;
      lines.push(...fixes.mismatches.map((text) => `runLevel disagrees: ${text}`));
      if (fixes.mismatches.length > 0) marks.push('✖');
      if (!fixes.complete) lines.push('fix search stopped (budget, memory cap or --timeout)');
      if (fixes.minEdits === null) {
        head += `  parEdits ${String(parEdits)}  no fix${goals} ≤ ${String(fixes.searchedEdits)} edits`;
        marks.push(fixes.complete && !partial ? '✖' : '⚠');
      } else {
        const count = `${fixes.complete ? '' : '≥'}${String(fixes.count)}`;
        head += `  parEdits ${String(parEdits)}  fix${goals} ${String(fixes.minEdits)} (${count} fixes)`;
        lines.push(...examples('fix', fixes.examples));
        if (fixes.minEdits < parEdits) {
          marks.push('⚠');
          lines.push(`fixable with ${String(fixes.minEdits)} edits < parEdits ${String(parEdits)}`);
        }
      }
    }
    const mark = marks.includes('✖') ? '✖' : marks.includes('⚠') ? '⚠' : '✔';
    return { mark, head, lines };
  } catch (error) {
    const mark = error instanceof UnsearchableLevel ? '⚠' : '✖';
    return { mark, head: `${name}  ${describeError(error)}`, lines: [] };
  }
}

/**
 * Parsons (G22): runs every arrangement of the given blocks. ✔ exactly one wins (the
 * solution); ⚠ more than one wins (the child can win without the idea), or the run budget /
 * --timeout stopped it; ✖ none wins (the solution itself loses: content:check rule 9 says why).
 */
export function judgeParsons(level: Level, name: string, options: ShortestOptions): Verdict {
  try {
    const found = findParsonsArrangements(level, {
      ...(options.shouldStop !== undefined && { shouldStop: options.shouldStop }),
      ...(options.getKind !== undefined && { getKind: options.getKind }),
    });
    const runs = `${found.complete ? '' : '≥'}${String(found.runs)}`;
    const head = `${name}  arrangements ${runs}  wins ${String(found.wins)}`;
    const lines = found.examples.map((text) => `win: ${text}`);
    if (!found.complete) lines.push('arrangement search stopped (budget or --timeout)');
    if (found.wins === 0) return { mark: found.complete ? '✖' : '⚠', head, lines };
    if (found.wins > 1) {
      lines.push(`${String(found.wins)} arrangements win: the child can skip the idea`);
      return { mark: '⚠', head, lines };
    }
    return { mark: found.complete ? '✔' : '⚠', head, lines };
  } catch (error) {
    return { mark: '✖', head: `${name}  ${describeError(error)}`, lines: [] };
  }
}
