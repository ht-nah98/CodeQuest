import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LevelSchema, type Level } from '@codequest/content-schema';
import { describe, expect, it } from 'vitest';
import { checkTurtleLevel, turtleLevelWarnings } from './turtle';

// Rule 26 (P4-08, ADR-0024): turtle levels beyond the config schema.

const SANDBOX = new URL('../../../content/worlds/_sandbox/levels/', import.meta.url);

function sandbox(id: string): Level {
  const text = readFileSync(fileURLToPath(new URL(`${id}.json`, SANDBOX)), 'utf8');
  return LevelSchema.parse(JSON.parse(text));
}

const messages = (level: Level): string[] =>
  checkTurtleLevel('level.json', level).map((issue) => {
    expect(issue.rule).toBe(26);
    return issue.message;
  });

const square = sandbox('turtle-square');
const config = square.config as Record<string, unknown>;

describe('rule 26 (turtle levels)', () => {
  it.each(['turtle-square', 'turtle-hexagon', 'turtle-squares', 'turtle-predict'])(
    'accepts the sample level %s',
    (id) => {
      expect(messages(sandbox(id))).toEqual([]);
    },
  );

  it('ignores other kinds and leaves an invalid config to rule 1', () => {
    expect(messages({ ...square, kind: 'maze' })).toEqual([]);
    expect(messages({ ...square, config: { ...config, grid: 'hex' } })).toEqual([]);
  });

  it('needs a target in mode build', () => {
    const open = { ...config, target: undefined };
    expect(messages({ ...square, config: open }).join()).toContain('needs a config.target');
  });

  it('rejects a start that is not a vertex of the target', () => {
    const level = { ...square, config: { ...config, start: { x: 2, y: 2, heading: 0 } } };
    expect(messages(level).join()).toContain('not a vertex of the target');
  });

  it('rejects a pinned angle outside config.angles, and an unpinned one', () => {
    const pinned = {
      ...square,
      toolbox: [...square.toolbox, { type: 'turtle_turn_left', fields: { DEG: '60' } }],
    };
    expect(messages(pinned).join()).toContain('pins DEG "60", not in angles 90');
    const open = { ...square, toolbox: [...square.toolbox, 'turtle_turn_left'] };
    expect(messages(open).join()).toContain('must pin DEG');
  });

  it('rejects a pinned step count outside 1–9', () => {
    const level = { ...square, toolbox: [{ type: 'turtle_forward', fields: { N: 12 } }] };
    expect(messages(level).join()).toContain('pins N 12');
    const open = { ...square, toolbox: ['turtle_forward', ...square.toolbox.slice(1)] };
    expect(messages(open)).toEqual([]);
  });

  it('rejects angles in programs outside config.angles', () => {
    const text = JSON.stringify(square.solution).replace('"90"', '"120"');
    const level = { ...square, solution: JSON.parse(text) as Level['solution'] };
    expect(messages(level).join()).toContain('solution turns 120 degrees');
  });

  it('rejects a solution that does not draw exactly the target', () => {
    // One more stroke in the target: the square alone leaves it undrawn.
    const target = [{ from: [1, 3], heading: 0, path: 'F2 R90 F2 R90 F2 R90 F2 R90 U F2 D F1' }];
    const level = { ...square, config: { ...config, size: { w: 5, h: 4 }, target } };
    expect(messages(level).join()).toContain('solution must draw exactly the target (1 missing');
  });

  it('checks the predict cards derived from drawProgram', () => {
    const predict = sandbox('turtle-predict');
    const options = predict.predict?.options ?? [];
    const [first, second, third] = options;
    if (first === undefined || second === undefined || third === undefined) {
      throw new Error('turtle-predict needs 3 options');
    }
    const twice = { ...predict, predict: { options: [first, second, { ...third, ...first }] } };
    expect(messages(twice).join()).toContain('options[2] draws the same as options[0]');
    const none = { ...predict, predict: { options: [second, third, { ...second, label: 'x' }] } };
    expect(messages(none).join()).toContain('matches 0 predict options');
  });
});

describe('rule 26 review cases', () => {
  const warnings = (level: Level): string[] =>
    turtleLevelWarnings('level.json', level).map((issue) => issue.message);

  it('counts a turn without DEG as 30', () => {
    const text = JSON.stringify(square.solution).replace(/,?"fields":\{"DEG":"90"\}/, '');
    const level = { ...square, solution: JSON.parse(text) as Level['solution'] };
    expect(messages(level).join()).toContain('solution turns 30 degrees');
  });

  it('reports a solution that crashes on a stray line', () => {
    const text = JSON.stringify(square.solution).replace('"N":2', '"N":3');
    const level = { ...square, solution: JSON.parse(text) as Level['solution'] };
    const found = messages(level).join();
    expect(found).toContain('1 extra');
    expect(found).toContain('ends crash EXTRA_LINE');
  });

  it('warns when 30° headings mix with the pen going up', () => {
    const level = {
      ...square,
      config: { ...config, angles: [30, 90] },
      toolbox: [...square.toolbox, 'turtle_pen_up'],
    };
    expect(warnings(level).join()).toContain('reach every 30° heading');
    expect(warnings({ ...level, config: { ...config, angles: [60, 120] } })).toEqual([]);
    expect(warnings({ ...square, config: { ...config, angles: [30, 90] } })).toEqual([]);
  });
});
