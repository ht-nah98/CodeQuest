import { useEffect, useRef, useState } from 'react';
import { useCurrentProfile } from '../features/profiles';
import { vi } from '../i18n/vi';
import { Button, Dialog } from '../ui';
import { MangPortrait } from '../screens/play/MangPortrait';

// "Nhắc nghỉ 25 phút" (phase-1.md P1-10, ui-copy-guide.md §4): after 25 minutes of play time
// with the tab visible, Măng asks the child to stand up and stretch. Counting restarts after
// the reminder and when another child signs in. Wall-clock time is fine here (UI, not simulation).
export const BREAK_AFTER_MS = 25 * 60 * 1000;
const TICK_MS = 15 * 1000;
/** A longer gap between ticks means the laptop slept: that was a break, not play. */
const MAX_TICK_GAP_MS = 60 * 1000;

const playedKey = (profileId: string) => `cq.played:${profileId}`;

/** Play time so far in this tab for this child: kept across reloads (sessionStorage). */
function readPlayed(profileId: string): number {
  try {
    const value = Number(sessionStorage.getItem(playedKey(profileId)));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writePlayed(profileId: string, ms: number): void {
  try {
    sessionStorage.setItem(playedKey(profileId), String(Math.round(ms)));
  } catch {
    // Blocked storage: the count only lives until the next reload.
  }
}

export function BreakReminder() {
  const { profile } = useCurrentProfile();
  const profileId = profile?.id ?? null;
  // Tagged with the child it is for: a reminder never carries over to the next child.
  const [dueFor, setDueFor] = useState<string | null>(null);
  const due = dueFor !== null && dueFor === profileId;
  const resumeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (profileId === null || due) return;
    let played = readPlayed(profileId);
    let last = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now();
      const gap = now - last;
      last = now;
      if (document.visibilityState !== 'visible' || gap > MAX_TICK_GAP_MS) return;
      played += gap;
      writePlayed(profileId, played);
      if (played >= BREAK_AFTER_MS) setDueFor(profileId);
    }, TICK_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [profileId, due]);

  if (!due) return null;
  return (
    <Dialog
      title={vi.breakReminder.title}
      initialFocus={resumeRef}
      data-testid="break-reminder"
      className="grid w-[480px] justify-items-center gap-4 px-8 pt-6 pb-8 text-center"
    >
      <MangPortrait pose="cheer" height={128} />
      <p className="m-0 text-bubble font-bold">{vi.breakReminder.body}</p>
      <Button
        ref={resumeRef}
        variant="go"
        size="md"
        onClick={() => {
          writePlayed(dueFor, 0);
          setDueFor(null);
        }}
      >
        {vi.breakReminder.resume}
      </Button>
    </Dialog>
  );
}
