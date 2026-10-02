import type { HintTrigger, LevelMode, RunResult } from '@codequest/content-schema';
import type { WorkspaceAnalysis } from '../run/analyzeWorkspace';

/** Everything a tier-0 hint rule can look at (hint-engine.md §2). Built by the UI. */
export interface HintContext {
  analysis: WorkspaceAnalysis;
  /** `workspace.remainingCapacity()`; `Infinity` for a level without `maxBlocks`. */
  capacityLeft: number;
  lastOutcome: { result: RunResult; reasonCode: string | null } | null;
  /** Runs in this level session. */
  runCount: number;
  /** Failed runs in a row (`failStreak` of @codequest/rewards; `error` runs do not count). */
  failStreak: number;
  /** Time since the child last touched the workspace or a button. */
  idleMs: number;
  /** Ids of hints already shown in this level session (level and global ids). */
  shownHintIds: ReadonlySet<string>;
  /** This level is the first of its mode in its world. */
  isFirstOfModeInWorld: boolean;
  /** Modes the child has played before (from progress). */
  seenModes: ReadonlySet<LevelMode>;
  trigger: HintTrigger;
}
