import type { FeedbackFile, Level } from '@codequest/content-schema';
import type { HintSelection } from '@codequest/engine';
import { vi } from '../../i18n/vi';

/**
 * What Măng says for a tier-0 hint: the level rule's `say`, the feedback line of a global rule
 * that borrows one (`g-empty-run`, `g-timeout`), or the global rule's copy in vi.ts.
 */
export function hintText(
  selection: HintSelection,
  level: Pick<Level, 'feedback'>,
  feedback: FeedbackFile,
): string {
  if (selection.source === 'level') return selection.rule.say;
  const { id, feedbackReason } = selection.rule;
  const borrowed =
    feedbackReason === undefined
      ? undefined
      : (level.feedback?.[feedbackReason] ?? feedback[feedbackReason]);
  return borrowed ?? vi.hints.global[id];
}
