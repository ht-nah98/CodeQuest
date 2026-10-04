/**
 * Fast replay of programs on a game kind's real simulation (createState, createApi, evaluate),
 * with every reached state interned and every (state, block) step memoized. What each block
 * calls is recorded once by compiling and running it with the real engine, so the generators
 * stay the single source of truth. Results that matter are always re-checked with `runLevel`
 * (shortest.ts, fixes.ts), which also applies maxSteps / maxActions.
 *
 * Conditions (P2-11, ADR-0018): a sensor block is recorded the same way (its one API call,
 * inside a `cq_if`), and its answer is computed by calling the real API on a copy of the state,
 * memoized per (state, sensor). So `cq_if`, `cq_if_else` and `cq_repeat_until` are interpreted
 * per map: each map takes its own branch. A `cq_repeat_until` whose state comes back to a state
 * it already asked from never stops (the engine ends it with TIMEOUT), and one that runs more
 * passes than `maxActions` would time out too (each question is a `sense` action): both lose.
 * An empty condition slot loses (the engine refuses it: EMPTY_CONDITION).
 *
 * A level with `starGoals` (P2-21) only counts a win that meets every goal on its map: a win
 * that misses one is a loss here, so the shortest "win" is the par under goals. Search the
 * level without `starGoals` for plain wins. Goals are judged with `kind.checkStarGoal` on the
 * final state, so they must depend on the state only (game-kind-sdk.md §4).
 *
 * A level with `variants` (P2-12) is searched on every map at once: a search state is the tuple
 * of the per-map states, a program wins when it wins every map and loses as soon as one map is
 * lost. A level with one map uses its map's states directly (no tuple layer).
 *
 * Assumptions (game-kind-sdk.md §4), enforced where possible:
 * - a statement block's API calls depend only on the block (its fields), never on sensor
 *   results: a statement block whose code calls a value block's API is unsupported;
 * - a sensor block makes exactly one API call, which returns a boolean and does not change the
 *   state (else the level is unsearchable);
 * - the state after a call does not depend on the block id (checked by recording each block
 *   under two ids); ids may only go into events;
 * - the API never uses `ctx.rng` (randomness only in `createState`): a call to it throws
 *   `UnsearchableLevel`;
 * - the state is plain data (objects, arrays, Set, Map, primitives) that `structuredClone`
 *   copies and `stateKey` compares.
 */
import type { Level, ToolboxEntry } from '@codequest/content-schema';
import {
  COND_INPUT,
  CQ_IF,
  CQ_IF_ELSE,
  CQ_REPEAT,
  CQ_REPEAT_UNTIL,
  DEFAULT_MAX_ACTIONS,
  fnv1a,
  mulberry32,
  runLevel,
  StopSignal,
  type AnyGameKindDefinition,
  type GameKindApi,
  type Primitive,
  type SimContext,
} from '@codequest/engine';
import type { GameEvent } from '@codequest/engine';
import { SearchAborted } from './budget';
import { programToWorkspace, type Condition, type Program, type Statement } from './program';

/** Step outcome: a state id (≥ 0) while the program runs, or one of these. */
export const WIN = -1;
export const LOSS = -2;
/**
 * Most tuple states a multi-map search keeps (one small Int32Array and its key each, about
 * 100 bytes): past it the search stops like a spent budget (`SearchAborted`, so the result says
 * `complete: false`), instead of running the Web Worker or the CLI out of memory.
 */
export const MAX_TUPLE_STATES = 1_000_000;

/** Not computed yet, in the transition tables. */
const UNKNOWN = -3;

/** What `FastSim.compute` returns instead of a state when the run stopped. */
const WIN_STATE = Symbol('win');
const LOSS_STATE = Symbol('loss');

/** Condition index of an empty slot in compiled code. */
export const EMPTY_SLOT = -1;

