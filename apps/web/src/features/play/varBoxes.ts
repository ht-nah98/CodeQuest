import { type LevelVariable, variableMax, variableStart } from '@codequest/content-schema';
import { CQ_VAR_SET, type VarEvent } from '@codequest/engine';

// The "bảng hộp" next to the stage (ADR-0022 §6): what each box holds during a replay, rebuilt
// from the run's `var` events (never from `MapOutcome.vars`). Pure, so the panel is unit tested
// without React or a stage.

/** One box on the panel. */
export interface VarBox {
  id: string;
  /** The box's name for the child, e.g. "số măng". */
  name: string;
  max: number;
  value: number;
}

/**
 * The last change, for the panel's animation: `add` (a "+n" floats up, the number pops), `set`
 * (the old number drops out, the new one drops in), `full` (the box went over its max: red
 * shake), or a question about the box (`cq_var_compare`) answered `yes` / `no` (its border
 * lights ✔ / ✘ while the question block does). `seq` grows with every pulse, so the same
 * change twice still replays its animation.
 */
export interface VarPulse {
  id: string;
  kind: 'add' | 'set' | 'full' | 'yes' | 'no';
  /** The amount added (`add` only; 0 otherwise). */
  delta: number;
  seq: number;
}

export interface VarBoxesState {
  boxes: readonly VarBox[];
  pulse: VarPulse | null;
  /** The box that went over its max in this run, if any; stays red until the next reset. */
  full: string | null;
  /**
   * End of a counted run (`countGoal`, ADR-0022 §6): the counted box and the number this map
   * needed; `ok` when the box held it. Shown until the next reset.
   */
  verdict: VarVerdict | null;
}

export interface VarVerdict {
  id: string;
  need: number;
  ok: boolean;
}

/** How a block changes a box: `đặt` sets, `tăng` adds. */
export type VarOpKind = 'set' | 'add';

/** The op of a box block by its type (unknown blocks count as `add`, the common case). */
export function varOpOfBlockType(type: string | null | undefined): VarOpKind {
  return type === CQ_VAR_SET ? 'set' : 'add';
}

/** The panel at the start of map `mapIndex` (0 = `config`): each box's `start`, nothing lit. */
export function varBoxesAt(
  variables: readonly LevelVariable[] | undefined,
  mapIndex: number,
): VarBoxesState {
  return {
    boxes: (variables ?? []).map((variable) => ({
      id: variable.id,
      name: variable.name,
      max: variableMax(variable),
      value: variableStart(variable, mapIndex),
    })),
    pulse: null,
    full: null,
    verdict: null,
  };
}

/**
 * The panel after one `var` event. `op` says whether the block set or added (the event alone
 * cannot tell `đặt 3` from `tăng 3` on an empty box); without it a rise counts as `add`. An
 * event for a box the panel does not show changes nothing.
 */
export function applyVarEvent(
  state: VarBoxesState,
  event: Pick<VarEvent, 'id' | 'value' | 'overflow'>,
  op?: VarOpKind,
): VarBoxesState {
  const box = state.boxes.find((candidate) => candidate.id === event.id);
  if (box === undefined) return state;
  const seq = (state.pulse?.seq ?? 0) + 1;
  if (event.overflow === true) {
    return { ...state, pulse: { id: box.id, kind: 'full', delta: 0, seq }, full: box.id };
  }
  const delta = event.value - box.value;
  const kind: VarPulse['kind'] = (op ?? (delta > 0 ? 'add' : 'set')) === 'add' ? 'add' : 'set';
  return {
    ...state,
    boxes: state.boxes.map((candidate) =>
      candidate.id === box.id ? { ...candidate, value: event.value } : candidate,
    ),
    pulse: { id: box.id, kind, delta: kind === 'add' ? delta : 0, seq },
  };
}

/**
 * A question about box `id` (`cq_var_compare`) was answered `value`: the box's border lights ✔
 * or ✘. The number does not change. An unknown box changes nothing.
 */
export function applyVarCompare(state: VarBoxesState, id: string, value: boolean): VarBoxesState {
  if (!state.boxes.some((box) => box.id === id)) return state;
  const seq = (state.pulse?.seq ?? 0) + 1;
  return { ...state, pulse: { id, kind: value ? 'yes' : 'no', delta: 0, seq } };
}

/**
 * The end-of-run verdict of a counted box: ✔ when it holds `need`, else "cần N". Called after a
 * win or a WRONG_COUNT loss, with `countGoal.equals` of the map on the stage.
 */
export function applyCountVerdict(state: VarBoxesState, id: string, need: number): VarBoxesState {
  const box = state.boxes.find((candidate) => candidate.id === id);
  if (box === undefined) return state;
  return { ...state, verdict: { id, need, ok: box.value === need } };
}
