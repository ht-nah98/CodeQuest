import { z } from 'zod';
import { RunResultSchema, type Level, type RunSummary } from '@codequest/content-schema';
import type { RunOutcome } from '@codequest/engine';
import {
  applyRun,
  computeCreativeSaveRewards,
  DEFAULT_PAR_EDITS,
  predictPickSummary,
  recordSession,
  WRONG_ANSWER,
  type LedgerEntry,
  type LevelProgress,
  type LevelSession,
  type HintTier,
  type RunState,
  type StarCount,
} from '@codequest/rewards';
import type { AttemptRow } from '../../data/db';

// Pure bookkeeping of one level session (enter → leave), following the calling convention of
// rewards-engine.md §3: `applyRun` after every run, `recordSession` when the child leaves.
// usePlaySession.ts adds the I/O (Dexie) around it.

/**
 * The run as rewards sees it. In mode `predict`, pass the key of the card the child picked:
 * the run is then the pick (rewards-engine.md §3, `predictPickSummary`), right or wrong
 * whatever the program itself did.
 */
export function toRunSummary(outcome: RunOutcome, runId: string, pickedKey?: string): RunSummary {
  if (pickedKey !== undefined) {
    const engineRun = toRunSummary(outcome, runId);
    return predictPickSummary(engineRun, pickedKey, outcome.answerKey ?? '', runId);
  }
  const summary: RunSummary = {
    runId,
    result: outcome.result,
    reasonCode: outcome.reasonCode,
    blocksUsed: outcome.stats.blocksUsed,
  };
  if (outcome.edits !== undefined) summary.edits = outcome.edits;
  return summary;
}

/** What the results overlay shows for a winning run. */
export interface WinReward {
  stars: StarCount;
  /** New ledger lines of this win (first clear, ⭐⭐, ⭐⭐⭐, first try, daily…). */
  entries: LedgerEntry[];
  /** Sum of `entries`. */
  coins: number;
  blocksUsed: number;
  /** Mode `bughunt`: blocks changed from the level's start (editDistance). */
  edits?: number;
  /**
   * Missed the par condition of the mode (blocks over `par`, edits over `parEdits`): the 1-star
   * line asks for fewer blocks / edits (else the cap came from a hint).
   */
  overPar: boolean;
  /** Progress right before this win, to tell what the win newly opened. */
  progressBefore: LevelProgress | undefined;
  progressAfter: LevelProgress;
}

export interface SessionState extends RunState {
  session: LevelSession;
}

export function openSession(levelId: string, state: RunState): SessionState {
  return { ...state, session: { levelId, runs: [], hintTiersBought: [] } };
}

/**
 * Adds one finished run to the session. Returns the next state and, for a win, its reward
 * (the caller stores `reward.progressAfter` + `reward.entries` with saveLevelResult).
 */
export function addRun(
  state: SessionState,
  input: { level: Level; run: RunSummary; now: Date; profileId: string },
): { state: SessionState; reward: WinReward | null } {
  const session: LevelSession = { ...state.session, runs: [...state.session.runs, input.run] };
  const next = applyRun(
    { progress: state.progress, ledger: state.ledger },
    { level: input.level, session, run: input.run, now: input.now, profileId: input.profileId },
  );
  const nextState: SessionState = { progress: next.progress, ledger: next.ledger, session };
  if (next.rewards === null) return { state: nextState, reward: null };
  const { stars, entries, newProgress } = next.rewards;
  const { level, run } = input;
  const overPar =
    level.mode === 'bughunt'
      ? (run.edits ?? Infinity) > (level.parEdits ?? DEFAULT_PAR_EDITS)
      : level.par !== undefined && run.blocksUsed > level.par;
  return {
    state: nextState,
    reward: {
      stars,
      entries,
      coins: entries.reduce((sum, entry) => sum + entry.delta, 0),
      blocksUsed: run.blocksUsed,
      ...(run.edits !== undefined && { edits: run.edits }),
      overPar,
      progressBefore: state.progress,
      progressAfter: newProgress,
    },
  };
}

/**
 * Mode predict: the cards picked wrong since the last right pick of `runs`, in order, so a
 * reloaded page keeps them marked (and locked) instead of letting them be picked again.
 */
export function wrongPicks(runs: readonly RunSummary[]): string[] {
  const picks: string[] = [];
  for (const run of runs) {
    if (run.result === 'success') picks.length = 0;
    else if (run.reasonCode === WRONG_ANSWER && run.predictChoice !== undefined) {
      picks.push(run.predictChoice);
    }
  }
  return picks;
}

/**
 * "Lưu" on a `creative` level (rewards-engine.md §3): the first save of the level pays
 * `creative:<levelId>` once and records the level as done; later saves add nothing.
 * The caller stores `progress` + `entries` with saveLevelResult.
 */
export function addCreativeSave(
  state: SessionState,
  input: { level: Level; now: Date; profileId: string },
): { state: SessionState; progress: LevelProgress; entries: LedgerEntry[]; coins: number } {
  const { newProgress, entries } = computeCreativeSaveRewards({
    level: input.level,
    progress: state.progress,
    ledger: state.ledger,
    now: input.now,
    profileId: input.profileId,
  });
  return {
    state: { ...state, progress: newProgress, ledger: [...state.ledger, ...entries] },
    progress: newProgress,
    entries,
    coins: entries.reduce((sum, entry) => sum + entry.delta, 0),
  };
}

