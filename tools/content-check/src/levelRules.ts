/**
 * Per-level rules 5–6 (pedagogy) and 12–16 (runnable modes and hints) of content-model.md §5.
 * Rules 9–11 live in rules.ts next to the solution run.
 */
import type { Condition, Level, WorkspaceJson } from '@codequest/content-schema';
import {
  ENGINE_REASONS,
  editDistance,
  runLevel,
  type AnyGameKindDefinition,
} from '@codequest/engine';
import type { Issue } from './rules';
import { blockSignatures, blockTypesOf, countShadows } from './workspace';
import { countWords } from './words';

/** ui-copy-guide.md §2 and content-model.md §3. */
const MAX_OBJECTIVE_WORDS = 12;
const MAX_TITLE_WORDS = 5;
const MAX_HINT_WORDS = 12;

/** Built-in Blockly loop whose number input is a shadow (blockly-integration.md §5). */
const SHADOW_REPEAT = 'controls_repeat_ext';

/** Rules 5–6: word limits, `misconception` and `thinkingHint`. */
export function pedagogyIssues(path: string, level: Level): Issue[] {
  const issues: Issue[] = [];
  const limit = (what: string, text: string, max: number): void => {
    const words = countWords(text);
    if (words > max) {
      issues.push({
        path,
        rule: 5,
        message: `${what} has ${String(words)} words > ${String(max)}: "${text}"`,
      });
    }
  };
  limit('objective', level.objective, MAX_OBJECTIVE_WORDS);
  limit('title', level.title, MAX_TITLE_WORDS);
  for (const hint of level.hints) limit(`hint "${hint.id}" say`, hint.say, MAX_HINT_WORDS);

  if (
    (level.stage === 'guided' || level.stage === 'practice') &&
    level.misconception === undefined
  ) {
    issues.push({ path, rule: 6, message: `stage ${level.stage} needs a misconception` });
  }
  const creative = level.stage === 'creative' || level.mode === 'creative';
  if (!creative && level.thinkingHint === undefined) {
    issues.push({ path, rule: 6, message: 'every non-creative level needs a thinkingHint' });
  }
  return issues;
}

/** Block types of the toolbox entries. */
export function toolboxTypes(level: Level): Set<string> {
  return new Set(level.toolbox.map((entry) => (typeof entry === 'string' ? entry : entry.type)));
}

/** Rule 12: no shadow blocks (and no `controls_repeat_ext`) in a level with `maxBlocks`. */
export function shadowIssues(path: string, level: Level): Issue[] {
  if (level.maxBlocks === undefined) return [];
  const issues: Issue[] = [];
  const workspaces: Array<[string, WorkspaceJson | undefined]> = [
    ['solution', level.solution],
    ['initialWorkspace', level.initialWorkspace],
  ];
  for (const [name, workspace] of workspaces) {
    const shadows = workspace === undefined ? 0 : countShadows(workspace);
    if (shadows > 0) {
      issues.push({
        path,
        rule: 12,
        message: `${name} has ${String(shadows)} shadow block(s) but the level sets maxBlocks`,
      });
    }
  }
  if (toolboxTypes(level).has(SHADOW_REPEAT)) {
    issues.push({
      path,
      rule: 12,
      message: `toolbox has "${SHADOW_REPEAT}" but the level sets maxBlocks; use "cq_repeat"`,
    });
  }
  return issues;
}

function describeRun(outcome: ReturnType<typeof runLevel>): string {
  return [outcome.result, outcome.reasonCode, outcome.debug?.message]
    .filter((part) => part !== null && part !== undefined)
    .join(' ');
}

function multisetDiff(a: Map<string, number>, b: Map<string, number>): string[] {
  const out: string[] = [];
  for (const [signature, count] of a) {
    const extra = count - (b.get(signature) ?? 0);
    if (extra > 0) out.push(extra === 1 ? signature : `${signature} ×${String(extra)}`);
  }
  return out;
}

