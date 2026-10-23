import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { common, Events, inject, serialization, svgResize, type WorkspaceSvg } from 'blockly';
import {
  parseArduino,
  type ParseProblem,
  registerLeanbotFlyouts,
  toArduino,
} from '@codequest/games';
import '../../blockly/blockly.css';
import { loadBlocklyFonts, setupBlockly } from '../../blockly/setup';
import { codequestTheme } from '../../blockly/theme';
import {
  LEANBOT_IDE_URL,
  setupWorkshopBlocks,
  workshopToolbox,
} from '../../features/workshop/workshopToolbox';
import { useSignedInProfile } from '../../features/profiles';
import { vi } from '../../i18n/vi';
import { Button, Panel, UI_COLORS } from '../../ui';
import { TopBar } from '../shared/TopBar';

const t = vi.workshop;

/**
 * What the code panel shows: the code of the blocks, or the code the child pasted, kept with
 * its own line numbers so the red lines point at what the child wrote.
 */
type CodeView =
  | { source: 'blocks'; code: string; lineOf: ReadonlyMap<string, number> }
  | {
      source: 'pasted';
      code: string;
      lineOf: ReadonlyMap<string, number>;
      problems: readonly ParseProblem[];
      built: number;
    };

const EMPTY: CodeView = { source: 'blocks', code: '', lineOf: new Map() };

/** Width of the blocks column, in % of the row; the coach drags the bar between the columns. */
const SPLIT_KEY = 'cq.workshop.split';
const SPLIT_MIN = 30;
const SPLIT_MAX = 80;
const clampSplit = (n: number) => Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, Math.round(n)));

function readSplit(): number {
  try {
    const saved = Number(localStorage.getItem(SPLIT_KEY));
    return saved ? clampSplit(saved) : 60;
  } catch {
    return 60;
  }
}

function saveSplit(n: number): void {
  try {
    localStorage.setItem(SPLIT_KEY, String(n));
  } catch {
    // Storage can be blocked; the split still works for this visit.
  }
}

/** The block whose code starts on `line` (0-based), or the last one starting before it. */
function blockAtLine(lineOf: ReadonlyMap<string, number>, line: number): string | null {
  let best: string | null = null;
  let bestLine = -1;
  for (const [id, at] of lineOf) {
    if (at <= line && at > bestLine) {
      best = id;
      bestLine = at;
    }
  }
  return best;
}

/** "/xuong-phien-dich" Màn 0 of the Leanbot world: Vietnamese blocks ↔ Leanbot's Arduino code. */
export default function WorkshopScreen() {
  const profile = useSignedInProfile();
  // Unfinished, so only the coach sees it (AGENTS.md §9.10).
  if (profile.role !== 'coach') return <Navigate to="/hub" replace />;
  return <Workshop />;
}

