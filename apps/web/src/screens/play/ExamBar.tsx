import { useState } from 'react';
import { examBest, examFinished, type ExamScoreboard, parseSeed } from '../../features/play/exam';
import { vi } from '../../i18n/vi';
import { Button, PixelIcon } from '../../ui';
import { FOCUS_RING } from '../../ui/focusRing';

const t = vi.play.exam;

export interface ExamBarProps {
  board: ExamScoreboard;
  /** A run is replaying: its slot shows "…" until the replay ends, and the đề cannot change. */
  running: boolean;
  /** The slot of the run replaying now, shown as "…" (null: the run does not count). */
  pending: number | null;
  onNewExam: () => void;
  /** The coach typed a đề number (already checked: 1–9999). */
  onSeed: (seed: number) => void;
  onRestart: () => void;
}

/**
 * Mock exam bar (P3-08): the đề number (editable, so the coach can replay "Đề số 1234"), "Đề mới",
 * and a stadium scoreboard: one LED slot per run and the best run, which is what counts.
 */
export function ExamBar({ board, running, pending, onNewExam, onSeed, onRestart }: ExamBarProps) {
  // What the input shows: typed text for the đề on the board; a new đề shows its own number.
  const [typed, setTyped] = useState({ seed: board.seed, text: String(board.seed) });
  const draft = typed.seed === board.seed ? typed.text : String(board.seed);
  const setDraft = (text: string) => {
    setTyped({ seed: board.seed, text });
  };
  const commit = () => {
    const seed = parseSeed(draft);
    if (seed === null || seed === board.seed) setDraft(String(board.seed));
    else onSeed(seed);
  };
  const finished = examFinished(board);
  const best = examBest(board);
  const shownBest = finished && !running ? best : null;

  return (
    <div
      role="group"
      aria-label={t.boardLabel}
      data-testid="exam-bar"
      data-seed={board.seed}
      data-runs={board.points.join(',')}
      data-best={shownBest ?? ''}
      className="flex min-h-16 flex-wrap items-center gap-x-3 gap-y-2 border-t-3 border-ink bg-paper px-3 py-2"
    >
      <label className="flex items-center gap-1.5 rounded-chip border-3 border-ink bg-paper-2 py-0.5 pr-1 pl-2.5 shadow-key">
        <span className="font-pixel text-pixel-sm whitespace-nowrap text-ink-soft uppercase">
          {t.seedLabel}
        </span>
        <input
          value={draft}
          inputMode="numeric"
          maxLength={4}
          disabled={running}
          aria-label={t.seedInput}
          title={t.seedInput}
          data-testid="exam-seed"
          onChange={(event) => {
            setDraft(event.target.value.replace(/\D/g, ''));
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit();
            if (event.key === 'Escape') setDraft(String(board.seed));
          }}
          className={`w-16 rounded-kbd border-2 border-ink bg-white px-1 text-center font-pixel text-hud leading-none text-ink ${FOCUS_RING}`}
        />
      </label>
      <Button size="sm" icon="↻" disabled={running} data-testid="exam-new" onClick={onNewExam}>
        {t.newExam}
      </Button>

      <ol
        aria-label={t.boardLabel}
        className="m-0 ml-auto flex list-none items-stretch gap-1 rounded-chip border-3 border-ink bg-ink p-1 shadow-key"
      >
        {Array.from({ length: board.runs }, (_, index) => {
          const points = board.points[index];
          const value = index === pending ? '…' : points === undefined ? t.empty : String(points);
          const isBest = finished && !running && points !== undefined && points === best;
          return (
            <li
              key={index}
              data-testid={`exam-run-${String(index + 1)}`}
              className={`flex min-w-[78px] flex-col items-center rounded-kbd px-2 pt-0.5 ${isBest ? 'bg-brand-deep' : 'bg-white/10'}`}
            >
              <span className="font-display text-[13px] leading-tight font-extrabold tracking-wide text-brand-soft uppercase">
                {t.run(index + 1)}
              </span>
              <span
                className={`font-pixel text-hud leading-none ${points === undefined ? 'text-brand' : 'text-coin'}`}
              >
                {value}
              </span>
            </li>
          );
        })}
        <li
          data-testid="exam-best"
          className={`flex min-w-[96px] flex-col items-center rounded-kbd px-2 pt-0.5 ${shownBest !== null ? 'bg-coin' : 'bg-white/10'}`}
        >
          <span
            className={`flex items-center gap-1 font-display text-[13px] leading-tight font-extrabold tracking-wide uppercase ${shownBest !== null ? 'text-ink' : 'text-brand-soft'}`}
          >
            <PixelIcon name="crown" scale={1} />
            {t.best}
          </span>
          <span
            className={`font-pixel text-hud leading-none ${shownBest !== null ? 'text-ink' : 'text-brand'}`}
          >
            {shownBest === null ? t.empty : String(shownBest)}
          </span>
        </li>
      </ol>
      {finished && !running && (
        <Button size="sm" variant="coin" icon="↺" data-testid="exam-restart" onClick={onRestart}>
          {t.restart}
        </Button>
      )}
    </div>
  );
}