/** A program with atoms and sensors as indices into `FastSim.atoms` / `FastSim.conds`. */
export type Code = readonly CodeItem[];
export type CodeItem = number | RepeatCode | IfCode | UntilCode;
export interface RepeatCode {
  times: number;
  body: Code;
}
/** `cq_if` (`else` null) or `cq_if_else` (`else` a list, maybe empty). */
export interface IfCode {
  cond: number;
  then: Code;
  else: Code | null;
}
export interface UntilCode {
  until: number;
  body: Code;
}

/** Control blocks the search builds programs from (when the toolbox offers them). */
export const CONTROL_TYPES: readonly string[] = [CQ_REPEAT, CQ_IF, CQ_IF_ELSE, CQ_REPEAT_UNTIL];

/** A toolbox block a program can use as a plain statement. */
export interface Atom {
  statement: Statement & { block: string };
  calls: ReadonlyArray<{ name: string; args: Primitive[] }>;
  /** False for blocks that only appear in `initialWorkspace` (bughunt): keep or delete only. */
  inToolbox: boolean;
}

/** A toolbox sensor block (with its field values) a condition slot can hold. */
export interface Cond {
  condition: Condition;
  call: { name: string; args: Primitive[] };
  /** False for sensors that only appear in `initialWorkspace` (bughunt): keep or delete only. */
  inToolbox: boolean;
}

/** The game kind breaks an assumption of the search (see the header of sim.ts). */
export class UnsearchableLevel extends Error {
  override name = 'UnsearchableLevel';
}

/** Recording a block failed for a reason that makes the block unsupported. */
class UnsupportedBlock extends Error {}

const RECORD_IDS = ['b1', 'zz9'] as const;

/** Stable text of a state: object keys sorted, Set and Map contents sorted. */
export function stateKey(value: unknown): string {
  if (value instanceof Set) {
    return `S[${[...(value as Set<unknown>)].map(stateKey).sort().join(',')}]`;
  }
  if (value instanceof Map) {
    const entries = [...(value as Map<unknown, unknown>)].map(
      ([key, item]) => `${stateKey(key)}:${stateKey(item)}`,
    );
    return `M[${entries.sort().join(',')}]`;
  }
  if (Array.isArray(value)) return `[${value.map(stateKey).join(',')}]`;
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${key}:${stateKey(record[key])}`).join(',')}}`;
  }
  return value === undefined ? 'u' : JSON.stringify(value);
}

/** Why a toolbox entry cannot be searched as a statement, or null when it is a plain one. */
function unsupportedReason(kind: AnyGameKindDefinition, type: string): string | null {
  const spec = kind.blocks.find((block) => block.type === type);
  if (spec === undefined) return 'not a block of this game kind';
  const inputs = (spec.json.args0 ?? []).filter((arg) => String(arg['type']).startsWith('input_'));
  if (inputs.some((arg) => arg['type'] !== 'input_dummy')) return 'has inputs';
  return null;
}

/**
 * Field values to try for a block: the toolbox entry's own fields, plus every option of each
 * `field_dropdown` the entry leaves open (one atom or sensor per combination). Other open
 * fields keep their Blockly default.
 */
function dropdownChoices(
  kind: AnyGameKindDefinition,
  type: string,
  given: Readonly<Record<string, unknown>> | undefined,
): Array<Readonly<Record<string, unknown>> | undefined> {
  const spec = kind.blocks.find((block) => block.type === type);
  let choices: Array<Record<string, unknown> | undefined> = [
    given === undefined ? undefined : { ...given },
  ];
  for (const arg of spec?.json.args0 ?? []) {
    const name = arg['name'];
    const options = arg['options'];
    if (arg['type'] !== 'field_dropdown' || typeof name !== 'string' || !Array.isArray(options)) {
      continue;
    }
    if (given !== undefined && name in given) continue;
    const values = options
      .map((option: unknown) => (Array.isArray(option) ? (option[1] as unknown) : undefined))
      .filter((value): value is string => typeof value === 'string');
    choices = choices.flatMap((fields) => values.map((value) => ({ ...fields, [name]: value })));
  }
  return choices;
}

