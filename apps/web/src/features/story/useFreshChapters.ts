import { useEffect, useRef, useState } from 'react';
import { type ChapterState, freshChapterIds } from '@codequest/rewards';
import { markChaptersSeen, seenChapters } from './storySeen';

/**
 * The chapters of `worldId` opened since the child last saw its world page (P2-24), decided once
 * per visit when `states` first arrive; every open chapter then counts as seen for next time.
 * `null` until decided.
 */
export function useFreshChapters(
  profileId: string,
  worldId: string,
  states: readonly ChapterState[] | null,
): readonly string[] | null {
  const [fresh, setFresh] = useState<{ key: string; ids: string[] } | null>(null);
  // Survives StrictMode's second effect run, which would otherwise find everything seen.
  const decided = useRef<string | null>(null);

  useEffect(() => {
    const key = `${profileId}|${worldId}`;
    if (states === null || decided.current === key) return;
    decided.current = key;
    setFresh({ key, ids: freshChapterIds(states, seenChapters(profileId, worldId)) });
    markChaptersSeen(
      profileId,
      worldId,
      states.filter((s) => s.unlocked).map((s) => s.chapter.id),
    );
  }, [profileId, worldId, states]);

  return fresh?.key === `${profileId}|${worldId}` ? fresh.ids : null;
}
