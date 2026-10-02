import { describe, expect, it } from 'vitest';
import { BLOCK_COLORS, UI_COLORS } from './tokens';

// Vitest blanks `.css` imports (even `?raw`) while CSS processing is off, so read the file from
// disk. apps/web has no Node types (DOM code must not see them); declare just what is used here.
declare const process: {
  getBuiltinModule(id: 'node:fs'): { readFileSync(path: string, encoding: 'utf8'): string };
};
// Plain string maths: Vite rewrites `new URL('./x', import.meta.url)` into an asset URL.
const tokensPath = decodeURIComponent(
  import.meta.url.replace(/^file:\/\//, '').replace(/[^/]*$/, 'tokens.css'),
);
const tokensCss = process.getBuiltinModule('node:fs').readFileSync(tokensPath, 'utf8');

const toCamel = (kebab: string) => kebab.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** Every `--color-<name>: #rrggbb` in tokens.css, keyed like tokens.ts. */
function cssColors(): { ui: Record<string, string>; block: Record<string, string> } {
  const ui: Record<string, string> = {};
  const block: Record<string, string> = {};
  for (const [, name = '', value = ''] of tokensCss.matchAll(
    /--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g,
  )) {
    if (name.startsWith('block-'))
      block[toCamel(name.slice('block-'.length))] = value.toLowerCase();
    else ui[toCamel(name)] = value.toLowerCase();
  }
  return { ui, block };
}

describe('tokens.ts mirrors tokens.css', () => {
  const { ui, block } = cssColors();

  it('finds the palette in tokens.css', () => {
    expect(Object.keys(ui).length).toBeGreaterThan(10);
    expect(Object.keys(block)).toHaveLength(9);
  });

  it('has exactly the same UI colours', () => {
    expect(UI_COLORS).toEqual(ui);
  });

  it('has exactly the same block colours', () => {
    expect(BLOCK_COLORS).toEqual(block);
  });
});
