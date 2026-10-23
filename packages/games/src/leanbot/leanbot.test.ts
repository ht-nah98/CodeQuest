import { serialization, Workspace } from 'blockly';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { LB_BLOCKS } from './blocks';
import { toArduino } from './arduino';
import { type BlockState, parseArduino, type ParseResult } from './parse';
import { registerLeanbotBlocks } from './register';

// Code printed by Pythaverse's own editor for the same programs (tools/pythaverse-blocks,
// 23/10/2026), minus its "Generated … at <time>" header. Both compile on cs.leanbot.space.
// Loaded through Vite (no node:fs: headless packages are typed without Node globals).
const fixtures = {
  'pythaverse-full.ino': await vi.importActual<{ default: string }>(
    './fixtures/pythaverse-full.ino?raw',
  ),
  'pythaverse-imm.ino': await vi.importActual<{ default: string }>(
    './fixtures/pythaverse-imm.ino?raw',
  ),
};
const fixture = (name: keyof typeof fixtures) => fixtures[name].default.trimEnd();
const dump = (
  await vi.importActual<{ default: { toolbox: { type: string; code: string }[] } }>(
    '../../../../docs/research/pythaverse-lbeditor-blocks.json',
  )
).default;
const pythaverseCode = (type: string) => {
  const entry = dump.toolbox.find((b) => b.type === type);
  if (!entry) throw new Error(`no ${type} in the dump`);
  return entry.code;
};

beforeAll(() => {
  registerLeanbotBlocks();
});

function load(state: ParseResult['workspace']): Workspace {
  const ws = new Workspace();
  serialization.workspaces.load(state, ws);
  return ws;
}

const program = (...blocks: BlockState[]): ParseResult['workspace'] => {
  for (let i = blocks.length - 2; i >= 0; i--) {
    const next = blocks[i + 1];
    const block = blocks[i];
    if (block && next) block.next = { block: next };
  }
  return { blocks: { languageVersion: 0, blocks: blocks[0] ? [blocks[0]] : [] } };
};
let ids = 0;
const blk = (type: string, rest: Omit<BlockState, 'type' | 'id'> = {}): BlockState => ({
  type,
  id: `t${String(++ids)}`,
  ...rest,
});

/** The statements inside `loop()`, one indent less. */
function loopBody(code: string): string {
  const body = code.slice(code.indexOf('void loop() {\n') + 'void loop() {\n'.length, -1);
  return body
    .split('\n')
    .map((l) => l.replace(/^ {2}/, ''))
    .join('\n')
    .trim();
}

