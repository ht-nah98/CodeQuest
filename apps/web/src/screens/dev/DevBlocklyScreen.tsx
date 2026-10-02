import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import * as Blockly from 'blockly';
import { COMMON_BLOCKS, registerBlockSpecs, type BlockSpec } from '@codequest/engine';
import {
  BlocklyWorkspace,
  loadInitialWorkspace,
  type BlocklyLevel,
  type WorkspaceHandle,
  type WorkspaceState,
} from '../../blockly/BlocklyWorkspace';
import { shouldHandleAppShortcut } from '../../blockly/shortcuts';
import { vi } from '../../i18n/vi';
import { Button, CapacityBricks, Panel, PixelIcon } from '../../ui';

const t = vi.dev.blockly;

// Dev-only sample blocks so the page has something to drag before the runner kind lands (P0-07).
// They are not part of any game kind and never reach content/.
const DEV_BLOCKS: readonly BlockSpec[] = [
  ...(
    [
      ['dev_walk', t.blockWalk],
      ['dev_jump', t.blockJump],
      ['dev_turn', t.blockTurn],
    ] as const
  ).map(([type, message0]): BlockSpec => ({
    type,
    category: 'move',
    apiNames: [],
    json: { message0, previousStatement: null, nextStatement: null, style: 'move_blocks' },
    generator: () => '',
  })),
  {
    type: 'dev_is_hole',
    category: 'sensor',
    apiNames: [],
    json: { message0: t.blockIsHole, output: 'Boolean', style: 'sensor_blocks' },
    generator: () => ['false', 0],
  },
];
const DEV_SPECS: readonly BlockSpec[] = [...COMMON_BLOCKS, ...DEV_BLOCKS];
registerBlockSpecs(DEV_BLOCKS);

type SampleId = keyof typeof t.levels;

const SAMPLES: Record<SampleId, BlocklyLevel> = {
  build3: {
    id: 'dev-build-3',
    mode: 'build',
    toolbox: ['dev_walk', 'dev_jump', { type: 'cq_repeat', fields: { TIMES: 3 } }],
    maxBlocks: 3,
  },
  parsons: {
    id: 'dev-parsons',
    mode: 'parsons',
    toolbox: [],
    initialWorkspace: {
      blocks: {
        languageVersion: 0,
        blocks: [
          { type: 'cq_start', id: 'start', x: 40, y: 40 },
          { type: 'dev_walk', id: 'walk1', x: 300, y: 60 },
          { type: 'dev_jump', id: 'jump', x: 120, y: 200 },
          { type: 'dev_walk', id: 'walk2', x: 340, y: 260 },
        ],
      },
    },
  },
  free: {
    id: 'dev-free',
    mode: 'build',
    toolbox: [
      'dev_walk',
      'dev_turn',
      { type: 'cq_repeat', fields: { TIMES: 4 } },
      'controls_whileUntil',
      'controls_if',
      'dev_is_hole',
    ],
  },
};
const SAMPLE_IDS = Object.keys(SAMPLES) as SampleId[];

/** Test hook for e2e: the live workspace and the Blockly module (dev build only). */
declare global {
  interface Window {
    __cqDevBlockly?: {
      Blockly: typeof Blockly;
      workspace: Blockly.WorkspaceSvg;
      levelId: string;
    };
  }
}

