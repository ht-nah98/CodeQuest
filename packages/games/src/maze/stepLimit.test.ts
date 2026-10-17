// Step limit (ADR-0026, P5-03): every `tiến` walked costs a step; turns and questions are free.
import type { Level, WorkspaceJson } from '@codequest/content-schema';
import { runLevel } from '@codequest/engine';
import { describe, expect, it } from 'vitest';
import { maze, mazeConfigSchema, type MazeConfig } from './index';
import { createMazeState } from './state';

function program(blocks: object[]): WorkspaceJson {
  let next: object | undefined;
  for (const block of [...blocks].reverse()) {
    next = next === undefined ? block : { ...block, next: { block: next } };
  }
  const start = {
    type: 'cq_start',
    id: 'start',
    ...(next !== undefined && { next: { block: next } }),
  };
  return { blocks: { languageVersion: 0, blocks: [start] } };
}
let n = 0;
const F = (): object => ({ type: 'maze_forward', id: `f${String(++n)}` });
const L = (): object => ({ type: 'maze_turn_left', id: `l${String(++n)}` });
const R = (): object => ({ type: 'maze_turn_right', id: `r${String(++n)}` });
const askAhead = (): object => ({
  type: 'cq_if',
  id: `i${String(++n)}`,
  inputs: {
    COND: { block: { type: 'maze_is_path', id: `q${String(++n)}`, fields: { DIR: 'AHEAD' } } },
    DO: { block: { ...L(), next: { block: R() } } },
  },
});

/** A corridor: S, 4 cells, G at the 5th step. */
const CORRIDOR = ['#######', '#S....G', '#######'];

function level(config: MazeConfig, fields: Partial<Level> = {}): Level {
  return {
    id: 'step-test',
    worldId: '_sandbox',
    stage: 'practice',
    kind: 'maze',
    mode: 'build',
    title: 't',
    objective: 'o',
    learningGoal: 'g',
    toolbox: [],
    hints: [],
    config,
    ...fields,
  };
}

const run = (config: MazeConfig, blocks: object[], fields: Partial<Level> = {}) =>
  runLevel({ kind: maze, level: level(config, fields), workspace: program(blocks) });

describe('maze stepLimit', () => {
  it('accepts 1–99 per map and keeps the state as before without it', () => {
    expect(
      mazeConfigSchema.safeParse({ map: CORRIDOR, startDir: 'E', stepLimit: 99 }).success,
    ).toBe(true);
    expect(mazeConfigSchema.safeParse({ map: CORRIDOR, startDir: 'E', stepLimit: 0 }).success).toBe(
      false,
    );
    expect(
      mazeConfigSchema.safeParse({ map: CORRIDOR, startDir: 'E', stepLimit: 100 }).success,
    ).toBe(false);
    const plain = createMazeState({ map: CORRIDOR, startDir: 'E' });
    expect('steps' in plain || 'stepLimit' in plain).toBe(false);
    expect(createMazeState({ map: CORRIDOR, startDir: 'E', stepLimit: 3 })).toMatchObject({
      stepLimit: 3,
      steps: 0,
    });
  });

  it('the tiến after the last step stops Măng where she stands (tired, OUT_OF_STEPS)', () => {
    const outcome = run({ map: CORRIDOR, startDir: 'E', stepLimit: 3 }, [F(), F(), F(), F()], {
      mode: 'predict',
      initialWorkspace: program([F(), F(), F(), F()]),
    });
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'OUT_OF_STEPS' });
    expect(outcome.answerKey).toBe('crash:OUT_OF_STEPS@1,4');
    const game = outcome.events.filter((event) => event.type === 'move' || event.type === 'tired');
    expect(game.map((event) => event.type)).toEqual(['move', 'move', 'move', 'tired']);
    expect(game[3]).toMatchObject({ at: [1, 4] });
  });

  it('turns and questions cost no step', () => {
    const blocks = [L(), R(), askAhead(), F(), L(), R(), F(), F(), F(), F()];
    expect(run({ map: CORRIDOR, startDir: 'E', stepLimit: 5 }, blocks).result).toBe('success');
  });

  it('reaching G on the last step still wins', () => {
    expect(
      run({ map: CORRIDOR, startDir: 'E', stepLimit: 5 }, [F(), F(), F(), F(), F()]).result,
    ).toBe('success');
    expect(
      run({ map: CORRIDOR, startDir: 'E', stepLimit: 4 }, [F(), F(), F(), F(), F()]),
    ).toMatchObject({
      result: 'crash',
      reasonCode: 'OUT_OF_STEPS',
    });
  });

  it('a wall comes before the steps (HIT_WALL even with no step left)', () => {
    const outcome = run({ map: CORRIDOR, startDir: 'E', stepLimit: 1 }, [F(), L(), F()]);
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'HIT_WALL' });
  });

  it('each map has its own stepLimit', () => {
    const blocks = [F(), F(), F(), F(), F()];
    const outcome = run({ map: CORRIDOR, startDir: 'E', stepLimit: 5 }, blocks, {
      variants: [{ map: CORRIDOR, startDir: 'E', stepLimit: 3 }],
    });
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'OUT_OF_STEPS', mapIndex: 1 });
    expect(outcome.maps?.[0]?.result).toBe('success');
  });

  it('is deterministic', () => {
    const blocks = [F(), F(), F(), F()];
    const config = { map: CORRIDOR, startDir: 'E' as const, stepLimit: 3 };
    expect(run(config, blocks)).toEqual(run(config, blocks));
  });
});
