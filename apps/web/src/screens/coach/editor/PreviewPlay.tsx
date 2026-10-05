import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import { type FeedbackFile, type Level, sceneThemeOf } from '@codequest/content-schema';
import type { RunOutcome } from '@codequest/engine';
import {
  BlocklyWorkspace,
  loadInitialWorkspace,
  type WorkspaceHandle,
} from '../../../blockly/BlocklyWorkspace';
import { useCatalog } from '../../../features/content/catalog';
import { loadFeedback } from '../../../features/content/files';
import { mapReplays, mapsOf, resultLine, runProgram } from '../../../features/play/run';
import { vi } from '../../../i18n/vi';
import { type PlayResult, StageController } from '../../../stages/StageController';
import { type MapMark, MapTabs } from '../../play/MapTabs';
import { Button, PixelIcon } from '../../../ui';

const t = vi.editor.preview;

/** Program JSON without block positions: moving a block is not an edit. */
function programKey(json: unknown): string {
  return JSON.stringify(json, (key, value: unknown) =>
    key === 'x' || key === 'y' ? undefined : value,
  );
}
const tMaps = vi.play.maps;

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

  // The stage only depends on the kind, the maps and the goal picture: other edits do not reload it.
  const { kind, goalSprite } = level;
  // The world's scenery (P2-23): the stage mounts once the catalog is read (or failed to load:
  // then Làng Tre), so it is never rebuilt just because the theme arrived.
  const catalog = useCatalog();
  const catalogLoading = catalog.status === 'loading';
  const theme = sceneThemeOf(
    catalog.status === 'ready' ? catalog.catalog.worldById.get(level.worldId) : undefined,
  );
  const boss = level.stage === 'boss';
  const mapsKey = JSON.stringify(mapsOf(level));
  const maps = useMemo(() => JSON.parse(mapsKey) as unknown[], [mapsKey]);
  // Multi-map levels (P2-12): the map on the stage, as on the play screen.
  const [mapIndex, setMapIndex] = useState(0);
  const mapIndexRef = useRef(0);
  const [mapMarks, setMapMarks] = useState<ReadonlyArray<MapMark | undefined>>([]);
  /** The program of the last run, to tell an edit from a re-report of the same program. */
  const ranKeyRef = useRef<string | null>(null);

  // The stage is an imperative island (coding-standards.md §4), as on the play screen.
  useEffect(() => {
    const container = stageBoxRef.current;
    if (!container || catalogLoading) return;
    const controller = new AbortController();
    // A new stage: no result or marks of the old one.
    setStatus('loading');
    setResult(null);
    // Maps changed: stay on the same map when it still exists.
    const map = Math.min(mapIndexRef.current, maps.length - 1);
    mapIndexRef.current = map;
    setMapIndex(map);
    setMapMarks([]);
    StageController.mount(container, controller.signal, {
      kind,
      config: maps[map],
      ...(goalSprite !== undefined && { goalSprite }),
      theme,
      boss,
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
  }, [kind, maps, goalSprite, theme, boss, catalogLoading, highlight]);

  const showMap = (map: number) => {
    if (map === mapIndexRef.current) return;
    stageRef.current?.showMap(maps[map]);
    mapIndexRef.current = map;
    setMapIndex(map);
  };

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
    const { json } = handle.getState();
    ranKeyRef.current = programKey(json);
    try {
      outcome = runProgram(level, json);
    } catch {
      return;
    }
    setResult(null);
    setRunning(true);
    setMapMarks([]);
    const playMaps = async (): Promise<PlayResult> => {
      for (const replay of mapReplays(outcome)) {
        const { map } = replay;
        if (map !== null) showMap(map);
        const played = await stage.play(replay.outcome);
        if (played !== 'finished') return played;
        if (map !== null) {
          const mark: MapMark = replay.outcome.result === 'success' ? 'won' : 'lost';
          setMapMarks((marks) => Object.assign([...marks], { [map]: mark }));
        }
      }
      return 'finished';
    };
    void playMaps().then(
      (played) => {
        setRunning(false);
        if (played === 'finished') {
          setResult({ outcome, line: resultLine(outcome, level, feedback ?? {}) });
        }
      },
      () => {
        setRunning(false);
      },
    );
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
        <div className="grid content-start overflow-hidden rounded-key border-3 border-ink">
          {maps.length > 1 && (
            <MapTabs
              count={maps.length}
              selected={mapIndex}
              marks={mapMarks}
              disabled={running || status !== 'ready'}
              status={tMaps.intro(maps.length)}
              onSelect={(map) => {
                reset();
                showMap(map);
              }}
            />
          )}
          <div
            ref={stageBoxRef}
            aria-label={t.stageLabel}
            data-testid="editor-preview-stage"
            data-ready={status === 'ready'}
            data-map={mapIndex + 1}
            className="relative h-[320px] overflow-hidden bg-sky"
          >
            {status !== 'ready' && (
              <p className="absolute inset-0 m-0 grid place-items-center p-4 text-center text-ink-soft">
                {status === 'failed' ? t.failed : t.loading}
              </p>
            )}
          </div>
        </div>
        <div className="h-[320px] overflow-hidden rounded-key border-3 border-ink">
          <BlocklyWorkspace
            level={level}
            onChange={(state) => {
              // The ✔ / ✖ of the map tabs belong to the program that ran.
              if (programKey(state.json) !== ranKeyRef.current) {
                setMapMarks((marks) => (marks.length === 0 ? marks : []));
              }
            }}
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
            : `${result.outcome.result === 'success' ? t.won : t.lost}${
                result.outcome.mapIndex === undefined || result.outcome.result === 'success'
                  ? ''
                  : ` (${tMaps.tab(result.outcome.mapIndex + 1)})`
              } · ${result.line}${
                result.outcome.answerKey === undefined
                  ? ''
                  : ` · ${t.answerKey(result.outcome.answerKey)}`
              }`}
        </p>
      </div>
    </div>
  );
}
