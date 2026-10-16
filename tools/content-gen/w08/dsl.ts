// World 8 generator library (P4-10 / P4-11): a short program notation, the workspace builder,
// engine runs and the R5 search. Run every script from the repo root (tools/content-gen/README.md).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Level, LevelProcedure, ToolboxEntry, WorkspaceJson } from '@codequest/content-schema';
import { runLevel, type RunOutcome } from '@codequest/engine';
import { getGameKind, resolveLevelConfigs, robotlabRulesSchema } from '@codequest/games';
import { findShortestPrograms } from '@codequest/validator';

export const shared = {
  robotlab: robotlabRulesSchema.parse(
    JSON.parse(readFileSync(resolve(process.cwd(), 'content/shared/robotlab.json'), 'utf8')),
  ),
};

/** Sensors: maze `có đường` (LEFT/RIGHT/AHEAD), robot colour and `đã về phòng thí nghiệm?`. */
export type Ask = 'LEFT' | 'RIGHT' | 'AHEAD' | 'RED' | 'YELLOW' | 'GREEN' | 'LAB';
/**
 * One statement. Maze: `F` tiến, `L` / `R` rẽ. Robot: `f3` tiến 3 ô, `L` / `R`, `G` gắp, `T` thả.
 * `{ call }` làm phép, `{ calln, n }` làm phép … với n, `{ rep }` lặp n lần, `{ rv }` lặp [hộp] lần,
 * `{ until }` lặp đến khi.
 */
export type Item =
  | string
  | { call: string }
  | { calln: string; n: number }
  | { rep: number; b: Item[] }
  | { rv: string; b: Item[] }
  | { until: Ask; b: Item[] };
export interface Prog {
  main: Item[];
  defs?: Record<string, Item[]>;
  /** Spell id → its box id (spells with a box). */
  params?: Record<string, string>;
}
export type Kind = 'maze' | 'robotlab';

const sensor = (ask: Ask, id: string): Record<string, unknown> => {
  if (ask === 'LEFT' || ask === 'RIGHT' || ask === 'AHEAD') {
    return { type: 'maze_is_path', id, fields: { DIR: ask } };
  }
  if (ask === 'LAB') return { type: 'robot_at_lab', id };
  return { type: 'robot_block_color', id, fields: { COLOR: ask } };
};
const MAZE: Readonly<Record<string, string>> = {
  F: 'maze_forward',
  L: 'maze_turn_left',
  R: 'maze_turn_right',
};
const ROBOT: Readonly<Record<string, string>> = {
  L: 'robot_turn_left',
  R: 'robot_turn_right',
  G: 'robot_grab',
  T: 'robot_release',
};

const isCall = (item: Item): item is { call: string } | { calln: string; n: number } =>
  typeof item === 'object' && ('call' in item || 'calln' in item);

/** Blocks the child places: sensors count, `dạy phép` blocks and their bodies count. */
export function size(p: Prog): number {
  const n = (items: Item[]): number =>
    items.reduce((sum, item) => {
      if (typeof item === 'string' || isCall(item)) return sum + 1;
      if ('until' in item) return sum + 2 + n(item.b);
      return sum + 1 + n(item.b);
    }, 0);
  return n(p.main) + Object.values(p.defs ?? {}).reduce((sum, body) => sum + 1 + n(body), 0);
}

/** Every spell call inlined (a box loop of a call with n becomes `lặp n lần`), no `dạy phép`. */
export function expand(p: Prog): Item[] {
  const sub = (items: Item[], box?: { id: string; n: number }): Item[] =>
    items.flatMap((item): Item[] => {
      if (typeof item === 'string') return [item];
      if ('call' in item) return sub(p.defs?.[item.call] ?? []);
      if ('calln' in item) {
        return sub(p.defs?.[item.calln] ?? [], { id: p.params?.[item.calln] ?? '', n: item.n });
      }
      if ('rv' in item && box !== undefined && item.rv === box.id) {
        if (box.n === 0) return [];
        return box.n === 1 ? sub(item.b, box) : [{ rep: box.n, b: sub(item.b, box) }];
      }
      if ('until' in item) return [{ until: item.until, b: sub(item.b, box) }];
      if ('rep' in item) return [{ rep: item.rep, b: sub(item.b, box) }];
      return [{ rv: item.rv, b: sub(item.b, box) }];
    });
  return sub(p.main);
}

/** Every `lặp n lần` written out (sensor loops stay). */
export function unroll(items: Item[]): Item[] {
  return items.flatMap((item): Item[] => {
    if (typeof item === 'object' && 'rep' in item) {
      return Array.from({ length: item.rep }, () => unroll(item.b)).flat();
    }
    if (typeof item === 'object' && 'until' in item)
      return [{ until: item.until, b: unroll(item.b) }];
    return [item];
  });
}

