import { type ReactNode, type RefObject, useEffect, useId, useRef } from 'react';

export interface DialogProps {
  /** Visible title; also the dialog's accessible name. */
  title: ReactNode;
  /** Esc and the backdrop close it; omit for a dialog that must be answered (e.g. break). */
  onClose?: () => void;
  /** Element focused on open; defaults to the first focusable element. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Extra classes for the card (width, padding, layout). */
  className?: string;
  /** Hides the title visually (still announced), for layouts that show it elsewhere. */
  hideTitle?: boolean;
  children?: ReactNode;
  'data-testid'?: string;
}

/** Open dialogs, oldest first: only the top-most one handles Esc and Tab. */
const openStack: symbol[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * App overlay (results, PIN pad, break reminder): a paper card over a dimmed page, `aria-modal`
 * so the play screen's shortcuts stand down (blockly/shortcuts.ts), Tab kept inside, focus
 * returned to where it was on close.
 */
export function Dialog({
  title,
  onClose,
  initialFocus,
  className = '',
  hideTitle = false,
  children,
  'data-testid': testId,
}: DialogProps) {
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const card = cardRef.current;
    const target = initialFocus?.current ?? card?.querySelector<HTMLElement>(FOCUSABLE) ?? card;
    target?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, [initialFocus]);

  useEffect(() => {
    const me = Symbol('dialog');
    openStack.push(me);
    const onKeyDown = (event: KeyboardEvent) => {
      const card = cardRef.current;
      if (!card || openStack.at(-1) !== me) return;
      if (event.key === 'Escape' && onCloseRef.current) {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = [...card.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !card.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !card.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true });
      openStack.splice(openStack.indexOf(me), 1);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/55 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid={testId}
        className={`relative animate-pop rounded-panel border-3 border-ink bg-paper text-ink shadow-hard outline-none ${className}`}
      >
        <h2 id={titleId} className={hideTitle ? 'sr-only' : 'm-0 text-title'}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
