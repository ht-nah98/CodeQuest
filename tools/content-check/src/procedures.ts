/**
 * Rule 25 (spells, ADR-0023 §5): static checks of `procedures` and the `cq_proc_*` blocks of one
 * level; no search. (h) (spell id = box id) is the level schema's (rule 1) and (i) (effective
 * loop depth ≤ `maxLoopDepth`) is rule 20's, which reads the effective depth since P4-02.
 * (f) and (g) are warnings.
 */
import {
  variableMax,
  type Level,
  type ToolboxEntry,
  type WorkspaceJson,
} from '@codequest/content-schema';
import {
  CQ_PROC_CALL,
  CQ_PROC_CALL_N,
  CQ_PROC_DEF,
  CQ_PROC_DEF_N,
  CQ_REPEAT,
  CQ_REPEAT_VAR,
  PROC_CALL_TYPES,
  PROC_DEF_TYPES,
  VARIABLE_BLOCKS,
  workspaceSpellIssue,
} from '@codequest/engine';
import { countWords, MAX_CALL_NUMBERS } from '@codequest/validator';
import type { Issue } from './rules';

export const PROCEDURE_RULE = 25;

/** First world whose levels may use the spell blocks (curriculum.md §6.3). */
const FIRST_SPELL_WORLD = 8;
/** A spell name is short: "bậc thang" (ADR-0023 §1). */
const MAX_SPELL_NAME_WORDS = 3;
/** A spell pays off when it is cast at least twice (content-authoring.md, R5). */
const MIN_CASTS = 2;

const SPELL_TYPES: ReadonlySet<string> = new Set([...PROC_DEF_TYPES, ...PROC_CALL_TYPES]);
const BOXED_TYPES: ReadonlySet<string> = new Set([CQ_PROC_DEF_N, CQ_PROC_CALL_N]);
/** Box blocks other than `lặp [hộp] lần`: v1 lets only that one read a spell's box. */
const NON_REPEAT_BOX_BLOCKS: ReadonlySet<string> = new Set(
  VARIABLE_BLOCKS.map((spec) => spec.type).filter((type) => type !== CQ_REPEAT_VAR),
);

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A block of a toolbox entry or a workspace, with its fields and where it was found. */
interface Found {
  type: string;
  fields: JsonRecord;
  where: string;
}

function workspaceBlocks(workspace: WorkspaceJson | undefined, where: string): Found[] {
  const out: Found[] = [];
  const walk = (block: unknown): void => {
    if (!isRecord(block)) return;
    out.push({
      type: String(block['type']),
      fields: isRecord(block['fields']) ? block['fields'] : {},
      where,
    });
    if (isRecord(block['inputs'])) {
      for (const input of Object.values(block['inputs'])) if (isRecord(input)) walk(input['block']);
    }
    if (isRecord(block['next'])) walk(block['next']['block']);
  };
  for (const top of workspace?.blocks.blocks ?? []) walk(top);
  return out;
}

/**
 * How many times each spell is cast by a program, at least: a `làm phép` inside `lặp N lần` with
 * N ≥ 2 counts as 2. Other loops (`lặp đến khi`, `lặp [hộp] lần`) may run once, so they count 1.
 */
function castCounts(workspace: WorkspaceJson): Map<string, number> {
  const casts = new Map<string, number>();
  const walk = (block: unknown, repeated: boolean): void => {
    if (!isRecord(block)) return;
    const type = String(block['type']);
    const fields = isRecord(block['fields']) ? block['fields'] : {};
    const id = fields['PROC'];
    if ((type === CQ_PROC_CALL || type === CQ_PROC_CALL_N) && typeof id === 'string') {
      casts.set(id, (casts.get(id) ?? 0) + (repeated ? 2 : 1));
    }
    const inner = repeated || (type === CQ_REPEAT && Number(fields['TIMES']) >= 2);
    if (isRecord(block['inputs'])) {
      for (const input of Object.values(block['inputs']))
        if (isRecord(input)) walk(input['block'], inner);
    }
    if (isRecord(block['next'])) walk(block['next']['block'], repeated);
  };
  for (const top of workspace.blocks.blocks) walk(top, false);
  return casts;
}

const NONE: ReadonlySet<string> = new Set();
/** Spell errors of a start the child still has to finish. */
const UNFINISHED: ReadonlySet<string> = new Set(['EMPTY_SPELL', 'NO_SPELL']);

/**
 * `workspaceSpellIssue`, or null when the program uses a block type no kind registers (rules 9
 * and 11 report that); any other failure is a bug and is thrown.
 */
function staticSpellIssue(workspace: WorkspaceJson, level: Level): string | null {
  try {
    return workspaceSpellIssue(workspace, level.procedures);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid block definition')) return null;
    throw error;
  }
}

function toolboxBlocks(toolbox: readonly ToolboxEntry[]): Found[] {
  return toolbox.map((entry) =>
    typeof entry === 'string'
      ? { type: entry, fields: {}, where: 'toolbox' }
      : { type: entry.type, fields: entry.fields ?? {}, where: 'toolbox' },
  );
}

/** The world number of a level (`w08-…` → 8), or null for drafts (`_sandbox`). */
function worldNumber(level: Level): number | null {
  const match = /^w(\d{2})-/.exec(level.worldId);
  return match === null ? null : Number(match[1]);
}

