# content:check fixtures

One small, complete content tree per rule of `docs/architecture/content-model.md` §5
(P1-11 acceptance). `baseline/` passes every rule with no warning; each `rule-NN-<what>/` is
`baseline/` with **one** change that breaks rule NN and nothing else. Rule 8 is warning-only,
so its fixture still exits 0.

```bash
npm run content:check -- --dir tools/content-check/fixtures/rule-09-solution-loses   # exit 1
```

`extra-01-disabled-block/` is a second rule-1 case (a loose parsons block that carries
Blockly's `"disabledReasons"`, which the level editor once exported, P2-07 review; the level
then drops out of the mode count, so a rule 8 warning follows); it is not named
`rule-01-…` because the test expects exactly one `rule-NN` fixture per rule.

`extra-05-guided-one-hint/` (a guided level with fewer than 2 tier-0 hints) and
`extra-06-ambiguous-pointer/` (a predict hint `block:runner_walk` over two walk blocks) are
second cases of rules 6 and 16.

`src/fixtures.test.ts` checks every fixture and fails if a rule has no fixture or a fixture
reports any other rule. Assets (rule 18) are looked up in the real `apps/web/public/`.

The trees are test data, not curriculum: Vietnamese copy here is never shown to children.
When you add a rule or change the baseline, keep each fixture a one-change copy of `baseline/`.
