import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { installDevHook, seedCoachProfileBounded } from './features/profiles';
import './ui/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root element in index.html');

installDevHook();

// The coach profile must exist before the picker decides whether this is a first run
// (bounded: a blocked IndexedDB must not leave the page blank).
void seedCoachProfileBounded().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
