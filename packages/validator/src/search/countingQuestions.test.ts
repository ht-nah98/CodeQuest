// A question that counts (P5-03, ADR-0018 exception): it may change the state only by counting
// a number down, and may end the run; the search follows it like a step.
import type { Level } from '@codequest/content-schema';
import type { GameKindDefinition } from '@codequest/engine';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { programToWorkspace } from './program';
import { findShortestPrograms } from './shortest';
import { countsDown, FastSim, UnsearchableLevel } from './sim';

interface CounterState {
  pos: number;
  goal: number;
  left?: number;
  drift?: number;
}
const configSchema = z.strictObject({
  goal: z.number().int(),
  maxQuestions: z.number().int().optional(),
  drift: z.boolean().optional(),
});
type CounterConfig = z.infer<typeof configSchema>;

/** A walk to `goal`; `ready?` costs one question of `maxQuestions` (or, with `drift`, cheats). */
const counter: GameKindDefinition<
  CounterConfig,
  CounterState,
  { type: 'step'; blockId: string | null }
> = {
  id: 'sorter',
  version: 1,
  configSchema,
  blocks: [
    {
      type: 'counter_step',
      category: 'move',
      apiNames: ['step'],
      json: { message0: 'bước', previousStatement: null, nextStatement: null },
      generator: (block, gen) => `step(${gen.quote_(block.id)});\n`,
    },
    {
      type: 'counter_ready',
      category: 'sensor',
      apiNames: ['ready'],
      json: { message0: 'tới chưa?', output: 'Boolean' },
      generator: (block, gen) => [`ready(${gen.quote_(block.id)})`, 2],
    },
  ],
  reasonCodes: ['OUT_OF_QUESTIONS', 'NOT_THERE'],
  questionCounter: 'left',
  createState: (config) => ({
    pos: 0,
    goal: config.goal,
    ...(config.maxQuestions !== undefined && { left: config.maxQuestions }),
    ...(config.drift === true && { drift: 0 }),
  }),
  createApi: (ctx) => ({
    step: (blockId) => {
      ctx.state.pos++;
      ctx.emit({ type: 'step' }, String(blockId));
    },
    ready: (blockId) => {
      const state = ctx.state;
      if (state.drift !== undefined) state.drift += 1; // not a count down: unsearchable
      if (state.left !== undefined) {
        if (state.left === 0) ctx.stop('crash', 'OUT_OF_QUESTIONS');
        state.left--;
      }
      return ctx.sense(state.pos >= state.goal, String(blockId));
    },
  }),
  evaluate: (state) =>
    state.pos === state.goal ? { success: true } : { success: false, reasonCode: 'NOT_THERE' },
  predictAnswer: (state) => String(state.pos),
};

function level(config: CounterConfig, variants?: CounterConfig[]): Level {
  return {
    id: 'counting',
    worldId: '_sandbox',
    stage: 'practice',
    kind: 'sorter',
    mode: 'build',
    title: 't',
    objective: 'o',
    learningGoal: 'g',
    toolbox: ['counter_step', 'cq_repeat_until', 'counter_ready'],
    par: 3,
    config,
    ...(variants !== undefined && { variants }),
    solution: programToWorkspace([]),
    hints: [],
  };
}

const search = (config: CounterConfig, variants?: CounterConfig[]) =>
  findShortestPrograms(level(config, variants), { getKind: () => counter });

describe('counting questions in the search', () => {
  it('without a budget the question is free and both 3-block programs win', () => {
    expect(search({ goal: 3 })).toMatchObject({ minBlocks: 3, count: 2, mismatches: [] });
  });

  it('with a budget the 4th question ends the run, so only step, step, step wins', () => {
    const result = search({ goal: 3, maxQuestions: 3 });
    expect(result).toMatchObject({ minBlocks: 3, count: 1, complete: true, mismatches: [] });
  });

  it('a question that changes the state otherwise is still unsearchable', () => {
    expect(() => new FastSim(counter as never, level({ goal: 3, drift: true }))).toThrow(
      UnsearchableLevel,
    );
    // Counting and changing another field in the same question: still refused.
    expect(
      () => new FastSim(counter as never, level({ goal: 3, maxQuestions: 3, drift: true })),
    ).toThrow(UnsearchableLevel);
  });

  it('a budget on one map only still counts there, whatever the map order', () => {
    // Map with the budget first or second: the until program loses on it either way.
    for (const maps of [
      [{ goal: 3, maxQuestions: 3 }, { goal: 3 }],
      [{ goal: 3 }, { goal: 3, maxQuestions: 3 }],
    ]) {
      const [first, ...rest] = maps;
      if (first === undefined) throw new Error('maps');
      expect(search(first, rest)).toMatchObject({
        minBlocks: 3,
        count: 1,
        complete: true,
        mismatches: [],
      });
    }
  });

  it('countsDown accepts only the declared field going down by one', () => {
    expect(countsDown({ left: 3, b: [1, 2] }, { left: 2, b: [1, 2] }, 'left')).toBe(true);
    expect(countsDown({ left: 3 }, { left: 4 }, 'left')).toBe(false);
    expect(countsDown({ left: 3 }, { left: 1 }, 'left')).toBe(false);
    expect(countsDown({ left: 3 }, { left: 2, b: 1 }, 'left')).toBe(false);
    // Two leaves at once, or a position-like field instead of the counter.
    expect(countsDown({ left: 3, pos: 2 }, { left: 2, pos: 1 }, 'left')).toBe(false);
    expect(countsDown({ left: 3, pos: 2 }, { left: 3, pos: 1 }, 'left')).toBe(false);
  });
});
