/**
 * Rule 26 of content-model.md §5 (P4-08, ADR-0024): what a turtle level needs beyond its config
 * schema (rule 1) and the generic run rules (9–16).
 * (a) modes build, bughunt and parsons have a `target` (else every drawing wins);
 * (b) `start` is a vertex of the target, so Măng stands on the target's own lattice (a predict
 *     or creative level without target: any whole paper point, already rule 1);
 * (c) every `turtle_turn_*` of the toolbox pins `DEG`, and pinned angles are in `config.angles`;
 *     a pinned `N` of `turtle_forward` is a whole number 1–9 (an open `N` searches 1–9);
 * (d) every angle in `solution`, `initialWorkspace` and each `drawProgram` is in `config.angles`
 *     (a turn block without `DEG` counts as 30, the dropdown's first option);
 * (e) the solution wins and draws exactly the target (no stray line);
 * (f) predict: the keys of the cards (hand-written or derived from `drawProgram` with
 *     `turtleDrawKey`) are all different, and exactly one is the key of `initialWorkspace`.
 * Warning: angles whose gcd is 30° together with `nhấc bút` (strokes off the target lattice).
 */
import type { Level, ToolboxEntry, WorkspaceJson } from '@codequest/content-schema';
import { runLevel } from '@codequest/engine';
import {
  getGameKind,
  gridPoint,
  pointKey,
  segmentKey,
  targetSegments,
  TURTLE_FORWARD_MAX,
  TURTLE_FORWARD_MIN,
  TURTLE_ANGLES,
  turtleAngles,
  turtleConfigSchema,
  turtleDrawKey,
  type TurtleEvent,
} from '@codequest/games';
import type { Issue } from './rules';

const RULE = 26;
const PEN_UP = 'turtle_pen_up';
const TURN_TYPES: ReadonlySet<string> = new Set(['turtle_turn_left', 'turtle_turn_right']);
/** The first option of the static `DEG` dropdown, which a turn block without `DEG` shows. */
const DEFAULT_DEG = String(TURTLE_ANGLES[0]);
const TARGET_MODES: ReadonlySet<string> = new Set(['build', 'bughunt', 'parsons']);

/** Every serialized block of a workspace, nested inputs and `next` chains included. */
function blocksOf(workspace: WorkspaceJson): Array<Record<string, unknown>> {
  const found: Array<Record<string, unknown>> = [];
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (typeof value !== 'object' || value === null) return;
    const record = value as Record<string, unknown>;
    if (typeof record['type'] === 'string') found.push(record);
    for (const child of Object.values(record)) visit(child);
  };
  visit(workspace.blocks.blocks);
  return found;
}

function fieldOf(fields: unknown, name: string): unknown {
  if (typeof fields !== 'object' || fields === null) return undefined;
  return (fields as Record<string, unknown>)[name];
}

function toolboxIssues(toolbox: readonly ToolboxEntry[], angles: readonly number[]): string[] {
  const problems: string[] = [];
  for (const [index, entry] of toolbox.entries()) {
    const type = typeof entry === 'string' ? entry : entry.type;
    const fields = typeof entry === 'string' ? undefined : entry.fields;
    const where = `toolbox[${String(index)}] ${type}`;
    if (TURN_TYPES.has(type)) {
      const deg = fieldOf(fields, 'DEG');
      if (deg === undefined) problems.push(`${where} must pin DEG (one of ${angles.join(', ')})`);
      else if (!angles.includes(Number(deg))) {
        problems.push(
          `${where} pins DEG ${JSON.stringify(deg)}, not in angles ${angles.join(', ')}`,
        );
      }
    }
    if (type === 'turtle_forward') {
      const n = fieldOf(fields, 'N');
      if (
        n !== undefined &&
        (typeof n !== 'number' ||
          !Number.isInteger(n) ||
          n < TURTLE_FORWARD_MIN ||
          n > TURTLE_FORWARD_MAX)
      ) {
        problems.push(
          `${where} pins N ${JSON.stringify(n)}; use a whole number 1–9 or leave it open`,
        );
      }
    }
  }
  return problems;
}

function angleIssues(name: string, workspace: WorkspaceJson, angles: readonly number[]): string[] {
  return (
    blocksOf(workspace)
      .filter((block) => TURN_TYPES.has(String(block['type'])))
      // A turn block without DEG shows the dropdown's first option, 30.
      .map((block) => Number(fieldOf(block['fields'], 'DEG') ?? DEFAULT_DEG))
      .filter((deg) => !angles.includes(deg))
      .map((deg) => `${name} turns ${String(deg)} degrees, not in angles ${angles.join(', ')}`)
  );
}

