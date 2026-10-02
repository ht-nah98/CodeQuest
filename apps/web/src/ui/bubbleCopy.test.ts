import { describe, expect, it } from 'vitest';
import { BUBBLE_MAX_WORDS, countWords, fitsBubble } from './bubbleCopy';

describe('countWords', () => {
  it('counts Vietnamese words separated by spaces', () => {
    expect(countWords('Măng nhảy qua hố, rẽ phải!')).toBe(6);
  });

  it('ignores emoji, punctuation and extra whitespace', () => {
    expect(countWords('  Chào con! Mình là Măng 🎋 ')).toBe(5);
    expect(countWords('Ối — hố!')).toBe(2);
  });

  it('counts digits as words', () => {
    expect(countWords('Cần thêm 10 xu.')).toBe(4);
  });

  it('returns 0 for empty copy', () => {
    expect(countWords('')).toBe(0);
  });
});

describe('fitsBubble', () => {
  it('accepts exactly the limit and rejects one more word', () => {
    const atLimit = Array.from({ length: BUBBLE_MAX_WORDS }, () => 'khối').join(' ');
    expect(fitsBubble(atLimit)).toBe(true);
    expect(fitsBubble(`${atLimit} nữa`)).toBe(false);
  });

  it('accepts the feedback copy from ui-copy-guide.md', () => {
    expect(fitsBubble('Măng chóng mặt rồi, vòng lặp không dừng!')).toBe(true);
  });
});