type BlockJson = Record<string, unknown>;

/** Block-id prefix per type, so ids read well in hints and tests. */
const ID_PREFIX: Readonly<Record<string, string>> = {
  maze_forward: 'fwd',
  maze_turn_left: 'left',
  maze_turn_right: 'right',
  robot_forward: 'go',
  robot_turn_left: 'left',
  robot_turn_right: 'right',
  robot_grab: 'grab',
  robot_release: 'drop',
  cq_proc_call: 'cast',
  cq_proc_call_n: 'cast',
  cq_repeat: 'loop',
  cq_repeat_var: 'boxloop',
  cq_repeat_until: 'until',
};

/** Builds one stack per item list; `x`, `y` place top blocks. */
export class Builder {
  private counts = new Map<string, number>();
  constructor(private readonly kind: Kind) {}

  private nextId(type: string): string {
    const prefix = ID_PREFIX[type] ?? 'b';
    const n = (this.counts.get(prefix) ?? 0) + 1;
    this.counts.set(prefix, n);
    return `${prefix}${String(n)}`;
  }

  /** One block (and its inner stacks). */
  block(item: Item): BlockJson {
    if (typeof item === 'string') {
      if (this.kind === 'robotlab' && item.startsWith('f')) {
        const type = 'robot_forward';
        return { type, id: this.nextId(type), fields: { N: Number(item.slice(1)) } };
      }
      const type = (this.kind === 'maze' ? MAZE : ROBOT)[item];
      if (type === undefined) throw new Error(`unknown item ${item}`);
      return { type, id: this.nextId(type) };
    }
    if ('call' in item) {
      const type = 'cq_proc_call';
      return { type, id: this.nextId(type), fields: { PROC: item.call } };
    }
    if ('calln' in item) {
      const type = 'cq_proc_call_n';
      return { type, id: this.nextId(type), fields: { PROC: item.calln, NUM: item.n } };
    }
    const inputs: Record<string, unknown> = {};
    if ('until' in item) {
      const type = 'cq_repeat_until';
      const id = this.nextId(type);
      inputs['COND'] = { block: sensor(item.until, `${id}c`) };
      const body = this.chain(item.b);
      if (body) inputs['DO'] = { block: body };
      return { type, id, inputs };
    }
    const type = 'rep' in item ? 'cq_repeat' : 'cq_repeat_var';
    const id = this.nextId(type);
    const body = this.chain(item.b);
    if (body) inputs['DO'] = { block: body };
    return 'rep' in item
      ? { type, id, fields: { TIMES: item.rep }, inputs }
      : { type, id, fields: { VAR: item.rv }, inputs };
  }

  /** A stack of blocks joined by `next`. */
  chain(list: Item[]): BlockJson | undefined {
    const blocks = list.map((item) => this.block(item));
    blocks.forEach((b, i) => {
      const next = blocks[i + 1];
      if (next) b['next'] = { block: next };
    });
    return blocks[0];
  }
}

/** `cq_start` (not deletable) with the main stack under it. */
export function startBlock(b: Builder, main: Item[]): BlockJson {
  const start: BlockJson = { type: 'cq_start', id: 'start', x: 40, y: 40, deletable: false };
  const body = b.chain(main);
  if (body) start['next'] = { block: body };
  return start;
}

/** `dạy phép` (or `dạy phép … với hộp`) block of spell `id`, with `body` (may be empty). */
export function defBlock(p: Prog, id: string, body: Item[], b: Builder, index: number): BlockJson {
  const box = p.params?.[id];
  const def: BlockJson = {
    type: box === undefined ? 'cq_proc_def' : 'cq_proc_def_n',
    id: `def_${id}`,
    x: 380,
    y: 40 + index * 220,
    // The box name on `dạy phép … với hộp` is a label read from `procedures` (not saved).
    fields: { PROC: id },
  };
  const inner = b.chain(body);
  if (inner) def['inputs'] = { BODY: { block: inner } };
  return def;
}

/** The whole program as a workspace: `cq_start` stack plus one `dạy phép` per spell. */
export function workspace(kind: Kind, p: Prog): WorkspaceJson {
  const b = new Builder(kind);
  const start = startBlock(b, p.main);
  const defs = Object.entries(p.defs ?? {}).map(([id, body], i) => defBlock(p, id, body, b, i));
  return { blocks: { languageVersion: 0, blocks: [start, ...defs] } } as WorkspaceJson;
}

/** What a level needs for an engine run (the generator fills the rest). */
export interface Design {
  id: string;
  kind: Kind;
  mode: Level['mode'];
  stage: Level['stage'];
  maps: unknown[];
  toolbox: ToolboxEntry[];
  procedures?: LevelProcedure[];
  maxBlocks?: number;
  maxInstances?: Record<string, number>;
  solution: Prog;
  /** Wrong programs (traps): the generator checks each one loses. */
  wrong?: Array<{ name: string; prog: Prog }>;
}

