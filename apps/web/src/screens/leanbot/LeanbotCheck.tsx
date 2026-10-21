import { useState } from 'react';
import { FOCUS_RING } from '../../ui/focusRing';

/**
 * A tick the child presses after doing it on the real robot. It is a note to themselves, not
 * progress the coach reports on, so it lives in this browser only.
 */
export function LeanbotCheck({ id, label }: { id: string; label: string }) {
  const key = `cq.leanbot.check.${id}`;
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  });

  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => {
        const next = !on;
        setOn(next);
        try {
          if (next) localStorage.setItem(key, '1');
          else localStorage.removeItem(key);
        } catch {
          // Storage can be blocked; the tick still works for this visit.
        }
      }}
      className={`flex w-full items-center gap-3 rounded-panel border-3 border-dashed border-go p-3 text-left text-bubble font-bold ${
        on ? 'bg-go text-paper' : 'bg-go-soft'
      } ${FOCUS_RING}`}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-key border-3 border-go bg-paper text-go">
        {on ? '✓' : ''}
      </span>
      {label}
    </button>
  );
}
