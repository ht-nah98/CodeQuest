// Rule 24 (difficulty pass, roadmap/difficulty-pass.md §3.2): shapes, maze counts and the
// fixture that breaks M1, M2 and M3 once each.
import { fileURLToPath } from 'node:url';
import type { Level } from '@codequest/content-schema';
import { programFromWorkspace, programToWorkspace, type Program } from '@codequest/validator';
import { describe, expect, it } from 'vitest';
import {
  APPROVED_LADDERS,
  checkDifficulty,
  levelShape,
  mazeJunctions,
  mazeRoadShape,
  mirrorShape,
  programShape,
  reachableCells,
} from './difficulty';
import { loadContentFiles } from './load';
import { checkContent } from './rules';

const fixture = fileURLToPath(new URL('../fixtures/extra-24-difficulty/', import.meta.url));

const forward = { block: 'maze_forward' };
const right = { block: 'maze_turn_right' };
const askRight = { block: 'maze_is_path', fields: { DIR: 'RIGHT' } };

describe('programShape', () => {
  it('drops numbers and writes a run of one block once', () => {
    const three: Program = [{ repeat: 3, body: [forward, forward] }, right];
    const five: Program = [{ repeat: 5, body: [forward, forward, forward] }, right];
    expect(programShape(three)).toBe('repeat [forward+], turn_right');
    expect(programShape(five)).toBe(programShape(three));
  });

  it('keeps the question and its field, so asking left and asking right differ', () => {
    const asks = (dir: string): Program => [
      { repeat: 12, body: [{ if: { ...askRight, fields: { DIR: dir } }, then: [right] }, forward] },
    ];
    expect(programShape(asks('RIGHT'))).toBe(
      'repeat [if is_path(DIR=RIGHT) [turn_right], forward]',
    );
    expect(programShape(asks('LEFT'))).not.toBe(programShape(asks('RIGHT')));
  });

  it('drops the robot number of tiến … ô but keeps until and else', () => {
    const program: Program = [
      {
        until: { block: 'maze_at_goal' },
        body: [{ if: askRight, then: [right], else: [forward] }],
      },
      { block: 'robot_forward', fields: { N: 3 } },
    ];
    expect(programShape(program)).toBe(
      'until at_goal [if is_path(DIR=RIGHT) [turn_right] else [forward]], forward',
    );
  });
});

describe('levelShape', () => {
  const level = (mode: Level['mode'], program: Program): Level => ({
    id: 'w02-l01',
    worldId: 'w02-x',
    stage: 'practice',
    kind: 'maze',
    mode,
    title: 't',
    objective: 'o',
    learningGoal: 'g',
    toolbox: [],
    config: {},
    hints: [],
    ...(mode === 'predict'
      ? { initialWorkspace: programToWorkspace(program) }
      : { solution: programToWorkspace(program) }),
  });

  it('reads the program of a predict level and the solution of the others', () => {
    expect(levelShape(level('predict', [forward, right]))).toBe('maze: forward, turn_left');
    expect(levelShape(level('build', [forward]))).toBe('maze: forward');
    expect(levelShape({ ...level('build', [forward]), mode: 'creative' })).toBeNull();
  });

  it('counts a mirror image as the same recipe (hỏi phải, rẽ phải = hỏi trái, rẽ trái)', () => {
    const asks = (dir: string, turn: string): Program => [
      {
        repeat: 12,
        body: [{ if: { ...askRight, fields: { DIR: dir } }, then: [{ block: turn }] }, forward],
      },
    ];
    expect(levelShape(level('build', asks('RIGHT', 'maze_turn_right')))).toBe(
      levelShape(level('build', asks('LEFT', 'maze_turn_left'))),
    );
    // Asking one side and turning to the other is another recipe.
    expect(levelShape(level('build', asks('LEFT', 'maze_turn_right')))).not.toBe(
      levelShape(level('build', asks('LEFT', 'maze_turn_left'))),
    );
    expect(mirrorShape('if is_path(DIR=LEFT) [turn_right]')).toBe(
      'if is_path(DIR=RIGHT) [turn_left]',
    );
  });

  it('round-trips through the workspace JSON', () => {
    const program: Program = [{ repeat: 4, body: [forward] }];
    expect(programFromWorkspace(programToWorkspace(program))).toEqual(program);
  });
});

describe('maze counts', () => {
  const map = ['#######', '##.####', '#S...G#', '###.###', '#######'];

  it('counts junctions and dead ends, leaving out S and G', () => {
    expect(mazeJunctions(map)).toEqual({ junctions: 2, deadEnds: 2 });
    expect(mazeJunctions(['#####', '#S.G#', '#####'])).toEqual({ junctions: 0, deadEnds: 0 });
  });

  it('counts only what Măng can reach: without a turn block, only the road straight ahead', () => {
    const reach = reachableCells(map, 'E', false);
    expect(mazeJunctions(map, reach)).toEqual({ junctions: 2, deadEnds: 0 });
    expect(mazeJunctions(map, reachableCells(map, 'E', true))).toEqual({
      junctions: 2,
      deadEnds: 2,
    });
  });

  it('describes the road: branches seen from Măng, then turns', () => {
    expect(mazeRoadShape(map, 'E')).toBe('l r');
    // Same road, longer: only the length differs.
    expect(mazeRoadShape(['########', '##.#####', '#S....G#', '####.###', '########'], 'E')).toBe(
      'l r',
    );
    // A right turn where the corridor also goes on ahead, then a left turn.
    expect(mazeRoadShape(['######', '#S..##', '##.###', '##..G#', '######'], 'E')).toBe('R:a L');
    expect(mazeRoadShape(['#####', '#S#G#', '#####'], 'E')).toBeNull();
  });
});

describe('checkDifficulty', () => {
  it('skips World 1 and exempts the approved ladders from M2 (W4 decision D5)', () => {
    expect(APPROVED_LADDERS[0]).toContain('w04-boss');
    const solution = programToWorkspace([forward, forward]);
    const level = (id: string, mode: Level['mode']): Level => ({
      id,
      worldId: 'w',
      stage: 'practice',
      kind: 'runner',
      mode,
      title: 't',
      objective: 'o',
      learningGoal: 'g',
      toolbox: [],
      config: {},
      hints: [],
      solution,
    });
    const levels = ['l01', 'l02', 'l03'].map((n) => level(`w01-${n}`, 'build'));
    const world = (order: number) => ({
      id: 'w',
      order,
      title: 't',
      emoji: 'e',
      concept: 'c',
      story: 's',
      theme: { tileset: '/tiles/ground.png', palette: 'day' },
      lessonIds: [],
      levelIds: [],
      unlock: { minStarRatio: 0.6 },
    });
    const run = (order: number) =>
      checkDifficulty({
        worlds: [{ world: world(order) as never, levels }],
        pathOf: (id) => id,
      }).map((issue) => `${issue.path} ${issue.message.slice(0, 4)}`);
    expect(run(1)).toEqual([]);
    expect(run(2)).toEqual(['w01-l02 (M2)', 'w01-l03 (M2)']);
  });

  it('extra-24-difficulty: warns once for M1, M2 and M3, never as an error', () => {
    const report = checkContent(loadContentFiles(fixture));
    expect(report.issues).toEqual([]);
    expect(
      report.warnings.map(
        (issue) =>
          `${String(issue.rule)} ${issue.path.split('/').pop() ?? ''} ${issue.message.slice(0, 4)}`,
      ),
    ).toEqual(['24 w02-l02.json (M1)', '24 w02-l03.json (M3)', '24 w02-l04.json (M2)']);
  });
});
