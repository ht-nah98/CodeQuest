import { Link } from 'react-router';
import { vi } from '../../i18n/vi';

export function HomeScreen() {
  return (
    <main>
      <h1>{vi.appTitle}</h1>
      <p>{vi.appGreeting}</p>
      <Link to="/play/w01-l03">{vi.play.start}</Link>
      {import.meta.env.DEV && (
        <nav>
          <ul>
            <li>
              <Link to="/dev/ui">/dev/ui</Link>
            </li>
            <li>
              <Link to="/dev/stage">/dev/stage</Link>
            </li>
          </ul>
        </nav>
      )}
    </main>
  );
}
