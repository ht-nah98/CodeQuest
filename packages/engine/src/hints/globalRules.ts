import type { Condition, HintTarget, Level } from '@codequest/content-schema';
import type { HintContext } from './context';

/** The parts of a level that hint selection reads. */
export type HintLevel = Pick<Level, 'mode' | 'toolbox' | 'hints'> & {
  thinkingHint?: string | undefined;
};

/** Ids of the rules shared by every level (hint-engine.md §4). */
export const GLOBAL_HINT_IDS = [
  'g-empty-enter',
  'g-parsons-enter',
  'g-orphans',
  'g-empty-run',
  'g-timeout',
  'g-idle',
  'g-fail3',
] as const;
export type GlobalHintId = (typeof GLOBAL_HINT_IDS)[number];

/**
 * A rule shared by every level. It carries no text: the UI says the copy of `id` (vi.ts), or
 * the feedback line of `feedbackReason` when set, so the engine stays free of Vietnamese copy.
 */
export interface GlobalHintRule {
  id: GlobalHintId;
  when: Condition;
  point?: HintTarget;
  /** Say the feedback line of this reason code instead of the rule's own copy. */
  feedbackReason?: string;
  spotlight?: boolean;
  once?: boolean;
  priority?: number;
}

function toolboxType(entry: Level['toolbox'][number] | undefined): string | undefined {
  return typeof entry === 'string' ? entry : entry?.type;
}

/**
 * The global rules that apply to `level` in this context, in declaration order. Mode-specific
 * rules are filtered here because the condition grammar cannot see the level's mode.
 */
export function globalRules(level: HintLevel, ctx: HintContext): GlobalHintRule[] {
  const rules: GlobalHintRule[] = [];
  const firstToolboxType = toolboxType(level.toolbox[0]);
  if (level.mode === 'build' && ctx.isFirstOfModeInWorld && firstToolboxType !== undefined) {
    rules.push({
      id: 'g-empty-enter',
      when: { trigger: 'enter', blockCount: { eq: 0 } },
      point: `toolbox:${firstToolboxType}`,
    });
  }
  if (level.mode === 'parsons' && !ctx.seenModes.has('parsons')) {
    rules.push({ id: 'g-parsons-enter', when: { trigger: 'enter' }, point: 'block:cq_start' });
  }
  rules.push(
    { id: 'g-orphans', when: { orphans: true, trigger: 'run-end' } },
    {
      id: 'g-empty-run',
      when: { trigger: 'run-end', lastReason: 'EMPTY_PROGRAM' },
      feedbackReason: 'EMPTY_PROGRAM',
      // screens-and-flows.md §5: an empty run points at the toolbox.
      ...(level.mode === 'build' &&
        firstToolboxType !== undefined && { point: `toolbox:${firstToolboxType}` as const }),
    },
    {
      id: 'g-timeout',
      when: { trigger: 'run-end', lastResult: 'timeout' },
      feedbackReason: 'TIMEOUT',
    },
    { id: 'g-idle', when: { idleSeconds: { gte: 60 }, runCount: { eq: 0 } }, point: 'run' },
  );
  // Tier 1 is the thinking hint; a level without one has nothing free to offer.
  if (level.thinkingHint !== undefined) {
    rules.push({ id: 'g-fail3', when: { trigger: 'run-end', failStreak: { gte: 3 } } });
  }
  return rules;
}
