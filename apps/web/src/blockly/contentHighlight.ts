import { ContentHighlight } from '@blockly/workspace-content-highlight';
import type { WorkspaceSvg } from 'blockly';

/**
 * Dims the workspace around its blocks (`@blockly/workspace-content-highlight`), for a tier-0
 * hint with `spotlight: true` on the first levels. The plugin lights the whole content area of
 * the workspace, not one block, and the flyout stays as it is. Returns the teardown.
 */
export function startContentHighlight(workspace: WorkspaceSvg, padding = 16): () => void {
  const highlight = new ContentHighlight(workspace);
  highlight.init(padding);
  return () => {
    highlight.dispose();
  };
}
