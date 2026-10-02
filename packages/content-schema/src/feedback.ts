import { z } from 'zod';

/**
 * `content/shared/feedback.json`: the single source of the default Vietnamese sentence per
 * reasonCode (ui-copy-guide.md §3), e.g. `{ "FELL_IN_HOLE": "Ối, hố! Thử khối nhảy nhé." }`.
 */
export const FeedbackFileSchema = z.record(
  z.string().regex(/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/, 'reasonCode must be SCREAMING_SNAKE_CASE'),
  z.string().min(1),
);
export type FeedbackFile = z.infer<typeof FeedbackFileSchema>;
