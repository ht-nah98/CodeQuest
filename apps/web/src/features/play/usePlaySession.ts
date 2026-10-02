import { useCallback, useEffect, useRef, useState } from 'react';
import type { Level, WorkspaceJson } from '@codequest/content-schema';
import type { RunOutcome } from '@codequest/engine';
import {
  mergeProgress,
  type HintTier,
  type LedgerEntry,
  type LevelProgress,
  type LevelSession,
} from '@codequest/rewards';
import { newAttemptId, saveAttempt } from '../../data/repos/attempts';
import { getCreation, saveCreation } from '../../data/repos/creations';
import { deleteDraft, loadDraft, saveDraft } from '../../data/repos/drafts';
import { listLedger } from '../../data/repos/ledger';
import { getProgress, saveLevelResult, saveProgress } from '../../data/repos/progress';
import {
  addCreativeSave,
  addHint,
  addRun,
  closeSession,
  closeStale,
  DRAFT_HASH_KEY,
  levelHash,
  openSession,
  openSessionKey,
  parseOpenRecord,
  type SessionState,
  toOpenRecord,
  toRunSummary,
  type WinReward,
  wrongPicks as wrongPicksOf,
} from './session';

// One level session of one child (rewards-economy.md "Phiên màn"), following rewards-engine.md
// §3 "Quy ước gọi":
// - every run is recorded as soon as the engine returns it (`recordRun`), whether or not the
//   replay is watched to the end; a win's progress + coins are stored at once (saveLevelResult);
// - the open session is mirrored to sessionStorage after every run, and closed (recordSession +
//   saveAttempt, write-once) when the child leaves; a session a closed tab never finished is
//   closed on the next visit of the level;
// - drafts autosave 1 s after the last change (blockly-integration.md §10), tagged with a hash
//   of the level so a draft made for an older version of it is dropped.

const DRAFT_DEBOUNCE_MS = 1000;

export interface PlaySession {
  /** False until progress, ledger and draft are loaded; runs must wait for it. */
  ready: boolean;
  /** The data layer could not be read: play goes on, but nothing is saved and no coins shown. */
  offline: boolean;
  /**
   * What the workspace starts with: the child's draft, else (creative) the saved creation,
   * else the level's own start. Predict always shows the level's own program.
   */
  initialWorkspace: WorkspaceJson | undefined;
  /**
   * Mode predict: cards picked wrong in the session a reload left open (same tab), still to
   * be shown marked and locked. Empty otherwise.
   */
  wrongPicks: readonly string[];
  /**
   * Records a run right after the engine returned it; resolves the reward of a win once it is
   * stored, else null. Show the reward only when the replay has finished. Mode `predict`:
   * pass the key of the picked card; the pick is what counts (rewards-engine.md §3).
   */
  recordRun: (outcome: RunOutcome, pickedKey?: string) => Promise<WinReward | null>;
  /**
   * "Lưu" on a `creative` level: stores the creation and, the first time, its coins. Resolves
   * the coins earned (0 on later saves); rejects when nothing could be stored.
   */
  saveCreative: (workspace: WorkspaceJson) => Promise<number>;
  /**
   * A hint bought in this session (P1-07): `entry` is the ledger line `buyHint` returned and
   * `spend` stored (or the free tier-1 line); null/omitted when nothing was charged.
   */
  recordHintBought: (tier: HintTier, entry?: LedgerEntry | null) => void;
  /** Autosaves the workspace (debounced). */
  saveDraft: (workspace: WorkspaceJson) => void;
  /**
   * The workspace's pending-change flush (WorkspaceHandle.flush), called before the last draft
   * save when the session ends; pass null when the workspace goes away.
   */
  setWorkspaceFlush: (flush: (() => void) | null) => void;
  /** The open session and ledger, for the hint box (P1-07: buyHint / failStreak). */
  snapshot: () => { session: LevelSession; ledger: readonly LedgerEntry[] };
}

type Loaded = {
  levelId: string;
  initialWorkspace: WorkspaceJson | undefined;
  offline: boolean;
  wrongPicks: readonly string[];
};

const NO_PICKS: readonly string[] = [];

function readStorage(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // Blocked storage: the session is then only closed on unmount / pagehide.
  }
}

/** Draft as stored: the workspace plus the level hash; null when it was made for another level version. */
function draftFor(stored: WorkspaceJson | undefined, hash: string): WorkspaceJson | null {
  if (stored === undefined) return null;
  const { [DRAFT_HASH_KEY]: tag, ...workspace } = stored as WorkspaceJson & Record<string, unknown>;
  return tag === hash ? workspace : null;
}

