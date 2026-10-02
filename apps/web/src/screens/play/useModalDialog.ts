import { type RefObject, useEffect, useRef } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])';

/**
 * Keyboard behaviour of a modal overlay (`aria-modal="true"`): focuses the first control when it
 * opens, keeps Tab inside, closes on Escape (screens-and-flows.md §4) and gives focus back to
 * whatever had it before. Keys are caught on `document` in the capture phase, so Escape and Tab
 * work wherever focus is. App shortcuts are already off while an `aria-modal` overlay is open
 * (blockly-integration.md §13).
 */
export function useModalDialog(ref: RefObject<HTMLElement | null>, onClose: () => void): void {
  // The latest onClose, without re-running the effect (and refocusing) on every parent render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;
      const inside = dialog.contains(document.activeElement);
      if (event.shiftKey && (!inside || document.activeElement === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || document.activeElement === last)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      if (opener?.isConnected) opener.focus();
    };
  }, [ref]);
}