/** Rule 25 errors and warnings of one schema-valid level. */
export function procedureIssues(
  path: string,
  level: Level,
  isDraft: boolean,
): { errors: Issue[]; warnings: Issue[] } {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const error = (message: string): void => {
    errors.push({ path, rule: PROCEDURE_RULE, message });
  };
  const warn = (message: string): void => {
    warnings.push({ path, rule: PROCEDURE_RULE, message });
  };
  const blocks = [
    ...toolboxBlocks(level.toolbox),
    ...workspaceBlocks(level.solution, 'solution'),
    ...workspaceBlocks(level.initialWorkspace, 'initialWorkspace'),
  ];
  const spellBlocks = blocks.filter((block) => SPELL_TYPES.has(block.type));
  const spells = new Map((level.procedures ?? []).map((procedure) => [procedure.id, procedure]));

  // (d) Spells are taught from world 8 on.
  const world = worldNumber(level);
  if (!isDraft && spellBlocks.length > 0 && world !== null && world < FIRST_SPELL_WORLD) {
    error(
      `(d) spell blocks belong to world ${String(FIRST_SPELL_WORLD)} or later, not world ${String(world)}`,
    );
  }
  for (const block of spellBlocks) {
    const id = block.fields['PROC'];
    const boxedBlock = BOXED_TYPES.has(block.type);
    // (a) An unpinned toolbox entry needs a declared spell it can name (one with a box for the
    // box blocks, one without for the plain ones).
    if (id === undefined && block.where === 'toolbox') {
      const fits = [...spells.values()].some((spell) => (spell.param !== undefined) === boxedBlock);
      if (!fits) {
        const kind = boxedBlock ? 'with a box (param)' : 'without a box';
        error(`(a) toolbox "${block.type}" names no spell: no spell ${kind} is declared`);
      }
      continue;
    }
    const spell = typeof id === 'string' ? spells.get(id) : undefined;
    if (spell === undefined) {
      error(
        `(a) ${block.where} "${block.type}" names spell ${JSON.stringify(id)}, which is not declared`,
      );
      continue;
    }
    // (b) The box blocks for spells with a box, the plain ones for the others.
    if (boxedBlock !== (spell.param !== undefined)) {
      const want =
        spell.param === undefined ? 'cq_proc_def / cq_proc_call' : 'cq_proc_def_n / cq_proc_call_n';
      error(`(b) ${block.where} "${block.type}" for spell "${spell.id}": use ${want}`);
    }
  }
  // (e) `làm phép … với` pins its number in the toolbox, unless the search can try every
  // number of its box (max ≤ 9, like a `field_number`); 0…max itself is rule 23 (k).
  for (const block of spellBlocks) {
    if (block.where !== 'toolbox' || block.type !== CQ_PROC_CALL_N || 'NUM' in block.fields) {
      continue;
    }
    const id = block.fields['PROC'];
    const named = typeof id === 'string' ? [spells.get(id)] : [...spells.values()];
    const wide = named.find(
      (spell) => spell?.param !== undefined && variableMax(spell.param) > MAX_CALL_NUMBERS,
    );
    if (wide !== undefined) {
      error(
        `(e) toolbox "${CQ_PROC_CALL_N}" must pin NUM: box "${wide.param?.id ?? ''}" goes over ${String(MAX_CALL_NUMBERS)}, more numbers than the par search tries`,
      );
    }
  }
  // (f) Short spell names.
  for (const spell of spells.values()) {
    const words = countWords(spell.name);
    if (words > MAX_SPELL_NAME_WORDS) {
      warn(
        `(f) spell name "${spell.name}" has ${String(words)} words > ${String(MAX_SPELL_NAME_WORDS)}`,
      );
    }
  }
  // (j) The variable blocks other than `lặp [hộp] lần` never name a spell's box.
  const spellBoxes = new Set(
    (level.procedures ?? []).flatMap((procedure) =>
      procedure.param === undefined ? [] : [procedure.param.id],
    ),
  );
  for (const block of blocks) {
    const box = block.fields['VAR'];
    if (NON_REPEAT_BOX_BLOCKS.has(block.type) && typeof box === 'string' && spellBoxes.has(box)) {
      error(`(j) ${block.where} "${block.type}" uses spell box "${box}"; only "lặp [hộp] lần" may`);
    }
  }
  // (c) The given programs pass the engine's static spell checks: the solution and a predict
  // level's program fully; a build or parsons start may still be unfinished (an empty or
  // missing `dạy phép` to fill: EMPTY_SPELL, NO_SPELL); a bughunt's may be the bug itself.
  const programs: Array<[string, WorkspaceJson | undefined, ReadonlySet<string>]> = [
    ['solution', level.solution, NONE],
    [
      'initialWorkspace',
      level.mode === 'bughunt' ? undefined : level.initialWorkspace,
      level.mode === 'predict' ? NONE : UNFINISHED,
    ],
  ];
  for (const [where, workspace, allowed] of programs) {
    if (workspace === undefined || (spellBlocks.length === 0 && spells.size === 0)) continue;
    const issue = staticSpellIssue(workspace, level);
    if (issue !== null && !allowed.has(issue)) error(`(c) ${where} has ${issue}`);
  }
  // (g) Every spell of the solution is cast at least twice. Not in predict levels: their idea may
  // be the spell taught and never cast ("dạy mà không làm", W8 l02).
  const read = level.mode === 'predict' ? undefined : level.solution;
  const where = 'solution';
  if (read !== undefined && level.mode !== 'creative') {
    const casts = castCounts(read);
    for (const block of workspaceBlocks(read, where)) {
      const id = block.fields['PROC'];
      if ((block.type !== CQ_PROC_DEF && block.type !== CQ_PROC_DEF_N) || typeof id !== 'string') {
        continue;
      }
      const count = casts.get(id) ?? 0;
      if (count < MIN_CASTS) {
        warn(
          `(g) ${where} casts spell "${id}" ${String(count)} times < ${String(MIN_CASTS)}: it saves nothing`,
        );
      }
    }
  }
  return { errors, warnings };
}
