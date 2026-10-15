import type { WorkspaceJson } from '@codequest/content-schema';
import {
  COND_INPUT,
  CQ_IF,
  CQ_IF_ELSE,
  CQ_PROC_CALL,
  CQ_PROC_DEF,
  CQ_REPEAT,
  CQ_REPEAT_UNTIL,
  CQ_REPEAT_VAR,
  CQ_START,
  PROC_BODY_INPUT,
} from '@codequest/engine';

/** A sensor block plugged into a condition slot, with its field values. */
export interface Condition {
  readonly block: string;
  readonly fields?: Readonly<Record<string, unknown>>;
}

/**
 * One statement of a program: a toolbox block, `cq_repeat` with its body, `cq_repeat_var`
 * ("lặp [hộp] lần", ADR-0022: `repeatVar` is the box id), `cq_if` (no `else`) or `cq_if_else`
 * (with `else`, possibly empty), `cq_repeat_until`, or `làm phép` (`call`: the spell id, ADR-0023;
 * `arg` the number of `làm phép … với`, P4-04). A condition is `null` when its slot is empty (the
 * engine refuses to run that: EMPTY_CONDITION).
 */
export type Statement =
  | { readonly block: string; readonly fields?: Readonly<Record<string, unknown>> }
  | { readonly repeat: number; readonly body: Program }
  | { readonly repeatVar: string; readonly body: Program }
  | { readonly if: Condition | null; readonly then: Program; readonly else?: Program }
  | { readonly until: Condition | null; readonly body: Program }
  | { readonly call: string; readonly arg?: number };

/** The statements under `cq_start`, in order. */
export type Program = readonly Statement[];

/**
 * The bodies of a program's `dạy phép` blocks by spell id (ADR-0023 §4). A program of a level
 * with spells is `{ main, defs }`: the helpers below take `defs` as an optional second argument.
 */
export type Definitions = Readonly<Record<string, Program>>;

const NO_DEFS: Definitions = {};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Blocks a program uses (what `maxBlocks` and `par` count: no `cq_start`, no shadows), with each
 * `dạy phép` block and its body.
 */
export function programSize(program: Program, defs: Definitions = NO_DEFS): number {
  let size = 0;
  for (const body of Object.values(defs)) size += 1 + programSize(body);
  for (const statement of program) {
    if ('repeat' in statement || 'repeatVar' in statement) size += 1 + programSize(statement.body);
    else if ('if' in statement) {
      size += 1 + (statement.if === null ? 0 : 1) + programSize(statement.then);
      size += programSize(statement.else ?? []);
    } else if ('until' in statement) {
      size += 1 + (statement.until === null ? 0 : 1) + programSize(statement.body);
    } else size += 1;
  }
  return size;
}

/** Blocks of each type a program uses (what `maxInstances` limits), spells included. */
export function programBlockTypes(
  program: Program,
  out = new Map<string, number>(),
  defs: Definitions = NO_DEFS,
): Map<string, number> {
  const add = (type: string): void => {
    out.set(type, (out.get(type) ?? 0) + 1);
  };
  for (const body of Object.values(defs)) {
    add(CQ_PROC_DEF);
    programBlockTypes(body, out);
  }
  for (const statement of program) {
    if ('repeat' in statement) {
      add(CQ_REPEAT);
      programBlockTypes(statement.body, out);
    } else if ('repeatVar' in statement) {
      add(CQ_REPEAT_VAR);
      programBlockTypes(statement.body, out);
    } else if ('if' in statement) {
      add(statement.else === undefined ? CQ_IF : CQ_IF_ELSE);
      if (statement.if !== null) add(statement.if.block);
      programBlockTypes(statement.then, out);
      programBlockTypes(statement.else ?? [], out);
    } else if ('until' in statement) {
      add(CQ_REPEAT_UNTIL);
      if (statement.until !== null) add(statement.until.block);
      programBlockTypes(statement.body, out);
    } else if ('call' in statement) add(CQ_PROC_CALL);
    else add(statement.block);
  }
  return out;
}

/**
 * Deepest **effective** nesting of loops (`cq_repeat`, `cq_repeat_var`, `cq_repeat_until`) in a
 * program (`maxLoopDepth`): a `làm phép` adds the deepest nesting of its spell's body (ADR-0023
 * §3), like the engine's `loopDepth`. A body nobody calls counts its own nesting.
 */
export function programLoopDepth(program: Program, defs: Definitions = NO_DEFS): number {
  let deepest = stackDepth(program, defs);
  for (const body of Object.values(defs)) deepest = Math.max(deepest, stackDepth(body, NO_DEFS));
  return deepest;
}

/** Effective loop nesting of one stack, looking calls up in `defs`. */
function stackDepth(program: Program, defs: Definitions): number {
  let deepest = 0;
  for (const statement of program) {
    if ('call' in statement) {
      deepest = Math.max(deepest, stackDepth(defs[statement.call] ?? [], NO_DEFS));
    } else if ('repeat' in statement || 'repeatVar' in statement || 'until' in statement) {
      deepest = Math.max(deepest, 1 + stackDepth(statement.body, defs));
    } else if ('if' in statement) {
      deepest = Math.max(
        deepest,
        stackDepth(statement.then, defs),
        stackDepth(statement.else ?? [], defs),
      );
    }
  }
  return deepest;
}

