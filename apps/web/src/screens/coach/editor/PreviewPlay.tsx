import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import type { FeedbackFile, Level } from '@codequest/content-schema';
import type { RunOutcome } from '@codequest/engine';
import {
  BlocklyWorkspace,
  loadInitialWorkspace,
  type WorkspaceHandle,
} from '../../../blockly/BlocklyWorkspace';
import { loadFeedback } from '../../../features/content/files';
import { resultLine, runProgram } from '../../../features/play/run';
import { vi } from '../../../i18n/vi';
import { StageController } from '../../../stages/StageController';
import { Button, PixelIcon } from '../../../ui';

const t = vi.editor.preview;

type Status = 'loading' | 'ready' | 'failed';

/** Test hook (dev build only): the Thử chơi workspace, to assemble a program like a child. */
declare global {
  interface Window {
    __cqEditorPreview?: { Blockly: typeof Blockly; workspace: Blockly.WorkspaceSvg };
  }
}

/**
 * Thử chơi: the real stage and a workspace set up like the play screen's (mode, toolbox,
 * maxBlocks, start program), without profile, rewards or hints. Remounted (new key) when the
 * draft changes.
 */
export function PreviewPlay({ level }: { level: Level }) {
  const stageBoxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<StageController | null>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const handleRef = useRef<WorkspaceHandle | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [feedback, setFeedback] = useState<FeedbackFile | null>(null);
  const [result, setResult] = useState<{ outcome: RunOutcome; line: string } | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadFeedback().then(
      (file) => {
        if (!cancelled) setFeedback(file);
      },
      () => {
        if (!cancelled) setFeedback({});
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const highlight = useCallback((blockId: string | null) => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    if (blockId !== null && !workspace.getBlockById(blockId)) return;
    workspace.highlightBlock(blockId);
  }, []);

  // The stage only depends on the kind and the map: other edits do not reload it.
  const { kind } = level;
  const configKey = JSON.stringify(level.config);
  const config = useMemo(() => JSON.parse(configKey) as unknown, [configKey]);

  // The stage is an imperative island (coding-standards.md §4), as on the play screen.
  useEffect(() => {
    const container = stageBoxRef.current;
    if (!container) return;
    const controller = new AbortController();
    StageController.mount(container, controller.signal, {
      kind,
      config,
      onHighlight: highlight,
      onAnimation: (animation) => {
        container.dataset.panda = animation;
      },
    }).then(
      (stage) => {
        if (controller.signal.aborted) {
          stage?.destroy();
          return;
        }
        if (!stage) return;
        stageRef.current = stage;
        setStatus('ready');
      },
      () => {
        if (!controller.signal.aborted) setStatus('failed');
      },
    );
    return () => {
      controller.abort();
      stageRef.current?.destroy();
      stageRef.current = null;
    };
  }, [kind, config, highlight]);

  const reset = () => {
    stageRef.current?.reset();
    setRunning(false);
    setResult(null);
  };

  const run = () => {
    const stage = stageRef.current;
    const handle = handleRef.current;
    if (!stage || !handle) return;
    let outcome: RunOutcome;
    try {
      outcome = runProgram(level, handle.getState().json);
    } catch {
      return;
    }
    setResult(null);
    setRunning(true);
    void stage.play(outcome).then((played) => {
      setRunning(false);
      if (played === 'finished') {
        setResult({ outcome, line: resultLine(outcome, level, feedback ?? {}) });
      }
    });
  };

  const loadSolution = () => {
    const workspace = workspaceRef.current;
    if (!workspace || level.solution === undefined) return;
    reset();
    loadInitialWorkspace(workspace, { ...level, initialWorkspace: level.solution });
  };

  return (
    <div className="grid gap-3" data-testid="editor-preview">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <div
          ref={stageBoxRef}
          aria-label={t.stageLabel}
          data-testid="editor-preview-stage"
          data-ready={status === 'ready'}
          className="relative h-[320px] overflow-hidden rounded-key border-3 border-ink bg-sky"
        >
          {status !== 'ready' && (
            <p className="absolute inset-0 m-0 grid place-items-center p-4 text-center text-ink-soft">
              {status === 'failed' ? t.failed : t.loading}
            </p>
          )}
        </div>
        <div className="h-[320px] overflow-hidden rounded-key border-3 border-ink">
          <BlocklyWorkspace
            level={level}
            onReady={(workspace, handle) => {
              workspaceRef.current = workspace;
              handleRef.current = handle;
              if (import.meta.env.DEV) window.__cqEditorPreview = { Blockly, workspace };
            }}
            onDispose={() => {
              workspaceRef.current = null;
              handleRef.current = null;
              delete window.__cqEditorPreview;
            }}
            className="h-full"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="go"
          size="md"
          icon={<PixelIcon name="play" scale={1} />}
          disabled={status !== 'ready' || running}
          data-testid="preview-run"
          onClick={run}
        >
          {t.run}
        </Button>
        <Button size="sm" icon="↺" onClick={reset}>
          {t.reset}
        </Button>
        {level.solution !== undefined && level.mode !== 'predict' && (
          <Button size="sm" onClick={loadSolution} data-testid="preview-use-solution">
            {t.useSolution}
          </Button>
        )}
        <p
          className="m-0 font-bold"
          data-testid="preview-result"
          data-result={result?.outcome.result ?? ''}
          aria-live="polite"
        >
          {result === null
            ? ''
            : `${result.outcome.result === 'success' ? t.won : t.lost} · ${result.line}${
                result.outcome.answerKey === undefined
                  ? ''
                  : ` · ${t.answerKey(result.outcome.answerKey)}`
              }`}
        </p>
      </div>
    </div>
  );
}
