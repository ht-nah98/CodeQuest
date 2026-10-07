// P1-11 acceptance: every rule of content-model.md §5 has a fixture that is caught correctly.
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadContentFiles } from './load';
import { checkContent } from './rules';

const fixturesDir = fileURLToPath(new URL('../fixtures/', import.meta.url));
const mainPath = fileURLToPath(new URL('./main.ts', import.meta.url));
const ruleFixtures = readdirSync(fixturesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith('rule-'))
  .map((entry) => ({ name: entry.name, rule: Number(entry.name.slice('rule-'.length, 7)) }));

/** Only rule 8 is warning-only (content-model.md §5). */
const WARNING_RULES = new Set([8]);

function check(name: string) {
  return checkContent(loadContentFiles(`${fixturesDir}${name}`));
}

/** Runs the CLI on a fixture and returns its exit code and output. */
function cli(name: string): { status: number; output: string } {
  try {
    const output = execFileSync(
      process.execPath,
      ['--import', 'tsx', mainPath, '--dir', `${fixturesDir}${name}`],
      {
        encoding: 'utf8',
      },
    );
    return { status: 0, output };
  } catch (error) {
    const failed = error as { status: number; stdout: string };
    return { status: failed.status, output: failed.stdout };
  }
}

describe('content:check fixtures', () => {
  it('has exactly one fixture for each of the 21 rules', () => {
    expect(ruleFixtures.map((fixture) => fixture.rule)).toEqual(
      Array.from({ length: 21 }, (_, index) => index + 1),
    );
  });

  it('passes the baseline with no error and no warning', () => {
    const report = check('baseline');
    expect(report.issues).toEqual([]);
    expect(report.warnings).toEqual([]);
  });

  it.each(ruleFixtures)('$name reports rule $rule and nothing else', ({ name, rule }) => {
    const report = check(name);
    const errors = report.issues.map((issue) => issue.rule);
    const warnings = report.warnings.map((issue) => issue.rule);
    if (WARNING_RULES.has(rule)) {
      expect(errors).toEqual([]);
      expect(warnings.length).toBeGreaterThan(0);
      expect(new Set(warnings)).toEqual(new Set([rule]));
    } else {
      expect(warnings).toEqual([]);
      expect(errors.length).toBeGreaterThan(0);
      expect(new Set(errors)).toEqual(new Set([rule]));
    }
  });

  it('extra-01-disabled-block reports rule 1 for a disabled parsons block', () => {
    const report = check('extra-01-disabled-block');
    // The unreadable level drops out of the world's mode count: a rule 8 warning follows.
    expect(report.warnings.map((issue) => issue.rule)).toEqual([8]);
    expect(report.issues.map((issue) => issue.rule)).toEqual([1]);
    expect(report.issues[0]?.message).toContain('disabledReasons');
  });

  it('extra-02-variant-loses reports rule 9 on the map the solution loses (P2-12)', () => {
    const report = check('extra-02-variant-loses');
    expect(report.warnings).toEqual([]);
    expect(report.issues.map((issue) => issue.rule)).toEqual([9]);
    expect(report.issues[0]?.message).toBe(
      'solution ends crash FELL_IN_HOLE (crash:FELL_IN_HOLE@3) on map 2',
    );
  });

  it('extra-03-variants-in-predict reports rule 1: variants only fit build and bughunt', () => {
    const report = check('extra-03-variants-in-predict');
    // The unreadable level drops out of the world's mode count: a rule 8 warning follows.
    expect(report.warnings.map((issue) => issue.rule)).toEqual([8]);
    expect(report.issues.map((issue) => issue.rule)).toEqual([1]);
    expect(report.issues[0]?.message).toContain('"variants" only fits modes build and bughunt');
  });

  it('rule-19-star-goal-missed reports the solution that wins without the shoot (P2-21)', () => {
    const report = check('rule-19-star-goal-missed');
    expect(report.issues.map((issue) => issue.message)).toEqual([
      'solution wins but misses star goal "collectAll"',
    ]);
  });

  it('extra-04-star-goal-redundant reports rule 19: config.goal.collectAll already requires it', () => {
    const report = check('extra-04-star-goal-redundant');
    expect(report.warnings).toEqual([]);
    expect(report.issues.map((issue) => issue.message)).toEqual([
      'star goal "collectAll" adds nothing: config.goal.collectAll already requires every shoot to win',
    ]);
  });

  it('rule-20-block-limits reports a solution over maxInstances (P2-11)', () => {
    const report = check('rule-20-block-limits');
    expect(report.issues.map((issue) => issue.message)).toEqual([
      'solution has 2 "runner_walk" > maxInstances 1',
    ]);
  });

  it('extra-05-guided-one-hint reports rule 6: a guided level needs 2 tier-0 hints', () => {
    const report = check('extra-05-guided-one-hint');
    expect(report.warnings).toEqual([]);
    expect(report.issues.map((issue) => issue.message)).toEqual([
      'stage guided needs at least 2 tier-0 hints, has 0',
    ]);
  });

  it('extra-07-cage-without-key reports rule 1: a cage needs a key item (P2-11c)', () => {
    const report = check('extra-07-cage-without-key');
    expect(report.issues.map((issue) => issue.rule)).toEqual([1]);
    expect(report.issues[0]?.message).toContain('"cage" needs a "key" item');
  });

  it('extra-06-ambiguous-pointer reports rule 16: block:<type> must name one block', () => {
    const report = check('extra-06-ambiguous-pointer');
    expect(report.warnings).toEqual([]);
    expect(report.issues.map((issue) => issue.message)).toEqual([
      'hint "read" points to block:runner_walk, but initialWorkspace has 2 such blocks; the arrow lands on the first one',
    ]);
  });

  it('exits 0 on the baseline, 0 on warnings only and 1 on errors', () => {
    const baseline = cli('baseline');
    expect(baseline.status).toBe(0);
    expect(baseline.output).toContain('✔ w01-l01 runner/build  par 3  sol 3  ok');

    const warning = cli('rule-08-no-bughunt');
    expect(warning.status).toBe(0);
    expect(warning.output).toContain('⚠ w01-fixture  rule 8: world has no bughunt level');

    const error = cli('rule-09-solution-loses');
    expect(error.status).toBe(1);
    expect(error.output).toContain(
      '✖ w01-l01  rule 9: solution ends crash FELL_IN_HOLE (crash:FELL_IN_HOLE@2)',
    );
  }, 60_000);
});
