/**
 * Per-level rules 5–6 (pedagogy), 12–16 (runnable modes and hints), 19 (star goals) and 20
 * (block limits) of content-model.md §5. Rules 1–2 and 9–11 live in validateLevel.ts next to
 * the solution run.
 */
import type { Condition, Level, StarGoalKind, WorkspaceJson } from '@codequest/content-schema';
import {
  blockTypeCounts,
  CQ_START,
  ENGINE_REASONS,
  loopDepth,
  editDistance,
  fnv1a,
  mulberry32,
  runLevel,
  type AnyGameKindDefinition,
} from '@codequest/engine';
import type { RuleIssue } from './issue';
import { blockSignatures, blockTypesOf, countBlocksOfType, countShadows } from './workspace';
import { countWords } from './words';

/** ui-copy-guide.md §2 and content-model.md §3. */
const MAX_OBJECTIVE_WORDS = 12;
const MAX_TITLE_WORDS = 5;
const MAX_HINT_WORDS = 12;
/** curriculum.md §5.0: the mission line is a speech bubble too. */
const MAX_MISSION_WORDS = 12;

/** Built-in Blockly loop whose number input is a shadow (blockly-integration.md §5). */
const SHADOW_REPEAT = 'controls_repeat_ext';

/**
 * content-authoring.md §3: a guided level needs at least 2 tier-0 hint rules. (Its "practice ≥ 1"
 * is not enforced: practice predict/parsons levels in the fixtures and drafts have none.)
 */
const MIN_TIER0_HINTS: Partial<Record<Level['stage'], number>> = { guided: 2 };

/** Rules 5–6: word limits, `misconception`, `thinkingHint` and enough tier-0 hints. */
export function pedagogyIssues(level: Level): RuleIssue[] {
  const issues: RuleIssue[] = [];
  const limit = (what: string, text: string, max: number): void => {
    const words = countWords(text);
    if (words > max) {
      issues.push({
        rule: 5,
        message: `${what} has ${String(words)} words > ${String(max)}: "${text}"`,
      });
    }
  };
  limit('objective', level.objective, MAX_OBJECTIVE_WORDS);
  limit('title', level.title, MAX_TITLE_WORDS);
  if (level.mission !== undefined) limit('mission', level.mission, MAX_MISSION_WORDS);
  for (const hint of level.hints) limit(`hint "${hint.id}" say`, hint.say, MAX_HINT_WORDS);

  if (
    (level.stage === 'guided' || level.stage === 'practice') &&
    level.misconception === undefined
  ) {
    issues.push({ rule: 6, message: `stage ${level.stage} needs a misconception` });
  }
  const creative = level.stage === 'creative' || level.mode === 'creative';
  if (!creative && level.thinkingHint === undefined) {
    issues.push({ rule: 6, message: 'every non-creative level needs a thinkingHint' });
  }
  const minHints = MIN_TIER0_HINTS[level.stage] ?? 0;
  if (level.hints.length < minHints) {
    issues.push({
      rule: 6,
      message: `stage ${level.stage} needs at least ${String(minHints)} tier-0 hints, has ${String(level.hints.length)}`,
    });
  }
  return issues;
}

/** Block types of the toolbox entries. */
export function toolboxTypes(level: Level): Set<string> {
  return new Set(level.toolbox.map((entry) => (typeof entry === 'string' ? entry : entry.type)));
}

