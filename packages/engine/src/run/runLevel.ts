import { ConnectionType } from 'blockly';
import Interpreter from 'js-interpreter';
import type { Level, ReasonCode, RunResult, WorkspaceJson } from '@codequest/content-schema';
import { COND_INPUT, CONDITION_BLOCK_TYPES } from '../blocks/common';
import { HIGHLIGHT_FN } from '../blocks/generator';
import { registerBlockSpecs } from '../blocks/registerBlockSpecs';
import type { SimContext } from '../sdk/context';
import type {
  DistributiveOmit,
  GameEvent,
  HighlightEvent,
  SenseEvent,
  VarEvent,
} from '../sdk/events';
import type { GameKindApi, GameKindDefinition, Primitive } from '../sdk/gameKind';
import type { MapOutcome, RunOutcome } from '../sdk/outcome';
import { fnv1a } from '../rng/fnv1a';
import { mulberry32 } from '../rng/mulberry32';
import { analyzeLoaded, type WorkspaceAnalysis } from './analyzeWorkspace';
import { compileLoaded } from './compileProgram';
import { editDistance } from './editDistance';
import { withHeadlessWorkspace } from './headlessWorkspace';
import { DEFAULT_MAX_ACTIONS, DEFAULT_MAX_STEPS } from './limits';
import { StopSignal } from './stopSignal';
import {
  applyVarCall,
  initialVars,
  VAR_API_NAMES,
  VAR_CMP_FN,
  VAR_GET_FN,
  varSuffix,
} from './variables';

/** Replaces the engine's variable functions (see `RunLevelInput.engineCalls`). */
export type EngineCalls = (name: string, args: Primitive[]) => Primitive | undefined;

export interface RunLevelInput<C, S, E extends GameEvent> {
  kind: GameKindDefinition<C, S, E>;
  level: Level;
  /** Blockly serialization JSON. Ignored in mode `predict`, which runs `level.initialWorkspace`. */
  workspace: WorkspaceJson;
  /** Defaults to `fnv1a(level.id)`. */
  seed?: number;
  /**
   * Internal, for the par search only (`@codequest/validator`, ADR-0022 §4): called instead of
   * the engine's variable functions (`__varSet`, `__varAdd`, `__varGet`, `__varCmp`) with their
   * name and arguments, and its result goes back to the sandbox. No `var` event, `sense` event
   * or box rule applies then. The search uses it to record what each block calls.
   */
  engineCalls?: EngineCalls;
}

/** Thrown when the run exceeds `maxActions`; caught by `runLevel` like the step limit. */
class ActionLimitSignal extends Error {}