/** The segments the solution draws (`line` events, plus a stray `extraLine`) and its end. */
function solutionRun(
  level: Level,
  solution: WorkspaceJson,
): { segments: Set<string>; stray: number; ending: string | null } | string {
  const kind = getGameKind('turtle');
  if (kind === undefined) return 'the turtle game kind is not registered';
  const outcome = runLevel({ kind, level: { ...level, mode: 'build' }, workspace: solution });
  const segments = new Set<string>();
  let stray = 0;
  const isStroke = (event: {
    type: string;
  }): event is Extract<TurtleEvent, { type: 'line' | 'extraLine' }> =>
    event.type === 'line' || event.type === 'extraLine';
  for (const event of outcome.events.filter(isStroke)) {
    if (event.type === 'extraLine') stray++;
    else segments.add(segmentKey(event.from, event.to));
  }
  const ending =
    outcome.result === 'success' ? null : `${outcome.result} ${outcome.reasonCode ?? ''}`.trim();
  return { segments, stray, ending };
}

/** Greatest common divisor. */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Whether the level's angles reach every 30° heading (their gcd is 30°): then the square and the
 * hexagon headings mix, and a turtle walking with the pen up can reach points off the target's
 * lattice (e.g. (2 − √3, 1)), where a stroke overlaps target lines without being one of them
 * (ADR-0024 §3). With the pen down such strokes stop at the first stray line anyway.
 */
function mixesLattices(angles: readonly number[]): boolean {
  return angles.reduce((g, angle) => gcd(g, angle / 30), 12) === 1;
}

function predictIssues(level: Level): string[] {
  const options = level.predict?.options ?? [];
  if (level.initialWorkspace === undefined || options.length === 0) return [];
  const problems: string[] = [];
  let answer: string;
  try {
    answer = turtleDrawKey(level, level.initialWorkspace);
  } catch (error) {
    return [`initialWorkspace gives no key: ${error instanceof Error ? error.message : ''}`];
  }
  const keys: Array<string | null> = options.map((option, index) => {
    if (option.key !== undefined) return option.key;
    if (option.drawProgram === undefined) return null;
    try {
      return turtleDrawKey(level, option.drawProgram);
    } catch (error) {
      const why = error instanceof Error ? error.message : '';
      problems.push(`predict.options[${String(index)}].drawProgram gives no key: ${why}`);
      return null;
    }
  });
  keys.forEach((key, index) => {
    if (key !== null && keys.indexOf(key) !== index) {
      problems.push(
        `predict.options[${String(index)}] draws the same as options[${String(keys.indexOf(key))}]`,
      );
    }
  });
  const matches = keys.filter((key) => key === answer).length;
  if (matches !== 1) {
    problems.push(
      `initialWorkspace matches ${String(matches)} predict options; expected exactly 1`,
    );
  }
  return problems;
}

