import { useLiveQuery } from 'dexie-react-hooks';
import type { LevelDraftRow } from '../../data/db';
import { listLevelDrafts } from '../../data/repos/levelDrafts';

// Screens reach the level editor's drafts through features (overview.md §3), not data/.
export { deleteLevelDraft, loadLevelDraft, saveLevelDraft } from '../../data/repos/levelDrafts';

/** Saved drafts, newest first; undefined while loading. Live: updates after every save. */
export function useLevelDrafts(): LevelDraftRow[] | undefined {
  return useLiveQuery(() => listLevelDrafts(), []);
}
