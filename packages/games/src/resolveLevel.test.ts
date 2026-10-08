import { describe, expect, it } from 'vitest';
import { resolveLevelConfigs } from './resolveLevel';
import { robotlabResolvedSchema, type RobotLabRules } from './robotlab';

const shared: RobotLabRules = {
  timeLimit: 120,
  costs: { forward: 2, turn: 1, grab: 2, release: 2 },
  points: { contain: 45, neutralize: 160, retrieve: 100, return: 40 },
};

const map = {
  map: ['###', '.L.', '###'],
  startDir: 'E',
  goal: { type: 'missions', mustReturn: true },
};

describe('resolveLevelConfigs', () => {
  it('merges the shared rules into config and every variant of a robotlab level', () => {
    const level = {
      kind: 'robotlab',
      config: { ...map, rules: { timeLimit: 14 } },
      variants: [{ ...map, startDir: 'W' }],
    };
    const resolved = resolveLevelConfigs(level, { robotlab: shared });
    expect(robotlabResolvedSchema.parse(resolved.config).rules).toEqual({
      ...shared,
      timeLimit: 14,
    });
    expect(robotlabResolvedSchema.parse(resolved.variants[0]).rules).toEqual(shared);
    // Pure: the level as written is unchanged.
    expect(level.config.rules).toEqual({ timeLimit: 14 });
  });

  it('changes nothing when run again on a resolved level', () => {
    const level = { kind: 'robotlab', config: { ...map, rules: { timeLimit: 14 } } };
    const once = resolveLevelConfigs(level, { robotlab: shared });
    expect(resolveLevelConfigs(once, { robotlab: shared })).toEqual(once);
  });

  it('leaves other kinds, invalid configs and missing shared rules as written', () => {
    const maze = { kind: 'maze', config: { map: ['S.G'] } };
    expect(resolveLevelConfigs(maze, { robotlab: shared })).toBe(maze);
    const robot = { kind: 'robotlab', config: map };
    expect(resolveLevelConfigs(robot, {})).toBe(robot);
    const broken = { kind: 'robotlab', config: { ...map, startDir: 'X' } };
    expect(resolveLevelConfigs(broken, { robotlab: shared }).config).toBe(broken.config);
  });
});
