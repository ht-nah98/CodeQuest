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
  it('has exactly one fixture for each of the 18 rules', () => {
    expect(ruleFixtures.map((fixture) => fixture.rule)).toEqual(
      Array.from({ length: 18 }, (_, index) => index + 1),
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
