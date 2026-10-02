// Early guard for rule 17 (P1-11): every engine and game-kind reason code has a sentence.
import { readFileSync } from 'node:fs';
import { FeedbackFileSchema } from '@codequest/content-schema';
import { ENGINE_REASONS } from '@codequest/engine';
import { gameKinds } from '@codequest/games';
import { describe, expect, it } from 'vitest';

const feedback = FeedbackFileSchema.parse(
  JSON.parse(
    readFileSync(new URL('../../../content/shared/feedback.json', import.meta.url), 'utf8'),
  ),
);

describe('content/shared/feedback.json', () => {
  it('has a sentence for every engine and game-kind reason code', () => {
    const codes = [
      ...ENGINE_REASONS,
      ...Object.values(gameKinds).flatMap((kind) => kind.reasonCodes),
    ];
    expect(codes.filter((code) => feedback[code] === undefined)).toEqual([]);
  });

  it('keeps every sentence within 12 words (ui-copy-guide.md §2)', () => {
    const long = Object.entries(feedback).filter(
      ([, sentence]) => sentence.trim().split(/\s+/).length > 12,
    );
    expect(long).toEqual([]);
  });
});
