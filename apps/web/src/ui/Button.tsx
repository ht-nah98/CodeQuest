import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { FOCUS_RING } from './focusRing';

export type ButtonVariant = 'go' | 'hint' | 'coin' | 'plain';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** go = ▶ Run / success, hint = hints, coin = shop / rewards, plain = everything else. */
  variant?: ButtonVariant;
  /** sm = compact bars, md = default, lg = the main call to action. Defaults to lg for `go`, else md. */
  size?: ButtonSize;
  /** Leading glyph such as "▶" or a <PixelIcon />; hidden from screen readers. */
  icon?: ReactNode;
  /** Trailing glyph, e.g. the play triangle in "Màn tiếp ▶"; hidden from screen readers. */
  iconAfter?: ReactNode;
  /** Keyboard shortcut shown as a small key cap, e.g. "Space" or "R". */
  shortcut?: string;
  children?: ReactNode;
  /** React 19 passes `ref` as a prop; it lands on the <button>. */
  ref?: Ref<HTMLButtonElement>;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  go: 'bg-go',
  hint: 'bg-hint',
  coin: 'bg-coin',
  plain: 'bg-paper',
};

// Every size keeps the 44px minimum hit area (coding-standards.md §5).
const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'text-body px-3.5 pt-1.5 pb-1',
  md: 'text-button px-[18px] pt-2 pb-1.5',
  lg: 'text-button-lg px-6 pt-2.5 pb-2',
};

// Chunky button (art-direction.md §4): ink text on a token fill, 3px ink border, hard shadow.
// Hover lifts 1px, press sinks 4px with the shadow shrinking to 1px.
const BASE_CLASS = [
  'inline-flex min-h-11 min-w-11 cursor-pointer select-none items-center justify-center gap-2',
  'rounded-button border-3 border-ink font-display font-extrabold text-ink shadow-button',
  'transition-[transform,box-shadow,filter] duration-150 ease-bounce',
  'enabled:hover:-translate-y-px enabled:hover:shadow-button-hover enabled:hover:brightness-105',
  'enabled:active:translate-y-1 enabled:active:shadow-button-pressed enabled:active:brightness-95',
  FOCUS_RING,
  'disabled:cursor-not-allowed disabled:opacity-55',
].join(' ');

/** The one button of the app. Defaults to type="button" so it never submits a form by accident. */
export function Button({
  variant = 'plain',
  size,
  icon,
  iconAfter,
  shortcut,
  children,
  type = 'button',
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      data-variant={variant}
      className={`${BASE_CLASS} ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size ?? (variant === 'go' ? 'lg' : 'md')]} ${className}`}
      {...rest}
    >
      {icon !== undefined && (
        <span aria-hidden="true" className="inline-flex items-center">
          {icon}
        </span>
      )}
      {children}
      {iconAfter !== undefined && (
        <span aria-hidden="true" className="inline-flex items-center">
          {iconAfter}
        </span>
      )}
      {shortcut !== undefined && (
        <kbd
          aria-hidden="true"
          className="rounded-kbd border-2 border-ink bg-white/60 px-1.5 font-pixel text-pixel-sm font-normal"
        >
          {shortcut}
        </kbd>
      )}
    </button>
  );
}
