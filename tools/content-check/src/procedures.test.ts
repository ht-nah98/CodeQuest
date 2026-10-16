// Rule 25 (spells, ADR-0023 §5): one fixture per sub-rule, each a one-change copy of
// fixtures/spells-samples ((d): of fixtures/baseline). (h) is the level schema's (rule 1) and (i)
// is rule 20's (effective loop depth): their fixtures show who reports them.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LevelSchema } from '@codequest/content-schema';
import { describe, expect, it } from 'vitest';
import { loadContentFiles } from './load';
import { procedureIssues } from './procedures';
import { checkContent } from './rules';

const fixturesDir = fileURLToPath(new URL('../fixtures/', import.meta.url));

function check(name: string) {
  return checkContent(loadContentFiles(`${fixturesDir}${name}`));
}

describe('rule 25: spells', () => {
  it('spells-samples passes every rule with no warning', () => {
    const report = check('spells-samples');
    expect(report.issues).toEqual([]);
    expect(report.warnings).toEqual([]);
  });

  const ERRORS: ReadonlyArray<[string, number[], string]> = [
    ['extra-25a-unknown-spell', [25], '(a) toolbox "cq_proc_call" names spell "nope"'],
    ['extra-25a2-no-procedures', [25, 25], '(a) toolbox "cq_proc_def" names no spell'],
    ['extra-25b-box-block-no-box', [25], '(b) toolbox "cq_proc_def_n" for spell "stair"'],
    // A predict program the engine refuses also has no answer key (rule 15).
    ['extra-25c-two-spells', [15, 25], '(c) initialWorkspace has TWO_SPELLS'],
    ['extra-25d-world-before-8', [25], '(d) spell blocks belong to world 8 or later'],
    ['extra-25e-unpinned-number', [25], '(e) toolbox "cq_proc_call_n" must pin NUM'],
    ['extra-25h-id-clash', [1], 'param id "stairs" is already a box or procedure id'],
    ['extra-25i-depth', [20], 'solution nests loops 2 deep > maxLoopDepth 1'],
    ['extra-25j-box-writer', [25], '(j) toolbox "cq_var_set" uses spell box "steps"'],
  ];

  it.each(ERRORS)('%s reports rules %j', (name, rules, message) => {
    const report = check(name);
    expect(report.warnings).toEqual([]);
    expect(report.issues.map((issue) => issue.rule)).toEqual(rules);
    expect(report.issues.some((issue) => issue.message.includes(message))).toBe(true);
  });

  const WARNINGS: ReadonlyArray<[string, string]> = [
    ['extra-25f-long-name', '(f) spell name "bậc thang rất dài" has 4 words > 3'],
    ['extra-25g-cast-once', '(g) solution casts spell "extra" 0 times < 2'],
  ];

  it.each(WARNINGS)('%s warns rule 25 and fails nothing', (name, message) => {
    const report = check(name);
    expect(report.issues).toEqual([]);
    expect(report.warnings.map((issue) => issue.rule)).toEqual([25]);
    expect(report.warnings[0]?.message).toContain(message);
  });
});

describe('rule 25 (g) details', () => {
  const sample = LevelSchema.parse(
    JSON.parse(
      readFileSync(`${fixturesDir}spells-samples/worlds/_sandbox/levels/proc-stair.json`, 'utf8'),
    ),
  );

  it('exempts predict levels ("dạy mà không làm")', () => {
    const predict = LevelSchema.parse({
      ...sample,
      mode: 'predict',
      par: undefined,
      maxBlocks: undefined,
      maxInstances: undefined,
      solution: undefined,
      initialWorkspace: sample.solution,
      predict: {
        options: [
          { key: 'a', label: 'a' },
          { key: 'b', label: 'b' },
          { key: 'c', label: 'c' },
        ],
      },
    });
    expect(procedureIssues('p', predict, true).warnings).toEqual([]);
  });

  it('counts a cast inside a loop as 2', () => {
    const level = LevelSchema.parse(
      JSON.parse(
        readFileSync(
          `${fixturesDir}extra-25i-depth/worlds/_sandbox/levels/proc-depth.json`,
          'utf8',
        ),
      ),
    );
    expect(procedureIssues('p', level, true).warnings).toEqual([]);
  });
});

