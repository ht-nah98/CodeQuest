import { describe, expect, it } from 'vitest';
import type { Level, WorkspaceJson } from '@codequest/content-schema';
import type { MazeConfig, RunnerConfig } from '@codequest/games';
import {
  addMap,
  applyRunnerTool,
  draftFromJson,
  draftMaps,
  issueField,
  levelFileText,
  levelJson,
  newDraft,
  paintMaze,
  removeMap,
  resizeMaze,
  resizeRunner,
  scatterProgram,
  toggleToolbox,
  unknownLevelKeys,
  blockLabel,
  toolboxChoices,
  updateMap,
  withMode,
} from './draft';
import { validateDraft } from './validation';

const runner = (cells: RunnerConfig['cells'], extra: Partial<RunnerConfig> = {}): RunnerConfig => ({
  cells,
  start: 0,
  ...extra,
});

const chain = (...types: string[]): WorkspaceJson => {
  let next: Record<string, unknown> | undefined;
  types.reverse().forEach((type, index) => {
    next = { block: { type, id: `b${String(index)}`, ...(next && { next }) } };
  });
  return {
    blocks: {
      languageVersion: 0,
      blocks: [{ type: 'cq_start', id: 'start', x: 40, y: 40, ...(next && { next }) }],
    },
  };
};

/** A complete runner build level that passes every per-level rule. */
function readyRunner(): Level {
  return {
    ...newDraft('runner'),
    title: 'Nhảy qua hố',
    objective: 'Nhảy qua hố tới lá cờ nhé!',
    learningGoal: 'Nhảy qua hố.',
    toolbox: ['runner_walk', 'runner_jump'],
    par: 3,
    config: runner(['ground', 'ground', 'hole', 'ground', 'flag']),
    solution: chain('runner_walk', 'runner_jump', 'runner_walk'),
  };
}

describe('runner track tools', () => {
  it('cycles ground → hole → branch → crate → ground and never touches the flag', () => {
    let config = runner(['ground', 'ground', 'flag']);
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      config = applyRunnerTool(config, 1, 'cell');
      seen.push(config.cells[1] ?? '');
    }
    expect(seen).toEqual(['hole', 'branch', 'crate', 'ground']);
    expect(applyRunnerTool(config, 2, 'cell')).toBe(config);
  });

  it('toggles bamboo, drops it under a hole and moves the start', () => {
    let config = applyRunnerTool(runner(['ground', 'ground', 'ground', 'flag']), 2, 'bamboo');
    expect(config.bamboo).toEqual([2]);
    config = applyRunnerTool(config, 1, 'bamboo');
    expect(config.bamboo).toEqual([1, 2]);
    config = applyRunnerTool(config, 2, 'cell'); // ground → hole: no bamboo in a hole
    expect(config.bamboo).toEqual([1]);
    config = applyRunnerTool(config, 1, 'bamboo');
    expect(config).not.toHaveProperty('bamboo');
    expect(applyRunnerTool(config, 1, 'start').start).toBe(1);
  });

  it('resizes within 3–40 keeping the flag last', () => {
    const config = runner(['ground', 'hole', 'ground', 'ground', 'flag'], {
      start: 3,
      bamboo: [2],
    });
    expect(resizeRunner(config, 7).cells).toEqual([
      'ground',
      'hole',
      'ground',
      'ground',
      'ground',
      'ground',
      'flag',
    ]);
    const short = resizeRunner(config, 2);
    expect(short.cells).toEqual(['ground', 'hole', 'flag']);
    expect(short.start).toBe(1);
    expect(short).not.toHaveProperty('bamboo');
    expect(resizeRunner(config, 99).cells).toHaveLength(40);
  });
});

describe('maze grid tools', () => {
  const maze: MazeConfig = { map: ['#####', '#S..#', '###G#'], startDir: 'E' };

  it('paints tiles and keeps S and G unique', () => {
    expect(paintMaze(maze, 0, 0, '.').map[0]).toBe('.####');
    const moved = paintMaze(maze, 1, 3, 'S');
    expect(moved.map).toEqual(['#####', '#..S#', '###G#']);
    expect(paintMaze(maze, 9, 9, '#')).toBe(maze);
  });

  it('resizes within 3–12, filling new cells with walls', () => {
    expect(resizeMaze(maze, 4, 6).map).toEqual(['#####' + '#', '#S..##', '###G##', '######']);
    expect(resizeMaze(maze, 1, 3).map).toEqual(['###', '#S.', '###']);
    expect(resizeMaze(maze, 20, 20).map).toHaveLength(12);
  });
});

