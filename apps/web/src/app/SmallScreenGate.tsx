import { type ReactNode, useSyncExternalStore } from 'react';
import { vi } from '../i18n/vi';
import { uiVoiceId } from '../audio/voiceIds';
import { Panel, SpeakButton } from '../ui';
import { MangPortrait } from '../screens/play/MangPortrait';

// ADR-0011: laptop-first, minimum 1280×720. The check is on the *screen* (a 1280×720 laptop
// shows a ~1280×600 page once the browser bars are drawn), plus a floor on the window itself
// for a laptop whose browser window was made tiny.
const MIN_SCREEN = { width: 1280, height: 720 };
const MIN_WINDOW = { width: 1000, height: 520 };

interface Size {
  width: number;
  height: number;
}

/** True below 1280×720 of screen, or below 1000×520 of window (boundaries are allowed). */
export function isTooSmall(screen: Size, window: Size): boolean {
  return (
    screen.width < MIN_SCREEN.width ||
    screen.height < MIN_SCREEN.height ||
    window.width < MIN_WINDOW.width ||
    window.height < MIN_WINDOW.height
  );
}

function currentlyTooSmall(): boolean {
  return isTooSmall(window.screen, { width: window.innerWidth, height: window.innerHeight });
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('resize', onChange);
  return () => {
    window.removeEventListener('resize', onChange);
  };
}

/**
 * "Màn hình nhỏ quá, con mở trên laptop nhé" over a cramped app. The app stays mounted under
 * the notice, so a window resized for a moment does not lose the child's level or workspace.
 */
export function SmallScreenGate({ children }: { children: ReactNode }) {
  const small = useSyncExternalStore(subscribe, currentlyTooSmall, () => false);
  return (
    <>
      <div inert={small} className="contents">
        {children}
      </div>
      {small && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="small-screen-title"
          className="fixed inset-0 z-[100] grid place-items-center bg-ground p-4"
          data-testid="small-screen"
        >
          <Panel className="grid max-w-[420px] justify-items-center gap-3 p-6 text-center">
            <MangPortrait pose="talk" height={96} />
            <h1 id="small-screen-title" className="m-0 text-title">
              {vi.smallScreen.title}
            </h1>
            <div className="flex items-center gap-3">
              <p className="m-0 text-bubble font-bold">{vi.smallScreen.body}</p>
              <SpeakButton voiceId={uiVoiceId('smallScreen.body')} />
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