/** /dev/blockly: the Blockly wrapper with a few sample levels (P0-05). */
export default function DevBlocklyScreen() {
  const [sampleId, setSampleId] = useState<SampleId>('build3');
  const [runs, setRuns] = useState(0);
  // Blocks the last run saw, read synchronously from the workspace (never the debounced state).
  const [lastRunBlocks, setLastRunBlocks] = useState<number | null>(null);
  const [reported, setReported] = useState<WorkspaceState | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const handleRef = useRef<WorkspaceHandle | null>(null);
  const level = SAMPLES[sampleId];
  // The old workspace flushes its last report while the next level mounts; ignore it.
  const state = reported?.levelId === level.id ? reported : null;

  const run = useCallback(() => {
    setRuns((n) => n + 1);
    setLastRunBlocks(handleRef.current?.getState().analysis.blocksUsed ?? null);
  }, []);

  // App shortcut: Space runs unless Blockly owns the keyboard (blockly-integration.md §13).
  // Capture phase, so a block clicked with the mouse does not also get Blockly's Space action.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || !shouldHandleAppShortcut(event)) return;
      event.preventDefault();
      event.stopPropagation();
      run();
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true });
    };
  }, [run]);

  useEffect(
    () => () => {
      delete window.__cqDevBlockly;
    },
    [],
  );

  const onReady = useCallback(
    (workspace: Blockly.WorkspaceSvg, handle: WorkspaceHandle) => {
      workspaceRef.current = workspace;
      handleRef.current = handle;
      window.__cqDevBlockly = { Blockly, workspace, levelId: level.id };
    },
    [level.id],
  );

  const onDispose = useCallback(() => {
    workspaceRef.current = null;
    handleRef.current = null;
    delete window.__cqDevBlockly;
  }, []);

  const choose = (id: SampleId) => {
    setSampleId(id);
  };

  const remaining = state?.remainingCapacity ?? level.maxBlocks ?? null;

  return (
    <main className="grid h-screen min-h-[720px] grid-rows-[auto_1fr] gap-4 p-4">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link to="/" className="font-display font-bold text-ink">
          {t.backHome}
        </Link>
        <div className="grid">
          <span className="font-pixel text-pixel-sm text-brand-deep">{t.eyebrow}</span>
          <h1 className="m-0 text-[28px]">{t.title}</h1>
        </div>
        <div role="group" aria-label={t.levelsLabel} className="flex flex-wrap gap-2">
          {SAMPLE_IDS.map((id) => (
            <Button
              key={id}
              size="sm"
              variant={id === sampleId ? 'coin' : 'plain'}
              aria-pressed={id === sampleId}
              data-sample={id}
              onClick={() => {
                choose(id);
              }}
            >
              {t.levels[id]}
            </Button>
          ))}
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-[minmax(0,42fr)_minmax(0,58fr)] gap-4">
        <Panel className="grid min-h-0 grid-rows-[1fr_auto] overflow-hidden">
          <div
            ref={stageRef}
            tabIndex={-1}
            data-testid="dev-stage"
            aria-label={t.stageLabel}
            className="grid place-items-center border-b-3 border-ink bg-sky p-6 text-center outline-none focus-visible:outline-3 focus-visible:-outline-offset-6 focus-visible:outline-brand-deep"
          >
            <p className="m-0 max-w-[30ch] text-ink-soft">{t.stageHint}</p>
          </div>
          <div className="grid gap-3 p-4">
            <p className="m-0 text-ink-soft">{t.intro}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="go"
                icon={<PixelIcon name="play" scale={1} />}
                shortcut="Space"
                onClick={run}
              >
                {t.run}
              </Button>
              <Button
                icon="↺"
                onClick={() => {
                  if (workspaceRef.current) loadInitialWorkspace(workspaceRef.current, level);
                }}
              >
                {t.reset}
              </Button>
              <span data-testid="run-count" className="font-pixel text-hud">
                {t.runCount(runs)}
              </span>
              {lastRunBlocks !== null && (
                <span data-testid="last-run" className="font-pixel text-pixel-sm text-ink-soft">
                  {t.lastRun(lastRunBlocks)}
                </span>
              )}
            </div>
            <p data-testid="analysis" className="m-0 font-pixel text-pixel-sm text-ink-soft">
              {t.blocksUsed(state?.analysis.blocksUsed ?? 0)} ·{' '}
              {t.orphans(state?.analysis.orphanBlockIds.length ?? 0)}
            </p>
          </div>
        </Panel>

        <Panel className="grid min-h-0 grid-rows-[1fr_auto] overflow-hidden">
          <BlocklyWorkspace
            key={level.id}
            level={level}
            blockSpecs={DEV_SPECS}
            onChange={setReported}
            onReady={onReady}
            onDispose={onDispose}
            onMouseDragEnd={() => {
              stageRef.current?.focus();
            }}
            className="min-h-0 rounded-t-[15px]"
          />
          <div className="flex min-h-14 items-center justify-between gap-3 border-t-3 border-ink bg-paper px-4 py-2">
            {level.maxBlocks !== undefined && remaining !== null ? (
              <CapacityBricks max={level.maxBlocks} used={level.maxBlocks - remaining} />
            ) : (
              <span className="font-pixel text-pixel text-ink-soft">{t.noLimit}</span>
            )}
          </div>
        </Panel>
      </div>
    </main>
  );
}