describe('rule 25 narrowings (P4-05)', () => {
  const read = (path: string) =>
    LevelSchema.parse(JSON.parse(readFileSync(`${fixturesDir}${path}`, 'utf8')));
  const stair = read('spells-samples/worlds/_sandbox/levels/proc-stair.json');
  const boxes = read('spells-samples/worlds/_sandbox/levels/proc-boxes.json');
  const solution = stair.solution;
  if (solution === undefined) throw new Error('proc-stair has a solution');
  const def = solution.blocks.blocks.find((block) => block.type === 'cq_proc_def');
  if (def === undefined) throw new Error('proc-stair teaches a spell');
  const start = solution.blocks.blocks.find((block) => block.type === 'cq_start');
  const withTops = (tops: object[]) => ({
    blocks: {
      languageVersion: 0 as const,
      blocks: [start, ...tops] as typeof solution.blocks.blocks,
    },
  });
  const emptyDef = { type: 'cq_proc_def', id: 'empty', fields: { PROC: 'stair' } };
  const twice = withTops([def, { ...def, id: 'again', inputs: undefined }]);
  const errors = (level: typeof stair): string[] =>
    procedureIssues('p', level, true).errors.map((issue) => issue.message);

  it('(c) a build or parsons start may leave a dạy phép empty', () => {
    const build = { ...stair, initialWorkspace: withTops([emptyDef]) };
    expect(errors(build)).toEqual([]);
    expect(errors({ ...build, mode: 'parsons' as const })).toEqual([]);
  });

  it('(c) a build start still may not teach a spell twice; a bughunt start may (the bug)', () => {
    expect(errors({ ...stair, initialWorkspace: twice })).toEqual([
      '(c) initialWorkspace has TWO_SPELLS',
    ]);
    expect(errors({ ...stair, mode: 'bughunt' as const, initialWorkspace: twice })).toEqual([]);
  });

  it('(e) an unpinned làm phép … với is fine when the box max is ≤ 9', () => {
    const unpinned = {
      ...boxes,
      toolbox: [
        ...boxes.toolbox.filter(
          (entry) => typeof entry === 'string' || entry.type !== 'cq_proc_call_n',
        ),
        'cq_proc_call_n',
      ],
    };
    expect(errors(unpinned)).toEqual([]);
  });

  it('(j) a box writer in the solution may not use a spell box', () => {
    const steps = { type: 'cq_var_add', id: 'add', fields: { VAR: 'steps', NUM: 1 } };
    const box = boxes.solution;
    if (box === undefined) throw new Error('proc-boxes has a solution');
    const [first, ...rest] = box.blocks.blocks;
    const level = {
      ...boxes,
      solution: {
        blocks: {
          languageVersion: 0 as const,
          blocks: [first, ...rest, steps] as typeof box.blocks.blocks,
        },
      },
    };
    expect(errors(level)).toContain(
      '(j) solution "cq_var_add" uses spell box "steps"; only "lặp [hộp] lần" may',
    );
  });

  it('(g) a cast inside lặp đến khi counts once', () => {
    const until = {
      type: 'cq_repeat_until',
      id: 'u',
      inputs: { DO: { block: { type: 'cq_proc_call', id: 'c', fields: { PROC: 'stair' } } } },
    };
    const level = { ...stair, solution: withTops([def]) };
    const loop = level.solution.blocks.blocks[0];
    if (loop === undefined) throw new Error('start');
    const once = { ...level, solution: withTops([def]) };
    once.solution.blocks.blocks[0] = { ...loop, next: { block: until } };
    expect(procedureIssues('p', once, true).warnings.map((issue) => issue.message)).toEqual([
      '(g) solution casts spell "stair" 1 times < 2: it saves nothing',
    ]);
  });
});
