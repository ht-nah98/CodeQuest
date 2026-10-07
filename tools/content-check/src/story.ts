/**
 * Rule 21 of content-model.md §5 (P2-24): the chapters of a world's tale (`world.chapters`).
 * Chapter 1 is open from the start; every later chapter opens when the child wins its
 * `unlockAfter` level, so that level must be one of the world's own, on the path every child
 * walks (not an optional challenge, the free-play level or a retired one), in story order.
 */
import type { Level, LevelStage, World } from '@codequest/content-schema';
import { countWords } from '@codequest/validator';
import type { Issue } from './rules';

export const MAX_CHAPTER_TITLE_WORDS = 5;
export const MAX_CHAPTER_LINE_WORDS = 12;

/** Stages every child wins on the way to the boss (challenge and bonus are optional). */
const PATH_STAGES: readonly LevelStage[] = ['guided', 'practice', 'boss'];

/** Glyphs the display fonts lack (Baloo 2 has no ✔ / ✘: phase-2.md P2-23). */
const MISSING_GLYPHS = /[✔✓✘✗✖]/u;

/**
 * Issues of one world's chapters. `levelOf` returns the schema-valid level of an id (or
 * undefined when it has no valid file; rule 1 or 3 reports that).
 */
export function checkStory(
  path: string,
  world: World,
  levelOf: (id: string) => Level | undefined,
): Issue[] {
  const issues: Issue[] = [];
  const report = (message: string): void => {
    issues.push({ path, rule: 21, message });
  };
  const seen = new Set<string>();
  /** Index in `levelIds` of the previous chapter's unlock level (-1: chapter 1). */
  let previous = -1;

  for (const [index, chapter] of (world.chapters ?? []).entries()) {
    const name = `chapter "${chapter.id}"`;
    if (seen.has(chapter.id)) report(`${name} appears twice`);
    seen.add(chapter.id);

    const titleWords = countWords(chapter.title);
    if (titleWords > MAX_CHAPTER_TITLE_WORDS) {
      report(
        `${name} title has ${String(titleWords)} words; max ${String(MAX_CHAPTER_TITLE_WORDS)}`,
      );
    }
    for (const [n, line] of chapter.lines.entries()) {
      const words = countWords(line);
      if (words > MAX_CHAPTER_LINE_WORDS) {
        report(
          `${name} line ${String(n + 1)} has ${String(words)} words; max ${String(MAX_CHAPTER_LINE_WORDS)}`,
        );
      }
    }
    if ([chapter.title, ...chapter.lines].some((text) => MISSING_GLYPHS.test(text))) {
      report(`${name} uses ✔/✘ marks, which the fonts cannot draw; write the words`);
    }

    const after = chapter.unlockAfter;
    if (index === 0) {
      if (after !== undefined) report(`${name} is the first chapter and must not set unlockAfter`);
      continue;
    }
    if (after === undefined) {
      report(`${name} needs unlockAfter (only the first chapter is open from the start)`);
      continue;
    }
    const position = world.levelIds.indexOf(after);
    if (position < 0) {
      report(`${name} unlockAfter "${after}" is not in the levelIds of ${world.id}`);
      continue;
    }
    const level = levelOf(after);
    if (level !== undefined) {
      if (level.retired === true) report(`${name} unlockAfter "${after}" is retired`);
      else if (!PATH_STAGES.includes(level.stage)) {
        report(
          `${name} unlockAfter "${after}" is a ${level.stage} level; use a guided, practice or boss level`,
        );
      }
    }
    if (position <= previous) {
      report(`${name} unlockAfter "${after}" must come after the previous chapter's level`);
    }
    previous = Math.max(previous, position);
  }
  return issues;
}
