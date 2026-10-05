import { useEffect, useRef, useState } from 'react';
import {
  Events,
  inject,
  KeyboardMover,
  keyboardNavigationController,
  serialization,
  svgResize,
  type WorkspaceSvg,
} from 'blockly';
import type { Level, WorkspaceJson } from '@codequest/content-schema';
import {
  analyzeWorkspace,
  CQ_START,
  type BlockSpec,
  type WorkspaceAnalysis,
} from '@codequest/engine';
import { audio, blocklySfx } from '../audio';
import { vi } from '../i18n/vi';
import { UI_COLORS } from '../ui/tokens';
import './blockly.css';
import { type BlockLimitBreach, guardBlockLimits } from './blockLimits';
import { loadBlocklyFonts, setupBlockly } from './setup';
import { codequestTheme } from './theme';
import { buildToolbox, knownBlockSpecs } from './toolbox';

/** The parts of a level the workspace needs. */
export type BlocklyLevel = Pick<
  Level,
  'id' | 'mode' | 'toolbox' | 'maxBlocks' | 'maxInstances' | 'maxLoopDepth' | 'initialWorkspace'
>;

/** A snapshot of the workspace: reported after every change (debounced) or read on demand. */
export interface WorkspaceState {
  /** The level this workspace belongs to; a report can arrive while the next level mounts. */
  levelId: string;
  json: WorkspaceJson;
  analysis: WorkspaceAnalysis;
  /**
   * `workspace.remainingCapacity()` for levels with `maxBlocks`, else null. Counts orphan blocks
   * too, matching what Blockly locks in the flyout (blockly-integration.md §5).
   */
  remainingCapacity: number | null;
}

/** Synchronous access to a mounted workspace, passed as the second argument of `onReady`. */
export interface WorkspaceHandle {
  /**
   * Serializes the workspace now. A run must read the program here, never from the debounced
   * `onChange` state, which can be up to 150 ms old (blockly-integration.md §2).
   */
  getState(): WorkspaceState;
  /** Delivers a pending debounced `onChange` report immediately (no-op when none is pending). */
  flush(): void;
}

export interface BlocklyWorkspaceProps {
  /** Render with `key={level.id}`: the level is read once, a new level needs a new workspace. */
  level: BlocklyLevel;
  /** BlockSpecs used to group the toolbox; defaults to the engine's and every game kind's. */
  blockSpecs?: readonly BlockSpec[];
  onChange?: (state: WorkspaceState) => void;
  onReady?: (workspace: WorkspaceSvg, handle: WorkspaceHandle) => void;
  /**
   * The workspace is about to be disposed (unmount or level change), after the last pending
   * `onChange` was flushed. Drop any reference to the workspace and its handle here.
   */
  onDispose?: () => void;
  /** A mouse drag of a block ended; the app returns focus to the stage so `Space` runs (§13). */
  onMouseDragEnd?: () => void;
  /**
   * A drop or new block broke `maxLoopDepth` / `maxInstances` and was undone (§5,
   * `blockLimits.ts`); the app says why in Măng's bubble.
   */
  onBlockLimit?: (breach: BlockLimitBreach) => void;
  className?: string;
}

const CHANGE_DEBOUNCE_MS = 150;

const DEFAULT_WORKSPACE: WorkspaceJson = {
  blocks: { languageVersion: 0, blocks: [{ type: CQ_START, x: 40, y: 40 }] },
};

/**
 * Loads the level's initial program (or a lone "khi bắt đầu") into `workspace`, replacing what
 * is there. Also used for "Làm lại" within the same level (blockly-integration.md §2).
 */
export function loadInitialWorkspace(workspace: WorkspaceSvg, level: BlocklyLevel): void {
  workspace.clear();
  serialization.workspaces.load(level.initialWorkspace ?? DEFAULT_WORKSPACE, workspace, {
    recordUndo: false,
  });
  // "khi bắt đầu" can move but never be deleted, whatever the content JSON says (§4).
  for (const start of workspace.getBlocksByType(CQ_START, false)) start.setDeletable(false);
  // Parsons has no toolbox to get a block back from: no block can be deleted (nor, as Blockly
  // only copies deletable blocks, duplicated), so the puzzle always stays solvable (§6).
  if (level.mode === 'parsons') {
    for (const block of workspace.getAllBlocks(false)) block.setDeletable(false);
  }
  workspace.clearUndo();
}

