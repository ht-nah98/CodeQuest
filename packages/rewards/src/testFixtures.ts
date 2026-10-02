import type { Level, RunSummary } from '@codequest/content-schema';
import type { LedgerEntry, LevelSession } from './types';

// Shared builders for this package's tests only (not exported from index.ts).

/** `undefined` in overrides removes the field (e.g. `par` for predict levels). */
export function makeLevel(overrides: { [K in keyof Level]?: Level[K] | undefined } = {}): Level {
  const level: Record<string, unknown> = {
    id: 'w01-l03',
    worldId: 'w01',
    stage: 'practice',
    kind: 'runner',
    mode: 'build',
    title: 'Test',
    objective: 'Test',
    learningGoal: 'Test',
    toolbox: ['runner_walk'],
    par: 4,
    config: {},
    hints: [],
  };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) Reflect.deleteProperty(level, key);
    else level[key] = value;
  }
  return level as Level;
}

let runCounter = 0;

export function run(result: RunSummary['result'], extra: Partial<RunSummary> = {}): RunSummary {
  runCounter++;
  return {
    runId: `run-${String(runCounter)}`,
    result,
    reasonCode: result === 'success' ? null : 'X',
    blocksUsed: 4,
    ...extra,
  };
}

export function session(
  runs: RunSummary[],
  hintTiersBought: LevelSession['hintTiersBought'] = [],
  levelId = 'w01-l03',
): LevelSession {
  return { levelId, runs, hintTiersBought };
}

export function entry(id: string, overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    id,
    profileId: 'p1',
    delta: 0,
    reason: 'coach-adjust',
    refId: null,
    at: '2026-03-10T03:00:00.000Z',
    localDay: '2026-03-10',
    ...overrides,
  };
}

/** Noon in Vietnam (05:00 UTC) on the given local day. */
export function vnNoon(day: string): Date {
  return new Date(`${day}T05:00:00.000Z`);
}
