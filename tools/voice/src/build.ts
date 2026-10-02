import { z } from 'zod';
import { textHash, type VoiceLine } from './lines';
import type { TtsProvider } from './providers';

/**
 * The app's list of lines that have a voice file (apps/web/src/audio/voiceManifest.json).
 * The file of line `id` is `apps/web/public/audio/voice/<id>.mp3`; `hash` is the text it was
 * made from, so an edited line is detected as stale.
 */
export const VoiceManifestSchema = z.object({
  version: z.literal(1),
  /** Provider that made the most recent files. */
  provider: z.string(),
  lines: z.record(z.string(), z.object({ hash: z.string() })),
});

export type VoiceManifest = z.infer<typeof VoiceManifestSchema>;

export const EMPTY_MANIFEST: VoiceManifest = { version: 1, provider: 'none', lines: {} };

export interface VoicePlan {
  /** Lines without an up-to-date voice file. */
  todo: VoiceLine[];
  /** Lines whose file matches the current text. */
  upToDate: VoiceLine[];
  /** Manifest ids that are no longer a voiced line. */
  orphans: string[];
}

/** Compares the current lines with the manifest and the files on disk. */
export function planVoices(
  lines: readonly VoiceLine[],
  manifest: VoiceManifest,
  fileExists: (id: string) => boolean,
  force = false,
): VoicePlan {
  const ids = new Set(lines.map((line) => line.id));
  const todo: VoiceLine[] = [];
  const upToDate: VoiceLine[] = [];
  for (const line of lines) {
    const entry = manifest.lines[line.id];
    const fresh = !force && entry?.hash === textHash(line.text) && fileExists(line.id);
    (fresh ? upToDate : todo).push(line);
  }
  const orphans = Object.keys(manifest.lines)
    .filter((id) => !ids.has(id))
    .sort();
  return { todo, upToDate, orphans };
}

/**
 * Why a build must not run, or null. Provider "none" makes nothing, so with --force or over an
 * existing manifest it could only throw voice files away.
 */
export function refuseBuild(
  providerId: string,
  force: boolean,
  manifest: VoiceManifest,
): string | null {
  if (providerId !== 'none') return null;
  if (force) return '--force with provider "none" would delete every voice file.';
  if (Object.keys(manifest.lines).length > 0) {
    return 'The manifest already has voice files; build with their provider (e.g. --provider files).';
  }
  return null;
}

/** File system access of a build, injectable for tests. */
export interface VoiceIo {
  writeVoice(id: string, bytes: Uint8Array): void;
  removeVoice(id: string): void;
  voiceExists(id: string): boolean;
}

export interface BuildResult {
  manifest: VoiceManifest;
  written: string[];
  /** Lines the provider had no audio for (they show no 🔊). */
  skipped: string[];
  removed: string[];
}

/**
 * Makes the missing voice files with `provider`, removes orphans (unless `prune` is false, as
 * for a build of only some worlds) and returns the new manifest. Lines with the same text are
 * synthesized once (e.g. a feedback line reused as a hint).
 */
export async function buildVoices(
  plan: VoicePlan,
  manifest: VoiceManifest,
  provider: TtsProvider,
  io: VoiceIo,
  prune = true,
): Promise<BuildResult> {
  const lines: VoiceManifest['lines'] = {};
  const kept = prune ? [] : plan.orphans;
  for (const id of [...plan.upToDate.map((line) => line.id), ...kept]) {
    const entry = manifest.lines[id];
    if (entry) lines[id] = entry;
  }
  const written: string[] = [];
  const skipped: string[] = [];
  // Only audio is shared between equal texts: "no audio" may be per id (the files provider).
  const byText = new Map<string, Uint8Array>();
  for (const line of plan.todo) {
    const hash = textHash(line.text);
    const bytes = byText.get(hash) ?? (await provider.synthesize(line));
    if (bytes === null) {
      const entry = manifest.lines[line.id];
      if (entry?.hash === hash && io.voiceExists(line.id)) {
        // Still the right text (e.g. --force): keep the file rather than lose it.
        lines[line.id] = entry;
      } else if (entry) {
        // A stale file must not keep playing the old text.
        io.removeVoice(line.id);
      }
      skipped.push(line.id);
      continue;
    }
    byText.set(hash, bytes);
    io.writeVoice(line.id, bytes);
    lines[line.id] = { hash };
    written.push(line.id);
  }
  const removed = prune ? plan.orphans : [];
  for (const id of removed) io.removeVoice(id);

  const sorted = Object.fromEntries(
    Object.entries(lines).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
  const provided = written.length > 0 ? provider.id : manifest.provider;
  return {
    manifest: { version: 1, provider: provided, lines: sorted },
    written,
    skipped,
    removed,
  };
}
