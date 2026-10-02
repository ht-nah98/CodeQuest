import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Gesture, type WorkspaceSvg } from 'blockly';
import type {
  Condition,
  FeedbackFile,
  HintTrigger,
  Level,
  LevelMode,
} from '@codequest/content-schema';
import type { HintSelection } from '@codequest/engine';
import type { HintTier, LedgerEntry, LevelSession } from '@codequest/rewards';
import { feedbackVoiceId, hintVoiceId, uiVoiceId } from '../../audio';
import type { WorkspaceHandle } from '../../blockly/BlocklyWorkspace';
import { startContentHighlight } from '../../blockly/contentHighlight';
import { hintTargetBlock, pointAtBlock, pointAtElement } from '../../blockly/hintPointer';
import { type NextStepPopover, showNextStepPopover } from '../../blockly/nextStepPopover';
import { availableTiers, hintText, type Hints, useHints } from '../../features/hints';

/** A line in Măng's bubble with its voice id (content-model.md §2), when it has one. */
export interface PlayLine {
  text: string;
  voiceId?: string | undefined;
}

/** Wait after a change before a `change` hint, and after a replay before a `run-end` hint (hint-engine.md §5). */
export const CHANGE_DEBOUNCE_MS = 600;
export const RUN_END_DELAY_MS = 1500;
export const IDLE_MS = 60_000;
const IDLE_CHECK_MS = 5_000;

export type HintNotice = 'error' | 'solved' | 'reset' | null;

export interface PlayHintsOptions {
  profileId: string;
  level: Level;
  feedback: FeedbackFile;
  /** `usePlaySession().snapshot().session`, read on every render. */
  session: LevelSession;
  recordHintBought: (tier: HintTier, entry?: LedgerEntry | null) => void;
  workspaceRef: RefObject<WorkspaceSvg | null>;
  handleRef: RefObject<WorkspaceHandle | null>;
  /** The play screen; run button, capacity bar and stage carry `data-hint-anchor`. */
  rootRef: RefObject<HTMLElement | null>;
  isFirstOfModeInWorld: boolean;
  seenModes: ReadonlySet<LevelMode>;
  /** Puts a tier-0 hint in Măng's bubble (without clearing the hint pointer). */
  showTip: (line: PlayLine) => void;
  /** The bubble's current text: a tip that repeats it adds nothing. */
  currentText: () => string;
  /** Tips wait while a replay runs or the results are up. */
  canTip: () => boolean;
}

export interface PlayHints {
  hints: Hints;
  /** The level has tiers to buy (none in creative; tier 1 only in predict). */
  available: boolean;
  boxOpen: boolean;
  openBox: () => void;
  closeBox: () => void;
  thinkingShown: boolean;
  notice: HintNotice;
  solutionOpen: boolean;
  closeSolution: () => void;
  buy: (tier: HintTier) => void;
  /** Tier-0 triggers. */
  entered: () => void;
  changed: () => void;
  runEnded: () => void;
  /** Removes the tip's arrow / ring / spotlight (the bubble moved on). */
  clearTip: () => void;
}

function mentionsLooseBlocks(cond: Condition): boolean {
  if ('all' in cond) return cond.all.some(mentionsLooseBlocks);
  if ('any' in cond) return cond.any.some(mentionsLooseBlocks);
  if ('not' in cond) return false;
  return cond.orphans === true;
}

