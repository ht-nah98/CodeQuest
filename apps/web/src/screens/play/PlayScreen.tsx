import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import * as Blockly from 'blockly';
import {
  type FeedbackFile,
  type Level,
  type LevelMode,
  type ReasonCode,
  sceneThemeOf,
} from '@codequest/content-schema';
import {
  COND_INPUT,
  CONDITION_BLOCK_TYPES,
  CQ_START,
  editDistance,
  type RunOutcome,
} from '@codequest/engine';
import { DEFAULT_PAR_EDITS } from '@codequest/rewards';
import {
  audio,
  feedbackVoiceId,
  levelVoiceId,
  RUN_SFX,
  stageSfx,
  uiVoiceId,
  useMusic,
} from '../../audio';
import {
  BlocklyWorkspace,
  type WorkspaceHandle,
  type WorkspaceState,
} from '../../blockly/BlocklyWorkspace';
import { markSense } from '../../blockly/senseMark';
import { shouldHandleAppShortcut } from '../../blockly/shortcuts';
import {
  feedbackLine,
  loadPlayContent,
  type PlayContent,
  UnplayableLevelError,
} from '../../features/content/content';
import {
  mapReplays,
  mapsOf,
  offendingBlockId,
  resultLine,
  runProgram,
} from '../../features/play/run';
import type { WinReward } from '../../features/play/session';
import { hasStarGoals } from '../../features/play/starGoals';
import { usePlaySession } from '../../features/play/usePlaySession';
import { useSignedInProfile } from '../../features/profiles';
import { vi } from '../../i18n/vi';
import type { PandaAnimation } from '../../stages/panda';
import { planSourceFor } from '../../stages/planSource';
import { parseSceneTheme } from '../../stages/sceneThemes';
import {
  type PlayResult,
  type SenseMark,
  type Speed,
  StageController,
} from '../../stages/StageController';
import { TrackStrip } from '../../stages/TrackStrip';
import { Bubble, Button, CapacityBricks, Panel, PixelIcon, SpeakButton } from '../../ui';
import { canOpenLevel } from '../../features/content/catalog';
import { ScreenMessage } from '../shared/ScreenMessage';
import { useChild } from '../shared/useChild';
import { MangPortrait, type PortraitPose } from './MangPortrait';
import { PlanView } from './PlanView';
import { PlayTopBar } from './PlayTopBar';
import { type PickMark, PredictCards } from './PredictCards';
import { HintBox } from './HintBox';
import { type MapMark, MapTabs } from './MapTabs';
import { ResultsOverlay } from './ResultsOverlay';
import { SolutionViewer } from './SolutionViewer';
import { StarGoalsCard } from './StarGoalsCard';
import { type PlayLine, usePlayHints } from './usePlayHints';
import './play.css';

const t = vi.play;

