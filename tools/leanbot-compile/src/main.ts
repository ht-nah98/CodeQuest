// Compiles the Arduino code of the Leanbot blocks on Leanbot's own server, the way Leanbot IDE
// does (AGENTS.md §9.12: code shown to a child must compile). Needs the network, so it is run by
// hand before merging, not in CI:  npm run leanbot:compile
import { readFileSync } from 'node:fs';
import { serialization, Workspace } from 'blockly';
import { LB_BLOCKS, registerLeanbotBlocks, toArduino, type BlockState } from '@codequest/games';

const COMPILE_URL = 'https://cs.leanbot.space/v3/compile';

/** Every statement block of the toolbox at its default values, inside one mission. */
function everyBlockProgram(): string {
  let id = 0;
  const block = (type: string, rest: Partial<BlockState> = {}): BlockState => ({
    type,
    id: `b${String(++id)}`,
    ...rest,
  });
  const question = () =>
    block('lb_and_or', {
      inputs: {
        A: { block: block('lb_touch_is') },
        B: {
          block: block('lb_compare', {
            fields: { OP: 'LT' },
            inputs: {
              A: { block: block('lb_ping') },
              B: {
                block: block('lb_arith', {
                  inputs: {
                    A: { block: block('lb_number', { fields: { N: 10 } }) },
                    B: { block: block('lb_number', { fields: { N: 5 } }) },
                  },
                }),
              },
            },
          }),
        },
      },
    });
  const statements = LB_BLOCKS.filter(
    (d) => d.json.output === undefined && !d.type.startsWith('lb_mission'),
  ).map((d) =>
    block(
      d.type,
      (d.json.args0 ?? []).some((a) => a.name === 'COND')
        ? { inputs: { COND: { block: question() } } }
        : {},
    ),
  );
  const conditions = ['lb_object_near', 'lb_irline_black', 'lb_irline_is', 'lb_bool'].map((type) =>
    block('lb_if', {
      inputs: { COND: { block: block('lb_not', { inputs: { A: { block: block(type) } } }) } },
    }),
  );
  const all = [...statements, ...conditions];
  for (let i = 0; i < all.length - 1; i++) {
    const next = all[i + 1];
    const current = all[i];
    if (current && next) current.next = { block: next };
  }
  const first = all[0];
  const mission = block('lb_mission_touch', first ? { inputs: { BODY: { block: first } } } : {});
  const ws = new Workspace();
  serialization.workspaces.load({ blocks: { languageVersion: 0, blocks: [mission] } }, ws);
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
const fixture = (name: string) =>
  readFileSync(
    new URL(`../../../packages/games/src/leanbot/fixtures/${name}`, import.meta.url),
    'utf8',
  );
const programs: [string, string][] = [
  ['every block', everyBlockProgram()],
  ['pythaverse-full.ino', fixture('pythaverse-full.ino')],
  ['pythaverse-imm.ino', fixture('pythaverse-imm.ino')],
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
