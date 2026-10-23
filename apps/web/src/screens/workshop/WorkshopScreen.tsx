import { useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { Events, serialization } from 'blockly';
import { parseArduino, type ParseProblem } from '@codequest/games';
import {
  CodeLines,
  copyText,
  selectLine,
  useLeanbotWorkspace,
} from '../../features/workshop/LeanbotEditor';
import { LEANBOT_IDE_URL, workshopToolbox } from '../../features/workshop/workshopToolbox';
import { useSignedInProfile } from '../../features/profiles';
import { vi } from '../../i18n/vi';
import { Button, Panel } from '../../ui';
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
  const [view, setView] = useState<CodeView>(EMPTY);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const workspaceRef = useLeanbotWorkspace(host, {
    toolbox: workshopToolbox(),
    onProgram: (program) => {
      setView({ source: 'blocks', code: program.code, lineOf: program.lineOf });
    },
    onSelect: setSelected,
  });

  const highlighted = selected !== null ? view.lineOf.get(selected) : undefined;
  const problemLines = new Set(
    view.source === 'pasted' ? view.problems.map((p) => p.line - 1) : [],
  );

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
    void copyText(view.code).then((ok) => {
      if (!ok) return;
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    });
  };

  return (
    <main className="flex h-dvh flex-col gap-3 bg-ground p-3">
      <TopBar back={{ label: vi.leanbotWorld.title, to: '/the-gioi-leanbot' }}>
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
            <CodeLines
              code={view.code}
              highlighted={highlighted}
              problems={problemLines}
              onLineClick={(line) => {
                selectLine(workspaceRef.current, view.lineOf, line);
              }}
              testId="workshop-code"
            />
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
