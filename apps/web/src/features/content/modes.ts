import type { LevelMode } from '@codequest/content-schema';

/**
 * Level modes the play screen can run. Since P1-06 that is every mode; the gate stays for a
 * mode added to the schema before its UI exists: such levels are hidden from the dev sandbox,
 * shown "soon" on world pages, and /play/:levelId answers with the "unplayable" message.
 */
export const SUPPORTED_MODES: ReadonlySet<LevelMode> = new Set<LevelMode>([
  'build',
  'parsons',
  'predict',
  'bughunt',
  'creative',
]);

export function isModeSupported(mode: LevelMode): boolean {
  return SUPPORTED_MODES.has(mode);
}
