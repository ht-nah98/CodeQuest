/**
 * Rule 23 (variables, P3-09, ADR-0022 §5, written there as "luật 22" before P3-08 took that
 * number): the variable blocks and `variables` / `countGoal` of one level, plus the map counts of
 * authoring rule R4 (content-authoring.md §2.2). Sub-rules (a)–(k) and R4 lead the message.
 * Errors break content:check; (d), (f), (h) and (i) are warnings.
 */
import {
  variableMax,
  type Level,
  type LevelVariable,
  type ToolboxEntry,
  type WorkspaceJson,
} from '@codequest/content-schema';
import {
  CQ_REPEAT_VAR,
  CQ_VAR_ADD,
  CQ_VAR_COMPARE,
  CQ_VAR_SET,
  splitVarSuffix,
  VARIABLE_BLOCKS,
  varSuffix,
} from '@codequest/engine';
import type { RuleIssue } from './issue';

/** The rule number of the variable rules. */
export const VARIABLE_RULE = 23;

/** First world whose levels may use the variable blocks (curriculum.md §6.2). */
const FIRST_VARIABLE_WORLD = 7;
/** A box name is short: "số măng" (ADR-0022 §1). */
const MAX_VARIABLE_NAME_WORDS = 3;

const VARIABLE_TYPES: ReadonlySet<string> = new Set(VARIABLE_BLOCKS.map((spec) => spec.type));
/** Fields a toolbox entry must pin so the par search stays small (ADR-0022 §4 (a)). */
const PINNED_FIELDS: Readonly<Record<string, readonly string[]>> = {
  [CQ_VAR_SET]: ['VAR', 'NUM'],
  [CQ_VAR_ADD]: ['VAR', 'NUM'],
  [CQ_VAR_COMPARE]: ['VAR', 'OP', 'NUM'],
  [CQ_REPEAT_VAR]: ['VAR'],
};
/** Blocks whose box steers the program (R4 "hộp lái chương trình"). */
const STEERING_TYPES: ReadonlySet<string> = new Set([CQ_REPEAT_VAR, CQ_VAR_COMPARE]);

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A variable block found in a toolbox entry or a workspace, with where it was. */
interface VarBlock {
  type: string;
  fields: JsonRecord;
  where: string;
  /** Workspace blocks only: box ids of the `cq_repeat_var` loops around it. */
  loops: string[];
}

