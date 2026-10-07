// Story chapters a child has already seen on the world page (P2-24), so a newly opened chapter
// gets its "Chương mới!" highlight exactly once. A per-device nicety, not progress: kept in
// localStorage (never synced or backed up). If storage is unavailable or cleared, the open
// chapters simply show as new once more.

const KEY_PREFIX = 'cq.storySeen.';

type SeenMap = Record<string, string[]>;

function read(profileId: string): SeenMap {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + profileId);
    const parsed: unknown = raw === null ? {} : JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as SeenMap)
      : {};
  } catch {
    return {};
  }
}

/** Chapter ids of `worldId` the child has seen. */
export function seenChapters(profileId: string, worldId: string): Set<string> {
  const ids = read(profileId)[worldId];
  return new Set(Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : []);
}

/** Adds `chapterIds` to what the child has seen of `worldId`. */
export function markChaptersSeen(
  profileId: string,
  worldId: string,
  chapterIds: readonly string[],
): void {
  const all = read(profileId);
  const seen = new Set([...seenChapters(profileId, worldId), ...chapterIds]);
  all[worldId] = [...seen];
  try {
    localStorage.setItem(KEY_PREFIX + profileId, JSON.stringify(all));
  } catch {
    // Private mode or full storage: the highlight shows again next time, nothing breaks.
  }
}
