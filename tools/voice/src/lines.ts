import { createHash } from 'node:crypto';
import { z } from 'zod';

// Which lines get a pre-generated voice (ui-copy-guide.md §5) and their ids (content-model.md §2):
//   <levelId>.objective · <levelId>.mission · <levelId>.thinking · <levelId>.hint.<hintId> · <levelId>.feedback.<REASON>
//   <lessonId>.c<n> (1-based card) · <lessonId>.c<n>.explain (quiz) · feedback.<REASON> · ui.<vi.ts key>
// Only fixed text is voiced; lines with changing numbers are functions in vi.ts and never reach here.

export interface VoiceLine {
  id: string;
  text: string;
  /** Where the line comes from, for the report (content path or "vi.ts"). */
  source: string;
}

export interface ContentFile {
  /** `/`-separated path relative to content/, e.g. "worlds/w01-lang-tre/levels/w01-l03.json". */
  path: string;
  text: string;
}

/** Problems that stop a file from contributing lines (content:check reports the details). */
export interface LineIssue {
  path: string;
  message: string;
}

// Only the fields that hold voiced text; content:check validates the full schema.
const LevelText = z.object({
  id: z.string().min(1),
  objective: z.string().min(1),
  mission: z.string().min(1).optional(),
  thinkingHint: z.string().min(1).optional(),
  hints: z.array(z.object({ id: z.string().min(1), say: z.string().min(1) })).optional(),
  feedback: z.record(z.string(), z.string().min(1)).optional(),
  retired: z.boolean().optional(),
});
const LessonText = z.object({
  id: z.string().min(1),
  cards: z.array(z.object({ text: z.string().min(1), explain: z.string().min(1).optional() })),
});
const FeedbackText = z.record(z.string(), z.string().min(1));

/** Voice ids become file names: letters, digits, '.', '_' and '-' only. */
export const VOICE_ID = /^[A-Za-z0-9._-]+$/;

const LEVEL_PATH = /^worlds\/(w\d{2})-[^/]+\/levels\/[^/]+\.json$/;
const LESSON_PATH = /^worlds\/(w\d{2})-[^/]+\/lessons\/[^/]+\.json$/;
const FEEDBACK_PATH = 'shared/feedback.json';

/** Stable short hash of a line's text: a changed text means the voice file is stale. */
export function textHash(text: string): string {
  return createHash('sha256').update(text.normalize('NFC').trim()).digest('hex').slice(0, 12);
}

export interface ExtractOptions {
  /** Only these world prefixes ("w01", "w02"); all non-sandbox worlds when omitted. */
  worlds?: readonly string[];
}

/**
 * Voiced lines of the content tree: levels, lessons and shared/feedback.json. Sandbox worlds
 * (`worlds/_*`) and retired levels are skipped. Sorted by id.
 */
export function extractContentLines(
  files: readonly ContentFile[],
  options: ExtractOptions = {},
): { lines: VoiceLine[]; issues: LineIssue[] } {
  const lines: VoiceLine[] = [];
  const issues: LineIssue[] = [];
  const wanted = (world: string | undefined) =>
    world !== undefined && (options.worlds === undefined || options.worlds.includes(world));

  for (const file of files) {
    let json: unknown;
    try {
      json = JSON.parse(file.text);
    } catch {
      issues.push({ path: file.path, message: 'invalid JSON' });
      continue;
    }
    const add = (id: string, text: string) => {
      if (VOICE_ID.test(id)) lines.push({ id, text, source: file.path });
      else issues.push({ path: file.path, message: `voice id "${id}" is not a safe file name` });
    };

    const level = LEVEL_PATH.exec(file.path);
    const lesson = LESSON_PATH.exec(file.path);
    if (level && wanted(level[1])) {
      const parsed = LevelText.safeParse(json);
      if (!parsed.success) {
        issues.push({ path: file.path, message: 'level is missing id/objective' });
        continue;
      }
      const l = parsed.data;
      if (l.retired === true) continue;
      add(`${l.id}.objective`, l.objective);
      if (l.mission !== undefined) add(`${l.id}.mission`, l.mission);
      if (l.thinkingHint !== undefined) add(`${l.id}.thinking`, l.thinkingHint);
      for (const hint of l.hints ?? []) add(`${l.id}.hint.${hint.id}`, hint.say);
      for (const [reason, text] of Object.entries(l.feedback ?? {})) {
        add(`${l.id}.feedback.${reason}`, text);
      }
    } else if (lesson && wanted(lesson[1])) {
      const parsed = LessonText.safeParse(json);
      if (!parsed.success) {
        issues.push({ path: file.path, message: 'lesson is missing id/cards' });
        continue;
      }
      parsed.data.cards.forEach((card, i) => {
        const id = `${parsed.data.id}.c${String(i + 1)}`;
        add(id, card.text);
        if (card.explain !== undefined) add(`${id}.explain`, card.explain);
      });
    } else if (file.path === FEEDBACK_PATH) {
      const parsed = FeedbackText.safeParse(json);
      if (!parsed.success) {
        issues.push({ path: file.path, message: 'feedback.json must map REASON → text' });
        continue;
      }
      for (const [reason, text] of Object.entries(parsed.data)) add(`feedback.${reason}`, text);
    }
  }
  return { lines: sortLines(lines), issues };
}

export function sortLines(lines: readonly VoiceLine[]): VoiceLine[] {
  return [...lines].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Ids that appear twice (would overwrite each other's voice file). */
export function duplicateIds(lines: readonly VoiceLine[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const line of lines) {
    if (seen.has(line.id)) dups.add(line.id);
    seen.add(line.id);
  }
  return [...dups].sort();
}
