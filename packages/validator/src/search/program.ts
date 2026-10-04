import type { WorkspaceJson } from '@codequest/content-schema';
import {
  COND_INPUT,
  CQ_IF,
  CQ_IF_ELSE,
  CQ_REPEAT,
  CQ_REPEAT_UNTIL,
  CQ_START,
} from '@codequest/engine';

/** A sensor block plugged into a condition slot, with its field values. */
export interface Condition {
  readonly block: string;
  readonly fields?: Readonly<Record<string, unknown>>;
}

/**
 * One statement of a program: a toolbox block, `cq_repeat` with its body, `cq_if` (no `else`)
 * or `cq_if_else` (with `else`, possibly empty), or `cq_repeat_until`. A condition is `null`
 * when its slot is empty (the engine refuses to run that: EMPTY_CONDITION).
 */
export type Statement =
  | { readonly block: string; readonly fields?: Readonly<Record<string, unknown>> }
  | { readonly repeat: number; readonly body: Program }
  | { readonly if: Condition | null; readonly then: Program; readonly else?: Program }
  | { readonly until: Condition | null; readonly body: Program };

/** The statements under `cq_start`, in order. */
export type Program = readonly Statement[];

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Blocks a program uses (what `maxBlocks` and `par` count: no `cq_start`, no shadows). */
export function programSize(program: Program): number {
  let size = 0;
  for (const statement of program) {
    if ('repeat' in statement) size += 1 + programSize(statement.body);
    else if ('if' in statement) {
      size += 1 + (statement.if === null ? 0 : 1) + programSize(statement.then);
      size += programSize(statement.else ?? []);
    } else if ('until' in statement) {
      size += 1 + (statement.until === null ? 0 : 1) + programSize(statement.body);
    } else size += 1;
  }
  return size;
}

/** Blocks of each type a program uses (what `maxInstances` limits). */
export function programBlockTypes(
  program: Program,
  out = new Map<string, number>(),
): Map<string, number> {
  const add = (type: string): void => {
    out.set(type, (out.get(type) ?? 0) + 1);
  };
  for (const statement of program) {
    if ('repeat' in statement) {
      add(CQ_REPEAT);
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
    } else add(statement.block);
  }
  return out;
}

/** Deepest nesting of loops (`cq_repeat`, `cq_repeat_until`) in a program (`maxLoopDepth`). */
export function programLoopDepth(program: Program): number {
  let deepest = 0;
  for (const statement of program) {
    if ('repeat' in statement) deepest = Math.max(deepest, 1 + programLoopDepth(statement.body));
    else if ('until' in statement)
      deepest = Math.max(deepest, 1 + programLoopDepth(statement.body));
    else if ('if' in statement) {
      deepest = Math.max(
        deepest,
        programLoopDepth(statement.then),
        programLoopDepth(statement.else ?? []),
      );
    }
  }
  return deepest;
}

/** Workspace JSON with `cq_start` and the program under it; block ids are `b1`, `b2`… */
export function programToWorkspace(program: Program): WorkspaceJson {
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
      if ('repeat' in statement) {
        block = { type: CQ_REPEAT, id: id(), fields: { TIMES: statement.repeat } };
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
  return { blocks: { languageVersion: 0, blocks: [start as { type: string }] } };
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
  [CQ_IF]: [COND_INPUT, 'DO'],
  [CQ_IF_ELSE]: [COND_INPUT, 'DO', 'ELSE'],
  [CQ_REPEAT_UNTIL]: [COND_INPUT, 'DO'],
};

/**
 * The program under `cq_start` of a workspace JSON (orphans ignored), or null when it uses
 * something the search cannot express: value inputs other than a condition slot holding one
 * plain sensor block, other statement inputs, or a `cq_repeat` without a whole-number `TIMES`.
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
 * `walk, repeat 3 [walk, jump]`, `repeat 10 [if is_ahead(KIND=HOLE) [jump] else [walk]]`,
 * `until at_goal [forward]`: block types without their `<kind>_` prefix.
 */
export function formatProgram(program: Program): string {
  return program
    .map((statement) => {
      if ('repeat' in statement) {
        return `repeat ${String(statement.repeat)} [${formatProgram(statement.body)}]`;
      }
      if ('if' in statement) {
        const otherwise =
          statement.else === undefined ? '' : ` else [${formatProgram(statement.else)}]`;
        return `if ${formatCondition(statement.if)} [${formatProgram(statement.then)}]${otherwise}`;
      }
      if ('until' in statement) {
        return `until ${formatCondition(statement.until)} [${formatProgram(statement.body)}]`;
      }
      return formatBlock(statement.block, statement.fields);
    })
    .join(', ');
}
