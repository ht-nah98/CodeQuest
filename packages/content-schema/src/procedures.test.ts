import { describe, expect, it } from 'vitest';
import { LevelSchema, procedureBoxes } from './index';

const workspace = {
  blocks: {
    languageVersion: 0,
    blocks: [{ type: 'cq_start', id: 'start', deletable: false }],
  },
};

const mazeLevel = {
  id: 'proc-a',
  worldId: '_sandbox',
  stage: 'practice',
  kind: 'maze',
  mode: 'build',
  title: 'Phép',
  objective: 'Tới cờ',
  learningGoal: 'Dạy phép',
  toolbox: ['maze_forward', 'cq_proc_def', 'cq_proc_call'],
  par: 3,
  config: {},
  solution: workspace,
  hints: [],
};

const predictBase = {
  ...mazeLevel,
  mode: 'predict',
  par: undefined,
  solution: undefined,
  initialWorkspace: workspace,
};

function issues(value: unknown): string[] {
  const result = LevelSchema.safeParse(value);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('LevelSchema procedures (ADR-0023)', () => {
  it('accepts 1–3 spells, with or without a box', () => {
    expect(
      issues({
        ...mazeLevel,
        procedures: [
          { id: 'stair', name: 'bậc thang' },
          { id: 'climb', name: 'cầu thang', param: { id: 'steps', name: 'số bậc', max: 5 } },
        ],
      }),
    ).toEqual([]);
  });
  it('rejects 0 or 4 spells and bad ids', () => {
    expect(issues({ ...mazeLevel, procedures: [] })).not.toEqual([]);
    const four = ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id }));
    expect(issues({ ...mazeLevel, procedures: four })).not.toEqual([]);
    expect(issues({ ...mazeLevel, procedures: [{ id: 'Stair', name: 'x' }] })).not.toEqual([]);
  });
  it('rejects duplicate spell ids and ids shared with boxes', () => {
    expect(
      issues({
        ...mazeLevel,
        procedures: [
          { id: 'stair', name: 'a' },
          { id: 'stair', name: 'b' },
        ],
      }),
    ).toContain('duplicate procedure "stair"');
    expect(
      issues({
        ...mazeLevel,
        variables: [{ id: 'bamboo', name: 'số măng' }],
        procedures: [{ id: 'bamboo', name: 'a' }],
      }),
    ).toContain('procedure id "bamboo" is also a box id');
    expect(
      issues({
        ...mazeLevel,
        variables: [{ id: 'bamboo', name: 'số măng' }],
        procedures: [{ id: 'climb', name: 'a', param: { id: 'bamboo', name: 'x' } }],
      }),
    ).toContain('param id "bamboo" is already a box or procedure id');
    expect(
      issues({
        ...mazeLevel,
        procedures: [
          { id: 'a', name: 'a', param: { id: 'n', name: 'x' } },
          { id: 'b', name: 'b', param: { id: 'n', name: 'y' } },
        ],
      }),
    ).toContain('param id "n" is already a box or procedure id');
  });
  it('lists spell boxes as variables', () => {
    expect(
      procedureBoxes([
        { id: 'a', name: 'a' },
        { id: 'b', name: 'b', param: { id: 'n', name: 'số bậc' } },
        { id: 'c', name: 'c', param: { id: 'm', name: 'số ô', max: 4 } },
      ]),
    ).toEqual([
      { id: 'n', name: 'số bậc' },
      { id: 'm', name: 'số ô', max: 4 },
    ]);
    expect(procedureBoxes(undefined)).toEqual([]);
  });
});

describe('LevelSchema parUnproven', () => {
  it('accepts true only', () => {
    expect(issues({ ...mazeLevel, parUnproven: true })).toEqual([]);
    expect(issues({ ...mazeLevel, parUnproven: false })).not.toEqual([]);
  });
});

describe('LevelSchema predict.options[].drawProgram (ADR-0024 §5)', () => {
  const drawOptions = [
    { drawProgram: workspace, label: 'Hình 1' },
    { drawProgram: workspace, label: 'Hình 2' },
    { key: 'crash:OFF_PAPER@0', label: 'Ra ngoài giấy' },
  ];
  it('accepts drawProgram options on turtle', () => {
    expect(issues({ ...predictBase, kind: 'turtle', predict: { options: drawOptions } })).toEqual(
      [],
    );
  });
  it('rejects drawProgram outside turtle', () => {
    expect(issues({ ...predictBase, predict: { options: drawOptions } })).toContain(
      '"drawProgram" only fits kind turtle',
    );
  });
  it('needs exactly one of key and drawProgram', () => {
    const both = [{ key: 'win', drawProgram: workspace, label: 'a' }, ...drawOptions.slice(1)];
    const none = [{ label: 'a' }, ...drawOptions.slice(1)];
    for (const options of [both, none]) {
      expect(issues({ ...predictBase, kind: 'turtle', predict: { options } })).toContain(
        'a predict option needs exactly one of "key" and "drawProgram"',
      );
    }
  });
  it('still rejects duplicate hand-written keys', () => {
    const options = [
      { key: 'win', label: 'a' },
      { key: 'win', label: 'b' },
      { key: 'stop@1', label: 'c' },
    ];
    expect(issues({ ...predictBase, predict: { options } })).toContain(
      'predict option keys must be unique',
    );
  });
});
