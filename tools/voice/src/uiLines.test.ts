import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { extractUiLines, readViStrings, VOICED_UI_KEYS } from './uiLines';

const SOURCE = `
import type { X } from './x';
export const vi = {
  appTitle: 'CodeQuest',
  play: {
    ready: 'Ghép khối rồi bấm Chạy nhé!',
    winPar: (blocks: number) => \`Chỉ \${String(blocks)} khối\`,
    tpl: \`Không có số\`,
  },
  hints: {
    global: { 'g-idle': 'Thử bấm Chạy!', 'g-fail3': 'Khó nhỉ?' } satisfies Record<string, string>,
    tiers: { 1: { name: 'Gợi ý tư duy' } },
  },
  results: { reasons: { daily: 'Thưởng' } as Partial<Record<string, string>> },
};
`;

describe('readViStrings', () => {
  it('reads fixed strings by key path and skips functions', () => {
    const strings = readViStrings(SOURCE);
    expect(strings.get('play.ready')).toBe('Ghép khối rồi bấm Chạy nhé!');
    expect(strings.get('play.tpl')).toBe('Không có số');
    expect(strings.has('play.winPar')).toBe(false);
    expect(strings.get('hints.global.g-idle')).toBe('Thử bấm Chạy!');
    expect(strings.get('hints.tiers.1.name')).toBe('Gợi ý tư duy');
    expect(strings.get('results.reasons.daily')).toBe('Thưởng');
  });
});

describe('extractUiLines', () => {
  it('gives ui.<key> ids for leaves and whole groups', () => {
    const { lines, issues } = extractUiLines(SOURCE, ['play.ready', 'hints.global']);
    expect(issues).toEqual([]);
    expect(lines.map((line) => line.id)).toEqual([
      'ui.play.ready',
      'ui.hints.global.g-idle',
      'ui.hints.global.g-fail3',
    ]);
  });

  it('flags a voiced key that is gone or became a function (it has a number now)', () => {
    const { issues } = extractUiLines(SOURCE, ['play.winPar', 'play.nope']);
    expect(issues).toHaveLength(2);
  });

  it('finds every voiced key in the real vi.ts', () => {
    const source = readFileSync(
      fileURLToPath(new URL('../../../apps/web/src/i18n/vi.ts', import.meta.url)),
      'utf8',
    );
    const { lines, issues } = extractUiLines(source);
    expect(issues).toEqual([]);
    expect(lines.length).toBeGreaterThanOrEqual(VOICED_UI_KEYS.length);
    expect(lines.find((line) => line.id === 'ui.results.stars3')?.text).toBe(
      'Hoàn hảo! Ba sao luôn!',
    );
  });
});
