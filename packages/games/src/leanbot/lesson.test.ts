import { describe, expect, it } from 'vitest';
import { checkProgram, programBlockTypes, programCode, toolboxXml } from './lesson';

const sketch = (...body: string[]) =>
  [
    '#include <Leanbot.h>',
    '',
    'void setup() {',
    '  Leanbot.begin();',
    '}',
    '',
    'void loop() {',
    ...body.map((l) => `  ${l}`),
    '}',
  ].join('\n');

describe('checkProgram', () => {
  const solution = sketch(
    'LbMission.begin(0);',
    'LbMotion.runLRrpm(30, 30);',
    'LbMotion.waitDistanceMm(10 * 10);',
    'LbMission.end();',
  );

  it('is right when the code is the same, blank lines and trailing spaces aside', () => {
    expect(
      checkProgram(`${solution.replace('begin(0);', 'begin(0);   \n')}\n\n`, [solution]),
    ).toEqual({ ok: true });
  });

  it('points at the first line that differs', () => {
    const mine = solution.replace('runLRrpm(30, 30)', 'runLRrpm(30, -30)');
    expect(checkProgram(mine, [solution])).toEqual({
      ok: false,
      problem: 'different',
      line: 8,
      say: null,
    });
  });

  it('says blocks are missing before the line that comes too early', () => {
    const mine = sketch('LbMission.begin(0);', 'LbMission.end();');
    expect(checkProgram(mine, [solution])).toEqual({
      ok: false,
      problem: 'missing',
      line: 8,
      say: null,
    });
  });

  it('says a block is extra when the solution goes on after it', () => {
    const mine = sketch(
      'LbMission.begin(0);',
      'LbGripper.open();',
      'LbMotion.runLRrpm(30, 30);',
      'LbMotion.waitDistanceMm(10 * 10);',
      'LbMission.end();',
    );
    expect(checkProgram(mine, [solution])).toEqual({
      ok: false,
      problem: 'extra',
      line: 8,
      say: null,
    });
  });

  it('says blocks are missing at the end when the code stops short', () => {
    const mine = solution.split('\n').slice(0, 9).join('\n');
    expect(checkProgram(mine, [solution])).toEqual({
      ok: false,
      problem: 'missing',
      line: null,
      say: null,
    });
  });

  it('gives the hint whose text is in the child’s code', () => {
    const mine = solution.replace('runLRrpm(30, 30)', 'runLRrpm(30, -30)');
    const hints = [{ match: 'runLRrpm(30, -30)', say: 'Đi thẳng thì hai bánh cùng dấu.' }];
    expect(checkProgram(mine, [solution], hints)).toMatchObject({
      say: 'Đi thẳng thì hai bánh cùng dấu.',
    });
  });

  it('accepts any of the accepted programs', () => {
    const other = solution.replace('10 * 10', '100');
    expect(checkProgram(other, [solution, other])).toEqual({ ok: true });
  });

  it('an empty workspace is not right', () => {
    expect(checkProgram('void setup() {\n}\n\nvoid loop() {\n}', [solution]).ok).toBe(false);
  });
});

describe('lesson programs', () => {
  const xml =
    "<xml><block type='LbMission.beginImmediately_end'><statement name='Body'>" +
    "<block type='Leanbot.delay'><field name='Unit'>seconds</field><value name='Delay'><shadow type='math_number'><field name='NUM'>3</field></shadow></value></block>" +
    '</statement></block></xml>';

  it('prints the code of a saved program', () => {
    expect(programCode(xml)).toBe(
      sketch('LbMission.begin(0);', 'LbDelay(3 * 1000);', 'LbMission.end();'),
    );
  });

  it('lists the blocks a child drags in, not the numbers that come with them', () => {
    expect(programBlockTypes(xml).sort()).toEqual([
      'LbMission.beginImmediately_end',
      'Leanbot.delay',
    ]);
  });

  it('takes a block’s starting values from Pythaverse’s toolbox', () => {
    expect(toolboxXml('Leanbot.delay')).toContain("<field name='NUM'>1.25</field>");
    expect(toolboxXml('vars_set_int')).toBe("<block type='vars_set_int'></block>");
  });
});
