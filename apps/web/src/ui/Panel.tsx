import type { HTMLAttributes, ReactNode } from 'react';

export type PanelTone = 'paper' | 'brand' | 'white';
export type PanelElement = 'div' | 'section' | 'article' | 'aside' | 'header';

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  /** Semantic element to render; defaults to div. */
  as?: PanelElement;
  /** paper = cards & dialogs, brand = hero / title areas, white = inset cards on paper. */
  tone?: PanelTone;
  /** Hard 6px drop shadow. Turn off for panels nested inside another panel. */
  raised?: boolean;
  children?: ReactNode;
}

const TONE_CLASS: Record<PanelTone, string> = {
  paper: 'bg-paper text-ink',
  // Paper on lavender is ~4:1, so text on brand panels is at least bold (art-direction.md §4).
  brand: 'bg-brand font-bold text-paper',
  white: 'bg-white text-ink',
};

/** Card / panel surface (art-direction.md §4): 18px radius, 3px ink border, hard shadow. */
export function Panel({
  as: Element = 'div',
  tone = 'paper',
  raised = true,
  className = '',
  children,
  ...rest
}: PanelProps) {
  return (
    <Element
      className={`min-w-0 rounded-panel border-3 border-ink ${raised ? 'shadow-hard' : ''} ${TONE_CLASS[tone]} ${className}`}
      {...rest}
    >
      {children}
    </Element>
  );
}
