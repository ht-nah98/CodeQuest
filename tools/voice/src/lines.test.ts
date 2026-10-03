import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { duplicateIds, extractContentLines, textHash, type ContentFile } from './lines';

const level = {
  id: 'w01-l03',
  objective: 'Nhảy qua hố để tới lá cờ nhé!',
  thinkingHint: 'Ngay trước hố, Măng phải làm gì?',
  hints: [{ id: 'jump-new', when: { trigger: 'enter' }, say: 'Khối mới: nhảy!' }],
  feedback: { FELL_IN_HOLE: 'Ối, hố! Nhảy ngay trước hố nhé.' },
};
const lesson = {
  id: 'w01-lesson',
  cards: [
    { type: 'say', pose: 'talk', text: 'Chào con!' },
    {
      type: 'quiz',
      text: 'Măng đi mấy bước?',
      options: ['1', '2'],
      correct: 1,
      explain: 'Hai bước.',
    },
  ],
};
const file = (path: string, json: unknown): ContentFile => ({ path, text: JSON.stringify(json) });

describe('extractContentLines', () => {
  it('names lines as in content-model.md §2', () => {
    const { lines, issues } = extractContentLines([
      file('worlds/w01-lang-tre/levels/w01-l03.json', level),
      file('worlds/w01-lang-tre/lessons/w01-lesson.json', lesson),
      file('shared/feedback.json', { FELL_IN_HOLE: 'Ối, hố! Thử khối nhảy nhé.' }),
      file('worlds/w01-lang-tre/world.json', { id: 'w01-lang-tre', story: 'not voiced' }),
    ]);
    expect(issues).toEqual([]);
    expect(lines.map((line) => [line.id, line.text])).toEqual([
      ['feedback.FELL_IN_HOLE', 'Ối, hố! Thử khối nhảy nhé.'],
      ['w01-l03.feedback.FELL_IN_HOLE', 'Ối, hố! Nhảy ngay trước hố nhé.'],
      ['w01-l03.hint.jump-new', 'Khối mới: nhảy!'],
      ['w01-l03.objective', 'Nhảy qua hố để tới lá cờ nhé!'],
      ['w01-l03.thinking', 'Ngay trước hố, Măng phải làm gì?'],
      ['w01-lesson.c1', 'Chào con!'],
      ['w01-lesson.c2', 'Măng đi mấy bước?'],
      ['w01-lesson.c2.explain', 'Hai bước.'],
    ]);
    expect(lines[0]?.source).toBe('shared/feedback.json');
  });

  it('voices the mission line as <id>.mission (P2-11c)', () => {
    const { lines } = extractContentLines([
      file('worlds/w03-xuong/levels/w03-l11.json', {
        ...level,
        id: 'w03-l11',
        mission: 'Tự ghép chương trình cho máy mới của Hổ.',
      }),
    ]);
    expect(lines.find((line) => line.id === 'w03-l11.mission')?.text).toBe(
      'Tự ghép chương trình cho máy mới của Hổ.',
    );
  });

  it('skips sandbox worlds, retired levels and worlds outside --worlds', () => {
    const { lines } = extractContentLines(
      [
        file('worlds/_sandbox/levels/x.json', { ...level, id: 'sandbox-x' }),
        file('worlds/w01-lang-tre/levels/w01-l09.json', { ...level, id: 'w01-l09', retired: true }),
        file('worlds/w02-x/levels/w02-l01.json', { ...level, id: 'w02-l01' }),
        file('worlds/w01-lang-tre/levels/w01-l03.json', level),
      ],
      { worlds: ['w01'] },
    );
    expect(new Set(lines.map((line) => line.id.split('.')[0]))).toEqual(new Set(['w01-l03']));
  });

  it('rejects ids that are not safe file names', () => {
    const { lines, issues } = extractContentLines([
      file('worlds/w01-lang-tre/levels/w01-l03.json', {
        ...level,
        hints: [{ id: '../evil', say: 'x' }],
        feedback: {},
      }),
    ]);
    expect(issues.map((issue) => issue.message)).toEqual([
      'voice id "w01-l03.hint.../evil" is not a safe file name',
    ]);
    expect(lines.map((line) => line.id)).toEqual(['w01-l03.objective', 'w01-l03.thinking']);
  });

  it('reports files it cannot read instead of guessing', () => {
    const { issues } = extractContentLines([
      { path: 'worlds/w01-lang-tre/levels/bad.json', text: '{' },
      file('worlds/w01-lang-tre/levels/w01-l04.json', { id: 'w01-l04' }),
    ]);
    expect(issues.map((issue) => issue.path)).toEqual([
      'worlds/w01-lang-tre/levels/bad.json',
      'worlds/w01-lang-tre/levels/w01-l04.json',
    ]);
  });

  it('reads the real content tree without issues or duplicate ids', () => {
    const root = fileURLToPath(new URL('../../../content', import.meta.url));
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory()
          ? walk(join(dir, entry.name))
          : entry.name.endsWith('.json')
            ? [join(dir, entry.name)]
            : [],
      );
    const files = walk(root).map((full) => ({
      path: relative(root, full).split(sep).join('/'),
      text: readFileSync(full, 'utf8'),
    }));
    const { lines, issues } = extractContentLines(files);
    expect(issues).toEqual([]);
    expect(duplicateIds(lines)).toEqual([]);
    expect(lines.some((line) => line.id === 'feedback.FELL_IN_HOLE')).toBe(true);
    expect(lines.some((line) => line.id === 'w01-l01.objective')).toBe(true);
    for (const line of lines) expect(line.id).toMatch(/^[a-z0-9-]+(\.[A-Za-z0-9_-]+)+$/);
  });
});

describe('textHash', () => {
  it('is stable and ignores Unicode normalisation and outer spaces', () => {
    expect(textHash('Măng')).toBe(textHash(' Măng '));
    expect(textHash('Măng')).not.toBe(textHash('Mang'));
    expect(textHash('a')).toMatch(/^[0-9a-f]{12}$/);
  });
});
