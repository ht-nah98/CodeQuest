import { useCallback, useState } from 'react';
import type { Workspace } from 'blockly';
import type { LevelVariable } from '@codequest/content-schema';
import { CQ_VAR_COMPARE, type VarEvent } from '@codequest/engine';
import {
  applyCountVerdict,
  applyVarCompare,
  applyVarEvent,
  varBoxesAt,
  type VarBoxesState,
  varOpOfBlockType,
} from '../../features/play/varBoxes';

/** What the panel needs to know about a block of the program on screen. */
export interface BoxBlockInfo {
  type: string;
  /** The box its `VAR` field names, if it has one. */
  varId: string | undefined;
}

/** Reads block `blockId` of `workspace` for the panel (undefined when it is not there). */
export function boxBlockInfo(
  workspace: Workspace | null,
  blockId: string,
): BoxBlockInfo | undefined {
  const block = workspace?.getBlockById(blockId);
  if (!block) return undefined;
  const value: unknown = block.getField('VAR')?.getValue();
  return { type: block.type, varId: typeof value === 'string' ? value : undefined };
}

export interface VarBoxesControl {
  state: VarBoxesState;
  /** Back to each box's `start` on map `mapIndex` (Làm lại, a map switch, every run's start). */
  reset: (mapIndex: number) => void;
  /** The replay's `onVar` hook: one box change. */
  onVar: (event: VarEvent) => void;
  /**
   * A question block was answered (the replay's `onSense`): a `cq_var_compare` lights ✔ / ✘ on
   * the box it asks about; other questions change nothing.
   */
  onAsked: (blockId: string, value: boolean) => void;
  /** End of a counted run: ✔ or "cần N" on box `id` (`countGoal.equals` of the map shown). */
  showVerdict: (id: string, need: number) => void;
}

/** Content key of a box list: the same boxes in a new array are the same list. */
const keyOf = (variables: readonly LevelVariable[] | undefined): string =>
  JSON.stringify(variables ?? null);

/**
 * The box panel's state for a level or lesson demo with `variables` (ADR-0022 §6). `blockInfo`
 * reads a block of the workspace on screen: its type tells `đặt` from `tăng`, and a question's
 * `VAR` field which box it asks about.
 */
export function useVarBoxes(
  variables: readonly LevelVariable[] | undefined,
  blockInfo: (blockId: string) => BoxBlockInfo | undefined,
): VarBoxesControl {
  const [state, setState] = useState(() => varBoxesAt(variables, 0));
  // Compared by content: an inline array with the same boxes neither resets the panel nor
  // changes `reset` (which a stage effect depends on).
  const [boxes, setBoxes] = useState({ key: keyOf(variables), variables });
  const key = keyOf(variables);
  if (boxes.key !== key) {
    setBoxes({ key, variables });
    setState(varBoxesAt(variables, 0));
  }
  const declared = boxes.variables;
  const reset = useCallback(
    (mapIndex: number) => {
      setState(varBoxesAt(declared, mapIndex));
    },
    [declared],
  );
  const onVar = useCallback(
    (event: VarEvent) => {
      const type = event.blockId === null ? undefined : blockInfo(event.blockId)?.type;
      setState((current) => applyVarEvent(current, event, varOpOfBlockType(type)));
    },
    [blockInfo],
  );
  const onAsked = useCallback(
    (blockId: string, value: boolean) => {
      const info = blockInfo(blockId);
      if (info?.type !== CQ_VAR_COMPARE || info.varId === undefined) return;
      const id = info.varId;
      setState((current) => applyVarCompare(current, id, value));
    },
    [blockInfo],
  );
  const showVerdict = useCallback((id: string, need: number) => {
    setState((current) => applyCountVerdict(current, id, need));
  }, []);
  return { state, reset, onVar, onAsked, showVerdict };
}
