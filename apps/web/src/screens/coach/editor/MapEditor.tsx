import { useState } from 'react';
import type { Level } from '@codequest/content-schema';
import {
  MAZE_DIRS,
  MAZE_MAX_SIZE,
  MAZE_MIN_SIZE,
  RUNNER_MAX_CELLS,
  RUNNER_MIN_CELLS,
  type MazeConfig,
  type MazeDir,
  type MazeTile,
  type RunnerCell,
  type RunnerConfig,
} from '@codequest/games';
import type { RuleIssue } from '@codequest/validator';
import {
  applyRunnerTool,
  paintMaze,
  resizeMaze,
  resizeRunner,
  type RunnerTool,
} from '../../../features/editor/draft';
import { vi } from '../../../i18n/vi';
import { Button } from '../../../ui';
import { FOCUS_RING } from '../../../ui/focusRing';
import { CommitNumberInput, Field, FieldIssues, INPUT_CLASS, Section } from './parts';

const t = vi.editor;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRunnerConfig(config: unknown): config is RunnerConfig {
  return (
    isRecord(config) &&
    Array.isArray(config['cells']) &&
    config['cells'].every((cell) => typeof cell === 'string') &&
    typeof config['start'] === 'number'
  );
}

function isMazeConfig(config: unknown): config is MazeConfig {
  return (
    isRecord(config) &&
    Array.isArray(config['map']) &&
    config['map'].every((row) => typeof row === 'string') &&
    typeof config['startDir'] === 'string'
  );
}

/** The map of the draft: a runner track or a maze grid, plus the goal option. */
export function MapEditor({
  level,
  issues,
  onConfig,
}: {
  level: Level;
  issues: readonly RuleIssue[] | undefined;
  /** Applies `update` to the latest config (functional: a drag paints between renders). */
  onConfig: (update: (config: unknown) => unknown) => void;
}) {
  const { config } = level;
  let body;
  if (level.kind === 'runner' && isRunnerConfig(config)) {
    body = (
      <RunnerTrack
        config={config}
        onUpdate={(update) => {
          onConfig((latest) => (isRunnerConfig(latest) ? update(latest) : latest));
        }}
      />
    );
  } else if (level.kind === 'maze' && isMazeConfig(config)) {
    body = (
      <MazeGrid
        config={config}
        onUpdate={(update) => {
          onConfig((latest) => (isMazeConfig(latest) ? update(latest) : latest));
        }}
      />
    );
  } else {
    body = <p className="m-0 text-oops">{t.mapUnreadable}</p>;
  }
  const collectAll =
    isRecord(config) && isRecord(config['goal']) && config['goal']['collectAll'] === true;
  return (
    <Section title={t.map} id="editor-map">
      {body}
      {(isRunnerConfig(config) || isMazeConfig(config)) && (
        <label className="flex items-center gap-2 font-bold">
          <input
            type="checkbox"
            checked={collectAll}
            onChange={(event) => {
              const checked = event.target.checked;
              onConfig((latest) => {
                if (!isRecord(latest)) return latest;
                const next = { ...latest };
                if (checked) next['goal'] = { collectAll: true };
                else delete next['goal'];
                return next;
              });
            }}
            className="size-5 accent-brand-deep"
          />
          {t.collectAll}
        </label>
      )}
      <FieldIssues issues={issues} testId="issues-config" />
    </Section>
  );
}

const CELL_CLASS: Record<RunnerCell, string> = {
  ground: 'bg-paper-2',
  hole: 'bg-ink text-paper',
  branch: 'bg-block-move text-paper',
  crate: 'bg-coin-deep text-paper',
  flag: 'bg-brand-soft',
};

const RUNNER_TOOLS: readonly RunnerTool[] = ['cell', 'bamboo', 'start'];

