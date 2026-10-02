import {
  common,
  Events,
  getMainWorkspace,
  inject,
  serialization,
  type Workspace,
  WorkspaceSvg,
} from 'blockly';
import type { WorkspaceJson } from '@codequest/content-schema';
import './blockly.css';
import { setupBlockly } from './setup';
import { codequestTheme } from './theme';

export interface ReadOnlyWorkspace {
  workspace: WorkspaceSvg;
  /** Disposes the workspace and gives the main workspace back its "main" role. Idempotent. */
  dispose: () => void;
}

/**
 * Injects a read-only workspace showing `json` (solution view, next-step preview). Await
 * `loadBlocklyFonts()` first: Blockly measures labels once. `inject` makes the new workspace
 * Blockly's main one (keyboard shortcuts, context menus act on it), so the previous main
 * workspace is put back right away and again on dispose.
 */
export function mountReadOnlyWorkspace(
  container: HTMLElement,
  json: WorkspaceJson,
  { scale = 1, scrollable = true }: { scale?: number; scrollable?: boolean } = {},
): ReadOnlyWorkspace {
  setupBlockly();
  // Undefined before the first inject, whatever the type says.
  const main = getMainWorkspace() as Workspace | undefined;
  const workspace = inject(container, {
    renderer: 'zelos',
    theme: codequestTheme,
    // Never the default https://static.blockly.com/media/ (security-privacy.md).
    media: '/blockly-media/',
    readOnly: true,
    trashcan: false,
    sounds: false,
    move: { scrollbars: scrollable, drag: scrollable, wheel: scrollable },
    // zoomToFit never blows a short program up past 1.2× its start size.
    zoom: {
      controls: false,
      wheel: false,
      startScale: scale,
      maxScale: scale * 1.2,
      minScale: 0.5,
    },
  });
  const restoreMain = () => {
    // A disposed workspace has left the page; never hand the role back to it.
    if (main instanceof WorkspaceSvg && main !== workspace && main.getParentSvg().isConnected) {
      common.setMainWorkspace(main);
    }
  };
  restoreMain();
  // A preview never reports changes, so loading it fires no events at all.
  Events.disable();
  try {
    serialization.workspaces.load(json, workspace, { recordUndo: false });
  } finally {
    Events.enable();
  }
  let disposed = false;
  return {
    workspace,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      workspace.dispose();
      restoreMain();
    },
  };
}