/** Test hook for e2e (dev build only): the live workspace and what playback highlighted. */
declare global {
  interface Window {
    __cqPlay?: {
      Blockly: typeof Blockly;
      workspace: Blockly.WorkspaceSvg;
      highlights: string[];
      /** Answers shown by question blocks during replays, as `<blockId>:yes|no` (P2-11). */
      senses: string[];
      /** Mode predict: the engine's answer for the level's program. */
      answerKey?: string | undefined;
    };
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
  return (
    <PlaySession
      key={loaded.content.level.id}
      content={loaded.content}
      {...hintFactsOf(loaded.content, catalog, child)}
    />
  );
}

/**
 * Profile facts for tier-0 hints (hint-engine.md §2): whether this level is the first of its mode
 * in its world, and the modes of every level the child has progress on.
 */
function hintFactsOf(
  content: PlayContent,
  catalog: ReturnType<typeof useChild>['catalog'],
  child: ReturnType<typeof useChild>['child'],
): { isFirstOfModeInWorld: boolean; seenModes: ReadonlySet<LevelMode> } {
  const { level, world } = content;
  const firstOfMode = world.levelIds
    .map((id) => catalog?.levels.get(id))
    .find((other) => other !== undefined && other.retired !== true && other.mode === level.mode);
  const seenModes = new Set<LevelMode>();
  for (const id of child?.progress.keys() ?? []) {
    const mode = catalog?.levels.get(id)?.mode;
    if (mode !== undefined) seenModes.add(mode);
  }
  return { isFirstOfModeInWorld: firstOfMode?.id === level.id, seenModes };
}

/** A feedback line with its voice: the level's own when it overrides the shared one. */
function feedbackPlayLine(
  reason: ReasonCode,
  level: Pick<Level, 'id' | 'feedback'>,
  feedback: FeedbackFile,
): PlayLine {
  const own = level.feedback?.[reason] !== undefined ? level.id : undefined;
  return { text: feedbackLine(reason, level, feedback), voiceId: feedbackVoiceId(reason, own) };
}

/** A fixed vi.ts line of the play screen, voiced as `ui.<path>`. */
const uiLine = (path: string, text: string): PlayLine => ({ text, voiceId: uiVoiceId(path) });

/** Fixed win lines of `resultLine` that have a voice; the others (with numbers) have none. */
const VOICED_WIN_LINES: readonly PlayLine[] = [
  uiLine('play.win', t.win),
  uiLine('play.goalMissed.collectAll', t.goalMissed.collectAll),
  uiLine('play.bughunt.win', t.bughunt.win),
  uiLine('play.creative.done', t.creative.done),
];

type Phase = 'idle' | 'running' | 'success' | 'fail';

// Text labels, not 🐢/🐇: emoji fonts are not guaranteed on the children's laptops.
const SPEEDS: ReadonlyArray<{ speed: Speed; label: string }> = [
  { speed: 0.5, label: t.speeds.slow },
  { speed: 1, label: t.speeds.normal },
  { speed: 2, label: t.speeds.fast },
];

/**
 * The first block of the program (under "khi bắt đầu") whose question slot is empty: what an
 * EMPTY_CONDITION run shakes, as the engine stops before any event (P2-11).
 */
function emptyConditionBlockId(workspace: Blockly.WorkspaceSvg): string | null {
  for (const start of workspace.getBlocksByType(CQ_START, true)) {
    for (const block of start.getDescendants(true)) {
      if (!CONDITION_BLOCK_TYPES.includes(block.type)) continue;
      if (block.getInputTargetBlock(COND_INPUT) === null) return block.id;
    }
  }
  return null;
}

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
function PlaySession({
  content,
  isFirstOfModeInWorld,
  seenModes,
}: {
  content: PlayContent;
  isFirstOfModeInWorld: boolean;
  seenModes: ReadonlySet<LevelMode>;
}) {
  const { level, world, levelNumber, feedback } = content;
  const { mode } = level;
  // The world's scenery (P2-23). Dev builds: `?theme=` previews another theme on any level
  // (internal review of a theme whose world has no content yet, e.g. song).
  const [search] = useSearchParams();
  const theme =
    (import.meta.env.DEV ? parseSceneTheme(search.get('theme')) : null) ?? sceneThemeOf(world);
  const predict = mode === 'predict' ? level.predict : undefined;
  const readyLine = useMemo(
    () =>
      mode === 'build'
        ? uiLine('play.ready', t.ready)
        : uiLine(`play.readyByMode.${mode}`, t.readyByMode[mode]),
    [mode],
  );
  useMusic('adventure');
  const rootRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const stageBoxRef = useRef<HTMLDivElement>(null);
  // Multi-map levels (P2-12): map 1 is `config`, then each variant; the stage shows one at a time.
  const maps = useMemo(() => mapsOf(level), [level]);
  const [mapIndex, setMapIndex] = useState(0);
  /** The map on the stage, readable in callbacks and stage hooks. */
  const mapIndexRef = useRef(0);
  /** How each map did in the last run (cleared by a new run or an edit). */
  const [mapMarks, setMapMarks] = useState<ReadonlyArray<MapMark | undefined>>([]);
  // Runner / maze: the full-track strip under the stage and the "Xem cả đường" view follow the
  // replay through one feed per map (stage-rendering.md §2, §4).
  const planSources = useMemo(
    () => maps.map((config) => planSourceFor(level.kind, config, level.goalSprite, theme)),
    [level.kind, level.goalSprite, maps, theme],
  );
  const planSource = planSources[mapIndex] ?? null;
  const trackFeed = planSource?.kind === 'runner' ? planSource.feed : null;
  /** "Xem cả đường" (P2-22): open, the strip is up (the button sits on it), marks per map. */
  const [planOpen, setPlanOpen] = useState(false);
  const [stripShown, setStripShown] = useState(false);
  const [planMarks, setPlanMarks] = useState<ReadonlyArray<readonly string[] | undefined>>([]);
  const stageRef = useRef<StageController | null>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const handleRef = useRef<WorkspaceHandle | null>(null);
  const shakenRef = useRef<Element | null>(null);
  /** The program of the replay on screen, to tell a real edit from a late debounced report. */
  const ranJsonRef = useRef<string | null>(null);
  /** The program of the last workspace report, to tell the child's edits from re-reports. */
  const lastProgramRef = useRef<string | null>(null);
  const [stageReady, setStageReady] = useState(false);
  const [stageFailed, setStageFailed] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [bubble, setBubbleLine] = useState<PlayLine>(readyLine);
  const bubbleRef = useRef(bubble);
  useEffect(() => {
    bubbleRef.current = bubble;
  });
  const [speed, setSpeed] = useState<Speed>(1);
  /** The chosen speed, for a stage mounted later (level change, dev Fast Refresh). */
  const speedRef = useRef<Speed>(1);
  const [stepping, setStepping] = useState(false);
  /** Step mode now, for the next map of a multi-map replay (the child may switch mid-run). */
  const steppingRef = useRef(false);
  useEffect(() => {
    steppingRef.current = stepping;
  });
  const [paused, setPaused] = useState(false);
  const [capacity, setCapacity] = useState<number | null>(level.maxBlocks ?? null);
  // Rewards and progress of this level session (features/play/usePlaySession.ts).
  const profile = useSignedInProfile();
  const {
    ready: sessionReady,
    initialWorkspace,
    recordRun,
    saveCreative,
    saveDraft,
    setWorkspaceFlush,
    wrongPicks,
    recordHintBought,
    snapshot,
  } = usePlaySession(profile.id, level);
  const phaseRef = useRef<Phase>('idle');
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const playHints = usePlayHints({
    profileId: profile.id,
    level,
    feedback,
    session: snapshot().session,
    sessionOpen: () => snapshot().open,
    recordHintBought,
    workspaceRef,
    handleRef,
    rootRef,
    isFirstOfModeInWorld,
    seenModes,
    showTip: setBubbleLine,
    currentText: () => bubbleRef.current.text,
    canTip: () => phaseRef.current !== 'running' && phaseRef.current !== 'success',
  });
  const {
    clearTip,
    runEnded: hintRunEnded,
    entered: hintEntered,
    changed: hintChanged,
    cancelPending: cancelPendingTips,
    closePopover: closeStepPopover,
  } = playHints;
  /** Sound of the replay's last stage event: a `missed` already said `wrong` (audio.md §3). */
  const lastEventSfxRef = useRef<string | null>(null);
  const playFailSfx = useCallback(() => {
    if (lastEventSfxRef.current !== RUN_SFX.fail) audio.playSfx(RUN_SFX.fail);
  }, []);
  useEffect(() => {
    phaseRef.current = phase;
  });
  /** Măng says `line`; any tier-0 hint pointer goes away with the old line. */
  const say = useCallback(
    (line: PlayLine) => {
      clearTip();
      setBubbleLine(line);
    },
    [clearTip],
  );
  const [reward, setReward] = useState<WinReward | null>(null);
  /** Each map's star goal flags of the last win (multi-map levels, P2-21), for the results. */
  const [winMapGoals, setWinMapGoals] = useState<ReadonlyArray<boolean[] | undefined>>();
  /** "Mục tiêu ⭐" (P2-21): shown on entering a level with star goals, and from its button. */
  const starGoals = hasStarGoals(level);
  const [goalsCardOpen, setGoalsCardOpen] = useState(starGoals);
  /** `reward`, readable in callbacks. */
  const rewardRef = useRef<WinReward | null>(null);
  useEffect(() => {
    rewardRef.current = reward;
  });
  /** Mode predict: the cards picked in this session. */
  const [marks, setMarks] = useState<Record<string, PickMark>>({});
  /** Plus the wrong picks of the session a reload left open: still marked and locked. */
  const allMarks = useMemo(
    () => ({
      ...Object.fromEntries(wrongPicks.map((key): [string, PickMark] => [key, 'wrong'])),
      ...marks,
    }),
    [wrongPicks, marks],
  );
  /** Mode bughunt: blocks changed from the level's start, live (editDistance). */
  const [edits, setEdits] = useState(0);
  /** Mode creative: a save in progress. */
  const [saving, setSaving] = useState(false);
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

  /** Cleanup of the ✔/✘ a question block shows while the replay asks it (P2-11). */
  const senseRef = useRef<(() => void) | null>(null);
  const sense = useCallback((mark: SenseMark | null) => {
    senseRef.current?.();
    senseRef.current = null;
    const workspace = workspaceRef.current;
    if (!mark || !workspace) return;
    senseRef.current = markSense(workspace, mark.blockId, mark.value);
    window.__cqPlay?.senses.push(`${mark.blockId}:${mark.value ? 'yes' : 'no'}`);
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
    const feedOf = () => planSources[mapIndexRef.current]?.feed ?? null;
    StageController.mount(container, controller.signal, {
      kind: level.kind,
      config: maps[mapIndexRef.current],
      ...(level.goalSprite !== undefined && { goalSprite: level.goalSprite }),
      theme,
      boss: level.stage === 'boss',
      onHighlight: highlight,
      onSense: sense,
      onAnimation: (animation: PandaAnimation) => {
        container.dataset.panda = animation;
      },
      onWaitingStep: (waiting) => {
        container.dataset.waitingStep = String(waiting);
      },
      // Each event's sound starts with its animation, on the replay's clock (audio.md §3).
      onEvent: (event) => {
        const sfx = stageSfx(event.type);
        lastEventSfxRef.current = sfx;
        audio.playSfx(sfx);
        feedOf()?.event(event);
      },
      onReset: () => feedOf()?.reset(),
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
        say(readyLine);
      },
      () => {
        if (!controller.signal.aborted) setStageFailed(true);
      },
    );
    return () => {
      controller.abort();
      // A mark or highlight left by the replay belongs to this stage's run.
      sense(null);
      highlight(null);
      stageRef.current?.destroy();
      stageRef.current = null;
      setStageReady(false);
    };
  }, [level, maps, planSources, theme, highlight, sense, readyLine, say]);

  /** Puts map `map` on the stage (a fresh scene at its start) and selects its tab. */
  const showMap = useCallback(
    (map: number) => {
      if (map === mapIndexRef.current) return;
      // Set first: showMap resets the scene, and onReset resets the strip of the map shown.
      const previous = mapIndexRef.current;
      mapIndexRef.current = map;
      try {
        stageRef.current?.showMap(maps[map]);
      } catch (error) {
        mapIndexRef.current = previous;
        throw error;
      }
      setMapIndex(map);
    },
    [maps],
  );

  /** Bumped by every run: a reward that resolves after the next run started is not shown. */
  const runTokenRef = useRef(0);

  const finish = useCallback(
    (outcome: RunOutcome, rewardOf: Promise<WinReward | null>) => {
      setStepping(false);
      setPaused(false);
      const text = resultLine(outcome, level, feedback);
      say(
        outcome.result === 'success'
          ? (VOICED_WIN_LINES.find((line) => line.text === text) ?? { text })
          : feedbackPlayLine(outcome.reasonCode ?? 'INTERNAL_ERROR', level, feedback),
      );
      // The run was recorded when it ran (rewards-engine.md §3); only the overlay waits for the
      // end of the replay.
      const token = runTokenRef.current;
      void rewardOf.then((won) => {
        if (won && runTokenRef.current === token) setReward(won);
      });
      // The results overlay or the fail line takes over: a "Xem cả đường" view left open from
      // the run would sit on top of them (P2-22).
      setPlanOpen(false);
      if (outcome.result === 'success') {
        setWinMapGoals(outcome.maps?.map((map) => map.goals));
        setPhase('success');
      } else {
        setPhase('fail');
        const workspace = workspaceRef.current;
        shake(
          outcome.reasonCode === 'EMPTY_CONDITION' && workspace
            ? emptyConditionBlockId(workspace)
            : offendingBlockId(outcome),
        );
        playFailSfx();
        hintRunEnded();
      }
    },
    [level, feedback, shake, say, hintRunEnded, playFailSfx],
  );

  /** Stage back to the start; the program is kept (screens-and-flows.md §4, `R`). */
  const reset = useCallback(() => {
    stageRef.current?.reset();
    cancelPendingTips();
    clearShake();
    setStepping(false);
    setPaused(false);
    setPhase('idle');
    say(readyLine);
  }, [clearShake, readyLine, say, cancelPendingTips]);

  const run = useCallback(
    (step: boolean) => {
      const stage = stageRef.current;
      const handle = handleRef.current;
      if (!stage || !handle || mode === 'predict') return;
      // Chạy, Space or S: the tier-2 popover and any pending tip belong to the old program.
      closeStepPopover();
      cancelPendingTips();
      if (stage.playing) {
        if (step) {
          stage.step();
          setStepping(true);
          setPaused(false);
          say(uiLine('play.stepping', t.stepping));
        } else {
          audio.playSfx('click');
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
        say(feedbackPlayLine('INTERNAL_ERROR', level, feedback));
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
      lastEventSfxRef.current = null;
      // One sound per start, by click, Space or S (the button itself is data-sfx="none").
      audio.playSfx(RUN_SFX.start);
      const rewardOf = recordRun(outcome);
      setPhase('running');
      setStepping(step);
      setPaused(false);
      say(step ? uiLine('play.stepping', t.stepping) : uiLine('play.running', t.running));
      setMapMarks([]);
      // A multi-map level replays map after map and stops on the first map not won, which stays
      // on the stage with its tab selected (P2-12).
      const playMaps = async (): Promise<PlayResult> => {
        for (const [order, replay] of mapReplays(outcome).entries()) {
          if (replay.map !== null) {
            showMap(replay.map);
            if (order > 0) say({ text: t.maps.next(replay.map + 1) });
          }
          // The first map starts in the mode asked for; later ones follow the child's switches.
          const result = await stage.play(replay.outcome, {
            step: order === 0 ? step : steppingRef.current,
          });
          if (result !== 'finished') return result;
          const { map } = replay;
          if (map !== null) {
            const mark: MapMark = replay.outcome.result === 'success' ? 'won' : 'lost';
            setMapMarks((marks) => Object.assign([...marks], { [map]: mark }));
          }
        }
        return 'finished';
      };
      playMaps().then((result) => {
        if (result === 'finished') finish(outcome, rewardOf);
      }, fail);
    },
    [
      level,
      mode,
      feedback,
      finish,
      reset,
      clearShake,
      recordRun,
      say,
      closeStepPopover,
      cancelPendingTips,
      showMap,
    ],
  );

  /** A tab of a multi-map level: shows that map at its start; the marks of the last run stay. */
  const chooseMap = useCallback(
    (map: number) => {
      if (phaseRef.current === 'running') return;
      // A win waits for its results overlay: the tabs stay put until it shows.
      if (phaseRef.current === 'success' && rewardRef.current === null) return;
      if (map === mapIndexRef.current) stageRef.current?.reset();
      else showMap(map);
      cancelPendingTips();
      clearShake();
      setStepping(false);
      setPaused(false);
      setPhase('idle');
    },
    [showMap, cancelPendingTips, clearShake],
  );

  /**
   * Mode predict: the child picks a card. The pick is judged at once (the engine ran the level's
   * program), recorded as the run (stars by pick number, rewards-engine.md §3), then the replay
   * shows what really happens. A wrong card stays marked; a right one opens the results.
   */
  const pick = useCallback(
    (key: string) => {
      const stage = stageRef.current;
      const program = level.initialWorkspace;
      // Before the session is loaded a pick could not be recorded: it would be lost.
      if (!sessionReady || !stage || stage.playing || program === undefined) return;
      let outcome: RunOutcome;
      try {
        outcome = runProgram(level, program);
      } catch {
        say(feedbackPlayLine('INTERNAL_ERROR', level, feedback));
        return;
      }
      const right = key === outcome.answerKey;
      runTokenRef.current += 1;
      const token = runTokenRef.current;
      setReward(null);
      lastEventSfxRef.current = null;
      const rewardOf = recordRun(outcome, key);
      setMarks((current) => ({ ...current, [key]: right ? 'right' : 'wrong' }));
      setPhase('running');
      say(
        right
          ? uiLine('play.predict.right', t.predict.right)
          : feedbackPlayLine('WRONG_ANSWER', level, feedback),
      );
      const won = () => {
        setPlanOpen(false);
        setPhase('success');
        say(uiLine('play.predict.rightDone', t.predict.rightDone));
        void rewardOf.then((result) => {
          if (result && runTokenRef.current === token) setReward(result);
        });
      };
      stage.play(outcome).then(
        (result) => {
          if (result !== 'finished') return;
          if (right) {
            won();
            return;
          }
          setPlanOpen(false);
          setPhase('fail');
          say(uiLine('play.predict.tryAgain', t.predict.tryAgain));
          playFailSfx();
          hintRunEnded();
        },
        () => {
          // The pick was recorded already: a right one still wins even if the replay broke.
          stage.reset();
          if (right) {
            won();
            return;
          }
          setPhase('idle');
          say(feedbackPlayLine('INTERNAL_ERROR', level, feedback));
        },
      );
    },
    [level, feedback, recordRun, sessionReady, say, hintRunEnded, playFailSfx],
  );

  /** Mode creative: "Lưu" stores the program; the first save of the level pays its coins. */
  const save = useCallback(() => {
    const handle = handleRef.current;
    if (!handle || saving) return;
    setSaving(true);
    saveCreative(handle.getState().json).then(
      (coins) => {
        setSaving(false);
        say(
          coins > 0
            ? { text: t.creative.savedCoins(coins) }
            : uiLine('play.creative.saved', t.creative.saved),
        );
      },
      () => {
        setSaving(false);
        say(uiLine('play.creative.saveError', t.creative.saveError));
      },
    );
  }, [saveCreative, saving, say]);

  /** Tạm dừng / Tiếp tục: freezes the replay mid-move, or lets it go on. */
  const togglePause = useCallback(() => {
    const stage = stageRef.current;
    if (!stage?.playing) return;
    if (stage.paused) {
      stage.resume();
      setPaused(false);
      say(stepping ? uiLine('play.stepping', t.stepping) : uiLine('play.running', t.running));
    } else {
      stage.pause();
      setPaused(true);
      say(uiLine('play.paused', t.paused));
    }
  }, [stepping, say]);

  const { available: hintsAvailable, openBox: openHintBox } = playHints;

  // App shortcuts: Space = Chạy/Dừng, S = Từng bước, R = Làm lại, H = Gợi ý
  // (blockly-integration.md §13). Capture phase, so a block clicked with the mouse does not also
  // get Blockly's Space action.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const action =
        event.code === 'Space'
          ? 'run'
          : event.code === 'KeyS'
            ? 'step'
            : event.code === 'KeyR'
              ? 'reset'
              : event.code === 'KeyH'
                ? 'hint'
                : null;
      if (action === null || !shouldHandleAppShortcut(event)) return;
      if (action === 'hint') {
        // Before the session is loaded a purchase could not cap the stars.
        if (!hintsAvailable || !sessionReady) return;
        event.preventDefault();
        event.stopPropagation();
        openHintBox();
        return;
      }
      if (mode === 'predict') return;
      event.preventDefault();
      event.stopPropagation();
      if (action === 'reset') {
        reset();
        return;
      }
      run(action === 'step');
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true });
    };
  }, [run, reset, mode, hintsAvailable, sessionReady, openHintBox]);

  const onReady = useCallback(
    (workspace: Blockly.WorkspaceSvg, handle: WorkspaceHandle) => {
      workspaceRef.current = workspace;
      handleRef.current = handle;
      lastProgramRef.current = programKey(handle.getState().json);
      setWorkspaceReady(true);
      setWorkspaceFlush(() => {
        handle.flush();
      });
      if (import.meta.env.DEV) {
        let answerKey: string | undefined;
        if (level.mode === 'predict' && level.initialWorkspace !== undefined) {
          answerKey = runProgram(level, level.initialWorkspace).answerKey;
        }
        window.__cqPlay = { Blockly, workspace, highlights: [], senses: [], answerKey };
      }
    },
    [setWorkspaceFlush, level],
  );

  const onDispose = useCallback(() => {
    workspaceRef.current = null;
    handleRef.current = null;
    setWorkspaceReady(false);
    setWorkspaceFlush(null);
    delete window.__cqPlay;
  }, [setWorkspaceFlush]);

  // Tier-0 "enter" hint: once, when both the stage and the workspace are up (hint-engine.md §5),
  // and the "Mục tiêu ⭐" card shown on entry is closed (its pointer would sit under the card).
  const enteredRef = useRef(false);
  useEffect(() => {
    if (!stageReady || !workspaceReady || enteredRef.current) return;
    if (goalsCardOpen) return;
    enteredRef.current = true;
    hintEntered();
  }, [stageReady, workspaceReady, hintEntered, goalsCardOpen]);

  // Closing the "Mục tiêu ⭐" card: the Dialog gives focus back to where it was (the star
  // button) as it unmounts, so Space would reopen the card. This runs after that cleanup and
  // puts focus on the stage, where Space runs the program.
  const goalsCardWasOpenRef = useRef(goalsCardOpen);
  useEffect(() => {
    if (goalsCardWasOpenRef.current && !goalsCardOpen) stageBoxRef.current?.focus();
    goalsCardWasOpenRef.current = goalsCardOpen;
  }, [goalsCardOpen]);

  const onChange = useCallback(
    (state: WorkspaceState) => {
      // A workspace being torn down reports once more, tagged with its own level.
      if (state.levelId !== level.id) return;
      setCapacity(state.remainingCapacity);
      if (mode === 'predict') return; // read-only: nothing to save or compare
      if (mode === 'bughunt' && level.initialWorkspace !== undefined) {
        setEdits(editDistance(level.initialWorkspace, state.json));
      }
      saveDraft(state.json);
      const key = programKey(state.json);
      // Editing the program makes the replay on screen stale: put the stage back (before the
      // `change` tip is scheduled, as a reset cancels pending tips).
      if (key !== ranJsonRef.current) {
        if (phase !== 'idle') reset();
        // The map marks belong to the program that ran (multi-map levels).
        setMapMarks((marks) => (marks.length === 0 ? marks : []));
      }
      if (key !== lastProgramRef.current) {
        lastProgramRef.current = key;
        hintChanged();
      }
    },
    [level.id, level.initialWorkspace, mode, phase, reset, saveDraft, hintChanged],
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

  /**
   * Măng idle: dragging the full-track strip moves the stage's view there (P2-22). The next
   * reset or run gives the camera back to Măng (StageController.peek, the feed's reset).
   */
  const peekStage = useCallback(
    (look: number) => {
      const stage = stageRef.current;
      if (!stage || stage.playing) return;
      stage.peek(look);
      trackFeed?.peek(look);
    },
    [trackFeed],
  );
  const planLabel = level.kind === 'maze' ? t.plan.openMaze : t.plan.open;
  const planButton = planSource && (
    <button
      type="button"
      aria-label={planLabel}
      title={planLabel}
      data-testid="plan-open"
      onClick={() => {
        setPlanOpen(true);
      }}
      className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-key border-2 border-ink bg-paper shadow-key transition-transform duration-150 hover:-translate-y-px active:translate-y-0.5 active:shadow-button-pressed focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
    >
      <PixelIcon name="magnifier" scale={2} />
    </button>
  );

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
    <main
      ref={rootRef}
      className="cq-play grid h-dvh min-h-[500px] grid-rows-[56px_minmax(0,1fr)_64px] gap-2 bg-ground px-3 pt-2 pb-2"
    >
      <PlayTopBar
        profileId={profile.id}
        levelId={level.id}
        levelTitle={level.title}
        where={t.where(world.title, levelNumber)}
        worldId={world.id}
        showStars={mode !== 'creative'}
        readProgram={() => handleRef.current?.getState().json ?? null}
      />

      <div className="grid min-h-0 grid-cols-[minmax(0,42fr)_minmax(0,58fr)] gap-3">
        <Panel className="flex min-h-0 flex-col overflow-hidden">
          {maps.length > 1 && (
            <MapTabs
              count={maps.length}
              selected={mapIndex}
              marks={mapMarks}
              disabled={running || !stageReady || (phase === 'success' && reward === null)}
              status={mapStatus(mapMarks, maps.length)}
              onSelect={(map) => {
                chooseMap(map);
                focusStage();
              }}
            />
          )}
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
              data-map={mapIndex + 1}
              data-goal-sprite={level.goalSprite ?? 'flag'}
              data-theme={theme}
              data-hint-anchor="stage"
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
            {/* No strip (a maze, a track that fits): the "Xem cả đường" button sits on the stage. */}
            {planButton && !(trackFeed && stripShown) && (
              <div className="absolute top-2 right-2 z-10">{planButton}</div>
            )}
          </div>
          {trackFeed && (
            <TrackStrip
              feed={trackFeed}
              {...(level.goalSprite !== undefined && { goalSprite: level.goalSprite })}
              theme={theme}
              action={planButton}
              onShownChange={setStripShown}
              {...(stageReady && !running && { onPeek: peekStage })}
            />
          )}

          <div className="border-b-3 border-ink bg-paper-2 px-4 py-1.5">
            {/* Story line (P2-11c) above the task: why Măng goes, then what to do. */}
            {level.mission !== undefined && (
              <p
                data-testid="play-mission"
                className="m-0 flex items-center gap-2 text-small font-bold text-ink-soft"
              >
                <span className="shrink-0 rounded-kbd bg-brand px-2 pt-0.5 font-pixel text-pixel-sm font-normal whitespace-nowrap text-paper uppercase">
                  {t.missionLabel}
                </span>
                {level.mission}
                <SpeakButton voiceId={levelVoiceId(level.id, 'mission')} className="ml-auto" />
              </p>
            )}
            <p
              data-testid="play-objective"
              className="m-0 flex min-h-8 items-center gap-2 font-bold"
            >
              <span className="shrink-0 rounded-kbd bg-brand-deep px-2 pt-0.5 font-pixel text-pixel-sm font-normal whitespace-nowrap text-paper uppercase">
                {t.objectiveLabel}
              </span>
              {level.objective}
              <span className="ml-auto flex shrink-0 items-center gap-2">
                {/* Renders only once the line has a voice file (audio.md §3). */}
                <SpeakButton voiceId={levelVoiceId(level.id, 'objective')} />
                {starGoals && (
                  <button
                    type="button"
                    aria-label={t.starGoals.open}
                    title={t.starGoals.open}
                    aria-haspopup="dialog"
                    data-testid="star-goals-open"
                    onClick={() => {
                      setGoalsCardOpen(true);
                    }}
                    className="flex min-h-9 shrink-0 cursor-pointer items-center gap-0.5 rounded-key border-2 border-ink bg-coin-shine px-2 shadow-key transition-transform duration-150 hover:-translate-y-px active:translate-y-0.5 active:shadow-button-pressed focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
                  >
                    <PixelIcon name="star" scale={1} />
                    <PixelIcon name="star" scale={1} />
                    <PixelIcon name="star" scale={1} />
                  </button>
                )}
              </span>
            </p>
          </div>

          {/* Mode predict has no run controls: the answer cards sit under the program. */}
          {predict ? null : (
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
                data-hint-anchor="run"
                // run() plays the sound (`run` to start, a click to stop), the same for Space: the
                // delegated click sound would read data-sfx after React re-rendered the button.
                data-sfx="none"
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
                data-testid="play-step"
                data-hint-anchor="step"
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
          )}
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
              onBlockLimit={(breach) => {
                const depth = level.maxLoopDepth ?? 1;
                say(
                  breach === 'instances'
                    ? uiLine('play.blockLimit.instances', t.blockLimit.instances)
                    : depth <= 1
                      ? uiLine('play.blockLimit.loopDepth', t.blockLimit.loopDepth)
                      : { text: t.blockLimit.loopDepthMax(depth) },
                );
              }}
              className="min-h-0 rounded-t-[15px]"
            />
          ) : (
            <div className="min-h-0 rounded-t-[15px] bg-paper" />
          )}
          {predict && (
            <div className="border-t-3 border-ink bg-paper-2">
              <PredictCards
                kind={level.kind}
                config={level.config}
                {...(level.goalSprite !== undefined && { goalSprite: level.goalSprite })}
                theme={theme}
                options={predict.options}
                marks={allMarks}
                disabled={
                  !sessionReady || !stageReady || phase === 'running' || phase === 'success'
                }
                onPick={pick}
              />
            </div>
          )}
          {((level.maxBlocks !== undefined && capacity !== null) || hintsAvailable) && (
            <div className="flex min-h-14 items-center gap-3 border-t-3 border-ink bg-paper px-4 py-2">
              {level.maxBlocks !== undefined && capacity !== null && (
                <div data-hint-anchor="capacity" className="rounded-key">
                  <CapacityBricks max={level.maxBlocks} used={level.maxBlocks - capacity} />
                </div>
              )}
              {hintsAvailable && (
                <Button
                  variant="hint"
                  size="sm"
                  icon={<PixelIcon name="bulb" scale={1} />}
                  shortcut="H"
                  className="ml-auto"
                  aria-haspopup="dialog"
                  disabled={!sessionReady}
                  data-testid="play-hint"
                  onClick={openHintBox}
                >
                  {vi.hints.open}
                </Button>
              )}
            </div>
          )}
          {mode === 'bughunt' && (
            <BughuntBar edits={edits} parEdits={level.parEdits ?? DEFAULT_PAR_EDITS} />
          )}
          {mode === 'creative' && (
            <div className="flex min-h-14 items-center gap-3 border-t-3 border-ink bg-paper px-4 py-2">
              <span className="font-bold text-ink-soft">{t.creative.label}</span>
              <Button
                variant="coin"
                size="sm"
                className="ml-auto"
                disabled={!sessionReady || saving}
                data-testid="play-save"
                onClick={() => {
                  save();
                  focusStage();
                }}
              >
                {saving ? t.creative.saving : t.creative.save}
              </Button>
            </div>
          )}
        </Panel>
      </div>

      <footer className="flex min-w-0 items-center gap-4 px-2">
        <MangPortrait pose={PORTRAIT[phase]} height={56} />
        <span className="sr-only">{t.mangSays}:</span>
        <div data-testid="play-bubble" className="min-w-0">
          <Bubble
            text={bubble.text}
            live
            className="max-w-[820px]"
            {...(bubble.voiceId !== undefined && { voiceId: bubble.voiceId })}
          />
        </div>
      </footer>
      {playHints.boxOpen && (
        <HintBox
          tiers={playHints.hints.tiers}
          balance={playHints.hints.balance}
          busy={playHints.hints.busy}
          thinkingHint={playHints.thinkingShown ? (level.thinkingHint ?? null) : null}
          thinkingVoiceId={levelVoiceId(level.id, 'thinking')}
          notice={playHints.notice}
          onBuy={playHints.buy}
          onClose={playHints.closeBox}
        />
      )}
      {planOpen && planSource && (
        <PlanView
          source={planSource}
          mapNumber={maps.length > 1 ? mapIndex + 1 : null}
          marks={planMarks[mapIndex] ?? []}
          onMarks={(next) => {
            setPlanMarks((current) => {
              const copy = [...current];
              copy[mapIndex] = next;
              return copy;
            });
          }}
          onClose={() => {
            setPlanOpen(false);
          }}
        />
      )}
      {playHints.solutionOpen && level.solution !== undefined && (
        <SolutionViewer solution={level.solution} onClose={playHints.closeSolution} />
      )}
      {goalsCardOpen && (
        <StarGoalsCard
          level={level}
          onClose={() => {
            setGoalsCardOpen(false);
          }}
        />
      )}
      {reward !== null && phase === 'success' && (
        <ResultsOverlay
          profileId={profile.id}
          level={level}
          world={world}
          reward={reward}
          {...(winMapGoals !== undefined && { mapGoals: winMapGoals })}
          onReplay={() => {
            setReward(null);
            // Playing again: the right card can be picked again, wrong ones stay locked.
            setMarks((current) =>
              Object.fromEntries(Object.entries(current).filter(([, mark]) => mark === 'wrong')),
            );
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

/** Mode bughunt (screens-and-flows.md §3): "Săn lỗi" and the live "đã sửa N khối" counter. */
function BughuntBar({ edits, parEdits }: { edits: number; parEdits: number }) {
  const over = edits > parEdits;
  return (
    <div className="flex min-h-14 items-center gap-3 border-t-3 border-ink bg-paper px-4 py-2">
      <span className="font-bold">{t.bughunt.label}</span>
      <span
        data-testid="bughunt-edits"
        data-edits={edits}
        data-over={over}
        aria-live="polite"
        className={`ml-auto rounded-chip border-3 border-ink px-3 pt-0.5 font-pixel text-pixel ${over ? 'bg-oops-soft' : 'bg-go/25'}`}
      >
        {t.bughunt.edits(edits)}
      </span>
      <span className="font-pixel text-pixel text-ink-soft">{t.bughunt.par(parEdits)}</span>
    </div>
  );
}

/** The line next to the map tabs: the last run's verdict, else what the level asks. */
function mapStatus(marks: ReadonlyArray<MapMark | undefined>, count: number): string {
  const lost = marks.indexOf('lost');
  if (lost !== -1) return t.maps.lostOn(lost + 1);
  if (marks.filter((mark) => mark === 'won').length === count) return t.maps.allWon(count);
  return t.maps.intro(count);
}
