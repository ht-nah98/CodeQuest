/**
 * Colour tokens for code that cannot read CSS variables at build time (Blockly theme, PixiJS
 * stage). ADR-0014: one palette, two mirrors. tokens.css is what the browser uses; this file
 * must hold the exact same hex values, and tokens.test.ts fails the build if they drift.
 * Keys are the CSS names without `--color-` (and `block-`), in camelCase.
 */

export const UI_COLORS = {
  ink: '#1e1b2e',
  inkSoft: '#4a4560',
  paper: '#fff8ee',
  paper2: '#f1e6d8',
  ground: '#e9e4f3',
  white: '#ffffff',
  brand: '#7b769e',
  brandDeep: '#4b4673',
  brandSoft: '#d9d5ee',
  go: '#4faf5a',
  goDeep: '#2f7d3a',
  coin: '#fbc73f',
  coinDeep: '#c98a12',
  coinShine: '#fff4c8',
  hint: '#f9a5a7',
  oops: '#e8615e',
  oopsSoft: '#fde7e6',
  sky: '#bfe3f2',
} as const;

/** Block category colours, fixed system-wide (art-direction.md §2). */
export const BLOCK_COLORS = {
  move: '#3a7bd5',
  loop: '#d9730d',
  if: '#8a5cd1',
  sensor: '#178a7e',
  robot: '#a0612b',
  var: '#d13f73',
  fn: '#5560c8',
  pen: '#2f8a3e',
  event: '#fbc73f',
} as const;

export type UiColorName = keyof typeof UI_COLORS;
export type BlockColorName = keyof typeof BLOCK_COLORS;