/** Hint box, tier-2 popover, tier-3 solution and tier-0 tips of one play session. */
export function usePlayHints(options: PlayHintsOptions): PlayHints {
  const { profileId, level, feedback, session, recordHintBought } = options;
  const opts = useRef(options);
  useEffect(() => {
    opts.current = options;
  });
  const hints = useHints({ profileId, level, session, onPurchased: recordHintBought });
  const [boxOpen, setBoxOpen] = useState(false);
  const [thinkingShown, setThinkingShown] = useState(false);
  const [notice, setNotice] = useState<HintNotice>(null);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const popoverRef = useRef<NextStepPopover | null>(null);
  const tipCleanup = useRef<Array<() => void>>([]);
  const timers = useRef<{ change?: number; runEnd?: number }>({});
  /** Last touch, key or change (ms since epoch); set on mount. */
  const lastActivity = useRef(0);
  const idleShown = useRef(false);

  const clearTip = useCallback(() => {
    for (const cleanup of tipCleanup.current) cleanup();
    tipCleanup.current = [];
  }, []);

  const { evaluate, dismissTip } = hints;
  const lineOf = useCallback(
    (selection: HintSelection): PlayLine => {
      const text = hintText(selection, level, feedback);
      if (selection.source === 'level')
        return { text, voiceId: hintVoiceId(level.id, selection.rule.id) };
      const reason = selection.rule.feedbackReason;
      if (reason !== undefined) {
        const own = level.feedback?.[reason] !== undefined ? level.id : undefined;
        return { text, voiceId: feedbackVoiceId(reason, own) };
      }
      return { text, voiceId: uiVoiceId(`hints.global.${selection.rule.id}`) };
    },
    [level, feedback],
  );

  const point = useCallback(
    (selection: HintSelection) => {
      const { workspaceRef, rootRef } = opts.current;
      const workspace = workspaceRef.current;
      const target = selection.target;
      const anchor =
        target === 'run' || target === 'capacity' || target === 'stage'
          ? rootRef.current?.querySelector<HTMLElement>(`[data-hint-anchor="${target}"]`)
          : null;
      if (anchor) tipCleanup.current.push(pointAtElement(anchor));
      if (workspace && !anchor) {
        const block = hintTargetBlock(workspace, target, {
          parsons: level.mode === 'parsons',
          preferLoose: mentionsLooseBlocks(selection.rule.when),
        });
        if (block) tipCleanup.current.push(pointAtBlock(workspace, block));
        // Dim around the program for the first levels' new-block hints (P1-07).
        if (selection.rule.spotlight === true && level.stage === 'guided') {
          tipCleanup.current.push(startContentHighlight(workspace));
        }
      }
    },
    [level],
  );

  const tip = useCallback(
    (trigger: HintTrigger, idleMs = Date.now() - lastActivity.current) => {
      const { handleRef, canTip, showTip, currentText, isFirstOfModeInWorld, seenModes } =
        opts.current;
      const handle = handleRef.current;
      if (!handle || !canTip()) return;
      const state = handle.getState();
      const selection = evaluate(trigger, {
        analysis: state.analysis,
        capacityLeft: state.remainingCapacity ?? Infinity,
        idleMs,
        isFirstOfModeInWorld,
        seenModes,
      });
      if (selection === null) return;
      const line = lineOf(selection);
      clearTip();
      if (line.text !== currentText()) showTip(line);
      point(selection);
      dismissTip();
    },
    [evaluate, dismissTip, lineOf, point, clearTip],
  );

  const changed = useCallback(() => {
    lastActivity.current = Date.now();
    idleShown.current = false;
    window.clearTimeout(timers.current.change);
    const fire = () => {
      // Never while a block is being dragged (hint-engine.md §5): try again a bit later.
      if (Gesture.inProgress()) {
        timers.current.change = window.setTimeout(fire, CHANGE_DEBOUNCE_MS);
        return;
      }
      tip('change');
    };
    timers.current.change = window.setTimeout(fire, CHANGE_DEBOUNCE_MS);
  }, [tip]);

  const runEnded = useCallback(() => {
    lastActivity.current = Date.now();
    window.clearTimeout(timers.current.runEnd);
    // The feedback line shows first; the hint comes after it (hint-engine.md §4).
    timers.current.runEnd = window.setTimeout(() => {
      tip('run-end');
    }, RUN_END_DELAY_MS);
  }, [tip]);

  const entered = useCallback(() => {
    tip('enter');
  }, [tip]);

  // Idle: 60 s without a touch, a key or a change; once until the child acts again.
  useEffect(() => {
    const touch = () => {
      lastActivity.current = Date.now();
      idleShown.current = false;
    };
    touch();
    window.addEventListener('pointerdown', touch, true);
    window.addEventListener('keydown', touch, true);
    const check = window.setInterval(() => {
      const idleMs = Date.now() - lastActivity.current;
      if (idleShown.current || idleMs < IDLE_MS) return;
      idleShown.current = true;
      tip('idle', idleMs);
    }, IDLE_CHECK_MS);
    const pending = timers.current;
    return () => {
      window.removeEventListener('pointerdown', touch, true);
      window.removeEventListener('keydown', touch, true);
      window.clearInterval(check);
      window.clearTimeout(pending.change);
      window.clearTimeout(pending.runEnd);
    };
  }, [tip]);

  // Leaving the level: no popover or pointer left on a disposed workspace.
  useEffect(
    () => () => {
      popoverRef.current?.close();
      clearTip();
    },
    [clearTip],
  );

  const buy = useCallback(
    (tier: HintTier) => {
      setNotice(null);
      const handle = opts.current.handleRef.current;
      let program;
      if (tier === 2 && handle) {
        // Read now, not the debounced report: the child may have just dropped a block.
        const state = handle.getState();
        program = { json: state.json, capacityLeft: state.remainingCapacity ?? Infinity };
      }
      void hints.buy(tier, program).then((result) => {
        switch (result.status) {
          case 'opened':
            if (result.tier === 1) {
              setThinkingShown(true);
            } else if (result.tier === 2) {
              setBoxOpen(false);
              const workspace = opts.current.workspaceRef.current;
              popoverRef.current?.close();
              if (workspace) {
                const popover = showNextStepPopover(workspace, result.step, {
                  onClose: () => {
                    if (popoverRef.current === popover) popoverRef.current = null;
                  },
                });
                popoverRef.current = popover;
              }
            } else {
              setBoxOpen(false);
              setSolutionOpen(true);
            }
            break;
          case 'solved':
          case 'reset':
            setNotice(result.status);
            break;
          case 'error':
            setNotice('error');
            break;
          default:
            break;
        }
      });
    },
    [hints],
  );

  const available = availableTiers(level).length > 0;
  return {
    hints,
    available,
    boxOpen,
    openBox: useCallback(() => {
      setNotice(null);
      popoverRef.current?.close();
      setBoxOpen(true);
    }, []),
    closeBox: useCallback(() => {
      setBoxOpen(false);
    }, []),
    thinkingShown,
    notice,
    solutionOpen,
    closeSolution: useCallback(() => {
      setSolutionOpen(false);
    }, []),
    buy,
    entered,
    changed,
    runEnded,
    clearTip,
  };
}
