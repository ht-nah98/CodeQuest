// Voice line ids (content-model.md §2). tools/voice/src/lines.ts makes the same ids when it
// lists the lines to record; both sides are tested against the documented examples.

/** `<levelId>.objective` · `<levelId>.mission` · `<levelId>.thinking` */
export const levelVoiceId = (levelId: string, key: 'objective' | 'mission' | 'thinking'): string =>
  `${levelId}.${key}`;

/** `<levelId>.hint.<hintId>`: a hint rule's `say` line. */
export const hintVoiceId = (levelId: string, hintId: string): string => `${levelId}.hint.${hintId}`;

/** `<lessonId>.c<n>` with n counted from 1; `.explain` for a quiz card's explanation. */
export const lessonCardVoiceId = (lessonId: string, cardIndex: number, explain = false): string =>
  `${lessonId}.c${String(cardIndex + 1)}${explain ? '.explain' : ''}`;

/**
 * A failed run's feedback line: `<levelId>.feedback.<REASON>` when the level overrides the
 * text, else the shared `feedback.<REASON>` of feedback.json.
 */
export const feedbackVoiceId = (reason: string, overriddenBy?: string): string =>
  overriddenBy === undefined ? `feedback.${reason}` : `${overriddenBy}.feedback.${reason}`;

/** `ui.<key path in vi.ts>`, e.g. `ui.results.stars3`. Only fixed strings are voiced. */
export const uiVoiceId = (keyPath: string): string => `ui.${keyPath}`;