/**
 * Whether compiled code has an empty condition slot anywhere, reached or not: `runLevel` then
 * refuses the whole program (EMPTY_CONDITION), so it can never win.
 */
export function hasEmptySlot(code: Code): boolean {
  return code.some((item) => {
    if (typeof item === 'number') return false;
    if ('times' in item) return hasEmptySlot(item.body);
    if ('until' in item) return item.until === EMPTY_SLOT || hasEmptySlot(item.body);
    return item.cond === EMPTY_SLOT || hasEmptySlot(item.then) || hasEmptySlot(item.else ?? []);
  });
}

/** Whether a compiled statement is a control block (not a plain atom). */
export function isCompound(item: CodeItem): item is RepeatCode | IfCode | UntilCode {
  return typeof item !== 'number';
}

export class FastSim {
  readonly kind: AnyGameKindDefinition;
  readonly level: Level;
  /** Searchable toolbox blocks, in toolbox order. */
  readonly atoms: Atom[] = [];
  /** Searchable sensor blocks (one per dropdown choice), in toolbox order. */
  readonly conds: Cond[] = [];
  /** Toolbox entries the search cannot use, with the reason. */
  readonly unsupported: string[] = [];
  /** Control blocks the toolbox offers (`cq_repeat`, `cq_if`, `cq_if_else`, `cq_repeat_until`). */
  readonly controls: ReadonlySet<string>;
  /** Whether the toolbox offers `cq_repeat`. */
  readonly hasRepeat: boolean;
  readonly initial: number;
  /** Atom steps computed so far (each one runs the real API once). */
  steps = 0;
  /** Passes after which a `cq_repeat_until` counts as never stopping (its questions alone time out). */
  readonly untilCap: number;

  /** One per map: `config`, then each variant. */
  private readonly maps: MapSim[];
  // Multi-map levels only: tuples of per-map states (WIN for a map already won).
  private readonly tuples: Int32Array[] = [];
  private readonly tupleIds = new Map<string, number>();
  private readonly transitions: Int32Array[] = [];
  private readonly finals: Array<boolean | undefined> = [];

  constructor(
    kind: AnyGameKindDefinition,
    level: Level,
    extraBlocks: readonly Statement[] = [],
    /** Cap on tuple states (tests lower it). */
    private readonly maxTupleStates = MAX_TUPLE_STATES,
    /** Sensors of `initialWorkspace` (bughunt) that the toolbox may not offer. */
    extraConditions: readonly Condition[] = [],
  ) {
    this.kind = kind;
    this.level = level;
    this.untilCap = level.limits?.maxActions ?? DEFAULT_MAX_ACTIONS;
    this.maps = [level.config, ...(level.variants ?? [])].map(
      (config) => new MapSim(this, { ...level, config }, kind.configSchema.parse(config)),
    );
    this.initial =
      this.maps.length === 1
        ? this.firstMap.initial
        : this.internTuple(Int32Array.from(this.maps, (map) => map.initial));

    const controls = new Set<string>();
    const seen = new Set<string>();
    const entries: Array<[ToolboxEntry | Statement, boolean, boolean]> = [
      ...level.toolbox.map((entry): [ToolboxEntry, boolean, boolean] => [entry, true, false]),
      ...extraBlocks.map((entry): [Statement, boolean, boolean] => [entry, false, false]),
      ...extraConditions.map((entry): [Statement, boolean, boolean] => [entry, false, true]),
    ];
    for (const [entry, inToolbox, asCondition] of entries) {
      if (typeof entry !== 'string' && ('repeat' in entry || 'if' in entry || 'until' in entry)) {
        continue;
      }
      const type = typeof entry === 'string' ? entry : 'type' in entry ? entry.type : entry.block;
      if (CONTROL_TYPES.includes(type)) {
        if (inToolbox) controls.add(type);
        continue;
      }
      const spec = kind.blocks.find((block) => block.type === type);
      const given = typeof entry === 'string' ? undefined : entry.fields;
      if (asCondition || spec?.json.output !== undefined) {
        this.addConditions(type, given, inToolbox);
        continue;
      }
      const reason = unsupportedReason(kind, type);
      if (reason !== null) {
        this.unsupported.push(`${type}: ${reason}`);
        continue;
      }
      for (const fields of dropdownChoices(kind, type, given)) {
        const statement = fields === undefined ? { block: type } : { block: type, fields };
        const key = stateKey(statement);
        if (seen.has(key)) continue;
        seen.add(key);
        try {
          this.atoms.push({ statement, calls: this.record(statement), inToolbox });
        } catch (error) {
          if (!(error instanceof UnsupportedBlock)) throw error;
          this.unsupported.push(`${type}: ${error.message}`);
        }
      }
    }
    this.controls = controls;
    this.hasRepeat = controls.has(CQ_REPEAT);
  }

