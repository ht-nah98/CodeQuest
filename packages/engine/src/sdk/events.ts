/** Base event. Every game kind's events extend this (discriminated union on `type`). */
export interface GameEvent {
  type: string;
  blockId: string | null;
}

/** Emitted before each statement so playback can highlight the running block. */
export interface HighlightEvent {
  type: 'highlight';
  blockId: string;
}

/**
 * A sensor block was read (P2-11, curriculum.md §5.4 T7): `blockId` is the sensor block, `value`
 * its answer (✔/✘). Emitted by the engine when a game kind's API calls `ctx.sense`, after the
 * highlight of the statement that asked; counts towards `maxActions` like a game event.
 */
export interface SenseEvent {
  type: 'sense';
  blockId: string | null;
  value: boolean;
}

/**
 * A box changed (ADR-0022 §3): after every `đặt` / `tăng` (also when the number stays the same),
 * logged by the engine and counted towards `maxActions` like `sense`. `id` is the box, `value` its
 * new number; with `overflow` the box went over its `max` and keeps `value` (the old number): the
 * run then ends `crash` / `BOX_FULL`. Not part of any game kind's event union.
 */
export interface VarEvent {
  type: 'var';
  blockId: string | null;
  id: string;
  value: number;
  overflow?: true;
}

/**
 * A spell starts (`call`) or ends (`ret`) (ADR-0023 §3): `blockId` is the `làm phép` block, `id`
 * the spell. Logged by the engine around the spell's body and counted towards `maxActions` like
 * `var`; not part of any game kind's event union. The web lights the `dạy phép` block of `id`
 * between the two.
 */
export interface CallEvent {
  type: 'call';
  blockId: string | null;
  id: string;
}
export interface RetEvent {
  type: 'ret';
  blockId: string | null;
  id: string;
}

/** Events the engine itself logs, next to a game kind's own. */
export type EngineEvent = HighlightEvent | SenseEvent | VarEvent | CallEvent | RetEvent;

/** `Omit` that distributes over a union; plain `Omit<Union, K>` loses variant-only fields. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