function RunnerTrack({
  config,
  onUpdate,
}: {
  config: RunnerConfig;
  onUpdate: (update: (config: RunnerConfig) => RunnerConfig) => void;
}) {
  const [tool, setTool] = useState<RunnerTool>('cell');
  const bamboo = new Set(config.bamboo ?? []);
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end gap-4">
        <Field label={t.runnerLength}>
          <CommitNumberInput
            name="runner-length"
            value={config.cells.length}
            min={RUNNER_MIN_CELLS}
            max={RUNNER_MAX_CELLS}
            onCommit={(length) => {
              onUpdate((latest) => resizeRunner(latest, length));
            }}
          />
        </Field>
        <div
          role="group"
          aria-label={t.runnerToolsLabel}
          className="flex flex-wrap items-center gap-2"
        >
          <span className="font-display font-bold">{t.runnerToolsLabel}</span>
          {RUNNER_TOOLS.map((name) => (
            <Button
              key={name}
              size="sm"
              variant={tool === name ? 'coin' : 'plain'}
              aria-pressed={tool === name}
              data-runner-tool={name}
              onClick={() => {
                setTool(name);
              }}
            >
              {t.runnerTools[name]}
            </Button>
          ))}
        </div>
      </div>
      <ol className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label={t.map}>
        {config.cells.map((cell, index) => {
          const isStart = index === config.start;
          const hasBamboo = bamboo.has(index);
          const extra = `${isStart ? t.startMark : ''}${hasBamboo ? t.bambooMark : ''}`;
          return (
            <li key={index}>
              <button
                type="button"
                data-testid={`runner-cell-${String(index)}`}
                data-cell={cell}
                aria-label={t.runnerCellLabel(index, t.runnerCells[cell], extra)}
                disabled={cell === 'flag'}
                onClick={() => {
                  onUpdate((latest) => applyRunnerTool(latest, index, tool));
                }}
                className={`grid h-16 w-14 cursor-pointer content-between justify-items-center rounded-key border-3 border-ink py-1 font-pixel text-pixel-sm shadow-key disabled:cursor-default ${CELL_CLASS[cell]} ${FOCUS_RING}`}
              >
                <span>{t.runnerCells[cell]}</span>
                <span aria-hidden className="leading-none">
                  {isStart ? 'MĂNG' : hasBamboo ? 'măng' : String(index)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const TILE_CLASS: Record<MazeTile, string> = {
  '#': 'bg-ink text-paper',
  '.': 'bg-paper',
  b: 'bg-go',
  S: 'bg-brand-soft',
  G: 'bg-coin',
};
const BRUSHES: readonly MazeTile[] = ['#', '.', 'b', 'S', 'G'];

function MazeGrid({
  config,
  onUpdate,
}: {
  config: MazeConfig;
  onUpdate: (update: (config: MazeConfig) => MazeConfig) => void;
}) {
  const [brush, setBrush] = useState<MazeTile>('#');
  const rows = config.map.length;
  const cols = config.map[0]?.length ?? 0;
  const paint = (row: number, col: number) => {
    onUpdate((latest) =>
      latest.map[row]?.[col] === brush ? latest : paintMaze(latest, row, col, brush),
    );
  };
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end gap-4">
        <Field label={t.mazeRows}>
          <CommitNumberInput
            name="maze-rows"
            value={rows}
            min={MAZE_MIN_SIZE}
            max={MAZE_MAX_SIZE}
            onCommit={(value) => {
              onUpdate((latest) => resizeMaze(latest, value, latest.map[0]?.length ?? 0));
            }}
          />
        </Field>
        <Field label={t.mazeCols}>
          <CommitNumberInput
            name="maze-cols"
            value={cols}
            min={MAZE_MIN_SIZE}
            max={MAZE_MAX_SIZE}
            onCommit={(value) => {
              onUpdate((latest) => resizeMaze(latest, latest.map.length, value));
            }}
          />
        </Field>
        <Field label={t.startDir}>
          <select
            name="maze-start-dir"
            value={config.startDir}
            onChange={(event) => {
              const startDir = event.target.value as MazeDir;
              onUpdate((latest) => ({ ...latest, startDir }));
            }}
            className={INPUT_CLASS}
          >
            {MAZE_DIRS.map((dir) => (
              <option key={dir} value={dir}>
                {t.dirs[dir]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div role="group" aria-label={t.mazeBrushLabel} className="flex flex-wrap items-center gap-2">
        <span className="font-display font-bold">{t.mazeBrushLabel}</span>
        {BRUSHES.map((tile) => (
          <Button
            key={tile}
            size="sm"
            variant={brush === tile ? 'coin' : 'plain'}
            aria-pressed={brush === tile}
            data-maze-brush={tile}
            onClick={() => {
              setBrush(tile);
            }}
          >
            {t.mazeBrushes[tile]}
          </Button>
        ))}
      </div>
      <div
        role="group"
        aria-label={t.map}
        className="grid w-fit gap-0.5"
        style={{ gridTemplateColumns: `repeat(${String(cols)}, 2.25rem)` }}
      >
        {config.map.flatMap((line, row) =>
          Array.from(line).map((char, col) => {
            const tile = (BRUSHES as readonly string[]).includes(char) ? (char as MazeTile) : '.';
            return (
              <button
                key={`${String(row)}-${String(col)}`}
                type="button"
                data-testid={`maze-cell-${String(row)}-${String(col)}`}
                data-tile={char}
                aria-label={t.mazeCellLabel(row, col, t.mazeBrushes[tile])}
                onPointerDown={() => {
                  paint(row, col);
                }}
                onPointerEnter={(event) => {
                  // Drag to paint a line of walls or path.
                  if (event.buttons === 1) paint(row, col);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    paint(row, col);
                  }
                }}
                className={`grid size-9 cursor-pointer place-items-center rounded-[4px] border-2 border-ink font-pixel text-pixel ${TILE_CLASS[tile]} ${FOCUS_RING}`}
              >
                {char === 'S' || char === 'G' ? char : char === 'b' ? 'm' : ''}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
