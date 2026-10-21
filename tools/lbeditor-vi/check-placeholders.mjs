#!/usr/bin/env node
/*
 * Guards the one thing that silently breaks the Leanbot blocks: a translated label
 * whose %n placeholders no longer match upstream. Blockly maps %1..%n onto the block's
 * inputs positionally, so a dropped or renumbered placeholder turns a working block into
 * an unusable one - and it fails at render time, not at load time, which is why this runs
 * in CI instead of being left to a classroom to discover.
 *
 * It checks both copies of the translation - the drop-in leanbot_vi.js and the label list
 * inside lbeditor-vi.user.js - against upstream and against each other, because the two
 * drifting apart would mean the userscript and the file teach different words.
 *
 * Usage:
 *   node tools/lbeditor-vi/check-placeholders.mjs            # compare against the cached upstream copy
 *   node tools/lbeditor-vi/check-placeholders.mjs --fetch     # re-download upstream first
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const UPSTREAM_URL = 'https://ide.pythaverse.space/lbeditor/blocklyduino/msg/leanbot_vi.js';
const UPSTREAM_CACHE = join(here, 'upstream-leanbot_vi.js');

/** Pulls `"id": { message0: "..." }` pairs out of a leanbot_*.js message file. */
function readLabels(source) {
  const labels = new Map();
  const entry = /"([A-Za-z0-9._]+)"\s*:\s*\{([\s\S]*?)\n {2}\}/g;
  for (const [, id, body] of source.matchAll(entry)) {
    const message = /message0\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(body);
    if (message) labels.set(id, message[1]);
  }
  return labels;
}

/** Placeholders a Blockly message binds to inputs, normalised for order-independent compare. */
function slots(message) {
  return (message.match(/%\d+/g) ?? []).slice().sort().join(',');
}

/** `%%` is a literal percent sign, not a slot, but losing it changes what the child reads. */
function literalPercents(message) {
  return (message.match(/%%/g) ?? []).length;
}

async function loadUpstream() {
  if (process.argv.includes('--fetch')) {
    const response = await fetch(UPSTREAM_URL);
    if (!response.ok) throw new Error(`${UPSTREAM_URL} -> HTTP ${response.status}`);
    const text = await response.text();
    await writeFile(UPSTREAM_CACHE, text);
    return text;
  }
  return readFile(UPSTREAM_CACHE, 'utf8');
}

/** Pulls `'id': { message0: '...' }` pairs out of the userscript's BLOCKS object. */
function readUserscriptLabels(source) {
  const body = /const BLOCKS = \{([\s\S]*?)\n {2}\};/.exec(source);
  if (!body) throw new Error('lbeditor-vi.user.js: không tìm thấy object BLOCKS');
  const labels = new Map();
  const entry = /'([A-Za-z0-9._]+)':\s*\{([^\n]*)\}/g;
  for (const [, id, fields] of body[1].matchAll(entry)) {
    const message = /message0:\s*'((?:[^'\\]|\\.)*)'/.exec(fields);
    if (message) labels.set(id, message[1]);
  }
  return labels;
}

const upstream = readLabels(await loadUpstream());
const translated = readLabels(await readFile(join(here, 'leanbot_vi.js'), 'utf8'));
const userscript = readUserscriptLabels(await readFile(join(here, 'lbeditor-vi.user.js'), 'utf8'));

const problems = [];
for (const [id, message] of upstream) {
  if (!translated.has(id)) {
    problems.push(`${id}: thiếu trong bản dịch`);
    continue;
  }
  const ours = translated.get(id);
  if (slots(ours) !== slots(message)) {
    problems.push(`${id}: ô trống lệch\n    gốc : ${message}\n    dịch: ${ours}`);
  } else if (literalPercents(ours) !== literalPercents(message)) {
    problems.push(`${id}: số dấu %% lệch\n    gốc : ${message}\n    dịch: ${ours}`);
  }
}
for (const id of translated.keys()) {
  if (!upstream.has(id)) problems.push(`${id}: không có trong bản gốc (khối đã bị đổi tên?)`);
}

// The userscript only overrides labels that upstream left in English, so it is a subset -
// but every label it does override has to say exactly what the drop-in file says.
for (const [id, message] of userscript) {
  if (!upstream.has(id)) {
    problems.push(`${id}: userscript vá một khối không có trong bản gốc`);
  } else if (translated.get(id) !== message) {
    problems.push(
      `${id}: userscript khác leanbot_vi.js\n    file     : ${translated.get(id)}\n    userscript: ${message}`,
    );
  }
}

const stillEnglish = [...translated].filter(([, message]) =>
  /\b(Mission|Motion|Gripper|Leds|Sound|Touch|Ping|IRLine|Shape|Begin|End|Clear|Display|Random|Blend|approx|degrees|seconds|milliseconds|threshold|Colou?r)\b/.test(
    message,
  ),
);
for (const [id, message] of stillEnglish) problems.push(`${id}: còn tiếng Anh -> ${message}`);

if (problems.length) {
  console.error(`✗ ${problems.length} vấn đề:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(
  `✓ ${translated.size}/${upstream.size} nhãn khớp ô trống và đã dịch hết; ` +
    `${userscript.size} nhãn trong userscript khớp với leanbot_vi.js`,
);
