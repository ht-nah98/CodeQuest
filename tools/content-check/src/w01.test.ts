// World 1 "Làng Tre" after the difficulty pass (roadmap/difficulty-pass.md batch C): the
// harder sequence levels fail where their hints say, and l13 is a maze with two roads.
import { readFileSync } from 'node:fs';
import {
  LevelSchema,
  WorldSchema,
  type Level,
  type WorkspaceJson,
} from '@codequest/content-schema';
import { runLevel } from '@codequest/engine';
import { getGameKind } from '@codequest/games';
import { describe, expect, it } from 'vitest';
import { mazeJunctions } from './difficulty';

const DIR = new URL('../../../content/worlds/w01-lang-tre/', import.meta.url);
const read = (path: string): unknown => JSON.parse(readFileSync(new URL(path, DIR), 'utf8'));
const WORLD_ID = 'w01-lang-tre';

const world = WorldSchema.parse(read('world.json'));
const levels = new Map(
  world.levelIds.map((id) => [id, LevelSchema.parse(read(`levels/${id}.json`))] as const),
);
const levelById = (id: string): Level => {
  const level = levels.get(id);
  if (level === undefined) throw new Error(`no level ${id}`);
  return level;
};

const TYPES: Readonly<Record<string, string>> = {
  w: 'runner_walk',
  j: 'runner_jump',
  c: 'runner_crouch',
  k: 'runner_kick',
  f: 'maze_forward',
  L: 'maze_turn_left',
  R: 'maze_turn_right',
};
type Item = string | { r: number; b: Item[] };

/** A program like ['w', { r: 3, b: ['w', 'j'] }] as a workspace under the start block. */
function program(items: Item[]): WorkspaceJson {
  let n = 0;
  const chain = (list: Item[]): Record<string, unknown> | undefined => {
    let head: Record<string, unknown> | undefined;
    for (const item of [...list].reverse()) {
      n += 1;
      const block: Record<string, unknown> =
        typeof item === 'string'
          ? { type: TYPES[item], id: `b${String(n)}` }
          : { type: 'cq_repeat', id: `b${String(n)}`, fields: { TIMES: item.r } };
      if (typeof item !== 'string') {
        const body = chain(item.b);
        if (body !== undefined) block['inputs'] = { DO: { block: body } };
      }
      if (head !== undefined) block['next'] = { block: head };
      head = block;
    }
    return head;
  };
  const start: { type: string; [key: string]: unknown } = { type: 'cq_start', id: 'start' };
  const body = chain(items);
  if (body !== undefined) start['next'] = { block: body };
  return { blocks: { languageVersion: 0, blocks: [start] } };
}

/** Where a run ends, as a predict answer key ("win", "crash:HIT_WALL@3,2", "missed@17"…). */
function outcomeKey(
  kindId: Level['kind'],
  config: unknown,
  workspace: WorkspaceJson,
): string | undefined {
  const kind = getGameKind(kindId);
  if (kind === undefined) throw new Error(`no game kind ${kindId}`);
  const level: Level = {
    id: 'probe',
    worldId: WORLD_ID,
    stage: 'practice',
    kind: kindId,
    mode: 'predict',
    title: 'probe',
    objective: 'probe',
    learningGoal: 'probe',
    toolbox: [],
    config,
    initialWorkspace: workspace,
    hints: [],
  };
  return runLevel({ kind, level, workspace }).answerKey;
}

const keyOf = (id: string, items: Item[]): string | undefined => {
  const level = levelById(id);
  return outcomeKey(level.kind, level.config, program(items));
};

describe('World 1 difficulty pass (batch C)', () => {
  it('l06: only the right order wins; the hole right after the start needs a jump first', () => {
    expect(keyOf('w01-l06', ['j', 'w', 'j', 'w', 'w', 'j', 'w'])).toBe('win');
    expect(keyOf('w01-l06', ['w', 'j', 'w', 'j', 'w', 'w', 'j'])).toBe('crash:FELL_IN_HOLE@1');
  });

  it('l09: the missing jump is in the middle, after the first branch', () => {
    expect(keyOf('w01-l09', ['w', 'j', 'w', 'c', 'c', 'w', 'w'])).toBe('crash:FELL_IN_HOLE@6');
    expect(keyOf('w01-l09', ['w', 'j', 'w', 'c', 'j', 'c', 'w', 'w'])).toBe('win');
  });

  it('l11: the swapped blocks are far apart, each fix shows the next crash', () => {
    expect(keyOf('w01-l11', ['k', 'w', 'j', 'w', 'c', 'w', 'w', 'w'])).toBe('crash:HIT_BRANCH@1');
    expect(keyOf('w01-l11', ['c', 'w', 'j', 'w', 'c', 'w', 'w', 'w'])).toBe('crash:HIT_CRATE@6');
    expect(keyOf('w01-l11', ['c', 'w', 'j', 'w', 'k', 'w', 'w', 'w'])).toBe('win');
  });

  it('l13: both roads reach the flag; the left one is par, the right one par + 2', () => {
    const level = levelById('w01-l13');
    const left = ['f', 'L', 'f', 'R', 'f', 'f', 'f', 'f', 'R', 'f'];
    const right = ['f', 'R', 'f', 'f', 'L', 'f', 'f', 'f', 'f', 'L', 'f', 'f'];
    expect(keyOf('w01-l13', left)).toBe('win');
    expect(keyOf('w01-l13', right)).toBe('win');
    expect([left.length, right.length]).toEqual([level.par, level.maxBlocks]);
    expect(mazeJunctions((level.config as { map: string[] }).map).junctions).toBeGreaterThanOrEqual(
      2,
    );
  });

  it('l14: the first wrong turn walks into the dead end below the corner', () => {
    expect(keyOf('w01-l14', ['f', 'f', 'R', 'f', 'R', 'f', 'f'])).toBe('crash:HIT_WALL@4,2');
    expect(keyOf('w01-l14', ['f', 'f', 'L', 'f', 'R', 'f', 'f'])).toBe('crash:HIT_WALL@2,2');
    expect(keyOf('w01-l14', ['f', 'f', 'L', 'f', 'f', 'R', 'f', 'f'])).toBe('win');
  });
});
