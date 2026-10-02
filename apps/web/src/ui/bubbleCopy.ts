/** Speech bubbles hold at most 12 words (AGENTS.md rule 6, ui-copy-guide.md §2). */
export const BUBBLE_MAX_WORDS = 12;

// A "word" must contain a letter or digit, so "🎋", "!" or "—" do not count.
const WORD = /[\p{L}\p{N}]/u;

/** Counts the words a child has to read in a line of copy. */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((token) => WORD.test(token)).length;
}

/** True when the copy fits in a speech bubble. */
export function fitsBubble(text: string): boolean {
  return countWords(text) <= BUBBLE_MAX_WORDS;
}
