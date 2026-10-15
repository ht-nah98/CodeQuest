/**
 * Rule 24 (warnings only): the difficulty-pass rules M1–M3 of conventions/content-authoring.md §2.2
 * (roadmap/difficulty-pass.md §3.2). M1: a maze build/bughunt level from World 2 has a real
 * junction and a real dead end (from World 4, 2 junctions). M2: a solution shape (the
 * "Lặp công thức" column of difficulty-pass.md §1, numbers dropped) is used at most twice in a
 * world, and the second time needs another mode or another kind of map. M3: the maps of a
 * multi-map maze level with a question differ in shape, not only in length.
 * Guided levels (block intros) and World 1 are exempt; why: content-authoring.md §2.2.
 */
import type { Level, World } from '@codequest/content-schema';
import { CONDITION_BLOCK_TYPES } from '@codequest/engine';
import {
  blockTypesOf,
  programFromWorkspace,
  type Condition,
  type Program,
} from '@codequest/validator';
import type { Issue } from './rules';

export const DIFFICULTY_RULE = 24;

/**
 * Approved PRIMM ladders (difficulty-pass.md §3.2 M2): their levels may share one shape, and
 * never get an M2 warning themselves. They still count for any other level with that shape.
 */
export const APPROVED_LADDERS: readonly (readonly string[])[] = [
  // W4 decision D5 (curriculum.md §5.5): predict → parsons → build → boss on one program.
  ['w04-l13', 'w04-l14', 'w04-l16', 'w04-boss'],
];

/** M1/M2 start in World 2; M1 asks for 2 junctions from World 4. */
const FIRST_CHECKED_WORLD = 2;
const TWO_JUNCTIONS_FROM_WORLD = 4;
const MAX_SHAPE_USES = 2;

/** `name(FIELD=value)` without the `<kind>_` prefix; numbers (lặp N, tiến N ô) are dropped. */
function blockName(type: string, fields: Readonly<Record<string, unknown>> | undefined): string {
  const name = type.replace(/^[a-z0-9]+_/, '');
  const kept = Object.entries(fields ?? {})
    .filter(([, value]) => typeof value !== 'number')
    .map(([key, value]) => `${key}=${String(value)}`);
  return kept.length === 0 ? name : `${name}(${kept.join(' ')})`;
}

const conditionName = (condition: Condition | null): string =>
  condition === null ? '?' : blockName(condition.block, condition.fields);

/**
 * Shape of a program: block names in order, numbers dropped, and a run of the same plain block
 * written once with `+` (`đi×2` and `đi×3` are the same shape, difficulty-pass.md §1.1).
 */
export function programShape(program: Program): string {
  const parts: string[] = [];
  for (const statement of program) {
    let part: string;
    if ('repeat' in statement) part = `repeat [${programShape(statement.body)}]`;
    else if ('repeatVar' in statement)
      part = `repeat ${statement.repeatVar} [${programShape(statement.body)}]`;
    else if ('until' in statement)
      part = `until ${conditionName(statement.until)} [${programShape(statement.body)}]`;
    else if ('if' in statement) {
      part = `if ${conditionName(statement.if)} [${programShape(statement.then)}]`;
      if (statement.else !== undefined) part += ` else [${programShape(statement.else)}]`;
    } else part = blockName(statement.block, statement.fields);
    const last = parts.length - 1;
    if (!part.includes('[') && (parts[last] === part || parts[last] === `${part}+`)) {
      parts[last] = `${part}+`;
    } else parts.push(part);
  }
  return parts.join(', ');
}

/**
 * The program a level asks the child to make or read: `initialWorkspace` for predict, the
 * (fixed) `solution` otherwise. Null for creative levels and programs the search cannot read.
 */
export function levelShape(level: Level): string | null {
  if (level.mode === 'creative' || level.stage === 'creative') return null;
  const workspace = level.mode === 'predict' ? level.initialWorkspace : level.solution;
  if (workspace === undefined) return null;
  const program = programFromWorkspace(workspace);
  if (program === null || program.length === 0) return null;
  // A mirror image is the same recipe: "hỏi phải, rẽ phải" = "hỏi trái, rẽ trái" (M2).
  const shape = programShape(program);
  const mirrored = mirrorShape(shape);
  return `${level.kind}: ${mirrored < shape ? mirrored : shape}`;
}

