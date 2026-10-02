import type { HintContext } from './context';

/** A neutral context for hint tests: empty program, nothing run, nothing shown. */
export function hintContext(overrides: Partial<HintContext> = {}): HintContext {
  return {
    analysis: {
      startBlockId: 'start',
      programBlockIds: [],
      orphanBlockIds: [],
      blocksUsed: 0,
      blockTypesUsed: {},
      topBlockCount: 1,
    },
    capacityLeft: Infinity,
    lastOutcome: null,
    runCount: 0,
    failStreak: 0,
    idleMs: 0,
    shownHintIds: new Set(),
    isFirstOfModeInWorld: false,
    seenModes: new Set(),
    trigger: 'change',
    ...overrides,
  };
}
