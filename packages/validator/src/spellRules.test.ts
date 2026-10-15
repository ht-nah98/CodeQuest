import { LevelSchema } from '@codequest/content-schema';
import { resolveLevelConfigs } from '@codequest/games';
import { describe, expect, it } from 'vitest';
import { robotlabTimeIssues } from './levelRules';

const rules = {
  timeLimit: 100,
  costs: { forward: 1, turn: 1, grab: 1, release: 1 },
  points: { contain: 1, neutralize: 1, retrieve: 1, return: 1 },
};

const level = LevelSchema.parse({
  id: 'robot-spell',
  worldId: '_sandbox',
  stage: 'practice',
  kind: 'robotlab',
  mode: 'build',
  title: 't',
  objective: 'o',
  learningGoal: 'g',
  toolbox: ['robot_forward'],
  par: 1,
  limits: { maxActions: 300 },
  config: {
    map: ['L..', '...', '...'],
    startDir: 'E',
    goal: { type: 'missions', mustReturn: true },
  },
  solution: { blocks: { languageVersion: 0, blocks: [{ type: 'cq_start', id: 'start' }] } },
  hints: [],
});

describe('rule 1 robotlab time vs actions with spells (ADR-0023 §3)', () => {
  it('counts call and ret per pass when the level has spells', () => {
    // 100 s / 1 s × 2 + 2 = 202 actions fit 300; with spells × 4 + 2 = 402 do not.
    expect(robotlabTimeIssues(resolveLevelConfigs(level, { robotlab: rules }))).toEqual([]);
    const withSpells = { ...level, procedures: [{ id: 'hop', name: 'nhảy' }] };
    const issues = robotlabTimeIssues(resolveLevelConfigs(withSpells, { robotlab: rules }));
    expect(issues.map((issue) => issue.rule)).toEqual([1]);
    expect(issues[0]?.message).toContain('402 actions');
  });
});