/**
 * Workspace JSON with `cq_start` and the program under it, then one `dạy phép` block per spell
 * of `defs` (in key order); block ids are `b1`, `b2`…
 */
export function programToWorkspace(program: Program, defs: Definitions = NO_DEFS): WorkspaceJson {
  let next = 0;
  const id = (): string => {
    next++;
    return `b${String(next)}`;
  };
  const sensor = (condition: Condition): JsonRecord => ({
    type: condition.block,
    id: id(),
    ...(condition.fields !== undefined && { fields: { ...condition.fields } }),
  });
  const chain = (statements: Program): JsonRecord | undefined => {
    let first: JsonRecord | undefined;
    let last: JsonRecord | undefined;
    for (const statement of statements) {
      let block: JsonRecord;
      if ('repeat' in statement || 'repeatVar' in statement) {
        block =
          'repeat' in statement
            ? { type: CQ_REPEAT, id: id(), fields: { TIMES: statement.repeat } }
            : { type: CQ_REPEAT_VAR, id: id(), fields: { VAR: statement.repeatVar } };
        const body = chain(statement.body);
        if (body !== undefined) block['inputs'] = { DO: { block: body } };
      } else if ('if' in statement || 'until' in statement) {
        const isIf = 'if' in statement;
        const type = isIf ? (statement.else === undefined ? CQ_IF : CQ_IF_ELSE) : CQ_REPEAT_UNTIL;
        block = { type, id: id() };
        const inputs: JsonRecord = {};
        const condition = isIf ? statement.if : statement.until;
        if (condition !== null) inputs[COND_INPUT] = { block: sensor(condition) };
        const body = chain(isIf ? statement.then : statement.body);
        if (body !== undefined) inputs['DO'] = { block: body };
        const otherwise = isIf ? chain(statement.else ?? []) : undefined;
        if (otherwise !== undefined) inputs['ELSE'] = { block: otherwise };
        if (Object.keys(inputs).length > 0) block['inputs'] = inputs;
      } else if ('call' in statement) {
        block = { type: CQ_PROC_CALL, id: id(), fields: { PROC: statement.call } };
      } else {
        block = { type: statement.block, id: id() };
        if (statement.fields !== undefined) block['fields'] = { ...statement.fields };
      }
      if (last === undefined) first = block;
      else last['next'] = { block };
      last = block;
    }
    return first;
  };
  const body = chain(program);
  const start: JsonRecord = { type: CQ_START, id: 'start' };
  if (body !== undefined) start['next'] = { block: body };
  const spells = Object.entries(defs).map(([spell, statements]): JsonRecord => {
    const def: JsonRecord = { type: CQ_PROC_DEF, id: id(), fields: { PROC: spell } };
    const inner = chain(statements);
    if (inner !== undefined) def['inputs'] = { [PROC_BODY_INPUT]: { block: inner } };
    return def;
  });
  return {
    blocks: { languageVersion: 0, blocks: [start, ...spells] as Array<{ type: string }> },
  };
}

/** The real block of a connection, or its shadow when nothing is plugged in. */
function connected(connection: unknown): JsonRecord | null {
  if (!isRecord(connection)) return null;
  const block = connection['block'] ?? connection['shadow'];
  return isRecord(block) ? block : null;
}

/** Inputs each control block may have. */
const CONTROL_INPUTS: Readonly<Record<string, readonly string[]>> = {
  [CQ_REPEAT]: ['DO'],
  [CQ_REPEAT_VAR]: ['DO'],
  [CQ_IF]: [COND_INPUT, 'DO'],
  [CQ_IF_ELSE]: [COND_INPUT, 'DO', 'ELSE'],
  [CQ_REPEAT_UNTIL]: [COND_INPUT, 'DO'],
};

/**
 * The program under `cq_start` of a workspace JSON (orphans ignored), or null when it uses
 * something the search cannot express: value inputs other than a condition slot holding one
 * plain sensor block, other statement inputs, a `cq_repeat` without a whole-number `TIMES`, or
 * a `cq_repeat_var` without a `VAR`.
 */