function currentState(ref: { readonly current: SessionState | null }): SessionState | null {
  return ref.current;
}

export function usePlaySession(profileId: string, level: Level): PlaySession {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const stateRef = useRef<SessionState | null>(null);
  const offlineRef = useRef(false);
  const startedAtRef = useRef(new Date());
  const attemptIdRef = useRef(newAttemptId());
  const draftTimerRef = useRef<number | null>(null);
  const pendingDraftRef = useRef<WorkspaceJson | null>(null);
  const workspaceFlushRef = useRef<(() => void) | null>(null);
  /** Wrong picks of a stale session; a ref, as StrictMode's second load no longer sees it. */
  const stalePicksRef = useRef<readonly string[]>(NO_PICKS);
  const storageKey = openSessionKey(profileId, level.id);
  const hash = levelHash(level);

  useEffect(() => {
    let live = true;
    const load = async () => {
      let progress: LevelProgress | undefined = await getProgress(profileId, level.id);
      // A session a previous page left open (tab closed mid-session): record it now.
      const stale = parseOpenRecord(readStorage(storageKey), profileId, level.id);
      if (stale && stale.attemptId !== attemptIdRef.current) {
        if (level.mode === 'predict') stalePicksRef.current = wrongPicksOf(stale.session.runs);
        const now = new Date();
        const closed = closeStale(stale, now);
        if (closed) {
          await saveProgress(profileId, closed.progress, now);
          await saveAttempt(closed.attempt, now);
          progress = progress ? mergeProgress(progress, closed.progress) : closed.progress;
        }
        if (
          parseOpenRecord(readStorage(storageKey), profileId, level.id)?.attemptId ===
          stale.attemptId
        ) {
          writeStorage(storageKey, null);
        }
      }
      const [ledger, stored] = await Promise.all([
        listLedger(profileId),
        loadDraft(profileId, level.id),
      ]);
      let draft = draftFor(stored, hash);
      if (stored !== undefined && draft === null) await deleteDraft(profileId, level.id);
      // Creative: no draft (or one for an older level version) → the last saved creation.
      if (draft === null && level.mode === 'creative') {
        draft = (await getCreation(profileId, level.id))?.workspace ?? null;
      }
      return { progress, ledger, draft };
    };
    load().then(
      ({ progress, ledger, draft }) => {
        if (!live) return;
        offlineRef.current = false;
        stateRef.current = openSession(level.id, { progress, ledger });
        setLoaded({
          levelId: level.id,
          // A predict program is read-only: always the level's own.
          initialWorkspace:
            level.mode === 'predict' ? level.initialWorkspace : (draft ?? level.initialWorkspace),
          offline: false,
          wrongPicks: stalePicksRef.current,
        });
      },
      () => {
        // The data layer failed (e.g. storage blocked): play on, but save nothing and show no
        // coins rather than coins that would vanish on reload.
        if (!live) return;
        offlineRef.current = true;
        stateRef.current = openSession(level.id, { progress: undefined, ledger: [] });
        setLoaded({
          levelId: level.id,
          initialWorkspace: level.initialWorkspace,
          offline: true,
          wrongPicks: NO_PICKS,
        });
      },
    );
    return () => {
      live = false;
    };
  }, [profileId, level, storageKey, hash]);

  const flushDraft = useCallback(() => {
    if (draftTimerRef.current !== null) window.clearTimeout(draftTimerRef.current);
    draftTimerRef.current = null;
    const pending = pendingDraftRef.current;
    pendingDraftRef.current = null;
    if (pending === null || offlineRef.current) return;
    const tagged = { ...pending, [DRAFT_HASH_KEY]: hash } as WorkspaceJson;
    void saveDraft(profileId, level.id, tagged).catch(() => undefined);
  }, [profileId, level.id, hash]);

  /** Mirrors the open session to sessionStorage (see session.ts "The open session"). */
  const persistOpen = useCallback(() => {
    const state = stateRef.current;
    if (state === null || offlineRef.current) return;
    if (state.session.runs.length === 0 && state.session.hintTiersBought.length === 0) return;
    const record = toOpenRecord(state, {
      attemptId: attemptIdRef.current,
      profileId,
      startedAt: startedAtRef.current,
    });
    writeStorage(storageKey, JSON.stringify(record));
  }, [profileId, storageKey]);

  /** Leaving the level (unmount, reload, tab closed). Idempotent: a closed session is empty. */
  const endSession = useCallback(() => {
    // The workspace may hold a change not reported yet (150 ms debounce): report it first.
    workspaceFlushRef.current?.();
    flushDraft();
    const state = stateRef.current;
    if (state === null || offlineRef.current) return;
    const now = new Date();
    const attemptId = attemptIdRef.current;
    const closed = closeSession(state, {
      attemptId,
      profileId,
      startedAt: startedAtRef.current,
      now,
    });
    if (closed === null) return;
    // Start a fresh session in case the page comes back (bfcache) and play goes on.
    stateRef.current = openSession(level.id, { progress: closed.progress, ledger: state.ledger });
    attemptIdRef.current = newAttemptId();
    startedAtRef.current = now;
    Promise.all([saveProgress(profileId, closed.progress, now), saveAttempt(closed.attempt, now)])
      .then(() => {
        // Only now: if the page dies first, the next visit finishes the job from storage.
        const stored = parseOpenRecord(readStorage(storageKey), profileId, level.id);
        if (stored?.attemptId === attemptId) writeStorage(storageKey, null);
      })
      .catch(() => undefined);
  }, [flushDraft, profileId, level.id, storageKey]);

  useEffect(() => {
    window.addEventListener('pagehide', endSession);
    return () => {
      window.removeEventListener('pagehide', endSession);
      endSession();
    };
  }, [endSession]);

  const recordRun = useCallback(
    async (outcome: RunOutcome, pickedKey?: string): Promise<WinReward | null> => {
      const state = stateRef.current;
      if (state === null) return null;
      const now = new Date();
      const { state: next, reward } = addRun(state, {
        level,
        run: toRunSummary(outcome, crypto.randomUUID(), pickedKey),
        now,
        profileId,
      });
      stateRef.current = next;
      persistOpen();
      if (reward === null) return null;
      const noCoins: WinReward = { ...reward, entries: [], coins: 0 };
      if (offlineRef.current) return noCoins;
      try {
        await saveLevelResult(
          { profileId, progress: reward.progressAfter, entries: reward.entries },
          now,
        );
        return reward;
      } catch {
        // Nothing was stored: keep the ledger and progress as before this win, so the next win
        // earns these first-time coins again instead of losing them (the run stays recorded).
        // Read through a function: another run may have been recorded while this one saved.
        const current = currentState(stateRef);
        if (current !== null) {
          stateRef.current = { ...current, progress: state.progress, ledger: state.ledger };
        }
        return noCoins;
      }
    },
    [level, profileId, persistOpen],
  );

  const saveCreative = useCallback(
    async (workspace: WorkspaceJson): Promise<number> => {
      const state = stateRef.current;
      if (state === null || offlineRef.current) throw new Error('play session is not stored');
      const now = new Date();
      await saveCreation({ profileId, levelId: level.id, workspace, title: level.title }, now);
      const saved = addCreativeSave(state, { level, now, profileId });
      if (saved.entries.length > 0) {
        await saveLevelResult({ profileId, progress: saved.progress, entries: saved.entries }, now);
      }
      // Read again: a run may have been recorded while this was saving.
      const current = currentState(stateRef);
      if (current !== null) {
        stateRef.current = {
          ...current,
          progress: saved.state.progress,
          ledger: saved.state.ledger,
        };
      }
      return saved.coins;
    },
    [level, profileId],
  );

  const recordHintBought = useCallback(
    (tier: HintTier, entry?: LedgerEntry | null) => {
      const state = stateRef.current;
      if (state === null) return;
      stateRef.current = addHint(state, tier, entry);
      persistOpen();
    },
    [persistOpen],
  );

  const queueDraft = useCallback(
    (workspace: WorkspaceJson) => {
      pendingDraftRef.current = workspace;
      if (draftTimerRef.current !== null) window.clearTimeout(draftTimerRef.current);
      draftTimerRef.current = window.setTimeout(flushDraft, DRAFT_DEBOUNCE_MS);
    },
    [flushDraft],
  );

  const setWorkspaceFlush = useCallback((flush: (() => void) | null) => {
    workspaceFlushRef.current = flush;
  }, []);

  const snapshot = useCallback(() => {
    const state = stateRef.current;
    return {
      session: state?.session ?? { levelId: level.id, runs: [], hintTiersBought: [] },
      ledger: state?.ledger ?? [],
    };
  }, [level.id]);

  const ready = loaded?.levelId === level.id;
  return {
    ready,
    offline: ready && loaded.offline,
    initialWorkspace: ready ? loaded.initialWorkspace : undefined,
    wrongPicks: ready ? loaded.wrongPicks : NO_PICKS,
    recordRun,
    saveCreative,
    recordHintBought,
    saveDraft: queueDraft,
    setWorkspaceFlush,
    snapshot,
  };
}
