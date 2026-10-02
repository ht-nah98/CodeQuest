import { describe, expect, it } from 'vitest';
import type { HintRule } from '@codequest/content-schema';
import { GLOBAL_HINT_IDS, globalRules, type HintLevel, selectHint } from '../index';
import { hintContext } from './testFixtures';

const level = (hints: HintRule[], extra: Partial<HintLevel> = {}): HintLevel => ({
  mode: 'build',
  toolbox: ['runner_walk', { type: 'cq_repeat', fields: { TIMES: 3 } }],
  hints,
  thinkingHint: 'Con thấy đoạn nào lặp lại không?',
  ...extra,
});
const rule = (id: string, extra: Partial<HintRule> = {}): HintRule => ({
  id,
  when: { trigger: 'run-end' },
  say: id,
  ...extra,
});
const atRunEnd = hintContext({ trigger: 'run-end' });
const idOf = (selection: ReturnType<typeof selectHint>) => selection?.rule.id ?? null;

describe('selectHint (hint-engine.md §5)', () => {
  it('returns null when nothing matches', () => {
    expect(selectHint(level([rule('a')]), hintContext({ trigger: 'change' }))).toBeNull();
  });

  it('returns the rule with its target', () => {
    const selection = selectHint(level([rule('a', { point: 'stage' })]), atRunEnd);
    expect(selection).toEqual({
      source: 'level',
      rule: rule('a', { point: 'stage' }),
      target: 'stage',
    });
    expect(selectHint(level([rule('b')]), atRunEnd)?.target).toBeNull();
  });

  it('picks the highest priority', () => {
    const rules = [rule('low'), rule('high', { priority: 5 }), rule('mid', { priority: 2 })];
    expect(idOf(selectHint(level(rules), atRunEnd))).toBe('high');
  });

  it('breaks a priority tie by declaration order', () => {
    expect(idOf(selectHint(level([rule('first'), rule('second')]), atRunEnd))).toBe('first');
  });

  it('lets a level rule beat a global rule of the same priority', () => {
    const ctx = hintContext({
      trigger: 'run-end',
      analysis: { ...atRunEnd.analysis, orphanBlockIds: ['x'] },
    });
    expect(idOf(selectHint(level([]), ctx))).toBe('g-orphans');
    expect(idOf(selectHint(level([rule('own')]), ctx))).toBe('own');
  });

  it('lets a global rule win with a higher priority than the level rule', () => {
    const ctx = hintContext({ trigger: 'run-end', failStreak: 3 });
    expect(idOf(selectHint(level([rule('own', { priority: -1 })]), ctx))).toBe('g-fail3');
  });

  it('skips once-rules already shown (once is the default)', () => {
    const shown = hintContext({ trigger: 'run-end', shownHintIds: new Set(['a']) });
    expect(idOf(selectHint(level([rule('a'), rule('b')]), shown))).toBe('b');
    expect(idOf(selectHint(level([rule('a', { once: false }), rule('b')]), shown))).toBe('a');
  });

  it('marks global selections', () => {
    const ctx = hintContext({
      trigger: 'run-end',
      lastOutcome: { result: 'timeout', reasonCode: 'TIMEOUT' },
    });
    expect(selectHint(level([]), ctx)).toMatchObject({
      source: 'global',
      rule: { id: 'g-timeout', feedbackReason: 'TIMEOUT' },
      target: null,
    });
  });
});