describe('modes, toolbox and export', () => {
  it('fills what a new mode needs and drops unused fields on export', () => {
    const level = readyRunner();
    const bughunt = withMode(level, 'bughunt');
    expect(bughunt.parEdits).toBe(1);
    expect(bughunt.initialWorkspace).toEqual(level.solution);
    const predict = withMode(bughunt, 'predict');
    expect(predict.predict?.options).toHaveLength(3);
    const json = levelJson(predict);
    expect(json).not.toHaveProperty('solution');
    expect(json).not.toHaveProperty('par');
    expect(json).not.toHaveProperty('parEdits');
    // Switching back loses nothing.
    expect(withMode(predict, 'build').solution).toEqual(level.solution);
    expect(levelJson(withMode(predict, 'build'))).not.toHaveProperty('predict');
  });

  it('drops empty optional texts and writes keys in content order', () => {
    const text = levelFileText({
      ...readyRunner(),
      misconception: '  ',
      thinkingHint: 'Hố ở đâu?',
    });
    const json = JSON.parse(text) as Record<string, unknown>;
    expect(json).not.toHaveProperty('misconception');
    expect(Object.keys(json).slice(0, 5)).toEqual(['id', 'worldId', 'stage', 'kind', 'mode']);
    expect(text.endsWith('}\n')).toBe(true);
  });

  it('ticks toolbox blocks in choice order and keeps fixed-field entries', () => {
    expect(toolboxChoices('runner')).toEqual([
      'runner_walk',
      'runner_jump',
      'runner_crouch',
      'runner_kick',
      'runner_is_ahead',
      'runner_at_goal',
      'cq_repeat',
    ]);
    let level: Level = {
      ...newDraft('runner'),
      toolbox: [{ type: 'cq_repeat', fields: { TIMES: 3 } }],
    };
    level = toggleToolbox(level, 'runner_jump', true);
    level = toggleToolbox(level, 'runner_walk', true);
    expect(level.toolbox).toEqual([
      'runner_walk',
      'runner_jump',
      { type: 'cq_repeat', fields: { TIMES: 3 } },
    ]);
    level = toggleToolbox(level, 'cq_repeat', false);
    expect(level.toolbox).toEqual(['runner_walk', 'runner_jump']);
    expect(toggleToolbox(level, 'runner_walk', true)).toBe(level);
  });

  it('scatters a solution into loose blocks for parsons', () => {
    const scattered = scatterProgram(chain('runner_walk', 'runner_jump'));
    expect(scattered.blocks.blocks.map((block) => [block.type, 'next' in block])).toEqual([
      ['cq_start', false],
      ['runner_walk', false],
      ['runner_jump', false],
    ]);
  });

  it('opens any runner or maze level object, and nothing else', () => {
    expect(draftFromJson({ kind: 'robotlab', mode: 'build' })).toBeNull();
    expect(draftFromJson('nope')).toBeNull();
    const opened = draftFromJson({ id: 'w01-l02', kind: 'runner', mode: 'build', title: 'A' });
    expect(opened?.id).toBe('w01-l02');
    expect(opened?.hints).toEqual([]);
    expect(opened).not.toHaveProperty('solution');
  });
});

