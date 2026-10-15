import { describe, expect, it } from 'vitest';
import { loadFeedback } from '../features/content/files';
import { vi } from './vi';

/** Numbers are written as digits (ui-copy-guide.md §2). */
const SPELLED_NUMBERS = new Set(['một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']);
const wordCount = (text: string): number => text.split(/\s+/).filter(Boolean).length;

describe('phase 4 strings (P4-06a)', () => {
  it('names the spell and pen toolbox groups as children say them', () => {
    expect(vi.blockly.toolboxGroups.function).toBe('PHÉP THUẬT');
    expect(vi.blockly.toolboxGroups.pen).toBe('BÚT');
  });

  it('keeps every new result-card line short, with digits for numbers', () => {
    for (const line of Object.values(vi.results.phase4Reasons)) {
      expect(wordCount(line)).toBeLessThanOrEqual(12);
      const words = line.toLowerCase().split(/[^\p{L}\p{N}]+/u);
      expect(
        words.filter((word) => SPELLED_NUMBERS.has(word)),
        line,
      ).toEqual([]);
    }
  });

  it('matches feedback.json word for word for every code it already has', async () => {
    const feedback = await loadFeedback();
    for (const [code, line] of Object.entries(vi.results.phase4Reasons)) {
      const shared = feedback[code];
      if (shared !== undefined) expect(shared, code).toBe(line);
    }
  });

  it('builds the replay bubble and the turtle HUD with the number as digits', () => {
    expect(vi.play.spells.casting('bậc thang')).toBe('Đang làm phép «bậc thang»');
    expect(vi.play.turtle.linesLeft(5)).toBe('Còn 5 nét');
    expect(wordCount(vi.play.spells.casting('tới ngã ba'))).toBeLessThanOrEqual(12);
  });
});
