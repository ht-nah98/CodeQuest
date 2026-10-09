import { variableMax, variableStart, type LevelVariable } from '@codequest/content-schema';
import type { Primitive } from '../sdk/gameKind';

/** Sandbox functions of the variable blocks, installed by the engine itself (ADR-0022 §3). */
export const VAR_SET_FN = '__varSet';
export const VAR_ADD_FN = '__varAdd';
export const VAR_GET_FN = '__varGet';
export const VAR_CMP_FN = '__varCmp';
export const VAR_API_NAMES: readonly string[] = [VAR_SET_FN, VAR_ADD_FN, VAR_GET_FN, VAR_CMP_FN];

/** Comparisons of `cq_var_compare` (`=`, `<`, `>`). */
export const VAR_OPS = ['EQ', 'LT', 'GT'] as const;
export type VarOp = (typeof VAR_OPS)[number];

/** Values of every box, by id. */
export type VarValues = Readonly<Record<string, number>>;

/**
 * What one variable call did: the boxes afterwards, the value it answers (`__varGet` a number,
 * `__varCmp` a boolean) and, for `__varSet` / `__varAdd` going over `max`, `overflow` (the
 * boxes are then unchanged: the run loses BOX_FULL).
 */
export interface VarCallResult {
  vars: VarValues;
  value?: number | boolean;
  overflow?: true;
}

/** Whether `name` is one of the engine's variable functions. */
export function isVarCall(name: string): boolean {
  return VAR_API_NAMES.includes(name);
}

/** Boxes at the start of map `mapIndex` (0 = `config`), in declaration order. */
export function initialVars(
  decls: readonly LevelVariable[] | undefined,
  mapIndex: number,
): Record<string, number> {
  const vars: Record<string, number> = {};
  for (const decl of decls ?? []) vars[decl.id] = variableStart(decl, mapIndex);
  return vars;
}

function wholeNumber(value: Primitive | undefined, what: string): number {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${what}: expected a whole number ≥ 0, got ${String(value)}`);
  }
  return number;
}

/**
 * The rules of the variable blocks, as one pure function shared by the engine and the par
 * search (`FastSim`), so they are written once. Throws `unknown variable <id>` for an undeclared
 * box and for a call that is not a variable function.
 */
export function applyVarCall(
  vars: VarValues,
  decls: readonly LevelVariable[] | undefined,
  name: string,
  args: readonly Primitive[],
): VarCallResult {
  const id = String(args[0]);
  const decl = decls?.find((candidate) => candidate.id === id);
  if (decl === undefined) throw new Error(`unknown variable ${id}`);
  const current = vars[id] ?? 0;
  switch (name) {
    case VAR_SET_FN:
    case VAR_ADD_FN: {
      const amount = wholeNumber(args[1], name);
      const next = name === VAR_SET_FN ? amount : current + amount;
      if (next > variableMax(decl)) return { vars, value: current, overflow: true };
      return { vars: { ...vars, [id]: next }, value: next };
    }
    case VAR_GET_FN:
      return { vars, value: current };
    case VAR_CMP_FN: {
      const op = String(args[1]);
      const other = wholeNumber(args[2], name);
      if (op === 'EQ') return { vars, value: current === other };
      if (op === 'LT') return { vars, value: current < other };
      if (op === 'GT') return { vars, value: current > other };
      throw new Error(`${name}: unknown comparison ${op}`);
    }
    default:
      throw new Error(`${name} is not a variable function`);
  }
}

/** Separator of the box suffix of a predict key: `win#bamboo=3`. */
const SUFFIX = /#([a-z][a-z0-9_]*)=(\d+)$/;

/**
 * `#<id>=<n>` for every declared box, in declaration order (ADR-0022 §2): what the engine
 * appends to the predict key of a level with `variables`.
 */
export function varSuffix(decls: readonly LevelVariable[], vars: VarValues): string {
  return decls.map((decl) => `#${decl.id}=${String(vars[decl.id] ?? 0)}`).join('');
}

/**
 * Splits a predict key into the game kind's key and the boxes: `stop@1,4#bamboo=2#fish=0` →
 * `{ base: 'stop@1,4', vars: { bamboo: 2, fish: 0 } }`. A key without a suffix comes back whole
 * with no boxes, so each kind's key reader runs on `base` unchanged.
 */
export function splitVarSuffix(key: string): { base: string; vars: Record<string, number> } {
  const found: Array<[string, number]> = [];
  let base = key;
  for (let match = SUFFIX.exec(base); match !== null; match = SUFFIX.exec(base)) {
    found.unshift([match[1] ?? '', Number(match[2])]);
    base = base.slice(0, match.index);
  }
  return { base, vars: Object.fromEntries(found) };
}