/** Rule 26 errors and warnings of one schema-valid level (none for other kinds or an invalid config). */
function rule26(path: string, level: Level): { errors: Issue[]; warnings: Issue[] } {
  const none = { errors: [], warnings: [] };
  if (level.kind !== 'turtle') return none;
  const parsed = turtleConfigSchema.safeParse(level.config);
  if (!parsed.success) return none; // rule 1 reports it
  const config = parsed.data;
  const angles = turtleAngles(config);
  const target = targetSegments(config);
  const problems: string[] = [];
  const notes: string[] = [];

  if (target === null && TARGET_MODES.has(level.mode)) {
    problems.push(`mode ${level.mode} needs a config.target`);
  }
  if (target !== null) {
    const start = pointKey(gridPoint(config.start.x, config.start.y));
    const vertices = new Set([...target].flatMap((key) => key.split('|')));
    if (!vertices.has(start)) {
      problems.push(
        `start (${String(config.start.x)}, ${String(config.start.y)}) is not a vertex of the target`,
      );
    }
  }
  problems.push(...toolboxIssues(level.toolbox, angles));
  const programs: Array<[string, WorkspaceJson | undefined]> = [
    ['solution', level.solution],
    ['initialWorkspace', level.initialWorkspace],
    ...(level.predict?.options ?? []).map((option, index): [string, WorkspaceJson | undefined] => [
      `predict.options[${String(index)}].drawProgram`,
      option.drawProgram,
    ]),
  ];
  for (const [name, workspace] of programs) {
    if (workspace !== undefined) problems.push(...angleIssues(name, workspace, angles));
  }
  const usesPenUp =
    level.toolbox.some((entry) => (typeof entry === 'string' ? entry : entry.type) === PEN_UP) ||
    programs.some(
      ([, workspace]) =>
        workspace !== undefined && blocksOf(workspace).some((block) => block['type'] === PEN_UP),
    );
  // Free drawing (creative) has no target and no answer to compare: nothing to warn about.
  if (usesPenUp && mixesLattices(angles) && level.mode !== 'creative') {
    notes.push(
      `angles ${angles.join(', ')} reach every 30° heading and the pen can go up: strokes can ` +
        'start off the target lattice and overlap its lines without being them (ADR-0024 §3)',
    );
  }
  if (target !== null && level.solution !== undefined) {
    const drawn = solutionRun(level, level.solution);
    if (typeof drawn === 'string') problems.push(drawn);
    else {
      const missing = [...target].filter((key) => !drawn.segments.has(key)).length;
      const extra = [...drawn.segments].filter((key) => !target.has(key)).length + drawn.stray;
      if (missing > 0 || extra > 0) {
        problems.push(
          `solution must draw exactly the target (${String(missing)} missing, ${String(extra)} extra)`,
        );
      }
      if (drawn.ending !== null) problems.push(`solution must win, but it ends ${drawn.ending}`);
    }
  }
  if (level.mode === 'predict') problems.push(...predictIssues(level));
  const issue = (message: string): Issue => ({ path, rule: RULE, message });
  return { errors: problems.map(issue), warnings: notes.map(issue) };
}

/** Rule 26 errors of one schema-valid level (none for other kinds or an invalid config). */
export function checkTurtleLevel(path: string, level: Level): Issue[] {
  return rule26(path, level).errors;
}

/** Rule 26 warnings (printed, never failing): 30° headings mixed with the pen going up. */
export function turtleLevelWarnings(path: string, level: Level): Issue[] {
  return rule26(path, level).warnings;
}

// ---- Authoring rule T1 (content-authoring.md §2.3, ADR-0024): stray-line traps -----------------

/**
 * A program written short, as in curriculum.md §6.4: `F<n>` tiến, `R<d>` / `L<d>` rẽ, `U` nhấc
 * bút, `D` hạ bút, `REP<n>[ … ]` lặp, `P` làm phép (the level's first spell, whose body is
 * `spell`).
 */
export interface ShortProgram {
  main: string;
  spell?: string;
}

/**
 * T1: every turtle `build` / `bughunt` level of a world declares at least one likely wrong program
 * that draws a stray line before it is done (`EXTRA_LINE`), so the stop-at-once rule is felt.
 * Declared here, by level id; `turtleT1Warnings` checks them and the W9 tests run them.
 */
export const TURTLE_T1: ReadonlyMap<string, readonly ShortProgram[]> = new Map(
  Object.entries({
    'w09-l01': [{ main: 'F6' }],
    'w09-l03': [{ main: 'REP2[F1 R90 F3 R90]' }],
    'w09-l05': [{ main: 'REP3[F1 R90 F1 L90]' }],
    'w09-l06': [{ main: 'REP6[F2 R120]' }],
    'w09-l07': [{ main: 'REP4[F2 R90] L60 F2 R90 F2' }],
    'w09-l08': [{ main: 'REP3[F1 F1]' }],
    'w09-l10': [{ main: 'REP3[REP4[F2 R90 F2]]' }],
    'w09-l12': [{ main: 'REP3[REP3[F1 L120] F2 D]' }],
    'w09-l13': [{ main: 'REP6[REP4[F2 R90 R60]]' }],
    'w09-l15': [{ main: 'REP4[REP2[F1 U F1 D R90]]' }],
    'w09-l16': [{ main: 'REP3[P R60] R90 F3 P', spell: 'REP2[F2 R60 F2 R120]' }],
    'w09-l17': [{ main: 'REP3[F2 REP2[L60 F1 R120 F1] L60 F2 L60]' }],
    'w09-l18': [{ main: 'REP3[REP4[F1 L90] F1 L90 F1]' }],
    'w09-boss': [{ main: 'REP6[F1 F1 REP3[F1 L120] R180 F2 R120]' }],
  }),
);

