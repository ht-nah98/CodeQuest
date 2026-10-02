import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router';
import * as Blockly from 'blockly';
import type { RunOutcome } from '@codequest/engine';
import type { RunnerEvent } from '@codequest/games';
import {
  BlocklyWorkspace,
  type WorkspaceHandle,
  type WorkspaceState,
} from '../../blockly/BlocklyWorkspace';
import { shouldHandleAppShortcut } from '../../blockly/shortcuts';
import {
  feedbackLine,
  loadPlayContent,
  type PlayContent,
  UnplayableLevelError,
} from '../../features/content/content';
import {
  offendingBlockId,
  resultLine,
  runnerConfigOf,
  runRunnerProgram,
} from '../../features/play/run';
import { vi } from '../../i18n/vi';
import type { PandaAnimation } from '../../stages/panda';
import { type Speed, StageController } from '../../stages/StageController';
import { Bubble, Button, CapacityBricks, Panel, PixelIcon } from '../../ui';
import { MangPortrait, type PortraitPose } from './MangPortrait';
import './play.css';

const t = vi.play;

/** Test hook for e2e (dev build only): the live workspace and what playback highlighted. */
declare global {
  interface Window {
    __cqPlay?: { Blockly: typeof Blockly; workspace: Blockly.WorkspaceSvg; highlights: string[] };
  }
}

type Loaded =
  | { status: 'loading' }
  | { status: 'ready'; content: PlayContent }
  | { status: 'missing' }
  | { status: 'unplayable' }
  | { status: 'error' };

