import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { vi } from '../../i18n/vi';
import { FOCUS_RING } from '../../ui/focusRing';

const t = vi.profiles;
const PIN_LENGTH = 4;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'erase'] as const;

export interface PinPadProps {
  /**
   * Called with 4 digits. Resolve false to reject (the dots shake and clear, no lock-out:
   * screens-and-flows.md "sai PIN (rung nhẹ, không khóa)"), true to keep the entry.
   */
  onComplete: (pin: string) => Promise<boolean> | boolean;
  /** Shown under the dots (e.g. the wrong-PIN line), announced politely. */
  message?: string;
  /** Focus the first key on mount. */
  autoFocus?: boolean;
}

const KEY_CLASS = [
  'grid h-14 w-20 cursor-pointer place-items-center rounded-button border-3 border-ink bg-paper',
  'font-pixel text-pixel-lg text-ink shadow-button transition-[transform,box-shadow] duration-150 ease-bounce',
  'enabled:hover:-translate-y-px enabled:hover:shadow-button-hover',
  'enabled:active:translate-y-1 enabled:active:shadow-button-pressed disabled:opacity-55',
  FOCUS_RING,
].join(' ');

/** Big 4-digit PIN pad: mouse, or digits / Backspace on the keyboard. */
export function PinPad({ onComplete, message, autoFocus = false }: PinPadProps) {
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const firstKeyRef = useRef<HTMLButtonElement>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    if (autoFocus) firstKeyRef.current?.focus();
  }, [autoFocus]);

  const press = useCallback(
    (key: string) => {
      if (busy) return;
      if (key === 'erase') {
        setDigits((d) => d.slice(0, -1));
        return;
      }
      if (digits.length >= PIN_LENGTH) return;
      const next = digits + key;
      setDigits(next);
      if (next.length < PIN_LENGTH) return;
      setBusy(true);
      void Promise.resolve(onCompleteRef.current(next))
        .catch(() => false)
        .then((ok) => {
          setBusy(false);
          if (!ok) {
            setDigits('');
            setShakeKey((k) => k + 1);
          }
        });
    },
    [busy, digits],
  );

  // Physical keys, unless the user is typing in a text field. A layout effect, so digits typed
  // right as the pad appears are not lost.
  useLayoutEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select')) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        press(event.key);
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        press('erase');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [press]);

  return (
    <div className="grid justify-items-center gap-3">
      <div
        key={shakeKey}
        role="status"
        aria-label={t.pinDigits(digits.length)}
        data-testid="pin-dots"
        data-filled={digits.length}
        className={`flex gap-3 ${shakeKey > 0 ? 'animate-shake' : ''}`}
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`size-6 rounded-full border-3 border-ink transition-colors duration-150 ${
              i < digits.length ? 'bg-brand-deep' : 'bg-white'
            }`}
          />
        ))}
      </div>
      <p aria-live="polite" className="m-0 min-h-6 text-center font-bold text-oops">
        {message ?? ''}
      </p>
      <div role="group" aria-label={t.pinPad} className="grid grid-cols-3 gap-2.5">
        {KEYS.map((key, index) => (
          <button
            key={key}
            ref={index === 0 ? firstKeyRef : undefined}
            type="button"
            disabled={busy}
            aria-label={key === 'erase' ? t.erase : key}
            data-key={key}
            onClick={() => {
              press(key);
            }}
            className={`${KEY_CLASS} ${key === 'erase' ? 'font-display text-button font-extrabold' : ''} ${key === '0' ? 'col-start-2' : ''}`}
          >
            {key === 'erase' ? t.erase : key}
          </button>
        ))}
      </div>
    </div>
  );
}