/** Rule 12: no shadow blocks (and no `controls_repeat_ext`) in a level with `maxBlocks`. */
export function shadowIssues(level: Level): RuleIssue[] {
  if (level.maxBlocks === undefined) return [];
  const issues: RuleIssue[] = [];
  const workspaces: Array<[string, WorkspaceJson | undefined]> = [
    ['solution', level.solution],
    ['initialWorkspace', level.initialWorkspace],
  ];
  for (const [name, workspace] of workspaces) {
    const shadows = workspace === undefined ? 0 : countShadows(workspace);
    if (shadows > 0) {
      issues.push({
        rule: 12,
        message: `${name} has ${String(shadows)} shadow block(s) but the level sets maxBlocks`,
      });
    }
  }
  if (toolboxTypes(level).has(SHADOW_REPEAT)) {
    issues.push({
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
export function modeIssues(level: Level, kind: AnyGameKindDefinition): RuleIssue[] {
  const initial = level.initialWorkspace;
  if (initial === undefined) return [];
  const issues: RuleIssue[] = [];

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
        rule: 13,
        message: `initialWorkspace blocks differ from solution: ${parts.join('; ')}`,
      });
    }
    const outcome = runLevel({ kind, level, workspace: initial });
    if (outcome.result === 'success') {
      issues.push({ rule: 13, message: 'initialWorkspace already wins' });
    }
  }

  if (level.mode === 'bughunt' && level.solution !== undefined) {
    const outcome = runLevel({ kind, level, workspace: initial });
    if (outcome.result === 'success' || outcome.reasonCode === 'INTERNAL_ERROR') {
      issues.push({
        rule: 14,
        message: `initialWorkspace must lose, but it ends ${describeRun(outcome)}`,
      });
    }
    const edits = editDistance(initial, level.solution);
    const parEdits = level.parEdits ?? 1;
    if (edits > parEdits) {
      issues.push({
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
      issues.push({ rule: 15, message: `initialWorkspace ends ${describeRun(outcome)}` });
    } else if (matches !== 1) {
      const keys = level.predict.options.map((option) => option.key).join(', ');
      issues.push({
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

/** Whether a hint condition is about loose blocks: the play screen then prefers a loose block. */
function mentionsLooseBlocks(condition: Condition): boolean {
  if ('all' in condition) return condition.all.some(mentionsLooseBlocks);
  if ('any' in condition) return condition.any.some(mentionsLooseBlocks);
  if ('not' in condition) return false;
  return condition.orphans === true;
}

/** Modes whose given program has a fixed meaning, so each of its blocks plays its own part. */
const FIXED_PROGRAM_MODES: ReadonlySet<Level['mode']> = new Set(['predict', 'bughunt']);

/**
 * Rule 16: hint targets exist, `lastReason` codes are real, and in predict/bughunt a
 * `block:<type>` pointer is unambiguous: the play screen points at the first block of that type
 * (a program block, or a loose one for a hint about loose blocks; `hintPointer.ts`), so the
 * program shown must hold exactly one candidate.
 */
export function hintIssues(level: Level, kind: AnyGameKindDefinition): RuleIssue[] {
  const issues: RuleIssue[] = [];
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
        rule: 16,
        message: `hint "${hint.id}" points to ${point}, which is not in the toolbox`,
      });
    }
    if (point?.startsWith('block:') === true && !workspaceTypes.has(point.slice('block:'.length))) {
      issues.push({
        rule: 16,
        message: `hint "${hint.id}" points to ${point}, which is in neither initialWorkspace nor solution`,
      });
    } else if (
      point?.startsWith('block:') === true &&
      level.initialWorkspace !== undefined &&
      FIXED_PROGRAM_MODES.has(level.mode)
    ) {
      const counts = countBlocksOfType(
        level.initialWorkspace,
        point.slice('block:'.length),
        CQ_START,
      );
      const preferred = mentionsLooseBlocks(hint.when) ? counts.loose : counts.attached;
      const candidates = preferred > 0 ? preferred : counts.attached + counts.loose;
      if (candidates > 1) {
        issues.push({
          rule: 16,
          message: `hint "${hint.id}" points to ${point}, but initialWorkspace has ${String(candidates)} such blocks; the arrow lands on the first one`,
        });
      }
    }
    for (const reason of lastReasons(hint.when)) {
      if (!reasons.has(reason)) {
        issues.push({
          rule: 16,
          message: `hint "${hint.id}" waits for lastReason "${reason}", which neither the engine nor "${kind.id}" produces`,
        });
      }
    }
  }
  return issues;
}

/** Star goal kinds that a map's `config.goal.collectAll` win condition already implies. */
const IMPLIED_BY_WIN_COLLECT_ALL: ReadonlySet<StarGoalKind> = new Set(['collectAll']);

/** `goal.collectAll` of a runner or maze config: bamboo is a win condition there. */
function winNeedsAllBamboo(config: unknown): boolean {
  if (typeof config !== 'object' || config === null) return false;
  const goal: unknown = (config as Record<string, unknown>)['goal'];
  return (
    typeof goal === 'object' &&
    goal !== null &&
    (goal as Record<string, unknown>)['collectAll'] === true
  );
}

/**
 * Rule 19 (P2-21): the level's game kind can judge star goals, no goal already holds before
 * Măng moves on every map (it would reward nothing), `collectAll` is not already implied by
 * `config.goal.collectAll` on every map with bamboo, and the solution, when it wins, meets
 * every goal on every map. Needs valid configs (rule 1).
 */
export function starGoalIssues(level: Level, kind: AnyGameKindDefinition): RuleIssue[] {
  const goals = level.starGoals;
  if (goals === undefined) return [];
  const check = kind.checkStarGoal?.bind(kind);
  if (check === undefined) {
    return [{ rule: 19, message: `game kind "${kind.id}" has no star goals` }];
  }
  const issues: RuleIssue[] = [];
  const configs = [level.config, ...(level.variants ?? [])].map((raw) =>
    kind.configSchema.parse(raw),
  );
  for (const goal of goals) {
    const metAtStart = configs.map((config) =>
      check(goal, kind.createState(config, mulberry32(fnv1a(level.id))), config),
    );
    if (metAtStart.every((met) => met)) {
      issues.push({
        rule: 19,
        message: `star goal "${goal.kind}" already holds before Măng moves on every map`,
      });
    } else if (
      IMPLIED_BY_WIN_COLLECT_ALL.has(goal.kind) &&
      configs.every((config, index) => metAtStart[index] === true || winNeedsAllBamboo(config))
    ) {
      // Every map with bamboo already makes it a win condition: every win meets the goal.
      issues.push({
        rule: 19,
        message:
          'star goal "collectAll" adds nothing: config.goal.collectAll already requires every shoot to win',
      });
    }
  }
  if (level.solution !== undefined) {
    const outcome = runLevel({ kind, level, workspace: level.solution });
    if (outcome.result === 'success') {
      goals.forEach((goal, index) => {
        if (outcome.goals?.[index] === true) return;
        const missed = (outcome.maps ?? [outcome])
          .map((map, mapIndex) => (map.goals?.[index] === true ? null : mapIndex + 1))
          .filter((map) => map !== null);
        const where = outcome.maps === undefined ? '' : ` on map ${missed.map(String).join(', ')}`;
        issues.push({
          rule: 19,
          message: `solution wins but misses star goal "${goal.kind}"${where}`,
        });
      });
    }
  }
  return issues;
}

/**
 * Rule 20 (P2-11, curriculum.md §5.4 T16b): `solution` and `initialWorkspace` stay within the
 * level's block limits, `maxLoopDepth` (loops nested inside loops, `loopDepth`) and
 * `maxInstances` (blocks of one type, loose ones included, as Blockly counts them). Otherwise
 * the child could never build the solution, or is handed a program the editor would refuse.
 */
export function limitIssues(level: Level): RuleIssue[] {
  const issues: RuleIssue[] = [];
  const workspaces: Array<[string, WorkspaceJson | undefined]> = [
    ['solution', level.solution],
    ['initialWorkspace', level.initialWorkspace],
  ];
  for (const [name, workspace] of workspaces) {
    if (workspace === undefined) continue;
    const depth = loopDepth(workspace);
    if (level.maxLoopDepth !== undefined && depth > level.maxLoopDepth) {
      issues.push({
        rule: 20,
        message: `${name} nests loops ${String(depth)} deep > maxLoopDepth ${String(level.maxLoopDepth)}`,
      });
    }
    const counts = blockTypeCounts(workspace);
    for (const [type, max] of Object.entries(level.maxInstances ?? {})) {
      const used = counts.get(type) ?? 0;
      if (used > max) {
        issues.push({
          rule: 20,
          message: `${name} has ${String(used)} "${type}" > maxInstances ${String(max)}`,
        });
      }
    }
  }
  return issues;
}

/**
 * Rule 1 (level fields that fit together, P2-11c): a `cage` goal is opened by a key, so every
 * map of a level drawn with `goalSprite: "cage"` needs a `key` mission item
 * (`config.goal.items`); otherwise the stage would show a cage nothing can open.
 */
export function goalSpriteIssues(level: Level): RuleIssue[] {
  if (level.goalSprite !== 'cage') return [];
  const issues: RuleIssue[] = [];
  const maps: unknown[] = [level.config, ...(level.variants ?? [])];
  maps.forEach((config, index) => {
    const goal = isRecord(config) ? config['goal'] : undefined;
    const items = isRecord(goal) ? goal['items'] : undefined;
    const hasKey =
      Array.isArray(items) && items.some((item) => isRecord(item) && item['kind'] === 'key');
    if (!hasKey) {
      issues.push({
        rule: 1,
        message: `goalSprite: "cage" needs a "key" item in config.goal.items on map ${String(index + 1)}`,
      });
    }
  });
  return issues;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
