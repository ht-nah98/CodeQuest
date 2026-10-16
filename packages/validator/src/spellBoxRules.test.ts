// Rule 23 with spell boxes (ADR-0023 §2, P4-04): one case per changed branch.
import { LevelSchema, type Level } from '@codequest/content-schema';
import { getGameKind } from '@codequest/games';
import { describe, expect, it } from 'vitest';
import { hintIssues } from './levelRules';
import { programToWorkspace, type Program } from './search/program';
import { variableIssues } from './variableRules';

const F = { block: 'maze_forward' };
const STAIRS = [
  { id: 'stairs', name: 'cầu thang', param: { id: 'steps', name: 'số bậc', max: 4 } },
];
const body: Program = [{ repeatVar: 'steps', body: [F] }];

function level(main: Program, fields: Record<string, unknown> = {}): Level {
  return LevelSchema.parse({
    id: 'box-rules',
    worldId: '_sandbox',
    stage: 'practice',
    kind: 'maze',
    mode: 'build',
    title: 't',
    objective: 'o',
    learningGoal: 'g',
    toolbox: [
      'maze_forward',
      { type: 'cq_repeat_var', fields: { VAR: 'steps' } },
      'cq_proc_def_n',
      { type: 'cq_proc_call_n', fields: { PROC: 'stairs', NUM: 2 } },
    ],
    par: 5,
    procedures: STAIRS,
    config: { map: ['########', '#S.....G', '########'], startDir: 'E' },
    solution: programToWorkspace(main, { stairs: body }, new Set(['stairs'])),
    hints: [],
    ...fields,
  });
}

const twoNumbers = level([
  { call: 'stairs', arg: 2 },
  { call: 'stairs', arg: 3 },
]);
const messages = (target: Level): string[] =>
  variableIssues(target, true).errors.map((issue) => issue.message);

describe('rule 23 with spell boxes', () => {
  it('(c) a spell box counts as declared; (b) it is a known box id', () => {
    expect(messages(twoNumbers)).toEqual([]);
  });

  it('(b) a box nobody declares is still an error', () => {
    const unknown = level(
      [
        { call: 'stairs', arg: 2 },
        { call: 'stairs', arg: 3 },
      ],
      {
        toolbox: ['maze_forward', { type: 'cq_repeat_var', fields: { VAR: 'nope' } }],
      },
    );
    expect(messages(unknown).some((text) => text.startsWith('(b)'))).toBe(true);
  });

  it('(k) làm phép … với over the spell box max, (e) not a whole number', () => {
    const over = level([
      { call: 'stairs', arg: 2 },
      { call: 'stairs', arg: 5 },
    ]);
    expect(messages(over).some((text) => text.startsWith('(k)') && text.includes('steps'))).toBe(
      true,
    );
    const negative = level(
      [
        { call: 'stairs', arg: 2 },
        { call: 'stairs', arg: 3 },
      ],
      {
        toolbox: ['maze_forward', { type: 'cq_proc_call_n', fields: { PROC: 'stairs', NUM: -1 } }],
      },
    );
    expect(messages(negative).some((text) => text.startsWith('(e)'))).toBe(true);
  });

  it('(R4) a level with spell boxes only needs 2 different numbers in the solution', () => {
    const same = level([
      { call: 'stairs', arg: 2 },
      { call: 'stairs', arg: 2 },
    ]);
    expect(messages(same).some((text) => text.startsWith('(R4)'))).toBe(true);
    expect(messages(twoNumbers).some((text) => text.startsWith('(R4)'))).toBe(false);
  });

  it('(j) predict keys carry the level boxes only, never a spell box', () => {
    const predict = level([], {
      mode: 'predict',
      par: undefined,
      solution: undefined,
      variables: [{ id: 'bamboo', name: 'số măng' }],
      initialWorkspace: programToWorkspace(
        [{ call: 'stairs', arg: 2 }],
        { stairs: body },
        new Set(['stairs']),
      ),
      predict: {
        options: [
          { key: 'win#bamboo=0', label: 'a' },
          { key: 'stop@1,2#bamboo=0', label: 'b' },
          { key: 'stop@1,2#bamboo=0#steps=0', label: 'c' },
        ],
      },
    });
    const errors = messages(predict).filter((text) => text.startsWith('(j)'));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('#steps=0');
  });
});

describe('rule 16: instancesFull hints', () => {
  it('needs a maxInstances cap on the named type', () => {
    const kind = getGameKind('maze');
    if (kind === undefined) throw new Error('no maze');
    const hinted = level(
      [
        { call: 'stairs', arg: 2 },
        { call: 'stairs', arg: 3 },
      ],
      {
        hints: [{ id: 'cap', when: { instancesFull: 'maze_forward' }, say: 'Hết khối tiến rồi!' }],
      },
    );
    expect(hintIssues(hinted, kind).map((issue) => issue.message)).toContain(
      'hint "cap" asks instancesFull "maze_forward", which maxInstances does not cap',
    );
    const capped = { ...hinted, maxInstances: { maze_forward: 3 } };
    expect(hintIssues(capped, kind)).toEqual([]);
    const nested = level(
      [
        { call: 'stairs', arg: 2 },
        { call: 'stairs', arg: 3 },
      ],
      {
        hints: [
          {
            id: 'deep',
            when: { all: [{ any: [{ not: { instancesFull: 'maze_turn_left' } }] }] },
            say: 'Hết khối rẽ rồi!',
          },
        ],
      },
    );
    expect(hintIssues(nested, kind).map((issue) => issue.message)).toContain(
      'hint "deep" asks instancesFull "maze_turn_left", which maxInstances does not cap',
    );
  });
});
