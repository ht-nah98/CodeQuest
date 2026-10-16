// W1–W7 engine regression (P4-02, ADR-0023 §Hệ quả): spells change compileProgram, runLevel,
// loopDepth, editDistance and nextStep, and none of it may change a level without spells. Every
// W1–W7 solution and initialWorkspace is run and digested; the snapshot was generated on the
// tree before P4-02 (a `git worktree` of HEAD f56bb79) and must keep matching.
import { readFileSync, readdirSync } from 'node:fs';
import { LevelSchema, type Level, type WorkspaceJson } from '@codequest/content-schema';
import {
  analyzeWorkspace,
  editDistance,
  fnv1a,
  loopDepth,
  nextStep,
  runLevel,
} from '@codequest/engine';
import { getGameKind, resolveLevelConfigs, robotlabRulesSchema } from '@codequest/games';
import { describe, expect, it } from 'vitest';

const contentDir = new URL('../../../content/', import.meta.url);
const shared = {
  robotlab: robotlabRulesSchema.parse(
    JSON.parse(readFileSync(new URL('shared/robotlab.json', contentDir), 'utf8')),
  ),
};
const worlds = readdirSync(new URL('worlds/', contentDir))
  .filter((name) => /^w0[1-7]-/.test(name))
  .sort();

function levelsOf(world: string): Level[] {
  const dir = new URL(`worlds/${world}/`, contentDir);
  const { levelIds } = JSON.parse(readFileSync(new URL('world.json', dir), 'utf8')) as {
    levelIds: string[];
  };
  return levelIds.map((id) =>
    resolveLevelConfigs(
      LevelSchema.parse(JSON.parse(readFileSync(new URL(`levels/${id}.json`, dir), 'utf8'))),
      shared,
    ),
  );
}

const hash = (value: unknown): string => {
  const text = value === undefined ? 'undefined' : JSON.stringify(value);
  return fnv1a(text).toString(16);
};

function digest(level: Level, workspace: WorkspaceJson): Record<string, unknown> {
  const kind = getGameKind(level.kind);
  if (kind === undefined) return { kind: 'missing' };
  const outcome = runLevel({ kind, level, workspace });
  return {
    result: outcome.result,
    reasonCode: outcome.reasonCode,
    stats: outcome.stats,
    answerKey: outcome.answerKey,
    edits: outcome.edits,
    goals: outcome.goals,
    mapIndex: outcome.mapIndex,
    events: outcome.events.length,
    eventsHash: hash(outcome.events),
    mapsHash: outcome.maps === undefined ? undefined : hash(outcome.maps),
    loopDepth: loopDepth(workspace),
    blocksUsed: analyzeWorkspace(workspace, level.variables).blocksUsed,
  };
}

describe.each(worlds)('engine on %s is unchanged by spells', (world) => {
  it('runs every solution and initialWorkspace as before', () => {
    const out: Record<string, unknown> = {};
    for (const level of levelsOf(world)) {
      const entry: Record<string, unknown> = {};
      if (level.solution !== undefined) entry['solution'] = digest(level, level.solution);
      if (level.initialWorkspace !== undefined) {
        entry['initial'] = digest(level, level.initialWorkspace);
      }
      if (level.solution !== undefined && level.initialWorkspace !== undefined) {
        entry['editDistance'] = editDistance(level.initialWorkspace, level.solution);
        entry['nextStep'] = hash(nextStep(level.solution, level.initialWorkspace) ?? null);
      }
      out[level.id] = entry;
    }
    expect(out).toMatchSnapshot();
  });
});
