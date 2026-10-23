import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react';
import { common, Events, inject, svgResize, utils, type WorkspaceSvg, Xml } from 'blockly';
import { type ArduinoProgram, registerLeanbotFlyouts, toArduino } from '@codequest/games';
import '../../blockly/blockly.css';
import { loadBlocklyFonts, setupBlockly } from '../../blockly/setup';
import { codequestTheme } from '../../blockly/theme';
import { UI_COLORS } from '../../ui';
import { type FlyoutToolbox, setupWorkshopBlocks, type WorkshopToolbox } from './workshopToolbox';

// The Leanbot block editor shared by Xưởng Phiên Dịch and the Thế giới Leanbot lessons: a
// Blockly workspace with Pythaverse's blocks whose Arduino code is reported on every change,
// and the numbered code panel next to it.

export interface LeanbotWorkspaceOptions {
  toolbox: WorkshopToolbox | FlyoutToolbox;
  /** Starting program as Blockly XML. */
  start?: string | undefined;
  onProgram: (program: ArduinoProgram) => void;
  onSelect?: (blockId: string | null) => void;
}

/**
 * Injects the editor into `host` once (the options are read on mount: render with a `key` to
 * start over) and reports the code after every change. Returns the workspace once it is there.
 */
export function useLeanbotWorkspace(
  host: RefObject<HTMLDivElement | null>,
  options: LeanbotWorkspaceOptions,
): RefObject<WorkspaceSvg | null> {
  const workspaceRef = useRef<WorkspaceSvg | null>(null);
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let disposed = false;
    let workspace: WorkspaceSvg | null = null;
    void loadBlocklyFonts().then(() => {
      if (disposed) return;
      setupBlockly();
      setupWorkshopBlocks();
      const { toolbox, start } = latest.current;
      workspace = inject(container, {
        renderer: 'zelos',
        theme: codequestTheme,
        media: '/blockly-media/',
        toolbox,
        trashcan: true,
        sounds: false,
        move: { scrollbars: true, drag: true, wheel: true },
        zoom: { controls: true, wheel: false, startScale: 0.9, minScale: 0.5, maxScale: 1.6 },
        grid: { spacing: 24, length: 2, colour: UI_COLORS.brandSoft, snap: true },
      });
      registerLeanbotFlyouts(workspace);
      const ws = workspace;
      if (start !== undefined) {
        Events.disable();
        try {
          Xml.domToWorkspace(utils.xml.textToDom(start), ws);
        } finally {
          Events.enable();
        }
      }
      workspaceRef.current = ws;
      ws.addChangeListener((event: Events.Abstract) => {
        if (event instanceof Events.Selected) {
          latest.current.onSelect?.(event.newElementId ?? null);
          return;
        }
        if (event.isUiEvent) return;
        latest.current.onProgram(toArduino(ws));
      });
      latest.current.onProgram(toArduino(ws));
    });
    // Blockly only follows window resizes; the column also changes width (dragged bar, panels).
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
  }, [host]);

  return workspaceRef;
}

/** The block whose code starts on `line` (0-based), or the last one starting before it. */
export function blockAtLine(lineOf: ReadonlyMap<string, number>, line: number): string | null {
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

/** Selects and centres the block of a code line. */
export function selectLine(
  ws: WorkspaceSvg | null,
  lineOf: ReadonlyMap<string, number>,
  line: number,
): void {
  const id = blockAtLine(lineOf, line);
  const block = id !== null ? ws?.getBlockById(id) : null;
  if (!ws || !block) return;
  common.setSelected(block);
  ws.centerOnBlock(block.id);
}

export interface CodeLinesProps {
  code: string;
  /** 0-based line lit as the selected block's. */
  highlighted?: number | undefined;
  /** 0-based lines painted red. */
  problems?: ReadonlySet<number> | undefined;
  onLineClick?: ((line: number) => void) | undefined;
  testId: string;
}

/** Numbered Arduino code, a line per row, clickable. */
export function CodeLines({ code, highlighted, problems, onLineClick, testId }: CodeLinesProps) {
  return (
    <pre
      className="m-0 min-h-0 flex-1 overflow-auto rounded-panel border-3 border-ink bg-ink py-2 text-sm text-paper"
      data-testid={testId}
    >
      {code.split('\n').map((text, i) => (
        <div
          key={i}
          onClick={() => {
            onLineClick?.(i);
          }}
          data-line={i + 1}
          data-problem={problems?.has(i) ? '' : undefined}
          data-highlight={highlighted === i ? '' : undefined}
          className={[
            'flex gap-3 px-2',
            onLineClick ? 'cursor-pointer' : '',
            highlighted === i ? 'bg-brand-deep' : '',
            problems?.has(i) ? 'bg-oops/60' : '',
          ].join(' ')}
        >
          <span className="w-6 shrink-0 select-none text-right opacity-50">{i + 1}</span>
          <code className="whitespace-pre">{text}</code>
        </div>
      ))}
    </pre>
  );
}

/** Copies text; resolves false when the clipboard is blocked (the child can still select it). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
