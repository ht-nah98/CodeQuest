// Usage: npm run par -- <levelId | path/to/level.json>... [--world <wNN | folder>]
//          [--dir <content dir>] [--max-size N] [--depth N] [--budget N] [--timeout <seconds>]
// Exhaustive search for the fewest blocks that win each build/bughunt level (and, for bughunt,
// the fewest edits that fix initialWorkspace). Exit 1 if a level's par or parEdits is wrong.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { LevelSchema } from '@codequest/content-schema';
import { findLevelFiles, judgeLevel, type Verdict } from './par';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    world: { type: 'string', multiple: true },
    dir: { type: 'string' },
    'max-size': { type: 'string' },
    depth: { type: 'string' },
    budget: { type: 'string' },
    timeout: { type: 'string' },
  },
});

const contentDir =
  values.dir === undefined
    ? fileURLToPath(new URL('../../../content', import.meta.url))
    : resolve(values.dir);

/** A flag that must be a whole number ≥ `min`; exits 2 with a short message otherwise. */
function wholeNumber(flag: string, min = 1): number | undefined {
  const text = (values as Record<string, string | string[] | undefined>)[flag];
  if (text === undefined) return undefined;
  const value = Number(text);
  if (typeof text !== 'string' || !Number.isInteger(value) || value < min) {
    console.error(`--${flag} needs a whole number ≥ ${String(min)}, got "${String(text)}"`);
    process.exit(2);
  }
  return value;
}
const maxSize = wholeNumber('max-size');
const depth = wholeNumber('depth', 0);
const budget = wholeNumber('budget');
const timeout = wholeNumber('timeout');

const listDir = (dir: string): string[] => {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
};

const files = findLevelFiles(
  { list: listDir, read: (path) => readFileSync(path, 'utf8') },
  contentDir,
  positionals,
  values.world ?? [],
);
if (files.length === 0) {
  console.log(
    'Usage: npm run par -- <levelId | level.json>... | --world <wNN> [--max-size N] [--depth N]',
  );
  process.exit(2);
}

const started = performance.now();
let errors = 0;
let warnings = 0;
for (const file of files) {
  const levelStarted = performance.now();
  const deadline = timeout === undefined ? Infinity : levelStarted + timeout * 1000;
  let verdict: Verdict;
  if (file.error !== undefined) {
    verdict = { mark: '✖', head: `${file.name}  ${file.error}`, lines: [] };
  } else {
    let json: unknown;
    try {
      json = JSON.parse(file.text ?? '');
    } catch {
      json = undefined;
    }
    const parsed = LevelSchema.safeParse(json);
    verdict = parsed.success
      ? judgeLevel(parsed.data, {
          ...(maxSize !== undefined && { maxSize }),
          ...(depth !== undefined && { maxDepth: depth }),
          ...(budget !== undefined && { maxWork: budget }),
          shouldStop: () => performance.now() > deadline,
        })
      : {
          mark: '✖',
          head: `${file.name}  ${json === undefined ? 'invalid JSON' : 'not a valid level'} (run content:check)`,
          lines: [],
        };
  }
  if (verdict.mark === '✖') errors++;
  if (verdict.mark === '⚠') warnings++;
  const seconds = ((performance.now() - levelStarted) / 1000).toFixed(1);
  console.log(`${verdict.mark} ${verdict.head}  (${seconds}s)`);
  for (const line of verdict.lines) console.log(`    ${line}`);
}
console.log(
  `\npar: ${String(files.length)} levels, ${String(errors)} errors, ${String(warnings)} warnings ` +
    `(${((performance.now() - started) / 1000).toFixed(1)}s)`,
);
process.exitCode = errors > 0 ? 1 : 0;
