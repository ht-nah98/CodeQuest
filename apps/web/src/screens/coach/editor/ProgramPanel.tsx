import { useCallback, useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import type { Level, WorkspaceJson } from '@codequest/content-schema';
import type { RuleIssue } from '@codequest/validator';
import { BlocklyWorkspace, type BlocklyLevel } from '../../../blockly/BlocklyWorkspace';
import { authorWorkspaceJson } from '../../../features/author/authorExport';
import {
  type EditorField,
  EMPTY_PROGRAM,
  modeUses,
  scatterProgram,
  toolboxChoices,
} from '../../../features/editor/draft';
import { vi } from '../../../i18n/vi';
import { Button } from '../../../ui';
import { FieldIssues, Section } from './parts';
import { PreviewPlay } from './PreviewPlay';

const t = vi.editor;

export type ProgramTab = 'solution' | 'initial' | 'preview';
const TABS: readonly ProgramTab[] = ['solution', 'initial', 'preview'];

/** Test hook (dev build only): the program workspace on screen and the Blockly module. */
declare global {
  interface Window {
    __cqEditor?: { Blockly: typeof Blockly; workspace: Blockly.WorkspaceSvg; tab: ProgramTab };
  }
}

export interface ProgramPanelProps {
  draft: Level;
  /** The draft as a runnable level (validation `runnable`), for Thử chơi. */
  level: Level | null;
  playable: boolean;
  issues: ReadonlyMap<EditorField, readonly RuleIssue[]>;
  /** Bumped when a program is replaced from outside (open, new, search example). */
  reloadToken: number;
  tab: ProgramTab;
  onTab: (tab: ProgramTab) => void;
  /**
   * A new program: from the workspace mounted at reload `token`, or from a button (`token`
   * null, the workspace is remounted with it).
   */
  onProgram: (
    field: 'solution' | 'initialWorkspace',
    program: WorkspaceJson,
    token: number | null,
  ) => void;
}

/** What Thử chơi depends on: texts, hints and numbers do not restart the stage. */
function previewKey(level: Level): string {
  const { kind, mode, config, variants, toolbox, maxBlocks, initialWorkspace, solution } = level;
  return JSON.stringify({
    kind,
    mode,
    config,
    variants,
    toolbox,
    maxBlocks,
    initialWorkspace,
    solution,
  });
}

/** "Chương trình": the solution and the start program in Blockly, and Thử chơi. */
export function ProgramPanel(props: ProgramPanelProps) {
  const { draft, level, playable, issues, reloadToken, tab, onTab, onProgram } = props;
  const field = tab === 'initial' ? 'initialWorkspace' : 'solution';
  const used = tab === 'preview' || modeUses(draft.mode, field);
  return (
    <Section title={t.programs} id="editor-programs">
      <div role="tablist" aria-label={t.programs} className="flex flex-wrap gap-2">
        {TABS.map((name) => (
          <Button
            key={name}
            size="sm"
            role="tab"
            aria-selected={tab === name}
            variant={tab === name ? 'coin' : 'plain'}
            data-tab={name}
            onClick={() => {
              onTab(name);
            }}
          >
            {t.tabs[name]}
          </Button>
        ))}
      </div>
      {tab === 'preview' ? (
        playable && level !== null ? (
          <PreviewPlay key={previewKey(level)} level={level} />
        ) : (
          <p className="m-0 font-bold text-oops" data-testid="preview-not-playable">
            {t.preview.notPlayable}
          </p>
        )
      ) : used ? (
        <>
          <p className="m-0 text-small text-ink-soft">{t.programHelp}</p>
          {tab === 'initial' && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onProgram(
                    'initialWorkspace',
                    structuredClone(draft.solution ?? EMPTY_PROGRAM),
                    null,
                  );
                }}
              >
                {t.copyFromSolution}
              </Button>
              {draft.mode === 'parsons' && (
                <Button
                  size="sm"
                  onClick={() => {
                    onProgram(
                      'initialWorkspace',
                      scatterProgram(draft.solution ?? EMPTY_PROGRAM),
                      null,
                    );
                  }}
                >
                  {t.scatterSolution}
                </Button>
              )}
            </div>
          )}
          <ProgramWorkspace
            key={`${draft.kind}-${tab}-${String(reloadToken)}`}
            tab={tab}
            kind={draft.kind}
            program={draft[field] ?? EMPTY_PROGRAM}
            onProgram={(program) => {
              onProgram(field, program, reloadToken);
            }}
          />
          <FieldIssues issues={issues.get(field)} testId={`issues-${field}`} />
        </>
      ) : (
        <p className="m-0 text-ink-soft">{t.notUsed}</p>
      )}
    </Section>
  );
}

/** Same blocks, fields and ids; positions and "khi bắt đầu"'s `deletable` are ignored. */
function sameProgram(a: WorkspaceJson, b: WorkspaceJson): boolean {
  const key = (json: WorkspaceJson) =>
    JSON.stringify(json, (name, value: unknown) =>
      name === 'x' || name === 'y' || name === 'deletable' ? undefined : value,
    );
  return key(a) === key(authorWorkspaceJson(b, { keepContentIds: true }));
}

/** One editable program: every block of the kind, no block limit, ids made content-safe. */
function ProgramWorkspace({
  tab,
  kind,
  program,
  onProgram,
}: {
  tab: ProgramTab;
  kind: Level['kind'];
  program: WorkspaceJson;
  onProgram: (program: WorkspaceJson) => void;
}) {
  // Read once: the workspace is remounted (new key) when the program is replaced from outside.
  // Blockly reports right after loading; that report is dropped when it is the same program
  // (only re-serialized), so opening a level never rewrites it or saves a draft.
  const loadedRef = useRef(false);
  const [level] = useState<BlocklyLevel>(() => ({
    id: `editor-${tab}`,
    mode: 'build',
    toolbox: toolboxChoices(kind),
    initialWorkspace: program,
  }));
  const onReady = useCallback(
    (workspace: Blockly.WorkspaceSvg) => {
      if (import.meta.env.DEV) window.__cqEditor = { Blockly, workspace, tab };
    },
    [tab],
  );
  useEffect(
    () => () => {
      delete window.__cqEditor;
    },
    [],
  );
  return (
    <div
      className="h-[380px] overflow-hidden rounded-key border-3 border-ink"
      data-testid={`editor-workspace-${tab}`}
    >
      <BlocklyWorkspace
        level={level}
        onReady={onReady}
        onChange={(state) => {
          // Content-safe ids are kept (hints and highlights use them); Blockly's "disabled
          // orphan" marks are dropped (rule 1, P2-07 review).
          const next = authorWorkspaceJson(state.json, { keepContentIds: true });
          const first = !loadedRef.current;
          loadedRef.current = true;
          if (first && sameProgram(next, program)) return;
          onProgram(next);
        }}
        className="h-full"
      />
    </div>
  );
}
