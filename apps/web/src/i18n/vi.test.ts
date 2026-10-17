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

  it('keeps the other phase 4 lines short', () => {
    for (const line of [
      vi.play.blockLimit.spellLoopDepth,
      vi.play.blockLimit.spellBodyLoopDepth,
      vi.hints.nextStep.addTop,
      vi.hints.nextStep.moveTop,
      vi.editor.spellsUnsupported,
    ]) {
      expect(wordCount(line)).toBeLessThanOrEqual(12);
    }
  });

  it('says "khối lặp", never "vòng" (one iteration), when a spell drop is refused', () => {
    expect(vi.play.blockLimit.spellLoopDepth).toBe(
      'Phép có khối lặp rồi. Đừng đặt nó trong khối lặp nhé!',
    );
    expect(vi.play.blockLimit.spellBodyLoopDepth).toBe(
      'Phép này đang ở trong khối lặp. Đừng thêm lặp nhé!',
    );
    // Every spell line says "khối lặp" / "lặp", never "vòng" (one iteration, glossary.md).
    for (const line of [
      vi.play.blockLimit.spellLoopDepth,
      vi.play.blockLimit.spellBodyLoopDepth,
      vi.play.spells.casting('bậc thang'),
      ...Object.values(vi.results.phase4Reasons),
    ]) {
      expect(line).not.toMatch(/vòng/u);
    }
  });

  it('builds the replay bubble and the turtle HUD with the number as digits', () => {
    expect(vi.play.spells.casting('bậc thang')).toBe('Đang làm phép «bậc thang»');
    expect(vi.play.turtle.linesLeft(5)).toBe('Còn 5 nét');
    expect(wordCount(vi.play.spells.casting('tới ngã ba'))).toBeLessThanOrEqual(12);
  });
});

describe('phase 5 strings (P5-01)', () => {
  it('names the bookshelf toolbox group', () => {
    expect(vi.blockly.toolboxGroups.sorter).toBe('KỆ SÁCH');
  });

  it('keeps every new result-card line short, with digits for numbers', () => {
    for (const line of Object.values(vi.results.phase5Reasons)) {
      expect(wordCount(line), line).toBeLessThanOrEqual(12);
      const words = line.toLowerCase().split(/[^\p{L}\p{N}]+/u);
      expect(
        words.filter((word) => SPELLED_NUMBERS.has(word)),
        line,
      ).toEqual([]);
    }
    expect(Object.keys(vi.results.phase5Reasons)).toEqual([
      'OFF_SHELF',
      'NO_BOOK_RIGHT',
      'OUT_OF_QUESTIONS',
      'NOT_SORTED',
      'NOT_FOUND',
      'NOT_AT_END',
      'OUT_OF_STEPS',
    ]);
  });

  it('matches feedback.json word for word for every code it already has', async () => {
    const feedback = await loadFeedback();
    for (const [code, line] of Object.entries(vi.results.phase5Reasons)) {
      const shared = feedback[code];
      if (shared !== undefined) expect(shared, code).toBe(line);
    }
  });

  it('keeps the editor notice short', () => {
    expect(wordCount(vi.editor.sorterUnsupported)).toBeLessThanOrEqual(12);
  });

  it('builds the HUD lines with the number as digits', () => {
    expect(vi.play.sorter.questionsLeft(10)).toBe('Còn 10 lượt hỏi');
    expect(vi.play.maze.stepsLeft(9)).toBe('Còn 9 bước');
    expect(vi.play.sorter.swaps(3)).toBe('Đổi chỗ: 3');
  });
});
