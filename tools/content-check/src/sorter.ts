/**
 * Rule 27 of content-model.md §5 (P5-02, ADR-0025 §7): what a sorter ("Kệ sách") level needs
 * beyond its config schema (rule 1) and the generic run rules (9–16), on every map:
 * (a) `sorted`: no two books with the same number, and no shelf already in order;
 * (b) `find`: the number to find is on the shelf;
 * (c) `maxQuestions` ≥ the book questions the solution asks (S2: a looser budget warns);
 * (d) every `sorter_book_is` of the toolbox pins `OP` and `NUM` (the search tries pinned values).
 * Plus the authoring traps S1 / S2 (`SORTER_TRAPS`, warnings of rule 24 like turtle's T1).
 */
import type { Level, ToolboxEntry, WorkspaceJson } from '@codequest/content-schema';
import { runLevel, type GameEvent, type RunOutcome } from '@codequest/engine';
import { getGameKind, isSorted, sorterConfigSchema, type SorterConfig } from '@codequest/games';
import type { Issue } from './rules';

const RULE = 27;
const QUESTION_TYPES: ReadonlySet<string> = new Set(['sorter_book_is', 'sorter_bigger']);

// ---- Short programs ----------------------------------------------------------------------------

type ShortBlock = Record<string, unknown>;

/**
 * Blocks of a shelf program written short, as in curriculum.md §6.5:
 * `R` sang phải · `S` về đầu kệ · `W` đổi chỗ · `REP<n>[…]` lặp · `IF<q>[…]` nếu ·
 * `UNTIL<q>[…]` lặp đến khi · `ADD:<box>` tăng hộp thêm 1 · `SET:<box>=<n>` đặt hộp.
 * Questions `<q>`: `B` sách này lớn hơn bên phải? · `E` hết kệ? · `=7`, `>5`, `<3` sách này …?
 * Example: `REP4[S REP4[IFB[W] R]]`.
 */
