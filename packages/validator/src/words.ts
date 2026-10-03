// Same counting as apps/web/src/ui/bubbleCopy.ts `countWords` (the validator must not import
// the web app): a word is a whitespace-separated token with a letter or digit, so "🎋", "!" or
// "—" do not count. Vietnamese syllables are written apart, so each syllable is one word
// ("lá cờ" = 2).
const WORD = /[\p{L}\p{N}]/u;

/** Counts the words a child has to read in a line of copy (rule 5). */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((token) => WORD.test(token)).length;
}