/**
 * Leaving the level: the progress to merge (runs since the last win count as attempts) and the
 * write-once attempt row. `null` for a session without runs: nothing happened worth keeping.
 */
export function closeSession(
  state: SessionState,
  input: { attemptId: string; profileId: string; startedAt: Date; now: Date },
): { progress: LevelProgress; attempt: AttemptRow } | null {
  const { session } = state;
  if (session.runs.length === 0) return null;
  return {
    progress: recordSession(state.progress, session),
    attempt: {
      id: input.attemptId,
      profileId: input.profileId,
      levelId: session.levelId,
      startedAt: input.startedAt.toISOString(),
      endedAt: input.now.toISOString(),
      runs: session.runs,
      hintTiersBought: session.hintTiersBought,
      won: session.runs.some((run) => run.result === 'success'),
    },
  };
}

/**
 * A hint bought in this session (P1-07 wiring): the tier caps the stars of later wins
 * (rewards-economy.md §1), the ledger line (from `buyHint`, stored with `spend`) keeps the
 * balance right for the next `applyRun`. Returns a new state; the old one is not touched.
 */
export function addHint(
  state: SessionState,
  tier: HintTier,
  entry?: LedgerEntry | null,
): SessionState {
  return {
    ...state,
    session: { ...state.session, hintTiersBought: [...state.session.hintTiersBought, tier] },
    ledger: entry ? [...state.ledger, entry] : state.ledger,
  };
}

// ---- The open session in sessionStorage -------------------------------------------------
// A tab closed or reloaded mid-session may never finish its IndexedDB writes in `pagehide`.
// After every run the open session is written to sessionStorage; the next visit of the same
// level in this tab finds it and records it (recordSession + saveAttempt, both idempotent).

export interface OpenSessionRecord {
  attemptId: string;
  profileId: string;
  levelId: string;
  /** ISO */
  startedAt: string;
  /** Progress as `applyRun` left it (before this session's unrecorded runs). */
  progress: LevelProgress | null;
  session: LevelSession;
}

const ProgressSchema = z.object({
  levelId: z.string(),
  bestStars: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  bestBlocks: z.number().nullable(),
  completedAt: z.string().nullable(),
  firstTryWin: z.boolean(),
  attempts: z.number().int().nonnegative(),
});
const RunSchema = z.object({
  runId: z.string(),
  result: RunResultSchema,
  reasonCode: z.string().nullable(),
  blocksUsed: z.number(),
  edits: z.number().exactOptional(),
  predictChoice: z.string().exactOptional(),
});
const OpenSessionSchema = z.object({
  attemptId: z.string().min(1),
  profileId: z.string().min(1),
  levelId: z.string().min(1),
  startedAt: z.iso.datetime(),
  progress: ProgressSchema.nullable(),
  session: z.object({
    levelId: z.string(),
    runs: z.array(RunSchema),
    hintTiersBought: z.array(z.union([z.literal(1), z.literal(2), z.literal(3)])),
  }),
});

export function openSessionKey(profileId: string, levelId: string): string {
  return `cq.openSession:${profileId}:${levelId}`;
}

export function toOpenRecord(
  state: SessionState,
  input: { attemptId: string; profileId: string; startedAt: Date },
): OpenSessionRecord {
  return {
    attemptId: input.attemptId,
    profileId: input.profileId,
    levelId: state.session.levelId,
    startedAt: input.startedAt.toISOString(),
    progress: state.progress ?? null,
    session: state.session,
  };
}

/** The stored record, if it is valid and belongs to this profile and level. */
export function parseOpenRecord(
  text: string | null,
  profileId: string,
  levelId: string,
): OpenSessionRecord | null {
  if (text === null) return null;
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  const parsed = OpenSessionSchema.safeParse(json);
  if (!parsed.success) return null;
  const record: OpenSessionRecord = parsed.data;
  return record.profileId === profileId &&
    record.levelId === levelId &&
    record.session.levelId === levelId
    ? record
    : null;
}

/** What to store for a session left open by a previous page (null when it had no runs). */
export function closeStale(
  record: OpenSessionRecord,
  now: Date,
): { progress: LevelProgress; attempt: AttemptRow } | null {
  return closeSession(
    { progress: record.progress ?? undefined, ledger: [], session: record.session },
    {
      attemptId: record.attemptId,
      profileId: record.profileId,
      startedAt: new Date(record.startedAt),
      now,
    },
  );
}

// ---- Drafts tied to the level they were made for -------------------------------------------

/** Key added to a stored draft; Blockly ignores unknown top-level keys, and it is stripped. */
export const DRAFT_HASH_KEY = 'cqLevelHash';

/**
 * A short fingerprint of a level (FNV-1a over its JSON). A draft saved for an older version of
 * the level (different toolbox, map, start…) is dropped instead of loading a broken program.
 */
export function levelHash(level: Level): string {
  const text = JSON.stringify(level);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
