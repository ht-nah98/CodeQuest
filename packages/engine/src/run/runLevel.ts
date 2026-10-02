import Interpreter from 'js-interpreter';
import type { Level, ReasonCode, RunResult, WorkspaceJson } from '@codequest/content-schema';
import { HIGHLIGHT_FN } from '../blocks/generator';
import { registerBlockSpecs } from '../blocks/registerBlockSpecs';
import type { SimContext } from '../sdk/context';
import type { DistributiveOmit, GameEvent, HighlightEvent } from '../sdk/events';
import type { GameKindApi, GameKindDefinition, Primitive } from '../sdk/gameKind';
import type { RunOutcome } from '../sdk/outcome';
import { fnv1a } from '../rng/fnv1a';
import { mulberry32 } from '../rng/mulberry32';
import { analyzeLoaded, type WorkspaceAnalysis } from './analyzeWorkspace';
import { compileLoaded } from './compileProgram';
import { editDistance } from './editDistance';
import { withHeadlessWorkspace } from './headlessWorkspace';
import { DEFAULT_MAX_ACTIONS, DEFAULT_MAX_STEPS } from './limits';
import { StopSignal } from './stopSignal';

export interface RunLevelInput<C, S, E extends GameEvent> {
  kind: GameKindDefinition<C, S, E>;
  level: Level;
  /** Blockly serialization JSON. Ignored in mode `predict`, which runs `level.initialWorkspace`. */
  workspace: WorkspaceJson;
  /** Defaults to `fnv1a(level.id)`. */
  seed?: number;
}

/** Thrown when the run exceeds `maxActions`; caught by `runLevel` like the step limit. */
class ActionLimitSignal extends Error {}

interface Compiled {
  analysis: WorkspaceAnalysis;
  code: string | { kind: 'empty' } | { kind: 'too-many' };
}

/** Arguments must be string, number or boolean; `undefined` (a missing value) is rejected too. */
function toPrimitive(value: Interpreter.Value): Primitive {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  throw new TypeError(`game API received a non-primitive argument (${typeof value})`);
}

