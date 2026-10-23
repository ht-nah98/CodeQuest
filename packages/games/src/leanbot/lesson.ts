import { utils, Workspace, Xml } from 'blockly';
import { toArduino } from './arduino';
import { registerLeanbotBlocks } from './register';
import { LB_TOOLBOX, type LbCategory } from './toolbox';

// Checking a Thế giới Leanbot build screen (ADR-0030): the child's program is right when its
// Arduino code is the code of the screen's solution (or of an accepted one). Pythaverse prints
// the same code for the same blocks, so this is the "same code, same program" self-check of the
// course plan (giao-trinh.md §8, Tầng 2).

/** A line of code worth comparing: no trailing spaces, blank lines left out. */
function codeLines(code: string): { text: string; line: number }[] {
  return code
    .split('\n')
    .map((text, line) => ({ text: text.trimEnd(), line }))
    .filter((l) => l.text.trim().length > 0);
}

export type ProgramCheck =
  | { ok: true }
  | {
      ok: false;
      /**
       * `missing`: blocks are missing before `line` (or at the end when `line` is null);
       * `extra`: `line` is a block the solution does not have; `different`: `line` differs.
       */
      problem: 'missing' | 'extra' | 'different';
      /** 0-based line of the child's code the problem is at; null at the end of the code. */
      line: number | null;
      /** A hint whose `match` is in the child's code, if any. */
      say: string | null;
    };

/** Compares the child's code with every accepted code; reports against the closest one. */
export function checkProgram(
  code: string,
  solutions: readonly string[],
  hints: readonly { match: string; say: string }[] = [],
): ProgramCheck {
  const mine = codeLines(code);
  let best: { prefix: number; theirs: { text: string }[] } = { prefix: -1, theirs: [] };
  for (const solution of solutions) {
    const theirs = codeLines(solution);
    if (theirs.length === mine.length && theirs.every((l, i) => l.text === mine[i]?.text)) {
      return { ok: true };
    }
    let prefix = 0;
    while (
      prefix < mine.length &&
      prefix < theirs.length &&
      mine[prefix]?.text === theirs[prefix]?.text
    ) {
      prefix++;
    }
    if (prefix > best.prefix) best = { prefix, theirs };
  }
  const { prefix, theirs } = best;
  const at = mine[prefix];
  const say = hints.find((h) => code.includes(h.match))?.say ?? null;
  // The child's line shows up further down the solution: blocks are missing before it.
  const wanted = theirs.slice(prefix + 1).findIndex((l) => l.text === at?.text);
  // The solution's line shows up further down the child's code: the child has extra blocks.
  const expected = theirs[prefix];
  const extra = mine.slice(prefix + 1).findIndex((l) => l.text === expected?.text);
  let problem: 'missing' | 'extra' | 'different' = 'different';
  if (at === undefined || wanted >= 0) problem = 'missing';
  else if (expected === undefined || extra >= 0) problem = 'extra';
  return { ok: false, problem, line: at?.line ?? null, say };
}

const xmlByType = new Map<string, string>();
const collect = (categories: readonly LbCategory[]) => {
  for (const category of categories) {
    for (const xml of category.blocks ?? []) {
      const type = /type=['"]([^'"]+)['"]/.exec(xml)?.[1];
      if (type !== undefined && !xmlByType.has(type)) xmlByType.set(type, xml);
    }
    collect(category.children ?? []);
  }
};
collect(LB_TOOLBOX);

/**
 * A toolbox entry of a lesson as XML: a block type gets Pythaverse's starting values; an entry
 * that is already a block's XML is kept as written.
 */
export function toolboxXml(entry: string): string {
  if (entry.startsWith('<')) return entry;
  return xmlByType.get(entry) ?? `<block type='${entry}'></block>`;
}

/** The block type of a toolbox entry. */
export function toolboxEntryType(entry: string): string {
  return entry.startsWith('<') ? (/type=['"]([^'"]+)['"]/.exec(entry)?.[1] ?? '') : entry;
}

/** Arduino code of a program saved as XML. */
export function programCode(xml: string): string {
  registerLeanbotBlocks();
  const ws = new Workspace();
  try {
    Xml.domToWorkspace(utils.xml.textToDom(xml), ws);
    return toArduino(ws).code;
  } finally {
    ws.dispose();
  }
}

/** Types of the blocks a child has to drag in to make `xml` (shadow blocks come with others). */
export function programBlockTypes(xml: string): string[] {
  registerLeanbotBlocks();
  const ws = new Workspace();
  try {
    Xml.domToWorkspace(utils.xml.textToDom(xml), ws);
    return [
      ...new Set(
        ws
          .getAllBlocks(false)
          .filter((b) => !b.isShadow())
          .map((b) => b.type),
      ),
    ];
  } finally {
    ws.dispose();
  }
}