describe('validation next to the fields', () => {
  it('a ready level has no issues; a fresh draft reports what is missing', () => {
    expect(validateDraft(readyRunner()).issues).toEqual([]);
    const fresh = validateDraft(newDraft('runner'));
    expect(fresh.byField.get('title')?.[0]?.rule).toBe(1);
    expect(fresh.byField.has('solution')).toBe(false); // the schema fails first
  });

  it('maps rule issues to their field', () => {
    const level = readyRunner();
    const holeAtEnd = validateDraft({ ...level, par: 2 });
    expect(holeAtEnd.byField.get('par')?.[0]?.message).toContain('> par 2');
    const lost = validateDraft({ ...level, solution: chain('runner_walk') });
    expect(lost.byField.get('solution')?.[0]?.rule).toBe(9);
    const noJump = validateDraft({ ...level, toolbox: ['runner_walk'] });
    expect(noJump.byField.get('toolbox')?.[0]?.rule).toBe(11);
    const badMap = validateDraft({ ...level, config: runner(['ground', 'ground', 'ground']) });
    expect(badMap.byField.get('config')?.[0]?.message).toContain('flag');
    expect(badMap.playable).toBe(false);
    // Outside the sandbox the pedagogy rules and the ID pattern apply, as in content:check.
    const inWorld = validateDraft({ ...level, worldId: 'w01-lang-tre' });
    expect([...inWorld.byField.keys()].sort()).toEqual(['id', 'misconception', 'thinkingHint']);
  });

  it('runs a predict level for its answer key', () => {
    const level = withMode(readyRunner(), 'predict');
    const checked = validateDraft({
      ...level,
      predict: {
        options: [
          { key: 'win', label: 'Tới cờ' },
          { key: 'crash:FELL_IN_HOLE@2', label: 'Rơi hố' },
          { key: 'stop@1', label: 'Dừng' },
        ],
      },
    });
    expect(checked.answerKey).toBe('win');
    expect(checked.issues).toEqual([]);
  });

  it('knows each rule field', () => {
    expect(issueField({ rule: 1, message: 'config.cells: x' })).toBe('config');
    expect(issueField({ rule: 1, message: 'game kind "x" is not implemented yet' })).toBe('other');
    expect(issueField({ rule: 5, message: 'objective has 13 words > 12: "…"' })).toBe('objective');
    expect(issueField({ rule: 5, message: 'hint "a" say has 13 words > 12' })).toBe('hints');
    expect(issueField({ rule: 6, message: 'stage guided needs a misconception' })).toBe(
      'misconception',
    );
    expect(issueField({ rule: 10, message: 'par 5 > maxBlocks 4' })).toBe('maxBlocks');
    expect(issueField({ rule: 12, message: 'initialWorkspace has 1 shadow block(s)' })).toBe(
      'initialWorkspace',
    );
    expect(issueField({ rule: 14, message: 'editDistance(…) is 2 > parEdits 1' })).toBe('parEdits');
    expect(issueField({ rule: 14, message: 'initialWorkspace must lose' })).toBe(
      'initialWorkspace',
    );
    expect(issueField({ rule: 15, message: 'answerKey' })).toBe('predict');
    expect(issueField({ rule: 16, message: 'hint' })).toBe('hints');
  });

  it('lists keys of an opened file that are not level fields', () => {
    expect(unknownLevelKeys({ id: 'a', kind: 'runner', note: 'x', $schema: 'y' })).toEqual([
      'note',
      '$schema',
    ]);
    expect(unknownLevelKeys('nope')).toEqual([]);
  });

  it('labels toolbox blocks as the child sees them', () => {
    expect(blockLabel('runner_walk', 'runner')).toBe('đi');
    expect(blockLabel('cq_repeat', 'runner')).toBe('lặp … lần …');
    expect(blockLabel('runner_is_ahead', 'runner')).toBe('phía trước có …');
    expect(blockLabel('maze_turn_left', 'maze')).toBe('rẽ trái');
    expect(blockLabel('unknown_block', 'maze')).toBe('unknown_block');
  });
});

describe('maps of a multi-map draft (P2-12)', () => {
  const one = runner(['ground', 'ground', 'flag']);
  const two = runner(['ground', 'hole', 'ground', 'flag']);
  const base = (): Level => ({ ...newDraft('runner'), config: one });

  it('adds a copy of the shown map, up to 3 maps, and removes maps', () => {
    let level = addMap(base(), 0);
    expect(draftMaps(level)).toEqual([one, one]);
    level = updateMap(level, 1, () => two);
    expect(level.config).toEqual(one);
    expect(level.variants).toEqual([two]);
    level = addMap(level, 1);
    expect(draftMaps(level)).toEqual([one, two, two]);
    expect(addMap(level, 0)).toBe(level);
    // Removing map 1 promotes map 2 to `config`; the last map stays.
    level = removeMap(removeMap(level, 0), 1);
    expect(level.config).toEqual(two);
    expect('variants' in level).toBe(false);
    expect(removeMap(level, 0)).toBe(level);
  });

  it('opens and exports variants without loss, after config, for build and bughunt only', () => {
    const json = { ...levelJson(base()), variants: [two] };
    expect(unknownLevelKeys(json)).toEqual([]);
    const draft = draftFromJson(json);
    if (draft === null) throw new Error('not a draft');
    const exported = levelJson(draft);
    expect(exported['variants']).toEqual([two]);
    const keys = Object.keys(exported);
    expect(keys.indexOf('variants')).toBe(keys.indexOf('config') + 1);
    expect(levelJson(withMode(draft, 'bughunt'))['variants']).toEqual([two]);
    expect(levelJson(withMode(draft, 'parsons'))['variants']).toBeUndefined();
  });

  it('shows variant issues with the map and runs every map in validation', () => {
    expect(issueField({ rule: 1, message: 'variants.0.cells: Too small' })).toBe('config');
    const texts = { title: 'Hai', objective: 'Tới cờ', learningGoal: 'Đi' };
    const bad = { ...base(), ...texts, variants: [{ cells: [] }] };
    const result = validateDraft(bad);
    const mapIssues = (result.byField.get('config') ?? []).map((issue) => issue.message);
    expect(mapIssues.some((message) => message.startsWith('variants.0.'))).toBe(true);
    expect(result.playable).toBe(false);
  });
});