/** Swaps left and right everywhere in a shape (`LEFT` ↔ `RIGHT`, `turn_left` ↔ `turn_right`). */
export function mirrorShape(shape: string): string {
  return shape.replace(/LEFT|RIGHT|turn_left|turn_right/g, (side) =>
    side === 'LEFT'
      ? 'RIGHT'
      : side === 'RIGHT'
        ? 'LEFT'
        : side === 'turn_left'
          ? 'turn_right'
          : 'turn_left',
  );
}

/**
 * Junction = open cell with ≥ 3 open neighbours, dead end = 1; `S` and `G` are not counted.
 * With `reachable`, only those cells count (`reachableCells`: what the toolbox can get to).
 */
export function mazeJunctions(
  map: readonly string[],
  reachable?: ReadonlySet<string>,
): { junctions: number; deadEnds: number } {
  const open = (row: number, col: number): boolean => (map[row]?.[col] ?? '#') !== '#';
  let junctions = 0;
  let deadEnds = 0;
  map.forEach((line, row) => {
    for (let col = 0; col < line.length; col++) {
      const tile = line[col];
      if (tile === '#' || tile === 'S' || tile === 'G') continue;
      if (reachable !== undefined && !reachable.has(`${String(row)},${String(col)}`)) continue;
      const exits = [
        open(row - 1, col),
        open(row + 1, col),
        open(row, col - 1),
        open(row, col + 1),
      ].filter(Boolean).length;
      if (exits >= 3) junctions++;
      if (exits === 1) deadEnds++;
    }
  });
  return { junctions, deadEnds };
}

const STEPS: Readonly<Record<string, readonly [number, number]>> = {
  N: [-1, 0],
  E: [0, 1],
  S: [1, 0],
  W: [0, -1],
};
const CLOCKWISE = ['N', 'E', 'S', 'W'];

/**
 * Shape of the road from `S` to `G` (M3), lengths left out: along a shortest road, each cell
 * where Măng turns (`L`, `R`, `B` for a U-turn) or passes a side branch, as `<turn>:<branches>`,
 * branches seen from where Măng arrives facing (`a` ahead, `l` left, `r` right, `b` behind).
 * `"l R:a"` = a branch on the left, then a right turn where the road also goes on ahead. Null
 * when `G` cannot be reached. Ties break by N, E, S, W, so it is deterministic.
 */
export function mazeRoadShape(map: readonly string[], startDir: string): string | null {
  const find = (tile: string): [number, number] | null => {
    for (const [row, line] of map.entries()) {
      const col = line.indexOf(tile);
      if (col >= 0) return [row, col];
    }
    return null;
  };
  const start = find('S');
  const goal = find('G');
  if (start === null || goal === null) return null;
  const key = ([row, col]: readonly [number, number]): string => `${String(row)},${String(col)}`;
  const parent = new Map<string, [number, number] | null>([[key(start), null]]);
  const queue: Array<[number, number]> = [start];
  while (queue.length > 0) {
    const cell = queue.shift();
    if (cell === undefined || key(cell) === key(goal)) break;
    for (const dir of CLOCKWISE) {
      const [dr, dc] = STEPS[dir] ?? [0, 0];
      const next: [number, number] = [cell[0] + dr, cell[1] + dc];
      if ((map[next[0]]?.[next[1]] ?? '#') === '#' || parent.has(key(next))) continue;
      parent.set(key(next), cell);
      queue.push(next);
    }
  }
  if (!parent.has(key(goal))) return null;
  const path: Array<[number, number]> = [];
  for (
    let cell: [number, number] | null = goal;
    cell !== null;
    cell = parent.get(key(cell)) ?? null
  )
    path.unshift(cell);
  const headingOf = ([r0, c0]: [number, number], [r1, c1]: [number, number]): number =>
    CLOCKWISE.findIndex((dir) => {
      const [dr, dc] = STEPS[dir] ?? [0, 0];
      return r0 + dr === r1 && c0 + dc === c1;
    });
  let facing = CLOCKWISE.indexOf(startDir);
  const tokens: string[] = [];
  for (let index = 0; index + 1 < path.length; index++) {
    const cell = path[index] ?? start;
    const heading = headingOf(cell, path[index + 1] ?? goal);
    const turn = ['', 'R', 'B', 'L'][(heading - facing + 4) % 4] ?? '';
    const previous = index === 0 ? null : (path[index - 1] ?? null);
    const branches = CLOCKWISE.map((dir, side) => {
      const [dr, dc] = STEPS[dir] ?? [0, 0];
      const next: [number, number] = [cell[0] + dr, cell[1] + dc];
      const onRoad = side === heading || (previous !== null && key(previous) === key(next));
      if (onRoad || (map[next[0]]?.[next[1]] ?? '#') === '#') return '';
      return ['a', 'r', 'b', 'l'][(side - facing + 4) % 4] ?? '';
    })
      .filter((side) => side !== '')
      .sort()
      .join('');
    if (turn !== '' && branches !== '') tokens.push(`${turn}:${branches}`);
    else if (turn !== '' || branches !== '') tokens.push(turn + branches);
    facing = heading;
  }
  return tokens.join(' ');
}