/** Rules 13–15: what each special mode needs from `initialWorkspace`. */
export function modeIssues(path: string, level: Level, kind: AnyGameKindDefinition): Issue[] {
  const initial = level.initialWorkspace;
  if (initial === undefined) return [];
  const issues: Issue[] = [];

  if (level.mode === 'parsons' && level.solution !== undefined) {
    const given = blockSignatures(initial);
    const wanted = blockSignatures(level.solution);
    const missing = multisetDiff(wanted, given);
    const extra = multisetDiff(given, wanted);
    if (missing.length > 0 || extra.length > 0) {
      const parts = [
        missing.length > 0 ? `missing ${missing.join(', ')}` : null,
        extra.length > 0 ? `extra ${extra.join(', ')}` : null,
      ].filter((part) => part !== null);
      issues.push({
        path,
        rule: 13,
        message: `initialWorkspace blocks differ from solution: ${parts.join('; ')}`,
      });
    }
    const outcome = runLevel({ kind, level, workspace: initial });
    if (outcome.result === 'success') {
      issues.push({ path, rule: 13, message: 'initialWorkspace already wins' });
    }
  }

  if (level.mode === 'bughunt' && level.solution !== undefined) {
    const outcome = runLevel({ kind, level, workspace: initial });
    if (outcome.result === 'success' || outcome.reasonCode === 'INTERNAL_ERROR') {
      issues.push({
        path,
        rule: 14,
        message: `initialWorkspace must lose, but it ends ${describeRun(outcome)}`,
      });
    }
    const edits = editDistance(initial, level.solution);
    const parEdits = level.parEdits ?? 1;
    if (edits > parEdits) {
      issues.push({
        path,
        rule: 14,
        message: `editDistance(initialWorkspace, solution) is ${String(edits)} > parEdits ${String(parEdits)}`,
      });
    }
  }

  if (level.mode === 'predict' && level.predict !== undefined) {
    const outcome = runLevel({ kind, level, workspace: initial });
    const key = outcome.answerKey;
    const matches = level.predict.options.filter((option) => option.key === key).length;
    if (key === undefined || outcome.reasonCode === 'INTERNAL_ERROR') {
      issues.push({ path, rule: 15, message: `initialWorkspace ends ${describeRun(outcome)}` });
    } else if (matches !== 1) {
      const keys = level.predict.options.map((option) => option.key).join(', ');
      issues.push({
        path,
        rule: 15,
        message: `answerKey "${key}" matches ${String(matches)} options (${keys}); expected exactly 1`,
      });
    }
    // 3–4 options with unique keys is already enforced by LevelSchema (rule 1).
  }

  return issues;
}

/** Every `lastReason` in a hint condition, nested `all`/`any`/`not` included. */
function lastReasons(condition: Condition): string[] {
  if ('all' in condition) return condition.all.flatMap(lastReasons);
  if ('any' in condition) return condition.any.flatMap(lastReasons);
  if ('not' in condition) return lastReasons(condition.not);
  return condition.lastReason === undefined ? [] : [condition.lastReason];
}

/** Rule 16: hint targets exist and `lastReason` codes are real. */
export function hintIssues(path: string, level: Level, kind: AnyGameKindDefinition): Issue[] {
  const issues: Issue[] = [];
  const toolbox = toolboxTypes(level);
  const workspaceTypes = new Set([
    ...(level.initialWorkspace === undefined ? [] : blockTypesOf(level.initialWorkspace)),
    ...(level.solution === undefined ? [] : blockTypesOf(level.solution)),
  ]);
  const reasons = new Set<string>([...ENGINE_REASONS, ...kind.reasonCodes]);
  for (const hint of level.hints) {
    const point = hint.point;
    if (point?.startsWith('toolbox:') === true && !toolbox.has(point.slice('toolbox:'.length))) {
      issues.push({
        path,
        rule: 16,
        message: `hint "${hint.id}" points to ${point}, which is not in the toolbox`,
      });
    }
    if (point?.startsWith('block:') === true && !workspaceTypes.has(point.slice('block:'.length))) {
      issues.push({
        path,
        rule: 16,
        message: `hint "${hint.id}" points to ${point}, which is in neither initialWorkspace nor solution`,
      });
    }
    for (const reason of lastReasons(hint.when)) {
      if (!reasons.has(reason)) {
        issues.push({
          path,
          rule: 16,
          message: `hint "${hint.id}" waits for lastReason "${reason}", which neither the engine nor "${kind.id}" produces`,
        });
      }
    }
  }
  return issues;
}
