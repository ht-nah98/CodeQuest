import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WorkspaceSvg } from 'blockly';
import type { Level, LessonCard } from '@codequest/content-schema';
import { getGameKind } from '@codequest/games';
import { BlocklyWorkspace } from '../../blockly/BlocklyWorkspace';
import { markSense } from '../../blockly/senseMark';
import { runProgram } from '../../features/play/run';
import { vi } from '../../i18n/vi';
import { getStageKind } from '../../stages/registry';
import { type SenseMark, StageController } from '../../stages/StageController';
import { Button, PixelIcon } from '../../ui';

const t = vi.lesson;

type DemoCard = Extract<LessonCard, { type: 'demo' }>;

/**
 * A lesson's runnable example (screens-and-flows.md "Bài giảng"): the program in a read-only
 * workspace next to a small stage. Kinds without a stage renderer show the program alone.
 */
export function LessonDemo({ card, id, worldId }: { card: DemoCard; id: string; worldId: string }) {
  const stageBoxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<StageController | null>(null);
  const workspaceRef = useRef<WorkspaceSvg | null>(null);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  /** The result of the last run (e2e reads it as data-result, e.g. a TIMEOUT demo). */
  const [lastResult, setLastResult] = useState<string | null>(null);

  // A demo is a tiny level built from the card, so the engine and stage run it unchanged.
  const level = useMemo<Level>(
    () => ({
      id,
      worldId,
      stage: 'guided',
      kind: card.kind,
      mode: 'predict',
      title: id,
      objective: card.text,
      learningGoal: card.text,
      toolbox: [],
      config: card.config,
      initialWorkspace: card.workspace,
      hints: [],
    }),
    [card, id, worldId],
  );
  // Only kinds with both a simulation and a renderer can be played; others show the program.
  const playable = useMemo(() => {
    const kind = getGameKind(card.kind);
    return (
      kind !== undefined &&
      getStageKind(card.kind) !== undefined &&
      kind.configSchema.safeParse(card.config).success
    );
  }, [card]);

  const highlight = useCallback((blockId: string | null) => {
    const workspace = workspaceRef.current;
    if (!workspace || (blockId !== null && !workspace.getBlockById(blockId))) return;
    workspace.highlightBlock(blockId);
  }, []);

  /** The ✔/✘ a question block shows while the demo asks it (P2-11). */
  const senseRef = useRef<(() => void) | null>(null);
  const sense = useCallback((mark: SenseMark | null) => {
    senseRef.current?.();
    senseRef.current = null;
    const workspace = workspaceRef.current;
    if (mark && workspace) senseRef.current = markSense(workspace, mark.blockId, mark.value);
  }, []);

  const run = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let outcome;
    try {
      outcome = runProgram(level, card.workspace);
    } catch {
      return;
    }
    setPhase('running');
    setLastResult(outcome.result);
    stage.play(outcome).then(
      (result) => {
        if (result === 'finished') setPhase('done');
      },
      () => {
        setPhase('idle');
      },
    );
  }, [level, card.workspace]);

  useEffect(() => {
    const container = stageBoxRef.current;
    if (!container || !playable) return;
    const controller = new AbortController();
    StageController.mount(container, controller.signal, {
      kind: card.kind,
      config: card.config,
      onHighlight: highlight,
      onSense: sense,
      onAnimation: (animation) => {
        container.dataset.panda = animation;
      },
    }).then(
      (stage) => {
        if (controller.signal.aborted || !stage) {
          stage?.destroy();
          return;
        }
        stageRef.current = stage;
        setReady(true);
        if (card.autoplay === true) run();
      },
      () => undefined,
    );
    return () => {
      controller.abort();
      stageRef.current?.destroy();
      stageRef.current = null;
      setReady(false);
    };
  }, [playable, card.kind, card.config, card.autoplay, highlight, sense, run]);

  return (
    <div
      className="cq-play grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4"
      data-testid="lesson-demo"
    >
      <div className="h-[260px] overflow-hidden rounded-chip border-3 border-ink">
        <BlocklyWorkspace
          key={id}
          level={level}
          onReady={(workspace) => {
            workspaceRef.current = workspace;
          }}
          onDispose={() => {
            workspaceRef.current = null;
          }}
          className="h-full"
        />
      </div>
      {playable && (
        <div className="grid grid-rows-[minmax(0,1fr)_auto] gap-3">
          <div
            ref={stageBoxRef}
            role="img"
            aria-label={t.demoStage}
            data-ready={ready}
            data-phase={phase}
            data-result={lastResult ?? undefined}
            className="relative h-[196px] overflow-hidden rounded-chip border-3 border-ink bg-sky"
          />
          <Button
            variant="go"
            size="md"
            icon={<PixelIcon name="play" scale={1} />}
            disabled={!ready || phase === 'running'}
            onClick={run}
            data-testid="lesson-demo-run"
            className="justify-self-start"
          >
            {phase === 'done' ? t.demoAgain : t.demoRun}
          </Button>
        </div>
      )}
    </div>
  );
}