/**
 * Cells Măng can get to: every open cell joined to `S`, or only the straight line ahead of `S`
 * when the level has no turn block (W5 `l05`: a dead end beside the road is never reached).
 */
export function reachableCells(
  map: readonly string[],
  startDir: string,
  canTurn: boolean,
): Set<string> {
  const open = (row: number, col: number): boolean => (map[row]?.[col] ?? '#') !== '#';
  const startRow = map.findIndex((line) => line.includes('S'));
  const start: [number, number] = [startRow, map[startRow]?.indexOf('S') ?? -1];
  const key = ([row, col]: readonly [number, number]): string => `${String(row)},${String(col)}`;
  const seen = new Set<string>([key(start)]);
  if (!canTurn) {
    const [dr, dc] = STEPS[startDir] ?? [0, 0];
    for (let [row, col] = [start[0] + dr, start[1] + dc]; open(row, col); row += dr, col += dc)
      seen.add(key([row, col]));
    return seen;
  }
  const queue: Array<[number, number]> = [start];
  for (let cell = queue.shift(); cell !== undefined; cell = queue.shift()) {
    for (const [dr, dc] of Object.values(STEPS)) {
      const next: [number, number] = [cell[0] + dr, cell[1] + dc];
      if (!open(next[0], next[1]) || seen.has(key(next))) continue;
      seen.add(key(next));
      queue.push(next);
    }
  }
  return seen;
}

const TURN_BLOCKS = new Set(['maze_turn_left', 'maze_turn_right']);

/** Whether the child can turn in this level: a turn block in the toolbox or the given programs. */
function canTurn(level: Level): boolean {
  const types = new Set([
    ...level.toolbox.map((entry) => (typeof entry === 'string' ? entry : entry.type)),
    ...(level.solution === undefined ? [] : blockTypesOf(level.solution)),
    ...(level.initialWorkspace === undefined ? [] : blockTypesOf(level.initialWorkspace)),
  ]);
  return [...types].some((type) => TURN_BLOCKS.has(type));
}

interface MazeMap {
  map: string[];
  startDir: string;
}

function mazeMaps(level: Level): MazeMap[] {
  if (level.kind !== 'maze') return [];
  return [level.config, ...(level.variants ?? [])].filter(
    (config): config is MazeMap =>
      typeof config === 'object' &&
      config !== null &&
      Array.isArray((config as { map?: unknown }).map) &&
      typeof (config as { startDir?: unknown }).startDir === 'string',
  );
}

/**
 * What M2 calls "the kind of map": number of maps, items to pick, and how many maps are real
 * mazes (a junction and a dead end). One more dead end alone is not another kind of map.
 */
