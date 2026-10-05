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

/** `a` mixed towards `b` by t (0 = a, 1 = b), per channel, as '#rrggbb'. */
export function mix(a: string, b: string, t: number): string {
  const va = Number.parseInt(a.slice(1), 16);
  const vb = Number.parseInt(b.slice(1), 16);
  const k = Math.min(1, Math.max(0, t));
  const channel = (shift: number): string => {
    const ca = (va >> shift) & 0xff;
    const cb = (vb >> shift) & 0xff;
    return Math.round(ca + (cb - ca) * k)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

/** Relative luminance of a '#rrggbb' colour (WCAG 2.x), 0 (black) … 1 (white). */
export function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const linear = (shift: number): number => {
    const c = ((value >> shift) & 0xff) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(16) + 0.7152 * linear(8) + 0.0722 * linear(0);
}

/** WCAG contrast ratio of two colours, 1 (same) … 21 (black on white). */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** CIE L*a*b* (D65) of a '#rrggbb' colour. */
function lab(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  const linear = (shift: number): number => {
    const c = ((value >> shift) & 0xff) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = [linear(16), linear(8), linear(0)];
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number): number => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** CIE76 colour difference ΔE*ab of two colours: ~2 just noticeable, > 20 clearly different. */
export function deltaE(a: string, b: string): number {
  const [l1, a1, b1] = lab(a);
  const [l2, a2, b2] = lab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}