interface Compiled {
  analysis: WorkspaceAnalysis;
  /** A program block has an empty statement input (a loop body or an if branch). */
  emptyStatementInput: boolean;
  code: string | { kind: 'empty' } | { kind: 'too-many' } | { kind: 'empty-condition' };
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
    compiled = withHeadlessWorkspace(
      workspace,
      (ws) => {
        const analysis = analyzeLoaded(ws);
        const start =
          analysis.startBlockId === null ? null : ws.getBlockById(analysis.startBlockId);
        // Empty = nothing under cq_start, even if function definitions exist.
        // Parsons (G22): a loop body or an if branch left empty means a block is not where it goes.
        const emptyStatementInput = analysis.programBlockIds.some((id) =>
          (ws.getBlockById(id)?.inputList ?? []).some(
            (input) =>
              input.connection?.type === ConnectionType.NEXT_STATEMENT &&
              input.connection.targetBlock() === null,
          ),
        );
        if (start === null || start.getNextBlock() === null)
          return { analysis, emptyStatementInput, code: { kind: 'empty' } };
        if (level.maxBlocks !== undefined && analysis.blocksUsed > level.maxBlocks) {
          return { analysis, emptyStatementInput, code: { kind: 'too-many' } };
        }
        // A question slot left empty (P2-11): refuse to guess (Blockly would read it as false).
        const emptyCondition = analysis.programBlockIds.some((id) => {
          const block = ws.getBlockById(id);
          return (
            block !== null &&
            CONDITION_BLOCK_TYPES.includes(block.type) &&
            block.getInputTargetBlock(COND_INPUT) === null
          );
        });
        if (emptyCondition)
          return { analysis, emptyStatementInput, code: { kind: 'empty-condition' } };
        return { analysis, emptyStatementInput, code: compileLoaded(ws, start.id) };
      },
      level.variables,
    );
  } catch (error) {
    return errorOutcome('INTERNAL_ERROR', 0, `workspace: ${describe(error)}`);
  }

  const { analysis, emptyStatementInput, code } = compiled;
  if (typeof code !== 'string') {
    const reasons = {
      empty: 'EMPTY_PROGRAM',
      'too-many': 'TOO_MANY_BLOCKS',
      'empty-condition': 'EMPTY_CONDITION',
    } as const;
    return errorOutcome(reasons[code.kind], analysis.blocksUsed);
  }

  // One map per config: `config`, then each variant (P2-12, ADR-0016).
  const configs: C[] = [];
  for (const [index, raw] of [level.config, ...(level.variants ?? [])].entries()) {
    const config = kind.configSchema.safeParse(raw);
    if (!config.success) {
      const where = index === 0 ? 'config' : `variants[${String(index - 1)}]`;
      return errorOutcome(
        'INTERNAL_ERROR',
        analysis.blocksUsed,
        `${where}: ${config.error.message}`,
      );
    }
    configs.push(config.data);
  }

  const maps: Array<MapRun<S, E>> = [];
  for (const [index, config] of configs.entries()) {
    const mapLevel = index === 0 ? level : { ...level, config: level.variants?.[index - 1] };
    const run = runMap(kind, mapLevel, config, code, analysis.blocksUsed, input.seed, {
      mapIndex: index,
      engineCalls: input.engineCalls,
    });
    maps.push(run);
    // A run that broke inside the engine says nothing about the other maps.
    if (run.outcome.result === 'error') break;
  }
  // The result comes from the first map that is not won (or the last map when all are won).
  const firstLoss = maps.findIndex((run) => run.outcome.result !== 'success');
  const deciding = firstLoss === -1 ? maps.length - 1 : firstLoss;
  const chosen = maps[deciding];
  if (chosen === undefined) return errorOutcome('INTERNAL_ERROR', analysis.blocksUsed, 'no map');
  const { state, outcome: mapOutcome } = chosen;
  const outcome: RunOutcome<E> = { ...mapOutcome };
  if (configs.length > 1) {
    outcome.maps = maps.map((run) => run.outcome);
    outcome.mapIndex = deciding;
  }
  // A star goal holds for the level only when it holds on every map (P2-21, ADR-0017).
  if (level.starGoals !== undefined && mapOutcome.result !== 'error') {
    outcome.goals = level.starGoals.map((_, index) =>
      maps.every((run) => run.outcome.goals?.[index] === true),
    );
  }
  // Parsons (coach question G22): every given block must be joined under "khi bắt đầu"; a
  // program that wins while blocks are still loose does not count.
  if (level.mode === 'parsons' && outcome.result === 'success') {
    if (analysis.orphanBlockIds.length > 0) {
      outcome.result = 'incomplete';
      outcome.reasonCode = 'LOOSE_BLOCKS';
    } else if (emptyStatementInput || !everyBlockRan(analysis, maps)) {
      // Joined but not where it goes: a block that never ran (asked or executed) on any map,
      // or an empty loop body / if branch, means another arrangement is meant.
      outcome.result = 'incomplete';
      outcome.reasonCode = 'UNUSED_BLOCKS';
    }
  }
  if (mapOutcome.result === 'error') {
    // An engine error on a variant says which map it came from, as an invalid config does.
    if (deciding > 0 && mapOutcome.debug !== undefined) {
      outcome.debug = {
        message: `variants[${String(deciding - 1)}]: ${mapOutcome.debug.message}`,
      };
    }
    return outcome;
  }
  try {
    if (level.mode === 'predict' && state !== undefined) {
      outcome.answerKey = kind.predictAnswer(state, {
        result: outcome.result,
        reasonCode: outcome.reasonCode,
      });
      // Boxes (ADR-0022): `#<id>=<n>` of every box on the deciding map, in declaration order.
      if (level.variables !== undefined) {
        outcome.answerKey += varSuffix(level.variables, mapOutcome.vars ?? {});
      }
    }
    if (level.mode === 'bughunt' && level.initialWorkspace !== undefined) {
      outcome.edits = editDistance(level.initialWorkspace, workspace);
    }
  } catch (error) {
    return {
      ...errorOutcome('INTERNAL_ERROR', analysis.blocksUsed, describe(error)),
      events: outcome.events,
      stats: outcome.stats,
    };
  }
  return outcome;
}

/** Every program block was highlighted (statements) or asked (sensors) on at least one map. */
function everyBlockRan<S, E extends GameEvent>(
  analysis: WorkspaceAnalysis,
  maps: ReadonlyArray<MapRun<S, E>>,
): boolean {
  const ran = new Set<string>();
  for (const run of maps) {
    for (const event of run.outcome.events) {
      if ((event.type === 'highlight' || event.type === 'sense') && event.blockId !== null) {
        ran.add(event.blockId);
      }
    }
  }
  return analysis.programBlockIds.every((id) => id === analysis.startBlockId || ran.has(id));
}