function mapProfile(level: Level): string {
  const configs = [level.config, ...(level.variants ?? [])];
  const items =
    level.starGoals !== undefined ||
    configs.some((config) => {
      const goal = (config as { goal?: { collectAll?: boolean; items?: unknown[] } }).goal;
      return goal?.collectAll === true || (goal?.items?.length ?? 0) > 0;
    });
  const real = mazeMaps(level)
    .map(({ map }) => mazeJunctions(map))
    .filter(({ junctions, deadEnds }) => junctions > 0 && deadEnds > 0).length;
  return `${String(configs.length)} maps${items ? ', items' : ''}${real > 0 ? `, ${String(real)} real mazes` : ''}`;
}

const asksQuestion = (level: Level): boolean =>
  [...(level.solution === undefined ? [] : blockTypesOf(level.solution))].some((type) =>
    CONDITION_BLOCK_TYPES.includes(type),
  );

interface DifficultyInput {
  /** Worlds in play order; `levels` are the live levels in `levelIds` order. */
  worlds: Array<{ world: World; levels: Level[] }>;
  pathOf: (levelId: string) => string;
}

export function checkDifficulty({ worlds, pathOf }: DifficultyInput): Issue[] {
  const warnings: Issue[] = [];
  const warn = (level: Level, message: string): void => {
    warnings.push({ path: pathOf(level.id), rule: DIFFICULTY_RULE, message });
  };
  const ladderOf = (id: string): readonly string[] | undefined =>
    APPROVED_LADDERS.find((ladder) => ladder.includes(id));

  for (const { world, levels } of worlds) {
    if (world.order < FIRST_CHECKED_WORLD) continue;
    const seen = new Map<string, Level[]>();
    for (const level of levels) {
      const graded = level.stage !== 'guided';

      // M1: a real maze has junctions and dead ends a wrong program can walk into.
      if (graded && level.kind === 'maze' && (level.mode === 'build' || level.mode === 'bughunt')) {
        const need = world.order >= TWO_JUNCTIONS_FROM_WORLD ? 2 : 1;
        const turns = canTurn(level);
        const counts = mazeMaps(level).map(({ map, startDir }) =>
          mazeJunctions(map, reachableCells(map, startDir, turns)),
        );
        const best = counts.reduce(
          (most, next) => (next.junctions > most.junctions ? next : most),
          {
            junctions: 0,
            deadEnds: 0,
          },
        );
        const ok = counts.some((counted) => counted.junctions >= need && counted.deadEnds >= 1);
        if (!ok) {
          warn(
            level,
            `(M1) no map has ${String(need)} junction${need > 1 ? 's' : ''} and a dead end ` +
              `Măng can reach (best: ${String(best.junctions)} junctions, ${String(best.deadEnds)} dead ends); draw a real maze`,
          );
        }
      }

      // M3: maps of a question level differ in shape, not only in length.
      const maps = mazeMaps(level);
      if (graded && maps.length > 1 && asksQuestion(level)) {
        const signatures = maps.map(({ map, startDir }) => mazeRoadShape(map, startDir) ?? '?');
        signatures.forEach((signature, index) => {
          const first = signatures.indexOf(signature);
          if (first < index) {
            warn(
              level,
              `(M3) maps ${String(first + 1)} and ${String(index + 1)} differ only in length ` +
                `(same road "${signature}"); move a turn or a dead end`,
            );
          }
        });
      }

      // M2: a solution shape at most twice per world; the second time another mode or map.
      // Guided levels count (and can repeat), they are only exempt from M1 and M3.
      const shape = levelShape(level);
      if (shape === null) continue;
      const before = seen.get(shape) ?? [];
      seen.set(shape, [...before, level]);
      if (before.length === 0 || ladderOf(level.id) !== undefined) continue;
      const others = before.map((other) => other.id).join(', ');
      if (before.length >= MAX_SHAPE_USES) {
        warn(
          level,
          `(M2) solution shape "${shape}" is already used ${String(before.length)} times in this world ` +
            `(${others}); max ${String(MAX_SHAPE_USES)}`,
        );
        continue;
      }
      const [first] = before;
      if (
        first !== undefined &&
        first.mode === level.mode &&
        mapProfile(first) === mapProfile(level)
      ) {
        warn(
          level,
          `(M2) solution shape "${shape}" repeats ${first.id} with the same mode (${level.mode}) ` +
            `and the same kind of map (${mapProfile(level)}); change the mode or the map`,
        );
      }
    }
  }
  return warnings;
}