describe('globalRules (hint-engine.md §4)', () => {
  it('g-empty-run, g-timeout and g-fail3 only speak right after a run', () => {
    const lastRun = {
      lastOutcome: { result: 'timeout', reasonCode: 'TIMEOUT' } as const,
      failStreak: 3,
    };
    expect(selectHint(level([]), hintContext({ ...lastRun, trigger: 'change' }))).toBeNull();
    expect(selectHint(level([]), hintContext({ ...lastRun, trigger: 'idle' }))).toBeNull();
    const empty = { lastOutcome: { result: 'error', reasonCode: 'EMPTY_PROGRAM' } as const };
    expect(selectHint(level([]), hintContext({ ...empty, trigger: 'change' }))).toBeNull();
    expect(idOf(selectHint(level([]), hintContext({ ...lastRun, trigger: 'run-end' })))).toBe(
      'g-timeout',
    );
  });

  const ids = (lvl: HintLevel, ctx = hintContext()) => globalRules(lvl, ctx).map((r) => r.id);

  it('only uses known ids', () => {
    for (const r of globalRules(level([]), hintContext({ isFirstOfModeInWorld: true }))) {
      expect(GLOBAL_HINT_IDS).toContain(r.id);
    }
  });

  it('g-empty-enter: build mode, first of its mode in the world, empty program, at enter', () => {
    const first = hintContext({ trigger: 'enter', isFirstOfModeInWorld: true });
    expect(selectHint(level([]), first)).toMatchObject({
      rule: { id: 'g-empty-enter' },
      target: 'toolbox:runner_walk',
    });
    expect(ids(level([]))).not.toContain('g-empty-enter');
    expect(ids(level([], { mode: 'bughunt' }), first)).not.toContain('g-empty-enter');
    expect(ids(level([], { toolbox: [] }), first)).not.toContain('g-empty-enter');
    const notEmpty = hintContext({
      trigger: 'enter',
      isFirstOfModeInWorld: true,
      analysis: { ...first.analysis, blocksUsed: 1 },
    });
    expect(idOf(selectHint(level([]), notEmpty))).toBeNull();
  });

  it('g-empty-enter reads the type of an object toolbox entry', () => {
    const first = hintContext({ trigger: 'enter', isFirstOfModeInWorld: true });
    const lvl = level([], { toolbox: [{ type: 'cq_repeat', fields: { TIMES: 3 } }] });
    expect(selectHint(lvl, first)?.target).toBe('toolbox:cq_repeat');
  });

  it('g-parsons-enter: parsons mode never played before', () => {
    const parsons = level([], { mode: 'parsons', toolbox: [] });
    const enter = hintContext({ trigger: 'enter' });
    expect(selectHint(parsons, enter)).toMatchObject({
      rule: { id: 'g-parsons-enter' },
      target: 'block:cq_start',
    });
    const seen = hintContext({ trigger: 'enter', seenModes: new Set(['parsons'] as const) });
    expect(selectHint(parsons, seen)).toBeNull();
  });

  it('g-orphans: loose blocks after a run', () => {
    const loose = { ...atRunEnd.analysis, orphanBlockIds: ['x'] };
    expect(idOf(selectHint(level([]), hintContext({ trigger: 'run-end', analysis: loose })))).toBe(
      'g-orphans',
    );
    expect(
      idOf(selectHint(level([]), hintContext({ trigger: 'change', analysis: loose }))),
    ).toBeNull();
  });

  it('g-empty-run: says the EMPTY_PROGRAM feedback and points at the toolbox in build mode', () => {
    const ctx = hintContext({
      trigger: 'run-end',
      lastOutcome: { result: 'error', reasonCode: 'EMPTY_PROGRAM' },
    });
    expect(selectHint(level([]), ctx)).toMatchObject({
      rule: { id: 'g-empty-run', feedbackReason: 'EMPTY_PROGRAM' },
      target: 'toolbox:runner_walk',
    });
    const parsons = level([], { mode: 'parsons' });
    expect(selectHint(parsons, ctx)?.target).toBeNull();
  });

  it('g-idle: 60 s idle before the first run', () => {
    expect(selectHint(level([]), hintContext({ idleMs: 60_000 }))).toMatchObject({
      rule: { id: 'g-idle' },
      target: 'run',
    });
    expect(selectHint(level([]), hintContext({ idleMs: 60_000, runCount: 1 }))).toBeNull();
  });

  it('g-fail3: 3 failed runs in a row, only when the level has a thinking hint', () => {
    expect(idOf(selectHint(level([]), hintContext({ trigger: 'run-end', failStreak: 3 })))).toBe(
      'g-fail3',
    );
    expect(
      idOf(selectHint(level([]), hintContext({ trigger: 'run-end', failStreak: 2 }))),
    ).toBeNull();
    const noThinking = level([], { thinkingHint: undefined });
    expect(
      idOf(selectHint(noThinking, hintContext({ trigger: 'run-end', failStreak: 3 }))),
    ).toBeNull();
  });
});