describe('Leanbot Arduino code', () => {
  it.each(['pythaverse-full.ino', 'pythaverse-imm.ino'] as const)(
    '%s: code → blocks → code gives back Pythaverse’s code exactly',
    (name) => {
      const src = fixture(name);
      const parsed = parseArduino(src);
      expect(parsed.problems).toEqual([]);
      expect(toArduino(load(parsed.workspace)).code).toBe(src);
    },
  );

  // One block at Pythaverse's default values, against the code its editor printed for it
  // (docs/research/pythaverse-lbeditor-blocks.json).
  const statementCases: [string, BlockState['fields'], string][] = [
    ['lb_wait', { N: 1.25, UNIT: 'SEC' }, 'Leanbot.delay'],
    ['lb_comment', { TEXT: 'Mô tả' }, 'Leanbot.commentLine'],
    ['lb_run', { LEFT: 30, RIGHT: 30 }, 'LbMotion.run'],
    ['lb_go', { N: 4.2, UNIT: 'CM' }, 'LbMotion.waitDistanceMm'],
    ['lb_turn', { N: 90 }, 'LbMotion.waitRotationDeg'],
    ['lb_stop', {}, 'LbMotion.stop'],
    ['lb_gripper_open', {}, 'LbGripper.open'],
    ['lb_gripper_close', {}, 'LbGripper.close'],
    ['lb_gripper_to', { N: 45 }, 'LbGripper.moveTo'],
    ['lb_gripper_to_lr', { LEFT: 30, RIGHT: 60, MS: 1000 }, 'LbGripper.moveToLR'],
    ['lb_led_set', { LED: 'ledO', COLOR: 'YELLOW' }, 'LbRGB.setColorText'],
    ['lb_led_fill', { COLOR: 'YELLOW' }, 'LbRGB.fillColor'],
    ['lb_led_clear', {}, 'LbRGB.clear'],
    ['lb_led_show', {}, 'LbRGB.show'],
    ['lb_tone', { HZ: 1500, MS: 100 }, 'Leanbot.toneDuration'],
    ['lb_touch_wait', { PAD: 'TB1A' }, 'LbTouch.waitUntil'],
    ['lb_irline_read', {}, 'LbIRLine.read'],
    ['lb_irline_show', { COLOR: 'GREEN' }, 'LbIRLine.displayOnRGB'],
    ['lb_mission_touch', { COMBO: 'TB1A + TB1B' }, 'LbMission.beginByTeacher_end'],
    ['lb_mission_now', {}, 'LbMission.beginImmediately_end'],
  ];
  it.each(statementCases)('%s prints what Pythaverse prints', (type, fields, pythaverse) => {
    const code = toArduino(load(program(blk(type, fields ? { fields } : {})))).code;
    expect(loopBody(code)).toBe(pythaverseCode(pythaverse));
  });

  const valueCases: [string, BlockState['fields'], string][] = [
    ['lb_touch_is', { PAD: 'TB1A' }, 'LbTouch.read'],
    ['lb_object_near', { CM: 25 }, 'Leanbot.objectInFront'],
    ['lb_irline_black', {}, 'LbIRLine.isBlackDetected'],
  ];
  it.each(valueCases)('%s prints what Pythaverse prints', (type, fields, pythaverse) => {
    const value = blk(type, fields ? { fields } : {});
    const code = toArduino(load(program(blk('lb_if', { inputs: { COND: { block: value } } }))));
    expect(loopBody(code.code)).toBe(`if (${pythaverseCode(pythaverse)}) {\n}`);
  });

  it('lb_ping prints what Pythaverse prints', () => {
    const ping = blk('lb_ping');
    const cmp = blk('lb_compare', { fields: { OP: 'LT' }, inputs: { A: { block: ping } } });
    const code = toArduino(load(program(blk('lb_if', { inputs: { COND: { block: cmp } } }))));
    expect(loopBody(code.code)).toBe(`if ((${pythaverseCode('Leanbot.ping')} < 0)) {\n}`);
  });

  it('an empty workspace is Pythaverse’s empty sketch, without the Leanbot header', () => {
    expect(toArduino(new Workspace()).code).toBe('void setup() {\n}\n\nvoid loop() {\n}');
  });

  it('names nested loop counters like Pythaverse: the inner loop is named first', () => {
    const inner = blk('lb_repeat', { fields: { TIMES: 2 } });
    const outer = blk('lb_repeat', { fields: { TIMES: 3 }, inputs: { DO: { block: inner } } });
    expect(loopBody(toArduino(load(program(outer))).code)).toBe(
      'for (int count2 = 0; count2 < 3; count2++) {\n' +
        '  for (int count = 0; count < 2; count++) {\n  }\n\n}',
    );
  });

  it('reads the eyes of "4 mắt dò vạch thấy" as one 4-bit number, outer left eye first', () => {
    const is = blk('lb_irline_is', { fields: { E2L: 'B', E0L: 'W', E1R: 'W', E3R: 'B' } });
    const code = toArduino(load(program(blk('lb_if', { inputs: { COND: { block: is } } }))));
    expect(loopBody(code.code)).toBe('if ((LbIRLine.value() == 9)) {\n}');
  });

  it('tells which line every statement block starts on', () => {
    const wait = blk('lb_wait', { fields: { N: 1, UNIT: 'SEC' } });
    const note = blk('lb_comment', { fields: { TEXT: 'đi' } });
    const go = blk('lb_go', { fields: { N: 5, UNIT: 'CM' } });
    const mission = blk('lb_mission_now', { inputs: { BODY: { block: wait } } });
    wait.next = { block: note };
    note.next = { block: go };
    const { code, lineOf } = toArduino(load(program(mission)));
    const lines = code.split('\n');
    expect(lines[lineOf.get(mission.id) ?? -1]).toBe('  LbMission.begin(0);');
    expect(lines[lineOf.get(wait.id) ?? -1]).toBe('  LbDelay(1 * 1000);');
    // A comment prints a blank line first; the block belongs to the comment line.
    expect(lines[lineOf.get(note.id) ?? -1]).toBe('  // đi');
    expect(lines[lineOf.get(go.id) ?? -1]).toBe('  LbMotion.waitDistanceMm(5 * 10);');
  });

  it('every block of the toolbox survives blocks → code → blocks → code', () => {
    // Default fields of every statement block, in one mission.
    const statements = LB_BLOCKS.filter(
      (d) => d.json.output === undefined && !d.type.startsWith('lb_mission'),
    ).map((d) => {
      const cond = blk('lb_and_or', {
        fields: { OP: 'OR' },
        inputs: {
          A: { block: blk('lb_not', { inputs: { A: { block: blk('lb_irline_black') } } }) },
          B: {
            block: blk('lb_compare', {
              fields: { OP: 'GTE' },
              inputs: {
                A: { block: blk('lb_ping') },
                B: {
                  block: blk('lb_arith', {
                    fields: { OP: 'MULTIPLY' },
                    inputs: {
                      A: { block: blk('lb_number', { fields: { N: -3 } }) },
                      B: { block: blk('lb_number', { fields: { N: 4.5 } }) },
                    },
                  }),
                },
              },
            }),
          },
        },
      });
      const hasCond = (d.json.args0 ?? []).some((a) => a.name === 'COND');
      return blk(d.type, hasCond ? { inputs: { COND: { block: cond } } } : {});
    });
    const first = program(...statements).blocks.blocks[0];
    const mission = blk('lb_mission_touch', first ? { inputs: { BODY: { block: first } } } : {});
    const code = toArduino(load(program(mission))).code;
    const parsed = parseArduino(code);
    expect(parsed.problems).toEqual([]);
    expect(toArduino(load(parsed.workspace)).code).toBe(code);
  });

  it('is deterministic', () => {
    const src = fixture('pythaverse-full.ino');
    const a = toArduino(load(parseArduino(src).workspace)).code;
    const b = toArduino(load(parseArduino(src).workspace)).code;
    expect(a).toBe(b);
  });
});