export function programFromWorkspace(workspace: WorkspaceJson): Program | null {
  const condition = (connection: unknown): Condition | null | undefined => {
    const block = connected(connection);
    if (block === null) return null;
    const type = block['type'];
    if (typeof type !== 'string' || block['inputs'] !== undefined || block['next'] !== undefined) {
      return undefined;
    }
    return isRecord(block['fields']) ? { block: type, fields: block['fields'] } : { block: type };
  };
  const read = (first: JsonRecord | null): Statement[] | null => {
    const out: Statement[] = [];
    for (let block = first; block !== null; block = connected(block['next'])) {
      const type = block['type'];
      if (typeof type !== 'string') return null;
      const fields = isRecord(block['fields']) ? block['fields'] : undefined;
      const inputs = isRecord(block['inputs']) ? block['inputs'] : {};
      const allowed = CONTROL_INPUTS[type];
      if (type === CQ_PROC_CALL) {
        const spell = fields?.['PROC'];
        if (typeof spell !== 'string' || Object.keys(inputs).length > 0) return null;
        out.push({ call: spell });
        continue;
      }
      if (allowed === undefined) {
        if (Object.keys(inputs).length > 0) return null;
        out.push(fields === undefined ? { block: type } : { block: type, fields });
        continue;
      }
      if (Object.keys(inputs).some((name) => !allowed.includes(name))) return null;
      const body = read(connected(inputs['DO']));
      if (body === null) return null;
      if (type === CQ_REPEAT) {
        const times = Number(fields?.['TIMES']);
        if (!Number.isInteger(times)) return null;
        out.push({ repeat: times, body });
        continue;
      }
      if (type === CQ_REPEAT_VAR) {
        const box = fields?.['VAR'];
        if (typeof box !== 'string') return null;
        out.push({ repeatVar: box, body });
        continue;
      }
      const cond = condition(inputs[COND_INPUT]);
      if (cond === undefined) return null;
      if (type === CQ_REPEAT_UNTIL) {
        out.push({ until: cond, body });
      } else if (type === CQ_IF) {
        out.push({ if: cond, then: body });
      } else {
        const otherwise = read(connected(inputs['ELSE']));
        if (otherwise === null) return null;
        out.push({ if: cond, then: body, else: otherwise });
      }
    }
    return out;
  };
  const start = workspace.blocks.blocks.find((block) => block.type === CQ_START);
  return start === undefined ? null : read(connected(start['next']));
}

/**
 * The bodies of a workspace's `dạy phép` blocks by spell (ADR-0023), or null when a body uses
 * something the search cannot express or a spell is taught twice. `{}` without spells.
 */
export function definitionsFromWorkspace(workspace: WorkspaceJson): Definitions | null {
  const defs: Record<string, Program> = {};
  for (const block of workspace.blocks.blocks) {
    if (block.type !== CQ_PROC_DEF) continue;
    const fields = isRecord(block['fields']) ? block['fields'] : {};
    const spell = fields['PROC'];
    if (typeof spell !== 'string' || spell in defs) return null;
    const inputs = isRecord(block['inputs']) ? block['inputs'] : {};
    const body = programFromWorkspace({
      blocks: {
        languageVersion: 0,
        blocks: [{ type: CQ_START, next: inputs[PROC_BODY_INPUT] }],
      },
    });
    if (body === null) return null;
    defs[spell] = body;
  }
  return defs;
}

/** `sensor(FIELD=value)` without the `<kind>_` prefix, or `?` for an empty slot. */
function formatCondition(condition: Condition | null): string {
  return condition === null ? '?' : formatBlock(condition.block, condition.fields);
}

function formatBlock(type: string, given: Readonly<Record<string, unknown>> | undefined): string {
  const name = type.replace(/^[a-z0-9]+_/, '');
  const fields = Object.entries(given ?? {})
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(' ');
  return fields === '' ? name : `${name}(${fields})`;
}

/**
 * `walk, repeat 3 [walk, jump]`, `repeat <bamboo> [forward]` (box loop), `repeat 10 [if is_ahead(KIND=HOLE) [jump] else [walk]]`,
 * `until at_goal [forward]`: block types without their `<kind>_` prefix. A spell call is
 * `cast stair` (ADR-0023).
 */
export function formatProgram(program: Program): string {
  return formatStatements(program);
}

/** `formatProgram` followed by each spell's body: `cast stair, forward | stair = [forward]`. */
export function formatProgramWithDefs(program: Program, defs: Definitions): string {
  const spells = Object.entries(defs)
    .map(([spell, body]) => ` | ${spell} = [${formatStatements(body)}]`)
    .join('');
  return formatStatements(program) + spells;
}

/** `formatProgram` of one stack; a spell call is `cast <id>` (`cast <id> 3` with a number). */
function formatStatements(program: Program): string {
  return program
    .map((statement) => {
      if ('call' in statement) {
        return statement.arg === undefined
          ? `cast ${statement.call}`
          : `cast ${statement.call} ${String(statement.arg)}`;
      }
      if ('repeat' in statement) {
        return `repeat ${String(statement.repeat)} [${formatStatements(statement.body)}]`;
      }
      if ('repeatVar' in statement) {
        return `repeat <${statement.repeatVar}> [${formatStatements(statement.body)}]`;
      }
      if ('if' in statement) {
        const otherwise =
          statement.else === undefined ? '' : ` else [${formatStatements(statement.else)}]`;
        return `if ${formatCondition(statement.if)} [${formatStatements(statement.then)}]${otherwise}`;
      }
      if ('until' in statement) {
        return `until ${formatCondition(statement.until)} [${formatStatements(statement.body)}]`;
      }
      return formatBlock(statement.block, statement.fields);
    })
    .join(', ');
}
