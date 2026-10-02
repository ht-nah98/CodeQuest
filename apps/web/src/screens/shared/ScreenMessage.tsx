import type { ReactNode } from 'react';
import { Panel } from '../../ui';
import { MangPortrait } from '../play/MangPortrait';

/** Full-screen state (loading, not found, error): Măng and one line, plus an optional action. */
export function ScreenMessage({
  text,
  alert = false,
  children,
}: {
  text: string;
  /** Announce as an alert (errors); loading lines are not. */
  alert?: boolean;
  children?: ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-ground p-6">
      <Panel className="grid max-w-[560px] justify-items-center gap-4 p-8 text-center">
        <MangPortrait pose={alert ? 'talk' : 'idle_1'} height={96} />
        <p role={alert ? 'alert' : undefined} className="m-0 text-bubble font-bold">
          {text}
        </p>
        {children}
      </Panel>
    </main>
  );
}