describe('Arduino code → blocks', () => {
  const types = (r: ParseResult) => {
    const out: string[] = [];
    const walk = (b: BlockState | undefined) => {
      if (!b) return;
      out.push(b.type);
      for (const input of Object.values(b.inputs ?? {})) walk(input.block);
      walk(b.next?.block);
    };
    walk(r.workspace.blocks.blocks[0]);
    return out;
  };

  it('reads bare statements without setup() and loop()', () => {
    const r = parseArduino('LbMotion.runLRrpm(30, 30);\nLbMotion.waitDistanceMm(20 * 10);');
    expect(r.problems).toEqual([]);
    expect(types(r)).toEqual(['lb_run', 'lb_go']);
    expect(r.workspace.blocks.blocks[0]?.next?.block.fields).toEqual({ N: 20, UNIT: 'CM' });
  });

  it('keeps the source line of each block', () => {
    const r = parseArduino('\nLbGripper.open();\n\nLbGripper.close();');
    const first = r.workspace.blocks.blocks[0];
    expect(first && r.lineOf[first.id]).toBe(2);
    const second = first?.next?.block;
    expect(second && r.lineOf[second.id]).toBe(4);
  });

  it('reads "else if" as "nếu không thì" holding another "nếu"', () => {
    const r = parseArduino(
      'if (LbIRLine.isBlackDetected()) {\n  LbMotion.stopAndWait();\n} else if ((LbTouch.read(TB1A) == HIGH)) {\n  LbGripper.open();\n}',
    );
    expect(r.problems).toEqual([]);
    expect(types(r)).toEqual([
      'lb_if_else',
      'lb_irline_black',
      'lb_stop',
      'lb_if',
      'lb_touch_is',
      'lb_gripper_open',
    ]);
  });

  it('reads a bare `pingCm() <= n` as "có vật trong vòng", a bracketed one as "so sánh"', () => {
    expect(types(parseArduino('if (Leanbot.pingCm() <= 25) {\n}'))).toEqual([
      'lb_if',
      'lb_object_near',
    ]);
    expect(types(parseArduino('if ((Leanbot.pingCm() <= 25)) {\n}'))).toEqual([
      'lb_if',
      'lb_compare',
      'lb_ping',
      'lb_number',
    ]);
  });

  it('unknown: a value that does not fit its input (a distance where a question goes)', () => {
    const r = parseArduino('if (Leanbot.pingCm()) {\n  LbGripper.open();\n}');
    expect(r.problems).toEqual([{ line: 1, reason: 'unknown' }]);
    expect(r.workspace.blocks.blocks).toEqual([]);
  });

  it('accepts a colour as a hex number for "tô đèn"', () => {
    const r = parseArduino('LbRGB[ledC] = 0x0000ff;');
    expect(r.problems).toEqual([]);
    expect(r.workspace.blocks.blocks[0]?.fields).toEqual({ LED: 'ledC', COLOR: 'BLUE' });
  });

  // One test per problem reason.
  it('unknown: a line it cannot read is reported, and the lines around it still become blocks', () => {
    const r = parseArduino('LbGripper.open();\nSerial.println("hi");\nLbGripper.close();');
    expect(r.problems).toEqual([{ line: 2, reason: 'unknown' }]);
    expect(types(r)).toEqual(['lb_gripper_open', 'lb_gripper_close']);
  });

  it('unknown: a whole unknown block with braces is skipped as one', () => {
    const r = parseArduino('switch (x) {\n  case 1: break;\n}\nLbMotion.stopAndWait();');
    expect(r.problems).toEqual([{ line: 1, reason: 'unknown' }]);
    expect(types(r)).toEqual(['lb_stop']);
  });

  it('unknown: a colour outside the palette', () => {
    expect(parseArduino('LbRGB[ledO] = CRGB::Lime;').problems).toEqual([
      { line: 1, reason: 'unknown' },
    ]);
  });

  it('missing-end: a mission with no end still holds the code after it', () => {
    const r = parseArduino('LbMission.begin(0);\nLbMotion.stopAndWait();');
    expect(r.problems).toEqual([{ line: 1, reason: 'missing-end' }]);
    expect(types(r)).toEqual(['lb_mission_now', 'lb_stop']);
  });

  it('stray-end: an end with no mission', () => {
    const r = parseArduino('LbMotion.stopAndWait();\nLbMission.end();\nLbGripper.open();');
    expect(r.problems).toEqual([{ line: 2, reason: 'stray-end' }]);
    expect(types(r)).toEqual(['lb_stop', 'lb_gripper_open']);
  });

  it('out-of-range: a number the block cannot hold', () => {
    const r = parseArduino('for (int count = 0; count < 5000; count++) {\n}');
    expect(r.problems).toEqual([{ line: 1, reason: 'out-of-range' }]);
  });

  it('tone-without-delay: a tone needs the wait Pythaverse prints after it', () => {
    const r = parseArduino('Leanbot.tone(1500, 100);\nLbGripper.open();');
    expect(r.problems).toEqual([{ line: 1, reason: 'tone-without-delay' }]);
    expect(types(r)).toEqual(['lb_gripper_open']);
  });

  it('outside-loop: code in setup() or outside the two functions', () => {
    const r = parseArduino(
      '#include <Leanbot.h>\nint x = 0;\nvoid setup() {\n  Leanbot.begin();\n  Serial.begin(9600);\n}\nvoid loop() {\n  LbGripper.open();\n}',
    );
    expect(r.problems).toEqual([
      { line: 2, reason: 'outside-loop' },
      { line: 5, reason: 'outside-loop' },
    ]);
    expect(types(r)).toEqual(['lb_gripper_open']);
  });

  it('nothing to read gives an empty workspace and no problem', () => {
    const r = parseArduino('void setup() {\n}\n\nvoid loop() {\n}');
    expect(r.problems).toEqual([]);
    expect(r.workspace.blocks.blocks).toEqual([]);
  });
});
