/**
 * Fast replay of straight-line programs on a game kind's real simulation (createState,
 * createApi, evaluate), with every reached state interned and every (state, block) step
 * memoized. What each block calls is recorded once by compiling and running it with the real
 * engine, so the generators stay the single source of truth. Results that matter are always
 * re-checked with `runLevel` (shortest.ts, fixes.ts), which also applies maxSteps / maxActions.
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
 * Assumptions (game-kind-sdk.md §"Vét cạn"), enforced where possible:
 * - a statement block's API calls depend only on the block (its fields), never on sensor
 *   results: a statement block whose code calls a value block's API is unsupported;
 * - the state after a call does not depend on the block id (checked by recording each block
 *   under two ids); ids may only go into events;
 * - the API never uses `ctx.rng` (randomness only in `createState`): a call to it throws
 *   `UnsearchableLevel`;
 * - the state is plain data (objects, arrays, Set, Map, primitives) that `structuredClone`
 *   copies and `stateKey` compares.
 */
import type { Level, ToolboxEntry } from '@codequest/content-schema';
import {
  CQ_REPEAT,
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
import { programToWorkspace, type Program, type Statement } from './program';

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

/** A program with atoms as indices into `FastSim.atoms`. */
export type Code = ReadonlyArray<number | RepeatCode>;
export interface RepeatCode {
  times: number;
  body: Code;
}

/** A toolbox block a program can use as a plain statement. */
export interface Atom {
  statement: Statement & { block: string };
  calls: ReadonlyArray<{ name: string; args: Primitive[] }>;
  /** False for blocks that only appear in `initialWorkspace` (bughunt): keep or delete only. */
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

/** Why a toolbox entry cannot be searched, or null when it is a plain statement block. */
function unsupportedReason(kind: AnyGameKindDefinition, type: string): string | null {
  const spec = kind.blocks.find((block) => block.type === type);
  if (spec === undefined) return 'not a block of this game kind';
  if (spec.json.output !== undefined) return 'value block (needs a condition block)';
  const inputs = (spec.json.args0 ?? []).filter((arg) => String(arg['type']).startsWith('input_'));
  if (inputs.some((arg) => arg['type'] !== 'input_dummy')) return 'has inputs';
  return null;
}

/**
 * Field values to try for a statement block: the toolbox entry's own fields, plus every
 * option of each `field_dropdown` the entry leaves open (one atom per combination). Other
 * open fields keep their Blockly default.
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

export class FastSim {
  readonly kind: AnyGameKindDefinition;
  readonly level: Level;
  /** Searchable toolbox blocks, in toolbox order. */
  readonly atoms: Atom[] = [];
  /** Toolbox entries the search cannot use, with the reason. */
  readonly unsupported: string[] = [];
  /** Whether the toolbox offers `cq_repeat`. */
  readonly hasRepeat: boolean;
  readonly initial: number;
  /** Atom steps computed so far (each one runs the real API once). */
  steps = 0;

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
  ) {
    this.kind = kind;
    this.level = level;
    this.maps = [level.config, ...(level.variants ?? [])].map(
      (config) => new MapSim(this, { ...level, config }, kind.configSchema.parse(config)),
    );
    this.initial =
      this.maps.length === 1
        ? this.firstMap.initial
        : this.internTuple(Int32Array.from(this.maps, (map) => map.initial));

    let hasRepeat = false;
    const seen = new Set<string>();
    const entries: Array<[ToolboxEntry | Statement, boolean]> = [
      ...level.toolbox.map((entry): [ToolboxEntry, boolean] => [entry, true]),
      ...extraBlocks.map((entry): [Statement, boolean] => [entry, false]),
    ];
    for (const [entry, inToolbox] of entries) {
      if (typeof entry !== 'string' && 'repeat' in entry) continue;
      const type = typeof entry === 'string' ? entry : 'type' in entry ? entry.type : entry.block;
      if (type === CQ_REPEAT) {
        hasRepeat = true;
        continue;
      }
      const reason = unsupportedReason(kind, type);
      if (reason !== null) {
        this.unsupported.push(`${type}: ${reason}`);
        continue;
      }
      const given = typeof entry === 'string' ? undefined : entry.fields;
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
    this.hasRepeat = hasRepeat;
  }

  private get firstMap(): MapSim {
    const map = this.maps[0];
    if (map === undefined) throw new Error('a level has at least one map');
    return map;
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

  /** Atom indices instead of block statements, or null if a block is not an atom. */
  compile(program: Program): Code | null {
    const out: Array<number | RepeatCode> = [];
    for (const statement of program) {
      if ('repeat' in statement) {
        const body = this.compile(statement.body);
        if (body === null) return null;
        out.push({ times: statement.repeat, body });
      } else {
        const atom = this.atomIndex(statement);
        if (atom === -1) return null;
        out.push(atom);
      }
    }
    return out;
  }

  /** Runs compiled code from a state (memoized per atom step only). */
  run(state: number, code: Code): number {
    let current = state;
    for (const item of code) {
      if (typeof item === 'number') {
        current = this.step(current, item);
      } else {
        for (let i = 0; i < item.times && current >= 0; i++) current = this.run(current, item.body);
      }
      if (current < 0) return current;
    }
    return current;
  }

  /** Whether compiled code of `size` blocks wins (empty code and code over maxBlocks lose). */
  wins(code: Code, size: number): boolean {
    if (code.length === 0) return false;
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

  /** Runs atom `atom`'s calls from a state of one map (used by `MapSim`). */
  compute(map: MapSim, state: unknown, atom: number): unknown {
    this.steps++;
    const calls = this.atoms[atom]?.calls ?? [];
    const stop = (result: 'success' | 'crash' | 'incomplete', reasonCode?: string): never => {
      throw new StopSignal(result, reasonCode ?? null);
    };
    const ctx: SimContext<unknown, GameEvent> = {
      state: structuredClone(state),
      emit: () => undefined,
      stop,
      rng: () => {
        throw new UnsearchableLevel(
          `unsearchable: the ${this.kind.id} API uses ctx.rng, so runs cannot be replayed`,
        );
      },
      level: map.level,
    };
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

  /**
   * The API calls one block makes, recorded by running it alone with the real engine under two
   * block ids. Throws `UnsupportedBlock` when it calls a sensor or its effect depends on the id.
   */
  private record(statement: Statement): Atom['calls'] {
    const sensors = new Set(
      this.kind.blocks.filter((spec) => spec.json.output !== undefined).flatMap((s) => s.apiNames),
    );
    const [first, second] = RECORD_IDS.map((id) => this.recordAs(statement, id, sensors));
    if (first === undefined || second === undefined) throw new UnsupportedBlock('not recorded');
    const names = (calls: Atom['calls']): string => calls.map((call) => call.name).join(',');
    if (names(first) !== names(second) || this.probe(first) !== this.probe(second)) {
      throw new UnsupportedBlock('its effect depends on the block id');
    }
    return first;
  }

  private recordAs(statement: Statement, id: string, sensors: ReadonlySet<string>): Atom['calls'] {
    const calls: Array<{ name: string; args: Primitive[] }> = [];
    const names = this.kind.blocks.flatMap((spec) => spec.apiNames);
    const recorder: GameKindApi = Object.fromEntries(
      names.map((name) => [
        name,
        (...args: Primitive[]) => {
          if (sensors.has(name)) throw new Error(`calls the sensor ${name}`);
          calls.push({ name, args });
          return undefined;
        },
      ]),
    );
    const workspace = programToWorkspace([statement]);
    const start = workspace.blocks.blocks[0] as { next?: { block: { id: string } } };
    if (start.next !== undefined) start.next.block.id = id;
    // One map is enough to record the calls (variants would record them once per map).
    const level: Level = { ...this.level, mode: 'creative' };
    delete level.variants;
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
 * The states of one map, interned (ids count per map), with every (state, atom) step and every
 * final verdict memoized. The API calls themselves run in `FastSim.compute`.
 */
class MapSim {
  readonly initial: number;
  private readonly snapshots: unknown[] = [];
  private readonly ids = new Map<string, number>();
  private readonly transitions: Int32Array[] = [];
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
