// Compiles the Arduino code of the Leanbot blocks on Leanbot's own server, the way Leanbot IDE
// does (AGENTS.md §9.12: code shown to a child must compile). Needs the network, so it is run by
// hand before merging, not in CI:  npm run leanbot:compile
import { readFileSync } from 'node:fs';
import { utils, Workspace, Xml } from 'blockly';
import { LB_TOOLBOX, type LbCategory, registerLeanbotBlocks, toArduino } from '@codequest/games';

const COMPILE_URL = 'https://cs.leanbot.space/v3/compile';
const FIXTURES = new URL('../../../packages/games/src/leanbot/fixtures/', import.meta.url);

/**
 * Blocks whose code does not compile on its own, in Pythaverse too: "for each" prints
 * JavaScript, "break" needs a loop around it, "switch" needs its variable declared.
 */
const ALONE_DOES_NOT_COMPILE = ['controls_forEach', 'controls_flow_statements', 'controls_switch'];

/** Every statement block of the toolbox at its toolbox values, one after the other. */
function everyStatementBlock(): string {
  const ws = new Workspace();
  const add = (category: LbCategory) => {
    for (const xml of category.blocks ?? []) {
      const block = Xml.domToBlock(utils.xml.textToDom(xml), ws);
      if (block.outputConnection || ALONE_DOES_NOT_COMPILE.includes(block.type)) block.dispose();
    }
    for (const child of category.children ?? []) add(child);
  };
  for (const category of LB_TOOLBOX) add(category);
  return toArduino(ws).code;
}

async function compile(code: string): Promise<{ ok: boolean; log: string }> {
  const response = await fetch(COMPILE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fqbn: 'arduino:avr:uno',
      files: [{ name: 'LeanbotSketch/LeanbotSketch.ino', content: code }],
      flags: { verbose: false, preferLocal: false },
      libs: [],
    }),
  });
  const result = (await response.json()) as { hex?: string; log?: string };
  return { ok: typeof result.hex === 'string' && result.hex.length > 0, log: result.log ?? '' };
}

registerLeanbotBlocks();
const programs: [string, string][] = [
  ['every statement block of the toolbox', everyStatementBlock()],
  ...['full', 'imm', 'arduino', 'procs', 'math'].map((name): [string, string] => [
    `${name}.ino`,
    readFileSync(new URL(`${name}.ino`, FIXTURES), 'utf8'),
  ]),
];
let failed = 0;
for (const [name, code] of programs) {
  const { ok, log } = await compile(code);
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}`);
  if (!ok) {
    failed++;
    console.log(code);
    console.log(log);
  }
}
process.exit(failed === 0 ? 0 : 1);