/** Smallest zoom `fitProgramWidth` goes down to (the workspace's own `minScale`). */
const FIT_MIN_SCALE = 0.7;
/** Room kept left and right of the program when it is fitted, in px. */
const FIT_PAD_PX = 12;

/**
 * Keeps the whole width of the program in view (W4 programs with "nếu … nếu không" inside a loop
 * are wider than the 1280×720 workspace at the start zoom): when the blocks are wider than the
 * view, zoom out just enough (not below FIT_MIN_SCALE) and scroll them into view. Never zooms in
 * and does nothing while the program fits, so the child's own scrolling and zoom stay put.
 */
export function fitProgramWidth(workspace: WorkspaceSvg): void {
  if (workspace.getAllBlocks(false).length === 0) return;
  const box = workspace.getBlocksBoundingBox();
  const view = workspace.getMetricsManager().getViewMetrics();
  const width = box.right - box.left;
  if (width <= 0 || view.width <= 0) return;
  const needed = (view.width - 2 * FIT_PAD_PX) / width;
  if (needed >= workspace.scale) {
    // Fits at this zoom: only bring a program pushed out of view back (load, Làm lại).
    const viewWs = workspace.getMetricsManager().getViewMetrics(true);
    if (box.left >= viewWs.left && box.right <= viewWs.left + viewWs.width) return;
  } else {
    workspace.setScale(Math.max(FIT_MIN_SCALE, needed));
  }
  workspace.scrollBoundsIntoView(box, FIT_PAD_PX);
}

/** CSS class of a loose block (and the stack under it) in a parsons workspace (blockly.css). */
export const LOOSE_BLOCK_CLASS = 'cq-loose';

/**
 * Parsons: blocks not yet hanging under "khi bắt đầu" are marked loose (a dashed outline)
 * instead of greyed out by `disableOrphans`, since at the start nearly every block is loose and
 * the hatched grey made the puzzle hard to read (§6).
 */
function markLooseBlocks(workspace: WorkspaceSvg): void {
  for (const block of workspace.getTopBlocks(false)) {
    block.getSvgRoot().classList.toggle(LOOSE_BLOCK_CLASS, block.type !== CQ_START);
  }
  for (const block of workspace.getAllBlocks(false)) {
    if (block.getParent() !== null) block.getSvgRoot().classList.remove(LOOSE_BLOCK_CLASS);
  }
}

interface Callbacks {
  onChange?: ((state: WorkspaceState) => void) | undefined;
  onReady?: ((workspace: WorkspaceSvg, handle: WorkspaceHandle) => void) | undefined;
  onDispose?: (() => void) | undefined;
  onMouseDragEnd?: (() => void) | undefined;
  onBlockLimit?: ((breach: BlockLimitBreach) => void) | undefined;
}

/** The fields of a Blockly event that `blocklySfx` reads. */
function sfxEvent(event: Events.Abstract): Parameters<typeof blocklySfx>[0] {
  if (!(event instanceof Events.BlockMove)) return { type: event.type };
  return {
    type: event.type,
    ...(event.reason !== undefined && { reason: event.reason }),
    ...(event.newParentId !== undefined && { newParentId: event.newParentId }),
  };
}

