import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router';
import * as Blockly from 'blockly';
import type { RunOutcome } from '@codequest/engine';
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
import { offendingBlockId, resultLine, runProgram } from '../../features/play/run';
import type { WinReward } from '../../features/play/session';
import { usePlaySession } from '../../features/play/usePlaySession';
import { useSignedInProfile } from '../../features/profiles';
import { vi } from '../../i18n/vi';
import type { PandaAnimation } from '../../stages/panda';
import { type Speed, StageController } from '../../stages/StageController';
import { Bubble, Button, CapacityBricks, Panel, PixelIcon } from '../../ui';
import { canOpenLevel } from '../../features/content/catalog';
import { ScreenMessage } from '../shared/ScreenMessage';
import { useChild } from '../shared/useChild';
import { MangPortrait, type PortraitPose } from './MangPortrait';
import { PlayTopBar } from './PlayTopBar';
import { ResultsOverlay } from './ResultsOverlay';
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
  const navigate = useNavigate();
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

  // URL guard (P1-10 review M4): a level the child has not opened yet is not playable by link.
  const profile = useSignedInProfile();
  const { catalog, child } = useChild(profile.id);
  const known = catalog?.levels.get(levelId);
  const access =
    catalog === null || child === null
      ? 'checking'
      : canOpenLevel(catalog, levelId, child)
        ? 'open'
        : 'locked';

  const status =
    loaded.status === 'ready' && access !== 'open'
      ? access === 'locked' && known
        ? 'locked'
        : 'loading'
      : loaded.status;
  if (status !== 'ready' || loaded.status !== 'ready') {
    const text =
      status === 'loading'
        ? t.loading
        : status === 'locked'
          ? t.locked
          : status === 'missing'
            ? t.notFound
            : status === 'unplayable'
              ? t.unplayable
              : t.loadError;
    return (
      <ScreenMessage text={text} alert={status !== 'loading'}>
        {status !== 'loading' && (
          <Button
            icon="←"
            onClick={() => void navigate(known ? `/w/${known.worldId}` : '/map')}
            data-testid="play-back-out"
          >
            {known ? t.toWorld : t.toMap}
          </Button>
        )}
      </ScreenMessage>
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
  /** The chosen speed, for a stage mounted later (level change, dev Fast Refresh). */
  const speedRef = useRef<Speed>(1);
  const [stepping, setStepping] = useState(false);
  const [paused, setPaused] = useState(false);
  const [capacity, setCapacity] = useState<number | null>(level.maxBlocks ?? null);
  // Rewards and progress of this level session (features/play/usePlaySession.ts).
  const profile = useSignedInProfile();
  const {
    ready: sessionReady,
    initialWorkspace,
    recordRun,
    saveDraft,
    setWorkspaceFlush,
  } = usePlaySession(profile.id, level);
  const [reward, setReward] = useState<WinReward | null>(null);
  // The workspace starts from the child's draft when there is one.
  const workspaceLevel = useMemo(
    () => (initialWorkspace === undefined ? level : { ...level, initialWorkspace }),
    [level, initialWorkspace],
  );

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
      kind: level.kind,
      config: level.config,
      onHighlight: highlight,
      onAnimation: (animation: PandaAnimation) => {
        container.dataset.panda = animation;
      },
      onWaitingStep: (waiting) => {
        container.dataset.waitingStep = String(waiting);
      },
      ...(import.meta.env.DEV && {
        onClockSpeed: (clockSpeed: number) => {
          container.dataset.stageSpeed = String(clockSpeed);
        },
      }),
    }).then(
      (stage) => {
        if (controller.signal.aborted) {
          stage?.destroy();
          return;
        }
        if (!stage) return;
        stageRef.current = stage;
        // A fresh stage starts at 1× and not paused: carry over the speed the child chose (the
        // paused state is reset below, as a new stage has no replay to pause).
        stage.setSpeed(speedRef.current);
        setStageReady(true);
        // A new stage shows Măng at the start, so the screen must too. Normally it already does;
        // but dev Fast Refresh re-runs this effect while keeping state, which left
        // data-phase="success" over a fresh stage (Măng idle on S) and the results overlay up.
        setPhase('idle');
        setStepping(false);
        setPaused(false);
        setBubble(t.ready);
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

  /** Bumped by every run: a reward that resolves after the next run started is not shown. */
  const runTokenRef = useRef(0);

  const finish = useCallback(
    (outcome: RunOutcome, rewardOf: Promise<WinReward | null>) => {
      setStepping(false);
      setPaused(false);
      setBubble(resultLine(outcome, level, feedback));
      // The run was recorded when it ran (rewards-engine.md §3); only the overlay waits for the
      // end of the replay.
      const token = runTokenRef.current;
      void rewardOf.then((won) => {
        if (won && runTokenRef.current === token) setReward(won);
      });
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
    setPaused(false);
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
          setPaused(false);
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
      let outcome: RunOutcome;
      try {
        outcome = runProgram(level, json);
      } catch {
        fail();
        return;
      }
      // Every run counts as soon as it ran, even if the replay is stopped or the child leaves
      // before it ends (rewards-engine.md §3 "Quy ước gọi").
      runTokenRef.current += 1;
      setReward(null);
      const rewardOf = recordRun(outcome);
      setPhase('running');
      setStepping(step);
      setPaused(false);
      setBubble(step ? t.stepping : t.running);
      stage.play(outcome, { step }).then((result) => {
        if (result === 'finished') finish(outcome, rewardOf);
      }, fail);
    },
    [level, feedback, finish, reset, clearShake, recordRun],
  );

  /** Tạm dừng / Tiếp tục: freezes the replay mid-move, or lets it go on. */
  const togglePause = useCallback(() => {
    const stage = stageRef.current;
    if (!stage?.playing) return;
    if (stage.paused) {
      stage.resume();
      setPaused(false);
      setBubble(stepping ? t.stepping : t.running);
    } else {
      stage.pause();
      setPaused(true);
      setBubble(t.paused);
    }
  }, [stepping]);

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

  const onReady = useCallback(
    (workspace: Blockly.WorkspaceSvg, handle: WorkspaceHandle) => {
      workspaceRef.current = workspace;
      handleRef.current = handle;
      setWorkspaceFlush(() => {
        handle.flush();
      });
      if (import.meta.env.DEV) window.__cqPlay = { Blockly, workspace, highlights: [] };
    },
    [setWorkspaceFlush],
  );

  const onDispose = useCallback(() => {
    workspaceRef.current = null;
    handleRef.current = null;
    setWorkspaceFlush(null);
    delete window.__cqPlay;
  }, [setWorkspaceFlush]);

  const onChange = useCallback(
    (state: WorkspaceState) => {
      // A workspace being torn down reports once more, tagged with its own level.
      if (state.levelId !== level.id) return;
      setCapacity(state.remainingCapacity);
      saveDraft(state.json);
      // Editing the program makes the replay on screen stale: put the stage back.
      if (phase !== 'idle' && programKey(state.json) !== ranJsonRef.current) reset();
    },
    [level.id, phase, reset, saveDraft],
  );

  const chooseSpeed = (next: Speed) => {
    speedRef.current = next;
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
    <main className="cq-play grid h-dvh min-h-[500px] grid-rows-[56px_minmax(0,1fr)_64px] gap-2 bg-ground px-3 pt-2 pb-2">
      <PlayTopBar
        profileId={profile.id}
        levelId={level.id}
        levelTitle={level.title}
        where={t.where(world.title, levelNumber)}
        worldId={world.id}
        readProgram={() => handleRef.current?.getState().json ?? null}
      />

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
              data-paused={paused}
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
            {/* Icon-only (named for screen readers and on hover) so the toolbar keeps its rows. */}
            <Button
              size="sm"
              icon={paused ? <PixelIcon name="play" scale={1} /> : '❚❚'}
              disabled={!running}
              aria-label={paused ? t.resume : t.pause}
              title={paused ? t.resume : t.pause}
              data-testid="play-pause"
              onClick={() => {
                togglePause();
                focusStage();
              }}
            />
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
          {sessionReady ? (
            <BlocklyWorkspace
              level={workspaceLevel}
              onChange={onChange}
              onReady={onReady}
              onDispose={onDispose}
              onMouseDragEnd={() => {
                stageBoxRef.current?.focus();
              }}
              className="min-h-0 rounded-t-[15px]"
            />
          ) : (
            <div className="min-h-0 rounded-t-[15px] bg-paper" />
          )}
          {level.maxBlocks !== undefined && capacity !== null && (
            <div className="flex min-h-14 items-center border-t-3 border-ink bg-paper px-4 py-2">
              <CapacityBricks max={level.maxBlocks} used={level.maxBlocks - capacity} />
            </div>
          )}
          {/* HINT SLOT (P1-07, next round): the hint box button (💡 Gợi ý · H) goes here, at the
              right of the capacity bar (screens-and-flows.md §3). It reads the open session
              through usePlaySession().snapshot() for buyHint / failStreak, and reports a purchase
              with recordHintBought(tier, entry) so later wins are capped. */}
        </Panel>
      </div>

      <footer className="flex min-w-0 items-center gap-4 px-2">
        <MangPortrait pose={PORTRAIT[phase]} height={56} />
        <span className="sr-only">{t.mangSays}:</span>
        <div data-testid="play-bubble" className="min-w-0">
          <Bubble text={bubble} live className="max-w-[820px]" />
        </div>
      </footer>
      {reward !== null && phase === 'success' && (
        <ResultsOverlay
          profileId={profile.id}
          level={level}
          world={world}
          reward={reward}
          onReplay={() => {
            setReward(null);
            reset();
            focusStage();
          }}
          onWorld={() => void navigate(`/w/${world.id}`)}
          onNext={(next) => void navigate(`/play/${next}`)}
        />
      )}
    </main>
  );
}