  /** Records a sensor block for every open dropdown choice (duplicates are skipped). */
  private addConditions(
    type: string,
    given: Readonly<Record<string, unknown>> | undefined,
    inToolbox: boolean,
  ): void {
    const spec = this.kind.blocks.find((block) => block.type === type);
    const inputs = (spec?.json.args0 ?? []).filter((arg) =>
      String(arg['type']).startsWith('input_'),
    );
    if (spec === undefined || inputs.some((arg) => arg['type'] !== 'input_dummy')) {
      const why = spec === undefined ? 'not a block of this game kind' : 'has inputs';
      this.unsupported.push(`${type}: ${why}`);
      return;
    }
    for (const fields of dropdownChoices(this.kind, type, given)) {
      const condition = fields === undefined ? { block: type } : { block: type, fields };
      if (this.condIndex(condition) !== -1) continue;
      try {
        this.conds.push({ condition, call: this.recordCondition(condition), inToolbox });
      } catch (error) {
        if (!(error instanceof UnsupportedBlock)) throw error;
        this.unsupported.push(`${type}: ${error.message}`);
      }
    }
  }

  private get firstMap(): MapSim {
    const map = this.maps[0];
    if (map === undefined) throw new Error('a level has at least one map');
    return map;
  }

  /** Number of maps (`config` plus variants). */
  get mapCount(): number {
    return this.maps.length;
  }

  /** Distinct simulation states reached so far. */
  get stateCount(): number {
    return this.maps.length === 1 ? this.firstMap.stateCount : this.tuples.length;
  }

  /** Index of the atom for a block statement, or -1. */
  atomIndex(statement: Statement): number {
    const key = stateKey(statement);
    return this.atoms.findIndex((atom) => stateKey(atom.statement) === key);
  }

  /** Index of the sensor for a condition, or -1. */
  condIndex(condition: Condition): number {
    const key = stateKey(condition);
    return this.conds.findIndex((cond) => stateKey(cond.condition) === key);
  }

  /** Outcome of running one atom from a state. */
  step(state: number, atom: number): number {
    if (this.maps.length === 1) return this.firstMap.step(state, atom);
    let row = this.transitions[state];
    if (row === undefined) {
      row = new Int32Array(this.atoms.length).fill(UNKNOWN);
      this.transitions[state] = row;
    }
    const known = row[atom] ?? UNKNOWN;
    if (known !== UNKNOWN) return known;
    const result = this.stepTuple(state, atom);
    row[atom] = result;
    return result;
  }

  /** Whether a program that ends (without a stop) in this state wins (on every map). */
  finish(state: number): boolean {
    if (this.maps.length === 1) return this.firstMap.finish(state);
    const known = this.finals[state];
    if (known !== undefined) return known;
    const tuple = this.tuples[state] ?? new Int32Array();
    const result = this.maps.every((map, index) => {
      const sub = tuple[index] ?? LOSS;
      return sub === WIN || (sub >= 0 && map.finish(sub));
    });
    this.finals[state] = result;
    return result;
  }