function fieldsOf(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

/** Every variable block of a workspace JSON (loose stacks included), with its enclosing loops. */
function workspaceVarBlocks(workspace: WorkspaceJson | undefined, where: string): VarBlock[] {
  const out: VarBlock[] = [];
  const walk = (block: unknown, loops: string[]): void => {
    if (!isRecord(block)) return;
    const type = String(block['type']);
    const fields = fieldsOf(block['fields']);
    if (VARIABLE_TYPES.has(type)) out.push({ type, fields, where, loops });
    const inner = type === CQ_REPEAT_VAR ? [...loops, String(fields['VAR'])] : loops;
    if (isRecord(block['inputs'])) {
      for (const input of Object.values(block['inputs'])) {
        if (isRecord(input)) {
          walk(input['block'], inner);
          walk(input['shadow'], inner);
        }
      }
    }
    if (isRecord(block['next'])) walk(block['next']['block'], loops);
  };
  for (const top of workspace?.blocks.blocks ?? []) walk(top, []);
  return out;
}

function toolboxVarBlocks(toolbox: readonly ToolboxEntry[]): VarBlock[] {
  return toolbox.flatMap((entry): VarBlock[] => {
    const type = typeof entry === 'string' ? entry : entry.type;
    if (!VARIABLE_TYPES.has(type)) return [];
    const fields = typeof entry === 'string' ? {} : fieldsOf(entry.fields);
    return [{ type, fields, where: 'toolbox', loops: [] }];
  });
}

/** Map count of a level: `config` plus its variants. */
function mapCount(level: Level): number {
  return 1 + (level.variants?.length ?? 0);
}

/** The world number of a level (`w07-…` → 7), or null for drafts (`_sandbox`). */
function worldNumber(level: Level): number | null {
  const match = /^w(\d{2})-/.exec(level.worldId);
  return match === null ? null : Number(match[1]);
}

/**
 * Rule 23 for one schema-valid level: errors and warnings (ADR-0022 §5). `isDraft` levels
 * (`worlds/_*`) skip (g), the world check.
 */
export function variableIssues(
  level: Level,
  isDraft = false,
): { errors: RuleIssue[]; warnings: RuleIssue[] } {
  const errors: RuleIssue[] = [];
  const warnings: RuleIssue[] = [];
  const error = (message: string): void => {
    errors.push({ rule: VARIABLE_RULE, message });
  };
  const warn = (message: string): void => {
    warnings.push({ rule: VARIABLE_RULE, message });
  };

  const fromToolbox = toolboxVarBlocks(level.toolbox);
  const fromPrograms = [
    ...workspaceVarBlocks(level.solution, 'solution'),
    ...workspaceVarBlocks(level.initialWorkspace, 'initialWorkspace'),
  ];
  const used = [...fromToolbox, ...fromPrograms];
  const declared = level.variables ?? [];
  const byId = new Map<string, LevelVariable>(declared.map((variable) => [variable.id, variable]));

  // (c) Variable blocks need declared boxes.
  if (used.length > 0 && level.variables === undefined) {
    const types = [...new Set(used.map((block) => block.type))].join(', ');
    error(`(c) uses variable blocks (${types}) but declares no "variables"`);
  }
  // (g) Boxes are taught from world 7 on.
  const world = worldNumber(level);
  if (!isDraft && used.length > 0 && world !== null && world < FIRST_VARIABLE_WORLD) {
    error(
      `(g) variable blocks belong to world ${String(FIRST_VARIABLE_WORLD)} or later, not world ${String(world)}`,
    );
  }
  // (d) Declared boxes that nothing uses.
  if (level.variables !== undefined && used.length === 0) {
    warn(
      '(d) "variables" are declared but no toolbox entry or given program uses a variable block',
    );
  }
  // (h) Short box names.
  for (const variable of declared) {
    const words = variable.name.trim().split(/\s+/).filter(Boolean).length;
    if (words > MAX_VARIABLE_NAME_WORDS) {
      warn(
        `(h) box name "${variable.name}" has ${String(words)} words > ${String(MAX_VARIABLE_NAME_WORDS)}`,
      );
    }
  }

  // (a) Toolbox entries pin their fields.
  for (const block of fromToolbox) {
    const missing = (PINNED_FIELDS[block.type] ?? []).filter((name) => !(name in block.fields));
    if (missing.length > 0) {
      error(
        `(a) toolbox "${block.type}" must pin ${missing.join(', ')} (the par search only tries pinned values)`,
      );
    }
  }

  for (const block of used) {
    const raw = block.fields['VAR'];
    const box = typeof raw === 'string' ? raw : raw === undefined ? undefined : JSON.stringify(raw);
    // (b) Every named box is declared.
    if (box !== undefined && level.variables !== undefined && !byId.has(box)) {
      error(`(b) ${block.where} "${block.type}" names box "${box}", which is not declared`);
    }
    // (e) / (k) Numbers within the box's 0…max.
    const variable = box === undefined ? undefined : byId.get(box);
    const number = block.fields['NUM'];
    if (number !== undefined && block.type !== CQ_REPEAT_VAR) {
      const value = Number(number);
      const max = variable === undefined ? null : variableMax(variable);
      const least = block.type === CQ_VAR_ADD ? 1 : 0;
      if (!Number.isInteger(value) || value < least) {
        error(
          `(e) ${block.where} "${block.type}" NUM ${JSON.stringify(number)} is not a whole number ≥ ${String(least)}`,
        );
      } else if (max !== null && value > max) {
        error(
          `(k) ${block.where} "${block.type}" NUM ${String(value)} > max ${String(max)} of "${variable?.id ?? ''}"`,
        );
      }
    }
    // (i) "lặp [hộp] lần" reads its box once: changing that box inside is a trap.
    if (
      (block.type === CQ_VAR_SET || block.type === CQ_VAR_ADD) &&
      box !== undefined &&
      block.loops.includes(box)
    ) {
      warn(
        `(i) ${block.where} changes box "${box}" inside "lặp [${box}] lần", which read it once when it began`,
      );
    }
  }

  // (f) A countGoal box the solution never changes.
  const goal = level.countGoal;
  if (goal !== undefined && level.solution !== undefined) {
    const changes = fromPrograms.some(
      (block) =>
        block.where === 'solution' &&
        (block.type === CQ_VAR_SET || block.type === CQ_VAR_ADD) &&
        block.fields['VAR'] === goal.var,
    );
    if (!changes) warn(`(f) countGoal box "${goal.var}" is never set or increased by the solution`);
  }

  // (j) Predict keys carry every box once, in declaration order, each within its 0…max.
  if (level.mode === 'predict' && level.variables !== undefined) {
    for (const option of level.predict?.options ?? []) {
      const { base, vars } = splitVarSuffix(option.key);
      const ids = option.key.slice(base.length).match(/#[a-z][a-z0-9_]*=/g) ?? [];
      const rebuilt = base + varSuffix(declared, vars);
      const overMax = declared.find((variable) => (vars[variable.id] ?? 0) > variableMax(variable));
      if (overMax !== undefined) {
        error(
          `(j) predict key "${option.key}" gives box "${overMax.id}" ${String(vars[overMax.id])} > max ${String(variableMax(overMax))}`,
        );
      } else if (rebuilt !== option.key || ids.length !== declared.length) {
        error(
          `(j) predict key "${option.key}" must end with #<id>=<n> for ${declared.map((variable) => variable.id).join(', ')}, in that order`,
        );
      }
    }
  }

  // R4 (content-authoring.md §2.2): self-built levels with boxes need several maps.
  if ((level.mode === 'build' || level.mode === 'bughunt') && level.variables !== undefined) {
    const steering = fromToolbox.some((block) => STEERING_TYPES.has(block.type));
    if (steering && mapCount(level) < 2) {
      error('(R4) a box that steers the program (lặp [hộp] lần, so sánh) needs at least 2 maps');
    }
    if (!steering && goal !== undefined && new Set(goal.equals).size < 2) {
      error('(R4) a counting level needs at least 2 maps with different countGoal.equals');
    }
  }
  return { errors, warnings };
}

/**
 * Authoring rule R4 as a test helper (ADR-0022 §5): `level` with every variable block taken out
 * of the toolbox and without `variables` / `countGoal`. A level whose box steers the program
 * must not be won within `par` this way (`findShortestPrograms(withoutVariables(level))`).
 */
export function withoutVariables(level: Level): Level {
  const plain: Level = {
    ...level,
    toolbox: level.toolbox.filter(
      (entry) => !VARIABLE_TYPES.has(typeof entry === 'string' ? entry : entry.type),
    ),
  };
  delete plain.variables;
  delete plain.countGoal;
  return plain;
}
