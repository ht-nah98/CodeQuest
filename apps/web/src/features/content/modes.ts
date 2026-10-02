import type { LevelMode } from '@codequest/content-schema';

/**
 * Level modes the play screen can run today. P1-06 (parsons, predict, bughunt, creative) adds
 * each mode here once its UI exists; until then such levels are hidden from the dev sandbox,
 * shown locked on world pages, and /play/:levelId answers with the "unplayable" message.
 */
export const SUPPORTED_MODES: ReadonlySet<LevelMode> = new Set<LevelMode>(['build']);

export function isModeSupported(mode: LevelMode): boolean {
  return SUPPORTED_MODES.has(mode);
}
