import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LevelSchema, type Level } from '@codequest/content-schema';
import { describe, expect, it } from 'vitest';
import { findLevelFiles, judgeLevel, type ContentReader } from './par';

const contentDir = fileURLToPath(new URL('../../../content', import.meta.url));
const mainPath = fileURLToPath(new URL('./main.ts', import.meta.url));

function load(world: string, id: string): Level {
  const path = join(contentDir, 'worlds', world, 'levels', `${id}.json`);
  return LevelSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
}

describe('findLevelFiles', () => {
  const files: Record<string, string> = {
    '/c/worlds/w02-rung/world.json': JSON.stringify({ levelIds: ['w02-l02', 'w02-l01'] }),
    '/c/worlds/w02-rung/levels/w02-l01.json': '{"id":"w02-l01"}',
    '/c/worlds/w02-rung/levels/w02-l02.json': '{"id":"w02-l02"}',
  };
  const fs: ContentReader = {
    list: (dir) => {
      const prefix = `${dir}/`;
      const names = Object.keys(files)
        .filter((path) => path.startsWith(prefix))
        .map((path) => path.slice(prefix.length).split('/')[0] ?? '');
      return [...new Set(names)];
    },
    read: (path) => {
      const text = files[path];
      if (text === undefined) throw new Error('missing');
      return text;
    },
  };

  it('lists a world in levelIds order and finds levels by id', () => {
    const found = findLevelFiles(fs, '/c', ['w02-l01', 'w09-l01'], ['w02']);
    expect(found.map((file) => [file.name, file.error ?? file.text])).toEqual([
      ['w02-l02', '{"id":"w02-l02"}'],
      ['w02-l01', '{"id":"w02-l01"}'],
      ['w02-l01', '{"id":"w02-l01"}'],
      ['w09-l01', 'no such level in content/worlds/*/levels/'],
    ]);
    expect(findLevelFiles(fs, '/c', [], ['w07'])[0]?.error).toBe(
      'no such world in content/worlds/',
    );
  });
});

