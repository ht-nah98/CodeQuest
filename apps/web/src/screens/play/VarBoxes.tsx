import { useEffect, useRef, useState } from 'react';
import type { VarBox, VarBoxesState } from '../../features/play/varBoxes';
import { vi } from '../../i18n/vi';
import './varBoxes.css';

const t = vi.play.boxes;

/** Quiet time before the end-of-run values are read out (a replay ending on a burst of changes). */
const ANNOUNCE_DEBOUNCE_MS = 400;

/** What the screen reader hears for the panel (one polite live region, see `useAnnouncement`). */
export interface VarBoxesAnnounce {
  /** A replay runs now (or waits for a step). */
  running: boolean;
  /** Step mode: every change is read out as it happens. */
  stepping: boolean;
}

/**
 * The "bảng hộp" (ADR-0022 §6): one wooden crate per box with its name tag, the number it holds
 * and its max ("3/9"). The replay drives it through `var` events: a "+1" floats up and the
 * number pops (`tăng`), the number drops in (`đặt`), the crate shakes red when it is full
 * (BOX_FULL). Reduced motion keeps only the numbers (index.css stops every animation).
 */
export function VarBoxes({
  state,
  announce,
  compact = false,
  className = '',
}: {
  state: VarBoxesState;
  /** When to read changes out (screen readers); without it nothing is announced. */
  announce?: VarBoxesAnnounce;
  /** The small lesson demo: no "Hộp" title, smaller crates. */
  compact?: boolean;
  className?: string;
}) {
  const message = useAnnouncement(state, announce);
  if (state.boxes.length === 0) return null;
  return (
    <div
      role="group"
      aria-label={t.panelLabel}
      data-testid="var-boxes"
      className={`cq-varboxes flex min-w-0 items-center gap-3 ${compact ? 'cq-varboxes-compact' : ''} ${className}`}
    >
      {!compact && (
        <span
          aria-hidden="true"
          className="shrink-0 rounded-kbd bg-block-var px-2 pt-0.5 font-pixel text-pixel-sm whitespace-nowrap text-white uppercase"
        >
          {t.title}
        </span>
      )}
      <ul className="m-0 flex min-w-0 list-none flex-wrap items-center gap-x-4 gap-y-1 p-0">
        {state.boxes.map((box) => (
          <VarCrate key={box.id} box={box} state={state} />
        ))}
      </ul>
      <span className="sr-only" aria-live="polite" data-testid="var-boxes-live">
        {message}
      </span>
    </div>
  );
}

function VarCrate({ box, state }: { box: VarBox; state: VarBoxesState }) {
  const pulse = state.pulse?.id === box.id ? state.pulse : null;
  const full = state.full === box.id;
  const mood = full ? 'full' : (pulse?.kind ?? 'idle');
  const verdict = state.verdict?.id === box.id ? state.verdict : null;
  // A new key restarts the crate's and the number's animation on every change, even a repeat.
  const seq = pulse?.seq ?? 0;
  return (
    <li
      data-testid="var-box"
      data-var={box.id}
      data-value={box.value}
      data-max={box.max}
      data-state={mood}
      {...(verdict !== null && { 'data-verdict': verdict.ok ? 'ok' : 'need' })}
      aria-label={t.box(box.name, box.value, box.max)}
      className="cq-varbox flex items-center"
    >
      <span aria-hidden="true" className="cq-varbox-tag">
        {box.name}
      </span>
      <span key={`crate-${String(seq)}`} aria-hidden="true" className="cq-varbox-crate">
        <span key={`num-${String(seq)}`} className="cq-varbox-num" data-testid="var-box-value">
          {box.value}
        </span>
        <span className="cq-varbox-max">/{box.max}</span>
        {pulse?.kind === 'add' && pulse.delta > 0 && (
          <span key={`plus-${String(seq)}`} className="cq-varbox-plus">
            +{pulse.delta}
          </span>
        )}
        {full && <span className="cq-varbox-full">{t.full}</span>}
        {(mood === 'yes' || mood === 'no') && (
          <span key={`ask-${String(seq)}`} className="cq-varbox-ask">
            {mood === 'yes' ? '✔' : '✘'}
          </span>
        )}
      </span>
      {verdict !== null && (
        <span
          data-testid="var-box-verdict"
          data-ok={verdict.ok}
          data-need={verdict.need}
          className={`cq-varbox-verdict ${verdict.ok ? 'cq-varbox-verdict-ok' : ''}`}
        >
          <span aria-hidden="true">{verdict.ok ? '✔' : t.need(verdict.need)}</span>
          <span className="sr-only">
            {verdict.ok
              ? t.verdictOk(box.name, verdict.need)
              : t.verdictNeed(box.name, verdict.need)}
          </span>
        </span>
      )}
    </li>
  );
}

/** The text of a box change for screen readers (null for a question, which changes nothing). */
function changeText(state: VarBoxesState): string | null {
  const pulse = state.pulse;
  const box = state.boxes.find((candidate) => candidate.id === pulse?.id);
  if (pulse === null || box === undefined) return null;
  if (pulse.kind === 'full') return t.announceFull(box.name);
  if (pulse.kind === 'yes' || pulse.kind === 'no') return null;
  return t.box(box.name, box.value, box.max);
}

/**
 * The live region's text: in step mode each change as it happens; otherwise only a full box
 * (at once) and, once the replay ends, every box's final number (debounced). Nothing before the
 * first change of a run, so a reset or a map switch stays quiet.
 */
function useAnnouncement(state: VarBoxesState, announce: VarBoxesAnnounce | undefined): string {
  const [message, setMessage] = useState('');
  const seq = state.pulse?.seq ?? 0;
  const running = announce?.running ?? false;
  const stepping = announce?.stepping ?? false;
  const enabled = announce !== undefined;
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  });
  // Change by change: step mode, or a full box.
  useEffect(() => {
    if (!enabled || seq === 0) return;
    const current = latest.current;
    if (!stepping && current.pulse?.kind !== 'full') return;
    const text = changeText(current);
    if (text !== null) setMessage(text);
  }, [enabled, seq, stepping]);
  // The end of a replay: every box's final number, after a quiet moment.
  const wasRunning = useRef(running);
  useEffect(() => {
    const ended = wasRunning.current && !running;
    wasRunning.current = running;
    if (!enabled || !ended || stepping) return;
    const current = latest.current;
    if (current.pulse === null || current.full !== null) return;
    const timer = setTimeout(() => {
      setMessage(t.announceEnd(current.boxes.map((box) => t.box(box.name, box.value, box.max))));
    }, ANNOUNCE_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [enabled, running, stepping]);
  return message;
}
