import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { TtsProvider } from './types';

/**
 * Takes `<dir>/<lineId>.mp3` files made elsewhere: real recordings of a voice, or the export
 * of a TTS web tool the coach used by hand. Lines without a file are skipped.
 */
export function createFilesProvider(dir: string): TtsProvider {
  return {
    id: 'files',
    synthesize: (line) => {
      const file = join(dir, `${line.id}.mp3`);
      return Promise.resolve(existsSync(file) ? new Uint8Array(readFileSync(file)) : null);
    },
  };
}
