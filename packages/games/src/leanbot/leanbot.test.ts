import { Msg, serialization, utils, Workspace, Xml } from 'blockly';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { blockToArduino, LB_GENERATED_TYPES, toArduino } from './arduino';
import { type BlockState, parseArduino, type ParseResult } from './parse';
import { registerLeanbotBlocks } from './register';

// Fixtures from Pythaverse's own editor (23/10/2026): every toolbox block with the code the
// editor printed for it, and five programs saved as XML with the sketch it printed (minus the
// "Generated … at <time>" header). Loaded through Vite: headless packages have no node:fs.
interface ToolboxFixture {
  categories: { path: string[]; blocks: { type: string; xml: string; code: string }[] }[];
}
const toolbox = (await vi.importActual<{ default: ToolboxFixture }>('./fixtures/toolbox.json'))
  .default;
// followline: the official FollowLine_EN sample of Pythaverse's lesson 4, rebuilt from its blocks.
const PROGRAMS = ['full', 'imm', 'arduino', 'procs', 'math', 'followline'] as const;
const programs = Object.fromEntries(
  await Promise.all(
    PROGRAMS.map(async (name) => {
      const xml = await vi.importActual<{ default: string }>(`./fixtures/${name}.xml?raw`);
      const ino = await vi.importActual<{ default: string }>(`./fixtures/${name}.ino?raw`);
      return [name, { xml: xml.default, ino: ino.default }] as const;
    }),
  ),
);

beforeAll(() => {
  registerLeanbotBlocks();
});

function loadXml(xml: string): Workspace {
  const ws = new Workspace();
  Xml.domToWorkspace(utils.xml.textToDom(xml), ws);
  return ws;
}

describe('Leanbot Arduino code = Pythaverse’s', () => {
  const entries = toolbox.categories.flatMap((c) =>
    c.blocks.map((b, i) => [`${c.path.join(' > ')} #${String(i + 1)} ${b.type}`, b] as const),
  );

  // One workspace for all, like the editor the fixture came from: the variable blocks then get
  // the same new names there and here (i, j, k).
  const shared = new Workspace();
  it.each(entries)('%s', (_name, entry) => {
    const block = Xml.domToBlock(utils.xml.textToDom(entry.xml), shared);
    // The comment blocks' default text is the only planned difference: "Comment" there.
    const expected = entry.code.replace('// Comment', '// Mô tả');
    expect(blockToArduino(block)).toBe(expected);
    block.dispose();
  });

  it.each(PROGRAMS)('program %s.xml prints %s.ino exactly', (name) => {
    const { xml, ino } = programs[name] ?? { xml: '', ino: '' };
    expect(toArduino(loadXml(xml)).code).toBe(ino);
  });

  it('every toolbox block has a generator', () => {
    const types = new Set(entries.map(([, b]) => b.type));
    expect([...types].filter((t) => !LB_GENERATED_TYPES.includes(t))).toEqual([]);
  });

  it('turns Vietnamese names into C names without marks', () => {
    const ws = loadXml(
      '<xml><variables><variable type="int" id="d">điểm số</variable></variables>' +
        '<block type="procedures_defnoreturn"><field name="NAME">làm gì đó</field><statement name="STACK">' +
        '<block type="vars_set_int"><field name="VAR_SET_INT" id="d" variabletype="int">điểm số</field>' +
        '<value name="VALUE"><block type="math_number"><field name="NUM">1</field></block></value></block>' +
        '</statement></block></xml>',
    );
    const code = toArduino(ws).code;
    expect(code).toContain('int diem_so;');
    expect(code).toContain('void lam_gi_do() {\n  diem_so = 1;\n}');
  });

  it('a function’s default comment, in any language, prints as Pythaverse’s', () => {
    const ws = loadXml(programs.procs?.xml ?? '');
    const def = ws.getBlocksByType('procedures_defnoreturn', false)[0];
    def?.setCommentText(Msg['PROCEDURES_DEFNORETURN_COMMENT'] ?? '');
    expect(toArduino(ws).code).toBe(programs.procs?.ino);
    def?.setCommentText('Kêu hai lần');
    expect(toArduino(ws).code).toContain('// Kêu hai lần\nvoid chao() {');
  });

  it('an empty workspace is Pythaverse’s empty sketch', () => {
    expect(toArduino(new Workspace()).code).toBe('void setup() {\n}\n\nvoid loop() {\n}');
  });

  it('survives a save and load as JSON', () => {
    const ws = loadXml(programs.math?.xml ?? '');
    const copy = new Workspace();
    serialization.workspaces.load(serialization.workspaces.save(ws), copy);
    expect(toArduino(copy).code).toBe(programs.math?.ino);
  });
});

function load(state: ParseResult['workspace']): Workspace {
  const ws = new Workspace();
  serialization.workspaces.load(state, ws);
  return ws;
}