describe('judgeLevel', () => {
  it('searches a multi-map level on every map (P2-12)', () => {
    const verdict = judgeLevel(load('_sandbox', 'runner-maps'), {});
    expect(verdict.mark).toBe('✔');
    expect(verdict.head).toBe('runner-maps runner/build  maps 3  par 3  min 3 (18 shortest)');
  });

  it('passes a level whose par is the true minimum', () => {
    const verdict = judgeLevel(load('w02-rung-lap-lai', 'w02-l05'), {});
    expect(verdict.mark).toBe('✔');
    expect(verdict.head).toBe('w02-l05 runner/build  par 3  min 3 (18 shortest)');
    expect(verdict.lines[0]).toBe('shortest: repeat 3 [walk, jump]');
  });

  it('fails a par that is too high', () => {
    const verdict = judgeLevel({ ...load('w01-lang-tre', 'w01-l03'), par: 4 }, {});
    expect(verdict.mark).toBe('✖');
    expect(verdict.lines).toContain('par 4 is too high: 3 blocks win');
  });

  it('fails when nothing wins within par, warns when the budget runs out', () => {
    const level = { ...load('w01-lang-tre', 'w01-l05'), par: 4 };
    expect(judgeLevel(level, {}).head).toBe('w01-l05 runner/build  par 4  no win ≤ 4 blocks');
    expect(judgeLevel(level, {}).mark).toBe('✖');
    expect(judgeLevel(level, { maxWork: 5 }).mark).toBe('⚠');
  });

  it('warns when a bughunt level needs fewer edits than parEdits', () => {
    const verdict = judgeLevel(load('w02-rung-lap-lai', 'w02-l11'), {});
    expect(verdict.mark).toBe('⚠');
    expect(verdict.head).toContain('parEdits 2  fix 1');
    expect(verdict.lines).toContain('fixable with 1 edits < parEdits 2');
  });

  it('caps at ⚠ when toolbox blocks could not be searched', () => {
    const base = load('w01-lang-tre', 'w01-l05');
    const level = { ...base, toolbox: [...base.toolbox, 'runner_is_ahead'], par: 4 };
    const verdict = judgeLevel(level, {});
    expect(verdict.mark).toBe('⚠');
    expect(verdict.lines).toContain(
      'not searched: runner_is_ahead: value block (needs a condition block)',
    );
    // A real smaller program is still certain.
    expect(judgeLevel({ ...level, par: 6 }, {}).mark).toBe('✖');
  });

  it('fails when runLevel disagrees with the search', () => {
    const level = { ...load('w01-lang-tre', 'w01-l03'), limits: { maxActions: 2 } };
    const verdict = judgeLevel(level, {});
    expect(verdict.mark).toBe('✖');
    expect(verdict.lines).toContain(
      'runLevel disagrees: walk, jump, walk: runLevel timeout TIMEOUT, 3 blocks',
    );
  });

  it('notes a stopped search even when it found the minimum', () => {
    const verdict = judgeLevel(load('w02-rung-lap-lai', 'w02-l18'), { maxWork: 200_000 });
    expect(verdict.mark).toBe('⚠');
    expect(verdict.lines).toContain('fix search stopped (budget, memory cap or --timeout)');
  });

  describe('levels with starGoals (P2-21)', () => {
    // W3 l11 as designed in curriculum.md §5.1: 5 blocks win, 7 also pick up the shoot on 16.
    const cells = Array.from('..O..O..O.O.O.O....F', (char) =>
      char === '.' ? 'ground' : char === 'O' ? 'hole' : 'flag',
    );
    const base = load('w01-lang-tre', 'w01-l03');
    const l11: Level = {
      ...base,
      id: 'w03-l11',
      toolbox: ['runner_walk', 'runner_jump', 'runner_crouch', 'runner_kick', 'cq_repeat'],
      maxBlocks: 9,
      par: 7,
      config: { cells, start: 0, bamboo: [16] },
      starGoals: [{ kind: 'collectAll' }],
    };
    const noNesting = { maxDepth: 1 };

    it('judges par under the goals and shows the plain-win minimum', () => {
      const verdict = judgeLevel(l11, noNesting);
      expect(verdict.mark).toBe('✔');
      expect(verdict.head).toMatch(
        /^w03-l11 runner\/build {2}par 7 {2}min \(goals\) 7 \(\d+ shortest\) · plain win 5 \(32\)$/,
      );
      expect(verdict.lines.some((line) => line.startsWith('plain win: '))).toBe(true);
    });

    it('fails a par set to the plain win, and a par above the goal minimum', () => {
      const low = judgeLevel({ ...l11, par: 5 }, noNesting);
      expect(low.mark).toBe('✖');
      expect(low.head).toContain('no win (goals) ≤ 5 blocks · plain win 5 (32)');
      const high = judgeLevel({ ...l11, par: 8 }, noNesting);
      expect(high.mark).toBe('✖');
      expect(high.lines).toContain('par 8 is too high: 7 blocks win (goals)');
    });
  });

  it('skips modes whose blocks are given', () => {
    expect(judgeLevel(load('w01-lang-tre', 'w01-l04'), {}).mark).toBe('–');
  });
});

describe('npm run par', () => {
  it('prints one line per level and exits 1 on an unknown level', () => {
    const run = (): { status: number; output: string } => {
      try {
        const output = execFileSync(
          process.execPath,
          ['--import', 'tsx', mainPath, 'w01-l03', 'w09-l99'],
          { encoding: 'utf8' },
        );
        return { status: 0, output };
      } catch (error) {
        const failed = error as { status: number; stdout: string };
        return { status: failed.status, output: failed.stdout };
      }
    };
    const { status, output } = run();
    expect(status).toBe(1);
    expect(output).toMatch(/✔ w01-l03 runner\/build {2}par 3 {2}min 3 \(1 shortest\)/);
    expect(output).toContain('✖ w09-l99  no such level in content/worlds/*/levels/');
    expect(output).toContain('par: 2 levels, 1 errors, 0 warnings');
  }, 60_000);

  it('reports invalid JSON and bad flags', () => {
    const dir = mkdtempSync(join(tmpdir(), 'par-'));
    const bad = join(dir, 'w01-l99.json');
    writeFileSync(bad, '{ not json');
    const cli = (args: string[]): { status: number; output: string } => {
      try {
        const output = execFileSync(process.execPath, ['--import', 'tsx', mainPath, ...args], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        return { status: 0, output };
      } catch (error) {
        const failed = error as { status: number; stdout: string; stderr: string };
        return { status: failed.status, output: failed.stdout + failed.stderr };
      }
    };
    const invalid = cli([bad, 'w01-l02']);
    expect(invalid.status).toBe(1);
    expect(invalid.output).toContain('✖ w01-l99  invalid JSON (run content:check)');
    expect(invalid.output).toContain('✔ w01-l02 runner/build');
    const flag = cli(['w01-l02', '--depth', 'two']);
    expect(flag.status).toBe(2);
    expect(flag.output).toContain('--depth needs a whole number ≥ 0, got "two"');
    rmSync(dir, { recursive: true });
  }, 60_000);
});
