// `variables`, `countGoal` and the lesson demo's boxes (P3-09, ADR-0022 §1, §2b): every error
// branch of the schema.
import { describe, expect, it } from 'vitest';
import { LessonCardSchema, LevelSchema } from './index';

const workspace = {
  blocks: { languageVersion: 0, blocks: [{ type: 'cq_start', id: 'start' }] },
};

const level = {
  id: 'w07-l03',
  worldId: 'w07-cho-dem-so',
  stage: 'practice',
  kind: 'maze',
  mode: 'build',
  title: 'Đếm măng',
  objective: 'Đếm đúng số măng',
  learningGoal: 'Đếm bằng hộp',
  toolbox: ['maze_forward'],
  par: 5,
  config: {},
  variants: [{}],
  solution: workspace,
  hints: [],
  variables: [{ id: 'bamboo', name: 'số măng', start: [0, 1], max: 9 }],
  countGoal: { var: 'bamboo', equals: [2, 4] },
};

/** The messages of a failed level parse. */
function problems(value: object): string[] {
  const result = LevelSchema.safeParse(value);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('LevelSchema variables and countGoal', () => {
  it('accepts boxes with one start and one equals per map', () => {
    expect(problems(level)).toEqual([]);
    const plain: Record<string, unknown> = { ...level };
    delete plain['variables'];
    delete plain['countGoal'];
    expect(problems(plain)).toEqual([]);
  });

  it.each([
    ['a bad id', { variables: [{ id: 'Bamboo', name: 'x' }] }, 'variable id must match'],
    [
      'more than 2 boxes',
      { variables: ['a', 'b', 'c'].map((id) => ({ id, name: id })) },
      'Too big',
    ],
    ['max over 20', { variables: [{ id: 'a', name: 'a', max: 21 }] }, 'Too big'],
    [
      'duplicate ids',
      {
        variables: [
          { id: 'a', name: 'a' },
          { id: 'a', name: 'b' },
        ],
        countGoal: undefined,
      },
      'duplicate variable "a"',
    ],
    [
      'start of the wrong length',
      { variables: [{ id: 'bamboo', name: 'b', start: [1] }] },
      '"start" needs one number per map (2), has 1',
    ],
    [
      'start over max',
      { variables: [{ id: 'bamboo', name: 'b', start: [0, 5], max: 4 }] },
      'start 5 > max 4',
    ],
    ['a negative start', { variables: [{ id: 'bamboo', name: 'b', start: [0, -1] }] }, 'Too small'],
    [
      'countGoal on an undeclared box',
      { countGoal: { var: 'fish', equals: [1, 1] } },
      'countGoal.var "fish" is not a declared variable',
    ],
    [
      'equals of the wrong length',
      { countGoal: { var: 'bamboo', equals: [1] } },
      '"equals" needs one number per map (2), has 1',
    ],
    ['equals over max', { countGoal: { var: 'bamboo', equals: [1, 10] } }, 'equals 10 > max 9'],
    [
      'countGoal in mode predict',
      {
        mode: 'predict',
        variants: undefined,
        variables: [{ id: 'bamboo', name: 'b' }],
        countGoal: { var: 'bamboo', equals: [1] },
        initialWorkspace: workspace,
        predict: {
          options: ['a', 'b', 'c'].map((key) => ({
            key: `win#bamboo=${String(key.length)}${key}`,
            label: key,
          })),
        },
      },
      '"countGoal" only fits modes build, bughunt and parsons',
    ],
  ])('rejects %s', (_name, change, message) => {
    expect(problems({ ...level, ...change }).join(' | ')).toContain(message);
  });
});

describe('lesson demo card with boxes', () => {
  const demo = { type: 'demo', text: 'Xem hộp', kind: 'maze', config: {}, workspace };

  it('accepts boxes with at most one start number', () => {
    expect(
      LessonCardSchema.safeParse({ ...demo, variables: [{ id: 'bamboo', name: 'số măng' }] })
        .success,
    ).toBe(true);
    expect(
      LessonCardSchema.safeParse({
        ...demo,
        variables: [{ id: 'bamboo', name: 'số măng', start: [3] }],
      }).success,
    ).toBe(true);
  });

  it('rejects a demo start with more than one number (a demo has one map)', () => {
    const result = LessonCardSchema.safeParse({
      ...demo,
      variables: [{ id: 'bamboo', name: 'số măng', start: [3, 4] }],
    });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      '"start" needs one number per map (1), has 2',
    ]);
  });
});
