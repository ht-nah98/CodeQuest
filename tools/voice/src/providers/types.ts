import type { VoiceLine } from '../lines';

/**
 * A source of voice audio for `npm run voice -- build`. The coach picks the real TTS service
 * (roadmap P1-14); it plugs in as one more adapter here (see tools/voice/README.md).
 */
export interface TtsProvider {
  /** Short id written into the app manifest, e.g. "none", "files", "<service>-<voice>". */
  readonly id: string;
  /** MP3 bytes for one Vietnamese line, or null when this provider has no audio for it. */
  synthesize(line: VoiceLine): Promise<Uint8Array | null>;
}

/** Command-line options a provider factory may use. */
export interface ProviderOptions {
  /** `--from <dir>`: folder of ready-made files (the "files" provider). */
  from?: string;
}
