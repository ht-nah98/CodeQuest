import type { WorkspaceJson } from '@codequest/content-schema';
import { CQ_REPEAT, CQ_START } from '@codequest/engine';

/** One statement of a straight-line program: a toolbox block, or `cq_repeat` with its body. */
export type Statement =
  | { readonly block: string; readonly fields?: Readonly<Record<string, unknown>> }
  | { readonly repeat: number; readonly body: Program };

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
    size += 'repeat' in statement ? 1 + programSize(statement.body) : 1;
  }
  return size;
}

/** Workspace JSON with `cq_start` and the program under it; block ids are `b1`, `b2`… */
export function programToWorkspace(program: Program): WorkspaceJson {
  let next = 0;
  const chain = (statements: Program): JsonRecord | undefined => {
    let first: JsonRecord | undefined;
    let last: JsonRecord | undefined;
    for (const statement of statements) {
      next++;
      let block: JsonRecord;
      if ('repeat' in statement) {
        block = { type: CQ_REPEAT, id: `b${String(next)}`, fields: { TIMES: statement.repeat } };
        const body = chain(statement.body);
        if (body !== undefined) block['inputs'] = { DO: { block: body } };
      } else {
        block = { type: statement.block, id: `b${String(next)}` };
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

/**
 * The program under `cq_start` of a workspace JSON (orphans ignored), or null when it uses
 * something a straight-line program cannot express: value inputs, other statement inputs,
 * or a `cq_repeat` without a whole-number `TIMES`.
 */
export function programFromWorkspace(workspace: WorkspaceJson): Program | null {
  const read = (first: JsonRecord | null): Statement[] | null => {
    const out: Statement[] = [];
    for (let block = first; block !== null; block = connected(block['next'])) {
      const type = block['type'];
      if (typeof type !== 'string') return null;
      const fields = isRecord(block['fields']) ? block['fields'] : undefined;
      const inputs = isRecord(block['inputs']) ? Object.keys(block['inputs']) : [];
      if (type === CQ_REPEAT) {
        const times = Number(fields?.['TIMES']);
        if (!Number.isInteger(times) || inputs.some((name) => name !== 'DO')) return null;
        const body = read(connected(isRecord(block['inputs']) ? block['inputs']['DO'] : null));
        if (body === null) return null;
        out.push({ repeat: times, body });
      } else {
        if (inputs.length > 0) return null;
        out.push(fields === undefined ? { block: type } : { block: type, fields });
      }
    }
    return out;
  };
  const start = workspace.blocks.blocks.find((block) => block.type === CQ_START);
  return start === undefined ? null : read(connected(start['next']));
}

/** `walk, repeat 3 [walk, jump]`: block types without their `<kind>_` prefix. */
export function formatProgram(program: Program): string {
  return program
    .map((statement) => {
      if ('repeat' in statement) {
        return `repeat ${String(statement.repeat)} [${formatProgram(statement.body)}]`;
      }
      const name = statement.block.replace(/^[a-z0-9]+_/, '');
      const fields = Object.entries(statement.fields ?? {})
        .map(([key, value]) => `${key}=${String(value)}`)
        .join(' ');
      return fields === '' ? name : `${name}(${fields})`;
    })
    .join(', ');
}