/** Injects the workspace for `level` into `container`; returns the teardown. */
function mountWorkspace(
  container: HTMLElement,
  level: BlocklyLevel,
  specs: readonly BlockSpec[],
  callbacks: { readonly current: Callbacks },
): () => void {
  setupBlockly();
  const workspace = inject(container, {
    renderer: 'zelos',
    theme: codequestTheme,
    // Never the default https://static.blockly.com/media/ (security-privacy.md).
    media: '/blockly-media/',
    toolbox: buildToolbox(level, specs),
    // +1 for "khi bắt đầu", which Blockly counts too (§5).
    ...(level.maxBlocks !== undefined && { maxBlocks: level.maxBlocks + 1 }),
    ...(level.maxInstances && { maxInstances: level.maxInstances }),
    // Nothing to throw away in parsons (blocks cannot be deleted) or predict (read-only).
    trashcan: level.mode !== 'parsons' && level.mode !== 'predict',
    // Blockly's own sounds ignore the volume sliders: ours play from the change listener.
    sounds: false,
    move: { scrollbars: true, drag: true, wheel: true },
    // Predict shares its panel with the answer cards: a smaller start so the program fits.
    zoom: {
      controls: true,
      wheel: false,
      startScale: level.mode === 'predict' ? 1 : 1.1,
      minScale: level.mode === 'predict' ? 0.55 : 0.7,
      maxScale: 1.6,
    },
    grid: { spacing: 24, length: 2, colour: UI_COLORS.brandSoft, snap: true },
    readOnly: level.mode === 'predict',
  });

  const getState = (): WorkspaceState => {
    const json = serialization.workspaces.save(workspace) as WorkspaceJson;
    return {
      levelId: level.id,
      json,
      analysis: analyzeWorkspace(json),
      remainingCapacity: level.maxBlocks === undefined ? null : workspace.remainingCapacity(),
    };
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const report = () => {
    timer = undefined;
    // After the child's edit: a program grown wider than the view is zoomed to fit.
    if (level.mode !== 'predict' && !workspace.isDragging()) fitProgramWidth(workspace);
    callbacks.current.onChange?.(getState());
  };
  const flush = () => {
    if (timer === undefined) return;
    clearTimeout(timer);
    report();
  };
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(report, CHANGE_DEBOUNCE_MS);
  };

  const parsons = level.mode === 'parsons';
  if (!parsons) workspace.addChangeListener(Events.disableOrphans);
  workspace.addChangeListener((event) => {
    if (!event.isUiEvent) {
      // Loading a program (recordUndo off) is silent; a drop, snap or delete by the child is not.
      if (event.recordUndo) audio.playSfx(blocklySfx(sfxEvent(event)));
      if (parsons) markLooseBlocks(workspace);
      schedule();
    } else if (
      event instanceof Events.BlockDrag &&
      !event.isStart &&
      // A keyboard move keeps keyboard navigation on and must keep its focus.
      !keyboardNavigationController.getIsActive()
    ) {
      callbacks.current.onMouseDragEnd?.();
    }
  });

  loadInitialWorkspace(workspace, level);
  // Limits Blockly cannot hold by itself (§5); only where the child adds or moves blocks.
  const unguard =
    level.mode === 'predict'
      ? () => undefined
      : guardBlockLimits(workspace, level, (breach) => {
          callbacks.current.onBlockLimit?.(breach);
        });
  // Predict: the program must be read whole, never scrolled to. Fit it into the space the
  // answer cards leave (short laptops), but never larger than the start scale.
  if (level.mode === 'predict') {
    const startScale = workspace.scale;
    workspace.zoomToFit();
    if (workspace.scale > startScale) workspace.setScale(startScale);
    workspace.scrollCenter();
  }
  if (parsons) markLooseBlocks(workspace);
  if (level.mode !== 'predict') fitProgramWidth(workspace);
  schedule();
  callbacks.current.onReady?.(workspace, { getState, flush });

  const resizeObserver = new ResizeObserver(() => {
    svgResize(workspace);
  });
  resizeObserver.observe(container);

  return () => {
    resizeObserver.disconnect();
    unguard();
    // A keyboard move left open would keep its dragger and shortcuts on a dead workspace.
    if (KeyboardMover.mover.isMoving()) KeyboardMover.mover.abortMove();
    flush();
    callbacks.current.onDispose?.();
    workspace.dispose();
  };
}

/**
 * Blockly is an imperative island (coding-standards.md §4): React only owns the container div;
 * the workspace lives in an effect and is disposed on unmount.
 */
export function BlocklyWorkspace({
  level,
  blockSpecs,
  onChange,
  onReady,
  onDispose,
  onMouseDragEnd,
  onBlockLimit,
  className = '',
}: BlocklyWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Options such as maxBlocks and readOnly can only be set at inject time, so the level and
  // specs are fixed for the life of this component (blockly-integration.md §2).
  const [initial] = useState(() => ({ level, specs: blockSpecs ?? knownBlockSpecs() }));
  const callbacks = useRef<Callbacks>({
    onChange,
    onReady,
    onDispose,
    onMouseDragEnd,
    onBlockLimit,
  });
  useEffect(() => {
    callbacks.current = { onChange, onReady, onDispose, onMouseDragEnd, onBlockLimit };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let teardown: (() => void) | undefined;
    // Blockly measures text once when it renders a block; measuring with a fallback font
    // leaves labels overflowing their blocks after Baloo 2 arrives.
    void loadBlocklyFonts().then(() => {
      if (!disposed) teardown = mountWorkspace(container, initial.level, initial.specs, callbacks);
    });
    return () => {
      disposed = true;
      teardown?.();
    };
  }, [initial]);

  return (
    <div
      ref={containerRef}
      role="region"
      data-mode={initial.level.mode}
      aria-label={vi.blockly.workspaceLabel}
      className={`cq-blockly ${className}`}
    />
  );
}