/** API results must be string, number, boolean or nothing; objects would leak into the sandbox. */
function checkResult(name: string, value: unknown): Primitive | undefined {
  if (
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  throw new TypeError(`game API ${name} returned a non-primitive value (${typeof value})`);
}

function errorOutcome(
  reasonCode: ReasonCode,
  blocksUsed: number,
  debug?: string,
): RunOutcome<never> {
  return {
    result: 'error',
    reasonCode,
    events: [],
    stats: { steps: 0, actions: 0, blocksUsed },
    ...(debug !== undefined && { debug: { message: debug } }),
  };
}

/**
 * Runs a child's program for one level: analyze, compile, interpret in js-interpreter, then
 * evaluate. Synchronous, pure and deterministic for the same (kind, level, workspace, seed).
 */
export function runLevel<C, S, E extends GameEvent>(input: RunLevelInput<C, S, E>): RunOutcome<E> {
  const { kind, level } = input;
  const workspace =
    level.mode === 'predict' ? (level.initialWorkspace ?? input.workspace) : input.workspace;

  let compiled: Compiled;
  try {
    registerBlockSpecs(kind.blocks);
    compiled = withHeadlessWorkspace(workspace, (ws) => {
      const analysis = analyzeLoaded(ws);
      const start = analysis.startBlockId === null ? null : ws.getBlockById(analysis.startBlockId);
      // Empty = nothing under cq_start, even if function definitions exist.
      if (start === null || start.getNextBlock() === null)
        return { analysis, code: { kind: 'empty' } };
      if (level.maxBlocks !== undefined && analysis.blocksUsed > level.maxBlocks) {
        return { analysis, code: { kind: 'too-many' } };
      }
      return { analysis, code: compileLoaded(ws, start.id) };
    });
  } catch (error) {
    return errorOutcome('INTERNAL_ERROR', 0, `workspace: ${describe(error)}`);
  }

  const { analysis, code } = compiled;
  if (typeof code !== 'string') {
    return code.kind === 'empty'
      ? errorOutcome('EMPTY_PROGRAM', analysis.blocksUsed)
      : errorOutcome('TOO_MANY_BLOCKS', analysis.blocksUsed);
  }

  const config = kind.configSchema.safeParse(level.config);
  if (!config.success) {
    return errorOutcome('INTERNAL_ERROR', analysis.blocksUsed, `config: ${config.error.message}`);
  }

  const rng = mulberry32(input.seed ?? fnv1a(level.id));
  const maxSteps = level.limits?.maxSteps ?? DEFAULT_MAX_STEPS;
  const maxActions = level.limits?.maxActions ?? DEFAULT_MAX_ACTIONS;
  const events: Array<E | HighlightEvent> = [];
  let actions = 0;
  let steps = 0;

  const stop = (result: 'success' | 'crash' | 'incomplete', reasonCode?: ReasonCode): never => {
    throw new StopSignal(result, reasonCode ?? null);
  };
  const emit = (event: DistributiveOmit<E, 'blockId'>, blockId: string | null): void => {
    if (actions >= maxActions) throw new ActionLimitSignal();
    actions++;
    // Re-adding the omitted blockId restores the original E variant.
    events.push({ ...event, blockId } as unknown as E);
  };
  const stats = (): RunOutcome['stats'] => ({ steps, actions, blocksUsed: analysis.blocksUsed });

  let state: S | undefined;
  let result: RunResult;
  let reasonCode: ReasonCode | null = null;
  try {
    const ctx: SimContext<S, E> = {
      state: kind.createState(config.data, rng),
      emit,
      stop,
      rng,
      level,
    };
    state = ctx.state;
    const api = kind.createApi(ctx);
    const missing = kind.blocks.flatMap((spec) => spec.apiNames).filter((name) => !(name in api));
    if (missing.length > 0) throw new Error(`createApi lacks ${missing.join(', ')}`);
    const interpreter = createInterpreter(code, api, rng, (blockId) => {
      events.push({ type: 'highlight', blockId });
    });
    let finished = false;
    while (steps < maxSteps) {
      if (!interpreter.step()) {
        finished = true;
        break;
      }
      steps++;
      // Paused on an async operation: stepping further would spin until maxSteps.
      if (interpreter.getStatus() === Interpreter.Status.ASYNC) {
        throw new Error('sandbox paused on an asynchronous operation');
      }
    }
    if (!finished && interpreter.getStatus() === Interpreter.Status.DONE) finished = true;

    if (!finished) {
      result = 'timeout';
      reasonCode = 'TIMEOUT';
    } else if (level.mode === 'creative') {
      result = 'success';
    } else {
      const verdict = kind.evaluate(ctx.state, config.data);
      result = verdict.success ? 'success' : 'incomplete';
      reasonCode = verdict.success ? null : verdict.reasonCode;
    }
  } catch (error) {
    if (error instanceof StopSignal) {
      result = error.result;
      reasonCode = error.result === 'success' ? null : error.reasonCode;
    } else if (error instanceof ActionLimitSignal) {
      result = 'timeout';
      reasonCode = 'TIMEOUT';
    } else {
      return {
        ...errorOutcome('INTERNAL_ERROR', analysis.blocksUsed, describe(error)),
        events,
        stats: stats(),
      };
    }
  }

  const outcome: RunOutcome<E> = { result, reasonCode, events, stats: stats() };
  try {
    if (level.mode === 'predict' && state !== undefined) {
      outcome.answerKey = kind.predictAnswer(state, { result, reasonCode });
    }
    if (level.mode === 'bughunt' && level.initialWorkspace !== undefined) {
      outcome.edits = editDistance(level.initialWorkspace, workspace);
    }
  } catch (error) {
    return {
      ...errorOutcome('INTERNAL_ERROR', analysis.blocksUsed, describe(error)),
      events,
      stats: stats(),
    };
  }
  return outcome;
}

/** Sandbox with the game API, the highlight hook and a seeded `Math.random`. */
function createInterpreter(
  code: string,
  api: GameKindApi,
  rng: () => number,
  onHighlight: (blockId: string) => void,
): Interpreter {
  const interpreter = new Interpreter(code, (it, globalObject) => {
    it.setProperty(
      globalObject,
      HIGHLIGHT_FN,
      it.createNativeFunction((blockId) => {
        onHighlight(String(toPrimitive(blockId)));
        return undefined;
      }),
    );
    for (const [name, fn] of Object.entries(api)) {
      it.setProperty(
        globalObject,
        name,
        it.createNativeFunction((...args) => checkResult(name, fn(...args.map(toPrimitive)))),
      );
    }
    // Keeps a stray `math_random_*` block deterministic.
    const math = it.getProperty(globalObject, 'Math');
    if (typeof math === 'object' && math !== null) {
      it.setProperty(
        math,
        'random',
        it.createNativeFunction(() => rng()),
        Interpreter.NONENUMERABLE_DESCRIPTOR,
      );
    }
  });
  // Mode 2 (default) runs regular expressions in a Web Worker when one exists, which pauses
  // the interpreter. Blockly's text blocks only build escaped, static patterns and children
  // cannot type a regex, so native regex is safe and keeps runs synchronous everywhere.
  interpreter.REGEXP_MODE = 1;
  return interpreter;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