type ShortBlock = Record<string, unknown>;

/** Serialized blocks of a short program; `spellId` names the spell `P` calls. */
function shortBlocks(source: string, spellId: string): ShortBlock[] {
  const tokens = source.match(/REP\d+\[|\]|[FRL]\d+|[UDP]/g) ?? [];
  let at = 0;
  let next = 0;
  const id = (prefix: string): string => `${prefix}${String(++next)}`;
  const sequence = (): ShortBlock[] => {
    const blocks: ShortBlock[] = [];
    while (at < tokens.length && tokens[at] !== ']') {
      const token = tokens[at++] ?? '';
      const n = Number(token.replace(/\D/g, ''));
      if (token.startsWith('REP')) {
        const body = sequence();
        at++; // ']'
        const first = chained(body);
        blocks.push({
          type: 'cq_repeat',
          id: id('loop'),
          fields: { TIMES: n },
          ...(first !== undefined && { inputs: { DO: { block: first } } }),
        });
      } else if (token.startsWith('F')) {
        blocks.push({ type: 'turtle_forward', id: id('f'), fields: { N: n } });
      } else if (token.startsWith('R') || token.startsWith('L')) {
        const type = token.startsWith('R') ? 'turtle_turn_right' : 'turtle_turn_left';
        blocks.push({ type, id: id('t'), fields: { DEG: String(n) } });
      } else if (token === 'P') {
        blocks.push({ type: 'cq_proc_call', id: id('call'), fields: { PROC: spellId } });
      } else {
        blocks.push({ type: token === 'U' ? 'turtle_pen_up' : 'turtle_pen_down', id: id('p') });
      }
    }
    return blocks;
  };
  return sequence();
}

/** Blocks chained through `next`; undefined for none. */
function chained(blocks: readonly ShortBlock[]): ShortBlock | undefined {
  let first: ShortBlock | undefined;
  for (const block of [...blocks].reverse()) {
    first = first === undefined ? block : { ...block, next: { block: first } };
  }
  return first;
}

/** The workspace of a short program on `level` (its first spell, if `program.spell`). */
export function shortProgramWorkspace(level: Level, program: ShortProgram): WorkspaceJson {
  const spellId = level.procedures?.[0]?.id ?? 'spell';
  const main = chained(shortBlocks(program.main, spellId));
  const start = {
    type: 'cq_start',
    id: 'start',
    ...(main !== undefined && { next: { block: main } }),
  };
  const blocks: ShortBlock[] = [start];
  if (program.spell !== undefined) {
    const body = chained(
      shortBlocks(program.spell, spellId).map((block) => ({
        ...block,
        id: `s${String(block['id'])}`,
      })),
    );
    blocks.push({
      type: 'cq_proc_def',
      id: 'def',
      fields: { PROC: spellId },
      ...(body !== undefined && { inputs: { BODY: { block: body } } }),
    });
  }
  return { blocks: { languageVersion: 0, blocks: blocks as WorkspaceJson['blocks']['blocks'] } };
}

const T1_MODES: ReadonlySet<string> = new Set(['build', 'bughunt']);

/**
 * T1 warnings (rule 24, never errors) of one schema-valid level in a world (not a draft): a
 * turtle build / bughunt level needs a `TURTLE_T1` entry, and each of its programs must stop on
 * a stray line (`EXTRA_LINE`).
 */
export function turtleT1Warnings(path: string, level: Level): Issue[] {
  if (level.kind !== 'turtle' || !T1_MODES.has(level.mode) || level.retired === true) return [];
  const kind = getGameKind('turtle');
  const programs = TURTLE_T1.get(level.id);
  const warn = (message: string): Issue => ({ path, rule: 24, message: `(T1) ${message}` });
  if (kind === undefined) return [];
  if (programs === undefined || programs.length === 0) {
    return [warn('declare a likely wrong program that draws a stray line (TURTLE_T1)')];
  }
  return programs.flatMap((program) => {
    const outcome = runLevel({
      kind,
      level: { ...level, mode: 'build' },
      workspace: shortProgramWorkspace(level, program),
    });
    return outcome.reasonCode === 'EXTRA_LINE'
      ? []
      : [
          warn(
            `"${program.main}" ends ${outcome.result} ${outcome.reasonCode ?? ''}, not EXTRA_LINE`,
          ),
        ];
  });
}
