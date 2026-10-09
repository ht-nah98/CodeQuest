// Rule 23 (variables, P3-09, ADR-0022 §5): one fixture per sub-rule, each a one-change copy of
// fixtures/variables-samples (or, for (g), of fixtures/baseline). (l) "no shoot on G" needs no
// fixture: a maze cell holds one tile, so `b` can never be on `G`.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadContentFiles } from './load';
import { checkContent } from './rules';

const fixturesDir = fileURLToPath(new URL('../fixtures/', import.meta.url));

function check(name: string) {
  return checkContent(loadContentFiles(`${fixturesDir}${name}`));
}

describe('rule 23: variables', () => {
  it('variables-samples passes every rule with no warning', () => {
    const report = check('variables-samples');
    expect(report.issues).toEqual([]);
    expect(report.warnings).toEqual([]);
    expect(report.entries.map((entry) => entry.detail).filter(Boolean)).toEqual([
      'robotlab/build  par 8  sol 8  maps 2',
      'maze/build  par 5  sol 5  maps 2',
      'maze/build  par 4  sol 4  maps 3',
    ]);
  });

  const ERRORS: ReadonlyArray<[string, string]> = [
    ['extra-23a-unpinned', '(a) toolbox "cq_var_add" must pin NUM'],
    ['extra-23b-unknown-box', '(b) toolbox "cq_var_set" names box "fish", which is not declared'],
    ['extra-23c-no-variables', '(c) uses variable blocks (cq_var_set, cq_var_add)'],
    ['extra-23e-add-zero', '(e) toolbox "cq_var_add" NUM 0 is not a whole number ≥ 1'],
    ['extra-23g-world-before-7', '(g) variable blocks belong to world 7 or later, not world 1'],
    ['extra-23j-predict-key', '(j) predict key "stop@1,3" must end with #<id>=<n> for order'],
    ['extra-23k-num-over-max', '(k) toolbox "cq_var_set" NUM 12 > max 9 of "bamboo"'],
    ['extra-23r4-steering-one-map', '(R4) a box that steers the program'],
    ['extra-23r4-same-count', '(R4) a counting level needs at least 2 maps'],
  ];

  it.each(ERRORS)('%s reports rule 23 and nothing else', (name, message) => {
    const report = check(name);
    expect(report.warnings).toEqual([]);
    expect(report.issues.map((issue) => issue.rule)).toEqual([23]);
    expect(report.issues[0]?.message).toContain(message);
  });

  const WARNINGS: ReadonlyArray<[string, string]> = [
    ['extra-23d-unused-variables', '(d) "variables" are declared but no toolbox entry'],
    ['extra-23f-count-unchanged', '(f) countGoal box "bamboo" is never set or increased'],
    ['extra-23h-long-name', '(h) box name "số măng trong giỏ" has 4 words > 3'],
    ['extra-23i-repeat-changes-box', '(i) initialWorkspace changes box "order" inside'],
  ];

  it.each(WARNINGS)('%s warns rule 23 and fails nothing', (name, message) => {
    const report = check(name);
    expect(report.issues).toEqual([]);
    expect(report.warnings.map((issue) => issue.rule)).toEqual([23]);
    expect(report.warnings[0]?.message).toContain(message);
  });
});
