// Usage (see tools/voice/README.md):
//   npm run voice -- lines [--worlds w01,w02] [--out <file>]     list voiced lines (id → text)
//   npm run voice -- check [--worlds …] [--strict]               which lines lack an up-to-date voice
//   npm run voice -- build --provider <id> [--from <dir>] [--worlds …] [--force]
// Never runs while a child plays: files are made ahead of time (ui-copy-guide.md §5).
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import {
  buildVoices,
  EMPTY_MANIFEST,
  planVoices,
  refuseBuild,
  VoiceManifestSchema,
  type VoiceManifest,
} from './build';
import {
  duplicateIds,
  extractContentLines,
  sortLines,
  textHash,
  type ContentFile,
  type VoiceLine,
} from './lines';
import { PROVIDERS } from './providers';
import { extractUiLines } from './uiLines';

const repo = (path: string) => fileURLToPath(new URL(`../../../${path}`, import.meta.url));
const CONTENT_DIR = repo('content');
const VI_FILE = repo('apps/web/src/i18n/vi.ts');
const VOICE_DIR = repo('apps/web/public/audio/voice');
const MANIFEST_FILE = repo('apps/web/src/audio/voiceManifest.json');
const DEFAULT_LINES_OUT = repo('tools/voice/.out/lines.json');

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    worlds: { type: 'string' },
    out: { type: 'string' },
    provider: { type: 'string', default: 'none' },
    from: { type: 'string' },
    force: { type: 'boolean', default: false },
    strict: { type: 'boolean', default: false },
  },
});
const command = positionals[0] ?? 'lines';
const worlds = values.worlds?.split(',').map((w) => w.trim());

function listJson(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listJson(full);
    return entry.name.endsWith('.json') ? [full] : [];
  });
}

function loadLines(): VoiceLine[] {
  const files: ContentFile[] = listJson(CONTENT_DIR).map((full) => ({
    path: relative(CONTENT_DIR, full).split(sep).join('/'),
    text: readFileSync(full, 'utf8'),
  }));
  const content = extractContentLines(files, worlds === undefined ? {} : { worlds });
  // A partial build (--worlds) leaves the UI lines alone, like the other worlds.
  const ui = worlds === undefined ? extractUiLines(readFileSync(VI_FILE, 'utf8')) : null;
  const issues = [...content.issues, ...(ui?.issues ?? [])];
  for (const issue of issues) console.log(`✖ ${issue.path}: ${issue.message}`);
  const lines = sortLines([...content.lines, ...(ui?.lines ?? [])]);
  const dups = duplicateIds(lines);
  for (const id of dups) console.log(`✖ duplicate voice id ${id}`);
  if (issues.length > 0 || dups.length > 0) process.exit(1);
  return lines;
}

function readManifest(): VoiceManifest {
  if (!existsSync(MANIFEST_FILE)) return EMPTY_MANIFEST;
  const parsed = VoiceManifestSchema.safeParse(JSON.parse(readFileSync(MANIFEST_FILE, 'utf8')));
  if (!parsed.success) {
    throw new Error(`${MANIFEST_FILE} is not a valid voice manifest: ${parsed.error.message}`);
  }
  return parsed.data;
}

const voiceFile = (id: string) => join(VOICE_DIR, `${id}.mp3`);
const fileExists = (id: string) => existsSync(voiceFile(id));

async function main(): Promise<void> {
  const lines = loadLines();
  if (command === 'lines') {
    const out = values.out === undefined ? DEFAULT_LINES_OUT : resolve(values.out);
    mkdirSync(dirname(out), { recursive: true });
    const rows = lines.map((line) => ({ ...line, hash: textHash(line.text) }));
    writeFileSync(out, `${JSON.stringify(rows, null, 2)}\n`);
    const unique = new Set(lines.map((line) => textHash(line.text))).size;
    console.log(
      `voice lines: ${String(lines.length)} lines (${String(unique)} distinct texts) → ${relative(process.cwd(), out)}`,
    );
    return;
  }

  const manifest = readManifest();
  const plan = planVoices(lines, manifest, fileExists, values.force);
  if (command === 'check') {
    // A partial check (--worlds) does not see the other worlds' lines: they are not orphans.
    if (worlds !== undefined) plan.orphans = [];
    for (const line of plan.todo) console.log(`· ${line.id}  "${line.text}"`);
    console.log(
      `voice check: ${String(plan.upToDate.length)} up to date, ${String(plan.todo.length)} missing or stale, ` +
        `${String(plan.orphans.length)} orphan(s); provider "${manifest.provider}"`,
    );
    if (values.strict && (plan.todo.length > 0 || plan.orphans.length > 0)) process.exitCode = 1;
    return;
  }

  if (command === 'build') {
    const factory = PROVIDERS[values.provider];
    if (!factory) {
      throw new Error(
        `Unknown provider "${values.provider}". Known: ${Object.keys(PROVIDERS).join(', ')}`,
      );
    }
    const refusal = refuseBuild(values.provider, values.force, manifest);
    if (refusal !== null) throw new Error(refusal);
    const provider = factory(values.from === undefined ? {} : { from: resolve(values.from) });
    mkdirSync(VOICE_DIR, { recursive: true });
    const result = await buildVoices(
      plan,
      manifest,
      provider,
      {
        writeVoice: (id, bytes) => {
          writeFileSync(voiceFile(id), bytes);
        },
        removeVoice: (id) => {
          rmSync(voiceFile(id), { force: true });
        },
        voiceExists: fileExists,
      },
      worlds === undefined,
    );
    writeFileSync(MANIFEST_FILE, `${JSON.stringify(result.manifest, null, 2)}\n`);
    console.log(
      `voice build (${provider.id}): ${String(result.written.length)} written, ` +
        `${String(plan.upToDate.length)} up to date, ${String(result.skipped.length)} without audio, ` +
        `${String(result.removed.length)} removed → ${relative(process.cwd(), MANIFEST_FILE)}`,
    );
    return;
  }

  throw new Error(`Unknown command "${command}". Use lines, check or build.`);
}

await main();
