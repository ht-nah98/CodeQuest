// Usage: npm run audio:gen [-- --out <dir>] [--wav-only]
// Renders every SFX and music recipe to WAV (deterministic), then encodes MP3 with ffmpeg
// (libmp3lame) into apps/web/public/audio/{sfx,music}/. --wav-only skips ffmpeg and writes the
// WAV files to tools/audio/.out/ instead (for listening while tuning a recipe).
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { MUSIC_RECIPES } from './music';
import { SFX_RECIPES } from './sfx';
import { encodeWav, render, type Recipe } from './synth';

const { values } = parseArgs({
  options: { out: { type: 'string' }, 'wav-only': { type: 'boolean', default: false } },
});
const wavOnly = values['wav-only'];
// WAV previews go to a scratch folder, never next to the app's MP3s.
const outRoot =
  values.out !== undefined
    ? resolve(values.out)
    : fileURLToPath(
        new URL(wavOnly ? '../.out' : '../../../apps/web/public/audio', import.meta.url),
      );

// Mono 22.05 kHz; music gets a little more bitrate than the short effects.
const BITRATE = { sfx: '48k', music: '40k' } as const;

function encodeMp3(wavPath: string, mp3Path: string, bitrate: string): void {
  // bitexact + no metadata: the output does not embed the ffmpeg version or a timestamp.
  const result = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-loglevel',
      'error',
      '-i',
      wavPath,
      '-codec:a',
      'libmp3lame',
      '-b:a',
      bitrate,
      '-ac',
      '1',
      '-map_metadata',
      '-1',
      '-fflags',
      '+bitexact',
      '-flags:a',
      '+bitexact',
      mp3Path,
    ],
    { encoding: 'utf8' },
  );
  if (result.error) {
    throw new Error(
      `ffmpeg not found (${result.error.message}). Install ffmpeg or use --wav-only.`,
    );
  }
  if (result.status !== 0) throw new Error(`ffmpeg failed for ${wavPath}: ${result.stderr}`);
}

const tmp = mkdtempSync(join(tmpdir(), 'cq-audio-'));
let total = 0;
try {
  const groups: ['sfx' | 'music', Record<string, Recipe>][] = [
    ['sfx', SFX_RECIPES],
    ['music', MUSIC_RECIPES],
  ];
  for (const [group, recipes] of groups) {
    const dir = join(outRoot, group);
    mkdirSync(dir, { recursive: true });
    for (const [name, recipe] of Object.entries(recipes)) {
      const wav = encodeWav(render(recipe));
      let file: string;
      if (wavOnly) {
        file = join(dir, `${name}.wav`);
        writeFileSync(file, wav);
      } else {
        const wavPath = join(tmp, `${group}-${name}.wav`);
        writeFileSync(wavPath, wav);
        file = join(dir, `${name}.mp3`);
        encodeMp3(wavPath, file, BITRATE[group]);
      }
      const size = statSync(file).size;
      total += size;
      console.log(`✔ ${relative(process.cwd(), file)}  ${(size / 1024).toFixed(1)} KB`);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log(`\naudio:gen: ${(total / 1024).toFixed(1)} KB total`);