  /** Bit i set: map i still runs in this state (not won yet). */
  liveMask(state: number): number {
    if (this.maps.length === 1) return state >= 0 ? 1 : 0;
    const tuple = this.tuples[state] ?? new Int32Array();
    let mask = 0;
    tuple.forEach((sub, index) => {
      if (sub >= 0) mask |= 1 << index;
    });
    return mask;
  }

  /** Bit i set: map i still runs and sensor `cond` answers ✔ there. */
  trueMask(state: number, cond: number): number {
    if (this.maps.length === 1) return state >= 0 && this.firstMap.test(state, cond) ? 1 : 0;
    const tuple = this.tuples[state] ?? new Int32Array();
    let mask = 0;
    this.maps.forEach((map, index) => {
      const sub = tuple[index] ?? LOSS;
      if (sub >= 0 && map.test(sub, cond)) mask |= 1 << index;
    });
    return mask;
  }

  /** Atom indices and sensor indices instead of blocks, or null if a block is not searchable. */
  compile(program: Program): Code | null {
    const out: CodeItem[] = [];
    for (const statement of program) {
      if ('repeat' in statement) {
        const body = this.compile(statement.body);
        if (body === null) return null;
        out.push({ times: statement.repeat, body });
      } else if ('if' in statement || 'until' in statement) {
        const condition = 'if' in statement ? statement.if : statement.until;
        const cond = condition === null ? EMPTY_SLOT : this.condIndex(condition);
        if (cond === -1 && condition !== null) return null;
        const body = this.compile('if' in statement ? statement.then : statement.body);
        if (body === null) return null;
        if ('until' in statement) {
          out.push({ until: cond, body });
          continue;
        }
        const otherwise = statement.else === undefined ? null : this.compile(statement.else);
        if (statement.else !== undefined && otherwise === null) return null;
        out.push({ cond, then: body, else: otherwise });
      } else {
        const atom = this.atomIndex(statement);
        if (atom === -1) return null;
        out.push(atom);
      }
    }
    return out;
  }

  /** Runs compiled code from a state on every map still running. */
  run(state: number, code: Code): number {
    let current = state;
    for (const item of code) {
      if (typeof item === 'number') {
        current = this.step(current, item);
      } else if ('times' in item) {
        for (let i = 0; i < item.times && current >= 0; i++) current = this.run(current, item.body);
      } else {
        current = this.runMasked(current, [item], this.liveMask(current));
      }
      if (current < 0) return current;
    }
    return current;
  }

  /**
   * Runs compiled code only on the maps of `mask` (bit i = map i), leaving the others as they
   * are: how one branch of a top-level `cq_if` acts on a multi-map state. LOSS as soon as one
   * map is lost, WIN when every map is won.
   */
  runMasked(state: number, code: Code, mask: number): number {
    if (this.maps.length === 1) return (mask & 1) === 0 ? state : this.firstMap.run(state, code);
    const tuple = this.tuples[state] ?? new Int32Array();
    const next = Int32Array.from(tuple);
    let running = false;
    for (const [index, map] of this.maps.entries()) {
      const sub = tuple[index] ?? LOSS;
      if (sub >= 0 && (mask & (1 << index)) !== 0) {
        const result = map.run(sub, code);
        if (result === LOSS) return LOSS;
        next[index] = result;
      }
      if ((next[index] ?? LOSS) !== WIN) running = true;
    }
    return running ? this.internTuple(next) : WIN;
  }

  /**
   * Whether compiled code of `size` blocks wins (empty code, code over maxBlocks and code with
   * an empty condition slot anywhere lose: the engine refuses the latter before running).
   */
  wins(code: Code, size: number): boolean {
    if (code.length === 0 || hasEmptySlot(code)) return false;
    if (this.level.maxBlocks !== undefined && size > this.level.maxBlocks) return false;
    const end = this.run(this.initial, code);
    return end === WIN || (end >= 0 && this.finish(end));
  }