/** /play/:levelId — loads the level, then mounts a fresh play session for it. */
export default function PlayScreen() {
  const { levelId = '' } = useParams();
  const [result, setResult] = useState<{ levelId: string; loaded: Loaded } | null>(null);
  // A result for another level (client-side navigation) counts as still loading.
  const loaded: Loaded = result?.levelId === levelId ? result.loaded : { status: 'loading' };

  useEffect(() => {
    let cancelled = false;
    const settle = (next: Loaded) => {
      if (!cancelled) setResult({ levelId, loaded: next });
    };
    loadPlayContent(levelId).then(
      (content) => {
        settle(content ? { status: 'ready', content } : { status: 'missing' });
      },
      (error: unknown) => {
        settle({ status: error instanceof UnplayableLevelError ? 'unplayable' : 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [levelId]);

  if (loaded.status !== 'ready') {
    const text =
      loaded.status === 'loading'
        ? t.loading
        : loaded.status === 'missing'
          ? t.notFound
          : loaded.status === 'unplayable'
            ? t.unplayable
            : t.loadError;
    return (
      <main className="grid h-screen place-items-center bg-ground p-6">
        <Panel className="grid justify-items-center gap-4 p-8">
          <MangPortrait pose={loaded.status === 'loading' ? 'idle_1' : 'talk'} height={96} />
          <p
            role={loaded.status === 'loading' ? undefined : 'alert'}
            className="m-0 text-bubble font-bold"
          >
            {text}
          </p>
        </Panel>
      </main>
    );
  }
  return <PlaySession key={loaded.content.level.id} content={loaded.content} />;
}

type Phase = 'idle' | 'running' | 'success' | 'fail';

// Text labels, not 🐢/🐇: emoji fonts are not guaranteed on the children's laptops.
const SPEEDS: ReadonlyArray<{ speed: Speed; label: string }> = [
  { speed: 0.5, label: t.speeds.slow },
  { speed: 1, label: t.speeds.normal },
  { speed: 2, label: t.speeds.fast },
];

/** Program JSON without block positions: moving or bumping a block is not an edit. */
function programKey(json: unknown): string {
  return JSON.stringify(json, (key, value: unknown) =>
    key === 'x' || key === 'y' ? undefined : value,
  );
}

const PORTRAIT: Record<Phase, PortraitPose> = {
  idle: 'idle_1',
  running: 'talk',
  success: 'happy',
  fail: 'talk',
};

/** One attempt at a level: stage on the left, Blockly on the right, Măng's bubble below. */
function PlaySession({ content }: { content: PlayContent }) {
  const { level, world, levelNumber, feedback } = content;
  const navigate = useNavigate();
  const stageBoxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<StageController | null>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const handleRef = useRef<WorkspaceHandle | null>(null);
  const shakenRef = useRef<Element | null>(null);
  /** The program of the replay on screen, to tell a real edit from a late debounced report. */
  const ranJsonRef = useRef<string | null>(null);
  const [stageReady, setStageReady] = useState(false);
  const [stageFailed, setStageFailed] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [bubble, setBubble] = useState<string>(t.ready);
  const [speed, setSpeed] = useState<Speed>(1);
  const [stepping, setStepping] = useState(false);
  const [blocksUsed, setBlocksUsed] = useState(0);
  const [capacity, setCapacity] = useState<number | null>(level.maxBlocks ?? null);

  const highlight = useCallback((blockId: string | null) => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    if (blockId !== null && !workspace.getBlockById(blockId)) return;
    workspace.highlightBlock(blockId);
    if (blockId !== null) window.__cqPlay?.highlights.push(blockId);
  }, []);

  const clearShake = useCallback(() => {
    shakenRef.current?.classList.remove('cq-shake');
    shakenRef.current = null;
  }, []);

  const shake = useCallback(
    (blockId: string | null) => {
      clearShake();
      const svg =
        blockId === null ? null : workspaceRef.current?.getBlockById(blockId)?.getSvgRoot();
      if (!svg) return;
      svg.classList.add('cq-shake');
      shakenRef.current = svg;
    },
    [clearShake],
  );

  // The stage is an imperative island (coding-standards.md §4): React owns only the div.
  useEffect(() => {
    const container = stageBoxRef.current;
    if (!container) return;
    const controller = new AbortController();
    StageController.mount(container, controller.signal, {
      config: runnerConfigOf(level),
      onHighlight: highlight,
      onAnimation: (animation: PandaAnimation) => {
        container.dataset.panda = animation;
      },
      onWaitingStep: (waiting) => {
        container.dataset.waitingStep = String(waiting);
      },
    }).then(
      (stage) => {
        if (controller.signal.aborted) {
          stage?.destroy();
          return;
        }
        if (!stage) return;
        stageRef.current = stage;
        setStageReady(true);
      },
      () => {
        if (!controller.signal.aborted) setStageFailed(true);
      },
    );
    return () => {
      controller.abort();
      stageRef.current?.destroy();
      stageRef.current = null;
      setStageReady(false);
    };
  }, [level, highlight]);

  const finish = useCallback(
    (outcome: RunOutcome<RunnerEvent>) => {
      setStepping(false);
      setBlocksUsed(outcome.stats.blocksUsed);
      setBubble(resultLine(outcome, level, feedback));
      if (outcome.result === 'success') {
        setPhase('success');
      } else {
        setPhase('fail');
        shake(offendingBlockId(outcome));
      }
    },
    [level, feedback, shake],
  );

  /** Stage back to the start; the program is kept (screens-and-flows.md §4, `R`). */
  const reset = useCallback(() => {
    stageRef.current?.reset();
    clearShake();
    setStepping(false);
    setPhase('idle');
    setBubble(t.ready);
  }, [clearShake]);

  const run = useCallback(
    (step: boolean) => {
      const stage = stageRef.current;
      const handle = handleRef.current;
      if (!stage || !handle) return;
      if (stage.playing) {
        if (step) {
          stage.step();
          setStepping(true);
          setBubble(t.stepping);
        } else {
          reset(); // Space / Chạy while playing = Dừng
        }
        return;
      }
      clearShake();
      // Read the program synchronously: the debounced onChange may lag behind a fresh drop.
      const { json } = handle.getState();
      ranJsonRef.current = programKey(json);
      const fail = () => {
        reset();
        setBubble(feedbackLine('INTERNAL_ERROR', level, feedback));
      };
      let outcome: RunOutcome<RunnerEvent>;
      try {
        outcome = runRunnerProgram(level, json);
      } catch {
        fail();
        return;
      }
      setPhase('running');
      setStepping(step);
      setBubble(step ? t.stepping : t.running);
      stage.play(outcome, { step }).then((result) => {
        if (result === 'finished') finish(outcome);
      }, fail);
    },
    [level, feedback, finish, reset, clearShake],
  );

  // App shortcuts: Space = Chạy/Dừng, S = Từng bước, R = Làm lại (blockly-integration.md §13).
  // Capture phase, so a block clicked with the mouse does not also get Blockly's Space action.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const action =
        event.code === 'Space'
          ? 'run'
          : event.code === 'KeyS'
            ? 'step'
            : event.code === 'KeyR'
              ? 'reset'
              : null;
      if (action === null || !shouldHandleAppShortcut(event)) return;
      event.preventDefault();
      event.stopPropagation();
      if (action === 'reset') reset();
      else run(action === 'step');
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true });
    };
  }, [run, reset]);

  const onReady = useCallback((workspace: Blockly.WorkspaceSvg, handle: WorkspaceHandle) => {
    workspaceRef.current = workspace;
    handleRef.current = handle;
    if (import.meta.env.DEV) window.__cqPlay = { Blockly, workspace, highlights: [] };
  }, []);

  const onDispose = useCallback(() => {
    workspaceRef.current = null;
    handleRef.current = null;
    delete window.__cqPlay;
  }, []);

  const onChange = useCallback(
    (state: WorkspaceState) => {
      // A workspace being torn down reports once more, tagged with its own level.
      if (state.levelId !== level.id) return;
      setCapacity(state.remainingCapacity);
      // Editing the program makes the replay on screen stale: put the stage back.
      if (phase !== 'idle' && programKey(state.json) !== ranJsonRef.current) reset();
    },
    [level.id, phase, reset],
  );

  const chooseSpeed = (next: Speed) => {
    setSpeed(next);
    stageRef.current?.setSpeed(next);
  };

  /** After a toolbar click, focus goes back to the stage so Space runs (not re-clicks). */
  const focusStage = () => {
    stageBoxRef.current?.focus();
  };

  // Radio group keyboard pattern: arrows move the choice, only the checked radio is tabbable.
  const speedRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const onSpeedKey = (event: ReactKeyboardEvent, index: number) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const target = (index + step + SPEEDS.length) % SPEEDS.length;
    const option = SPEEDS[target];
    if (!option) return;
    chooseSpeed(option.speed);
    speedRefs.current[target]?.focus();
  };

  const running = phase === 'running';

  return (
    <main className="cq-play grid h-screen min-h-[720px] grid-rows-[56px_minmax(0,1fr)_72px] gap-3 bg-ground px-3 pt-2 pb-3">
      <header className="flex min-w-0 items-center gap-4">
        <Button size="sm" icon="←" onClick={() => void navigate('/')}>
          {t.backToMap}
        </Button>
        <h1 className="m-0 flex min-w-0 items-baseline gap-3 text-[26px] leading-tight">
          <span className="font-pixel text-pixel text-brand-deep">
            {t.where(world.title, levelNumber)}
          </span>
          <span className="truncate">{level.title}</span>
        </h1>
      </header>

      <div className="grid min-h-0 grid-cols-[minmax(0,42fr)_minmax(0,58fr)] gap-3">
        <Panel className="flex min-h-0 flex-col overflow-hidden">
          <div className="relative min-h-0 flex-1 border-b-3 border-ink bg-sky">
            <div
              ref={stageBoxRef}
              tabIndex={-1}
              role="img"
              aria-label={t.stageLabel}
              data-testid="play-stage"
              data-ready={stageReady}
              data-phase={phase}
              className="absolute inset-0 outline-none focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-brand-deep"
            />
            {stageFailed && (
              <p
                role="alert"
                className="absolute inset-x-4 top-4 m-0 text-center font-bold text-oops"
              >
                {t.stageError}
              </p>
            )}
            {phase === 'success' && (
              <Panel
                as="section"
                aria-labelledby="play-success-title"
                data-testid="play-success"
                className="absolute inset-x-4 bottom-4 flex animate-pop flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3"
              >
                <div className="grid">
                  <h2 id="play-success-title" className="m-0 text-[28px] leading-tight">
                    {t.successTitle}
                  </h2>
                  <p className="m-0">{t.successBody(blocksUsed)}</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    icon="↺"
                    onClick={() => {
                      reset();
                      focusStage();
                    }}
                  >
                    {t.playAgain}
                  </Button>
                  <Button size="sm" variant="go" onClick={() => void navigate('/')}>
                    {t.backToMap}
                  </Button>
                </div>
              </Panel>
            )}
          </div>

          <p className="m-0 flex items-center gap-2 border-b-3 border-ink bg-paper-2 px-4 py-2 font-bold">
            <span className="rounded-kbd bg-brand-deep px-2 pt-0.5 font-pixel text-pixel-sm font-normal text-paper uppercase">
              {t.objectiveLabel}
            </span>
            {level.objective}
          </p>

          <div
            role="toolbar"
            aria-label={t.controlsLabel}
            className="flex flex-wrap items-center gap-3 px-4 py-3"
          >
            <Button
              variant={running ? 'plain' : 'go'}
              size="lg"
              icon={running ? '■' : <PixelIcon name="play" scale={1} />}
              shortcut="Space"
              disabled={!stageReady}
              data-testid="play-run"
              onClick={() => {
                run(false);
                focusStage();
              }}
            >
              {running ? t.stop : t.run}
            </Button>
            <Button
              size="sm"
              shortcut="S"
              disabled={!stageReady}
              aria-pressed={stepping}
              onClick={() => {
                run(true);
                focusStage();
              }}
            >
              {t.step}
            </Button>
            <div role="radiogroup" aria-label={t.speedLabel} className="flex gap-1">
              {SPEEDS.map((option, index) => (
                <button
                  key={option.speed}
                  ref={(element) => {
                    speedRefs.current[index] = element;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={speed === option.speed}
                  tabIndex={speed === option.speed ? 0 : -1}
                  onKeyDown={(event) => {
                    onSpeedKey(event, index);
                  }}
                  onClick={() => {
                    chooseSpeed(option.speed);
                    focusStage();
                  }}
                  className="min-h-11 cursor-pointer rounded-key border-2 border-ink bg-paper px-3 font-display text-small font-bold shadow-key transition-transform duration-150 hover:-translate-y-px aria-checked:translate-y-0.5 aria-checked:bg-coin aria-checked:shadow-button-pressed focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              icon="↺"
              shortcut="R"
              className="ml-auto"
              onClick={() => {
                reset();
                focusStage();
              }}
            >
              {t.reset}
            </Button>
          </div>
        </Panel>

        <Panel className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
          <BlocklyWorkspace
            level={level}
            onChange={onChange}
            onReady={onReady}
            onDispose={onDispose}
            onMouseDragEnd={() => {
              stageBoxRef.current?.focus();
            }}
            className="min-h-0 rounded-t-[15px]"
          />
          {level.maxBlocks !== undefined && capacity !== null && (
            <div className="flex min-h-14 items-center border-t-3 border-ink bg-paper px-4 py-2">
              <CapacityBricks max={level.maxBlocks} used={level.maxBlocks - capacity} />
            </div>
          )}
        </Panel>
      </div>

      <footer className="flex min-w-0 items-center gap-4 px-2">
        <MangPortrait pose={PORTRAIT[phase]} height={64} />
        <span className="sr-only">{t.mangSays}:</span>
        <div data-testid="play-bubble" className="min-w-0">
          <Bubble text={bubble} live className="max-w-[820px]" />
        </div>
      </footer>
    </main>
  );
}
