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

/** `Omit` that distributes over a union; plain `Omit<Union, K>` loses variant-only fields. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
