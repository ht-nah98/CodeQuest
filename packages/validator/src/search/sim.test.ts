// The assumptions FastSim relies on are enforced, and odd but legal kinds still work.
import type { Level } from '@codequest/content-schema';
import type { AnyGameKindDefinition, BlockSpec } from '@codequest/engine';
import { getGameKind } from '@codequest/games';
import { describe, expect, it } from 'vitest';
import { formatProgram } from './program';
import { findShortestPrograms } from './shortest';
import { FastSim, UnsearchableLevel } from './sim';
import { loadLevel } from './testLevels';

function kind(id: 'runner' | 'maze'): AnyGameKindDefinition {
  const found = getGameKind(id);
  if (found === undefined) throw new Error(`${id} missing`);
  return found;
}

/** The runner with extra statement blocks, under the same id so the level still matches. */
function runnerWith(extra: BlockSpec[], api?: AnyGameKindDefinition['createApi']) {
  const runner = kind('runner');
  return {
    ...runner,
    blocks: [...runner.blocks, ...extra],
    createApi: api ?? ((ctx) => runner.createApi(ctx)),
  };
}

const statement = { previousStatement: null, nextStatement: null } as const;

describe('FastSim assumptions', () => {
  it('rejects a statement block whose code calls a sensor', async () => {
    const peek: BlockSpec = {
      type: 'runner_peek',
      category: 'move',
      apiNames: ['isAhead'],
      json: { message0: 'nhìn', ...statement },
      generator: () => `isAhead('HOLE', 'x');\n`,
    };
    const level = { ...(await loadLevel('w01-l03')), toolbox: ['runner_walk', 'runner_peek'] };
    const sim = new FastSim(runnerWith([peek]), level);
    expect(sim.atoms.map((atom) => atom.statement.block)).toEqual(['runner_walk']);
    expect(sim.unsupported).toEqual(['runner_peek: cannot be recorded (calls the sensor isAhead)']);
  });

  it('rejects a block whose effect depends on its block id', async () => {
    const runner = kind('runner');
    const leaky = runnerWith([], (ctx) => {
      const api = runner.createApi(ctx);
      return {
        ...api,
        walk: (blockId) => {
          (ctx.state as { last?: unknown }).last = blockId;
          return api['walk']?.(blockId);
        },
      };
    });
    const sim = new FastSim(leaky, await loadLevel('w01-l03'));
    expect(sim.unsupported).toEqual(['runner_walk: its effect depends on the block id']);
  });

  it('refuses kinds whose API uses ctx.rng', async () => {
    const runner = kind('runner');
    const random = runnerWith([], (ctx) => ({ ...runner.createApi(ctx), jump: () => ctx.rng() }));
    const level = await loadLevel('w01-l03');
    expect(() => findShortestPrograms(level, { getKind: () => random })).toThrow(UnsearchableLevel);
  });

  it('tries every option of an open dropdown field', async () => {
    const move: BlockSpec = {
      type: 'runner_move',
      category: 'move',
      apiNames: ['walk', 'jump'],
      json: {
        message0: '%1',
        args0: [
          {
            type: 'field_dropdown',
            name: 'HOW',
            options: [
              ['đi', 'walk'],
              ['nhảy', 'jump'],
            ],
          },
        ],
        ...statement,
      },
      generator: (block, gen) =>
        `${String(block.getFieldValue('HOW'))}(${gen.quote_(block.id)});\n`,
    };
    const level = { ...(await loadLevel('w01-l03')), toolbox: ['runner_move'] };
    const result = findShortestPrograms(level, { getKind: () => runnerWith([move]) });
    expect(result.minBlocks).toBe(3);
    expect(result.mismatches).toEqual([]);
    expect(result.examples.map(formatProgram)).toEqual([
      'move(HOW=walk), move(HOW=jump), move(HOW=walk)',
    ]);
  });
});

describe('search results', () => {
  it('reports runLevel disagreements (maxActions is only checked by runLevel)', async () => {
    const level: Level = { ...(await loadLevel('w01-l03')), limits: { maxActions: 2 } };
    const result = findShortestPrograms(level);
    expect(result.minBlocks).toBe(3);
    expect(result.mismatches).toEqual(['walk, jump, walk: runLevel timeout TIMEOUT, 3 blocks']);
  });

  it('keeps maze states apart by the bamboo collected (collectAll)', async () => {
    const base = await loadLevel('w01-l12');
    const config = { map: ['b..', 'S.G', '...'], startDir: 'E' };
    const free = findShortestPrograms({ ...base, config, par: 8 });
    expect(free.minBlocks).toBe(2);
    const collect = findShortestPrograms({
      ...base,
      config: { ...config, goal: { collectAll: true } },
      par: 8,
    });
    expect(collect.minBlocks).toBe(7);
    expect(collect.mismatches).toEqual([]);
    expect(collect.examples.map(formatProgram)).toContain(
      'turn_left, forward, turn_right, forward, forward, turn_right, forward',
    );
  });
});