  /** One atom on every map not won yet: LOSS as soon as one map is lost, WIN when all are won. */
  private stepTuple(state: number, atom: number): number {
    const tuple = this.tuples[state] ?? new Int32Array();
    const next = new Int32Array(tuple.length);
    let running = false;
    for (const [index, map] of this.maps.entries()) {
      const sub = tuple[index] ?? LOSS;
      const result = sub === WIN ? WIN : map.step(sub, atom);
      if (result === LOSS) return LOSS;
      next[index] = result;
      if (result !== WIN) running = true;
    }
    return running ? this.internTuple(next) : WIN;
  }

  private internTuple(tuple: Int32Array): number {
    const key = tuple.join(',');
    const known = this.tupleIds.get(key);
    if (known !== undefined) return known;
    const id = this.tuples.length;
    if (id >= this.maxTupleStates) {
      throw new SearchAborted(`more than ${String(this.maxTupleStates)} multi-map states`);
    }
    this.tuples.push(tuple);
    this.tupleIds.set(key, id);
    return id;
  }

  /** A sandbox context on a copy of `state` that turns rng use into `UnsearchableLevel`. */
  private context(map: MapSim, state: unknown): SimContext<unknown, GameEvent> {
    return {
      state: structuredClone(state),
      emit: () => undefined,
      sense: (value) => value,
      stop: (result: 'success' | 'crash' | 'incomplete', reasonCode?: string): never => {
        throw new StopSignal(result, reasonCode ?? null);
      },
      rng: () => {
        throw new UnsearchableLevel(
          `unsearchable: the ${this.kind.id} API uses ctx.rng, so runs cannot be replayed`,
        );
      },
      level: map.level,
    };
  }

  /** Runs atom `atom`'s calls from a state of one map (used by `MapSim`). */
  compute(map: MapSim, state: unknown, atom: number): unknown {
    this.steps++;
    const calls = this.atoms[atom]?.calls ?? [];
    const ctx = this.context(map, state);
    try {
      const api = this.kind.createApi(ctx);
      for (const call of calls) {
        const fn = api[call.name];
        if (fn === undefined) return LOSS_STATE;
        fn(...call.args);
      }
    } catch (error) {
      if (error instanceof UnsearchableLevel) throw error;
      const won = error instanceof StopSignal && error.result === 'success';
      return won && this.meetsGoals(map, ctx.state) ? WIN_STATE : LOSS_STATE;
    }
    return ctx.state;
  }

  /** The answer of sensor `cond` in a state of one map (used by `MapSim`). */
  answer(map: MapSim, state: unknown, cond: number): boolean {
    const call = this.conds[cond]?.call;
    if (call === undefined) throw new Error(`no sensor ${String(cond)}`);
    const ctx = this.context(map, state);
    let value: unknown;
    try {
      const fn = this.kind.createApi(ctx)[call.name];
      if (fn === undefined) throw new UnsearchableLevel(`unsearchable: no API ${call.name}`);
      value = fn(...call.args);
    } catch (error) {
      if (error instanceof UnsearchableLevel) throw error;
      throw new UnsearchableLevel(`unsearchable: the sensor ${call.name} threw (${String(error)})`);
    }
    if (typeof value !== 'boolean') {
      throw new UnsearchableLevel(`unsearchable: the sensor ${call.name} returned ${typeof value}`);
    }
    if (stateKey(ctx.state) !== stateKey(state)) {
      throw new UnsearchableLevel(`unsearchable: the sensor ${call.name} changes the state`);
    }
    return value;
  }

  /** Whether a final state of one map meets every star goal (true without `starGoals`). */
  meetsGoals(map: MapSim, state: unknown): boolean {
    const goals = this.level.starGoals;
    if (goals === undefined) return true;
    return goals.every((goal) => this.kind.checkStarGoal?.(goal, state, map.config) ?? false);
  }

  /** Outcome key of replaying calls once from the initial state (for the block-id check). */
  private probe(calls: Atom['calls']): string {
    const index = this.atoms.length;
    this.atoms.push({ statement: { block: '?' }, calls, inToolbox: false });
    try {
      const map = this.firstMap;
      const result = map.computeStep(map.initial, index);
      return result < 0 ? String(result) : stateKey(map.snapshot(result));
    } finally {
      this.atoms.pop();
    }
  }