function Workshop() {
  const host = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(readSplit);
  const workspaceRef = useRef<WorkspaceSvg | null>(null);
  const [view, setView] = useState<CodeView>(EMPTY);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let disposed = false;
    let workspace: WorkspaceSvg | null = null;
    void loadBlocklyFonts().then(() => {
      if (disposed) return;
      setupBlockly();
      setupWorkshopBlocks();
      workspace = inject(container, {
        renderer: 'zelos',
        theme: codequestTheme,
        media: '/blockly-media/',
        toolbox: workshopToolbox(),
        trashcan: true,
        sounds: false,
        move: { scrollbars: true, drag: true, wheel: true },
        zoom: { controls: true, wheel: false, startScale: 0.9, minScale: 0.5, maxScale: 1.6 },
        grid: { spacing: 24, length: 2, colour: UI_COLORS.brandSoft, snap: true },
      });
      registerLeanbotFlyouts(workspace);
      workspaceRef.current = workspace;
      const ws = workspace;
      ws.addChangeListener((event: Events.Abstract) => {
        if (event instanceof Events.Selected) {
          setSelected(event.newElementId ?? null);
          return;
        }
        if (event.isUiEvent) return;
        const program = toArduino(ws);
        setView({ source: 'blocks', code: program.code, lineOf: program.lineOf });
      });
      const program = toArduino(ws);
      setView({ source: 'blocks', code: program.code, lineOf: program.lineOf });
    });
    // Blockly only follows window resizes; the column also changes width when the bar is dragged.
    const resize = new ResizeObserver(() => {
      if (workspace) svgResize(workspace);
    });
    resize.observe(container);
    return () => {
      resize.disconnect();
      disposed = true;
      workspace?.dispose();
      workspaceRef.current = null;
    };
  }, []);

  const lines = view.code.split('\n');
  const highlighted = selected !== null ? view.lineOf.get(selected) : undefined;
  const problemLines = new Map(
    view.source === 'pasted' ? view.problems.map((p) => [p.line - 1, p]) : [],
  );

  const selectLine = (line: number) => {
    const ws = workspaceRef.current;
    const id = blockAtLine(view.lineOf, line);
    const block = id !== null ? ws?.getBlockById(id) : null;
    if (!ws || !block) return;
    common.setSelected(block);
    ws.centerOnBlock(block.id);
  };

  const build = () => {
    const ws = workspaceRef.current;
    if (!ws || draft === null) return;
    const result = parseArduino(draft);
    // Loading fires change events; the panel must keep the pasted code, not the regenerated one.
    Events.disable();
    try {
      ws.clear();
      serialization.workspaces.load(result.workspace, ws);
    } finally {
      Events.enable();
    }
    const lineOf = new Map(Object.entries(result.lineOf).map(([id, line]) => [id, line - 1]));
    setView({
      source: 'pasted',
      code: draft,
      lineOf,
      problems: result.problems,
      built: ws.getAllBlocks(false).filter((block) => !block.isShadow()).length,
    });
    setDraft(null);
  };

  const copy = () => {
    void navigator.clipboard
      .writeText(view.code)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => {
          setCopied(false);
        }, 1500);
      })
      .catch(() => {
        // Clipboard blocked: the child can still select the code by hand.
      });
  };

  return (
    <main className="flex h-dvh flex-col gap-3 bg-ground p-3">
      <TopBar back={{ label: vi.hub.title, to: '/hub' }}>
        <h1 className="m-0 truncate font-display text-[28px] text-paper">{t.title}</h1>
      </TopBar>

      <p className="m-0 font-bold">{t.intro}</p>

      <div
        ref={row}
        className="grid min-h-0 flex-1"
        style={{ gridTemplateColumns: `minmax(0, ${String(split)}%) 14px minmax(0, 1fr)` }}
      >
        <Panel className="relative min-h-0 overflow-hidden" raised={false}>
          <div ref={host} className="absolute inset-0" data-testid="workshop-blocks" />
        </Panel>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t.resize}
          aria-valuemin={SPLIT_MIN}
          aria-valuemax={SPLIT_MAX}
          aria-valuenow={split}
          tabIndex={0}
          data-testid="workshop-split"
          className="group flex cursor-col-resize touch-none items-center justify-center outline-none"
          onPointerDown={(e) => {
            const box = row.current?.getBoundingClientRect();
            if (!box) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            let last = split;
            const move = (ev: PointerEvent) => {
              last = clampSplit(((ev.clientX - box.left) / box.width) * 100);
              setSplit(last);
            };
            const up = (ev: PointerEvent) => {
              move(ev);
              window.removeEventListener('pointermove', move);
              window.removeEventListener('pointerup', up);
              saveSplit(last);
            };
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', up);
          }}
          onKeyDown={(e) => {
            const step = e.key === 'ArrowLeft' ? -5 : e.key === 'ArrowRight' ? 5 : 0;
            if (step === 0) return;
            e.preventDefault();
            const next = clampSplit(split + step);
            setSplit(next);
            saveSplit(next);
          }}
        >
          <span className="h-16 w-1.5 rounded-full bg-ink/30 transition-colors group-hover:bg-ink/70 group-focus-visible:bg-brand-deep" />
        </div>

        <Panel className="flex min-h-0 flex-col gap-2 p-3" raised={false}>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="m-0 mr-auto font-display text-[22px]">{t.codeTitle}</h2>
            {draft === null ? (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    setDraft('');
                  }}
                >
                  {t.edit}
                </Button>
                <Button size="sm" variant="go" onClick={copy} disabled={view.code === ''}>
                  {copied ? t.copied : t.copy}
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    setDraft(null);
                  }}
                >
                  {t.cancel}
                </Button>
                <Button size="sm" variant="go" onClick={build}>
                  {t.build}
                </Button>
              </>
            )}
          </div>

          {draft !== null ? (
            <textarea
              className="min-h-0 flex-1 resize-none rounded-panel border-3 border-ink bg-ink p-3 font-mono text-sm text-paper"
              value={draft}
              placeholder={t.pastePlaceholder}
              spellCheck={false}
              autoFocus
              data-testid="workshop-paste"
              onChange={(e) => {
                setDraft(e.target.value);
              }}
            />
          ) : (
            <pre
              className="m-0 min-h-0 flex-1 overflow-auto rounded-panel border-3 border-ink bg-ink py-2 text-sm text-paper"
              data-testid="workshop-code"
            >
              {lines.map((text, i) => (
                <div
                  key={i}
                  onClick={() => {
                    selectLine(i);
                  }}
                  data-line={i + 1}
                  data-problem={problemLines.has(i) ? '' : undefined}
                  data-highlight={highlighted === i ? '' : undefined}
                  className={[
                    'flex cursor-pointer gap-3 px-2',
                    highlighted === i ? 'bg-brand-deep' : '',
                    problemLines.has(i) ? 'bg-oops/60' : '',
                  ].join(' ')}
                >
                  <span className="w-6 shrink-0 select-none text-right opacity-50">{i + 1}</span>
                  <code className="whitespace-pre">{text}</code>
                </div>
              ))}
            </pre>
          )}

          {view.source === 'pasted' && draft === null && (
            <div className="grid gap-1" data-testid="workshop-report">
              <p className="m-0 font-bold">
                {view.built > 0 ? t.built(view.built) : t.nothingBuilt}
              </p>
              {view.problems.map((p) => (
                <p key={p.line} className="m-0 rounded-key border-3 border-oops bg-oops-soft px-2">
                  ⚠️ {t.line(p.line)}: {t.problems[p.reason]}
                </p>
              ))}
            </div>
          )}

          <a
            href={LEANBOT_IDE_URL}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-brand-deep"
          >
            {t.openIde} ↗
          </a>
        </Panel>
      </div>
    </main>
  );
}
