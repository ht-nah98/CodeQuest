import { describe, expect, it } from 'vitest';
import type { Condition } from '@codequest/content-schema';
import { compare, matches } from '../index';
import { hintContext } from './testFixtures';

const analysis = (blocksUsed: number, types: Record<string, number>, orphans: string[] = []) => ({
  startBlockId: 'start',
  programBlockIds: [],
  orphanBlockIds: orphans,
  blocksUsed,
  blockTypesUsed: types,
  topBlockCount: 1 + (orphans.length > 0 ? 1 : 0),
});

describe('compare (NumCmp)', () => {
  it('checks every bound and passes an empty comparison', () => {
    expect(compare(3, {})).toBe(true);
    expect(compare(3, { lt: 4 })).toBe(true);
    expect(compare(4, { lt: 4 })).toBe(false);
    expect(compare(4, { lte: 4 })).toBe(true);
    expect(compare(5, { lte: 4 })).toBe(false);
    expect(compare(4, { eq: 4 })).toBe(true);
    expect(compare(3, { eq: 4 })).toBe(false);
    expect(compare(4, { gte: 4 })).toBe(true);
    expect(compare(3, { gte: 4 })).toBe(false);
    expect(compare(5, { gt: 4 })).toBe(true);
    expect(compare(4, { gt: 4 })).toBe(false);
  });

  it('ANDs several bounds into a range', () => {
    expect(compare(3, { gte: 2, lt: 4 })).toBe(true);
    expect(compare(4, { gte: 2, lt: 4 })).toBe(false);
  });
});

describe('matches: each condition key (hint-engine.md §3)', () => {
  const cases: Array<{
    key: string;
    cond: Condition;
    yes: Partial<Parameters<typeof hintContext>[0]>;
    no: Partial<Parameters<typeof hintContext>[0]>;
  }> = [
    {
      key: 'trigger',
      cond: { trigger: 'enter' },
      yes: { trigger: 'enter' },
      no: { trigger: 'run-end' },
    },
    {
      key: 'blockCount',
      cond: { blockCount: { gte: 2 } },
      yes: { analysis: analysis(2, { runner_walk: 2 }) },
      no: { analysis: analysis(1, { runner_walk: 1 }) },
    },
    {
      key: 'topBlockCount',
      cond: { topBlockCount: { gt: 1 } },
      yes: { analysis: analysis(0, {}, ['loose']) },
      no: { analysis: analysis(0, {}) },
    },
    {
      key: 'has',
      cond: { has: 'cq_repeat' },
      yes: { analysis: analysis(1, { cq_repeat: 1 }) },
      no: { analysis: analysis(1, { runner_walk: 1 }) },
    },
    {
      key: 'missing',
      cond: { missing: 'cq_repeat' },
      yes: { analysis: analysis(1, { runner_walk: 1 }) },
      no: { analysis: analysis(1, { cq_repeat: 1 }) },
    },
    {
      key: 'orphans: true',
      cond: { orphans: true },
      yes: { analysis: analysis(0, {}, ['loose']) },
      no: { analysis: analysis(0, {}) },
    },
    {
      key: 'orphans: false',
      cond: { orphans: false },
      yes: { analysis: analysis(0, {}) },
      no: { analysis: analysis(0, {}, ['loose']) },
    },
    {
      key: 'capacityFull: true',
      cond: { capacityFull: true },
      yes: { capacityLeft: 0 },
      no: { capacityLeft: 1 },
    },
    {
      key: 'capacityFull: false',
      cond: { capacityFull: false },
      yes: { capacityLeft: Infinity },
      no: { capacityLeft: 0 },
    },
    {
      key: 'lastResult',
      cond: { lastResult: 'timeout' },
      yes: { lastOutcome: { result: 'timeout', reasonCode: 'TIMEOUT' } },
      no: { lastOutcome: { result: 'crash', reasonCode: 'FELL_IN_HOLE' } },
    },
    {
      key: 'lastReason',
      cond: { lastReason: 'FELL_IN_HOLE' },
      yes: { lastOutcome: { result: 'crash', reasonCode: 'FELL_IN_HOLE' } },
      no: { lastOutcome: { result: 'success', reasonCode: null } },
    },
    { key: 'runCount', cond: { runCount: { eq: 0 } }, yes: { runCount: 0 }, no: { runCount: 1 } },
    {
      key: 'failStreak',
      cond: { failStreak: { gte: 3 } },
      yes: { failStreak: 3 },
      no: { failStreak: 2 },
    },
    {
      key: 'idleSeconds',
      cond: { idleSeconds: { gte: 60 } },
      yes: { idleMs: 60_000 },
      no: { idleMs: 59_999 },
    },
  ];

  it.each(cases)('$key', ({ cond, yes, no }) => {
    expect(matches(cond, hintContext(yes))).toBe(true);
    expect(matches(cond, hintContext(no))).toBe(false);
  });

  it('never matches lastResult / lastReason before the first run', () => {
    expect(matches({ lastResult: 'timeout' }, hintContext())).toBe(false);
    expect(matches({ lastReason: 'TIMEOUT' }, hintContext())).toBe(false);
  });

  it('matches everything with an empty condition', () => {
    expect(matches({}, hintContext())).toBe(true);
  });

  it('ANDs the keys of one object', () => {
    const cond: Condition = { trigger: 'run-end', lastReason: 'FELL_IN_HOLE' };
    const fell = { result: 'crash', reasonCode: 'FELL_IN_HOLE' } as const;
    expect(matches(cond, hintContext({ trigger: 'run-end', lastOutcome: fell }))).toBe(true);
    expect(matches(cond, hintContext({ trigger: 'change', lastOutcome: fell }))).toBe(false);
    expect(matches(cond, hintContext({ trigger: 'run-end' }))).toBe(false);
  });
});

describe('matches: all / any / not', () => {
  const enter: Condition = { trigger: 'enter' };
  const empty: Condition = { blockCount: { eq: 0 } };
  const atEnter = hintContext({ trigger: 'enter' });
  const onChange = hintContext({ trigger: 'change' });

  it('all needs every condition', () => {
    expect(matches({ all: [enter, empty] }, atEnter)).toBe(true);
    expect(matches({ all: [enter, empty] }, onChange)).toBe(false);
  });

  it('any needs one condition', () => {
    expect(matches({ any: [{ trigger: 'idle' }, enter] }, atEnter)).toBe(true);
    expect(matches({ any: [{ trigger: 'idle' }, enter] }, onChange)).toBe(false);
  });

  it('not negates', () => {
    expect(matches({ not: enter }, onChange)).toBe(true);
    expect(matches({ not: enter }, atEnter)).toBe(false);
  });

  it('nests', () => {
    const cond: Condition = {
      all: [{ not: { has: 'cq_repeat' } }, { any: [enter, { runCount: { gte: 2 } }] }],
    };
    expect(matches(cond, atEnter)).toBe(true);
    expect(matches(cond, hintContext({ runCount: 2 }))).toBe(true);
    expect(matches(cond, hintContext({ runCount: 1 }))).toBe(false);
  });
});
