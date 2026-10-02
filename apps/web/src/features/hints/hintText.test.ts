import { describe, expect, it } from 'vitest';
import { selectHint } from '@codequest/engine';
import type { HintContext } from '@codequest/engine';
import { hintText } from './hintText';
import { hintTestLevel } from './testLevel';

const ctx = (extra: Partial<HintContext>): HintContext => ({
  analysis: {
    startBlockId: 's',
    programBlockIds: [],
    orphanBlockIds: [],
    blocksUsed: 0,
    blockTypesUsed: {},
    topBlockCount: 1,
  },
  capacityLeft: Infinity,
  lastOutcome: null,
  runCount: 0,
  failStreak: 0,
  idleMs: 0,
  shownHintIds: new Set(),
  isFirstOfModeInWorld: false,
  seenModes: new Set(),
  trigger: 'change',
  ...extra,
});
const feedback = {
  EMPTY_PROGRAM: 'Con chưa ghép khối nào. Kéo khối vào đây nhé!',
  TIMEOUT: 'Chóng mặt!',
};

describe('hintText', () => {
  it("says a level rule's own line", () => {
    const level = hintTestLevel({ hints: [{ id: 'a', when: {}, say: 'Đếm số ô nhé?' }] });
    const selection = selectHint(level, ctx({}));
    expect(selection && hintText(selection, level, feedback)).toBe('Đếm số ô nhé?');
  });

  it('says the vi.ts copy of a global rule', () => {
    const level = hintTestLevel();
    const selection = selectHint(level, ctx({ trigger: 'run-end', failStreak: 3 }));
    expect(selection && hintText(selection, level, feedback)).toBe(
      'Khó nhỉ? Gợi ý đang miễn phí đó.',
    );
  });

  it('borrows the feedback line (level override first) for g-timeout and g-empty-run', () => {
    const timeout = ctx({
      trigger: 'run-end',
      lastOutcome: { result: 'timeout', reasonCode: 'TIMEOUT' },
    });
    const plain = hintTestLevel();
    const selection = selectHint(plain, timeout);
    expect(selection && hintText(selection, plain, feedback)).toBe('Chóng mặt!');
    const own = hintTestLevel({ feedback: { TIMEOUT: 'Vòng lặp chạy mãi!' } });
    expect(selection && hintText(selection, own, feedback)).toBe('Vòng lặp chạy mãi!');
    expect(selection && hintText(selection, plain, {})).toBe(
      'Măng chóng mặt rồi, vòng lặp không dừng!',
    );
  });
});
