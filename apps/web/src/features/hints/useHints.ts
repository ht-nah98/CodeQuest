import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { HintTrigger, Level, WorkspaceJson } from '@codequest/content-schema';
import {
  type HintContext,
  type HintSelection,
  type NextStep,
  nextStep,
  selectHint,
} from '@codequest/engine';
import { balance, buyHint, failStreak, type HintTier, type LevelSession } from '@codequest/rewards';
import { addLedgerEntries, listLedger, spend } from '../../data/repos/ledger';
import { availableTiers, isTierOwned, type TierView, tierViews } from './tiers';

/** Workspace and profile facts for tier-0 hints; the rest of `HintContext` comes from the session. */
export type HintFacts = Pick<
  HintContext,
  'analysis' | 'capacityLeft' | 'idleMs' | 'isFirstOfModeInWorld' | 'seenModes'
>;

/** The child's program right now, read with `handle.getState()` (blockly-integration.md §2). */
export interface ProgramNow {
  json: WorkspaceJson;
  /** `remainingCapacity`, or `Infinity` for a level without `maxBlocks`. */
  capacityLeft: number;
}

export interface UseHintsOptions {
  profileId: string;
  level: Level;
  /**
   * The open level session (its runs feed the safety net and tier-0 hints). It may be mutated in
   * place: it is read on every render and every call, never memoised. Its `hintTiersBought` only
   * seeds `tiersBought` when the hook mounts.
   */
  session: LevelSession;
  /** Optional notification after a purchase was written (a free tier 1 included). */
  onPurchased?: (tier: HintTier) => void;
  now?: () => Date;
  /** One id per click, so a retried tier 2–3 purchase is charged once. */
  newPurchaseId?: () => string;
}

export type BuyResult =
  | { status: 'opened'; tier: 1 | 3 }
  | { status: 'opened'; tier: 2; step: NextStep }
  /** Tier 2 with nothing to show: the program already matches the solution. Not charged. */
  | { status: 'solved'; tier: 2 }
  /** Tier 2 in a parsons level whose needed block was deleted: say "Làm lại". Not charged. */
  | { status: 'reset'; tier: 2 }
  | { status: 'missing'; tier: HintTier; missing: number }
  /** Ledger still loading or another purchase in flight: nothing happened. */
  | { status: 'busy' }
  /** This level has no such tier (e.g. tier 2 in predict). Not charged. */
  | { status: 'unavailable' }
  | { status: 'error' };

export interface Hints {
  /** False until the ledger is loaded; `tiers` is empty meanwhile. */
  ready: boolean;
  /** Coin balance, never below 0. */
  balance: number;
  tiers: TierView[];
  /**
   * Tiers bought in this level session, in order. Put them in `session.hintTiersBought` before
   * `applyRun` / `computeStars`, which cap the stars (tier 2 → ⭐⭐, tier 3 → ⭐).
   */
  tiersBought: readonly HintTier[];
  /** A purchase is being written. */
  busy: boolean;
  /**
   * Buys (or reopens) a tier; on `opened` the caller shows it (thinking hint, the `step` in the
   * popover, the solution). Tier 2 needs `program`: the step is computed before any charge.
   */
  buy: (tier: HintTier, program?: ProgramNow) => Promise<BuyResult>;
  /** The tier-0 hint on screen (at most one, hint-engine.md §5). */
  tip: HintSelection | null;
  /** Runs tier-0 selection for `trigger`; a hit becomes `tip` and is remembered as shown. */
  evaluate: (trigger: HintTrigger, facts: HintFacts) => HintSelection | null;
  dismissTip: () => void;
}

/** Block types the child can drag in: none in parsons, where the toolbox is hidden. */
function toolboxTypes(level: Level): string[] {
  if (level.mode === 'parsons') return [];
  return level.toolbox.map((entry) => (typeof entry === 'string' ? entry : entry.type));
}