export function sorterProgram(source: string): WorkspaceJson {
  const pattern =
    /REP\d+\[|IF(?:B|E|[=<>]\d)\[|UNTIL(?:B|E|[=<>]\d)\[|ADD:[a-z_]+|SET:[a-z_]+=\d+|\]|[RSW]/g;
  const tokens = source.match(pattern) ?? [];
  // Every character must belong to a token (spaces aside), and brackets must balance.
  const rest = source.replace(pattern, '').replace(/\s+/g, '');
  if (rest !== '') throw new Error(`sorterProgram: unknown text "${rest}" in "${source}"`);
  let depth = 0;
  for (const token of tokens) {
    depth += token.endsWith('[') ? 1 : token === ']' ? -1 : 0;
    if (depth < 0) break;
  }
  if (depth !== 0) throw new Error(`sorterProgram: unbalanced brackets in "${source}"`);
  let at = 0;
  let next = 0;
  const id = (prefix: string): string => `${prefix}${String(++next)}`;
  const question = (text: string): ShortBlock => {
    if (text === 'B') return { type: 'sorter_bigger', id: id('b') };
    if (text === 'E') return { type: 'sorter_at_end', id: id('e') };
    const op = { '=': 'EQ', '>': 'GT', '<': 'LT' }[text[0] ?? '='] ?? 'EQ';
    return { type: 'sorter_book_is', id: id('q'), fields: { OP: op, NUM: Number(text.slice(1)) } };
  };
  const sequence = (): ShortBlock[] => {
    const blocks: ShortBlock[] = [];
    while (at < tokens.length && tokens[at] !== ']') {
      const token = tokens[at++] ?? '';
      const nested = (): Record<string, unknown> => {
        const inner = chained(sequence());
        at++; // ']'
        return inner === undefined ? {} : { DO: { block: inner } };
      };
      if (token.startsWith('REP')) {
        const times = Number(token.slice(3, -1));
        blocks.push({
          type: 'cq_repeat',
          id: id('loop'),
          fields: { TIMES: times },
          inputs: nested(),
        });
      } else if (token.startsWith('IF') || token.startsWith('UNTIL')) {
        const type = token.startsWith('IF') ? 'cq_if' : 'cq_repeat_until';
        const cond = question(token.replace(/^(IF|UNTIL)/, '').slice(0, -1));
        blocks.push({ type, id: id('c'), inputs: { COND: { block: cond }, ...nested() } });
      } else if (token.startsWith('ADD:')) {
        blocks.push({ type: 'cq_var_add', id: id('v'), fields: { VAR: token.slice(4), NUM: 1 } });
      } else if (token.startsWith('SET:')) {
        const [box = '', n = '0'] = token.slice(4).split('=');
        blocks.push({ type: 'cq_var_set', id: id('v'), fields: { VAR: box, NUM: Number(n) } });
      } else {
        const type = { R: 'sorter_right', S: 'sorter_to_start', W: 'sorter_swap' }[token];
        if (type !== undefined) blocks.push({ type, id: id('a') });
      }
    }
    return blocks;
  };
  const first = chained(sequence());
  const start = {
    type: 'cq_start',
    id: 'start',
    ...(first !== undefined && { next: { block: first } }),
  };
  return { blocks: { languageVersion: 0, blocks: [start] } };
}

function chained(blocks: readonly ShortBlock[]): ShortBlock | undefined {
  let first: ShortBlock | undefined;
  for (const block of [...blocks].reverse()) {
    first = first === undefined ? block : { ...block, next: { block: first } };
  }
  return first;
}

// ---- Rule 27 -----------------------------------------------------------------------------------

/** Ids of the book question blocks of a workspace (they cost a question; `hết kệ?` does not). */
function questionIds(workspace: WorkspaceJson): Set<string> {
  const found = new Set<string>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (typeof value !== 'object' || value === null) return;
    const record = value as Record<string, unknown>;
    if (QUESTION_TYPES.has(String(record['type'])) && typeof record['id'] === 'string') {
      found.add(record['id']);
    }
    for (const child of Object.values(record)) visit(child);
  };
  visit(workspace.blocks.blocks);
  return found;
}

/** Book questions each map's run asked, from its `sense` events. */
export function questionsPerMap(outcome: RunOutcome, workspace: WorkspaceJson): number[] {
  const ids = questionIds(workspace);
  const count = (events: ReadonlyArray<GameEvent>): number =>
    events.filter((event) => event.type === 'sense' && ids.has(event.blockId ?? '')).length;
  return (outcome.maps ?? [outcome]).map((map) => count(map.events));
}

function toolboxIssues(toolbox: readonly ToolboxEntry[]): string[] {
  return toolbox.flatMap((entry, index) => {
    if (typeof entry === 'string') {
      return entry === 'sorter_book_is'
        ? [`toolbox[${String(index)}] sorter_book_is must pin OP and NUM`]
        : [];
    }
    if (entry.type !== 'sorter_book_is') return [];
    const fields = entry.fields ?? {};
    return 'OP' in fields && 'NUM' in fields
      ? []
      : [`toolbox[${String(index)}] sorter_book_is must pin OP and NUM`];
  });
}

/** Rule 27 errors and warnings of one schema-valid level (none for other kinds). */
function rule27(path: string, level: Level): { errors: Issue[]; warnings: Issue[] } {
  const none = { errors: [], warnings: [] };
  if (level.kind !== 'sorter') return none;
  const maps: SorterConfig[] = [];
  for (const raw of [level.config, ...(level.variants ?? [])]) {
    const parsed = sorterConfigSchema.safeParse(raw);
    if (!parsed.success) return none; // rule 1 reports it
    maps.push(parsed.data);
  }
  const problems: string[] = [];
  const notes: string[] = [];
  maps.forEach((config, index) => {
    const map = index === 0 ? 'config' : `variants[${String(index - 1)}]`;
    const { books, goal } = config;
    if (goal.sorted === true) {
      if (new Set(books).size !== books.length) {
        problems.push(`${map}: a shelf to sort has two books with the same number (S3)`);
      }
      if (isSorted(books)) problems.push(`${map}: the shelf is already sorted`);
    }
    if (goal.find !== undefined && !books.includes(goal.find)) {
      problems.push(`${map}: book ${String(goal.find)} to find is not on the shelf`);
    }
  });
  // (e) S1: after sorting, the book to find must stand at different places on the maps, else
  // `lặp k {sang phải}` replaces the search.
  if (
    maps.length > 1 &&
    maps.every((config) => config.goal.sorted === true && config.goal.find !== undefined)
  ) {
    const places = maps.map(
      (config) => [...config.books].sort((a, b) => a - b).indexOf(config.goal.find ?? 0) + 1,
    );
    if (new Set(places).size < places.length) {
      problems.push(
        `the book to find stands at the same place on two sorted shelves (places ${places.join(', ')}): S1 wants a search, not a walk`,
      );
    }
  }
  problems.push(...toolboxIssues(level.toolbox));

  const budgets = maps.map((config) => config.maxQuestions);
  const kind = getGameKind('sorter');
  if (kind !== undefined && level.solution !== undefined && budgets.some((b) => b !== undefined)) {
    // The solution's questions, counted without any budget (so it runs to the end on every map).
    const unbudgeted = (config: SorterConfig): SorterConfig => ({
      books: config.books,
      goal: config.goal,
    });
    const unlimited: Level = {
      ...level,
      mode: 'build',
      config: unbudgeted(maps[0] ?? { books: [], goal: {} }),
      ...(level.variants !== undefined && { variants: maps.slice(1).map(unbudgeted) }),
    };
    const outcome = runLevel({ kind, level: unlimited, workspace: level.solution });
    const used = questionsPerMap(outcome, level.solution);
    budgets.forEach((budget, index) => {
      const asked = used[index] ?? 0;
      if (budget === undefined) return;
      const map = index === 0 ? 'config' : `variants[${String(index - 1)}]`;
      if (asked > budget) {
        problems.push(
          `${map}: the solution asks ${String(asked)} questions > maxQuestions ${String(budget)}`,
        );
      }
    });
    // S2: the budget is tight on at least one map (the hardest shelf uses all of it).
    const tight = budgets.some((budget, index) => budget !== undefined && budget === used[index]);
    if (!tight) {
      const slack = budgets.flatMap((budget, index) =>
        budget === undefined ? [] : [`${String(budget)} for ${String(used[index] ?? 0)}`],
      );
      notes.push(
        `maxQuestions is loose on every map (${slack.join(', ')} questions of the solution): S2 wants it tight on the hardest shelf (note why)`,
      );
    }
  }
  const issue = (message: string): Issue => ({ path, rule: RULE, message });
  return { errors: problems.map(issue), warnings: notes.map(issue) };
}

/** Rule 27 errors of one schema-valid level (none for other kinds or an invalid config). */
export function checkSorterLevel(path: string, level: Level): Issue[] {
  return rule27(path, level).errors;
}

/** Rule 27 warnings (printed, never failing): a question budget looser than the solution's. */
export function sorterLevelWarnings(path: string, level: Level): Issue[] {
  return rule27(path, level).warnings;
}

// ---- Authoring traps S1 / S2 -------------------------------------------------------------------

/** A likely wrong program of a level and the reason it must lose with (on some map). */
export interface SorterTrap {
  program: string;
  reason: string;
  /** S1 trap: it must also win at least one map ("đúng cho 1 kệ là đúng cho mọi kệ"). */
  s1?: boolean;
}

/**
 * S1 / S2 (curriculum.md §6.5): every sorter `build` / `bughunt` level of a world declares the
 * likely wrong ways that win one shelf but lose another (S1), or work but too slowly (S2), with
 * the reason they lose. W10 entries are filled in with the levels (P5-09).
 */
export const SORTER_TRAPS: ReadonlyMap<string, readonly SorterTrap[]> = new Map(
  Object.entries({
    // Walks to the 7 of shelf 1: walks off the 3-book shelf (S1).
    'sorter-find': [{ program: 'REP4[R]', reason: 'OFF_SHELF', s1: true }],
    // Counts shelf 1 (4 books) to its flag, stops short on shelf 2 (S1).
    'sorter-count': [{ program: 'REP4[IF>5[ADD:big] R]', reason: 'NOT_AT_END', s1: true }],
    // One pass sorts shelves 1 and 2, not the reversed shelf 3 (S1).
    'sorter-bubble': [{ program: 'REP2[IFB[W] R]', reason: 'NOT_SORTED', s1: true }],
  }),
);

const TRAP_MODES: ReadonlySet<string> = new Set(['build', 'bughunt']);

/**
 * Trap warnings (rule 24, never errors) of one schema-valid level: a sorter build / bughunt level
 * needs a `SORTER_TRAPS` entry, and each trap must lose with its reason.
 */
export function sorterTrapWarnings(path: string, level: Level): Issue[] {
  if (level.kind !== 'sorter' || !TRAP_MODES.has(level.mode) || level.retired === true) return [];
  const kind = getGameKind('sorter');
  if (kind === undefined) return [];
  const warn = (message: string): Issue => ({ path, rule: 24, message: `(S1/S2) ${message}` });
  const traps = SORTER_TRAPS.get(level.id);
  if (traps === undefined || traps.length === 0) {
    return [warn('declare a likely wrong program and its reason (SORTER_TRAPS)')];
  }
  return traps.flatMap((trap) => {
    const outcome = runLevel({
      kind,
      level: { ...level, mode: 'build' },
      workspace: sorterProgram(trap.program),
    });
    if (trap.s1 === true && !(outcome.maps ?? []).some((map) => map.result === 'success')) {
      return [
        warn(`S1 trap "${trap.program}" wins no map: it must win one shelf and lose another`),
      ];
    }
    return outcome.reasonCode === trap.reason
      ? []
      : [
          warn(
            `"${trap.program}" ends ${outcome.result} ${outcome.reasonCode ?? ''}, not ${trap.reason}`,
          ),
        ];
  });
}
