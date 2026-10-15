import type { Block } from 'blockly';
import type { BlockSpec } from '../sdk/blockSpec';
import { FIELD_CQ_PROC, NO_PROCEDURE } from './procedureField';

/** "dạy phép [▾]" with its body (ADR-0023 §1): a root block like `cq_start`, never run itself. */
export const CQ_PROC_DEF = 'cq_proc_def';
/** "làm phép [▾]": runs the body of the spell, then the block after it. */
export const CQ_PROC_CALL = 'cq_proc_call';
/** Statement input of `cq_proc_def*` holding the spell's body. */
export const PROC_BODY_INPUT = 'BODY';

/** Spell definition block types: program roots next to `cq_start` (ADR-0023 §3). */
export const PROC_DEF_TYPES: readonly string[] = [CQ_PROC_DEF];
/** Spell call block types. */
export const PROC_CALL_TYPES: readonly string[] = [CQ_PROC_CALL];

/**
 * Sandbox functions around every spell call (ADR-0023 §3), installed by `runLevel` for every
 * kind: `__call(id, n, blockId)` logs the `call` event, `__ret(id, blockId)` the `ret` event.
 */
export const PROC_CALL_FN = '__call';
export const PROC_RET_FN = '__ret';
export const PROC_API_NAMES: readonly string[] = [PROC_CALL_FN, PROC_RET_FN];

/** Prefix of the sandbox function a spell's body compiles to: `function __p_<id>() {…}`. */
export const PROC_FN_PREFIX = '__p_';

/** The spell id a `cq_proc_*` block names (`NO_PROCEDURE` when it names none). */
export function procedureOf(block: Block): string {
  const value = block.getFieldValue('PROC') as unknown;
  return typeof value === 'string' && value !== '' ? value : NO_PROCEDURE;
}

/** Name of the sandbox function of spell `id` (ids match `^[a-z][a-z0-9_]*$` or `__none`). */
export function procedureFunctionName(id: string): string {
  return `${PROC_FN_PREFIX}${id}`;
}

const procField = { type: FIELD_CQ_PROC, name: 'PROC' } as const;
const style = 'procedure_blocks';

/**
 * The engine's spell blocks (ADR-0023 §1), shared by every game kind. Labels and tooltips are
 * word for word from curriculum.md §6.3; tooltips name no character (maze and robotlab share
 * them). `cq_proc_def` has no generator of its own: `compileLoaded` turns each one into a
 * sandbox function.
 */
export const PROCEDURE_BLOCKS: readonly BlockSpec[] = [
  {
    type: CQ_PROC_DEF,
    category: 'function',
    apiNames: [],
    json: {
      message0: 'dạy phép %1 %2 %3',
      args0: [
        procField,
        { type: 'input_dummy' },
        { type: 'input_statement', name: PROC_BODY_INPUT },
      ],
      style,
      tooltip: 'Dạy phép: nhớ các lệnh bên trong, chưa làm ngay',
    },
    generator: () => '',
  },
  {
    type: CQ_PROC_CALL,
    category: 'function',
    apiNames: PROC_API_NAMES,
    json: {
      message0: 'làm phép %1',
      args0: [procField],
      previousStatement: null,
      nextStatement: null,
      style,
      tooltip: 'Làm phép: làm hết lệnh trong phép, rồi làm tiếp',
    },
    generator: (block, gen) => {
      const id = procedureOf(block);
      const spell = gen.quote_(id);
      const owner = gen.quote_(block.id);
      return (
        `${PROC_CALL_FN}(${spell}, 0, ${owner});\n` +
        `${procedureFunctionName(id)}();\n` +
        `${PROC_RET_FN}(${spell}, ${owner});\n`
      );
    },
  },
];