/**
 * Hint box and tier-0 hints for one level session: prices and the safety net from
 * @codequest/rewards, the purchase written through the ledger repo (atomic `spend`), the tiers
 * bought kept here for the star cap.
 */
export function useHints({
  profileId,
  level,
  session,
  onPurchased,
  now = () => new Date(),
  newPurchaseId = () => crypto.randomUUID(),
}: UseHintsOptions): Hints {
  const ledger = useLiveQuery(() => listLedger(profileId), [profileId]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [tip, setTip] = useState<HintSelection | null>(null);
  const shown = useRef(new Set<string>());
  const [tiersBought, setTiersBought] = useState<readonly HintTier[]>(() => [
    ...session.hintTiersBought,
  ]);
  const boughtRef = useRef(tiersBought);
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  });

  const record = (tier: HintTier) => {
    boughtRef.current = [...boughtRef.current, tier];
    setTiersBought(boughtRef.current);
    onPurchased?.(tier);
  };

  const buy = async (tier: HintTier, program?: ProgramNow): Promise<BuyResult> => {
    if (!availableTiers(level).includes(tier)) return { status: 'unavailable' };
    if (ledger === undefined || busyRef.current) return { status: 'busy' };
    // The step first: nothing to show means nothing to pay (and no star cap).
    let step: NextStep | null = null;
    if (tier === 2) {
      if (program === undefined || level.solution === undefined) return { status: 'error' };
      step = nextStep(level.solution, program.json, {
        toolbox: toolboxTypes(level),
        capacityLeft: program.capacityLeft,
      });
      if (step === null) return { status: 'solved', tier };
      if (step.kind === 'reset') return { status: 'reset', tier };
    }
    const opened = (): BuyResult =>
      tier === 2 && step !== null
        ? { status: 'opened', tier, step }
        : { status: 'opened', tier: tier === 1 ? 1 : 3 };
    busyRef.current = true;
    setBusy(true);
    try {
      // Fresh rows: the live query may lag behind a purchase made a moment ago.
      const rows = await listLedger(profileId);
      if (isTierOwned(tier, level.id, rows, boughtRef.current)) return opened();
      const at = now();
      const bought = buyHint({
        tier,
        level,
        session: { ...sessionRef.current, hintTiersBought: [...boughtRef.current] },
        ledger: rows,
        now: at,
        profileId,
        purchaseId: newPurchaseId(),
      });
      if (!bought.ok) return { status: 'missing', tier, missing: bought.missing };
      const { entry } = bought;
      if (entry !== null) {
        // `spend` re-checks the balance atomically; a free (delta 0) tier 1 is a plain add.
        if (entry.delta < 0) {
          const spent = await spend(entry, at);
          if (!spent.ok) return { status: 'missing', tier, missing: spent.missing };
        } else {
          await addLedgerEntries([entry], at);
        }
        record(tier);
      }
      return opened();
    } catch {
      return { status: 'error' };
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const evaluate = useCallback(
    (trigger: HintTrigger, facts: HintFacts): HintSelection | null => {
      const current = sessionRef.current;
      const last = current.runs.at(-1);
      const selection = selectHint(level, {
        ...facts,
        trigger,
        runCount: current.runs.length,
        failStreak: failStreak(current),
        lastOutcome:
          last === undefined ? null : { result: last.result, reasonCode: last.reasonCode },
        shownHintIds: shown.current,
      });
      if (selection !== null) {
        shown.current.add(selection.rule.id);
        setTip(selection);
      }
      return selection;
    },
    [level],
  );

  const dismissTip = useCallback(() => {
    setTip(null);
  }, []);

  return {
    ready: ledger !== undefined,
    balance: ledger === undefined ? 0 : Math.max(0, balance(ledger)),
    // Not memoised: the session may change in place, and this is cheap.
    tiers: ledger === undefined ? [] : tierViews(level, session, ledger, tiersBought),
    tiersBought,
    busy,
    buy,
    tip,
    evaluate,
    dismissTip,
  };
}
