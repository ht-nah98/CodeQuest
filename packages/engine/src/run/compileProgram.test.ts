import type { WorkspaceJson } from '@codequest/content-schema';
import { describe, expect, it } from 'vitest';
import { compileProgram, registerBlockSpecs, runLevel } from '../index';
import { lineBlocks, lineKind, lineLevel, program, step } from '../testing/lineKind.test';

registerBlockSpecs(lineBlocks);

const trickyIds = ["it's", 'back\\slash', 'tick`tock', "all'\\`three"];

describe('compileProgram', () => {
  it('compiles only the program under cq_start, with a highlight before each statement', () => {
    const code = compileProgram(program([step('a')], [{ ...step('orphan'), x: 100 }]));
    expect(code).toContain("__hl('a');\nstep('a');");
    expect(code).not.toContain('orphan');
  });

  it('returns an empty string without cq_start', () => {
    expect(
      compileProgram({ blocks: { languageVersion: 0, blocks: [step('a') as { type: string }] } }),
    ).toBe('');
  });

  it.each(trickyIds)('quotes block id %s so the code stays valid', (id) => {
    const workspace = program([
      {
        type: 'cq_repeat',
        id,
        fields: { TIMES: 2 },
        inputs: { DO: { block: step(`${id}-inner`) } },
      },
    ]);
    const outcome = runLevel({
      kind: lineKind,
      level: lineLevel({ config: { length: 10, goal: 2 } }),
      workspace,
    });
    expect(outcome.result).toBe('success');
    const ids = new Set(outcome.events.map((event) => event.blockId));
    expect(ids).toEqual(new Set(['start', id, `${id}-inner`]));
  });

  it('gives nested cq_repeat loops distinct counters', () => {
    const inner = {
      type: 'cq_repeat',
      id: 'in',
      fields: { TIMES: 2 },
      inputs: { DO: { block: step('s') } },
    };
    const code = compileProgram(
      program([
        { type: 'cq_repeat', id: 'out', fields: { TIMES: 3 }, inputs: { DO: { block: inner } } },
      ]),
    );
    expect(code).toContain('for (var count2 = 0; count2 < 3; count2++)');
    expect(code).toContain('for (var count = 0; count < 2; count++)');
  });

  it('renames a child variable that collides with a game API name', () => {
    const workspace = {
      ...program([
        {
          type: 'variables_set',
          id: 'set',
          fields: { VAR: { id: 'v' } },
          inputs: { VALUE: { block: { type: 'math_number', id: 'n', fields: { NUM: 1 } } } },
        },
      ]),
      variables: [{ name: 'step', id: 'v' }],
    };
    const code = compileProgram(workspace);
    expect(code).toContain('var step2;');
    expect(code).toContain('step2 = 1;');
  });
});

describe('reserved words', () => {
  const withVariable = (name: string): WorkspaceJson => ({
    ...program([
      {
        type: 'variables_set',
        id: 'set',
        fields: { VAR: { id: 'v' } },
        inputs: { VALUE: { block: { type: 'math_number', id: 'n', fields: { NUM: 1 } } } },
      },
    ]),
    variables: [{ name, id: 'v' }],
  });

  it('does not depend on host globals, so Node and browsers generate the same code', () => {
    expect(compileProgram(withVariable('process'))).toContain('var process;');
    expect(compileProgram(withVariable('document'))).toContain('var document;');
  });

  it('still reserves sandbox globals and the highlight hook', () => {
    expect(compileProgram(withVariable('Math'))).toContain('var Math2;');
    expect(compileProgram(withVariable('__hl'))).toContain('var __hl2;');
  });
});
