import { Component, type ReactNode } from 'react';
import { audio } from '../audio/audio';
import { vi } from '../i18n/vi';
import { Button, Panel, SpeakButton } from '../ui';
import { uiVoiceId } from '../audio/voiceIds';

interface Props {
  children: ReactNode;
}
interface State {
  failed: boolean;
}

/**
 * Route-level safety net: a render error shows Măng's friendly line instead of a blank page.
 * Nothing is logged or sent anywhere (security-privacy.md); React itself reports it in dev.
 * A class component because React has no hook for error boundaries (the one exception to
 * coding-standards.md §4).
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  // The screens that played music or a voice line are gone: silence them too.
  override componentDidCatch(): void {
    audio.stopAll();
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="grid h-screen place-items-center bg-ground p-6">
        <Panel className="grid justify-items-center gap-4 p-8">
          <div className="flex items-center gap-3">
            <p role="alert" className="m-0 text-bubble font-bold">
              {vi.crash.message}
            </p>
            <SpeakButton voiceId={uiVoiceId('crash.message')} />
          </div>
          <Button
            variant="go"
            onClick={() => {
              window.location.reload();
            }}
          >
            {vi.crash.reload}
          </Button>
        </Panel>
      </main>
    );
  }
}
