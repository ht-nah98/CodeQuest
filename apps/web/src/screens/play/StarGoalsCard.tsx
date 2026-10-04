import { useRef } from 'react';
import type { Level } from '@codequest/content-schema';
import { levelVoiceId } from '../../audio';
import { starGoalRows } from '../../features/play/starGoals';
import { vi } from '../../i18n/vi';
import { Button, Dialog, PixelIcon, SpeakButton, Stars } from '../../ui';

const t = vi.play.starGoals;

/**
 * "Mục tiêu ⭐" (P2-21, rewards-economy.md §1): before playing a level with star goals, what
 * earns each star, one line per star count (each adds to the line above), and that a big hint
 * costs stars. Opens on entering the level and from the star button next to the objective.
 */
export function StarGoalsCard({
  level,
  onClose,
}: {
  level: Pick<Level, 'id' | 'mode' | 'starGoals' | 'par' | 'parEdits' | 'mission'>;
  onClose: () => void;
}) {
  const goRef = useRef<HTMLButtonElement>(null);
  const rows = starGoalRows(level);
  return (
    <Dialog
      title={
        <span className="flex items-center gap-2">
          <PixelIcon name="star" scale={3} />
          {t.title}
        </span>
      }
      onClose={onClose}
      initialFocus={goRef}
      data-testid="star-goals-card"
      className="grid w-[min(520px,calc(100vw-32px))] gap-3 px-7 pt-5 pb-6"
    >
      {level.mission !== undefined && (
        <p className="m-0 flex items-center gap-2 font-bold text-ink-soft">
          {level.mission}
          <SpeakButton voiceId={levelVoiceId(level.id, 'mission')} className="ml-auto" />
        </p>
      )}
      <ol className="m-0 grid list-none gap-2 p-0" data-testid="star-goals-rows">
        {rows.map((row) => (
          <li
            key={row.key}
            data-stars={row.stars}
            data-goal={row.key}
            className="flex items-center gap-3 rounded-chip border-3 border-ink bg-white px-3 py-1.5"
          >
            <Stars earned={row.stars} scale={2} className="shrink-0" />
            <span className="font-display text-button font-extrabold">
              {row.stars > 1 && <span aria-hidden="true">+ </span>}
              {row.text}
            </span>
          </li>
        ))}
      </ol>
      <p className="m-0 flex items-center gap-2 text-ink-soft">
        <PixelIcon name="bulb" scale={1} />
        {t.hintNote}
      </p>
      <Button
        ref={goRef}
        variant="go"
        size="md"
        className="justify-self-center"
        data-testid="star-goals-go"
        onClick={onClose}
      >
        {t.go}
      </Button>
    </Dialog>
  );
}
