import { type Level, LevelSchema } from '@codequest/content-schema';
import { runLevel } from '@codequest/engine';
import { getGameKind } from '@codequest/games';
import { type RuleIssue, validateLevel } from '@codequest/validator';
import { draftMaps, type EditorField, isDraftWorld, issueField, levelJson } from './draft';

/** What the editor shows about the draft after every change. */
export interface DraftValidation {
  /** The level as `content:check` would read it, or null when it fails the schema. */
  level: Level | null;
  issues: RuleIssue[];
  /** Issues grouped by the field they are shown next to. */
  byField: ReadonlyMap<EditorField, readonly RuleIssue[]>;
  /** Blocks of the solution, when it could be counted. */
  solutionBlocks: number | null;
  /**
   * The draft as a level that can run even while texts, hints or predict labels are still
   * missing (placeholders), for Thử chơi and the par search; null when even that fails.
   */
  runnable: Level | null;
  /** `runnable` exists and its config fits its kind: the stage can show it (Thử chơi). */
  playable: boolean;
  /** Mode predict: the answer key of `initialWorkspace` (what the right card must say). */
  answerKey: string | null;
}

/**
 * Validates the exported form of the draft with the same per-level rules as `content:check`
 * (`validateLevel`, content-model.md §5); sandbox worlds (`_*`) are drafts there too.
 */
export function validateDraft(draft: Level): DraftValidation {
  const json = levelJson(draft);
  const result = validateLevel(json, { isDraft: isDraftWorld(draft.worldId) });
  const byField = new Map<EditorField, RuleIssue[]>();
  for (const issue of result.issues) {
    const field = issueField(issue);
    byField.set(field, [...(byField.get(field) ?? []), issue]);
  }
  const runnable = runnableLevel(json);
  const kind = runnable === null ? undefined : getGameKind(runnable.kind);
  // Every map must fit its kind (multi-map levels, P2-12): Thử chơi shows each one.
  const playable =
    runnable !== null &&
    kind !== undefined &&
    draftMaps(runnable).every((config) => kind.configSchema.safeParse(config).success);
  let answerKey: string | null = null;
  if (playable && runnable.mode === 'predict' && runnable.initialWorkspace !== undefined) {
    answerKey =
      runLevel({ kind, level: runnable, workspace: runnable.initialWorkspace }).answerKey ?? null;
  }
  return {
    level: result.level,
    issues: result.issues,
    byField,
    solutionBlocks: result.solutionBlocks,
    runnable,
    playable,
    answerKey,
  };
}

const PLACEHOLDER = '-';

/** `json` with placeholders for what only the child reads (texts, hints, predict labels). */
function runnableLevel(json: Record<string, unknown>): Level | null {
  const filled: Record<string, unknown> = { ...json, hints: [] };
  for (const key of ['id', 'title', 'objective', 'learningGoal']) {
    if (typeof filled[key] !== 'string' || filled[key] === '') filled[key] = PLACEHOLDER;
  }
  const mode = filled['mode'];
  if ((mode === 'build' || mode === 'parsons') && filled['par'] === undefined) filled['par'] = 1;
  const predict = filled['predict'] as { options?: unknown } | undefined;
  if (Array.isArray(predict?.options)) {
    filled['predict'] = {
      options: (predict.options as Array<{ key?: unknown; label?: unknown }>).map((option, i) => ({
        key: typeof option.key === 'string' && option.key !== '' ? option.key : `?${String(i + 1)}`,
        label: typeof option.label === 'string' && option.label !== '' ? option.label : PLACEHOLDER,
      })),
    };
  }
  const parsed = LevelSchema.safeParse(filled);
  return parsed.success ? parsed.data : null;
}
