// Pixi-free colour helpers for the stages: every stage colour is a token (ui/tokens.ts) or derived
// from one here, so the palette stays one source (ADR-0014).

/**
 * A token colour made darker (`k` < 1: each channel × k) or lighter (`k` > 1: mixed towards white
 * by k − 1), as '#rrggbb'.
 */
export function shade(hex: string, k: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (shift: number): string => {
    const c = (value >> shift) & 0xff;
    const out = k <= 1 ? c * Math.max(0, k) : c + (255 - c) * Math.min(1, k - 1);
    return Math.round(out).toString(16).padStart(2, '0');
  };
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}
