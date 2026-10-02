import { useNavigate } from 'react-router';
import { vi } from '../../i18n/vi';
import { Button, Panel } from '../../ui';
import { RestorePanel } from './BackupPanels';

/**
 * "/restore": restoring a backup before any profile exists on this laptop (a new or wiped
 * laptop), so the coach does not have to create a throw-away profile to reach Cài đặt.
 */
export default function RestoreScreen() {
  const navigate = useNavigate();
  return (
    <main className="cq-sky grid min-h-screen place-items-center p-6">
      <Panel
        as="section"
        aria-labelledby="restore-screen-title"
        className="grid w-[min(560px,100%)] gap-5 p-8"
      >
        <h1 id="restore-screen-title" className="m-0 text-title">
          {vi.profiles.restore}
        </h1>
        <RestorePanel />
        <Button icon="←" className="justify-self-start" onClick={() => void navigate('/')}>
          {vi.topBar.back}
        </Button>
      </Panel>
    </main>
  );
}
