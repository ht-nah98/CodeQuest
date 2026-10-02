import type { SfxName } from './sfxCatalog';

// Stage event → sound effect, for the replay of a run (stage-rendering.md §3). The play screen /
// stage controller calls `playSfx(stageSfx(event.type))` as each event's animation starts.
// Event types: runner (game-kinds.md §3.1) and maze (§3.2). Unknown types are silent.

const STAGE_SFX: Partial<Record<string, SfxName>> = {
  // runner
  walk: 'step',
  jump: 'jump',
  crouch: 'drop',
  kick: 'kick',
  collect: 'collect',
  fall: 'fall',
  bump: 'bump',
  offTrack: 'fall',
  // Ends the run: the play screen then skips its own `RUN_SFX.fail` (no double `wrong`).
  missed: 'wrong',
  // No `win`: the results overlay plays its `fanfare` (audio.md §3).
  // maze
  move: 'step',
  turn: 'click',
};

/** The sound for a stage event type, or null when the event is silent. */
export function stageSfx(eventType: string): SfxName | null {
  return Object.hasOwn(STAGE_SFX, eventType) ? (STAGE_SFX[eventType] ?? null) : null;
}

/** Sounds around a run that are not stage events. */
export const RUN_SFX = {
  /** ▶ Chạy pressed. */
  start: 'run',
  /** The run failed (after the event's own sound; skipped when that sound was already this). */
  fail: 'wrong',
} as const satisfies Record<string, SfxName>;

/**
 * Sound for a Blockly workspace event (`BlocklyWorkspace` can call this from a change
 * listener once its built-in `sounds: true` is turned off): a block connecting to another
 * snaps, a block created by dragging out of the flyout or dropped loose drops.
 */
export function blocklySfx(event: {
  type: string;
  reason?: readonly string[];
  newParentId?: string;
}): SfxName | null {
  if (event.type === 'move' && event.reason?.includes('connect')) return 'snap';
  if (event.type === 'move' && event.reason?.includes('drag') && event.newParentId === undefined) {
    return 'drop';
  }
  if (event.type === 'delete') return 'drop';
  return null;
}
