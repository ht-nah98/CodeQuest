// Rule 28 (maze step limit, ADR-0026) and authoring rule S2 on the sandbox samples.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LevelSchema, type Level } from '@codequest/content-schema';
import { runLevel } from '@codequest/engine';
import { getGameKind } from '@codequest/games';
import { describe, expect, it } from 'vitest';
import { loadContentFiles } from './load';
import { programToWorkspace } from '@codequest/validator';
import { checkContent } from './rules';
import { stepLimitIssues } from './stepLimit';

const fixturesDir = fileURLToPath(new URL('../fixtures/', import.meta.url));
const sandbox = fileURLToPath(new URL('../../../content/worlds/_sandbox/levels/', import.meta.url));
const load = (name: string) =>
  LevelSchema.parse(JSON.parse(readFileSync(`${sandbox}${name}.json`, 'utf8')));

describe('rule 28: stepLimit', () => {
  it('the sandbox samples pass', () => {
    for (const name of ['maze-step-one', 'maze-step-maps']) {
      expect(stepLimitIssues(name, load(name))).toEqual([]);
    }
  });

  it('extra-28-step-limit-short: the solution needs more steps than the map allows', () => {
    const report = checkContent(loadContentFiles(`${fixturesDir}extra-28-step-limit-short`));
    expect(report.warnings).toEqual([]);
    // The solution then also loses (rule 9: OUT_OF_STEPS); rule 28 says by how much.
    expect(report.issues.map((issue) => issue.rule)).toEqual([9, 28]);
    expect(report.issues[1]?.message).toBe('solution walks 10 steps > stepLimit 9 on map 1');
  });

  it('checks each map against its own limit', () => {
    const maps = load('maze-step-maps');
    const variants = (maps.variants ?? []).map((config, index) =>
      index === 0 ? { ...(config as object), stepLimit: 10 } : config,
    );
    expect(stepLimitIssues('p', { ...maps, variants })).toEqual([
      { path: 'p', rule: 28, message: 'solution walks 11 steps > stepLimit 10 on map 2' },
    ]);
  });
});

describe('S2: the slow way that still reaches the flag runs out of steps', () => {
  it('maze-step-one: the long way round (down the left side) stops OUT_OF_STEPS', () => {
    const level = load('maze-step-one');
    const kind = getGameKind('maze');
    if (kind === undefined) throw new Error('no maze');
    let n = 0;
    const block = (type: string): object => ({ type, id: `s${String(++n)}` });
    const moves = [
      'R',
      'F',
      'F',
      'F',
      'F',
      'F',
      'F',
      'L',
      'F',
      'F',
      'L',
      'F',
      'F',
      'F',
      'R',
      'F',
      'F',
    ];
    let next: object | undefined;
    for (const move of [...moves].reverse()) {
      const type =
        move === 'F' ? 'maze_forward' : move === 'L' ? 'maze_turn_left' : 'maze_turn_right';
      next = next === undefined ? block(type) : { ...block(type), next: { block: next } };
    }
    const workspace = {
      blocks: {
        languageVersion: 0 as const,
        blocks: [{ type: 'cq_start', id: 'start', next: { block: next } }],
      },
    };
    // The slow way is long: run it without the block cap, only the step limit decides.
    const uncapped: Level = { ...level };
    delete uncapped.maxBlocks;
    expect(runLevel({ kind, level: uncapped, workspace })).toMatchObject({
      result: 'crash',
      reasonCode: 'OUT_OF_STEPS',
    });
  });
});

describe('S2 on maze-step-maps: a spell with a detour reaches every flag, too slowly', () => {
  it('wins without the step limits and runs out of steps with them', () => {
    const level = load('maze-step-maps');
    const kind = getGameKind('maze');
    if (kind === undefined) throw new Error('no maze');
    const F = { block: 'maze_forward' };
    const R = { block: 'maze_turn_right' };
    const left = { block: 'maze_is_path', fields: { DIR: 'LEFT' } };
    // Each cast steps forward, back and forward again before the real body: 2 steps wasted.
    const slow = programToWorkspace([{ call: 'fork' }, { call: 'fork' }, { call: 'fork' }], {
      fork: [F, R, R, F, R, R, F, { until: left, body: [F] }, { block: 'maze_turn_left' }],
    });
    const unlimited: Level = {
      ...level,
      config: withoutLimit(level.config),
      variants: (level.variants ?? []).map(withoutLimit),
    };
    delete unlimited.maxBlocks;
    const free = runLevel({ kind, level: unlimited, workspace: slow });
    expect(free.result).toBe('success');
    const capped: Level = { ...level };
    delete capped.maxBlocks;
    expect(runLevel({ kind, level: capped, workspace: slow })).toMatchObject({
      result: 'crash',
      reasonCode: 'OUT_OF_STEPS',
    });
  });
});

const w10 = fileURLToPath(new URL('../../../content/worlds/w10-hoc-vien/levels/', import.meta.url));
const loadW10 = (name: string) =>
  LevelSchema.parse(JSON.parse(readFileSync(`${w10}${name}.json`, 'utf8')));

describe('S2 in World 10: the ways that reach the flag are too slow', () => {
  const kind = getGameKind('maze');
  if (kind === undefined) throw new Error('no maze');
  const F = { block: 'maze_forward' };
  const L = { block: 'maze_turn_left' };
  const R = { block: 'maze_turn_right' };
  const path = (dir: string) => ({ block: 'maze_is_path', fields: { DIR: dir } });
  const goal = { block: 'maze_at_goal' };
  const rightWall = programToWorkspace([
    {
      until: goal,
      body: [
        { if: path('RIGHT'), then: [R] },
        { if: path('AHEAD'), then: [F], else: [L] },
      ],
    },
  ]);

  /** Runs `workspace` with and without the level's step limit (and with no block cap). */
  function both(level: Level, workspace: unknown) {
    const capped: Level = { ...level };
    delete capped.maxBlocks;
    const free: Level = { ...capped, config: withoutLimit(level.config) };
    return {
      free: runLevel({
        kind: kind as NonNullable<typeof kind>,
        level: free,
        workspace: workspace as never,
      }),
      capped: runLevel({
        kind: kind as NonNullable<typeof kind>,
        level: capped,
        workspace: workspace as never,
      }),
    };
  }

  it('w10-l14: following the right wall reaches the flag, and tires in the deep dead end', () => {
    const level = loadW10('w10-l14');
    const { free, capped } = both(level, level.initialWorkspace);
    expect(free.result).toBe('success');
    expect(capped.answerKey).toBe('crash:OUT_OF_STEPS@6,5');
  });

  it('w10-l15: the road that looks near and the right wall both run out of steps', () => {
    const level = loadW10('w10-l15');
    const near = programToWorkspace([
      { repeat: 4, body: [F] },
      R,
      { repeat: 3, body: [F] },
      R,
      F,
      L,
      { repeat: 3, body: [F] },
      L,
      { repeat: 3, body: [F] },
    ]);
    for (const workspace of [near, rightWall]) {
      const { free, capped } = both(level, workspace);
      expect(free.result).toBe('success');
      expect(capped).toMatchObject({ result: 'crash', reasonCode: 'OUT_OF_STEPS' });
    }
  });
});

function withoutLimit(config: unknown): unknown {
  const copy = { ...(config as Record<string, unknown>) };
  delete copy['stepLimit'];
  return copy;
}