describe('Arduino code → blocks', () => {
  // Left out: "for each" prints JavaScript (`var k_list = [];`) in Pythaverse too, and a lone
  // "Màu sắc: R G B" / "Dò vạch: ⬜⬜⬜⬜" is a bare number that reads back as a plain colour
  // or number, without the `#include <Leanbot.h>` those two blocks add.
  const NOT_READ_BACK = ['controls_forEach', 'LbRGB.colour_rgb', 'LbIRLine.state'];
  const toolboxEntries = toolbox.categories.flatMap((c) =>
    c.blocks
      .map((b, i) => [`${c.path.join(' > ')} #${String(i + 1)} ${b.type}`, b] as const)
      .filter(([, b]) => !NOT_READ_BACK.includes(b.type)),
  );
  it.each(toolboxEntries)('%s: blocks → code → blocks → the same code', (_name, entry) => {
    const ws = new Workspace();
    Xml.domToBlock(utils.xml.textToDom(entry.xml), ws);
    const code = toArduino(ws).code;
    const parsed = parseArduino(code);
    expect(parsed.problems).toEqual([]);
    expect(toArduino(load(parsed.workspace)).code).toBe(code);
  });

  it.each(PROGRAMS)('%s.ino → blocks → the same code', (name) => {
    const ino = programs[name]?.ino ?? '';
    const parsed = parseArduino(ino);
    expect(parsed.problems).toEqual([]);
    expect(toArduino(load(parsed.workspace)).code).toBe(ino);
  });

  const types = (r: ParseResult) => {
    const out: string[] = [];
    const walk = (block: BlockState | undefined) => {
      if (!block) return;
      out.push(block.type);
      for (const input of Object.values(block.inputs ?? {})) walk(input.block ?? input.shadow);
      walk(block.next?.block);
    };
    for (const top of r.workspace.blocks.blocks) walk(top);
    return out;
  };

  it('reads bare statements without setup() and loop()', () => {
    const r = parseArduino('LbMotion.runLRrpm(30, 30);\nLbMotion.waitDistanceMm(20 * 10);');
    expect(r.problems).toEqual([]);
    expect(types(r)).toEqual([
      'LbMotion.run',
      'math_number',
      'math_number',
      'LbMotion.waitDistanceMm',
      'math_number',
    ]);
  });

  it('accepts code pasted with Pythaverse’s "Generated … at <time>" header', () => {
    const header =
      '//  Generated Leanbot Arduino code\n//    by Leanbot Blockly Editor 2024-09-15\n//    at 2026-10-23 12:07:14\n\n';
    const ino = programs.full?.ino ?? '';
    const r = parseArduino(header + ino);
    expect(r.problems).toEqual([]);
    expect(toArduino(load(r.workspace)).code).toBe(ino);
  });

  it('keeps the source line of each statement block', () => {
    const r = parseArduino('\nLbGripper.open();\n\nLbGripper.close();');
    const first = r.workspace.blocks.blocks[0];
    expect(first && r.lineOf[first.id]).toBe(2);
    const second = first?.next?.block;
    expect(second && r.lineOf[second.id]).toBe(4);
  });

  // One test per problem reason.
  it('unknown: a line no block prints is reported, the lines around it still become blocks', () => {
    const r = parseArduino('LbGripper.open();\nWire.begin();\nLbGripper.close();');
    expect(r.problems).toEqual([{ line: 2, reason: 'unknown' }]);
    expect(types(r)).toEqual(['LbGripper.open', 'LbGripper.close']);
  });

  it('unknown: a value that does not fit where it is (a distance where a question goes)', () => {
    const r = parseArduino('LbGripper.open();\nif (Leanbot.pingCm()) {\n  LbGripper.close();\n}');
    expect(r.problems).toEqual([{ line: 2, reason: 'unknown' }]);
    expect(types(r)).toEqual(['LbGripper.open']);
  });

  it('missing-end: a mission with no end still holds the code after it', () => {
    const r = parseArduino('LbMission.begin(0);\nLbMotion.stopAndWait();');
    expect(r.problems).toEqual([{ line: 1, reason: 'missing-end' }]);
    expect(types(r)).toEqual(['LbMission.beginImmediately_end', 'LbMotion.stop']);
  });

  it('tone-without-delay: a tone needs the wait Pythaverse prints after it', () => {
    const r = parseArduino('Leanbot.tone(1500, 100);\nLbGripper.open();');
    expect(r.problems).toEqual([{ line: 1, reason: 'tone-without-delay' }]);
    expect(types(r)).toEqual(['LbGripper.open']);
  });

  it('outside-loop: setup() and the top only hold what blocks print there', () => {
    const r = parseArduino(
      '#include <Leanbot.h>\n#include <Wire.h>\nvoid setup() {\n  Leanbot.begin();\n  Wire.begin();\n}\nvoid loop() {\n  LbGripper.open();\n}',
    );
    expect(r.problems).toEqual([
      { line: 2, reason: 'outside-loop' },
      { line: 5, reason: 'outside-loop' },
    ]);
    expect(types(r)).toEqual(['LbGripper.open']);
  });

  it('a stray "Nhiệm vụ: Kết thúc" is its own block, as in Pythaverse', () => {
    const r = parseArduino('LbMotion.stopAndWait();\nLbMission.end();');
    expect(r.problems).toEqual([]);
    expect(types(r)).toEqual(['LbMotion.stop', 'LbMission.end']);
  });
});
