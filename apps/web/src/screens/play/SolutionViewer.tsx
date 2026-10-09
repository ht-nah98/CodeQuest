import { useEffect, useRef } from 'react';
import type { LevelVariable, WorkspaceJson } from '@codequest/content-schema';
import { mountReadOnlyWorkspace, type ReadOnlyWorkspace } from '../../blockly/readOnlyWorkspace';
import { loadBlocklyFonts } from '../../blockly/setup';
import { vi } from '../../i18n/vi';
import { Button, Panel } from '../../ui';
import { useModalDialog } from './useModalDialog';

const t = vi.hints.solution;

export interface SolutionViewerProps {
  /** `level.solution`. */
  solution: WorkspaceJson;
  /** `level.variables` (ADR-0022): box blocks show the level's box names. */
  variables?: readonly LevelVariable[] | undefined;
  onClose: () => void;
}

/**
 * Tier 3 (hint-engine.md §1): the level's solution in a read-only Blockly workspace inside an
 * overlay. The child's own workspace is untouched; they rebuild the program themselves.
 */
export function SolutionViewer({ solution, variables, onClose }: SolutionViewerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  useModalDialog(ref, onClose);

  // Blockly is an imperative island (coding-standards.md §4): mounted in an effect, disposed on close.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let disposed = false;
    let view: ReadOnlyWorkspace | null = null;
    void loadBlocklyFonts().then(() => {
      if (disposed) return;
      view = mountReadOnlyWorkspace(box, solution, { scale: 1, variables });
      try {
        // Show the whole program; jsdom and a hidden box have no size to fit into.
        view.workspace.zoomToFit();
      } catch {
        // Keep the start scale.
      }
    });
    return () => {
      disposed = true;
      view?.dispose();
    };
  }, [solution, variables]);

  return (
    <div ref={ref} className="fixed inset-0 z-40 grid place-items-center bg-ink/40 p-4">
      <Panel
        as="section"
        role="dialog"
        aria-modal="true"
        aria-labelledby="solution-title"
        data-testid="solution-viewer"
        className="grid h-[min(640px,90vh)] w-[min(880px,100%)] animate-pop grid-rows-[auto_minmax(0,1fr)] gap-3 p-5"
      >
        <header className="flex items-center gap-3">
          <h2 id="solution-title" className="m-0 text-title leading-tight">
            {t.title}
          </h2>
          <p className="m-0 font-bold text-ink-soft">{t.note}</p>
          <Button size="sm" className="ml-auto" onClick={onClose}>
            {t.close}
          </Button>
        </header>
        <div
          ref={boxRef}
          role="region"
          aria-label={t.workspaceLabel}
          data-testid="solution-workspace"
          className="cq-blockly min-h-0 overflow-hidden rounded-key border-2 border-ink"
        />
      </Panel>
    </div>
  );
}