  /** API names of the kind's value (sensor) blocks. */
  private sensorNames(): Set<string> {
    return new Set(
      this.kind.blocks.filter((spec) => spec.json.output !== undefined).flatMap((s) => s.apiNames),
    );
  }

  /**
   * The API calls one block makes, recorded by running it alone with the real engine under two
   * block ids. Throws `UnsupportedBlock` when it calls a sensor or its effect depends on the id.
   */
  private record(statement: Statement): Atom['calls'] {
    const sensors = this.sensorNames();
    const [first, second] = RECORD_IDS.map((id) => this.recordAs([statement], id, sensors));
    if (first === undefined || second === undefined) throw new UnsupportedBlock('not recorded');
    const names = (calls: Atom['calls']): string => calls.map((call) => call.name).join(',');
    if (names(first) !== names(second) || this.probe(first) !== this.probe(second)) {
      throw new UnsupportedBlock('its effect depends on the block id');
    }
    return first;
  }

  /**
   * The one API call of a sensor block, recorded inside a `cq_if` under two block ids. Throws
   * `UnsupportedBlock` unless it makes exactly one call to a sensor API whose answer does not
   * depend on the id.
   */
  private recordCondition(condition: Condition): Cond['call'] {
    const sensors = this.sensorNames();
    const calls = RECORD_IDS.map((id) =>
      this.recordAs([{ if: condition, then: [] }], id, new Set(), COND_INPUT),
    );
    const [first, second] = calls.map((list) => list[0]);
    if (calls.some((list) => list.length !== 1) || first === undefined || second === undefined) {
      throw new UnsupportedBlock('a sensor must make exactly one API call');
    }
    if (!sensors.has(first.name) || first.name !== second.name) {
      throw new UnsupportedBlock(`calls ${first.name}, which is not a sensor API`);
    }
    const index = this.conds.length;
    const answers = [first, second].map((call) => {
      this.conds.push({ condition, call, inToolbox: false });
      try {
        return this.answer(this.firstMap, this.firstMap.snapshot(this.firstMap.initial), index);
      } finally {
        this.conds.pop();
      }
    });
    if (answers[0] !== answers[1]) throw new UnsupportedBlock('its answer depends on the block id');
    return first;
  }

  /**
   * Runs `program` once with a recording API and returns the calls made. The first block under
   * `cq_start` (or, with `input`, the block in that input of it) gets the id `id`.
   */
  private recordAs(
    program: Program,
    id: string,
    forbidden: ReadonlySet<string>,
    input?: string,
  ): Array<{ name: string; args: Primitive[] }> {
    const calls: Array<{ name: string; args: Primitive[] }> = [];
    const names = this.kind.blocks.flatMap((spec) => spec.apiNames);
    const recorder: GameKindApi = Object.fromEntries(
      names.map((name) => [
        name,
        (...args: Primitive[]) => {
          if (forbidden.has(name)) throw new Error(`calls the sensor ${name}`);
          calls.push({ name, args });
          return undefined;
        },
      ]),
    );
    const workspace = programToWorkspace(program);
    type Json = { id: string; inputs?: Record<string, { block: Json }>; next?: { block: Json } };
    const start = workspace.blocks.blocks[0] as Json;
    const first = start.next?.block;
    const target = input === undefined ? first : first?.inputs?.[input]?.block;
    if (target !== undefined) target.id = id;
    // One map is enough to record the calls (variants would record them once per map).
    const level: Level = { ...this.level, mode: 'creative' };
    delete level.variants;
    delete level.maxBlocks;
    const outcome = runLevel({
      kind: { ...this.kind, createApi: () => recorder },
      level,
      workspace,
    });
    if (outcome.result === 'error') {
      throw new UnsupportedBlock(
        `cannot be recorded (${outcome.debug?.message ?? outcome.reasonCode ?? ''})`,
      );
    }
    return calls;
  }
}

