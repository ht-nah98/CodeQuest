# content:check fixtures

One small, complete content tree per rule of `docs/architecture/content-model.md` §5
(P1-11 acceptance). `baseline/` passes every rule with no warning; each `rule-NN-<what>/` is
`baseline/` with **one** change that breaks rule NN and nothing else. Rule 8 is warning-only,
so its fixture still exits 0.

```bash
npm run content:check -- --dir tools/content-check/fixtures/rule-09-solution-loses   # exit 1
```

`src/fixtures.test.ts` checks every fixture and fails if a rule has no fixture or a fixture
reports any other rule. Assets (rule 18) are looked up in the real `apps/web/public/`.

The trees are test data, not curriculum: Vietnamese copy here is never shown to children.
When you add a rule or change the baseline, keep each fixture a one-change copy of `baseline/`.