/** A bare level of a design (for engine runs and searches). */
export function levelOf(d: Design, mode: Level['mode'] = 'build'): Level {
  const [config, ...variants] = d.maps;
  return {
    id: d.id,
    worldId: 'w08-xuong-phep-thuat',
    stage: 'practice',
    kind: d.kind,
    mode,
    title: 'probe',
    objective: 'probe',
    learningGoal: 'probe',
    toolbox: d.toolbox,
    hints: [],
    maxLoopDepth: 1,
    ...(d.maxInstances === undefined ? {} : { maxInstances: d.maxInstances }),
    ...(d.procedures === undefined ? {} : { procedures: d.procedures }),
    config,
    ...(variants.length > 0 && mode !== 'predict' ? { variants } : {}),
  };
}

function kindOf(d: Design) {
  const kind = getGameKind(d.kind);
  if (!kind) throw new Error(`no game kind ${d.kind}`);
  return kind;
}

/** Runs `p` (real spell blocks) on every map of `d`, without the block cap. */
export function play(d: Design, p: Prog): RunOutcome {
  const level = resolveLevelConfigs(levelOf(d), shared);
  return runLevel({ kind: kindOf(d), level, workspace: workspace(d.kind, p) });
}

/** Predict answer key of `p` on map `map` of `d`. */
export function keyOn(d: Design, p: Prog, map = 0): string | undefined {
  const ws = workspace(d.kind, p);
  const base = levelOf({ ...d, maps: [d.maps[map]] }, 'predict');
  const level = resolveLevelConfigs({ ...base, initialWorkspace: ws }, shared);
  return runLevel({ kind: kindOf(d), level, workspace: ws }).answerKey;
}

/** Seconds of a robot run: the last event time. */
export const seconds = (o: RunOutcome): number =>
  Math.max(0, ...o.events.map((e) => (e as { t?: number }).t ?? 0));

/**
 * R5 search: no spell blocks (and no spell box loop) in the toolbox, up to `maxSize` blocks.
 * `extraToolbox` adds blocks (the loop check adds `cq_repeat`); `capped` keeps `maxInstances`.
 */
export function r5(
  d: Design,
  opts: { maxSize: number; seconds?: number; extraToolbox?: string[]; capped?: boolean },
) {
  const boxes = new Set((d.procedures ?? []).flatMap((p) => (p.param ? [p.param.id] : [])));
  const toolbox = d.toolbox.filter((entry) => {
    const type = typeof entry === 'string' ? entry : entry.type;
    const fields = typeof entry === 'string' ? undefined : entry.fields;
    const box = (fields as { VAR?: string } | undefined)?.VAR;
    return !type.startsWith('cq_proc') && !(box !== undefined && boxes.has(box));
  });
  const instances = Object.fromEntries(
    Object.entries(d.maxInstances ?? {}).filter(([type]) => !type.startsWith('cq_proc')),
  );
  const keep = opts.capped !== false && Object.keys(instances).length > 0;
  const base = levelOf({ ...d, toolbox: [...toolbox, ...(opts.extraToolbox ?? [])] });
  const level = resolveLevelConfigs(
    { ...base, maxInstances: keep ? instances : undefined },
    shared,
  );
  const until = Date.now() + (opts.seconds ?? 120) * 1000;
  const t0 = Date.now();
  const res = findShortestPrograms(level, {
    maxSize: opts.maxSize,
    maxWork: 300_000_000,
    shouldStop: () => Date.now() > until,
  });
  return { ...res, ms: Date.now() - t0 };
}

/** Maze cells a spell-free program visits (spells inlined), from (0,0). */
export function trace(
  start: [number, number],
  dir: string,
  items: Item[],
): Array<[number, number]> {
  const steps: Record<string, [number, number]> = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
  const order = ['N', 'E', 'S', 'W'];
  let [r, c] = start;
  let d = dir;
  const cells: Array<[number, number]> = [[r, c]];
  const run = (list: Item[]): void => {
    for (const item of list) {
      if (item === 'F') {
        const [dr, dc] = steps[d] ?? [0, 0];
        r += dr;
        c += dc;
        cells.push([r, c]);
      } else if (item === 'L') d = order[(order.indexOf(d) + 3) % 4] ?? d;
      else if (item === 'R') d = order[(order.indexOf(d) + 1) % 4] ?? d;
      else if (typeof item === 'object' && 'rep' in item) {
        for (let i = 0; i < item.rep; i++) run(item.b);
      } else throw new Error(`trace: ${JSON.stringify(item)}`);
    }
  };
  run(items);
  return cells;
}