/**
 * The states of one map, interned (ids count per map), with every (state, atom) step, every
 * (state, sensor) answer and every final verdict memoized. The API calls themselves run in
 * `FastSim.compute` / `FastSim.answer`.
 */
class MapSim {
  readonly initial: number;
  private readonly snapshots: unknown[] = [];
  private readonly ids = new Map<string, number>();
  private readonly transitions: Int32Array[] = [];
  private readonly answers: Int8Array[] = [];
  private readonly finals: Array<boolean | undefined> = [];

  constructor(
    private readonly owner: FastSim,
    /** The level with this map as its `config` (what the API sees as `ctx.level`). */
    readonly level: Level,
    readonly config: unknown,
  ) {
    const rng = mulberry32(fnv1a(level.id));
    this.initial = this.intern(owner.kind.createState(config, rng));
  }

  get stateCount(): number {
    return this.snapshots.length;
  }

  snapshot(state: number): unknown {
    return this.snapshots[state];
  }

  step(state: number, atom: number): number {
    let row = this.transitions[state];
    if (row === undefined) {
      row = new Int32Array(this.owner.atoms.length).fill(UNKNOWN);
      this.transitions[state] = row;
    }
    const known = row[atom] ?? UNKNOWN;
    if (known !== UNKNOWN) return known;
    const result = this.computeStep(state, atom);
    row[atom] = result;
    return result;
  }

  /** Runs one atom from a state, without memo: WIN, LOSS or the interned next state. */
  computeStep(state: number, atom: number): number {
    const result = this.owner.compute(this, this.snapshots[state], atom);
    if (result === WIN_STATE) return WIN;
    if (result === LOSS_STATE) return LOSS;
    return this.intern(result);
  }

  /** The answer of sensor `cond` in a state (memoized). */
  test(state: number, cond: number): boolean {
    let row = this.answers[state];
    if (row === undefined) {
      row = new Int8Array(this.owner.conds.length).fill(-1);
      this.answers[state] = row;
    }
    const known = row[cond] ?? -1;
    if (known !== -1) return known === 1;
    const value = this.owner.answer(this, this.snapshots[state], cond);
    row[cond] = value ? 1 : 0;
    return value;
  }

  /**
   * Runs compiled code on this map: atoms through `step`, branches by the sensor's answer. A
   * `cq_repeat_until` that asks again from a state it already asked from, or runs more than
   * `untilCap` passes, never stops: LOSS (the engine's TIMEOUT). An empty slot is LOSS too.
   */
  run(state: number, code: Code): number {
    let current = state;
    for (const item of code) {
      if (typeof item === 'number') {
        current = this.step(current, item);
      } else if ('times' in item) {
        for (let i = 0; i < item.times && current >= 0; i++) current = this.run(current, item.body);
      } else if ('then' in item) {
        if (item.cond === EMPTY_SLOT) return LOSS;
        if (this.test(current, item.cond)) current = this.run(current, item.then);
        else if (item.else !== null) current = this.run(current, item.else);
      } else {
        if (item.until === EMPTY_SLOT) return LOSS;
        const asked = new Set<number>();
        while (current >= 0 && !this.test(current, item.until)) {
          if (asked.has(current) || asked.size >= this.owner.untilCap) return LOSS;
          asked.add(current);
          current = this.run(current, item.body);
        }
      }
      if (current < 0) return current;
    }
    return current;
  }

  finish(state: number): boolean {
    const known = this.finals[state];
    if (known !== undefined) return known;
    const snapshot = structuredClone(this.snapshots[state]);
    const result =
      this.level.mode === 'creative' ||
      (this.owner.kind.evaluate(snapshot, this.config).success &&
        this.owner.meetsGoals(this, snapshot));
    this.finals[state] = result;
    return result;
  }

  private intern(state: unknown): number {
    const key = stateKey(state);
    const known = this.ids.get(key);
    if (known !== undefined) return known;
    const id = this.snapshots.length;
    this.snapshots.push(structuredClone(state));
    this.ids.set(key, id);
    return id;
  }
}
