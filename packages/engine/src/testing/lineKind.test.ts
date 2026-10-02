// Fake `line` game kind used only by the engine tests (phase-0.md P0-03). Măng walks along a
// line of cells; holes crash, reaching `goal` wins. Kept in a *.test.ts file so it never ships.
import type { Level, WorkspaceJson } from '@codequest/content-schema';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { AnyGameKindDefinition, BlockSpec, GameKindDefinition } from '../index';

export type LineConfig = z.infer<typeof lineConfigSchema>;
export interface LineState {
  pos: number;
  config: LineConfig;
}
export type LineEvent =
  | { type: 'step'; blockId: string | null; from: number; to: number }
  | { type: 'fall'; blockId: string | null; at: number }
  | { type: 'say'; blockId: string | null; value: string | number | boolean };

const lineConfigSchema = z.strictObject({
  length: z.number().int().positive(),
  goal: z.number().int().nonnegative(),
  holes: z.array(z.number().int()).default([]),
});

const statement = { previousStatement: null, nextStatement: null, style: 'move_blocks' };

export const lineBlocks: BlockSpec[] = [
  {
    type: 'line_step',
    category: 'move',
    apiNames: ['step'],
    json: { message0: 'bước', ...statement },
    generator: (block, gen) => `step(${gen.quote_(block.id)});\n`,
  },
  {
    type: 'line_win',
    category: 'move',
    apiNames: ['win'],
    json: { message0: 'thắng ngay', ...statement },
    generator: (block, gen) => `win(${gen.quote_(block.id)});\n`,
  },
  {
    type: 'line_boom',
    category: 'move',
    apiNames: ['boom'],
    json: { message0: 'nổ', ...statement },
    generator: (block, gen) => `boom(${gen.quote_(block.id)});\n`,
  },
  {
    type: 'line_say',
    category: 'move',
    apiNames: ['say'],
    json: { message0: 'nói %1', args0: [{ type: 'input_value', name: 'VALUE' }], ...statement },
    generator: (block, gen) =>
      `say(${gen.quote_(block.id)}, ${gen.valueToCode(block, 'VALUE', 99) || "''"});\n`,
  },
  {
    type: 'line_at_goal',
    category: 'sensor',
    apiNames: ['atGoal'],
    json: { message0: 'tới đích?', output: 'Boolean', style: 'sensor_blocks' },
    generator: () => ['atGoal()', 2],
  },
];

export const lineKind: GameKindDefinition<LineConfig, LineState, LineEvent> = {
  // The id must be a GameKindId; 'runner' is borrowed because no real kind exists yet.
  id: 'runner',
  version: 1,
  configSchema: lineConfigSchema,
  blocks: lineBlocks,
  reasonCodes: ['FELL_IN_HOLE', 'NOT_AT_GOAL', 'OFF_TRACK'],
  createState: (config) => ({ pos: 0, config }),
  createApi: (ctx) => ({
    step: (blockId) => {
      const id = String(blockId);
      const from = ctx.state.pos;
      const to = from + 1;
      if (to >= ctx.state.config.length) ctx.stop('crash', 'OFF_TRACK');
      ctx.emit({ type: 'step', from, to }, id);
      ctx.state.pos = to;
      if (ctx.state.config.holes.includes(to)) {
        ctx.emit({ type: 'fall', at: to }, id);
        ctx.stop('crash', 'FELL_IN_HOLE');
      }
    },
    win: () => ctx.stop('success'),
    boom: () => {
      throw new Error('boom');
    },
    say: (blockId, value) => {
      ctx.emit({ type: 'say', value }, String(blockId));
    },
    atGoal: () => ctx.state.pos === ctx.state.config.goal,
  }),
  evaluate: (state, config) =>
    state.pos === config.goal ? { success: true } : { success: false, reasonCode: 'NOT_AT_GOAL' },
  predictAnswer: (state, outcome) =>
    outcome.result === 'success'
      ? 'win'
      : `${outcome.reasonCode ?? outcome.result}@${String(state.pos)}`,
};

/** Builds a workspace whose `cq_start` is followed by `chain` (each item: a serialized block). */
export function program(chain: object[], extraTopBlocks: object[] = []): WorkspaceJson {
  let next: object | undefined;
  for (const block of [...chain].reverse()) {
    next = next === undefined ? block : { ...block, next: { block: next } };
  }
  const start = {
    type: 'cq_start',
    id: 'start',
    deletable: false,
    ...(next !== undefined && { next: { block: next } }),
  };
  return { blocks: { languageVersion: 0, blocks: [start, ...extraTopBlocks] } } as WorkspaceJson;
}

export function step(id: string): object {
  return { type: 'line_step', id };
}

export function lineLevel(overrides: Partial<Level> = {}): Level {
  return {
    id: 'w01-l01',
    worldId: 'w01-lang-tre',
    stage: 'practice',
    kind: 'runner',
    mode: 'build',
    title: 'Thử',
    objective: 'Đi tới đích',
    learningGoal: 'Tuần tự',
    toolbox: ['line_step'],
    hints: [],
    config: { length: 10, goal: 3 },
    ...overrides,
  };
}

describe('line fixture', () => {
  it('fits the type-erased registry type', () => {
    const erased: AnyGameKindDefinition = lineKind;
    expect(erased.reasonCodes).toContain('NOT_AT_GOAL');
  });
});