/** One map's run and the final state (for `predictAnswer`). */
interface MapRun<S, E extends GameEvent> {
  outcome: MapOutcome<E>;
  state: S | undefined;
}

/**
 * Interprets the compiled program on one map: a fresh state, rng, event log, limits and boxes
 * (`variables[].start[mapIndex]`), so each map's run is the same as if the level had only that
 * map.
 */
function runMap<C, S, E extends GameEvent>(
  kind: GameKindDefinition<C, S, E>,
  level: Level,
  config: C,
  code: string,
  blocksUsed: number,
  seed: number | undefined,
  { mapIndex, engineCalls }: { mapIndex: number; engineCalls: EngineCalls | undefined },
): MapRun<S, E> {
  const rng = mulberry32(seed ?? fnv1a(level.id));
  const maxSteps = level.limits?.maxSteps ?? DEFAULT_MAX_STEPS;
  const maxActions = level.limits?.maxActions ?? DEFAULT_MAX_ACTIONS;
  const events: Array<E | HighlightEvent | SenseEvent | VarEvent> = [];
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
  const sense = (value: boolean, blockId: string | null): boolean => {
    if (actions >= maxActions) throw new ActionLimitSignal();
    actions++;
    events.push({ type: 'sense', blockId, value });
    return value;
  };
  const stats = (): RunOutcome['stats'] => ({ steps, actions, blocksUsed });

  // Boxes (ADR-0022): engine state next to the kind's state, never seen by the kind.
  let vars: Readonly<Record<string, number>> = initialVars(level.variables, mapIndex);
  const varApi: GameKindApi = Object.fromEntries(
    VAR_API_NAMES.map((name) => [
      name,
      (...args: Primitive[]): Primitive | undefined => {
        if (engineCalls !== undefined) return engineCalls(name, args);
        const blockId = args[args.length - 1];
        const owner = blockId === undefined ? null : String(blockId);
        const applied = applyVarCall(vars, level.variables, name, args);
        if (name === VAR_CMP_FN) return sense(applied.value === true, owner);
        if (name === VAR_GET_FN) return applied.value;
        if (actions >= maxActions) throw new ActionLimitSignal();
        actions++;
        const id = String(args[0]);
        if (applied.overflow === true) {
          events.push({ type: 'var', blockId: owner, id, value: vars[id] ?? 0, overflow: true });
          stop('crash', 'BOX_FULL');
        }
        vars = applied.vars;
        events.push({ type: 'var', blockId: owner, id, value: vars[id] ?? 0 });
        return undefined;
      },
    ]),
  );
  /** "Đếm đúng": the countGoal box holds this map's number (true without countGoal). */
  const countMet = (): boolean => {
    const goal = level.countGoal;
    return goal === undefined || vars[goal.var] === goal.equals[mapIndex];
  };

  let state: S | undefined;
  let result: RunResult;
  let reasonCode: ReasonCode | null = null;
  try {
    const ctx: SimContext<S, E> = {
      state: kind.createState(config, rng),
      emit,
      sense,
      stop,
      rng,
      level,
    };
    state = ctx.state;
    const api = kind.createApi(ctx);
    const missing = kind.blocks.flatMap((spec) => spec.apiNames).filter((name) => !(name in api));
    if (missing.length > 0) throw new Error(`createApi lacks ${missing.join(', ')}`);
    const interpreter = createInterpreter(code, { ...api, ...varApi }, rng, (blockId) => {
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
      const verdict = kind.evaluate(ctx.state, config);
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
        outcome: {
          ...errorOutcome('INTERNAL_ERROR', blocksUsed, describe(error)),
          events,
          stats: stats(),
        },
        state,
      };
    }
  }
  // countGoal (ADR-0022): judged after the kind's own verdict, on both ways to win (the program
  // ended and `evaluate` said yes, or the kind stopped it with a win mid-run): the box must hold
  // the number at the moment of the win.
  if (result === 'success' && level.mode !== 'creative' && !countMet()) {
    result = 'incomplete';
    reasonCode = 'WRONG_COUNT';
  }
  const outcome: MapOutcome<E> = { result, reasonCode, events, stats: stats() };
  if (level.variables !== undefined) outcome.vars = { ...vars };
  if (level.starGoals !== undefined && state !== undefined) {
    // A kind without `checkStarGoal` meets no goal; content:check rule 19 reports the level.
    const finalState = state;
    try {
      outcome.goals = level.starGoals.map(
        (goal) => kind.checkStarGoal?.(goal, finalState, config) ?? false,
      );
    } catch (error) {
      return {
        outcome: {
          ...errorOutcome('INTERNAL_ERROR', blocksUsed, describe(error)),
          events,
          stats: stats(),
        },
        state,
      };
    }
  }
  return { outcome, state };
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
