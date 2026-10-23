import { LeanbotWorldLessonSchema, type LeanbotWorldLesson } from '@codequest/content-schema';
import { LB_GENERATED_TYPES, programBlockTypes, programCode } from '@codequest/games';

// Rule 29 (ADR-0030): a Thế giới Leanbot lesson's programs load and print code, the toolbox of a
// build screen holds every block of its solution, and a screen does not start already solved.

export interface LeanbotWorldIssue {
  rule: number;
  message: string;
}

/** Blocks the toolbox may list: every block with Arduino code. */
const KNOWN = new Set(LB_GENERATED_TYPES);

function codeOf(xml: string): string | Error {
  try {
    return programCode(xml);
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}

function programBlockTypesSafe(xml: string): string[] {
  try {
    return programBlockTypes(xml);
  } catch {
    return [];
  }
}

/** Rule 29 for one lesson that already passed its schema. */
export function leanbotWorldIssues(lesson: LeanbotWorldLesson): LeanbotWorldIssue[] {
  const issues: LeanbotWorldIssue[] = [];
  const add = (message: string) => issues.push({ rule: 29, message });
  for (const [index, screen] of lesson.screens.entries()) {
    const at = `screens.${String(index)} (${screen.id})`;
    if (screen.kind === 'read') {
      if (screen.program !== undefined) {
        const code = codeOf(screen.program);
        if (code instanceof Error) add(`${at}.program does not load: ${code.message}`);
      }
      continue;
    }
    for (const type of screen.toolbox) {
      if (!KNOWN.has(type)) add(`${at}.toolbox: unknown block "${type}"`);
    }
    const solution = codeOf(screen.solution);
    if (solution instanceof Error) {
      add(`${at}.solution does not load: ${solution.message}`);
      continue;
    }
    // A block the starting program already holds needs no place in the toolbox.
    const given = new Set(screen.start === undefined ? [] : programBlockTypesSafe(screen.start));
    const missing = programBlockTypes(screen.solution).filter(
      (t) => !screen.toolbox.includes(t) && !given.has(t),
    );
    if (missing.length > 0) {
      add(
        `${at}: the solution uses ${missing.join(', ')}, which neither the toolbox nor the start offers`,
      );
    }
    for (const [i, accepted] of (screen.accept ?? []).entries()) {
      const code = codeOf(accepted);
      if (code instanceof Error) add(`${at}.accept.${String(i)} does not load: ${code.message}`);
    }
    if (screen.start !== undefined) {
      const start = codeOf(screen.start);
      if (start instanceof Error) add(`${at}.start does not load: ${start.message}`);
      else if (start === solution) add(`${at}: the starting program is already the solution`);
    }
  }
  return issues;
}

/** Schema, then rule 29. */
export function checkLeanbotWorldLesson(parsed: unknown): {
  lesson: LeanbotWorldLesson | null;
  issues: LeanbotWorldIssue[];
} {
  const result = LeanbotWorldLessonSchema.safeParse(parsed);
  if (!result.success) return { lesson: null, issues: [] };
  return { lesson: result.data, issues: leanbotWorldIssues(result.data) };
}
