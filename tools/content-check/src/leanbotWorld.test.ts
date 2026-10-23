import { describe, expect, it } from 'vitest';
import type { LeanbotWorldLesson } from '@codequest/content-schema';
import { leanbotWorldIssues } from './leanbotWorld';

const mission = (body: string) =>
  `<xml><block type='LbMission.beginImmediately_end'><statement name='Body'>${body}</statement></block></xml>`;
const stop = "<block type='LbMotion.stop'></block>";
const gripper = "<block type='LbGripper.open'></block>";

const lesson = (screen: Record<string, unknown>): LeanbotWorldLesson =>
  ({
    id: 'l9-thu',
    number: 9,
    stage: 0,
    title: 'Thử',
    canDo: 'Thử',
    goals: ['a', 'b'],
    screens: [{ kind: 'build', id: 'a', mode: 'build', task: 'Dừng', ...screen }],
  }) as LeanbotWorldLesson;

describe('rule 29: Thế giới Leanbot lessons', () => {
  const toolbox = ['LbMission.beginImmediately_end', 'LbMotion.stop'];

  it('passes a screen whose toolbox holds its solution', () => {
    expect(leanbotWorldIssues(lesson({ toolbox, solution: mission(stop) }))).toEqual([]);
  });

  it('flags a solution that needs a block the toolbox does not offer', () => {
    const issues = leanbotWorldIssues(lesson({ toolbox, solution: mission(gripper) }));
    expect(issues.map((i) => i.message)).toEqual([
      'screens.0 (a): the solution uses LbGripper.open, which neither the toolbox nor the start offers',
    ]);
  });

  it('a block the starting program holds needs no place in the toolbox', () => {
    const start = mission(gripper);
    const solution = mission(`<block type='LbGripper.open'><next>${stop}</next></block>`);
    expect(leanbotWorldIssues(lesson({ mode: 'fix', toolbox, start, solution }))).toEqual([]);
  });

  it('flags a block type that does not exist', () => {
    const issues = leanbotWorldIssues(
      lesson({ toolbox: [...toolbox, 'LbMotion.fly'], solution: mission(stop) }),
    );
    expect(issues.map((i) => i.message)).toEqual([
      'screens.0 (a).toolbox: unknown block "LbMotion.fly"',
    ]);
  });

  it('flags a screen that starts already solved', () => {
    const issues = leanbotWorldIssues(
      lesson({ mode: 'fix', toolbox, start: mission(stop), solution: mission(stop) }),
    );
    expect(issues.map((i) => i.message)).toEqual([
      'screens.0 (a): the starting program is already the solution',
    ]);
  });

  it('flags a program that does not load', () => {
    const issues = leanbotWorldIssues(
      lesson({ toolbox, solution: '<xml><block type="nope"></block></xml>' }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/^screens\.0 \(a\)\.solution does not load/);
  });
});
