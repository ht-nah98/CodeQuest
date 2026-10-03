import {
  type ChangeEvent,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router';
import type { Level, LevelMode, WorkspaceJson } from '@codequest/content-schema';
import { findFile, levelFiles, worldFiles } from '../../features/content/files';
import { SANDBOX_WORLD_ID } from '../../features/content/sandbox';
import {
  draftFromJson,
  type EditorKind,
  levelFileText,
  newDraft,
  unknownLevelKeys,
  withMode,
} from '../../features/editor/draft';
import {
  deleteLevelDraft,
  loadLevelDraft,
  saveLevelDraft,
  useLevelDrafts,
} from '../../features/editor/useLevelDrafts';
import { useParSearch } from '../../features/editor/useParSearch';
import { validateDraft } from '../../features/editor/validation';
import { vi } from '../../i18n/vi';
import { Button } from '../../ui';
import { AdultGate } from './AdultGate';
import { LevelForm } from './editor/LevelForm';
import { MapEditor } from './editor/MapEditor';
import { ParSearchPanel } from './editor/ParSearchPanel';
import { INPUT_CLASS } from './editor/parts';
import { ProgramPanel, type ProgramTab } from './editor/ProgramPanel';

const t = vi.editor;

/** Content levels by id (`content/worlds/<world>/levels/<id>.json`), sorted. */
const CONTENT_LEVEL_IDS = Object.keys(levelFiles)
  .map((path) => /\/levels\/([^/]+)\.json$/.exec(path)?.[1])
  .filter((id): id is string => id !== undefined)
  .sort();
/** World folders a level can go to: every world, plus the sandbox. */
const WORLD_IDS = [
  ...Object.keys(worldFiles)
    .map((path) => /\/worlds\/([^/]+)\/world\.json$/.exec(path)?.[1])
    .filter((id): id is string => id !== undefined)
    .sort(),
  SANDBOX_WORLD_ID,
];

const AUTOSAVE_MS = 400;

/**
 * /coach/editor: the level editor (phase-2.md P2-07), dev builds only (App.tsx) until the coach
 * sign-in of P2-16; the adult lock stays in front of it.
 */
export default function EditorScreen() {
  return (
    <AdultGate>
      <LevelEditor />
    </AdultGate>
  );
}

function LevelEditor() {
  const [draft, setDraft] = useState<Level>(() => newDraft('runner'));
  const [draftKey, setDraftKey] = useState<string>(() => crypto.randomUUID());
  /** The content level this draft was opened from (its id may be reused on purpose). */
  const [openedFrom, setOpenedFrom] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  /** Same as `reloadToken`, readable in callbacks: reports of a replaced workspace are dropped. */
  const reloadRef = useRef(0);
  const reload = useCallback(() => {
    reloadRef.current += 1;
    setReloadToken(reloadRef.current);
  }, []);
  const [tab, setTab] = useState<ProgramTab>('solution');
  const [notice, setNotice] = useState<string | null>(null);
  const drafts = useLevelDrafts();
  const parSearch = useParSearch();

  // Validation runs the level with the real engine: let typing win over it.
  const deferred = useDeferredValue(draft);
  const validation = useMemo(() => validateDraft(deferred), [deferred]);
  const issueCount = validation.issues.length;

  // Every change is kept on this laptop (IndexedDB), a moment after the last keystroke. A draft
  // just created or opened is not saved until it is edited (no junk drafts from visits).
  const savedRef = useRef<string | null>(null);
  useEffect(() => {
    const json = JSON.stringify(draft);
    if (savedRef.current === null) savedRef.current = json;
    if (savedRef.current === json) return;
    const timer = setTimeout(() => {
      savedRef.current = json;
      void saveLevelDraft(draftKey, draft.id, draft);
    }, AUTOSAVE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [draft, draftKey]);

  const start = (level: Level, key: string, from: string | null, opened?: unknown) => {
    parSearch.cancel();
    savedRef.current = JSON.stringify(level);
    setDraft(level);
    setDraftKey(key);
    setOpenedFrom(from);
    reload();
    setTab('solution');
    const dropped = opened === undefined ? [] : unknownLevelKeys(opened);
    setNotice(dropped.length > 0 ? t.droppedKeys(dropped.join(', ')) : null);
  };

  const openContent = async (id: string) => {
    const load = findFile(levelFiles, `/levels/${id}.json`);
    const json = load === undefined ? null : await load();
    const level = draftFromJson(json);
    if (level === null) setNotice(t.openFailed);
    else start(level, crypto.randomUUID(), id, json);
  };

  const openDraft = async (key: string) => {
    const json = await loadLevelDraft(key);
    const level = draftFromJson(json);
    if (level === null) setNotice(t.openFailed);
    else start(level, key, null, json);
  };

  const openFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file === undefined) return;
    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      json = null;
    }
    const level = draftFromJson(json);
    if (level === null) setNotice(t.openFailed);
    else start(level, crypto.randomUUID(), null, json);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileName = `${draft.id}.json`;
  const download = () => {
    const url = URL.createObjectURL(new Blob([levelFileText(draft)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    // Revoked later: some browsers start reading the blob only after click() returns.
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };
  const copy = () => {
    navigator.clipboard.writeText(levelFileText(draft)).then(
      () => {
        setNotice(t.copied);
      },
      () => {
        setNotice(t.copyFailed);
      },
    );
  };

  /**
   * A program from a workspace report (`token`: the reload it was mounted at; a report of a
   * workspace replaced since is dropped) or from a button (`token` null: remount the workspace).
   */
  const setProgram = (
    field: 'solution' | 'initialWorkspace',
    program: WorkspaceJson,
    token: number | null,
  ) => {
    if (token !== null && token !== reloadRef.current) return;
    setDraft((old) =>
      JSON.stringify(old[field]) === JSON.stringify(program) ? old : { ...old, [field]: program },
    );
    if (token === null) reload();
  };

  const idTaken = CONTENT_LEVEL_IDS.includes(draft.id) && openedFrom !== draft.id;

  return (
    <main
      className="grid min-h-screen content-start gap-3 bg-ground p-3"
      data-testid="level-editor"
    >
      <header className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-panel border-3 border-ink bg-brand-deep px-4 py-2 text-paper shadow-hard">
        <Link to="/" className="font-display font-bold text-paper">
          ← {t.back}
        </Link>
        <div className="grid">
          <span className="font-pixel text-pixel-sm">{t.eyebrow}</span>
          <h1 className="m-0 text-[28px]">{t.title}</h1>
        </div>
        <span
          role="status"
          data-testid="editor-status"
          data-valid={issueCount === 0}
          className={`rounded-key border-3 border-ink px-3 py-1 font-pixel text-pixel text-ink ${issueCount === 0 ? 'bg-go' : 'bg-oops-soft'}`}
        >
          {issueCount === 0 ? `✔ ${t.valid}` : `⚠ ${t.invalid(issueCount)}`}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="go" data-testid="editor-download" onClick={download}>
            {t.download}
          </Button>
          <Button size="sm" onClick={copy}>
            {t.copy}
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded-panel border-3 border-ink bg-paper px-4 py-2">
        {(['runner', 'maze'] as const satisfies readonly EditorKind[]).map((kind) => (
          <Button
            key={kind}
            size="sm"
            data-testid={`editor-new-${kind}`}
            onClick={() => {
              start(newDraft(kind), crypto.randomUUID(), null);
            }}
          >
            {kind === 'runner' ? t.newRunner : t.newMaze}
          </Button>
        ))}
        <label className="grid gap-1 text-small font-bold">
          {t.openContent}
          <select
            value=""
            data-testid="editor-open-content"
            onChange={(event) => {
              void openContent(event.target.value);
            }}
            className={INPUT_CLASS}
          >
            <option value="">{t.pick}</option>
            {CONTENT_LEVEL_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-small font-bold">
          {t.openDraft}
          <select
            value=""
            onChange={(event) => {
              void openDraft(event.target.value);
            }}
            className={INPUT_CLASS}
          >
            <option value="">{t.pick}</option>
            {(drafts ?? []).map((row) => (
              <option key={row.key} value={row.key}>
                {row.levelId} · {row.updatedAt.slice(0, 16).replace('T', ' ')}
              </option>
            ))}
          </select>
        </label>
        <Button
          size="sm"
          onClick={() => {
            void deleteLevelDraft(draftKey);
            start(newDraft(draft.kind === 'maze' ? 'maze' : 'runner'), crypto.randomUUID(), null);
          }}
        >
          {t.deleteDraft}
        </Button>
        {/* The native file input shows English ("Choose File"): a Vietnamese button opens it. */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          data-testid="editor-open-file"
          onChange={(event) => void openFile(event)}
        />
        <Button
          size="sm"
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          {t.openFile}
        </Button>
        <p className="m-0 basis-full text-small text-ink-soft">
          {t.savedLocal} {t.exportHelp(fileName)}
          {notice !== null && (
            <strong role="status" className="ml-2 text-ink">
              {notice}
            </strong>
          )}
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] items-start gap-3">
        <div className="grid gap-3">
          <LevelForm
            key={draftKey}
            level={draft}
            issues={validation.byField}
            worldIds={WORLD_IDS}
            idTaken={idTaken}
            solutionBlocks={validation.solutionBlocks}
            answerKey={validation.answerKey}
            onChange={setDraft}
            onMode={(mode: LevelMode) => {
              setDraft((old) => withMode(old, mode));
              reload();
            }}
          >
            <MapEditor
              level={draft}
              issues={validation.byField.get('config')}
              onConfig={(update) => {
                // Functional: a mouse drag paints several cells between two renders.
                setDraft((old) => ({ ...old, config: update(old.config) }));
              }}
            />
          </LevelForm>
        </div>
        <div className="grid gap-3">
          <section
            aria-labelledby="editor-issues"
            className="grid gap-2 rounded-panel border-3 border-ink bg-paper px-4 py-3 shadow-hard"
          >
            <h2 id="editor-issues" className="m-0 text-[22px]">
              {t.issues}
            </h2>
            <p className="m-0 text-small text-ink-soft">{t.issuesHelp}</p>
            {issueCount === 0 ? (
              <p className="m-0 font-bold text-go-deep" data-testid="editor-no-issues">
                ✔ {t.noIssues}
              </p>
            ) : (
              <ul className="m-0 grid list-none gap-1 p-0" data-testid="editor-issues">
                {validation.issues.map((issue, index) => (
                  <li key={index} className="text-small font-bold text-oops" data-rule={issue.rule}>
                    ⚠ {t.rule(issue.rule)}: {issue.message}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <ProgramPanel
            draft={draft}
            level={validation.runnable}
            playable={validation.playable}
            issues={validation.byField}
            reloadToken={reloadToken}
            tab={tab}
            onTab={setTab}
            onProgram={setProgram}
          />
          <ParSearchPanel
            draft={draft}
            level={validation.runnable}
            state={parSearch.state}
            onStart={parSearch.start}
            onCancel={parSearch.cancel}
            onUseExample={(solution) => {
              const top = solution.blocks.blocks[0];
              if (top !== undefined) Object.assign(top, { x: 40, y: 40 });
              setProgram('solution', solution, null);
              setTab('solution');
            }}
            onSet={(key, value) => {
              setDraft((old) => ({ ...old, [key]: value }));
            }}
          />
        </div>
      </div>
    </main>
  );
}
